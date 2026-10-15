import { useState, useEffect, useCallback } from 'react';
import { reminderApi } from '../api/services';

/**
 * useReminders — polls for upcoming session reminders every 5 minutes.
 * The backend deduplicates via reminder flags; this hook simply displays.
 */
export const useReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  const fetchReminders = useCallback(async () => {
    try {
      const res = await reminderApi.getMine();
      setReminders(res.data.reminders);
    } catch {
      // Silent fail — reminders are non-critical
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const dismiss = useCallback((sessionId) => {
    setDismissed((prev) => new Set([...prev, sessionId]));
  }, []);

  const visible = reminders.filter((r) => !dismissed.has(r._id));

  return { reminders: visible, dismiss };
};
