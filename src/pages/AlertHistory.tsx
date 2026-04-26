import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Home, Loader2, History, MapPin, AlertTriangle, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

interface EmailAlertLog {
  id: string;
  anomaly_name: string;
  anomaly_type: string | null;
  severity: string | null;
  latitude: number | null;
  longitude: number | null;
  email_sent_to: string;
  subject: string | null;
  status: string;
  created_at: string;
}

const AlertHistory = () => {
  const [logs, setLogs] = useState<EmailAlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("email_alert_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setLogs(data as EmailAlertLog[]);
    setLoading(false);
  };

  const filteredLogs = severityFilter === "all"
    ? logs
    : logs.filter(l => l.severity === severityFilter);

  const getSeverityBadge = (severity: string | null) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      low: { variant: "secondary", label: "🟢 Low" },
      medium: { variant: "default", label: "🟡 Medium" },
      high: { variant: "default", label: "🟠 High" },
      extreme: { variant: "destructive", label: "🔴 Extreme" },
      critical: { variant: "destructive", label: "🔴 Critical" },
    };
    const entry = map[severity || ""] || { variant: "outline" as const, label: severity || "Unknown" };
    return <Badge variant={entry.variant} className="text-xs">{entry.label}</Badge>;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-space-gradient">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    <span className="text-primary text-glow">Alert History</span>
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    All email alerts sent to your inbox
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/settings">
                    <Button variant="outline" size="sm" className="glass-panel">
                      <Mail className="w-4 h-4 mr-2" /> Settings
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" size="icon" className="glass-panel">
                      <Home className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats summary */}
              {!loading && logs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Alerts", value: logs.length, icon: Mail },
                    { label: "Extreme", value: logs.filter(l => l.severity === "extreme" || l.severity === "critical").length, icon: AlertTriangle },
                    { label: "High", value: logs.filter(l => l.severity === "high").length, icon: AlertTriangle },
                    { label: "This Week", value: logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000)).length, icon: History },
                  ].map((stat) => (
                    <Card key={stat.label} className="glass-panel border-primary/10">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center">
                          <stat.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Filter */}
              <div className="flex items-center gap-3 mb-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48 bg-background/50 border-border/50">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="extreme">🔴 Extreme</SelectItem>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  {filteredLogs.length} alert{filteredLogs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <Card className="glass-panel">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Mail className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No email alerts yet</p>
                    <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                      Enable email notifications in{" "}
                      <Link to="/settings" className="text-primary hover:underline">Settings → Alerts</Link>{" "}
                      to start receiving anomaly alerts.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-panel border-primary/10">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Anomaly</TableHead>
                          <TableHead className="text-muted-foreground">Severity</TableHead>
                          <TableHead className="text-muted-foreground hidden md:table-cell">Location</TableHead>
                          <TableHead className="text-muted-foreground hidden sm:table-cell">Sent To</TableHead>
                          <TableHead className="text-muted-foreground text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log, i) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-border/20 hover:bg-primary/5 transition-colors"
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{log.anomaly_name}</p>
                                {log.anomaly_type && (
                                  <p className="text-xs text-muted-foreground">{log.anomaly_type}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {log.latitude && log.longitude ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {Number(log.latitude).toFixed(2)}°, {Number(log.longitude).toFixed(2)}°
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="text-xs text-muted-foreground">{log.email_sent_to}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <p className="text-xs text-foreground">
                                  {format(new Date(log.created_at), "MMM d, yyyy")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(log.created_at), "h:mm a")}
                                </p>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AlertHistory;
