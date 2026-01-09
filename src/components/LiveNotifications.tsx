import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, TrendingUp, MapPin, Zap } from "lucide-react";

export const LiveNotifications = () => {
  useEffect(() => {
    // Simulate live notifications
    const notifications = [
      { 
        icon: AlertTriangle, 
        message: "Seismic activity detected in Pacific Ring of Fire",
        type: "warning" as const
      },
      { 
        icon: TrendingUp, 
        message: "New prediction: Hurricane formation probability 78%",
        type: "info" as const
      },
      { 
        icon: MapPin, 
        message: "New monitoring station activated in Amazon",
        type: "success" as const
      },
      { 
        icon: Zap, 
        message: "Anomaly resolved: Temperature stabilized in Arctic",
        type: "success" as const
      },
    ];

    let index = 0;
    const interval = setInterval(() => {
      const notification = notifications[index % notifications.length];
      const Icon = notification.icon;
      
      toast[notification.type](notification.message, {
        icon: <Icon className="w-5 h-5" />,
        duration: 4000,
      });
      
      index++;
    }, 15000); // Show notification every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};

export default LiveNotifications;