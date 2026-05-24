import { useEffect, useRef, useState } from "react";
import { MapPin, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  type: "anomaly" | "prediction" | "monitor";
  severity?: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
}

export const InteractiveMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  
  const markers: MapMarker[] = [
    { id: "1", lat: 35, lon: -120, type: "anomaly", severity: "high", title: "Seismic Activity", description: "Unusual ground movement detected" },
    { id: "2", lat: -10, lon: -50, type: "prediction", severity: "medium", title: "Weather System", description: "Storm formation predicted" },
    { id: "3", lat: 50, lon: 10, type: "monitor", title: "Active Station", description: "Real-time monitoring active" },
    { id: "4", lat: -30, lon: 140, type: "anomaly", severity: "critical", title: "Temperature Spike", description: "Extreme heat detected" },
    { id: "5", lat: 60, lon: -100, type: "prediction", severity: "low", title: "Air Quality", description: "Minor pollution predicted" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw world map outline (simplified)
    const drawMap = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = "rgba(99, 102, 241, 0.05)";
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(99, 102, 241, 0.1)";
      ctx.lineWidth = 1;
      
      // Latitude lines
      for (let i = 0; i <= 180; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, (i / 180) * height);
        ctx.lineTo(width, (i / 180) * height);
        ctx.stroke();
      }
      
      // Longitude lines
      for (let i = 0; i <= 360; i += 30) {
        ctx.beginPath();
        ctx.moveTo((i / 360) * width, 0);
        ctx.lineTo((i / 360) * width, height);
        ctx.stroke();
      }

      // Draw markers
      markers.forEach((marker) => {
        const x = ((marker.lon + 180) / 360) * width;
        const y = ((90 - marker.lat) / 180) * height;

        // Pulsing circle effect
        const pulseRadius = 8 + Math.sin(Date.now() / 500) * 2;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius * 2);
        
        if (marker.type === "anomaly") {
          const color = marker.severity === "critical" ? "255, 0, 0" : 
                       marker.severity === "high" ? "255, 165, 0" : "255, 215, 0";
          gradient.addColorStop(0, `rgba(${color}, 0.6)`);
          gradient.addColorStop(1, `rgba(${color}, 0)`);
        } else if (marker.type === "prediction") {
          gradient.addColorStop(0, "rgba(168, 85, 247, 0.6)");
          gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
        } else {
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.6)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner marker
        ctx.fillStyle = marker.type === "anomaly" ? 
          (marker.severity === "critical" ? "#ef4444" : "#f59e0b") :
          marker.type === "prediction" ? "#a855f7" : "#6366f1";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    let animationFrame: number;
    const animate = () => {
      drawMap();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "anomaly": return AlertTriangle;
      case "prediction": return TrendingUp;
      default: return MapPin;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-primary/20 text-primary border-primary/30";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-panel p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Global Environmental Map</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30">
                <Zap className="w-3 h-3 mr-1 animate-pulse" />
                Live Updates
              </Badge>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-auto rounded-lg border border-border/50"
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Critical Anomaly</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">High Alert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Monitor Station</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markers.slice(0, 3).map((marker) => {
          const Icon = getMarkerIcon(marker.type);
          return (
            <Card key={marker.id} className="glass-panel p-4 hover:glow-border transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(marker.severity)} border`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{marker.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{marker.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {marker.lat.toFixed(2)}°, {marker.lon.toFixed(2)}°
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveMap;
