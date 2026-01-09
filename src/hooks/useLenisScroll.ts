import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export const useLenisScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => {
        // Custom easing curve for smoother, more anime-like motion
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.5,
      touchMultiplier: 2.5,
      infinite: false,
      syncTouch: true,
      syncTouchLerp: 0.1,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Add intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all cards and sections
    document.querySelectorAll('.glass-panel, section').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      lenis.destroy();
      observer.disconnect();
    };
  }, []);
};
