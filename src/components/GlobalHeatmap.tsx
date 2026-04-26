import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Thermometer, Flame, Snowflake } from 'lucide-react';

interface HotSpot {
  id: string;
  lat: number;
  lon: number;
  intensity: number;
  type: 'heat' | 'seismic' | 'weather' | 'anomaly';
  location: string;
}

const GlobalHeatmap = () => {
  const [hotspots, setHotspots] = useState<HotSpot[]>([
    { id: '1', lat: 35.6, lon: 139.7, intensity: 92, type: 'seismic', location: 'Japan' },
    { id: '2', lat: -33.9, lon: 18.4, intensity: 78, type: 'heat', location: 'South Africa' },
    { id: '3', lat: 51.5, lon: -0.1, intensity: 65, type: 'weather', location: 'UK' },
    { id: '4', lat: 40.7, lon: -74.0, intensity: 88, type: 'anomaly', location: 'USA' },
    { id: '5', lat: -34.6, lon: -58.4, intensity: 71, type: 'heat', location: 'Argentina' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHotspots(prev => prev.map(spot => ({
        ...spot,
        intensity: Math.max(50, Math.min(99, spot.intensity + (Math.random() - 0.5) * 5))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'heat': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'seismic': return <MapPin className="w-4 h-4 text-red-400" />;
      case 'weather': return <Snowflake className="w-4 h-4 text-blue-400" />;
      default: return <Thermometer className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeColor = (type: string, intensity: number) => {
    const alpha = intensity / 100;
    switch (type) {
      case 'heat': return `rgba(251, 146, 60, ${alpha})`;
      case 'seismic': return `rgba(239, 68, 68, ${alpha})`;
      case 'weather': return `rgba(96, 165, 250, ${alpha})`;
      default: return `rgba(168, 85, 247, ${alpha})`;
    }
  };

  return (
    <Card className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500/30 to-red-500/10 rounded-lg flex items-center justify-center">
          <Thermometer className="w-6 h-6 text-orange-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Global Hotspots</h3>
          <p className="text-sm text-muted-foreground">Critical zones • Real-time monitoring</p>
        </div>
      </div>

      {/* Visual heatmap representation */}
      <div className="relative w-full h-64 bg-background/30 rounded-lg mb-6 overflow-hidden border border-border/50">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 800 400">
            {/* World map simplified */}
            <rect x="0" y="0" width="800" height="400" fill="hsl(var(--background))" />
            {hotspots.map((spot, idx) => {
              const x = ((spot.lon + 180) / 360) * 800;
              const y = ((90 - spot.lat) / 180) * 400;
              const size = (spot.intensity / 100) * 80;
              
              return (
                <g key={spot.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={size}
                    fill={getTypeColor(spot.type, spot.intensity * 0.3)}
                    className="animate-pulse"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={size * 0.6}
                    fill={getTypeColor(spot.type, spot.intensity * 0.6)}
                    className="animate-pulse"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={size * 0.3}
                    fill={getTypeColor(spot.type, spot.intensity)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
      </div>

      {/* Hotspot list */}
      <div className="space-y-3">
        {hotspots.sort((a, b) => b.intensity - a.intensity).map((spot) => (
          <div 
            key={spot.id}
            className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-orange-400/30 transition-all group"
          >
            <div className="flex items-center gap-3 flex-1">
              {getTypeIcon(spot.type)}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-orange-400 transition-colors">
                  {spot.location}
                </h4>
                <p className="text-xs text-muted-foreground capitalize">{spot.type} activity</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Intensity</div>
                <div className="text-sm font-bold text-orange-400">{spot.intensity.toFixed(0)}%</div>
              </div>
              <div 
                className="w-2 h-12 rounded-full overflow-hidden bg-background/50"
              >
                <div 
                  className="w-full bg-gradient-to-t from-orange-500 to-red-500 transition-all duration-1000"
                  style={{ height: `${spot.intensity}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GlobalHeatmap;
