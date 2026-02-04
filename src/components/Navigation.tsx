import { Link, useLocation } from "react-router-dom";
import { Globe, Compass, History, BarChart2, Info, BarChart3, GraduationCap, Menu, X, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./Auth/UserMenu";
import { useEffect, useState, memo } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

const NavItem = memo(({ to, label, icon: Icon, isActive, onClick }: {
  to: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 relative group/link overflow-hidden",
      isActive
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
    )}
  >
    {/* Hover shimmer effect */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover/link:opacity-100"
      initial={{ x: "-100%" }}
      whileHover={{ x: "100%" }}
      transition={{ duration: 0.5 }}
    />
    
    <Icon className={cn("w-4 h-4 relative z-10", isActive && "animate-pulse-glow")} />
    <span className="text-sm md:text-base relative z-10">{label}</span>
    
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 border border-primary/50 rounded-lg"
        style={{ boxShadow: '0 0 15px hsla(180, 100%, 50%, 0.3)' }}
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
    
    {isActive && (
      <motion.div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full"
        layoutId="activeIndicator"
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </Link>
));

NavItem.displayName = "NavItem";

const Navigation = memo(() => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: "/", label: "Home", icon: Globe },
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/map", label: "Map", icon: Map },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/history", label: "History", icon: History },
    { to: "/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/learn", label: "Learn", icon: GraduationCap },
    { to: "/about", label: "About", icon: Info },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-500",
        scrolled 
          ? "bg-card/90 shadow-lg shadow-primary/5 border-b border-border/50" 
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Animated gradient line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: scrolled ? 1 : 0, opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/20 blur-md" />
              <Globe className="w-6 h-6 md:w-8 md:h-8 text-primary relative z-10" />
            </motion.div>
            <motion.span 
              className="text-lg md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              Terra<span className="text-primary text-glow">Pulse</span>
            </motion.span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  isActive={location.pathname === item.to}
                />
              ))}
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden relative overflow-hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            
            <UserMenu />
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="lg:hidden overflow-hidden"
            >
              <motion.div 
                className="mt-4 pb-4 space-y-2"
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: { transition: { staggerChildren: 0.05 } },
                  closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }
                }}
              >
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <motion.div
                      key={item.to}
                      variants={{
                        open: { opacity: 1, x: 0 },
                        closed: { opacity: 0, x: -20 }
                      }}
                    >
                      <Link
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          isActive
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
});

Navigation.displayName = "Navigation";

export default Navigation;
