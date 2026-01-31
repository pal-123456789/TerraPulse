import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Globe, 
  Thermometer, 
  Droplets, 
  Wind,
  Activity,
  Sparkles,
  BookOpen,
  GraduationCap,
  Video,
  FileText,
  Award,
  Play,
  Clock,
  Star,
  Target,
  CheckCircle,
  Lightbulb,
  Map,
  BarChart,
  Satellite,
  Shield,
  Waves,
  Mountain,
  TreePine,
  Flame,
  CloudRain,
  Snowflake,
  Sun,
  Moon,
  Compass
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingVFX } from "@/components/3D/LoadingVFX";
import { MotionSection } from "@/components/MotionSection";
import { Button } from "@/components/ui/button";

interface EnvironmentalData {
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  weather_condition: string;
  created_at: string;
}

interface AnomalyData {
  name: string;
  severity: string;
  detected_at: string;
}

// Memoized course card for performance
const CourseCard = memo(({ course, onStart }: { 
  course: { title: string; duration: string; lessons: number; level: string; progress: number; icon: any; description: string };
  onStart: () => void;
}) => (
  <Card className="glass-ultra hover:border-primary/30 transition-all group cursor-pointer">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <course.icon className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-foreground truncate">{course.title}</h3>
            <Badge variant={course.level === "Beginner" ? "secondary" : course.level === "Intermediate" ? "default" : "outline"}>
              {course.level}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {course.lessons} lessons
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        </div>
      </div>
      <Button className="w-full mt-4 group-hover:bg-primary/20" variant="outline" onClick={onStart}>
        <Play className="w-4 h-4 mr-2" />
        {course.progress > 0 ? "Continue Learning" : "Start Course"}
      </Button>
    </CardContent>
  </Card>
));

CourseCard.displayName = 'CourseCard';

// Interactive Quiz Component
const QuizCard = memo(({ question, options, onAnswer }: {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    setTimeout(() => onAnswer(option), 1500);
  };

  return (
    <Card className="glass-ultra border-primary/20">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg text-foreground mb-4">{question}</h3>
        <div className="space-y-3">
          {options.map((option, i) => (
            <motion.button
              key={i}
              whileHover={!revealed ? { scale: 1.02 } : {}}
              whileTap={!revealed ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(option)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selected === option
                  ? i === 0 ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'
                  : revealed && i === 0
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border/50 hover:border-primary/30 bg-card/50'
              }`}
            >
              <span className="text-foreground">{option}</span>
              {revealed && i === 0 && <CheckCircle className="inline-block w-4 h-4 ml-2 text-green-400" />}
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

QuizCard.displayName = 'QuizCard';

// Learning Module Card
const ModuleCard = memo(({ module, index }: {
  module: { title: string; description: string; icon: any; topics: string[]; duration: string; color: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="glass-ultra h-full hover:border-primary/30 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${module.color}20` }}
          >
            <module.icon className="w-6 h-6" style={{ color: module.color }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{module.title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {module.duration}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
        <div className="flex flex-wrap gap-2">
          {module.topics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
));

ModuleCard.displayName = 'ModuleCard';

const Learn = () => {
  const [liveData, setLiveData] = useState<EnvironmentalData | null>(null);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [activeAnomalies, setActiveAnomalies] = useState<AnomalyData[]>([]);
  const [funFact, setFunFact] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(35);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState(0);

  const funFacts = useMemo(() => [
    "🌍 Earth's atmosphere is 78% nitrogen and 21% oxygen!",
    "🌊 The ocean produces over 50% of the world's oxygen",
    "⚡ A single lightning bolt contains 1 billion volts of electricity",
    "🌡️ The warmest year on record was 2023",
    "💨 Wind speed is measured in knots, mph, or m/s",
    "🌪️ Tornadoes can have wind speeds exceeding 300 mph",
    "❄️ No two snowflakes are exactly alike",
    "🌈 Rainbows are actually full circles, we only see half from the ground",
    "☁️ Clouds can weigh over 1 million pounds!",
    "🌋 There are about 1,500 active volcanoes on Earth"
  ], []);

  const courses = useMemo(() => [
    { title: "Climate Fundamentals", duration: "2h 30m", lessons: 12, level: "Beginner", progress: 100, icon: Globe, description: "Learn the basics of climate science and weather patterns" },
    { title: "Weather Pattern Analysis", duration: "3h 15m", lessons: 18, level: "Intermediate", progress: 65, icon: Wind, description: "Analyze complex weather systems and predict patterns" },
    { title: "AI in Environmental Science", duration: "4h", lessons: 24, level: "Advanced", progress: 20, icon: Brain, description: "Machine learning applications in environmental monitoring" },
    { title: "Satellite Data Interpretation", duration: "2h 45m", lessons: 15, level: "Intermediate", progress: 0, icon: Satellite, description: "Read and analyze satellite imagery for environmental insights" },
    { title: "Ocean & Marine Systems", duration: "3h", lessons: 16, level: "Intermediate", progress: 0, icon: Droplets, description: "Understanding ocean currents and marine ecosystems" },
    { title: "Disaster Preparedness", duration: "2h", lessons: 10, level: "Beginner", progress: 0, icon: Target, description: "Learn how to prepare for and respond to natural disasters" },
  ], []);

  const learningModules = useMemo(() => [
    { 
      title: "Climate Science Basics", 
      description: "Understand the fundamental principles of climate and weather systems",
      icon: Globe, 
      topics: ["Atmosphere", "Climate Zones", "Weather vs Climate"],
      duration: "45 min",
      color: "hsl(180, 100%, 50%)"
    },
    { 
      title: "Natural Disasters", 
      description: "Learn about earthquakes, hurricanes, tsunamis and volcanic eruptions",
      icon: Flame, 
      topics: ["Earthquakes", "Hurricanes", "Tsunamis", "Volcanoes"],
      duration: "1h 15m",
      color: "hsl(0, 84%, 60%)"
    },
    { 
      title: "Satellite Technology", 
      description: "How satellites monitor Earth's environment from space",
      icon: Satellite, 
      topics: ["Remote Sensing", "Data Collection", "Image Analysis"],
      duration: "50 min",
      color: "hsl(270, 70%, 60%)"
    },
    { 
      title: "Ocean Systems", 
      description: "Deep dive into ocean currents, temperatures and marine life",
      icon: Waves, 
      topics: ["Currents", "El Niño", "Marine Ecosystems"],
      duration: "1h",
      color: "hsl(200, 100%, 50%)"
    },
    { 
      title: "Weather Forecasting", 
      description: "Modern techniques for predicting weather patterns",
      icon: CloudRain, 
      topics: ["Models", "Data Analysis", "Predictions"],
      duration: "55 min",
      color: "hsl(220, 70%, 60%)"
    },
    { 
      title: "Ecosystem Monitoring", 
      description: "Track and analyze changes in global ecosystems",
      icon: TreePine, 
      topics: ["Forests", "Biodiversity", "Conservation"],
      duration: "40 min",
      color: "hsl(120, 60%, 40%)"
    },
    { 
      title: "Polar Regions", 
      description: "Understanding Arctic and Antarctic climate dynamics",
      icon: Snowflake, 
      topics: ["Ice Sheets", "Sea Ice", "Permafrost"],
      duration: "35 min",
      color: "hsl(200, 80%, 70%)"
    },
    { 
      title: "Solar Influence", 
      description: "How the sun affects Earth's climate and weather",
      icon: Sun, 
      topics: ["Solar Cycles", "Radiation", "Space Weather"],
      duration: "30 min",
      color: "hsl(45, 100%, 60%)"
    },
  ], []);

  const achievements = useMemo(() => [
    { title: "First Steps", desc: "Complete your first lesson", unlocked: true, icon: Star },
    { title: "Weather Watcher", desc: "Analyze 10 weather patterns", unlocked: true, icon: Wind },
    { title: "Data Scientist", desc: "Complete AI course", unlocked: false, icon: Brain },
    { title: "Global Observer", desc: "Track 50 anomalies", unlocked: false, icon: Globe },
    { title: "Quiz Master", desc: "Score 100% on 5 quizzes", unlocked: false, icon: Lightbulb },
    { title: "Explorer", desc: "Visit all map regions", unlocked: false, icon: Map },
  ], []);

  const quizzes = useMemo(() => [
    { question: "What percentage of Earth's atmosphere is nitrogen?", options: ["78%", "21%", "50%", "45%"] },
    { question: "What produces over 50% of the world's oxygen?", options: ["The ocean", "Rainforests", "Trees", "Plankton"] },
    { question: "How many volts are in a lightning bolt?", options: ["1 billion", "1 million", "100 million", "10 billion"] },
    { question: "What causes the El Niño phenomenon?", options: ["Warm Pacific waters", "Cold Atlantic currents", "Volcanic activity", "Solar flares"] },
    { question: "Which layer of the atmosphere contains the ozone layer?", options: ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"] },
  ], []);

  useEffect(() => {
    fetchInitialData();
    setupRealtimeSubscriptions();
    
    const factInterval = setInterval(() => {
      const newFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      setFunFact(newFact);
    }, 10000);

    setFunFact(funFacts[0]);

    return () => {
      clearInterval(factInterval);
    };
  }, [funFacts]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [envResult, anomalyResult] = await Promise.all([
        supabase
          .from("environmental_data")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("anomalies")
          .select("name, severity, detected_at")
          .eq("status", "active")
          .order("detected_at", { ascending: false })
          .limit(5)
      ]);

      if (envResult.data) setLiveData(envResult.data);
      if (anomalyResult.data) {
        setActiveAnomalies(anomalyResult.data);
        setAnomalyCount(anomalyResult.data.length);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, []);

  const setupRealtimeSubscriptions = useCallback(() => {
    const envChannel = supabase
      .channel("env-data-changes-learn")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "environmental_data" },
        (payload) => {
          setLiveData(payload.new as EnvironmentalData);
          toast.success("🌍 New environmental data received!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(envChannel);
    };
  }, []);

  const handleQuizAnswer = useCallback((answer: string) => {
    const isCorrect = quizzes[currentQuiz].options[0] === answer;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      toast.success("Correct! +10 points");
    } else {
      toast.error("Not quite. Try the next one!");
    }
    
    setTimeout(() => {
      if (currentQuiz < quizzes.length - 1) {
        setCurrentQuiz(prev => prev + 1);
      } else {
        toast.success(`Quiz complete! You scored ${isCorrect ? quizScore + 1 : quizScore}/${quizzes.length}`);
        setCurrentQuiz(0);
        setQuizScore(0);
      }
    }, 2000);
  }, [currentQuiz, quizScore, quizzes]);

  const handleStartCourse = useCallback((index: number) => {
    setActiveLesson(index);
    toast.success(`Starting: ${courses[index].title}`);
  }, [courses]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-space-gradient flex items-center justify-center">
        <LoadingVFX text="Loading Learning Hub..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-gradient relative overflow-x-hidden">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-10" />
      
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <MotionSection className="text-center space-y-4">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Interactive Learning Hub</span>
            </motion.div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Learn & <span className="text-primary">Explore</span>
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Interactive courses, real-time data, quizzes, and achievements to master environmental science
            </p>
          </MotionSection>

          {/* Stats Bar */}
          <MotionSection delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Courses Completed", value: "2/6", icon: BookOpen, color: "text-primary" },
                { label: "Quiz Score", value: `${quizScore}pts`, icon: Lightbulb, color: "text-yellow-400" },
                { label: "Achievements", value: "2/6", icon: Award, color: "text-purple-400" },
                { label: "Learning Streak", value: "5 days", icon: Zap, color: "text-orange-400" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-ultra p-4 text-center">
                    <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </MotionSection>

          {/* Progress Overview */}
          <MotionSection delay={0.2}>
            <Card className="glass-ultra border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Your Learning Progress</h3>
                    <p className="text-sm text-muted-foreground">Keep learning to unlock achievements!</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold text-foreground">Level 3</span>
                  </div>
                </div>
                <Progress value={courseProgress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">{courseProgress}% complete • 2 of 6 courses finished</p>
              </CardContent>
            </Card>
          </MotionSection>

          {/* Fun Fact Banner */}
          <MotionSection delay={0.3}>
            <Card className="glass-ultra border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-foreground">Did You Know?</h3>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={funFact}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-muted-foreground text-base sm:text-lg"
                      >
                        {funFact}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionSection>

          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-8 glass-panel">
              <TabsTrigger value="courses" className="text-sm sm:text-base text-foreground">
                <Video className="w-4 h-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="modules" className="text-sm sm:text-base text-foreground">
                <BookOpen className="w-4 h-4 mr-2" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-sm sm:text-base text-foreground">
                <Lightbulb className="w-4 h-4 mr-2" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="realtime" className="text-sm sm:text-base text-foreground">
                <Zap className="w-4 h-4 mr-2" />
                Real-Time
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-sm sm:text-base text-foreground">
                <Award className="w-4 h-4 mr-2" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course, i) => (
                  <CourseCard key={i} course={course} onStart={() => handleStartCourse(i)} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="modules" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Learning Modules</h2>
                <p className="text-muted-foreground">Explore specific topics in environmental science</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {learningModules.map((module, i) => (
                  <ModuleCard key={i} module={module} index={i} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Test Your Knowledge</h2>
                <p className="text-muted-foreground">Question {currentQuiz + 1} of {quizzes.length}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Score:</span>
                  <Badge variant="default" className="bg-primary/20 text-primary">
                    {quizScore} points
                  </Badge>
                </div>
              </div>
              <div className="max-w-2xl mx-auto">
                <QuizCard
                  question={quizzes[currentQuiz].question}
                  options={quizzes[currentQuiz].options}
                  onAnswer={handleQuizAnswer}
                />
              </div>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-ultra">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Activity className="w-5 h-5 text-primary" />
                      Live Environmental Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {liveData ? (
                      <>
                        <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                          <div className="flex items-center gap-3">
                            <Thermometer className="w-5 h-5 text-red-400" />
                            <span className="text-foreground">Temperature</span>
                          </div>
                          <span className="font-bold text-foreground">{liveData.temperature}°C</span>
                        </div>
                        <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-blue-400" />
                            <span className="text-foreground">Humidity</span>
                          </div>
                          <span className="font-bold text-foreground">{liveData.humidity}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                          <div className="flex items-center gap-3">
                            <Wind className="w-5 h-5 text-cyan-400" />
                            <span className="text-foreground">Wind Speed</span>
                          </div>
                          <span className="font-bold text-foreground">{liveData.wind_speed} m/s</span>
                        </div>
                        <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <span className="text-foreground">Pressure</span>
                          </div>
                          <span className="font-bold text-foreground">{liveData.pressure} hPa</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No live data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-ultra">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Target className="w-5 h-5 text-primary" />
                      Active Anomalies ({anomalyCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeAnomalies.length > 0 ? (
                      activeAnomalies.map((anomaly, i) => (
                        <div key={i} className="flex items-center justify-between p-3 glass-panel rounded-lg">
                          <span className="text-foreground">{anomaly.name}</span>
                          <Badge variant={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No active anomalies</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Your Achievements</h2>
                <p className="text-muted-foreground">Unlock rewards by completing challenges</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={`glass-ultra p-6 text-center ${achievement.unlocked ? 'border-yellow-500/50' : 'opacity-60'}`}>
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        achievement.unlocked ? 'bg-yellow-500/20' : 'bg-muted/20'
                      }`}>
                        <achievement.icon className={`w-8 h-8 ${achievement.unlocked ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.desc}</p>
                      {achievement.unlocked && (
                        <Badge className="mt-3 bg-yellow-500/20 text-yellow-400">Unlocked!</Badge>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Learn;
