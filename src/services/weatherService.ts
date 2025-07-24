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

export const determineCondition = (windSpeed: number, precipitation: number, cloudCeiling: number): 'good' | 'caution' | 'poor' => {
  if (windSpeed > 15 || precipitation > 50 || cloudCeiling < 400) {
    return 'poor';
  } else if (windSpeed > 10 || precipitation > 20 || cloudCeiling < 800) {
    return 'caution';
  }
  return 'good';
};

// Calculate approximate cloud ceiling from cloud coverage
export const calculateCloudCeiling = (cloudCover: number): number => {
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
  const { getLocalDateString } = await import('@/lib/utils');
  const localToday = getLocalDateString();
  
  console.log('Local today:', localToday);
  console.log('Forecast days from API:', data.forecast.forecastday.map(d => d.date));
  
  // Add today's weather using current data
  const todayCloudCeiling = calculateCloudCeiling(data.current.cloud);
  const todayForecastDay = data.forecast.forecastday.find(day => day.date === localToday);
  
  forecast.push({
    date: localToday,
    temp: Math.round(data.current.temp_f),
    windSpeed: Math.round(data.current.wind_mph),
    windDirection: data.current.wind_degree,
    windGustSpeed: data.current.gust_mph ? Math.round(data.current.gust_mph) : undefined,
    cloudCeiling: todayCloudCeiling,
    humidity: data.current.humidity,
    visibility: data.current.vis_miles,
    precipitation: todayForecastDay?.day.daily_chance_of_rain || 0,
    description: data.current.condition.text,
    condition: determineCondition(data.current.wind_mph, todayForecastDay?.day.daily_chance_of_rain || 0, todayCloudCeiling)
  });
  
  console.log('Added today:', localToday);
  
  // Find tomorrow's forecast (skip today since we already processed it)
  const today = new Date(localToday);
  const tomorrowDay = data.forecast.forecastday.find(day => {
    const dayDate = new Date(day.date);
    return dayDate > today;
  });
  
  if (tomorrowDay) {
    console.log('Adding tomorrow:', tomorrowDay.date);
    
    const avgCloudCover = tomorrowDay.hour.reduce((sum, hour) => sum + hour.cloud, 0) / tomorrowDay.hour.length;
    const dayCloudCeiling = calculateCloudCeiling(avgCloudCover);
    
    forecast.push({
      date: tomorrowDay.date,
      temp: Math.round(tomorrowDay.day.maxtemp_f),
      windSpeed: Math.round(tomorrowDay.day.maxwind_mph),
      windDirection: 0, // WeatherAPI doesn't provide forecast wind direction
      cloudCeiling: dayCloudCeiling,
      humidity: tomorrowDay.day.avghumidity,
      visibility: 10, // Default visibility for forecast days
      precipitation: tomorrowDay.day.daily_chance_of_rain,
      description: tomorrowDay.day.condition.text,
      condition: determineCondition(tomorrowDay.day.maxwind_mph, tomorrowDay.day.daily_chance_of_rain, dayCloudCeiling)
    });
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