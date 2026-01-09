import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Loader2, Home } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>();
  const [allNotifications, setAllNotifications] = useState<any[]>([]);

  const { notifications: realtimeNotifications, markAsRead, markAllAsRead } = useRealtimeNotifications(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchAllNotifications(user.id);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const fetchAllNotifications = async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    
    setAllNotifications(data || []);
  };

  // Merge real-time unread notifications with all notifications
  useEffect(() => {
    if (!userId) return;
    
    // Update all notifications when real-time data changes
    setAllNotifications(prev => {
      const unreadIds = new Set(realtimeNotifications.map(n => n.id));
      return prev.map(n => 
        unreadIds.has(n.id) ? { ...n, is_read: false } : n
      );
    });
  }, [realtimeNotifications, userId]);

  const getNotificationIcon = (type: string) => {
    return <Bell className="w-5 h-5" />;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "alert":
        return "destructive";
      case "info":
        return "default";
      case "success":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = allNotifications.filter((n) => !n.is_read).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-space-gradient">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold">Notifications</h1>
                <p className="text-muted-foreground mt-2">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "All caught up!"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} variant="outline" size="sm">
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
                <Link to="/">
                  <Button variant="outline" size="icon" className="glass-panel">
                    <Home className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>

        {allNotifications.length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                You'll be notified about important updates here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {allNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`glass-panel transition-all ${
                  !notification.is_read ? "border-primary/50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-2 rounded-full ${!notification.is_read ? "bg-primary/20" : "bg-card"}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge variant={getNotificationColor(notification.type)} className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    <Footer />
    </div>
    </ProtectedRoute>
  );
};

export default Notifications;
