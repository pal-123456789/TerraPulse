import { memo, useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}

const GlowingCard = memo(({ 
  children, 
  className = "", 
  glowColor = "hsl(180, 100%, 50%)",
  intensity = "medium" 
}: GlowingCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const intensityValues = {
    low: { blur: 40, opacity: 0.15 },
    medium: { blur: 60, opacity: 0.25 },
    high: { blur: 80, opacity: 0.4 },
  };

  const { blur, opacity } = intensityValues[intensity];

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated glow effect following mouse */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          left: mousePosition.x - 100,
          top: mousePosition.y - 100,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: `blur(${blur}px)`,
        }}
        animate={{
          opacity: isHovered ? opacity : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Border glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${glowColor}20, transparent, ${glowColor}10)`,
          opacity: isHovered ? 1 : 0,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Card content */}
      <div className="relative z-10 glass-ultra rounded-xl border border-border/50 transition-colors duration-300 hover:border-primary/30">
        {children}
      </div>

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: 1,
          background: `linear-gradient(135deg, ${glowColor}40, transparent 50%, ${glowColor}20)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        animate={{
          opacity: isHovered ? 1 : 0.3,
        }}
      />
    </motion.div>
  );
});

GlowingCard.displayName = "GlowingCard";

export default GlowingCard;
