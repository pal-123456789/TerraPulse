import { forwardRef, memo, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CyberButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const CyberButton = memo(forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = true, pulse = false, children, onClick, disabled, type = 'button' }, ref) => {
    const baseStyles = "relative overflow-hidden font-semibold transition-all duration-300 transform-gpu cursor-pointer";
    
    const variants = {
      primary: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]",
      secondary: "bg-secondary/50 text-secondary-foreground border border-primary/30 hover:border-primary hover:bg-secondary/70",
      ghost: "bg-transparent text-primary border border-primary/50 hover:bg-primary/10 hover:border-primary",
      neon: "bg-transparent text-primary border-2 border-primary hover:shadow-[0_0_20px_hsl(var(--primary)),inset_0_0_20px_hsl(var(--primary)/0.2)]"
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm rounded-lg",
      md: "px-6 py-3 text-base rounded-xl",
      lg: "px-8 py-4 text-lg rounded-xl",
      xl: "px-10 py-5 text-xl rounded-2xl"
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glow && "cyber-glow",
          pulse && "animate-pulse-glow",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {/* Shimmer effect */}
        <span className="absolute inset-0 overflow-hidden rounded-inherit">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-slide_2s_ease-in-out_infinite]" />
        </span>
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* Border glow */}
        {glow && (
          <span className="absolute inset-0 rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="absolute inset-[-2px] rounded-inherit bg-gradient-to-r from-primary via-accent to-primary animate-[border-rotate_3s_linear_infinite] opacity-50 blur-sm" />
          </span>
        )}
      </motion.button>
    );
  }
));

CyberButton.displayName = 'CyberButton';

export { CyberButton };
export default CyberButton;
