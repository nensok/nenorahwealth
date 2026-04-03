import { useState, useEffect, useRef } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a number from its previous value to `target`.
 * Returns the current interpolated value (integer-rounded).
 */
export function useAnimatedNumber(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = currentRef.current;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const next = start + (target - start) * easeOutCubic(progress);
      currentRef.current = next;
      setValue(Math.round(next));
      if (progress < 1) {
        timerRef.current = setTimeout(tick, 16);
      } else {
        currentRef.current = target;
        setValue(target);
      }
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(tick, 16);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [target, duration]);

  return value;
}
