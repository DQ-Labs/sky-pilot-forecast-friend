import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, RefreshCw } from "lucide-react";
import { LocationData } from "@/services/weatherService";
import { Airport, MetarData, findNearbyAirports, getMultipleMetarData } from "@/services/airportService";
import { MetarCard } from "./MetarCard";
import { useToast } from "@/hooks/use-toast";

interface AviationWeatherProps {
  location: LocationData;
}

export const AviationWeather = ({ location }: AviationWeatherProps) => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [metarData, setMetarData] = useState<Record<string, MetarData | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadAviationData = async () => {
    setIsLoading(true);
    try {
      // Find nearby airports
      const nearbyAirports = findNearbyAirports(location.latitude, location.longitude);
      setAirports(nearbyAirports);

      if (nearbyAirports.length > 0) {
        // Get METAR data for all nearby airports
        const icaoCodes = nearbyAirports.map(airport => airport.icao);
        const metarResults = await getMultipleMetarData(icaoCodes);
        setMetarData(metarResults);

        const successCount = Object.values(metarResults).filter(data => data !== null).length;
        toast({
          title: "Aviation Weather Updated",
          description: `Loaded METAR data for ${successCount} of ${nearbyAirports.length} nearby airports.`,
        });
      } else {
        toast({
          title: "No Nearby Airports",
          description: "No major airports found within 100 miles of your location.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading aviation data:', error);
      toast({
        title: "Error Loading Aviation Data",
        description: "Failed to load METAR data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.latitude && location.longitude) {
      loadAviationData();
    }
  }, [location]);

  const activeAirports = airports.filter(airport => metarData[airport.icao] !== null);
  const inactiveAirports = airports.filter(airport => metarData[airport.icao] === null);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            Aviation Weather (METAR)
          </CardTitle>
          <Button
            onClick={loadAviationData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Official weather reports from nearby airports for precise aviation conditions
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {airports.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            No nearby airports found within 100 miles.
          </p>
        )}

        {isLoading && airports.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Active airports with METAR data */}
        {activeAirports.length > 0 && (
          <div className="space-y-4">
            {activeAirports.map(airport => (
              <MetarCard
                key={airport.icao}
                airport={airport}
                metar={metarData[airport.icao]}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}

        {/* Inactive airports */}
        {inactiveAirports.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Nearby Airports (No Current METAR Data)
            </h3>
            <div className="space-y-2">
              {inactiveAirports.map(airport => (
                <div key={airport.icao} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">{airport.icao}</span>
                    <span className="text-sm text-muted-foreground ml-2">{airport.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {airport.distance?.toFixed(1)} mi
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info about METAR */}
        <div className="border-t pt-4">
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
              About METAR Data
            </summary>
            <div className="text-muted-foreground space-y-2">
              <p>
                METAR (Meteorological Aerodrome Report) provides official aviation weather observations
                from airports, typically updated hourly. This data is more precise than general weather
                forecasts for flying activities.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>VFR:</strong> Visual Flight Rules (best)</div>
                <div><strong>MVFR:</strong> Marginal VFR (caution)</div>
                <div><strong>IFR:</strong> Instrument Flight Rules (poor)</div>
                <div><strong>LIFR:</strong> Low IFR (very poor)</div>
              </div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};