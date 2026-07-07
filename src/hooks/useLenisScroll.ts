import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;
};

const isCapacitor = () =>
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useLenisScroll = () => {
  useEffect(() => {
    // Skip Lenis on: desktop (native scroll is faster), native Capacitor
    // WebView (uses native momentum), or reduced-motion users.
    if (!isMobile() || isCapacitor() || prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    let animationId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationId = requestAnimationFrame(raf);
    }

    animationId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationId);
      lenis.destroy();
    };
  }, []);
};
