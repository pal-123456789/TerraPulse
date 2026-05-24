import { useState, useEffect } from "react";
import { Search, MapPin, Clock, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'location' | 'anomaly' | 'prediction';
  title: string;
  subtitle: string;
  icon: any;
}

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search data
  const mockData: SearchResult[] = [
    { id: '1', type: 'location', title: 'Pacific Ocean', subtitle: '145 active monitors', icon: MapPin },
    { id: '2', type: 'location', title: 'Amazon Rainforest', subtitle: '89 active monitors', icon: MapPin },
    { id: '3', type: 'anomaly', title: 'Seismic Activity Alert', subtitle: 'Detected 2 hours ago', icon: TrendingUp },
    { id: '4', type: 'prediction', title: 'Hurricane Forecast', subtitle: 'Atlantic Region', icon: Clock },
    { id: '5', type: 'location', title: 'Arctic Circle', subtitle: '67 active monitors', icon: MapPin },
    { id: '6', type: 'anomaly', title: 'Temperature Anomaly', subtitle: 'Europe - Detected 5 hours ago', icon: TrendingUp },
  ];

  useEffect(() => {
    if (query.length > 1) {
      const filtered = mockData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'location': return 'text-primary';
      case 'anomaly': return 'text-yellow-400';
      case 'prediction': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search locations, anomalies, or predictions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 py-6 glass-panel border-primary/20 focus:border-primary"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full glass-panel border-primary/20 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {results.map((result) => {
              const Icon = result.icon;
              return (
                <button
                  key={result.id}
                  className="w-full p-3 rounded-lg hover:bg-card/50 transition-colors flex items-center gap-3 text-left"
                  onClick={() => {
                    setQuery(result.title);
                    setIsOpen(false);
                  }}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    result.type === 'location' && "bg-primary/20",
                    result.type === 'anomaly' && "bg-yellow-500/20",
                    result.type === 'prediction' && "bg-purple-500/20"
                  )}>
                    <Icon className={cn("w-5 h-5", getTypeColor(result.type))} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{result.title}</p>
                    <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-card/50 text-muted-foreground capitalize">
                    {result.type}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {isOpen && results.length === 0 && query.length > 1 && (
        <Card className="absolute top-full mt-2 w-full glass-panel border-primary/20 z-50 p-6 text-center">
          <p className="text-muted-foreground">No results found for "{query}"</p>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;