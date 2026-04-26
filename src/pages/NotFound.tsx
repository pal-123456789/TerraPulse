import { Link } from "react-router-dom";
import { Home, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-space-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-10" />
      
      <motion.div 
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated 404 */}
        <motion.div 
          className="mb-8"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Globe className="w-24 h-24 mx-auto text-primary mb-4" />
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-4">
          4<span className="text-primary">0</span>4
        </h1>
        
        <h2 className="text-xl md:text-2xl text-muted-foreground mb-2">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for seems to have drifted into uncharted territory. 
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-primary/30 text-foreground hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
