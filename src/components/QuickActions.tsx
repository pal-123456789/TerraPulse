import { useState, useEffect } from "react";
import { Plus, Download, Bell, Share2, Map, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "@/utils/dataExport";

export const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(3);
  const navigate = useNavigate();

  // Real-time alert monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time alert updates
      setAlertCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleExportData = () => {
    const sampleData = [
      { timestamp: new Date().toISOString(), monitors: 12847, anomalies: 342, predictions: 89 },
    ];
    exportToCSV(sampleData, 'terrapulse-data');
    toast.success("Data exported successfully!");
  };

  const handleViewStats = () => {
    setIsOpen(false);
    navigate("/dashboard");
    toast.success("Opening real-time dashboard...");
  };

  const handleCheckAlerts = () => {
    setIsOpen(false);
    navigate("/notifications");
    toast.info(`Checking ${alertCount} active alerts...`);
  };

  const handleShare = async () => {
    setIsOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TerraPulse',
          text: 'Check out this AI-Powered Environmental Monitoring System!',
          url: window.location.href,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        toast.info("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const actions = [
    { 
      icon: Map, 
      label: "Submit Report", 
      color: "bg-primary/20 hover:bg-primary/30 text-primary",
      action: () => {
        setIsOpen(false);
        navigate("/report");
      }
    },
    { 
      icon: BarChart3, 
      label: "View Stats", 
      color: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
      action: handleViewStats
    },
    { 
      icon: Download, 
      label: "Export Data", 
      color: "bg-green-500/20 hover:bg-green-500/30 text-green-400",
      action: handleExportData
    },
    { 
      icon: Bell, 
      label: "Alerts", 
      color: "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400",
      action: handleCheckAlerts,
      badge: alertCount > 0 ? alertCount : undefined
    },
    { 
      icon: Share2, 
      label: "Share", 
      color: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400",
      action: handleShare
    },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div key={index} className="relative">
              <Button
                onClick={() => {
                  action.action();
                }}
                className={cn(
                  "w-14 h-14 rounded-full shadow-lg transition-all duration-300",
                  action.color,
                  "hover:scale-110 relative"
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                }}
              >
                <Icon className="w-6 h-6" />
              </Button>
              {action.badge && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                  {action.badge}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl transition-all duration-300",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="w-8 h-8" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default QuickActions;