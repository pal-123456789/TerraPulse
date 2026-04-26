import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Home, Award, Activity, BookOpen, Bell, Calendar, MapPin, Mail, Shield, TrendingUp, Clock, FileText, AlertTriangle, Eye, Globe, Settings, LogOut, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AvatarUploader from "@/components/Profile/AvatarUploader";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userProvider, setUserProvider] = useState("");
  const [lastSignIn, setLastSignIn] = useState("");
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    bio: "",
    location: "",
    avatar_url: "",
  });
  const [userStats, setUserStats] = useState({
    coursesCompleted: 0,
    totalProgress: 0,
    reportsSubmitted: 0,
    anomaliesViewed: 0,
    alertsReceived: 0,
    commentsPosted: 0,
    coursesInProgress: 0,
    memberSince: "",
  });
  const [recentActivity, setRecentActivity] = useState<Array<{ type: string; title: string; time: string; icon: string }>>([]);

  useEffect(() => {
    fetchProfile();
    fetchUserStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setUserEmail(user.email || "");
      setUserProvider(user.app_metadata?.provider || "email");
      setLastSignIn(user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          bio: data.bio || "",
          location: data.location || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [progressRes, reportsRes, alertsRes, commentsRes, notificationsRes] = await Promise.all([
        supabase.from("user_course_progress").select("*").eq("user_id", user.id),
        supabase.from("user_reports").select("id, report_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("email_alert_logs").select("id, anomaly_name, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("comments").select("id, content, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("notifications").select("id, title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const progressData = progressRes.data;
      const reportsData = reportsRes.data;
      const alertsData = alertsRes.data;
      const commentsData = commentsRes.data;

      const completedCourses = progressData?.filter(p => p.progress === 100).length || 0;
      const inProgressCourses = progressData?.filter(p => p.progress > 0 && p.progress < 100).length || 0;
      const avgProgress = progressData?.length
        ? Math.round(progressData.reduce((sum, p) => sum + p.progress, 0) / progressData.length)
        : 0;

      setUserStats({
        coursesCompleted: completedCourses,
        coursesInProgress: inProgressCourses,
        totalProgress: avgProgress,
        reportsSubmitted: reportsData?.length || 0,
        anomaliesViewed: (notificationsRes.data?.length || 0) + (alertsData?.length || 0),
        alertsReceived: alertsData?.length || 0,
        commentsPosted: commentsData?.length || 0,
        memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown",
      });

      // Build recent activity timeline
      const activities: Array<{ type: string; title: string; time: string; icon: string }> = [];
      reportsData?.slice(0, 3).forEach(r => {
        activities.push({ type: "report", title: `Submitted ${r.report_type} report`, time: new Date(r.created_at).toLocaleDateString(), icon: "report" });
      });
      alertsData?.slice(0, 3).forEach(a => {
        activities.push({ type: "alert", title: `Alert: ${a.anomaly_name}`, time: new Date(a.created_at).toLocaleDateString(), icon: "alert" });
      });
      commentsData?.slice(0, 3).forEach(c => {
        activities.push({ type: "comment", title: `Posted a comment`, time: new Date(c.created_at).toLocaleDateString(), icon: "comment" });
      });
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const achievements = useMemo(() => [
    { title: "First Steps", description: "Complete your first lesson", unlocked: userStats.totalProgress > 0, icon: BookOpen },
    { title: "Explorer", description: "Receive 5+ anomaly alerts", unlocked: userStats.anomaliesViewed >= 5, icon: MapPin },
    { title: "Reporter", description: "Submit your first report", unlocked: userStats.reportsSubmitted > 0, icon: Activity },
    { title: "Scholar", description: "Complete a course", unlocked: userStats.coursesCompleted > 0, icon: Award },
    { title: "Watchdog", description: "Receive 10+ email alerts", unlocked: userStats.alertsReceived >= 10, icon: Bell },
    { title: "Contributor", description: "Post 5+ comments", unlocked: userStats.commentsPosted >= 5, icon: FileText },
  ], [userStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          location: profile.location,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  /**
   * "Delete Account" — sign the user out everywhere and clear local app state,
   * but DO NOT remove their data from the database (per product decision).
   */
  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "This will sign you out of TerraGuardians on all devices and clear local data.\n\n" +
      "Your profile and history will remain in our database and can be restored by signing back in.\n\n" +
      "Continue?"
    );
    if (!confirmed) return;
    try {
      await supabase.auth.signOut({ scope: "global" });
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") || k.startsWith("tg-"))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* ignore */ }
      toast.success("Account session deleted. You have been signed out.");
      navigate("/");
    } catch (err: any) {
      console.error("Delete account error:", err);
      toast.error(err?.message || "Failed to delete account session");
    }
  };
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "report": return <FileText className="w-4 h-4 text-blue-400" />;
      case "alert": return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case "comment": return <Activity className="w-4 h-4 text-green-400" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-space-gradient">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Profile Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-panel border-primary/20 mb-6 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
                <div className="px-6 pb-6 -mt-12">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <AvatarUploader
                      userId={userId}
                      currentUrl={profile.avatar_url}
                      fallback={profile.full_name ? getInitials(profile.full_name) : <User className="w-10 h-10" />}
                      onUploaded={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
                    />
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-foreground">{profile.full_name || "Guardian"}</h1>
                      <p className="text-muted-foreground">{profile.username ? `@${profile.username}` : "Set your username"}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {profile.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{userEmail}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {userStats.memberSince}</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          <Shield className="w-3 h-3 mr-1" />
                          {userProvider === "google" ? "Google" : "Email"} Account
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/settings">
                        <Button variant="outline" size="sm" className="glass-panel">
                          <Settings className="w-4 h-4 mr-1" /> Settings
                        </Button>
                      </Link>
                      <Link to="/">
                        <Button variant="outline" size="icon" className="glass-panel">
                          <Home className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="mt-4 text-sm text-muted-foreground max-w-2xl">{profile.bio}</p>
                  )}
                </div>
              </Card>
            </motion.div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="glass-panel grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: BookOpen, value: userStats.coursesCompleted, label: "Courses Done", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                    { icon: Activity, value: userStats.reportsSubmitted, label: "Reports", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                    { icon: Bell, value: userStats.alertsReceived, label: "Alerts", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                    { icon: FileText, value: userStats.commentsPosted, label: "Comments", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className={`glass-panel p-4 text-center border ${stat.bg}`}>
                        <stat.icon className={`w-7 h-7 ${stat.color} mx-auto mb-2`} />
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Learning Progress */}
                  <Card className="glass-panel border-primary/20 p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> Learning Progress
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Overall Progress</span>
                          <span className="text-foreground font-medium">{userStats.totalProgress}%</span>
                        </div>
                        <Progress value={userStats.totalProgress} className="h-3" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Courses in Progress</span>
                        <span className="text-foreground font-medium">{userStats.coursesInProgress}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Courses Completed</span>
                        <span className="text-foreground font-medium">{userStats.coursesCompleted}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Account Info */}
                  <Card className="glass-panel border-primary/20 p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" /> Account Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-foreground">{userEmail}</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auth Provider</span>
                        <Badge variant="outline" className="border-primary/30 text-primary capitalize">{userProvider}</Badge>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Sign In</span>
                        <span className="text-foreground text-xs">{lastSignIn}</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Member Since</span>
                        <span className="text-foreground">{userStats.memberSince}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Edit Profile Tab */}
              <TabsContent value="edit">
                <Card className="glass-panel border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">Edit Profile</CardTitle>
                    <CardDescription>Update your public profile information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-foreground">Username</Label>
                          <Input id="username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="Enter your username" className="bg-background/50 border-border focus:border-primary transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-foreground">Full Name</Label>
                          <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Enter your full name" className="bg-background/50 border-border focus:border-primary transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-foreground">Location</Label>
                        <Input id="location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Enter your location" className="bg-background/50 border-border focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-foreground">Bio</Label>
                        <Textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself and your interests in environmental science..." rows={4} className="bg-background/50 border-border focus:border-primary transition-colors resize-none" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar_url" className="text-foreground">Avatar URL (optional)</Label>
                        <Input id="avatar_url" value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="Or paste an image URL — easier: use the camera button on your photo above" className="bg-background/50 border-border focus:border-primary transition-colors" />
                      </div>
                      <Button type="submit" disabled={saving} className="w-full group relative overflow-hidden" size="lg">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : "Save Changes"}
                        </span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <Card className="glass-panel border-primary/20 p-6">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Recent Activity
                  </h3>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No recent activity yet.</p>
                      <p className="text-sm mt-1">Start exploring, submitting reports, or taking courses!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentActivity.map((activity, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <Separator className="my-6 bg-border/50" />
                  <div className="flex gap-3">
                    <Link to="/alert-history">
                      <Button variant="outline" size="sm" className="glass-panel">
                        <Bell className="w-4 h-4 mr-1" /> View Alert History
                      </Button>
                    </Link>
                    <Link to="/history">
                      <Button variant="outline" size="sm" className="glass-panel">
                        <Eye className="w-4 h-4 mr-1" /> View Full History
                      </Button>
                    </Link>
                  </div>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements">
                <Card className="glass-panel border-primary/20 p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> Achievements
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => {
                      const Icon = achievement.icon;
                      return (
                        <motion.div
                          key={achievement.title}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border ${
                            achievement.unlocked
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-muted/10 border-border/50 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              achievement.unlocked ? 'bg-primary/20' : 'bg-muted/20'
                            }`}>
                              <Icon className={`w-6 h-6 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{achievement.title}</p>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                            {achievement.unlocked && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Unlocked</Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card className="glass-panel border-destructive/30 p-6">
                <h3 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Delete your account session. You will be signed out everywhere and your local data cleared.
                  Your historical data is preserved in our database and can be restored by signing back in.
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount} className="gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
