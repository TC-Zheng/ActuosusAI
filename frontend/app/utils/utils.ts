import { toast } from 'react-toastify';
import { useCallback, useEffect, useRef } from 'react';

export const error_toast = (message: string) => {
  toast.error(message, { position: 'bottom-center', theme: 'colored' });
};

export const success_toast = (message: string) => {
  toast.success(message, { position: 'bottom-center', theme: 'colored' });
};

export const warning_toast = (message: string) => {
  toast.warning(message, { position: 'bottom-center', theme: 'colored' });
};

type Timer = ReturnType<typeof setTimeout>;

export function useDebounce<A extends unknown[]>(
  func: (...args: A) => void,
  delay = 1000
) {
  const timer = useRef<Timer>();

  useEffect(() => {
    return () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    (...args: A) => {
      const newTimer = setTimeout(() => {
        func(...args);
      }, delay);
      clearTimeout(timer.current);
      timer.current = newTimer;
    },
    [func, delay]
  );
}
