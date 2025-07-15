export interface WeatherData {
  date: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  visibility: number;
  precipitation: number;
  description: string;
  condition: 'good' | 'caution' | 'poor';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// WeatherAPI response interfaces
interface WeatherAPIResponse {
  current: {
    temp_f: number;
    wind_mph: number;
    wind_degree: number;
    humidity: number;
    vis_miles: number;
    condition: {
      text: string;
    };
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_f: number;
        avghumidity: number;
        maxwind_mph: number;
        daily_chance_of_rain: number;
        condition: {
          text: string;
        };
      };
    }>;
  };
  location: {
    name: string;
    country: string;
  };
}

const getApiKey = (): string => {
  const apiKey = localStorage.getItem('weatherapi_key');
  if (!apiKey) {
    throw new Error('WeatherAPI key not found. Please set your API key first.');
  }
  return apiKey;
};

export const setApiKey = (apiKey: string): void => {
  localStorage.setItem('weatherapi_key', apiKey);
};

export const hasApiKey = (): boolean => {
  return !!localStorage.getItem('weatherapi_key');
};

const determineCondition = (windSpeed: number, precipitation: number): 'good' | 'caution' | 'poor' => {
  if (windSpeed > 15 || precipitation > 50) {
    return 'poor';
  } else if (windSpeed > 10 || precipitation > 20) {
    return 'caution';
  }
  return 'good';
};

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const apiKey = getApiKey();
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=no`
          );
          
          if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          resolve({
            latitude,
            longitude,
            city: data.location.name,
            country: data.location.country
          });
        } catch (error) {
          // Fallback to basic location if weather API fails
          resolve({
            latitude,
            longitude,
            city: 'Your Location',
            country: 'Unknown'
          });
        }
      },
      (error) => {
        reject(new Error('Unable to retrieve your location.'));
      }
    );
  });
};

export const getWeatherForecast = async (location: LocationData): Promise<WeatherData[]> => {
  const apiKey = getApiKey();
  
  const response = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location.latitude},${location.longitude}&days=3&aqi=no&alerts=no`
  );
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  
  const data: WeatherAPIResponse = await response.json();
  
  const forecast: WeatherData[] = [];
  
  // Current day (today)
  const today = new Date().toISOString().split('T')[0];
  forecast.push({
    date: today,
    temp: Math.round(data.current.temp_f),
    windSpeed: Math.round(data.current.wind_mph),
    windDirection: data.current.wind_degree,
    humidity: data.current.humidity,
    visibility: data.current.vis_miles,
    precipitation: data.forecast.forecastday[0]?.day.daily_chance_of_rain || 0,
    description: data.current.condition.text,
    condition: determineCondition(data.current.wind_mph, data.forecast.forecastday[0]?.day.daily_chance_of_rain || 0)
  });
  
  // Next 2 days from forecast
  for (let i = 1; i < Math.min(3, data.forecast.forecastday.length); i++) {
    const day = data.forecast.forecastday[i];
    forecast.push({
      date: day.date,
      temp: Math.round(day.day.maxtemp_f),
      windSpeed: Math.round(day.day.maxwind_mph),
      windDirection: 0, // WeatherAPI doesn't provide forecast wind direction
      humidity: day.day.avghumidity,
      visibility: 10, // Default visibility for forecast days
      precipitation: day.day.daily_chance_of_rain,
      description: day.day.condition.text,
      condition: determineCondition(day.day.maxwind_mph, day.day.daily_chance_of_rain)
    });
  }
  
  return forecast;
};

export const analyzeFlightConditions = (forecast: WeatherData[]) => {
  const todayWeather = forecast[0];
  
  let overallCondition: 'good' | 'caution' | 'poor' = 'good';
  const recommendations: string[] = [];
  
  // Analyze wind conditions
  if (todayWeather.windSpeed > 15) {
    overallCondition = 'poor';
    recommendations.push('Wind speed too high for safe RC flying');
  } else if (todayWeather.windSpeed > 10) {
    overallCondition = 'caution';
    recommendations.push('High winds - consider larger, heavier aircraft');
  } else if (todayWeather.windSpeed < 5) {
    recommendations.push('Light winds - perfect for beginners and small aircraft');
  }
  
  // Analyze precipitation
  if (todayWeather.precipitation > 50) {
    overallCondition = 'poor';
    recommendations.push('High chance of rain - avoid flying');
  } else if (todayWeather.precipitation > 20) {
    if (overallCondition === 'good') overallCondition = 'caution';
    recommendations.push('Possible precipitation - monitor weather closely');
  }
  
  // Analyze visibility
  if (todayWeather.visibility < 5) {
    if (overallCondition === 'good') overallCondition = 'caution';
    recommendations.push('Low visibility - maintain close visual contact');
  }
  
  // General recommendations
  if (overallCondition === 'good') {
    recommendations.push('Great conditions for all skill levels');
    recommendations.push('Consider trying new maneuvers or aircraft');
  }
  
  return {
    overallCondition,
    recommendations
  };
};