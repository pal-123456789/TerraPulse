import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface LocationSearchBarProps {
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
}

export const LocationSearchBar = ({ onLocationSelect }: LocationSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const searchLocation = async () => {
    if (query.length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    setIsSearching(true);
    setIsOpen(true);

    try {
      // Using OpenWeatherMap Geocoding API
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=895284fb2d2c50a520ea537456963d9c`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data);
      
      if (data.length === 0) {
        toast.info("No locations found. Try a different search term.");
      }
    } catch (error) {
      console.error("Location search error:", error);
      toast.error("Failed to search location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  const handleSelectLocation = (location: LocationResult) => {
    const displayName = location.state 
      ? `${location.name}, ${location.state}, ${location.country}`
      : `${location.name}, ${location.country}`;
    
    onLocationSelect({
      lat: location.lat,
      lon: location.lon,
      name: displayName
    });
    
    setQuery(displayName);
    setIsOpen(false);
    toast.success(`Location selected: ${displayName}`);
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for any location (city, country, landmark)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 glass-panel border-primary/20 focus:border-primary"
          />
        </div>
        <Button
          onClick={searchLocation}
          disabled={isSearching}
          className="bg-primary hover:bg-primary/90"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full glass-panel border-primary/20 z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {results.map((result, index) => (
              <button
                key={`${result.lat}-${result.lon}-${index}`}
                className="w-full p-3 rounded-lg hover:bg-card/50 transition-colors flex items-center gap-3 text-left"
                onClick={() => handleSelectLocation(result)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{result.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.state ? `${result.state}, ` : ''}{result.country}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {result.lat.toFixed(2)}, {result.lon.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
