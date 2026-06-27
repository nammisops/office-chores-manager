import { NotificationBanner } from './NotificationBanner';
import { Sidebar } from './Sidebar';
import { CalendarView } from '../calendar/CalendarView';
import { ChoreDetailPanel } from '../chores/ChoreDetailPanel';
import { ChoreForm } from '../chores/ChoreForm';
import { useAppStore } from '../../store/appStore';

export function AppShell() {
  const { choreFormOpen, choreFormChore } = useAppStore();

  return (
    <div className="app">
      <NotificationBanner />
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <CalendarView />
          <ChoreDetailPanel />
        </div>
      </div>
      {choreFormOpen && <ChoreForm chore={choreFormChore ?? undefined} />}
    </div>
  );
}
