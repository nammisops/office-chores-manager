import { useAppStore } from '../../store/appStore';
import { TeamList } from '../team/TeamList';

const VIEWS = [
  { id: 'dayGridMonth', label: 'Month' },
  { id: 'timeGridWeek', label: 'Week' },
  { id: 'timeGridDay',  label: 'Day' },
];

export function Sidebar() {
  const { currentView, setCurrentView, openChoreForm } = useAppStore();

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__title">Office Chores</div>
        <div className="sidebar__subtitle">Team task calendar</div>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__section-label">View</div>
        <div className="view-switcher">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={`view-btn ${currentView === v.id ? 'active' : ''}`}
              onClick={() => setCurrentView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar__section" style={{ flex: 1 }}>
        <div className="sidebar__section-label">Team</div>
        <TeamList />
      </div>

      <div className="sidebar__footer">
        <button className="btn-add-chore" onClick={() => openChoreForm()}>
          + Add Chore
        </button>
      </div>
    </aside>
  );
}
