import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'cyan' | 'purple' | 'pink' | 'gradient';
  animate?: boolean;
  flicker?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const NeonText = memo(({ 
  children, 
  className,
  variant = 'cyan',
  animate = false,
  flicker = false,
  size = 'lg'
}: NeonTextProps) => {
  const colors = {
    cyan: "text-primary [text-shadow:0_0_10px_hsl(var(--primary)),0_0_20px_hsl(var(--primary)),0_0_40px_hsl(var(--primary)/0.5)]",
    purple: "text-purple-400 [text-shadow:0_0_10px_#a855f7,0_0_20px_#a855f7,0_0_40px_rgba(168,85,247,0.5)]",
    pink: "text-pink-400 [text-shadow:0_0_10px_#ec4899,0_0_20px_#ec4899,0_0_40px_rgba(236,72,153,0.5)]",
    gradient: "bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
  };

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    '2xl': "text-2xl",
    '3xl': "text-3xl md:text-4xl",
    '4xl': "text-4xl md:text-5xl lg:text-6xl",
    '5xl': "text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
  };

  const content = (
    <span className={cn(
      "font-bold tracking-tight",
      colors[variant],
      sizes[size],
      flicker && "animate-neon-flicker",
      className
    )}>
      {children}
    </span>
  );

  if (animate) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {content}
      </motion.span>
    );
  }

  return content;
});

NeonText.displayName = 'NeonText';

export { NeonText };
export default NeonText;
