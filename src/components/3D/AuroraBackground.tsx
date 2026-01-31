import { memo, useEffect, useRef } from "react";

const AuroraBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const colors = [
      { h: 180, s: 100, l: 50 }, // Cyan
      { h: 270, s: 70, l: 60 },  // Purple
      { h: 200, s: 80, l: 50 },  // Blue
      { h: 160, s: 100, l: 40 }, // Teal
    ];

    const animate = () => {
      time += 0.003;
      
      // Clear with fade effect
      ctx.fillStyle = "rgba(5, 10, 20, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Draw aurora waves
      for (let i = 0; i < 3; i++) {
        const color = colors[i % colors.length];
        ctx.beginPath();
        
        for (let x = 0; x <= width; x += 4) {
          const y = height * 0.3 + 
            Math.sin(x * 0.002 + time + i * 0.5) * 80 +
            Math.sin(x * 0.005 + time * 1.5 + i) * 40 +
            Math.sin(x * 0.001 + time * 0.5) * 60;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.05)`);
        gradient.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.02)`);
        gradient.addColorStop(1, "transparent");
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6, mixBlendMode: "screen" }}
    />
  );
});

AuroraBackground.displayName = "AuroraBackground";

export default AuroraBackground;
