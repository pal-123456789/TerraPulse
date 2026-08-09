import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'ultra' | 'hologram' | 'neon';
  hover?: boolean;
  glow?: boolean;
  animate?: boolean;
}

const GlassCard = memo(({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  glow = false,
  animate = false
}: GlassCardProps) => {
  const variants = {
    default: "glass-panel",
    ultra: "glass-ultra",
    hologram: "glass-ultra hologram-effect",
    neon: "glass-ultra neon-border"
  };

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        variants[variant],
        hover && "hover:scale-[1.01] hover:-translate-y-1",
        glow && "glow-border-hover",
        className
      )}
    >
      {/* Animated border gradient */}
      {glow && (
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[1px] rounded-2xl bg-card" />
        </div>
      )}
      
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scanline_4s_linear_infinite]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner accents */}
      <svg className="absolute top-2 left-2 w-4 h-4 text-primary/50" viewBox="0 0 16 16">
        <path d="M0 8 L0 0 L8 0" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute top-2 right-2 w-4 h-4 text-primary/50" viewBox="0 0 16 16">
        <path d="M8 0 L16 0 L16 8" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-2 left-2 w-4 h-4 text-primary/50" viewBox="0 0 16 16">
        <path d="M0 8 L0 16 L8 16" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-2 right-2 w-4 h-4 text-primary/50" viewBox="0 0 16 16">
        <path d="M8 16 L16 16 L16 8" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
});

GlassCard.displayName = 'GlassCard';

export { GlassCard };
export default GlassCard;
