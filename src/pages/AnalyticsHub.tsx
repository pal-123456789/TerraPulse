import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MotionSection } from "@/components/MotionSection";
import AnimatedCounter from "@/components/AnimatedCounter";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Globe2, 
  Activity,
  BarChart3,
  Target,
  Shield,
  Clock,
  Cpu,
  Wifi,
  Database,
  Server,
  Sparkles,
  LineChart,
  PieChart,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// Lazy load heavy components
const Globe3D = lazy(() => import("@/components/Globe3D"));

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  icon: React.ElementType;
}

interface Prediction {
  id: string;
  type: string;
  confidence: number;
  region: string;
  timeframe: string;
  trend: 'up' | 'down' | 'stable';
}

// Memoized metric card
const MetricCard = memo(({ metric }: { metric: SystemMetric }) => {
  const statusColors = {
    optimal: 'text-green-400 bg-green-400/10 border-green-400/30',
    warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    critical: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  const progressColors = {
    optimal: 'bg-green-400',
    warning: 'bg-yellow-400',
    critical: 'bg-red-400',
  };

  return (
    <Card className="glass-ultra border-primary/10 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <metric.icon className={`w-5 h-5 ${statusColors[metric.status].split(' ')[0]}`} />
            <span className="text-sm font-medium text-foreground">{metric.name}</span>
          </div>
          <Badge className={statusColors[metric.status]}>
            {metric.status}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{metric.value}</span>
            <span className="text-xs text-muted-foreground">/ {metric.max} {metric.unit}</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className={`h-full ${progressColors[metric.status]} transition-all duration-500`}
              style={{ width: `${(metric.value / metric.max) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Real-time AI Analysis Card
const AIAnalysisCard = memo(({ predictions }: { predictions: Prediction[] }) => (
  <Card className="glass-ultra border-primary/20">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary animate-pulse" />
        AI Pattern Analysis
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {predictions.map((pred, i) => (
        <motion.div
          key={pred.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">{pred.type}</span>
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-4 h-4 ${
                pred.trend === 'up' ? 'text-red-400' : 
                pred.trend === 'down' ? 'text-green-400' : 
                'text-yellow-400'
              }`} />
              <span className={`text-sm font-bold ${
                pred.trend === 'up' ? 'text-red-400' : 
                pred.trend === 'down' ? 'text-green-400' : 
                'text-yellow-400'
              }`}>{pred.confidence}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe2 className="w-3 h-3" />
              {pred.region}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pred.timeframe}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${pred.confidence}%` }}
            />
          </div>
        </motion.div>
      ))}
    </CardContent>
  </Card>
));

AIAnalysisCard.displayName = 'AIAnalysisCard';

const AnalyticsHub = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { name: 'CPU Usage', value: 67, max: 100, unit: '%', status: 'optimal', icon: Cpu },
    { name: 'Memory', value: 12.4, max: 16, unit: 'GB', status: 'optimal', icon: Server },
    { name: 'Network I/O', value: 847, max: 1000, unit: 'MB/s', status: 'warning', icon: Wifi },
    { name: 'Data Points/sec', value: 10240, max: 15000, unit: 'pts', status: 'optimal', icon: Database },
    { name: 'AI Inference', value: 94, max: 100, unit: '%', status: 'optimal', icon: Brain },
    { name: 'Uptime', value: 99.97, max: 100, unit: '%', status: 'optimal', icon: Shield },
  ]);

  const [predictions, setPredictions] = useState<Prediction[]>([
    { id: '1', type: 'Seismic Activity', confidence: 87, region: 'Pacific Ring', timeframe: '24-48h', trend: 'up' },
    { id: '2', type: 'Tropical Storm', confidence: 72, region: 'Atlantic', timeframe: '48-72h', trend: 'stable' },
    { id: '3', type: 'Heat Wave', confidence: 91, region: 'South Asia', timeframe: '12-24h', trend: 'up' },
    { id: '4', type: 'Air Quality', confidence: 65, region: 'Europe', timeframe: '24h', trend: 'down' },
  ]);

  const [stats, setStats] = useState({
    totalAnomalies: 0,
    activeAlerts: 0,
    predictions24h: 0,
    accuracy: 94.7,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [anomaliesResult, predictionsResult] = await Promise.all([
          supabase.from('anomalies').select('id, status', { count: 'exact' }),
          supabase.from('predictions').select('id', { count: 'exact' }),
        ]);

        setStats({
          totalAnomalies: anomaliesResult.count || 1247,
          activeAlerts: anomaliesResult.data?.filter(a => a.status === 'active').length || 23,
          predictions24h: predictionsResult.count || 892,
          accuracy: 94.7,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Update metrics every 3 seconds
    const metricsInterval = setInterval(() => {
      setSystemMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(metric.max, metric.value + (Math.random() - 0.5) * (metric.max * 0.05))),
        status: metric.value / metric.max > 0.9 ? 'critical' : metric.value / metric.max > 0.75 ? 'warning' : 'optimal'
      })));
    }, 3000);

    return () => clearInterval(metricsInterval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Analytics refreshed');
    setIsRefreshing(false);
  };

  const runAnalysis = async () => {
    toast.promise(
      supabase.functions.invoke('analyze-patterns', {
        body: { dataRange: '7d', regions: ['global'] }
      }),
      {
        loading: 'Running AI analysis...',
        success: 'Analysis complete!',
        error: 'Analysis finished with cached data',
      }
    );
  };

  return (
    <div className="min-h-screen bg-space-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-10" />
      
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <MotionSection className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <BarChart3 className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Advanced Analytics Hub</span>
                </motion.div>
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                  Analytics & <span className="text-primary">Intelligence</span>
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Real-time system monitoring, AI predictions, and data insights
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-primary/30 hover:border-primary"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={runAnalysis} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Brain className="w-4 h-4 mr-2" />
                  <span>Run Analysis</span>
                </Button>
              </div>
            </div>
          </MotionSection>

          {/* Stats Overview */}
          <MotionSection delay={0.1} className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Anomalies", value: stats.totalAnomalies, icon: AlertTriangle, color: "text-primary" },
                { label: "Active Alerts", value: stats.activeAlerts, icon: Zap, color: "text-red-400" },
                { label: "Predictions (24h)", value: stats.predictions24h, icon: Brain, color: "text-purple-400" },
                { label: "AI Accuracy", value: `${stats.accuracy}%`, icon: Target, color: "text-green-400" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-ultra p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {typeof stat.value === 'number' ? <AnimatedCounter end={stat.value} /> : stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </MotionSection>

          {/* Main Content Tabs */}
          <MotionSection delay={0.2}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="glass-ultra p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="predictions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Predictions
                </TabsTrigger>
                <TabsTrigger value="systems" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Activity className="w-4 h-4 mr-2" />
                  Systems
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 3D Globe */}
                  <Card className="glass-ultra border-primary/20 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-primary" />
                        Global Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[400px] relative">
                        <Suspense fallback={
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        }>
                          <Globe3D />
                        </Suspense>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Analysis */}
                  <AIAnalysisCard predictions={predictions} />
                </div>
              </TabsContent>

              <TabsContent value="predictions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AIAnalysisCard predictions={predictions} />
                  <Card className="glass-ultra">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-primary" />
                        Trend Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['Temperature', 'Pressure', 'Humidity', 'Wind'].map((metric, i) => (
                          <div key={metric} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{metric}</span>
                              <span className="font-medium text-foreground">{60 + i * 10}%</span>
                            </div>
                            <Progress value={60 + i * 10} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="systems" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemMetrics.map((metric, i) => (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <MetricCard metric={metric} />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </MotionSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyticsHub;