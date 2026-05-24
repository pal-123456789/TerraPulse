import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Lock, Mail, Shield, User, Home, Moon, Sun, Volume2, VolumeX, Palette, Globe, Zap, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion } from "framer-motion";
import { useHighContrast } from "@/hooks/useHighContrast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [highContrast, setHighContrast] = useHighContrast();
  const [monitoredLat, setMonitoredLat] = useState("");
  const [monitoredLon, setMonitoredLon] = useState("");
  const [monitoringRadius, setMonitoringRadius] = useState("500");
  const [minSeverity, setMinSeverity] = useState("medium");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const { isSupported, isEnabled, requestPermission } = usePushNotifications();

  useEffect(() => {
    fetchUserAndPreferences();
  }, []);

  const fetchUserAndPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
      
      // Fetch notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefs) {
        setEmailNotifications(prefs.email_notifications_enabled);
        setNotificationEmail(prefs.notification_email || "");
        setMonitoredLat(prefs.monitored_latitude?.toString() || "");
        setMonitoredLon(prefs.monitored_longitude?.toString() || "");
        setMonitoringRadius(prefs.monitoring_radius_km?.toString() || "500");
        setMinSeverity(prefs.min_severity || "medium");
      }
    }
    setLoadingPrefs(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  const handleEnablePushNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      setPushNotifications(true);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMonitoredLat(pos.coords.latitude.toFixed(4));
        setMonitoredLon(pos.coords.longitude.toFixed(4));
        toast.success("Location set!");
      },
      () => toast.error("Failed to get location")
    );
  };

  const saveSettings = async () => {
    setSavingPrefs(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const prefData = {
        user_id: user.id,
        email_notifications_enabled: emailNotifications,
        notification_email: notificationEmail || null,
        monitored_latitude: monitoredLat ? parseFloat(monitoredLat) : null,
        monitored_longitude: monitoredLon ? parseFloat(monitoredLon) : null,
        monitoring_radius_km: parseInt(monitoringRadius) || 500,
        min_severity: minSeverity,
      };

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(prefData, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-space-gradient">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">
                  <span className="text-primary text-glow">Settings</span>
                </h1>
                <p className="text-muted-foreground">Manage your preferences and account</p>
              </div>
              <Link to="/">
                <Button variant="outline" size="icon" className="glass-panel">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
            </div>

          <div className="space-y-6">
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="glass-panel grid w-full grid-cols-4">
                <TabsTrigger value="account" className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Display</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass-panel border-primary/20 glow-border-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground">Account</CardTitle>
                          <CardDescription>Manage your account settings</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-background/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-primary" />
                          <Label className="text-foreground">Email Address</Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{userEmail}</p>
                      </div>
                      <Separator className="bg-border/50" />
                      <Button
                        variant="outline"
                        className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="notifications">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Email Notifications Card */}
                  <Card className="glass-panel border-primary/20 glow-border-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground">Email Alerts</CardTitle>
                          <CardDescription>Get anomaly alerts sent to your email (SendGrid)</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="email-notifications" className="text-foreground cursor-pointer">
                            Email Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive anomaly alerts via email when background scans detect issues
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>

                      {emailNotifications && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-foreground">Notification Email (optional, defaults to account email)</Label>
                            <Input
                              type="email"
                              placeholder={userEmail || "your@email.com"}
                              value={notificationEmail}
                              onChange={(e) => setNotificationEmail(e.target.value)}
                              className="bg-background/50 border-border/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-foreground">Minimum Alert Severity</Label>
                            <Select value={minSeverity} onValueChange={setMinSeverity}>
                              <SelectTrigger className="bg-background/50 border-border/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">🟢 Low & above</SelectItem>
                                <SelectItem value="medium">🟡 Medium & above</SelectItem>
                                <SelectItem value="high">🟠 High & above</SelectItem>
                                <SelectItem value="extreme">🔴 Extreme only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator className="bg-border/50" />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Monitored Location
                              </Label>
                              <Button variant="outline" size="sm" onClick={useCurrentLocation}>
                                <Globe className="w-3 h-3 mr-1" />
                                Use My Location
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Latitude</Label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  min="-90"
                                  max="90"
                                  placeholder="e.g. 40.7128"
                                  value={monitoredLat}
                                  onChange={(e) => setMonitoredLat(e.target.value)}
                                  className="bg-background/50 border-border/50"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Longitude</Label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  min="-180"
                                  max="180"
                                  placeholder="e.g. -74.0060"
                                  value={monitoredLon}
                                  onChange={(e) => setMonitoredLon(e.target.value)}
                                  className="bg-background/50 border-border/50"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Monitoring Radius (km)</Label>
                              <Input
                                type="number"
                                min="10"
                                max="5000"
                                value={monitoringRadius}
                                onChange={(e) => setMonitoringRadius(e.target.value)}
                                className="bg-background/50 border-border/50"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Browser Push & Sound */}
                  <Card className="glass-panel border-primary/20 glow-border-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground">Browser Notifications</CardTitle>
                          <CardDescription>Configure push and sound preferences</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="push-notifications" className="text-foreground cursor-pointer">
                            Browser Push Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {isSupported
                              ? isEnabled
                                ? "Push notifications are enabled"
                                : "Enable browser notifications for real-time alerts"
                              : "Not supported in this browser"}
                          </p>
                        </div>
                        {isSupported && !isEnabled ? (
                          <Button variant="outline" size="sm" onClick={handleEnablePushNotifications}>
                            Enable
                          </Button>
                        ) : (
                          <Switch id="push-notifications" checked={isEnabled} disabled={!isSupported} />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="sound-enabled" className="text-foreground cursor-pointer">
                            Sound Effects
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Play sounds for notifications and alerts
                          </p>
                        </div>
                        <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="appearance">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass-panel border-primary/20 glow-border-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Palette className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground">Appearance</CardTitle>
                          <CardDescription>Customize your visual experience</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="high-contrast" className="text-foreground cursor-pointer">High Contrast Mode</Label>
                          <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                        </div>
                        <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="auto-refresh" className="text-foreground cursor-pointer">Auto-Refresh Data</Label>
                          <p className="text-sm text-muted-foreground">Automatically refresh dashboard data</p>
                        </div>
                        <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="privacy">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass-panel border-primary/20 glow-border-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground">Privacy & Data</CardTitle>
                          <CardDescription>Control your data preferences</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="data-sharing" className="text-foreground cursor-pointer">Anonymous Data Sharing</Label>
                          <p className="text-sm text-muted-foreground">Help improve the platform by sharing usage data</p>
                        </div>
                        <Switch id="data-sharing" checked={dataSharing} onCheckedChange={setDataSharing} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>

            <Button onClick={saveSettings} className="w-full group relative overflow-hidden" size="lg" disabled={savingPrefs}>
              {savingPrefs ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="relative z-10">Save Settings</span>
                  <div className="absolute inset-0 bg-glow-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </ProtectedRoute>
  );
};

export default Settings;
