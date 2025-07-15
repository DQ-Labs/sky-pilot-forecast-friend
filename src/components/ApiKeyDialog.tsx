import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setApiKey } from "@/services/weatherService";

interface ApiKeyDialogProps {
  open: boolean;
  onApiKeySet: () => void;
}

export const ApiKeyDialog = ({ open, onApiKeySet }: ApiKeyDialogProps) => {
  const [apiKey, setApiKeyValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      onApiKeySet();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WeatherAPI Key Required</DialogTitle>
          <DialogDescription>
            Please enter your WeatherAPI key to get real weather data. 
            You can get a free API key at{" "}
            <a 
              href="https://www.weatherapi.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              weatherapi.com
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              placeholder="Enter your WeatherAPI key"
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full">
            Save API Key
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};