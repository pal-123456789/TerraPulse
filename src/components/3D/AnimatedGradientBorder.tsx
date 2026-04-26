import { memo, ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedGradientBorderProps {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
}

const AnimatedGradientBorder = memo(({ 
  children, 
  className = "",
  borderWidth = 2,
  duration = 3
}: AnimatedGradientBorderProps) => {
  return (
    <div className={`relative ${className}`}>
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ padding: borderWidth }}
      >
        <motion.div
          className="absolute inset-[-100%] w-[300%] h-[300%]"
          style={{
            background: `conic-gradient(
              from 0deg,
              hsl(180, 100%, 50%),
              hsl(270, 70%, 60%),
              hsl(180, 100%, 50%),
              hsl(160, 100%, 50%),
              hsl(180, 100%, 50%)
            )`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Inner content */}
      <div 
        className="relative z-10 rounded-xl bg-card"
        style={{ margin: borderWidth }}
      >
        {children}
      </div>
    </div>
  );
});

AnimatedGradientBorder.displayName = "AnimatedGradientBorder";

export default AnimatedGradientBorder;
