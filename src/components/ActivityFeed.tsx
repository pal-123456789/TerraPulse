import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, AlertTriangle, TrendingUp, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "report" | "detection" | "prediction" | "analysis";
  location: string;
  message: string;
  time: string;
  severity?: "low" | "medium" | "high";
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Generate initial activities
    const initialActivities = generateActivities(5);
    setActivities(initialActivities);

    // Add new activity every 5-8 seconds
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
    }, Math.random() * 3000 + 5000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "report": return MapPin;
      case "detection": return AlertTriangle;
      case "prediction": return TrendingUp;
      default: return Activity;
    }
  };

  const getColorClass = (severity?: string) => {
    switch (severity) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "low": return "bg-green-500/20 text-green-400";
      default: return "bg-primary/20 text-primary";
    }
  };

  return (
    <Card className="glass-panel p-6">
      <h3 className="text-lg font-bold mb-4 text-foreground">Real-Time Activity</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.map((activity, index) => {
          const Icon = getIcon(activity.type);
          return (
            <div
              key={activity.id}
              className={`flex gap-3 p-3 rounded-lg bg-card/50 transition-all duration-500 ${
                index === 0 ? 'animate-fade-in' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClass(activity.severity)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{activity.location}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const generateActivity = (): ActivityItem => {
  const types: ActivityItem["type"][] = ["report", "detection", "prediction", "analysis"];
  const severities: ActivityItem["severity"][] = ["low", "medium", "high"];
  const locations = [
    "Amazon Basin", "Arctic Circle", "Pacific Ocean", "Sahara Desert",
    "Himalayas", "Great Barrier Reef", "Congo Rainforest", "Antarctic",
    "Mediterranean Sea", "Siberia", "California", "Indonesia"
  ];
  const messages = [
    "Environmental anomaly detected",
    "New observation report submitted",
    "Weather pattern analysis completed",
    "Temperature spike recorded",
    "Air quality measurement logged",
    "Precipitation forecast updated",
    "Seismic activity monitored",
    "Atmospheric pressure change noted"
  ];

  return {
    id: `activity-${Date.now()}-${Math.random()}`,
    type: types[Math.floor(Math.random() * types.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    time: "Just now",
    severity: severities[Math.floor(Math.random() * severities.length)]
  };
};

const generateActivities = (count: number): ActivityItem[] => {
  const times = ["Just now", "1m ago", "3m ago", "5m ago", "8m ago"];
  return Array.from({ length: count }, (_, i) => ({
    ...generateActivity(),
    time: times[i] || `${i}m ago`
  }));
};

export default ActivityFeed;
