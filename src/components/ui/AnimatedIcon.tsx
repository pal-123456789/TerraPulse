import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  color?: string;
  animate?: 'pulse' | 'spin' | 'bounce' | 'float' | 'glow' | 'none';
  hoverEffect?: boolean;
}

const AnimatedIcon = memo(({
  icon: Icon,
  className,
  size = 24,
  color,
  animate = 'none',
  hoverEffect = true
}: AnimatedIconProps) => {
  const animations = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    spin: {
      rotate: 360,
      transition: { duration: 3, repeat: Infinity, ease: "linear" }
    },
    bounce: {
      y: [0, -8, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    float: {
      y: [0, -5, 0],
      rotate: [0, 5, -5, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    glow: {
      filter: [
        "drop-shadow(0 0 2px currentColor)",
        "drop-shadow(0 0 10px currentColor)",
        "drop-shadow(0 0 2px currentColor)"
      ],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    none: {}
  };

  return (
    <motion.div
      animate={animations[animate]}
      whileHover={hoverEffect ? { scale: 1.15, rotate: 5 } : undefined}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Icon 
        size={size} 
        style={{ color }}
        className="transition-colors duration-300"
      />
    </motion.div>
  );
});

AnimatedIcon.displayName = 'AnimatedIcon';

export { AnimatedIcon };
export default AnimatedIcon;
