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

// Mock weather data for demonstration
const generateMockWeather = (date: Date, index: number): WeatherData => {
  const windSpeeds = [8, 12, 18]; // Different wind speeds for variety
  const windSpeed = windSpeeds[index] || 8;
  
  const temp = 68 + Math.random() * 15; // 68-83°F
  const humidity = 40 + Math.random() * 30; // 40-70%
  const visibility = 8 + Math.random() * 2; // 8-10 miles
  const precipitation = Math.random() * 20; // 0-20%
  
  // Determine flying condition based on wind speed and precipitation
  let condition: 'good' | 'caution' | 'poor' = 'good';
  if (windSpeed > 15 || precipitation > 50) {
    condition = 'poor';
  } else if (windSpeed > 10 || precipitation > 20) {
    condition = 'caution';
  }
  
  const descriptions = ['Clear skies', 'Partly cloudy', 'Overcast', 'Light clouds'];
  
  return {
    date: date.toISOString(),
    temp: Math.round(temp),
    windSpeed: Math.round(windSpeed),
    windDirection: Math.random() * 360,
    humidity: Math.round(humidity),
    visibility: Math.round(visibility * 10) / 10,
    precipitation: Math.round(precipitation),
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    condition
  };
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
        
        // For demo purposes, we'll use a mock location
        // In a real app, you'd use reverse geocoding
        resolve({
          latitude,
          longitude,
          city: 'Your Location',
          country: 'USA'
        });
      },
      (error) => {
        reject(new Error('Unable to retrieve your location.'));
      }
    );
  });
};

export const getWeatherForecast = async (location: LocationData): Promise<WeatherData[]> => {
  // In a real implementation, you would call a weather API like OpenWeatherMap
  // For demo purposes, we'll generate mock data
  
  const forecast: WeatherData[] = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    forecast.push(generateMockWeather(date, i));
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