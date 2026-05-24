import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Gauge, Zap, Database, Cloud } from 'lucide-react';

interface PerformanceMetrics {
  apiLatency: number;
  dataProcessing: number;
  cacheHitRate: number;
  throughput: number;
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiLatency: 45,
    dataProcessing: 1250,
    cacheHitRate: 94,
    throughput: 8500
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        apiLatency: Math.max(20, Math.min(100, metrics.apiLatency + (Math.random() - 0.5) * 10)),
        dataProcessing: Math.max(800, Math.min(2000, metrics.dataProcessing + (Math.random() - 0.5) * 200)),
        cacheHitRate: Math.max(85, Math.min(99, metrics.cacheHitRate + (Math.random() - 0.5) * 2)),
        throughput: Math.max(5000, Math.min(12000, metrics.throughput + (Math.random() - 0.5) * 1000))
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <Card className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-emerald-500/10 rounded-lg flex items-center justify-center">
          <Gauge className="w-6 h-6 text-green-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">System Performance</h3>
          <p className="text-sm text-muted-foreground">Real-time metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-green-400/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-muted-foreground">API Latency</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-green-400">{metrics.apiLatency.toFixed(0)}</span>
            <span className="text-sm text-muted-foreground">ms</span>
          </div>
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${100 - metrics.apiLatency}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-blue-400/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-muted-foreground">Data Processing</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-blue-400">{metrics.dataProcessing.toFixed(0)}</span>
            <span className="text-sm text-muted-foreground">ops/s</span>
          </div>
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${(metrics.dataProcessing / 2000) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-purple-400/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-muted-foreground">Cache Hit Rate</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-purple-400">{metrics.cacheHitRate.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${metrics.cacheHitRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Throughput</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-primary">{(metrics.throughput / 1000).toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">k/s</span>
          </div>
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
              style={{ width: `${(metrics.throughput / 12000) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-green-300">All systems optimal • 99.9% uptime</span>
      </div>
    </Card>
  );
};

export default PerformanceMonitor;
