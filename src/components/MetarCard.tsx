import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Wind, Eye, Cloud, Clock } from "lucide-react";
import { Airport, MetarData } from "@/services/airportService";
import { parseMetarForRCFlying, formatMetarTime } from "@/services/metarParser";

interface MetarCardProps {
  airport: Airport;
  metar: MetarData | null;
  isLoading?: boolean;
}

const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'good':
      return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'caution':
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    case 'poor':
      return 'bg-red-500/20 text-red-700 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

const getFlightCategoryColor = (category: string) => {
  switch (category) {
    case 'VFR':
      return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'MVFR':
      return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'IFR':
      return 'bg-red-500/20 text-red-700 border-red-500/30';
    case 'LIFR':
      return 'bg-red-600/20 text-red-800 border-red-600/30';
    default:
      return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

export const MetarCard = ({ airport, metar, isLoading = false }: MetarCardProps) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            {airport.icao} - {airport.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metar) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            {airport.icao} - {airport.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">METAR data not available</p>
          <p className="text-sm text-muted-foreground mt-1">
            {airport.distance && `${airport.distance.toFixed(1)} miles away`}
          </p>
        </CardContent>
      </Card>
    );
  }

  const conditions = parseMetarForRCFlying(metar);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            <span className="text-lg">{airport.icao}</span>
          </div>
          <div className="flex gap-2">
            <Badge className={getFlightCategoryColor(conditions.flightCategory)}>
              {conditions.flightCategory}
            </Badge>
            <Badge className={getConditionColor(conditions.overallCondition)}>
              {conditions.overallCondition.toUpperCase()}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{airport.name}</p>
        {airport.distance && (
          <p className="text-xs text-muted-foreground">{airport.distance.toFixed(1)} miles away</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>Observed: {formatMetarTime(metar.observed)}</span>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4" />
          <span className="font-medium">Wind:</span>
          <span>
            {metar.wind.degrees}° at {metar.wind.speed_kts} kts
            {metar.wind.gust_kts && ` (gusts ${metar.wind.gust_kts} kts)`}
          </span>
          <Badge className={getConditionColor(conditions.windCondition)} variant="outline">
            {conditions.windCondition}
          </Badge>
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">Visibility:</span>
          <span>{metar.visibility.miles} miles</span>
          <Badge className={getConditionColor(conditions.visibilityCondition)} variant="outline">
            {conditions.visibilityCondition}
          </Badge>
        </div>

        {/* Clouds */}
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          <span className="font-medium">Clouds:</span>
          <span>
            {metar.clouds.length > 0 
              ? metar.clouds.map(cloud => `${cloud.code} ${cloud.feet}ft`).join(', ')
              : 'Clear'
            }
          </span>
          <Badge className={getConditionColor(conditions.cloudCondition)} variant="outline">
            {conditions.cloudCondition}
          </Badge>
        </div>

        {/* Temperature & Dewpoint */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Temperature:</span> {metar.temperature.fahrenheit}°F
          </div>
          <div>
            <span className="font-medium">Dewpoint:</span> {metar.dewpoint.fahrenheit}°F
          </div>
        </div>

        {/* RC Flying Recommendation */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm mb-2">RC Flying Conditions:</h4>
          <p className="text-sm text-muted-foreground">{conditions.rcFlightRecommendation}</p>
        </div>

        {/* Raw METAR */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Show Raw METAR
          </summary>
          <code className="block mt-2 p-2 bg-muted rounded text-xs break-all">
            {metar.raw_text}
          </code>
        </details>
      </CardContent>
    </Card>
  );
};