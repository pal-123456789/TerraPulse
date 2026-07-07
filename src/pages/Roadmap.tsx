 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import Navigation from "@/components/Navigation";
 import Footer from "@/components/Footer";
 import SEO from "@/components/SEO";
 import { motion } from "framer-motion";
 import { 
   Rocket, 
   CheckCircle, 
   Clock, 
   Target,
   Sparkles,
   Globe,
   Brain,
   Satellite,
   Users,
   Shield,
   Zap,
   TrendingUp,
   Map,
   Bell,
   Smartphone,
   Cloud,
   Database,
   LineChart,
   MessageSquare,
   Star
 } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 
 interface RoadmapItem {
   id: string;
   title: string;
   description: string;
   status: 'completed' | 'in-progress' | 'planned';
   icon: React.ElementType;
   progress?: number;
   features?: string[];
 }
 
 const Roadmap = () => {
  const currentFeatures: RoadmapItem[] = [
    {
      id: '1',
      title: 'Real-Time Environmental Monitoring',
      description: 'Live tracking of temperature, humidity, pressure and weather patterns across the globe via NASA and OpenWeather APIs.',
      status: 'completed',
      icon: Globe,
      features: ['24/7 data collection', 'Global coverage', '5-min refresh']
    },
    {
      id: '2',
      title: 'AI-Powered Anomaly Detection',
      description: 'Machine learning detects unusual environmental patterns and alerts users instantly.',
      status: 'completed',
      icon: Brain,
      features: ['Pattern recognition', 'Automated alerts', 'Severity scoring']
    },
    {
      id: '3',
      title: 'Interactive 3D Globe & Map Explorer',
      description: 'Immersive WebGL globe and Leaflet map with pulsating anomaly markers and satellite tracking.',
      status: 'completed',
      icon: Satellite,
      features: ['WebGL globe', 'Satellite orbits', 'Anomaly heat layers']
    },
    {
      id: '4',
      title: 'Learning Hub with Signed Certifications',
      description: 'Dynamic courses with quizzes and downloadable certificates signed by founder Pal Ghevariya and the TerraGuardians team.',
      status: 'completed',
      icon: Star,
      features: ['Video lessons', '70% quiz pass', 'Signed certificates']
    },
    {
      id: '5',
      title: 'Real-Time Global Chat with Photo Uploads',
      description: 'Live chat with presence, voice input, and on-the-spot anomaly photo sharing. Messages auto-delete after 1 hour.',
      status: 'completed',
      icon: MessageSquare,
      features: ['Photo uploads', 'Online presence', 'Auto cleanup']
    },
    {
      id: '6',
      title: 'TerraPulse AI Assistant',
      description: 'In-app conversational AI powered by Gemini through the Lovable AI Gateway with streaming responses.',
      status: 'completed',
      icon: Sparkles,
      features: ['Streaming chat', 'Rate-limited', 'Environmental expert']
    },
    {
      id: '7',
      title: 'Auth, Forgot Password & Profile System',
      description: 'Google OAuth, secure password reset flow, high-contrast mode, account deletion and personalized alert preferences.',
      status: 'completed',
      icon: Shield,
      features: ['Google OAuth', 'Password reset', 'High contrast mode']
    },
    {
      id: '8',
      title: 'Advanced Analytics Dashboard',
      description: 'Charts, heatmaps, performance monitoring and history with one-click cleanup of old detections.',
      status: 'completed',
      icon: LineChart,
      features: ['Real-time charts', 'Regional analytics', 'History cleanup']
    }
  ];

  const inProgressFeatures: RoadmapItem[] = [
    {
      id: '9',
      title: 'Mobile Performance Tuning',
      description: 'Improving Lighthouse mobile and desktop scores via code-splitting, image optimization and accessibility passes.',
      status: 'in-progress',
      icon: TrendingUp,
      progress: 85,
      features: ['Lazy loading', 'A11y labels', 'CSP hardening']
    },
    {
      id: '10',
      title: 'Email Alerts via SendGrid',
      description: 'Personalized anomaly email alerts with severity-based routing and in-app delivery logs.',
      status: 'in-progress',
      icon: Bell,
      progress: 90,
      features: ['SendGrid', 'Severity filters', 'Delivery logs']
    },
    {
      id: '11',
      title: 'Advanced Prediction Models',
      description: 'Next-generation AI models for 7-day environmental forecasts with confidence scores.',
      status: 'in-progress',
      icon: Brain,
      progress: 65,
      features: ['7-day forecasts', 'Confidence scores', 'Risk maps']
    }
  ];

  const plannedFeatures: RoadmapItem[] = [
    {
      id: '12',
      title: 'Native Mobile Apps',
      description: 'iOS and Android builds via Capacitor with offline mode and native push notifications.',
      status: 'planned',
      icon: Smartphone,
      features: ['Offline mode', 'Native push', 'Location alerts']
    },
    {
      id: '13',
      title: 'Public API Platform',
      description: 'REST and WebSocket APIs so developers can build on top of TerraGuardians data.',
      status: 'planned',
      icon: Cloud,
      features: ['REST API', 'WebSocket streams', 'SDK libraries']
    },
    {
      id: '14',
      title: 'Collaborative Research Platform',
      description: 'Tools for researchers to share findings, datasets and peer-reviewed studies.',
      status: 'planned',
      icon: Users,
      features: ['Data sharing', 'Research papers', 'Peer review']
    },
    {
      id: '15',
      title: 'IoT Sensor Integration',
      description: 'Connect custom environmental sensors directly into the TerraGuardians network.',
      status: 'planned',
      icon: Zap,
      features: ['Custom sensors', 'Real-time upload', 'Calibration']
    },
    {
      id: '16',
      title: 'Enterprise Security Suite',
      description: 'SSO, audit logs and GDPR compliance tools for organizations.',
      status: 'planned',
      icon: Shield,
      features: ['SSO', 'Audit logging', 'GDPR compliance']
    }
  ];
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case 'completed':
         return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
       case 'in-progress':
         return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In Progress</Badge>;
       case 'planned':
         return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Planned</Badge>;
       default:
         return null;
     }
   };
 
   const FeatureCard = ({ item, index }: { item: RoadmapItem; index: number }) => {
     const Icon = item.icon;
     
     return (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ delay: index * 0.1 }}
       >
         <Card className="glass-panel border-primary/20 glow-border-hover h-full">
           <CardHeader>
             <div className="flex items-start justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                   item.status === 'completed' ? 'bg-green-500/20' : 
                   item.status === 'in-progress' ? 'bg-yellow-500/20' : 
                   'bg-blue-500/20'
                 }`}>
                   <Icon className={`w-6 h-6 ${
                     item.status === 'completed' ? 'text-green-400' : 
                     item.status === 'in-progress' ? 'text-yellow-400' : 
                     'text-blue-400'
                   }`} />
                 </div>
                 <div>
                   <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
                   {getStatusBadge(item.status)}
                 </div>
               </div>
               {item.status === 'completed' && (
                 <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
               )}
             </div>
           </CardHeader>
           <CardContent className="space-y-4">
             <p className="text-muted-foreground">{item.description}</p>
             
             {item.progress !== undefined && (
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Progress</span>
                   <span className="text-foreground font-medium">{item.progress}%</span>
                 </div>
                 <Progress value={item.progress} className="h-2" />
               </div>
             )}
             
             {item.features && (
               <div className="flex flex-wrap gap-2">
                 {item.features.map((feature, i) => (
                   <Badge key={i} variant="outline" className="text-xs">
                     {feature}
                   </Badge>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </motion.div>
     );
   };
 
   return (
     <div className="min-h-screen bg-space-gradient">
       <SEO
        title={"Product Roadmap — Terra Guardians"}
        description={"Explore the Terra Guardians (TerraPulse) roadmap: upcoming AI features, satellite integrations and mobile releases led by founder Pal Ghevariya."}
        path={"/roadmap"}
        keywords={"roadmap, upcoming features, releases, Pal Ghevariya, Terra Guardians, TerraPulse"}
      />
      <Navigation />
       
       <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
         <div className="max-w-7xl mx-auto space-y-8">
           {/* Header */}
           <div className="text-center space-y-4 animate-fade-in">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
               <Rocket className="w-4 h-4 text-primary animate-pulse" />
               <span className="text-sm font-medium text-primary">Product Roadmap</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-bold text-glow">
               What We're <span className="text-primary">Building</span>
             </h1>
             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
               Explore our current features and discover what's coming next to TerraPulse
             </p>
           </div>
 
           {/* Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="glass-panel p-6 text-center">
               <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                 <CheckCircle className="w-8 h-8 text-green-400" />
               </div>
               <h3 className="text-3xl font-bold text-foreground">{currentFeatures.length}</h3>
               <p className="text-muted-foreground">Completed Features</p>
             </Card>
             <Card className="glass-panel p-6 text-center">
               <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                 <Clock className="w-8 h-8 text-yellow-400" />
               </div>
               <h3 className="text-3xl font-bold text-foreground">{inProgressFeatures.length}</h3>
               <p className="text-muted-foreground">In Progress</p>
             </Card>
             <Card className="glass-panel p-6 text-center">
               <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                 <Target className="w-8 h-8 text-blue-400" />
               </div>
               <h3 className="text-3xl font-bold text-foreground">{plannedFeatures.length}</h3>
               <p className="text-muted-foreground">Planned</p>
             </Card>
           </div>
 
           {/* Tabs */}
           <Tabs defaultValue="current" className="space-y-6">
             <TabsList className="glass-panel grid w-full grid-cols-3">
               <TabsTrigger value="current" className="flex items-center gap-2">
                 <CheckCircle className="w-4 h-4" />
                 Current
               </TabsTrigger>
               <TabsTrigger value="progress" className="flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 In Progress
               </TabsTrigger>
               <TabsTrigger value="future" className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4" />
                 Future
               </TabsTrigger>
             </TabsList>
 
             <TabsContent value="current">
               <div className="space-y-4">
                 <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                   <CheckCircle className="w-6 h-6 text-green-400" />
                   Current Features
                 </h2>
                 <p className="text-muted-foreground mb-6">
                   These features are fully implemented and available for use right now.
                 </p>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {currentFeatures.map((item, index) => (
                     <FeatureCard key={item.id} item={item} index={index} />
                   ))}
                 </div>
               </div>
             </TabsContent>
 
             <TabsContent value="progress">
               <div className="space-y-4">
                 <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                   <Clock className="w-6 h-6 text-yellow-400" />
                   In Progress
                 </h2>
                 <p className="text-muted-foreground mb-6">
                   Features currently being developed and will be available soon.
                 </p>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {inProgressFeatures.map((item, index) => (
                     <FeatureCard key={item.id} item={item} index={index} />
                   ))}
                 </div>
               </div>
             </TabsContent>
 
             <TabsContent value="future">
               <div className="space-y-4">
                 <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                   <Sparkles className="w-6 h-6 text-blue-400" />
                   Future Scope
                 </h2>
                 <p className="text-muted-foreground mb-6">
                   Exciting features planned for future development.
                 </p>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {plannedFeatures.map((item, index) => (
                     <FeatureCard key={item.id} item={item} index={index} />
                   ))}
                 </div>
               </div>
             </TabsContent>
           </Tabs>
         </div>
       </main>
 
       <Footer />
     </div>
   );
 };
 
 export default Roadmap;