import { useCallback, useState } from 'react';

export const useApiRequest = <R>() => {
  const [response, setResponse] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const executeFetch = useCallback(
    async (
      url: string | URL | globalThis.Request,
      requestInit?: RequestInit
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, requestInit);
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
  return { executeFetch, response, loading, error };
};
