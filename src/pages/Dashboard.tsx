import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import AnimatedCounter from "@/components/AnimatedCounter";
import InteractiveMap from "@/components/InteractiveMap";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import GlobalHeatmap from "@/components/GlobalHeatmap";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { 
  Activity, TrendingUp, AlertTriangle, Cloud, 
  Download, RefreshCw, MapPin, Zap, PieChart as PieChartIcon, BarChart3 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { toast } from "sonner";
import Footer from "@/components/Footer";
 import { RadarChart3D } from "@/components/Dashboard/RadarChart3D";
 import { GaugeChartGroup } from "@/components/Dashboard/GaugeChart";
 import { ScatterPlot3D } from "@/components/Dashboard/ScatterPlot3D";
 import { ComposedChart, Scatter } from "recharts";

const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock real-time data
  const [liveStats, setLiveStats] = useState({
    activeMonitors: 12847,
    anomaliesDetected: 342,
    predictions: 89,
    dataPoints: 5421098
  });

  // Generate trend data
  const generateTrendData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      return {
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit' }),
        anomalies: Math.floor(Math.random() * 50) + 10,
        predictions: Math.floor(Math.random() * 30) + 5,
        alerts: Math.floor(Math.random() * 20) + 2
      };
    });
    return hours;
  };

  const [trendData] = useState(generateTrendData());

  // Category distribution
  const categoryData = [
    { name: 'Seismic', value: 156, color: '#00ffff' },
    { name: 'Weather', value: 234, color: '#ff6b9d' },
    { name: 'Oceanic', value: 189, color: '#ffd700' },
    { name: 'Atmospheric', value: 145, color: '#9b59b6' }
  ];

  // Regional activity
  const regionalData = [
    { region: 'North America', active: 245, predicted: 34, critical: 12 },
    { region: 'South America', active: 189, predicted: 28, critical: 8 },
    { region: 'Europe', active: 312, predicted: 45, critical: 15 },
    { region: 'Asia', active: 423, predicted: 67, critical: 23 },
    { region: 'Africa', active: 167, predicted: 21, critical: 6 },
    { region: 'Oceania', active: 98, predicted: 15, critical: 4 }
  ];

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeMonitors: prev.activeMonitors + Math.floor(Math.random() * 10) - 5,
        anomaliesDetected: prev.anomaliesDetected + Math.floor(Math.random() * 3),
        predictions: prev.predictions + Math.floor(Math.random() * 2),
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 1000)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.success("Refreshing dashboard data...");
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard updated!");
    }, 2000);
  };

  const handleExport = () => {
    toast.success("Exporting data as CSV...");
    // Mock export functionality
    setTimeout(() => {
      toast.success("Data exported successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <Activity className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Real-Time Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground text-glow">
                Analytics <span className="text-primary animate-pulse-glow">Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-lg">Advanced environmental monitoring and predictive analytics</p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleRefresh} 
                variant="outline"
                disabled={isRefreshing}
                className="gap-2 border-primary/30"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExport} className="gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Live Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-panel stat-card p-6 glow-border-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center animate-pulse-glow">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Active Monitors</span>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">
                <AnimatedCounter end={liveStats.activeMonitors} />
              </p>
              <p className="text-xs text-green-400 font-medium">↗ +12.5% from last hour</p>
            </Card>

            <Card className="glass-panel stat-card p-6 glow-border-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Anomalies</span>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">
                <AnimatedCounter end={liveStats.anomaliesDetected} />
              </p>
              <p className="text-xs text-yellow-400 font-medium">↗ +8 in last hour</p>
            </Card>

            <Card className="glass-panel stat-card p-6 glow-border-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Predictions</span>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">
                <AnimatedCounter end={liveStats.predictions} />
              </p>
              <p className="text-xs text-purple-400 font-medium">⚡ 95.3% accuracy</p>
            </Card>

            <Card className="glass-panel stat-card p-6 glow-border-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Data Points</span>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">
                <AnimatedCounter end={liveStats.dataPoints} />
              </p>
              <p className="text-xs text-blue-400 font-medium">● Live</p>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass-panel">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="map">Global Map</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6"
>
              {/* New Advanced Sections */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <GlobalHeatmap />
                <PerformanceMonitor />
              </div>

               {/* Gauge Charts */}
               <GaugeChartGroup />

               {/* Radar and Scatter Charts */}
               <div className="grid lg:grid-cols-2 gap-6">
                 <RadarChart3D />
                 <ScatterPlot3D />
               </div>

              {/* Charts Row 1 */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Activity Trend */}
                <Card className="glass-panel p-6 glow-border-hover hover:scale-[1.01] transition-all">
                  <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    24-Hour Activity Trend
                  </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredictions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9b59b6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9b59b6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="anomalies" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorAnomalies)"
                    name="Anomalies"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predictions" 
                    stroke="#9b59b6" 
                    fillOpacity={1} 
                    fill="url(#colorPredictions)"
                    name="Predictions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

                {/* Category Distribution */}
                <Card className="glass-panel p-6 glow-border-hover hover:scale-[1.01] transition-all">
                  <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-purple-400" />
                    Anomaly Categories
                  </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
                </Card>
              </div>

              {/* Regional Activity Chart */}
              <Card className="glass-panel p-6 glow-border-hover hover:scale-[1.005] transition-all">
                <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  Regional Activity Overview
                </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Legend />
                <Bar dataKey="active" fill="hsl(var(--primary))" name="Active Monitors" radius={[8, 8, 0, 0]} />
                <Bar dataKey="predicted" fill="#9b59b6" name="Predictions" radius={[8, 8, 0, 0]} />
                <Bar dataKey="critical" fill="#ff6b9d" name="Critical Alerts" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <AdvancedAnalytics />
            </TabsContent>

            <TabsContent value="map">
              <InteractiveMap />
            </TabsContent>

            <TabsContent value="performance">
              <div className="space-y-6">
                <PerformanceMonitor />
                <GlobalHeatmap />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;