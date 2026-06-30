/** Scheduled agent runs — persisted in localStorage. */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'agenthub-schedules';

const DEFAULT = [
  {
    id: 'sch-1',
    agentSlug: 'deepresearch',
    note: 'Weekly market research digest',
    runAt: '2026-06-30T09:00',
    repeat: 'weekly',
    enabled: true,
  },
];

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function useSchedules() {
  const [schedules, setSchedules] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(schedules));
  }, [schedules]);

  const add = useCallback((entry) => {
    setSchedules((prev) => [
      ...prev,
      { ...entry, id: `sch-${Date.now()}`, enabled: true },
    ]);
  }, []);

  const remove = useCallback((id) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggle = useCallback((id) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  return { schedules, add, remove, toggle };
}
