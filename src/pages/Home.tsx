import { Link } from "react-router-dom";
import { ArrowRight, Zap, Globe2, TrendingUp, BarChart3, Satellite, Brain, Activity, Sparkles, Shield, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import AnimatedCounter from "@/components/AnimatedCounter";
import SearchBar from "@/components/SearchBar";
import QuickActions from "@/components/QuickActions";
import LiveNotifications from "@/components/LiveNotifications";
import ParticleBackground from "@/components/ParticleBackground";
import { Globe3D } from "@/components/Globe3D";
import Footer from "@/components/Footer";
import RealtimeStats from "@/components/RealtimeStats";
import SatelliteTracker from "@/components/SatelliteTracker";
import AIPredictor from "@/components/AIPredictor";
import DataStreamMonitor from "@/components/DataStreamMonitor";
import ChatButton from "@/components/Chat/ChatButton";
import { MotionSection, StaggerContainer, StaggerItem } from "@/components/MotionSection";
import FloatingOrbs from "@/components/3D/FloatingOrbs";
import WaveGrid from "@/components/3D/WaveGrid";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";

const Home = () => {
  const { speakOnNonClickable } = useVoiceGuidance();

  return (
    <div 
      className="min-h-screen bg-space-gradient relative overflow-hidden"
      onClick={speakOnNonClickable}
    >
      {/* Advanced particle background */}
      <ParticleBackground />
      
      {/* 3D Floating Orbs */}
      <FloatingOrbs className="opacity-40" />
      
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-30" />
      
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <Navigation />
      <LiveNotifications />
      <QuickActions />
      <ChatButton />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-20 relative z-10">
        {/* Search Bar */}
        <MotionSection delay={0.1} className="mb-8 md:mb-12">
          <SearchBar />
        </MotionSection>
        
        {/* Hero Section */}
        <MotionSection direction="scale" className="max-w-5xl mx-auto text-center mb-20 md:mb-32">
          <div className="mb-6 md:mb-8 inline-block">
            <motion.div 
              className="relative w-40 h-40 md:w-72 md:h-72 lg:w-96 lg:h-96 mx-auto touch-none"
              animate={{ 
                rotateY: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Globe3D className="pointer-events-auto" />
              
              {/* Orbiting elements */}
              <div className="absolute inset-0 animate-orbit pointer-events-none hidden md:block">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse-glow" />
              </div>
            </motion.div>
          </div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 text-foreground leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Terra<span className="text-primary text-glow-strong animate-neon-flicker">Pulse</span>
          </motion.h1>
          
          <motion.p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto px-4 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Next-Generation AI-Powered Environmental Intelligence Platform
          </motion.p>
          <motion.p 
            className="text-sm sm:text-base md:text-lg text-muted-foreground/80 mb-8 md:mb-12 max-w-2xl mx-auto px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Real-time anomaly detection • Predictive analytics • NASA satellite integration • Global coverage
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/dashboard">
              <Button size="lg" className="group relative overflow-hidden w-full sm:w-auto neon-border">
                <span className="relative z-10 flex items-center gap-2 justify-center">
                  <BarChart3 className="w-5 h-5" />
                  View Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-glow-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 w-full sm:w-auto group">
                <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin-slow" />
                Start Exploring
              </Button>
            </Link>
          </motion.div>
        </MotionSection>

        {/* Live Stats Bar - Now Real-time */}
        <MotionSection delay={0.2}>
          <RealtimeStats />
        </MotionSection>

        {/* Features Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4 mt-16">
          <StaggerItem>
            <Card className="glass-ultra p-6 md:p-8 rounded-xl hover:glow-border transition-all duration-500 group cursor-pointer hologram-effect h-full">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 relative z-10">
                  <Zap className="w-7 h-7 text-primary group-hover:animate-electric" />
                </div>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Real-Time Detection</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Lightning-fast environmental anomaly detection powered by advanced AI algorithms analyzing NASA satellite imagery.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-primary/70">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Active monitoring: 12,847+ sensors</span>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="glass-ultra p-6 md:p-8 rounded-xl hover:glow-border transition-all duration-500 group cursor-pointer hologram-effect h-full">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-purple-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 relative z-10">
                  <TrendingUp className="w-7 h-7 text-purple-400 group-hover:animate-wave" />
                </div>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-3 text-foreground group-hover:text-purple-400 transition-colors">Predictive Analytics</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Machine learning models trained on decades of environmental data to forecast natural disasters 72 hours ahead.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-purple-400/70">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>Prediction accuracy: 89.3%</span>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="glass-ultra p-6 md:p-8 rounded-xl hover:glow-border transition-all duration-500 group cursor-pointer hologram-effect h-full">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-14 h-14 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 relative z-10">
                  <Globe2 className="w-7 h-7 text-green-400 group-hover:animate-spin-slow" />
                </div>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-3 text-foreground group-hover:text-green-400 transition-colors">Global Coverage</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Comprehensive worldwide monitoring through NASA, NOAA, ESA satellites, and 180+ ground station networks.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-400/70">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Coverage: 195 countries</span>
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* New: Capabilities Section */}
        <MotionSection delay={0.3} className="max-w-7xl mx-auto px-4 mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
              Advanced <span className="text-primary text-glow">Capabilities</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge technology for environmental intelligence
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Shield, label: "99.9% Uptime", desc: "Enterprise SLA", color: "text-green-400" },
              { icon: Waves, label: "10K+/sec", desc: "Data Points", color: "text-blue-400" },
              { icon: Brain, label: "GPT-4 Vision", desc: "AI Analysis", color: "text-purple-400" },
              { icon: Satellite, label: "12 Satellites", desc: "Live Feed", color: "text-primary" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-panel p-4 md:p-6 rounded-xl text-center group hover:glow-border transition-all"
              >
                <item.icon className={`w-8 h-8 mx-auto mb-3 ${item.color} group-hover:scale-110 transition-transform`} />
                <p className="text-lg md:text-xl font-bold text-foreground">{item.label}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </MotionSection>

        {/* Advanced Features Section */}
        <div className="max-w-7xl mx-auto px-4 mt-24 md:mt-32 mb-20 relative">
          {/* Wave Grid Background */}
          <WaveGrid className="opacity-30" />
          
          <MotionSection className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
              Advanced <span className="text-primary text-glow">Intelligence</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time monitoring and AI-powered predictions for environmental events worldwide
            </p>
          </MotionSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 relative z-10">
            <MotionSection direction="left">
              <SatelliteTracker />
            </MotionSection>
            <MotionSection direction="right">
              <AIPredictor />
            </MotionSection>
          </div>

          <MotionSection delay={0.3}>
            <DataStreamMonitor />
          </MotionSection>
        </div>

        {/* Technology Stack Section */}
        <MotionSection delay={0.2} className="max-w-7xl mx-auto px-4 mt-20 md:mt-32 mb-20">
          <Card className="glass-ultra p-8 md:p-12 rounded-2xl relative overflow-hidden">
            {/* Background effect */}
            <div className="absolute inset-0 bg-data-stream opacity-30" />
            
            <div className="text-center mb-12 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Powered by <span className="text-primary text-glow">Cutting-Edge Technology</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Enterprise-grade infrastructure processing petabytes of environmental data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <motion.div 
                className="text-center p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform animate-morph">
                  <Satellite className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Satellite Network</h3>
                <p className="text-sm text-muted-foreground">12+ satellites • 180+ ground stations</p>
                <div className="mt-4 h-2 bg-background/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-green-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: "75%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="text-center p-6 rounded-xl bg-card/50 border border-border/50 hover:border-purple-400/30 transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-purple-500/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform animate-morph">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">AI Processing</h3>
                <p className="text-sm text-muted-foreground">GPT-4 Vision • Neural networks</p>
                <div className="mt-4 h-2 bg-background/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "85%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="text-center p-6 rounded-xl bg-card/50 border border-border/50 hover:border-green-400/30 transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform animate-morph">
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Real-time Processing</h3>
                <p className="text-sm text-muted-foreground">10K+ data points/sec</p>
                <div className="mt-4 h-2 bg-background/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
              </motion.div>
            </div>
          </Card>
        </MotionSection>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
