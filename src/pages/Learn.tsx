import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { 
  Brain, 
  Globe, 
  Droplets, 
  Wind,
  Activity,
  Sparkles,
  BookOpen,
  GraduationCap,
  FileText,
  Award,
  Play,
  Clock,
  Star,
  Target,
  CheckCircle,
  Lightbulb,
  Map,
  Satellite,
  Shield,
  Waves,
  Flame,
  CloudRain,
  Snowflake,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { LoadingVFX } from "@/components/3D/LoadingVFX";
import { MotionSection } from "@/components/MotionSection";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  level: string;
  icon: string;
  color: string;
  topics: string[];
  order_index: number;
}

interface UserProgress {
  course_id: string;
  progress: number;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Globe, Wind, Brain, Satellite, Waves, Shield, Snowflake, Sun, Flame, CloudRain, Droplets
};

// Memoized course card
const CourseCard = memo(({ course, progress, onStart }: { 
  course: Course;
  progress: number;
  onStart: () => void;
}) => {
  const IconComponent = iconMap[course.icon] || Globe;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <Card className="glass-ultra hover:border-primary/30 transition-all group cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${course.color}20` }}
            >
              <IconComponent className="w-7 h-7" style={{ color: course.color }} />
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
              <div className="flex flex-wrap gap-1 mb-3">
                {course.topics?.slice(0, 3).map((topic, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
          <Button className="w-full mt-4 group-hover:bg-primary/20" variant="outline" onClick={onStart}>
            <Play className="w-4 h-4 mr-2" />
            {progress > 0 ? "Continue Learning" : "Start Course"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

CourseCard.displayName = 'CourseCard';

// Quiz Component
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [funFact, setFunFact] = useState("");

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

  const quizzes = useMemo(() => [
    { question: "What percentage of Earth's atmosphere is nitrogen?", options: ["78%", "21%", "50%", "45%"] },
    { question: "What produces over 50% of the world's oxygen?", options: ["The ocean", "Rainforests", "Trees", "Plankton"] },
    { question: "How many volts are in a lightning bolt?", options: ["1 billion", "1 million", "100 million", "10 billion"] },
    { question: "What causes the El Niño phenomenon?", options: ["Warm Pacific waters", "Cold Atlantic currents", "Volcanic activity", "Solar flares"] },
    { question: "Which layer of the atmosphere contains the ozone layer?", options: ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"] },
  ], []);

  const achievements = useMemo(() => [
    { title: "First Steps", desc: "Complete your first lesson", unlocked: true, icon: Star },
    { title: "Weather Watcher", desc: "Analyze 10 weather patterns", unlocked: true, icon: Wind },
    { title: "Data Scientist", desc: "Complete AI course", unlocked: false, icon: Brain },
    { title: "Global Observer", desc: "Track 50 anomalies", unlocked: false, icon: Globe },
    { title: "Quiz Master", desc: "Score 100% on 5 quizzes", unlocked: false, icon: Lightbulb },
    { title: "Explorer", desc: "Visit all map regions", unlocked: false, icon: Map },
  ], []);

  // Fetch courses from database
  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('course_id, progress')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const progressMap: Record<string, number> = {};
        data.forEach(p => {
          progressMap[p.course_id] = p.progress;
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchCourses(), fetchUserProgress()]);
      setLoading(false);
    };
    init();

    // Fun fact rotation
    const factInterval = setInterval(() => {
      setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    }, 10000);
    setFunFact(funFacts[0]);

    return () => clearInterval(factInterval);
  }, [fetchCourses, fetchUserProgress, funFacts]);

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

  const handleStartCourse = useCallback(async (course: Course) => {
    toast.success(`Starting: ${course.title}`);
    
    // Update progress in database if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_course_progress').upsert({
          user_id: user.id,
          course_id: course.id,
          progress: Math.min(100, (userProgress[course.id] || 0) + 10),
          last_activity: new Date().toISOString()
        }, { onConflict: 'user_id,course_id' });
        
        fetchUserProgress();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [userProgress, fetchUserProgress]);

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
                { label: "Courses Available", value: courses.length, icon: BookOpen, color: "text-primary" },
                { label: "Quiz Score", value: `${quizScore}pts`, icon: Lightbulb, color: "text-yellow-400" },
                { label: "Achievements", value: `${achievements.filter(a => a.unlocked).length}/${achievements.length}`, icon: Award, color: "text-purple-400" },
                { label: "Active Now", value: "2.5K+", icon: Activity, color: "text-green-400" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-ultra p-4">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </MotionSection>

          {/* Fun Fact Banner */}
          <MotionSection delay={0.2}>
            <Card className="glass-ultra border-primary/20 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <p className="text-foreground font-medium">{funFact}</p>
              </div>
            </Card>
          </MotionSection>

          {/* Courses Grid */}
          <MotionSection delay={0.3}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Available Courses
              </h2>
              <Badge variant="outline" className="text-primary border-primary/30">
                {courses.length} Courses
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={userProgress[course.id] || 0}
                  onStart={() => handleStartCourse(course)}
                />
              ))}
            </div>
          </MotionSection>

          {/* Quiz Section */}
          <MotionSection delay={0.4}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <Target className="w-6 h-6 text-primary" />
                  Quick Quiz
                </h2>
                <QuizCard
                  question={quizzes[currentQuiz].question}
                  options={quizzes[currentQuiz].options}
                  onAnswer={handleQuizAnswer}
                />
              </div>

              {/* Achievements */}
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-primary" />
                  Achievements
                </h2>
                <Card className="glass-ultra">
                  <CardContent className="p-4 space-y-3">
                    {achievements.map((achievement, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          achievement.unlocked 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-muted/10 border-border/30 opacity-50'
                        }`}
                      >
                        <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                        </div>
                        {achievement.unlocked && <CheckCircle className="w-5 h-5 text-green-400" />}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </MotionSection>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Learn;