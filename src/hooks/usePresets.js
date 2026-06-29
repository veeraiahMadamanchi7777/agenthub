/** Loads studio presets from mock API. */
import { useEffect, useState } from 'react';
import { getPresets } from '../api/studioApi.js';

export function usePresets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getPresets().then(setPresets).finally(() => setLoading(false));
  }, []);
  return { presets, loading };
}
