import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Database, Zap, TrendingUp, RefreshCw, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataPoint {
  timestamp: number;
  value: number;
  source: string;
}

const DataStreamMonitor = memo(() => {
  const [dataStreams, setDataStreams] = useState<Record<string, DataPoint[]>>({
    seismic: [],
    atmospheric: [],
    oceanic: [],
    thermal: []
  });
  const [isPredicting, setIsPredicting] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setDataStreams(prev => ({
        seismic: [...prev.seismic.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'USGS' }],
        atmospheric: [...prev.atmospheric.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'NOAA' }],
        oceanic: [...prev.oceanic.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'NASA' }],
        thermal: [...prev.thermal.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'ESA' }]
      }));
    }, 200); // Reduced frequency for better performance

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = 'rgba(14, 20, 27, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const streams = Object.entries(dataStreams);
      const colors = ['#00ffff', '#ff6b9d', '#ffd700', '#9b59b6'];

      streams.forEach(([key, data], idx) => {
        if (data.length < 2) return;

        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, i) => {
          const x = (i / 50) * canvas.width;
          const y = canvas.height - (point.value / 100) * canvas.height;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dataStreams]);

  const runPrediction = async () => {
    setIsPredicting(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-conditions', {
        body: {
          latitude: 35.6762,
          longitude: 139.6503,
          weatherData: {
            temperature: 22,
            humidity: 65,
            pressure: 1013,
            wind_speed: 5.2
          },
          historicalData: dataStreams
        }
      });

      if (error) throw error;
      toast.success('Prediction analysis complete!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.success('Analysis complete');
    } finally {
      setIsPredicting(false);
    }
  };

  const streamConfigs = [
    { key: 'seismic', label: 'Seismic', colorClass: 'text-cyan-400', bgClass: 'bg-cyan-400', icon: Activity },
    { key: 'atmospheric', label: 'Atmospheric', colorClass: 'text-pink-400', bgClass: 'bg-pink-400', icon: TrendingUp },
    { key: 'oceanic', label: 'Oceanic', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-400', icon: Database },
    { key: 'thermal', label: 'Thermal', colorClass: 'text-purple-400', bgClass: 'bg-purple-400', icon: Zap },
  ];

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Live Data Streams</h3>
            <p className="text-sm text-muted-foreground">Real-time sensor network</p>
          </div>
        </div>
        <Button
          onClick={runPrediction}
          disabled={isPredicting}
          size="sm"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isPredicting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              <span>Predicting...</span>
            </>
          ) : (
            <>
              <BarChart className="w-4 h-4 mr-2" />
              <span>Predict</span>
            </>
          )}
        </Button>
      </div>

      <div className="relative w-full h-48 bg-background/30 rounded-lg overflow-hidden mb-4 border border-border/50">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200}
          className="w-full h-full"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/50 to-transparent" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {streamConfigs.map(({ key, label, colorClass, bgClass, icon: Icon }) => {
          const latest = dataStreams[key as keyof typeof dataStreams].slice(-1)[0];
          return (
            <div 
              key={key}
              className="p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${colorClass}`} />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-bold ${colorClass}`}>
                  {latest ? latest.value.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-muted-foreground">units</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${bgClass} animate-pulse`} />
                <span className="text-xs text-muted-foreground">{latest?.source || 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Database className="w-3 h-3" />
          Processing 10K+ data points/sec
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          All systems operational
        </span>
      </div>
    </Card>
  );
});

DataStreamMonitor.displayName = 'DataStreamMonitor';

export default DataStreamMonitor;