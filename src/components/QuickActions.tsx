import { useState, useEffect } from "react";
import { Plus, Download, Bell, Share2, Map, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AIAssistant from "@/components/Chat/AIAssistant";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "@/utils/dataExport";
import { supabase } from "@/integrations/supabase/client";

export const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();

  // Real unread notification count for current user
  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        if (!cancelled) setAlertCount(0);
        return;
      }
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setAlertCount(count || 0);
    };

    loadCount();

    const channel = supabase
      .channel("quick-actions-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, loadCount)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleExportData = async () => {
    const { data } = await supabase
      .from("anomalies")
      .select("name, anomaly_type, severity, latitude, longitude, detected_at, status")
      .order("detected_at", { ascending: false })
      .limit(500);
    exportToCSV(data || [], "terrapulse-anomalies");
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
  };

  const handleShare = async () => {
    setIsOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "TerraPulse",
          text: "Check out this AI-Powered Environmental Monitoring System!",
          url: window.location.href,
        });
        toast.success("Shared successfully!");
      } catch {
        toast.info("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const actions = [
    {
      icon: Sparkles,
      label: "Ask AI",
      color: "bg-gradient-to-br from-accent to-primary text-primary-foreground hover:opacity-90 shadow-accent/50",
      action: () => {
        setIsOpen(false);
        setAiOpen(true);
      },
    },
    {
      icon: Map,
      label: "Submit Report",
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
      action: () => {
        setIsOpen(false);
        navigate("/report");
      },
    },
    {
      icon: BarChart3,
      label: "View Stats",
      color: "bg-purple-500 text-white hover:bg-purple-500/90",
      action: handleViewStats,
    },
    {
      icon: Download,
      label: "Export Data",
      color: "bg-green-500 text-white hover:bg-green-500/90",
      action: handleExportData,
    },
    {
      icon: Bell,
      label: "Alerts",
      color: "bg-yellow-500 text-yellow-950 hover:bg-yellow-500/90",
      action: handleCheckAlerts,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      icon: Share2,
      label: "Share",
      color: "bg-blue-500 text-white hover:bg-blue-500/90",
      action: handleShare,
    },
  ];

  return (
    <>
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} hideTrigger />
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <div
          className={cn(
            "flex flex-col gap-3 mb-3 transition-all duration-300",
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div key={index} className="relative group" title={action.label}>
                <Button
                  onClick={() => action.action()}
                  aria-label={action.label}
                  className={cn(
                    "w-14 h-14 rounded-full shadow-lg transition-all duration-300 font-bold",
                    action.color,
                    "hover:scale-110 relative"
                  )}
                  style={{ transitionDelay: isOpen ? `${index * 50}ms` : "0ms" }}
                >
                  <Icon className="w-6 h-6" />
                </Button>
                {/* Label tooltip */}
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-md bg-card/90 backdrop-blur-sm border border-border/60 text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                  {action.label}
                </span>
                {action.badge && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                    {action.badge > 99 ? "99+" : action.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Glowing + button */}
        <div className="relative">
          {/* Outer glow halos */}
          <span className="pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-tr from-accent/40 via-primary/40 to-fuchsia-500/30 blur-2xl opacity-80 animate-pulse" style={{ animationDuration: "2.8s" }} />
          <span className="pointer-events-none absolute -inset-1 rounded-full bg-primary/30 blur-md" />
          {/* Rotating conic ring */}
          <span
            className="pointer-events-none absolute -inset-1 rounded-full opacity-90"
            style={{
              background:
                "conic-gradient(from 0deg, hsl(var(--accent)), hsl(var(--primary)), hsl(var(--accent)/0.2), hsl(var(--accent)))",
              WebkitMask: "radial-gradient(circle, transparent 60%, black 62%)",
              mask: "radial-gradient(circle, transparent 60%, black 62%)",
              animation: "spin 6s linear infinite",
            }}
          />
          {/* Ping pulse */}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2.4s" }} />

          <Button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
            className={cn(
              "relative w-16 h-16 rounded-full transition-all duration-300 group overflow-hidden border border-primary-foreground/20",
              "bg-[radial-gradient(circle_at_30%_25%,hsl(var(--accent)),hsl(var(--primary))_55%,hsl(var(--primary)/0.85))]",
              "text-primary-foreground shadow-[0_10px_40px_-5px_hsl(var(--primary)/0.7)]",
              "hover:scale-110 active:scale-95",
              isOpen && "rotate-45"
            )}
          >
            {/* Glossy highlight */}
            <span className="absolute top-1 left-2 right-2 h-1/3 rounded-full bg-gradient-to-b from-white/40 to-transparent blur-sm opacity-70 pointer-events-none" />
            {/* Shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <Plus className="w-8 h-8 relative z-10 drop-shadow-[0_2px_6px_hsl(var(--accent)/0.8)]" />
          </Button>
        </div>

        {isOpen && (
          <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
        )}
      </div>
    </>
  );
};

export default QuickActions;
