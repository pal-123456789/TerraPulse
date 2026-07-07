import { useEffect, useRef, memo } from 'react';

interface MatrixRainProps {
  className?: string;
  opacity?: number;
  speed?: number;
  color?: string;
}

const MatrixRain = memo(({ 
  className = "", 
  opacity = 0.1, 
  speed = 50,
  color = "0, 255, 255" // RGB format
}: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix characters (mix of katakana, numbers, and symbols)
    const chars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()';
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track drop position for each column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Gradient effect - brighter at the head
        const headOpacity = 1;
        const tailOpacity = 0.5;
        
        // Draw the leading character (brighter)
        ctx.fillStyle = `rgba(${color}, ${headOpacity})`;
        ctx.fillText(char, x, y);
        
        // Draw trailing character (dimmer)
        if (drops[i] > 0) {
          ctx.fillStyle = `rgba(${color}, ${tailOpacity})`;
          ctx.fillText(charArray[Math.floor(Math.random() * charArray.length)], x, y - fontSize);
        }

        // Reset drop when it reaches bottom or randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, speed);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, [speed, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity }}
    />
  );
});

MatrixRain.displayName = 'MatrixRain';

export { MatrixRain };
export default MatrixRain;
