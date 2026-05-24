/**
 * Rocket launch loader — uses the user-provided Lottie animation.
 * Lightweight, GPU-accelerated, ~6s loop.
 */
import Lottie from "lottie-react";
import rocketAnimation from "@/assets/lottie/rocket-launch.json";

const PageLoader = ({ label = "Launching TerraGuardians" }: { label?: string }) => {
  return (
    <div
      className="min-h-screen bg-space-gradient flex flex-col items-center justify-center px-4 overflow-hidden relative"
      role="status"
      aria-live="polite"
    >
      {/* Twinkling starfield */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-foreground/70"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `pulse ${1.5 + Math.random() * 2.5}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Glow ring behind animation */}
      <div
        className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, hsl(var(--accent) / 0.12) 35%, transparent 70%)",
          filter: "blur(40px)",
          animation: "pulse 4s ease-in-out infinite",
        }}
        aria-hidden="true"
      />

      {/* Rocket Lottie */}
      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
        <Lottie
          animationData={rocketAnimation}
          loop
          autoplay
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        />
      </div>

      {/* Label */}
      <div className="relative mt-2 flex flex-col items-center gap-3">
        <span className="text-primary font-semibold tracking-[0.3em] text-xs sm:text-sm uppercase">
          {label}
        </span>
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                animation: "pulse 1s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </span>
      </div>

      <span className="sr-only">Loading content, please wait</span>
    </div>
  );
};

export default PageLoader;
