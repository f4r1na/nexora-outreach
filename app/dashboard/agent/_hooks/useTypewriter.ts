import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function useTypewriter(text: string, active: boolean): string {
  const prefersReduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(active && !prefersReduced ? '' : text);

  useEffect(() => {
    if (!active || prefersReduced) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, active, prefersReduced]);

  return displayed;
}
