"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, durationMs = 600): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!Number.isFinite(target) || target === 0) {
      setCurrent(0);
      return;
    }

    startValueRef.current = current;
    startRef.current = null;

    function animate(now: number) {
      if (startRef.current === null) {
        startRef.current = now;
      }

      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startValueRef.current + (target - startValueRef.current) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return current;
}
