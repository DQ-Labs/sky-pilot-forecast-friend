import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationHeaderProps {
  location: string;
  lastUpdated: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const LocationHeader = ({ location, lastUpdated, onRefresh, isLoading }: LocationHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-6 bg-gradient-sky rounded-lg shadow-md">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white/20 rounded-full">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">RC Flying Weather</h1>
          <p className="text-white/80 text-sm">{location}</p>
        </div>
      </div>
      
      <div className="text-right">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <p className="text-white/70 text-xs mt-1">
          Updated {lastUpdated}
        </p>
      </div>
    </div>
  );
};