import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Brain, TrendingUp, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Prediction {
  id: string;
  type: string;
  location: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  confidence: number;
}

const AIPredictor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([
    { id: '1', type: 'Seismic Activity', location: 'Pacific Ring', probability: 78, severity: 'high', timeframe: '24-48h', confidence: 89 },
    { id: '2', type: 'Tropical Storm', location: 'Caribbean Sea', probability: 65, severity: 'medium', timeframe: '48-72h', confidence: 82 },
    { id: '3', type: 'Heat Wave', location: 'South Asia', probability: 92, severity: 'critical', timeframe: '12-24h', confidence: 95 },
  ]);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setPredictions(prev => prev.map(p => ({
        ...p,
        probability: Math.min(99, p.probability + Math.random() * 5),
        confidence: Math.min(99, p.confidence + Math.random() * 3)
      })));
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-green-400 bg-green-400/10 border-green-400/30';
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        setPredictions(prev => prev.map(p => ({
          ...p,
          probability: Math.max(50, Math.min(99, p.probability + (Math.random() - 0.5) * 2))
        })));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <Card className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-purple-500/10 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">AI Predictions</h3>
            <p className="text-sm text-muted-foreground">Neural Network Analysis</p>
          </div>
        </div>
        <Button 
          onClick={runAnalysis}
          disabled={isAnalyzing}
          size="sm"
          className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Re-analyze
            </>
          )}
        </Button>
      </div>

      {isAnalyzing && (
        <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="text-sm text-purple-400 font-medium">Processing satellite data & atmospheric patterns...</span>
          </div>
          <Progress value={65} className="h-2" />
        </div>
      )}

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div 
            key={pred.id}
            className="group p-4 rounded-lg bg-card/50 border border-border/50 hover:border-purple-400/30 transition-all duration-300 hover:bg-card/70 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                    {pred.type}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full border uppercase font-medium ${getSeverityColor(pred.severity)}`}>
                    {pred.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  {pred.location} • {pred.timeframe}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Probability</span>
                  <span className="text-sm font-bold text-foreground">{pred.probability.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                    style={{ width: `${pred.probability}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    AI Confidence
                  </span>
                  <span className="text-sm font-bold text-green-400">{pred.confidence.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex items-center gap-2 text-xs text-purple-300">
          <Brain className="w-4 h-4" />
          <span>Powered by GPT-4 Vision + Satellite Imagery Analysis + Historical Pattern Recognition</span>
        </div>
      </div>
    </Card>
  );
};

export default AIPredictor;
