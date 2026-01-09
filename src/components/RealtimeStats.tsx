import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import AnimatedCounter from "./AnimatedCounter";

interface Stats {
  activeMonitors: number;
  liveAnomalies: number;
  aiPredictions: number;
  dataPoints: number;
}

export const RealtimeStats = () => {
  const [stats, setStats] = useState<Stats>({
    activeMonitors: 12847,
    liveAnomalies: 342,
    aiPredictions: 89,
    dataPoints: 5421098,
  });

  useEffect(() => {
    // Update stats every 5 seconds with realistic variations
    const interval = setInterval(() => {
      setStats(prev => ({
        activeMonitors: prev.activeMonitors + Math.floor(Math.random() * 10) - 5,
        liveAnomalies: Math.max(0, prev.liveAnomalies + Math.floor(Math.random() * 6) - 3),
        aiPredictions: Math.max(0, prev.aiPredictions + Math.floor(Math.random() * 4) - 2),
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 1000) + 100,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16 max-w-5xl mx-auto px-4">
      <Card className="glass-panel stat-card p-4 md:p-6 text-center glow-border-hover cursor-pointer animate-slide-up group" style={{ animationDelay: '0.1s' }}>
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-2xl md:text-3xl font-bold text-primary mb-2 relative z-10">
            <AnimatedCounter end={stats.activeMonitors} key={stats.activeMonitors} />
          </p>
          <p className="text-xs md:text-sm text-muted-foreground font-medium relative z-10">Active Monitors</p>
        </div>
      </Card>
      
      <Card className="glass-panel stat-card p-4 md:p-6 text-center glow-border-hover cursor-pointer animate-slide-up group" style={{ animationDelay: '0.2s' }}>
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 relative z-10">
            <AnimatedCounter end={stats.liveAnomalies} key={stats.liveAnomalies} />
          </p>
          <p className="text-xs md:text-sm text-muted-foreground font-medium relative z-10">Live Anomalies</p>
        </div>
      </Card>
      
      <Card className="glass-panel stat-card p-4 md:p-6 text-center glow-border-hover cursor-pointer animate-slide-up group" style={{ animationDelay: '0.3s' }}>
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-2xl md:text-3xl font-bold text-purple-400 mb-2 relative z-10">
            <AnimatedCounter end={stats.aiPredictions} key={stats.aiPredictions} />
          </p>
          <p className="text-xs md:text-sm text-muted-foreground font-medium relative z-10">AI Predictions</p>
        </div>
      </Card>
      
      <Card className="glass-panel stat-card p-4 md:p-6 text-center glow-border-hover cursor-pointer animate-slide-up group" style={{ animationDelay: '0.4s' }}>
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-2xl md:text-3xl font-bold text-green-400 mb-2 relative z-10">
            <AnimatedCounter end={stats.dataPoints} key={stats.dataPoints} />
          </p>
          <p className="text-xs md:text-sm text-muted-foreground font-medium relative z-10">Data Points</p>
        </div>
      </Card>
    </div>
  );
};

export default RealtimeStats;
