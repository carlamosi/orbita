import { useEffect, useRef } from 'react';

/**
 * Custom hook to track scroll progress from 0 to 1
 * Using requestAnimationFrame for 60fps performance without triggering React state re-renders.
 */
export function useScrollProgress(callback) {
  const requestRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
          
          if (callback) {
            callback(progress);
          }
          requestRef.current = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
}
