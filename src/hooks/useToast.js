import { useCallback, useEffect, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.duration ?? 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const show = useCallback((message, { error = false, duration } = {}) => {
    setToast({ message, error, duration });
  }, []);

  return { toast, show };
}
