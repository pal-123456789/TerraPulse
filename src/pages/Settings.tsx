import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Lock, Mail, Shield, User, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  const saveSettings = () => {
    toast.success("Settings saved successfully");
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
            {/* Account Settings */}
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

            {/* Notification Settings */}
            <Card className="glass-panel border-primary/20 glow-border-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Notifications</CardTitle>
                    <CardDescription>Configure notification preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="email-notifications" className="text-foreground cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates and alerts via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="push-notifications" className="text-foreground cursor-pointer">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get real-time alerts in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
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
                    <Label htmlFor="data-sharing" className="text-foreground cursor-pointer">
                      Anonymous Data Sharing
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the platform by sharing usage data
                    </p>
                  </div>
                  <Switch
                    id="data-sharing"
                    checked={dataSharing}
                    onCheckedChange={setDataSharing}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveSettings} className="w-full group relative overflow-hidden" size="lg">
              <span className="relative z-10">Save Settings</span>
              <div className="absolute inset-0 bg-glow-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
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
