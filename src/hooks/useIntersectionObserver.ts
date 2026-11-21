import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  defaultVisible?: boolean;
}

/**
 * Observes a persistent container element so heavy WebGL canvases can mount
 * only when entering the viewport and immediately dispose GPU resources when exiting.
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.05,
    rootMargin = '80px',
    root = null,
    defaultVisible = false,
  } = options;

  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(() => {
    if (typeof IntersectionObserver === 'undefined') return true;
    return defaultVisible;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
        }
      },
      { threshold, rootMargin, root }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, root]);

  return { ref, isIntersecting };
}
