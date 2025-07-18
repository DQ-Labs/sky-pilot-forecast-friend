export interface WeatherData {
  date: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  windGustSpeed?: number;
  cloudCeiling: number; // in feet
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
    gust_mph?: number;
    cloud: number; // cloud cover percentage
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
      hour: Array<{
        cloud: number;
      }>;
    }>;
  };
  location: {
    name: string;
    country: string;
  };
}

// Call weather API through Supabase Edge Function
const callWeatherAPI = async (endpoint: string, params: Record<string, any>) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('weather-api', {
    body: { endpoint, params }
  });

  if (error) {
    console.error('Weather API function error:', error);
    throw new Error(`Weather API error: ${error.message}`);
  }

  return data;
};

const determineCondition = (windSpeed: number, precipitation: number, cloudCeiling: number): 'good' | 'caution' | 'poor' => {
  if (windSpeed > 15 || precipitation > 50 || cloudCeiling < 400) {
    return 'poor';
  } else if (windSpeed > 10 || precipitation > 20 || cloudCeiling < 800) {
    return 'caution';
  }
  return 'good';
};

// Calculate approximate cloud ceiling from cloud coverage
const calculateCloudCeiling = (cloudCover: number): number => {
  // Rough approximation: higher cloud cover = lower ceiling
  if (cloudCover >= 90) return 500;  // Very low ceiling
  if (cloudCover >= 70) return 1000; // Low ceiling
  if (cloudCover >= 50) return 2000; // Medium ceiling
  if (cloudCover >= 20) return 4000; // High ceiling
  return 8000; // Clear skies - very high ceiling
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
          const data = await callWeatherAPI('current.json', {
            q: `${latitude},${longitude}`,
            aqi: 'no'
          });
          
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
  const data: WeatherAPIResponse = await callWeatherAPI('forecast.json', {
    q: `${location.latitude},${location.longitude}`,
    days: 3,
    aqi: 'no',
    alerts: 'no'
  });
  
  const forecast: WeatherData[] = [];
  const localToday = new Date().getFullYear() + '-' + 
    String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
    String(new Date().getDate()).padStart(2, '0');
  
  console.log('Local today:', localToday);
  console.log('Forecast days from API:', data.forecast.forecastday.map(d => d.date));
  
  // Filter out past days and only keep today + tomorrow
  const futureDays = data.forecast.forecastday.filter(day => day.date >= localToday);
  
  console.log('Future days (including today):', futureDays.map(d => d.date));
  
  // Process only the next 2 days starting from today
  for (let i = 0; i < Math.min(2, futureDays.length); i++) {
    const day = futureDays[i];
    const isToday = day.date === localToday;
    
    console.log(`Processing day ${i}: ${day.date}, isToday: ${isToday}`);
    
    if (isToday) {
      // Use current weather data for today
      const todayCloudCeiling = calculateCloudCeiling(data.current.cloud);
      
      forecast.push({
        date: day.date,
        temp: Math.round(data.current.temp_f),
        windSpeed: Math.round(data.current.wind_mph),
        windDirection: data.current.wind_degree,
        windGustSpeed: data.current.gust_mph ? Math.round(data.current.gust_mph) : undefined,
        cloudCeiling: todayCloudCeiling,
        humidity: data.current.humidity,
        visibility: data.current.vis_miles,
        precipitation: day.day.daily_chance_of_rain,
        description: data.current.condition.text,
        condition: determineCondition(data.current.wind_mph, day.day.daily_chance_of_rain, todayCloudCeiling)
      });
    } else {
      // Use forecast data for future days
      const avgCloudCover = day.hour.reduce((sum, hour) => sum + hour.cloud, 0) / day.hour.length;
      const dayCloudCeiling = calculateCloudCeiling(avgCloudCover);
      
      forecast.push({
        date: day.date,
        temp: Math.round(day.day.maxtemp_f),
        windSpeed: Math.round(day.day.maxwind_mph),
        windDirection: 0, // WeatherAPI doesn't provide forecast wind direction
        cloudCeiling: dayCloudCeiling,
        humidity: day.day.avghumidity,
        visibility: 10, // Default visibility for forecast days
        precipitation: day.day.daily_chance_of_rain,
        description: day.day.condition.text,
        condition: determineCondition(day.day.maxwind_mph, day.day.daily_chance_of_rain, dayCloudCeiling)
      });
    }
  }
  
  console.log('Final forecast dates:', forecast.map(f => f.date));
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
  
  // Add gust warnings if present
  if (todayWeather.windGustSpeed && todayWeather.windGustSpeed > todayWeather.windSpeed + 5) {
    if (overallCondition === 'good') overallCondition = 'caution';
    recommendations.push(`Gusty conditions - gusts up to ${todayWeather.windGustSpeed} mph`);
  }
  
  // Analyze cloud ceiling
  if (todayWeather.cloudCeiling < 400) {
    overallCondition = 'poor';
    recommendations.push('Very low cloud ceiling - dangerous for RC flying');
  } else if (todayWeather.cloudCeiling < 800) {
    if (overallCondition === 'good') overallCondition = 'caution';
    recommendations.push('Low cloud ceiling - maintain low altitude flying');
  } else if (todayWeather.cloudCeiling > 3000) {
    recommendations.push('High cloud ceiling - excellent for altitude flying');
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