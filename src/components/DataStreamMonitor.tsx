import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Database, Zap, TrendingUp } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  value: number;
  source: string;
}

const DataStreamMonitor = () => {
  const [dataStreams, setDataStreams] = useState<Record<string, DataPoint[]>>({
    seismic: [],
    atmospheric: [],
    oceanic: [],
    thermal: []
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setDataStreams(prev => ({
        seismic: [...prev.seismic.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'USGS' }],
        atmospheric: [...prev.atmospheric.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'NOAA' }],
        oceanic: [...prev.oceanic.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'NASA' }],
        thermal: [...prev.thermal.slice(-50), { timestamp: now, value: Math.random() * 100, source: 'ESA' }]
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = 'rgba(14, 20, 27, 0.1)';
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
    };

    const animationId = requestAnimationFrame(function animate() {
      draw();
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationId);
  }, [dataStreams]);

  const streamConfigs = [
    { key: 'seismic', label: 'Seismic', color: 'cyan', icon: Activity },
    { key: 'atmospheric', label: 'Atmospheric', color: 'pink', icon: TrendingUp },
    { key: 'oceanic', label: 'Oceanic', color: 'yellow', icon: Database },
    { key: 'thermal', label: 'Thermal', color: 'purple', icon: Zap },
  ];

  return (
    <Card className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
          <Activity className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Live Data Streams</h3>
          <p className="text-sm text-muted-foreground">Real-time sensor network</p>
        </div>
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
        {streamConfigs.map(({ key, label, color, icon: Icon }) => {
          const latest = dataStreams[key as keyof typeof dataStreams].slice(-1)[0];
          return (
            <div 
              key={key}
              className="p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${color}-400`} />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-bold text-${color}-400`}>
                  {latest ? latest.value.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-muted-foreground">units</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400 animate-pulse`} />
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
};

export default DataStreamMonitor;
