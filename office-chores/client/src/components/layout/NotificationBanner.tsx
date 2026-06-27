import { useNotifications } from '../../hooks/useNotifications';
import { useAppStore } from '../../store/appStore';

export function NotificationBanner() {
  const { overdueCount, dueTodayCount, dismissed, dismiss } = useNotifications();
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  if (dismissed || (overdueCount === 0 && dueTodayCount === 0)) return null;

  const variant = 'red';

  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
  if (dueTodayCount > 0) parts.push(`${dueTodayCount} due today`);

  return (
    <div className={`notification-banner ${variant}`}>
      <span className="notification-banner__msg">
        {parts.join(' · ')} —{' '}
        <button
          className="notification-banner__link"
          onClick={() => setCurrentView('dayGridMonth')}
        >
          view calendar
        </button>
      </span>
      <button className="notification-banner__dismiss" onClick={dismiss}>
        Dismiss
      </button>
    </div>
  );
}
