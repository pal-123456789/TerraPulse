import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MorphingTextProps {
  texts: string[];
  className?: string;
  interval?: number;
}

const MorphingText = memo(({ texts, className = "", interval = 3000 }: MorphingTextProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block text-primary text-glow-strong"
        >
          {texts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});

MorphingText.displayName = "MorphingText";

export default MorphingText;
