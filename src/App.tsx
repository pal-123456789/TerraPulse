import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { initHighContrast } from "@/hooks/useHighContrast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import QuickActions from "@/components/QuickActions";
import ChatButton from "@/components/Chat/ChatButton";

import LiveNotifications from "@/components/LiveNotifications";

// Apply high-contrast preference before first paint
initHighContrast();


// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const History = lazy(() => import("./pages/History"));
const AnalyticsHub = lazy(() => import("./pages/AnalyticsHub"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Learn = lazy(() => import("./pages/Learn"));
const MapExplorer = lazy(() => import("./pages/MapExplorer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const AlertHistory = lazy(() => import("./pages/AlertHistory"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-space-gradient flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-primary text-sm font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// Routes where the floating "+" QuickActions and ChatButton should NOT appear
const HIDE_FLOATING_ON = new Set<string>(["/privacy", "/terms"]);

const FloatingLayer = () => {
  const { pathname } = useLocation();
  const hidden = HIDE_FLOATING_ON.has(pathname) || pathname === "*";
  if (hidden) return null;
  return (
    <>
      <LiveNotifications />
      <QuickActions />
      <ChatButton />
      
    </>
  );
};

const AppContent = () => {
  useLenisScroll();

  // Preload Globe3D after first paint so it's ready before users scroll/interact
  useEffect(() => {
    const t = setTimeout(() => {
      import("./components/Globe3D").catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/map" element={<MapExplorer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          {/* Public routes */}
          <Route path="/analytics" element={<AnalyticsHub />} />
          <Route path="/about" element={<About />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/alert-history" element={<AlertHistory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <FloatingLayer />
    </>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
