import { useState, useCallback } from 'react';

/**
 * Generic API hook with loading, error, and data state management.
 * @param {Function} apiFunction - The API function to call
 * @returns {{ data, loading, error, execute, reset }}
 */
export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        if (result.success) {
          setData(result.data);
          setLoading(false);
          return result;
        } else {
          setError(result.error || 'An error occurred');
          setLoading(false);
          return result;
        }
      } catch (err) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
