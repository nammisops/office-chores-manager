import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { NotificationResponse } from '../types';

const EMPTY: NotificationResponse = { overdueCount: 0, dueTodayCount: 0, items: [] };

export function useNotifications() {
  const [data, setData] = useState<NotificationResponse>(EMPTY);
  const [dismissed, setDismissed] = useState(false);
  const prevKey = useRef('');

  const fetch = useCallback(async () => {
    try {
      const result = await api.notifications.get();
      setData(result);
    } catch {
      // silently ignore network errors
    }
  }, []);

  // Re-show banner when counts change
  const key = `${data.overdueCount}:${data.dueTodayCount}`;
  if (key !== prevKey.current) {
    prevKey.current = key;
    if (dismissed) setDismissed(false);
  }

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetch();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetch]);

  return {
    ...data,
    dismissed,
    dismiss: () => setDismissed(true),
    refetch: fetch,
  };
}
