import { Satellite, Cpu, Database, Shield, Users, Target, Globe2, Sparkles, Zap, Activity, Brain, Eye, Rocket, Award, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LoadingVFX } from "@/components/3D/LoadingVFX";
import { MotionSection, StaggerContainer, StaggerItem } from "@/components/MotionSection";
import AnimatedCounter from "@/components/AnimatedCounter";

const About = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleJoinMission = () => {
    if (email && email.includes("@")) {
      toast.success("Welcome to the mission! Check your email for next steps.");
      setEmail("");
    } else {
      toast.error("Please enter a valid email address");
    }
  };

  const stats = [
    { value: 12847, label: "Active Sensors", icon: Activity },
    { value: 195, label: "Countries", icon: Globe2 },
    { value: 99.9, label: "Uptime %", icon: Shield, suffix: "%" },
    { value: 24, label: "Hour Support", icon: Zap, prefix: "", suffix: "/7" },
  ];

  const timeline = [
    { year: "2021", title: "Project Inception", desc: "TerraPulse founded with a vision for global environmental monitoring" },
    { year: "2022", title: "Satellite Integration", desc: "Integrated with NASA and ESA satellite networks" },
    { year: "2023", title: "AI Revolution", desc: "Launched GPT-4 powered prediction algorithms" },
    { year: "2024", title: "Global Expansion", desc: "Reached 195 countries with 12,000+ sensors" },
    { year: "2025", title: "The Future", desc: "Pioneering real-time environmental AI intelligence" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-space-gradient flex items-center justify-center">
        <LoadingVFX text="Loading About..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-gradient relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20" />
      
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <MotionSection className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Rocket className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Our Mission</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground">
              About <span className="text-primary text-glow-strong">TerraPulse</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Leveraging cutting-edge AI and satellite technology to monitor, predict, and protect our planet's future
            </p>
          </MotionSection>

          {/* Stats Grid */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
            {stats.map((stat, i) => (
              <StaggerItem key={i}>
                <Card className="glass-ultra p-6 text-center group hover:glow-border transition-all">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {stat.prefix}
                    <AnimatedCounter end={stat.value} />
                    {stat.suffix}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Purpose */}
          <MotionSection delay={0.1}>
            <Card className="glass-ultra p-6 sm:p-8 mb-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground flex items-center gap-3">
                  <Eye className="w-8 h-8 text-primary" />
                  Our Purpose
                </h2>
                <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg leading-relaxed">
                      Monitor ecological change, predict environmental trends, and support sustainable development
                      through advanced AI-powered analysis.
                    </p>
                    <ul className="space-y-2">
                      {["Real-time anomaly detection", "Predictive disaster warnings", "Climate trend analysis"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg leading-relaxed">
                      TerraPulse integrates data from NASA satellites, weather systems, and environmental sensors
                      to provide real-time insights into Earth's changing conditions.
                    </p>
                    <ul className="space-y-2">
                      {["180+ ground stations", "12 satellite networks", "AI-powered predictions"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </MotionSection>

          {/* Timeline */}
          <MotionSection delay={0.2}>
            <Card className="glass-ultra p-6 sm:p-8 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                <Award className="w-8 h-8 text-primary" />
                Our Journey
              </h2>
              <div className="relative">
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-primary" />
                <div className="space-y-8">
                  {timeline.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 ${i % 2 === 0 ? 'md:flex-row-reverse md:text-right' : ''}`}
                    >
                      <div className="flex-1 ml-10 md:ml-0">
                        <Card className="glass-panel p-4 hover:glow-border transition-all">
                          <span className="text-primary font-bold text-lg">{item.year}</span>
                          <h3 className="font-bold text-foreground mt-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        </Card>
                      </div>
                      <div className="absolute left-4 md:static md:left-auto w-3 h-3 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/50" />
                      <div className="flex-1 hidden md:block" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </MotionSection>

          {/* Technology */}
          <MotionSection delay={0.3}>
            <Card className="glass-ultra p-6 sm:p-8 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                Our Technology
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-8">
                AI satellite imagery, cloud computing, and machine learning algorithms power our platform.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Satellite, title: "Satellite Data", desc: "Real-time imagery from NASA's Earth observation satellites", color: "text-primary" },
                  { icon: Cpu, title: "AI Processing", desc: "Advanced machine learning for pattern recognition", color: "text-purple-400" },
                  { icon: Database, title: "Big Data", desc: "Massive datasets processed in real-time", color: "text-green-400" },
                  { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade encrypted transmission", color: "text-yellow-400" },
                ].map((tech, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all group"
                  >
                    <div className={`w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <tech.icon className={`w-6 h-6 ${tech.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{tech.title}</h3>
                      <p className="text-sm text-muted-foreground">{tech.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </MotionSection>

          {/* Data Sources */}
          <MotionSection delay={0.4}>
            <Card className="glass-ultra p-6 sm:p-8 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                Data Sources
              </h2>
              <div className="space-y-4">
                {[
                  { name: "NASA Earth Observation", status: "Active", latency: "12ms" },
                  { name: "ESA Sentinel Network", status: "Active", latency: "18ms" },
                  { name: "OpenWeather API", status: "Active", latency: "8ms" },
                  { name: "NOAA Weather Stations", status: "Active", latency: "15ms" },
                ].map((source, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <span className="font-semibold text-foreground">{source.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{source.latency}</span>
                      <span className="flex items-center gap-1 text-sm text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        {source.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </MotionSection>

          {/* Join the Mission */}
          <MotionSection delay={0.5}>
            <Card className="glass-ultra p-6 sm:p-8 border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                    Join the <span className="text-primary text-glow">Mission</span>
                  </h2>
                  <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Be part of the global community monitoring Earth's environmental changes
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    { icon: Users, title: "Citizen Scientists", desc: "Submit environmental reports from your location", color: "bg-primary/20", iconColor: "text-primary" },
                    { icon: Target, title: "Researchers", desc: "Access real-time data and AI-powered insights", color: "bg-purple-500/20", iconColor: "text-purple-400" },
                    { icon: Globe2, title: "Organizations", desc: "Leverage our platform for environmental monitoring", color: "bg-green-500/20", iconColor: "text-green-400" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-6 bg-background/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all"
                    >
                      <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <item.icon className={`w-8 h-8 ${item.iconColor}`} />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="max-w-md mx-auto">
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-panel border-border focus:border-primary"
                    />
                    <Button onClick={handleJoinMission} size="lg" className="group shrink-0">
                      <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                      Join
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Join thousands of observers monitoring Earth's environmental changes
                  </p>
                </div>
              </div>
            </Card>
          </MotionSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;