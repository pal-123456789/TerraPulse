import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
  color?: string;
  delay?: number;
}

const StatCard = memo(({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  color = "hsl(var(--primary))",
  delay = 0
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "relative overflow-hidden rounded-2xl glass-ultra p-6 group cursor-default",
        className
      )}
    >
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}15 0%, transparent 50%)`
        }}
      />
      
      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[scanline_3s_linear_infinite]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ 
              background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
              boxShadow: `0 0 20px ${color}20`
            }}
          >
            {icon}
          </div>
          
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                trend.positive 
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {trend.positive ? '↗' : '↘'} {trend.value}
            </motion.div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-1 font-medium">{title}</p>
        
        <motion.p 
          className="text-3xl md:text-4xl font-bold text-foreground"
          style={{ 
            textShadow: `0 0 30px ${color}30`
          }}
        >
          {value}
        </motion.p>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-primary/30" />
      <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-primary/30" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-primary/30" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-primary/30" />
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

export { StatCard };
export default StatCard;
