import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Satellite, Radar, Cloud, Brain, FileSearch } from "lucide-react";

interface ScanningExperienceProps {
  isLoading: boolean;
}

const STEPS = [
  { icon: Radar, label: "Locking GPS coordinates", color: "text-cyan-400" },
  { icon: Satellite, label: "Connecting to NASA satellites", color: "text-blue-400" },
  { icon: Cloud, label: "Fetching weather telemetry", color: "text-purple-400" },
  { icon: Brain, label: "Analyzing atmosphere with AI", color: "text-pink-400" },
  { icon: FileSearch, label: "Compiling environmental report", color: "text-green-400" },
];

const FUN_FACTS = [
  "🛰️ NASA tracks over 27,000 pieces of space debris orbiting Earth.",
  "🌍 Earth's atmosphere extends 10,000 km into space.",
  "⚡ Lightning strikes the planet about 100 times every second.",
  "🌊 The ocean absorbs 30% of CO₂ emissions humans produce.",
  "🌡️ The last 9 years have been the hottest on record.",
  "💨 Wind patterns are shaped by Earth's rotation (Coriolis effect).",
  "🌪️ The eye of a hurricane is the calmest part of the storm.",
  "❄️ Antarctica holds 70% of the world's fresh water as ice.",
];

export const ScanningExperience = ({ isLoading }: ScanningExperienceProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [satellitesPinged, setSatellitesPinged] = useState(0);
  const [dataPoints, setDataPoints] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    // Step ticker — never quite finishes until isLoading flips false
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 1800);

    // Smooth progress (caps at 92% so it doesn't lie about being done)
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 92 ? prev + Math.random() * 4 : prev));
    }, 300);

    // Live counters
    const counterInterval = setInterval(() => {
      setSatellitesPinged((prev) => Math.min(12, prev + 1));
      setDataPoints((prev) => prev + Math.floor(Math.random() * 250) + 50);
    }, 400);

    // Fun fact rotation
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 4000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(counterInterval);
      clearInterval(factInterval);
    };
  }, [isLoading]);

  // Snap to 100% when loading ends
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setCurrentStep(STEPS.length - 1);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <Card className="glass-panel p-6 md:p-8 border-primary/30 overflow-hidden relative">
      {/* Animated radar pulse background */}
      <div className="absolute top-0 right-0 w-64 h-64 -translate-y-1/4 translate-x-1/4 pointer-events-none">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-8 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
        <div className="absolute inset-16 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDuration: "2s", animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Scanning Earth in Real Time</h3>
            <p className="text-sm text-muted-foreground">Sit tight — we're pulling live signals from orbit.</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}% complete</span>
            <span>{progress < 100 ? "in progress…" : "done"}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStep || (!isLoading && idx <= currentStep);
            const isActive = idx === currentStep && isLoading;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
                  isActive ? "bg-primary/10" : isDone ? "opacity-90" : "opacity-40"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-green-500/20" : isActive ? "bg-primary/20" : "bg-muted/20"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : isActive ? (
                    <Loader2 className={`w-4 h-4 ${step.color} animate-spin`} />
                  ) : (
                    <Icon className={`w-4 h-4 ${step.color}`} />
                  )}
                </div>
                <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live counters */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="p-3 rounded-lg bg-card/50 text-center">
            <p className="text-2xl font-bold text-primary">{satellitesPinged}/12</p>
            <p className="text-xs text-muted-foreground">Satellites pinged</p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 text-center">
            <p className="text-2xl font-bold text-primary">{dataPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Data points received</p>
          </div>
        </div>

        {/* Fun fact */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Did you know?</p>
          <p key={factIndex} className="text-sm text-foreground animate-fade-in">
            {FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ScanningExperience;
