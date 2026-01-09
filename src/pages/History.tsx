import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Wind, Flame, Mountain, HelpCircle, List, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import TimelineView from "@/components/TimelineView";
import Footer from "@/components/Footer";

const History = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      const { data, error } = await supabase
        .from("anomalies")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching anomalies:", error);
        return;
      }

      // Combine database anomalies with historical ones
      const historicalAnomalies = [
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

      setAnomalies([...historicalAnomalies, ...(data || [])]);
    } catch (error) {
      console.error("Error fetching anomalies:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-space-gradient">
      <Navigation />

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Previous <span className="text-primary">Anomalies</span>
            </h1>
            <p className="text-muted-foreground">Historical environmental events and phenomena</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
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
                <div className="space-y-2">
                  {["all", "weather", "seismic", "nuclear", "unexplained"].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Anomalies Content */}
            <div className="lg:col-span-3">{viewMode === "timeline" ? (
                loading ? (
                  <Card className="glass-panel p-8 text-center">
                    <p className="text-muted-foreground">Loading anomalies...</p>
                  </Card>
                ) : anomalies.length === 0 ? (
                  <Card className="glass-panel p-8 text-center">
                    <p className="text-muted-foreground">No anomalies found</p>
                  </Card>
                ) : (
                  <TimelineView
                    anomalies={anomalies.filter((anomaly) =>
                      selectedCategory === "all" ||
                      anomaly.anomaly_type.toLowerCase() === selectedCategory
                    )}
                  />
                )
              ) : (
                <div className="space-y-4">
              {loading ? (
                <Card className="glass-panel p-8 text-center">
                  <p className="text-muted-foreground">Loading anomalies...</p>
                </Card>
              ) : anomalies.length === 0 ? (
                <Card className="glass-panel p-8 text-center">
                  <p className="text-muted-foreground">No anomalies found</p>
                </Card>
              ) : (
                anomalies
                  .filter((anomaly) =>
                    selectedCategory === "all" ||
                    anomaly.anomaly_type.toLowerCase() === selectedCategory
                  )
                  .map((anomaly) => {
                    const Icon = getIconForType(anomaly.anomaly_type);
                    const isExpanded = expandedId === anomaly.id;

                    return (
                      <Card
                        key={anomaly.id}
                        className="glass-panel p-6 hover:glow-border transition-all duration-300 cursor-pointer"
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

                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                📅 {formatDate(anomaly.detected_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                📍 {anomaly.latitude.toFixed(2)}, {anomaly.longitude.toFixed(2)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded ${
                                  anomaly.severity === "extreme"
                                    ? "bg-red-500/20 text-red-400"
                                    : anomaly.severity === "critical"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : anomaly.severity === "high"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {anomaly.severity}
                              </span>
                              <span className="px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                                {anomaly.status}
                              </span>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 space-y-2">
                                <p className="text-muted-foreground">{anomaly.description}</p>
                                {anomaly.metadata?.recommendation && (
                                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <p className="text-sm font-semibold text-foreground">Recommendation:</p>
                                    <p className="text-sm text-muted-foreground">{anomaly.metadata.recommendation}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
              )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default History;
