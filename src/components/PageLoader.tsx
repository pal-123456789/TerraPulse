/**
 * Lightweight CSS-only page loader.
 * Intentionally avoids Lottie / large deps so it doesn't block first paint
 * while Suspense boundaries resolve.
 */
const PageLoader = ({ label = "Launching TerraGuardians" }: { label?: string }) => {
  return (
    <div
      className="min-h-screen bg-space-gradient flex flex-col items-center justify-center px-4 overflow-hidden relative"
      role="status"
      aria-live="polite"
    >
      {/* Glow ring */}
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

      {/* Dual spinning rings */}
      <div className="relative w-24 h-24" aria-hidden="true">
        <div className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <div
          className="absolute inset-3 border-2 border-accent/30 border-b-accent rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>

      {/* Label */}
      <div className="relative mt-6 flex flex-col items-center gap-3">
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
