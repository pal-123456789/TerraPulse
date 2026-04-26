import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Brain, Zap, AlertTriangle } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const AdvancedAnalytics = () => {
  // AI Confidence Score Data
  const confidenceData = [
    { metric: "Anomaly Detection", score: 94 },
    { metric: "Weather Prediction", score: 89 },
    { metric: "Seismic Analysis", score: 87 },
    { metric: "Climate Modeling", score: 91 },
    { metric: "Pattern Recognition", score: 96 },
  ];

  // Real-time threat level data
  const threatData = [
    { time: "00:00", level: 23, threshold: 50 },
    { time: "04:00", level: 18, threshold: 50 },
    { time: "08:00", level: 35, threshold: 50 },
    { time: "12:00", level: 42, threshold: 50 },
    { time: "16:00", level: 67, threshold: 50 },
    { time: "20:00", level: 45, threshold: 50 },
    { time: "24:00", level: 28, threshold: 50 },
  ];

  // System performance metrics
  const performanceData = [
    { name: "Processing Speed", current: 95, target: 100 },
    { name: "Data Accuracy", current: 98, target: 100 },
    { name: "Model Efficiency", current: 92, target: 100 },
    { name: "Response Time", current: 88, target: 100 },
  ];

  // Environmental risk distribution
  const riskData = [
    { category: "Seismic", value: 23, max: 100 },
    { category: "Weather", value: 45, max: 100 },
    { category: "Climate", value: 67, max: 100 },
    { category: "Air Quality", value: 34, max: 100 },
    { category: "Water", value: 28, max: 100 },
    { category: "Volcanic", value: 15, max: 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Confidence Metrics */}
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Model Performance</h3>
              <p className="text-xs text-muted-foreground">Confidence scores across systems</p>
            </div>
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-400">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Optimal
          </Badge>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={confidenceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis dataKey="metric" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]}>
              {confidenceData.map((entry, index) => (
                <g key={`cell-${index}`}>
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur="0.5s"
                    begin={`${index * 0.1}s`}
                    fill="freeze"
                  />
                </g>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-card/50">
            <p className="text-2xl font-bold text-primary">92.4%</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Accuracy</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/50">
            <p className="text-2xl font-bold text-green-400">5.2M</p>
            <p className="text-xs text-muted-foreground mt-1">Data Points</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/50">
            <p className="text-2xl font-bold text-purple-400">24/7</p>
            <p className="text-xs text-muted-foreground mt-1">Monitoring</p>
          </div>
        </div>
      </Card>

      {/* Real-time Threat Level */}
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Threat Level Timeline</h3>
              <p className="text-xs text-muted-foreground">Last 24 hours analysis</p>
            </div>
          </div>
          <Badge variant="outline" className="border-orange-500/30 text-orange-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            Elevated
          </Badge>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={threatData}>
            <defs>
              <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Area type="monotone" dataKey="level" stroke="#f59e0b" fillOpacity={1} fill="url(#threatGradient)" />
            <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Current Level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500" style={{ height: "2px" }} />
            <span className="text-muted-foreground">Threshold</span>
          </div>
        </div>
      </Card>

      {/* System Performance */}
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">System Performance</h3>
              <p className="text-xs text-muted-foreground">Real-time metrics</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-15} textAnchor="end" height={80} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="target" fill="hsl(var(--muted))" radius={[8, 8, 8, 8]} opacity={0.3} />
            <Bar dataKey="current" fill="#10b981" radius={[8, 8, 8, 8]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Environmental Risk Radar */}
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Risk Distribution</h3>
              <p className="text-xs text-muted-foreground">Multi-domain analysis</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={riskData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Radar name="Risk Level" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-card/50">
            <span className="text-muted-foreground">Highest Risk</span>
            <span className="font-semibold text-red-400">Climate (67%)</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-card/50">
            <span className="text-muted-foreground">Lowest Risk</span>
            <span className="font-semibold text-green-400">Volcanic (15%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
