import { useCallback, useEffect, useState } from 'react';
import { error_toast } from '@/app/utils/utils';

export default function useFetch<R>() {
  const [response, setResponse] = useState<R | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(
    async (input: string | URL | globalThis.Request, init?: RequestInit) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(input, init || {});
        if (!response.ok) {
          setError('Response not ok');
          setLoading(false);
          return;
        }
        setResponse(await response.json());
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );
  useEffect(() => {
    if (error) {
      error_toast(error);
    }
  }, [error]);
  return { fetchData, response, loading, error } as const;
}
