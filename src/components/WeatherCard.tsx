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
  variant?: 'primary' | 'secondary';
}

export const WeatherCard = ({ weather, isToday = false, variant = 'primary' }: WeatherCardProps) => {
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
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    console.log('WeatherCard formatDate:', { dateString, parsedDate: date, isToday });
    
    return isToday ? 'Today' : date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg border-2 ${
      isToday ? 'ring-2 ring-primary/20' : ''
    } ${getConditionColor(weather.condition)} ${
      isPrimary ? 'p-8' : 'p-6'
    }`}>
      <div className={`space-y-${isPrimary ? '6' : '4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isPrimary ? 'text-2xl' : 'text-lg'}`}>
              {formatDate(weather.date)}
            </h3>
            <p className={`text-muted-foreground capitalize ${isPrimary ? 'text-base' : 'text-sm'}`}>
              {weather.description}
            </p>
          </div>
          <div className="text-right">
            <div className={`font-bold ${isPrimary ? 'text-4xl' : 'text-2xl'}`}>
              {weather.temp}°F
            </div>
            <div className={`font-medium ${
              isPrimary ? 'text-base' : 'text-sm'
            } ${getConditionColor(weather.condition).split(' ')[0]}`}>
              {getConditionText(weather.condition)}
            </div>
          </div>
        </div>

        {/* Wind Information */}
        <div className={`bg-primary/5 rounded-lg border border-primary/20 ${isPrimary ? 'p-6' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wind 
                className={`text-primary ${isPrimary ? 'h-8 w-8' : 'h-6 w-6'}`} 
                style={{ transform: `rotate(${weather.windDirection}deg)` }}
              />
              <div>
                <div className={`font-bold text-primary ${isPrimary ? 'text-2xl' : 'text-lg'}`}>
                  {weather.windSpeed} mph
                </div>
                <div className={`text-muted-foreground ${isPrimary ? 'text-sm' : 'text-xs'}`}>
                  Wind Speed
                </div>
              </div>
            </div>
            {weather.windGustSpeed && (
              <div className="text-right">
                <div className={`font-semibold text-orange-600 ${isPrimary ? 'text-lg' : 'text-md'}`}>
                  {weather.windGustSpeed} mph
                </div>
                <div className={`text-muted-foreground ${isPrimary ? 'text-sm' : 'text-xs'}`}>
                  Gusts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather Details */}
        {isPrimary ? (
          // Full details for primary (today) card
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-sky-50 rounded border border-sky-200">
              <Cloud className="h-5 w-5 text-sky-600" />
              <div>
                <div className="text-base font-medium text-sky-800">
                  {weather.cloudCeiling.toLocaleString()} ft
                </div>
                <div className="text-sm text-sky-600">Cloud Ceiling</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <div className="text-base font-medium">{weather.visibility} mi</div>
                <div className="text-sm text-muted-foreground">Visibility</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded">
              <Droplets className="h-5 w-5 text-primary" />
              <div>
                <div className="text-base font-medium">{weather.humidity}%</div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded">
              <Gauge className="h-5 w-5 text-primary" />
              <div>
                <div className="text-base font-medium">{weather.precipitation}%</div>
                <div className="text-sm text-muted-foreground">Rain Chance</div>
              </div>
            </div>
          </div>
        ) : (
          // Compact details for secondary (tomorrow) card
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-sky-600" />
                <span className="text-sm text-sky-800">{weather.cloudCeiling.toLocaleString()} ft</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm">{weather.visibility} mi</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-primary" />
                <span className="text-sm">{weather.humidity}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-sm">{weather.precipitation}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};