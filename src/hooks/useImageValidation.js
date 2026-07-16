import { useCallback, useState } from 'react';

export function useImageValidation() {
  const [state, setState] = useState(null); // null | 'checking' | result object

  const validate = useCallback(async (image) => {
    if (!image.trim()) { setState(null); return; }
    setState('checking');
    try {
      const res = await fetch(`/api/agents/validate-image?image=${encodeURIComponent(image)}`);
      setState(await res.json());
    } catch {
      setState({ valid: false, error: 'Could not reach validation service' });
    }
  }, []);

  const reset = useCallback(() => setState(null), []);

  return { validationState: state, validate, resetValidation: reset };
}
