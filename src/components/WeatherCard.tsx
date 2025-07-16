import { Card } from "@/components/ui/card";
import { Wind, Droplets, Eye, Cloud, Gauge } from "lucide-react";

interface WeatherData {
  date: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  windGustSpeed?: number;
  cloudCeiling: number;
  humidity: number;
  visibility: number;
  precipitation: number;
  description: string;
  condition: 'good' | 'caution' | 'poor';
}

interface WeatherCardProps {
  weather: WeatherData;
  isToday?: boolean;
}

export const WeatherCard = ({ weather, isToday = false }: WeatherCardProps) => {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'text-condition-good border-condition-good bg-condition-good/10';
      case 'caution': return 'text-condition-caution border-condition-caution bg-condition-caution/10';
      case 'poor': return 'text-condition-poor border-condition-poor bg-condition-poor/10';
      default: return 'text-muted-foreground border-border bg-muted/10';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'good': return 'Good Flying';
      case 'caution': return 'Caution';
      case 'poor': return 'Poor Flying';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isToday ? 'Today' : date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-lg border-2 ${
      isToday ? 'ring-2 ring-primary/20' : ''
    } ${getConditionColor(weather.condition)}`}>
      <div className="space-y-4">
        {/* Header with Prominent Wind Display */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{formatDate(weather.date)}</h3>
            <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{weather.temp}°F</div>
            <div className={`text-sm font-medium ${getConditionColor(weather.condition).split(' ')[0]}`}>
              {getConditionText(weather.condition)}
            </div>
          </div>
        </div>

        {/* Prominent Wind Information */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wind 
                className="h-6 w-6 text-primary" 
                style={{ transform: `rotate(${weather.windDirection}deg)` }}
              />
              <div>
                <div className="text-lg font-bold text-primary">{weather.windSpeed} mph</div>
                <div className="text-sm text-muted-foreground">Wind Speed</div>
              </div>
            </div>
            {weather.windGustSpeed && (
              <div className="text-right">
                <div className="text-md font-semibold text-orange-600">{weather.windGustSpeed} mph</div>
                <div className="text-xs text-muted-foreground">Gusts</div>
              </div>
            )}
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cloud Ceiling - Prominent Display */}
          <div className="flex items-center space-x-2 p-2 bg-sky-50 rounded border border-sky-200">
            <Cloud className="h-4 w-4 text-sky-600" />
            <div>
              <div className="text-sm font-medium text-sky-800">{weather.cloudCeiling.toLocaleString()} ft</div>
              <div className="text-xs text-sky-600">Cloud Ceiling</div>
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{weather.visibility} mi</div>
              <div className="text-xs text-muted-foreground">Visibility</div>
            </div>
          </div>

          {/* Humidity */}
          <div className="flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{weather.humidity}%</div>
              <div className="text-xs text-muted-foreground">Humidity</div>
            </div>
          </div>

          {/* Precipitation */}
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{weather.precipitation}%</div>
              <div className="text-xs text-muted-foreground">Rain Chance</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};