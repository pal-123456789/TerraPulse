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
  BarChart
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingVFX } from "@/components/3D/LoadingVFX";
import { MotionSection, StaggerContainer, StaggerItem } from "@/components/MotionSection";
import { Button } from "@/components/ui/button";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";

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
  <Card className="glass-ultra hover:glow-border transition-all group cursor-pointer">
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
  const { speak } = useVoiceGuidance();

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
    { title: "Satellite Data Interpretation", duration: "2h 45m", lessons: 15, level: "Intermediate", progress: 0, icon: Activity, description: "Read and analyze satellite imagery for environmental insights" },
    { title: "Ocean & Marine Systems", duration: "3h", lessons: 16, level: "Intermediate", progress: 0, icon: Droplets, description: "Understanding ocean currents and marine ecosystems" },
    { title: "Disaster Preparedness", duration: "2h", lessons: 10, level: "Beginner", progress: 0, icon: Target, description: "Learn how to prepare for and respond to natural disasters" },
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
      speak("Correct! Great job!");
      toast.success("Correct! +10 points");
    } else {
      speak("Not quite. The correct answer was " + quizzes[currentQuiz].options[0]);
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
  }, [currentQuiz, quizScore, quizzes, speak]);

  const handleStartCourse = useCallback((index: number) => {
    setActiveLesson(index);
    speak(`Starting course: ${courses[index].title}`);
    toast.success(`Starting: ${courses[index].title}`);
  }, [courses, speak]);

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
    <div className="min-h-screen bg-space-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20" />
      
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
              <GraduationCap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Interactive Learning Hub</span>
            </motion.div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Learn & Explore
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
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
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
              <TabsTrigger value="courses" className="text-sm sm:text-base">
                <Video className="w-4 h-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-sm sm:text-base">
                <Lightbulb className="w-4 h-4 mr-2" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="realtime" className="text-sm sm:text-base">
                <Zap className="w-4 h-4 mr-2" />
                Real-Time
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-sm sm:text-base">
                <BarChart className="w-4 h-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-sm sm:text-base">
                <Award className="w-4 h-4 mr-2" />
                Badges
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, i) => (
                  <StaggerItem key={i}>
                    <CourseCard course={course} onStart={() => handleStartCourse(i)} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </TabsContent>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Test Your Knowledge</h2>
                  <p className="text-muted-foreground">Question {currentQuiz + 1} of {quizzes.length}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    {quizzes.map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${i === currentQuiz ? 'bg-primary' : i < currentQuiz ? 'bg-green-400' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                </div>
                <QuizCard
                  key={currentQuiz}
                  question={quizzes[currentQuiz].question}
                  options={quizzes[currentQuiz].options}
                  onAnswer={handleQuizAnswer}
                />
              </div>
            </TabsContent>

            {/* Real-Time Data Tab */}
            <TabsContent value="realtime" className="space-y-6">
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Thermometer, label: "Temperature", value: liveData?.temperature?.toFixed(1) || "--", unit: "°C", color: "text-orange-500", max: 50 },
                  { icon: Droplets, label: "Humidity", value: liveData?.humidity?.toFixed(0) || "--", unit: "%", color: "text-blue-500", max: 100 },
                  { icon: Wind, label: "Wind Speed", value: liveData?.wind_speed?.toFixed(1) || "--", unit: "m/s", color: "text-cyan-500", max: 30 },
                  { icon: Activity, label: "Pressure", value: liveData?.pressure?.toFixed(0) || "--", unit: "hPa", color: "text-purple-500", max: 1100 },
                ].map((metric, i) => (
                  <StaggerItem key={i}>
                    <Card className="glass-ultra hover:glow-border transition-all">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {metric.value}{metric.unit}
                        </div>
                        <Progress 
                          value={(parseFloat(String(metric.value)) || 0) / metric.max * 100} 
                          className="mt-3"
                        />
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Active Anomalies */}
              <Card className="glass-ultra">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Active Environmental Events ({anomalyCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeAnomalies.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 mx-auto text-green-400 mb-3" />
                      <p className="text-muted-foreground">No active anomalies detected. Environment is stable! 🌍</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAnomalies.map((anomaly, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{anomaly.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Detected: {new Date(anomaly.detected_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-ultra">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Climate Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Global Temperature Rise", value: "+1.1°C", progress: 73 },
                      { label: "Sea Level Rise", value: "+21cm", progress: 65 },
                      { label: "Arctic Ice Decline", value: "-13%", progress: 87 },
                      { label: "CO2 Concentration", value: "421 ppm", progress: 82 },
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-ultra">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Monitoring Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Active Sensors", value: "1,247" },
                      { label: "Data Points Today", value: "45.8K" },
                      { label: "Countries Covered", value: "127" },
                      { label: "Predictions Made", value: "892" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-2xl font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <Card className="glass-ultra">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Your Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {achievements.map((achievement, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                        className={`text-center p-4 rounded-xl border cursor-pointer transition-all ${
                          achievement.unlocked 
                            ? 'bg-primary/10 border-primary/30 glow-border' 
                            : 'bg-card/50 border-border/50 opacity-60 grayscale'
                        }`}
                      >
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                          achievement.unlocked ? 'bg-yellow-400/20' : 'bg-muted/20'
                        }`}>
                          <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                        </div>
                        <h4 className="font-semibold text-sm text-foreground">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.desc}</p>
                        {achievement.unlocked && (
                          <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">Unlocked</Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Learn;
