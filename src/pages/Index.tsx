import { useState, useEffect } from "react";
import { WeatherCard } from "@/components/WeatherCard";
import { ConditionSummary } from "@/components/ConditionSummary";
import { LocationHeader } from "@/components/LocationHeader";
import { AviationWeather } from "@/components/AviationWeather";
import { 
  getCurrentLocation, 
  getWeatherForecast, 
  analyzeFlightConditions,
  type WeatherData,
  type LocationData 
} from "@/services/weatherService";
import { getLocalDateString } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CloudSun, Plane } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setIsLoading(true);
      
      // Get current location
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      // Get weather forecast
      const weatherData = await getWeatherForecast(currentLocation);
      setForecast(weatherData);
      
      setLastUpdated(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      toast({
        title: "Weather Updated",
        description: "Flight conditions have been refreshed.",
      });
      
    } catch (error) {
      toast({
        title: "Weather Error",
        description: "Unable to load weather data. Please check your connection.",
        variant: "destructive",
      });
      
      console.error('Weather data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-semibold">Loading Weather Data</h2>
          <p className="text-muted-foreground">Getting your location and flight conditions...</p>
        </div>
      </div>
    );
  }

  const analysis = forecast.length > 0 ? analyzeFlightConditions(forecast) : {
    overallCondition: 'poor' as const,
    recommendations: ['Unable to load weather data']
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        {location && (
          <LocationHeader
            location={`${location.city}, ${location.country}`}
            lastUpdated={lastUpdated}
            onRefresh={loadWeatherData}
            isLoading={isLoading}
          />
        )}

        {/* Condition Summary */}
        <div className="mt-6">
          <ConditionSummary
            overallCondition={analysis.overallCondition}
            recommendations={analysis.recommendations}
          />
        </div>

        {/* Weather Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="forecast" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="forecast" className="flex items-center gap-2">
                <CloudSun className="h-4 w-4" />
                General Weather
              </TabsTrigger>
              <TabsTrigger value="aviation" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Aviation Weather
              </TabsTrigger>
            </TabsList>

            <TabsContent value="forecast" className="space-y-6 mt-6">
              {/* 2-Day Forecast */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <CloudSun className="h-6 w-6" />
                  Weather Forecast
                </h2>
                <div className="flex flex-col lg:flex-row gap-4">
                  {forecast.map((weather, index) => {
                    const today = getLocalDateString();
                    const isToday = weather.date === today;
                    return (
                      <div 
                        key={weather.date}
                        className={`${isToday ? 'lg:flex-1' : 'lg:w-80'} transition-all duration-300`}
                      >
                        <WeatherCard
                          weather={weather}
                          isToday={isToday}
                          variant={isToday ? 'primary' : 'secondary'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flying Tips */}
              <div className="p-6 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-foreground">RC Flying Tips</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Wind Speed:</strong> Ideal range is 0-10 mph for most aircraft
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Visibility:</strong> Always maintain visual contact with your aircraft
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Weather:</strong> Avoid flying in rain, snow, or severe weather
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Safety:</strong> Check local regulations and airspace restrictions
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="aviation" className="mt-6">
              {location && <AviationWeather location={location} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;