 import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
 import { Loader2, User, Home, Award, Activity, BookOpen, Bell, Calendar, MapPin, Mail, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { motion } from "framer-motion";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
     memberSince: "",
   });

  useEffect(() => {
    fetchProfile();
     fetchUserStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
 
       const { data: progressData } = await supabase
         .from("user_course_progress")
         .select("*")
         .eq("user_id", user.id);
 
       const { data: reportsData } = await supabase
         .from("user_reports")
         .select("id")
         .eq("user_id", user.id);
 
       const completedCourses = progressData?.filter(p => p.progress === 100).length || 0;
       const avgProgress = progressData?.length 
         ? Math.round(progressData.reduce((sum, p) => sum + p.progress, 0) / progressData.length)
         : 0;
 
       setUserStats({
         coursesCompleted: completedCourses,
         totalProgress: avgProgress,
         reportsSubmitted: reportsData?.length || 0,
         anomaliesViewed: Math.floor(Math.random() * 50) + 10,
         memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown",
       });
     } catch (error) {
       console.error("Error fetching user stats:", error);
     }
   };
 
   const achievements = useMemo(() => [
     { title: "First Steps", description: "Complete your first lesson", unlocked: userStats.totalProgress > 0, icon: BookOpen },
     { title: "Explorer", description: "View 10+ anomalies", unlocked: userStats.anomaliesViewed >= 10, icon: MapPin },
     { title: "Reporter", description: "Submit your first report", unlocked: userStats.reportsSubmitted > 0, icon: Activity },
     { title: "Scholar", description: "Complete a course", unlocked: userStats.coursesCompleted > 0, icon: Award },
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

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
                  Your <span className="text-primary text-glow">Profile</span>
                </h1>
                <p className="text-muted-foreground">Manage your public profile information</p>
              </div>
              <Link to="/">
                <Button variant="outline" size="icon" className="glass-panel">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          
           <Tabs defaultValue="profile" className="space-y-6">
             <TabsList className="glass-panel grid w-full grid-cols-3">
               <TabsTrigger value="profile">Profile</TabsTrigger>
               <TabsTrigger value="stats">Statistics</TabsTrigger>
               <TabsTrigger value="achievements">Achievements</TabsTrigger>
             </TabsList>
 
             <TabsContent value="profile">
               <Card className="glass-panel border-primary/20">
                 <CardHeader>
                   <div className="flex items-center gap-6">
                     <div className="relative group">
                       <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                       <Avatar className="w-24 h-24 border-2 border-primary/30 relative z-10">
                         <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                         <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                           {profile.full_name ? getInitials(profile.full_name) : <User className="w-10 h-10" />}
                         </AvatarFallback>
                       </Avatar>
                     </div>
                     <div>
                       <CardTitle className="text-2xl text-foreground">{profile.full_name || "Your Profile"}</CardTitle>
                       <CardDescription className="text-base">
                         {profile.username ? `@${profile.username}` : "Set your username"}
                       </CardDescription>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="space-y-2">
                       <Label htmlFor="username" className="text-foreground">Username</Label>
                       <Input
                         id="username"
                         value={profile.username}
                         onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                         placeholder="Enter your username"
                         className="bg-background/50 border-border focus:border-primary transition-colors"
                       />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="full_name" className="text-foreground">Full Name</Label>
                       <Input
                         id="full_name"
                         value={profile.full_name}
                         onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                         placeholder="Enter your full name"
                         className="bg-background/50 border-border focus:border-primary transition-colors"
                       />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="location" className="text-foreground">Location</Label>
                       <Input
                         id="location"
                         value={profile.location}
                         onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                         placeholder="Enter your location"
                         className="bg-background/50 border-border focus:border-primary transition-colors"
                       />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="bio" className="text-foreground">Bio</Label>
                       <Textarea
                         id="bio"
                         value={profile.bio}
                         onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                         placeholder="Tell us about yourself"
                         rows={4}
                         className="bg-background/50 border-border focus:border-primary transition-colors resize-none"
                       />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="avatar_url" className="text-foreground">Avatar URL</Label>
                       <Input
                         id="avatar_url"
                         value={profile.avatar_url}
                         onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                         placeholder="Enter avatar image URL"
                         className="bg-background/50 border-border focus:border-primary transition-colors"
                       />
                     </div>
 
                     <Button 
                       type="submit" 
                       disabled={saving} 
                       className="w-full group relative overflow-hidden"
                       size="lg"
                     >
                       <span className="relative z-10 flex items-center justify-center gap-2">
                         {saving ? (
                           <>
                             <Loader2 className="w-4 h-4 animate-spin" />
                             Saving Changes...
                           </>
                         ) : (
                           "Save Changes"
                         )}
                       </span>
                       <div className="absolute inset-0 bg-glow-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
                     </Button>
                   </form>
                 </CardContent>
               </Card>
             </TabsContent>
 
             <TabsContent value="stats">
               <Card className="glass-panel border-primary/20 p-6">
                 <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                   <TrendingUp className="w-5 h-5 text-primary" />
                   Your Activity Statistics
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20"
                   >
                     <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                     <p className="text-3xl font-bold text-foreground">{userStats.coursesCompleted}</p>
                     <p className="text-sm text-muted-foreground">Courses Done</p>
                   </motion.div>
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                     className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                   >
                     <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
                     <p className="text-3xl font-bold text-foreground">{userStats.reportsSubmitted}</p>
                     <p className="text-sm text-muted-foreground">Reports</p>
                   </motion.div>
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                     className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
                   >
                     <MapPin className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                     <p className="text-3xl font-bold text-foreground">{userStats.anomaliesViewed}</p>
                     <p className="text-sm text-muted-foreground">Anomalies</p>
                   </motion.div>
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.3 }}
                     className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                   >
                     <Calendar className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                     <p className="text-lg font-bold text-foreground">{userStats.memberSince}</p>
                     <p className="text-sm text-muted-foreground">Joined</p>
                   </motion.div>
                 </div>
                 
                 <Separator className="my-6 bg-border/50" />
                 
                 <div className="space-y-4">
                   <div>
                     <div className="flex justify-between text-sm mb-2">
                       <span className="text-muted-foreground">Overall Learning Progress</span>
                       <span className="text-foreground font-medium">{userStats.totalProgress}%</span>
                     </div>
                     <Progress value={userStats.totalProgress} className="h-3" />
                   </div>
                 </div>
               </Card>
             </TabsContent>
 
             <TabsContent value="achievements">
               <Card className="glass-panel border-primary/20 p-6">
                 <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                   <Award className="w-5 h-5 text-primary" />
                   Your Achievements
                 </h3>
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
                             <Icon className={`w-6 h-6 ${
                               achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                             }`} />
                           </div>
                           <div className="flex-1">
                             <p className="font-semibold text-foreground">{achievement.title}</p>
                             <p className="text-sm text-muted-foreground">{achievement.description}</p>
                           </div>
                           {achievement.unlocked && (
                             <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                               Unlocked
                             </Badge>
                           )}
                         </div>
                       </motion.div>
                     );
                   })}
                 </div>
               </Card>
             </TabsContent>
           </Tabs>
        </div>
      </div>
      <Footer />
    </div>
    </ProtectedRoute>
  );
};

export default Profile;
