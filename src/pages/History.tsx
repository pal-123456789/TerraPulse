import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Wind, Flame, Mountain, List, Clock, Trash2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import TimelineView from "@/components/TimelineView";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  anomaly_type: string;
  severity: string;
  detected_at: string;
  status: string;
  metadata?: any;
}

// Auto-cleanup threshold: 7 days
const CLEANUP_THRESHOLD_DAYS = 7;

const History = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("anomalies")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching anomalies:", error);
        return;
      }

      // Historical anomalies (these are always shown)
      const historicalAnomalies: Anomaly[] = [
        {
          id: "hist-1",
          name: "Hurricane Katrina",
          description: "Category 5 Atlantic hurricane that caused catastrophic damage along the Gulf coast",
          latitude: 29.9511,
          longitude: -90.0715,
          anomaly_type: "weather",
          severity: "extreme",
          detected_at: "2005-08-29T00:00:00Z",
          status: "resolved",
        },
        {
          id: "hist-2",
          name: "Chernobyl Disaster",
          description: "Nuclear accident that released large quantities of radioactive particles",
          latitude: 51.3891,
          longitude: 30.0987,
          anomaly_type: "nuclear",
          severity: "critical",
          detected_at: "1986-04-26T00:00:00Z",
          status: "resolved",
        },
        {
          id: "hist-3",
          name: "Tunguska Event",
          description: "Large explosion that flattened 2,000 square kilometers of forest",
          latitude: 60.8869,
          longitude: 101.8939,
          anomaly_type: "unexplained",
          severity: "high",
          detected_at: "1908-06-30T00:00:00Z",
          status: "resolved",
        },
      ];

      // Filter out old resolved anomalies (older than threshold) from database data
      const now = new Date();
      const thresholdDate = new Date(now.getTime() - CLEANUP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
      
      const recentAnomalies = (data || []).filter(anomaly => {
        const detectedDate = new Date(anomaly.detected_at);
        // Keep if: active, or resolved but within threshold
        return anomaly.status === 'active' || detectedDate > thresholdDate;
      });

      setAnomalies([...historicalAnomalies, ...recentAnomalies]);
    } catch (error) {
      console.error("Error fetching anomalies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();

    // Set up real-time subscription
    const channel = supabase
      .channel('history-anomalies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anomalies' }, () => {
        fetchAnomalies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnomalies]);

  // Manual cleanup function
  const cleanupOldRecords = async () => {
    setIsCleaningUp(true);
    try {
      const now = new Date();
      const thresholdDate = new Date(now.getTime() - CLEANUP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
      
      // Remove resolved anomalies older than threshold from local state
      setAnomalies(prev => prev.filter(anomaly => {
        if (anomaly.id.startsWith('hist-')) return true; // Keep historical
        const detectedDate = new Date(anomaly.detected_at);
        return anomaly.status === 'active' || detectedDate > thresholdDate;
      }));

      toast.success(`Cleaned up records older than ${CLEANUP_THRESHOLD_DAYS} days`);
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Cleanup failed');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case "weather":
        return Wind;
      case "nuclear":
        return Flame;
      case "seismic":
        return Mountain;
      default:
        return AlertTriangle;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const filteredAnomalies = useMemo(() => {
    if (selectedCategory === "all") return anomalies;
    return anomalies.filter(a => a.anomaly_type.toLowerCase() === selectedCategory);
  }, [anomalies, selectedCategory]);

  const stats = useMemo(() => ({
    total: anomalies.length,
    active: anomalies.filter(a => a.status === 'active').length,
    resolved: anomalies.filter(a => a.status === 'resolved').length,
    critical: anomalies.filter(a => a.severity === 'critical' || a.severity === 'extreme').length,
  }), [anomalies]);

  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Anomaly <span className="text-primary">History</span>
            </h1>
            <p className="text-muted-foreground">
              Historical environmental events and phenomena • Auto-cleanup after {CLEANUP_THRESHOLD_DAYS} days
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { label: "Total Records", value: stats.total, color: "text-primary" },
              { label: "Active", value: stats.active, color: "text-green-400" },
              { label: "Resolved", value: stats.resolved, color: "text-muted-foreground" },
              { label: "Critical", value: stats.critical, color: "text-red-400" },
            ].map((stat, i) => (
              <Card key={i} className="glass-panel p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-panel p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4 text-foreground">View Mode</h3>
                <div className="space-y-2 mb-6">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4 mr-2" />
                    List View
                  </Button>
                  <Button
                    variant={viewMode === "timeline" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setViewMode("timeline")}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Timeline
                  </Button>
                </div>
                
                <h3 className="text-lg font-bold mb-4 text-foreground">Categories</h3>
                <div className="space-y-2 mb-6">
                  {["all", "weather", "seismic", "nuclear", "unexplained"].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      className="w-full justify-start capitalize"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                <h3 className="text-lg font-bold mb-4 text-foreground">Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={fetchAnomalies}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
                    onClick={cleanupOldRecords}
                    disabled={isCleaningUp}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isCleaningUp ? 'Cleaning...' : 'Cleanup Old'}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Content */}
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {viewMode === "timeline" ? (
                loading ? (
                  <Card className="glass-panel p-8 text-center">
                    <p className="text-muted-foreground">Loading anomalies...</p>
                  </Card>
                ) : filteredAnomalies.length === 0 ? (
                  <Card className="glass-panel p-8 text-center">
                    <p className="text-muted-foreground">No anomalies found</p>
                  </Card>
                ) : (
                  <TimelineView anomalies={filteredAnomalies} />
                )
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <Card className="glass-panel p-8 text-center">
                      <p className="text-muted-foreground">Loading anomalies...</p>
                    </Card>
                  ) : filteredAnomalies.length === 0 ? (
                    <Card className="glass-panel p-8 text-center">
                      <p className="text-muted-foreground">No anomalies found</p>
                    </Card>
                  ) : (
                    filteredAnomalies.map((anomaly, index) => {
                      const Icon = getIconForType(anomaly.anomaly_type);
                      const isExpanded = expandedId === anomaly.id;

                      return (
                        <motion.div
                          key={anomaly.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className="glass-panel p-6 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-xl font-bold text-foreground">{anomaly.name}</h3>
                                  {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-primary" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    📅 {formatDate(anomaly.detected_at)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {getTimeAgo(anomaly.detected_at)}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    📍 {anomaly.latitude.toFixed(2)}, {anomaly.longitude.toFixed(2)}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    className={
                                      anomaly.severity === "extreme" || anomaly.severity === "critical"
                                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                                        : anomaly.severity === "high"
                                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                        : anomaly.severity === "medium"
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    }
                                  >
                                    {anomaly.severity}
                                  </Badge>
                                  <Badge variant="outline">
                                    {anomaly.status}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {anomaly.anomaly_type}
                                  </Badge>
                                </div>

                                {isExpanded && (
                                  <motion.div 
                                    className="mt-4 space-y-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                  >
                                    <p className="text-muted-foreground">{anomaly.description}</p>
                                    {anomaly.metadata?.recommendation && (
                                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <p className="text-sm font-semibold text-foreground">Recommendation:</p>
                                        <p className="text-sm text-muted-foreground">{anomaly.metadata.recommendation}</p>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default History;
