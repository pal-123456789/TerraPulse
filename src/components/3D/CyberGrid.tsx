import { memo } from 'react';

interface CyberGridProps {
  className?: string;
  animate?: boolean;
  perspective?: boolean;
}

const CyberGrid = memo(({ className = "", animate = true, perspective = true }: CyberGridProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Perspective floor grid */}
      {perspective && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-[50vh]"
          style={{
            background: `
              linear-gradient(to bottom, transparent 0%, hsla(222, 47%, 5%, 0.95) 100%),
              repeating-linear-gradient(
                90deg,
                hsla(180, 100%, 50%, 0.1) 0px,
                hsla(180, 100%, 50%, 0.1) 1px,
                transparent 1px,
                transparent 60px
              ),
              repeating-linear-gradient(
                0deg,
                hsla(180, 100%, 50%, 0.1) 0px,
                hsla(180, 100%, 50%, 0.1) 1px,
                transparent 1px,
                transparent 60px
              )
            `,
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center bottom',
          }}
        />
      )}
      
      {/* Animated scan line */}
      {animate && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-[scanline_4s_linear_infinite]"
            style={{ top: '-2px' }}
          />
        </div>
      )}
      
      {/* Corner decorations */}
      <svg className="absolute top-4 left-4 w-20 h-20 text-primary/30" viewBox="0 0 100 100">
        <path d="M0 30 L0 0 L30 0" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="0" cy="0" r="4" fill="currentColor" />
      </svg>
      <svg className="absolute top-4 right-4 w-20 h-20 text-primary/30" viewBox="0 0 100 100">
        <path d="M70 0 L100 0 L100 30" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="0" r="4" fill="currentColor" />
      </svg>
      <svg className="absolute bottom-4 left-4 w-20 h-20 text-primary/30" viewBox="0 0 100 100">
        <path d="M0 70 L0 100 L30 100" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="0" cy="100" r="4" fill="currentColor" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-20 h-20 text-primary/30" viewBox="0 0 100 100">
        <path d="M70 100 L100 100 L100 70" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="4" fill="currentColor" />
      </svg>
    </div>
  );
});

CyberGrid.displayName = 'CyberGrid';

export { CyberGrid };
export default CyberGrid;
