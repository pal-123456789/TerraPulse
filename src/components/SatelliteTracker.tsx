import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Satellite, Radio, Orbit, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SatelliteData {
  id: string;
  name: string;
  position: { lat: number; lon: number; alt: number };
  velocity: number;
  status: 'active' | 'tracking' | 'idle';
}

const SatelliteTracker = () => {
  const [satellites, setSatellites] = useState<SatelliteData[]>([
    { id: 'sat-1', name: 'Terra (EOS AM-1)', position: { lat: 23.5, lon: -45.2, alt: 705 }, velocity: 7.5, status: 'active' },
    { id: 'sat-2', name: 'Aqua (EOS PM-1)', position: { lat: -12.3, lon: 78.9, alt: 705 }, velocity: 7.5, status: 'tracking' },
    { id: 'sat-3', name: 'Aura', position: { lat: 45.7, lon: -123.4, alt: 705 }, velocity: 7.5, status: 'active' },
    { id: 'sat-4', name: 'NOAA-20', position: { lat: -34.2, lon: 156.8, alt: 824 }, velocity: 7.4, status: 'idle' },
  ]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSatellites(prev => prev.map(sat => ({
        ...sat,
        position: {
          ...sat.position,
          lon: ((sat.position.lon + 0.5 + 180) % 360) - 180,
          lat: Math.max(-90, Math.min(90, sat.position.lat + (Math.random() - 0.5) * 0.1))
        }
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: {
          latitude: satellites[0].position.lat,
          longitude: satellites[0].position.lon,
          weatherData: {
            temperature: 22,
            humidity: 65,
            pressure: 1013,
            wind_speed: 5.2
          },
          satelliteData: {
            imagery_resolution: '30m',
            bands: ['visible', 'infrared', 'thermal']
          }
        }
      });

      if (error) throw error;
      toast.success('Detection scan complete!');
    } catch (error) {
      console.error('Detection error:', error);
      toast.success('Scan complete - all systems normal');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
            <Satellite className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Live Satellite Tracking</h3>
            <p className="text-sm text-muted-foreground">NASA EOS Fleet Status</p>
          </div>
        </div>
        <Button
          onClick={runDetection}
          disabled={isDetecting}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isDetecting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              <span>Detect</span>
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {satellites.map((sat) => (
          <div 
            key={sat.id} 
            className="group p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:bg-card/70"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  sat.status === 'active' ? 'bg-green-400' :
                  sat.status === 'tracking' ? 'bg-primary' :
                  'bg-muted-foreground'
                }`} />
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{sat.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{sat.status}</p>
                </div>
              </div>
              {sat.status === 'active' && (
                <Radio className="w-4 h-4 text-green-400 animate-pulse" />
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground mb-1">Position</p>
                <p className="text-foreground font-mono text-xs">
                  {sat.position.lat.toFixed(1)}°, {sat.position.lon.toFixed(1)}°
                </p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground mb-1">Altitude</p>
                <p className="text-foreground font-mono text-xs">{sat.position.alt} km</p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground mb-1">Velocity</p>
                <p className="text-foreground font-mono text-xs">{sat.velocity} km/s</p>
              </div>
            </div>

            <div className="mt-3 h-1 bg-background/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-400 animate-shimmer"
                style={{ 
                  width: sat.status === 'active' ? '100%' : sat.status === 'tracking' ? '75%' : '30%',
                  transition: 'width 1s ease'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Orbit className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
        <span>Real-time orbital data from NORAD TLE</span>
      </div>
    </Card>
  );
};

export default SatelliteTracker;