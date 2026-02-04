import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
  Video,
  X,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingVFX } from "@/components/3D/LoadingVFX";
import { MotionSection } from "@/components/MotionSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface LessonContent {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  content_type: 'text' | 'video' | 'quiz';
  content: {
    description?: string;
    key_points?: string[];
    video_url?: string;
    questions?: Array<{
      question: string;
      options: string[];
      correct_index: number;
    }>;
  };
  duration_minutes: number;
  order_index: number;
}

interface UserProgress {
  course_id: string;
  progress: number;
  completed_lessons: number[];
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Globe, Wind, Brain, Satellite, Waves, Shield, Snowflake, Sun, Flame, CloudRain, Droplets
};

// Memoized course card
const CourseCard = memo(({ course, progress, completedLessons, onStart }: { 
  course: Course;
  progress: number;
  completedLessons: number;
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
                  {completedLessons}/{course.lessons} lessons
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
          <Button className="w-full mt-4" onClick={onStart}>
            <Play className="w-4 h-4 mr-2" />
            {progress > 0 ? "Continue Learning" : "Start Course"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

CourseCard.displayName = 'CourseCard';

// Lesson Modal Component
const LessonModal = memo(({ 
  isOpen, 
  onClose, 
  course, 
  lessons, 
  currentLesson, 
  setCurrentLesson,
  completedLessons,
  onCompleteLesson,
  onQuizAnswer
}: {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  lessons: LessonContent[];
  currentLesson: number;
  setCurrentLesson: (n: number) => void;
  completedLessons: number[];
  onCompleteLesson: (lessonNumber: number) => void;
  onQuizAnswer: (correct: boolean) => void;
}) => {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizRevealed, setQuizRevealed] = useState(false);
  
  const lesson = lessons[currentLesson];
  
  const handleQuizSubmit = () => {
    if (!lesson || lesson.content_type !== 'quiz') return;
    
    const questions = lesson.content.questions || [];
    let correct = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) correct++;
    });
    
    setQuizRevealed(true);
    const score = Math.round((correct / questions.length) * 100);
    
    if (score >= 70) {
      toast.success(`Quiz passed! Score: ${score}%`);
      onQuizAnswer(true);
      onCompleteLesson(lesson.lesson_number);
    } else {
      toast.error(`Quiz failed. Score: ${score}%. Try again!`);
      onQuizAnswer(false);
    }
  };
  
  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizRevealed(false);
  };
  
  useEffect(() => {
    resetQuiz();
  }, [currentLesson]);

  if (!course || !lesson) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-ultra border-primary/30">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to courses
            </Button>
          </div>
          <DialogTitle className="text-2xl text-foreground flex items-center gap-3">
            {lesson.content_type === 'text' && <BookOpen className="w-6 h-6 text-primary" />}
            {lesson.content_type === 'video' && <Video className="w-6 h-6 text-primary" />}
            {lesson.content_type === 'quiz' && <Target className="w-6 h-6 text-primary" />}
            {lesson.title}
          </DialogTitle>
        </DialogHeader>
        
        {/* Lesson Progress */}
        <div className="flex items-center gap-2 mb-6">
          {lessons.map((l, idx) => (
            <button
              key={l.id}
              onClick={() => setCurrentLesson(idx)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                completedLessons.includes(l.lesson_number)
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                  : idx === currentLesson
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted/20 text-muted-foreground border border-border/50'
              }`}
            >
              {completedLessons.includes(l.lesson_number) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-bold">{idx + 1}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Lesson Content */}
        <div className="space-y-6">
          {lesson.content_type === 'text' && (
            <div className="space-y-4">
              <p className="text-foreground text-lg leading-relaxed">
                {lesson.content.description}
              </p>
              {lesson.content.key_points && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Key Points
                  </h4>
                  <ul className="space-y-2">
                    {lesson.content.key_points.map((point, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 text-muted-foreground"
                      >
                        <ChevronRight className="w-4 h-4 text-primary mt-1 shrink-0" />
                        <span>{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              <Button 
                className="w-full mt-6"
                onClick={() => onCompleteLesson(lesson.lesson_number)}
                disabled={completedLessons.includes(lesson.lesson_number)}
              >
                {completedLessons.includes(lesson.lesson_number) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </div>
          )}
          
          {lesson.content_type === 'video' && (
            <div className="space-y-4">
              <div className="aspect-video bg-card/50 rounded-xl border border-border/50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Video content placeholder</p>
                  <p className="text-sm text-muted-foreground">{lesson.content.description}</p>
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={() => onCompleteLesson(lesson.lesson_number)}
                disabled={completedLessons.includes(lesson.lesson_number)}
              >
                {completedLessons.includes(lesson.lesson_number) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Watched
                  </>
                )}
              </Button>
            </div>
          )}
          
          {lesson.content_type === 'quiz' && (
            <div className="space-y-6">
              {lesson.content.questions?.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    {qIdx + 1}. {q.question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => !quizRevealed && setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                        disabled={quizRevealed}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          quizRevealed
                            ? oIdx === q.correct_index
                              ? 'bg-green-500/20 border-green-500 text-green-400'
                              : quizAnswers[qIdx] === oIdx
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-muted/10 border-border/50 text-muted-foreground'
                            : quizAnswers[qIdx] === oIdx
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-card/50 border-border/50 text-foreground hover:border-primary/50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3">
                {!quizRevealed ? (
                  <Button 
                    className="flex-1"
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < (lesson.content.questions?.length || 0)}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button 
                    className="flex-1"
                    variant="outline"
                    onClick={resetQuiz}
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
            disabled={currentLesson === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={() => setCurrentLesson(Math.min(lessons.length - 1, currentLesson + 1))}
            disabled={currentLesson === lessons.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

LessonModal.displayName = 'LessonModal';

const Learn = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonsByCoure, setLessonsByCourse] = useState<Record<string, LessonContent[]>>({});
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [quizScore, setQuizScore] = useState(0);
  const [funFact, setFunFact] = useState("");
  
  // Modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const achievements = useMemo(() => [
    { title: "First Steps", desc: "Complete your first lesson", unlocked: Object.values(userProgress).some(p => p.completed_lessons?.length > 0), icon: Star },
    { title: "Weather Watcher", desc: "Complete a weather course", unlocked: false, icon: Wind },
    { title: "Data Scientist", desc: "Complete AI course", unlocked: false, icon: Brain },
    { title: "Global Observer", desc: "Complete 5 courses", unlocked: Object.values(userProgress).filter(p => p.progress === 100).length >= 5, icon: Globe },
    { title: "Quiz Master", desc: "Score 100% on 5 quizzes", unlocked: quizScore >= 50, icon: Lightbulb },
    { title: "Explorer", desc: "Start all courses", unlocked: Object.keys(userProgress).length >= courses.length, icon: Map },
  ], [userProgress, quizScore, courses.length]);

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
        
        // Fetch lessons for all courses
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lesson_content')
          .select('*')
          .in('course_id', data.map(c => c.id))
          .order('order_index', { ascending: true });
          
        if (lessonsError) throw lessonsError;
        
        if (lessonsData) {
          const grouped: Record<string, LessonContent[]> = {};
          lessonsData.forEach(lesson => {
            if (!grouped[lesson.course_id]) grouped[lesson.course_id] = [];
            grouped[lesson.course_id].push(lesson as LessonContent);
          });
          setLessonsByCourse(grouped);
        }
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
        .select('course_id, progress, completed_lessons')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const progressMap: Record<string, UserProgress> = {};
        data.forEach(p => {
          progressMap[p.course_id] = {
            course_id: p.course_id,
            progress: p.progress,
            completed_lessons: p.completed_lessons || []
          };
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

  const handleCompleteLesson = useCallback(async (lessonNumber: number) => {
    if (!selectedCourse) return;
    
    const currentProgress = userProgress[selectedCourse.id] || { course_id: selectedCourse.id, progress: 0, completed_lessons: [] };
    
    if (currentProgress.completed_lessons.includes(lessonNumber)) return;
    
    const newCompletedLessons = [...currentProgress.completed_lessons, lessonNumber];
    const totalLessons = lessonsByCoure[selectedCourse.id]?.length || 1;
    const newProgress = Math.round((newCompletedLessons.length / totalLessons) * 100);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to track progress');
        return;
      }

      const { error } = await supabase.from('user_course_progress').upsert({
        user_id: user.id,
        course_id: selectedCourse.id,
        progress: newProgress,
        completed_lessons: newCompletedLessons,
        last_activity: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });
      
      if (error) throw error;
      
      setUserProgress(prev => ({
        ...prev,
        [selectedCourse.id]: {
          ...currentProgress,
          progress: newProgress,
          completed_lessons: newCompletedLessons
        }
      }));
      
      toast.success(`Lesson completed! Progress: ${newProgress}%`);
      
      if (newProgress === 100) {
        toast.success(`🎉 Congratulations! You've completed ${selectedCourse.title}!`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to save progress');
    }
  }, [selectedCourse, userProgress, lessonsByCoure]);

  const handleQuizAnswer = useCallback((correct: boolean) => {
    if (correct) {
      setQuizScore(prev => prev + 10);
    }
  }, []);

  const handleStartCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setCurrentLessonIndex(0);
    setIsModalOpen(true);
  }, []);

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
                { label: "Courses Completed", value: Object.values(userProgress).filter(p => p.progress === 100).length, icon: Activity, color: "text-green-400" }
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
                  progress={userProgress[course.id]?.progress || 0}
                  completedLessons={userProgress[course.id]?.completed_lessons?.length || 0}
                  onStart={() => handleStartCourse(course)}
                />
              ))}
            </div>
          </MotionSection>

          {/* Achievements */}
          <MotionSection delay={0.4}>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
              <Award className="w-6 h-6 text-primary" />
              Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`glass-ultra p-4 ${
                    achievement.unlocked 
                      ? 'border-primary/30' 
                      : 'opacity-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? 'bg-primary/20' : 'bg-muted/20'
                      }`}>
                        <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </MotionSection>
        </div>
      </div>

      <Footer />
      
      {/* Lesson Modal */}
      <LessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        lessons={selectedCourse ? lessonsByCoure[selectedCourse.id] || [] : []}
        currentLesson={currentLessonIndex}
        setCurrentLesson={setCurrentLessonIndex}
        completedLessons={selectedCourse ? userProgress[selectedCourse.id]?.completed_lessons || [] : []}
        onCompleteLesson={handleCompleteLesson}
        onQuizAnswer={handleQuizAnswer}
      />
    </div>
  );
};

export default Learn;
