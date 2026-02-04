import { Link } from "react-router-dom";
import { ArrowRight, Zap, Globe2, TrendingUp, BarChart3, Satellite, Brain, Activity, Sparkles, Shield, Waves, Map, Star, Rocket, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { lazy, Suspense, memo } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RealtimeStats from "@/components/RealtimeStats";
import ChatButton from "@/components/Chat/ChatButton";
import LiveNotifications from "@/components/LiveNotifications";
import QuickActions from "@/components/QuickActions";
import SearchBar from "@/components/SearchBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { StatCard } from "@/components/ui/StatCard";

// Lazy load heavy components
const Globe3D = lazy(() => import("@/components/Globe3D"));
const HeroScene = lazy(() => import("@/components/3D/HeroScene"));
const SatelliteTracker = lazy(() => import("@/components/SatelliteTracker"));
const AIPredictor = lazy(() => import("@/components/AIPredictor"));
const DataStreamMonitor = lazy(() => import("@/components/DataStreamMonitor"));
const ParticleField = lazy(() => import("@/components/3D/ParticleField"));

// Memoized feature card
const FeatureCard = memo(({ icon: Icon, title, description, color, stat, statLabel, delay }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  stat: string;
  statLabel: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="h-full"
  >
    <GlassCard variant="ultra" className="p-6 md:p-8 h-full group" glow>
      <div className="relative z-10">
        <motion.div 
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 relative"
          style={{ 
            background: `linear-gradient(135deg, ${color}30, ${color}10)`,
            boxShadow: `0 0 30px ${color}20`
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </motion.div>
        <h3 className="text-lg md:text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
        <div className="mt-4 flex items-center gap-2 text-xs" style={{ color }}>
          <motion.div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="font-medium">{stat}: {statLabel}</span>
        </div>
      </div>
    </GlassCard>
  </motion.div>
));

FeatureCard.displayName = "FeatureCard";

// Capability card
const CapabilityCard = memo(({ icon: Icon, label, desc, color, index }: {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
    viewport={{ once: true }}
    whileHover={{ y: -5, scale: 1.03 }}
  >
    <GlassCard className="p-4 md:p-6 text-center" glow>
      <motion.div
        whileHover={{ rotate: 360, scale: 1.2 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-8 h-8 mx-auto mb-3" style={{ color }} />
      </motion.div>
      <p className="text-lg md:text-xl font-bold text-foreground">{label}</p>
      <p className="text-xs md:text-sm text-muted-foreground">{desc}</p>
    </GlassCard>
  </motion.div>
));

CapabilityCard.displayName = "CapabilityCard";

const LazyFallback = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-16 h-16 relative">
      <div className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <div className="absolute inset-2 border-2 border-accent/30 border-b-accent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
  </div>
);

const Home = () => {
  const features = [
    { icon: Zap, title: "Real-Time Detection", description: "Lightning-fast environmental anomaly detection powered by advanced AI algorithms analyzing NASA satellite imagery.", color: "hsl(180, 100%, 50%)", stat: "Active sensors", statLabel: "12,847+" },
    { icon: TrendingUp, title: "Predictive Analytics", description: "Machine learning models trained on decades of environmental data to forecast natural disasters 72 hours ahead.", color: "hsl(270, 70%, 60%)", stat: "Prediction accuracy", statLabel: "94.7%" },
    { icon: Globe2, title: "Global Coverage", description: "Comprehensive worldwide monitoring through NASA, NOAA, ESA satellites, and 180+ ground station networks.", color: "hsl(160, 100%, 50%)", stat: "Countries covered", statLabel: "195" }
  ];

  const capabilities = [
    { icon: Shield, label: "99.9% Uptime", desc: "Enterprise SLA", color: "hsl(160, 100%, 50%)" },
    { icon: Waves, label: "10K+/sec", desc: "Data Points", color: "hsl(200, 100%, 50%)" },
    { icon: Brain, label: "Neural AI", desc: "Analysis Engine", color: "hsl(270, 70%, 60%)" },
    { icon: Satellite, label: "12 Satellites", desc: "Live Feed", color: "hsl(180, 100%, 50%)" },
  ];

  const typewriterTexts = [
    "Real-time anomaly detection",
    "AI-powered predictions",
    "Global satellite monitoring",
    "Environmental intelligence"
  ];

  return (
    <div className="min-h-screen bg-space-gradient relative overflow-x-hidden">
      {/* Background effects - reduced for performance */}
      <div className="fixed inset-0 bg-cyber-grid pointer-events-none opacity-10" />
      <Suspense fallback={null}>
        <ParticleField className="fixed inset-0 z-0" particleCount={30} speed={0.15} connectDistance={80} interactive={false} />
      </Suspense>

      <Navigation />
      <LiveNotifications />
      <QuickActions />
      <ChatButton />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-20 relative z-10">
        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <SearchBar />
        </motion.div>
        
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto text-center mb-20 md:mb-32">
          {/* 3D Globe */}
          <motion.div 
            className="relative w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Suspense fallback={<LazyFallback />}>
              <Globe3D className="pointer-events-auto" />
            </Suspense>
          </motion.div>
          
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="text-foreground">Terra</span>
              <NeonText variant="cyan" size="5xl" className="ml-2">Pulse</NeonText>
            </h1>
          </motion.div>
          
          {/* Subtitle with typewriter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto h-8"
          >
            <TypewriterText texts={typewriterTexts} className="text-primary" />
          </motion.div>
          
          <motion.p 
            className="text-base md:text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Next-Generation AI-Powered Environmental Intelligence Platform
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/dashboard">
              <Button size="lg" className="group w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/map">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:border-primary hover:bg-primary/10 transition-all">
                <Map className="w-5 h-5 mr-2" />
                Explore Map
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-accent/30 hover:border-accent hover:bg-accent/10 transition-all">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Exploring
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <RealtimeStats />
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mt-20">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} delay={i * 0.15} />
          ))}
        </div>

        {/* Capabilities */}
        <div className="max-w-6xl mx-auto mt-24">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Advanced <NeonText variant="cyan">Capabilities</NeonText>
            </h2>
            <p className="text-muted-foreground text-lg">Cutting-edge technology for environmental intelligence</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {capabilities.map((item, i) => (
              <CapabilityCard key={i} {...item} index={i} />
            ))}
          </div>
        </div>

        {/* Advanced Features */}
        <div className="max-w-7xl mx-auto mt-24 md:mt-32">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Advanced <NeonText variant="purple">Intelligence</NeonText>
            </h2>
            <p className="text-muted-foreground text-lg">Real-time monitoring and AI-powered predictions</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Suspense fallback={<div className="h-80 glass-ultra rounded-xl animate-pulse" />}>
                <SatelliteTracker />
              </Suspense>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Suspense fallback={<div className="h-80 glass-ultra rounded-xl animate-pulse" />}>
                <AIPredictor />
              </Suspense>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Suspense fallback={<div className="h-40 glass-ultra rounded-xl animate-pulse" />}>
              <DataStreamMonitor />
            </Suspense>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div 
          className="max-w-4xl mx-auto mt-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard variant="ultra" className="p-8 md:p-12" glow>
            <Rocket className="w-12 h-12 text-primary mx-auto mb-6 animate-float" />
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Monitor Our Planet?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of researchers and scientists monitoring Earth's vital signs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Launch Dashboard
                </Button>
              </Link>
              <Link to="/learn">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:border-primary">
                  <Eye className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
