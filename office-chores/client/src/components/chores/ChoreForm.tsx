import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../api';
import { Chore, RecurrenceInput } from '../../types';
import { RecurrenceBuilder } from './RecurrenceBuilder';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_RECURRENCE: RecurrenceInput = {
  frequency: 'weekly',
  intervalValue: 1,
  daysOfWeek: [],
  startDate: todayStr(),
  endDate: null,
};

interface Props {
  chore?: Chore;
}

export function ChoreForm({ chore }: Props) {
  const { teamMembers, closeChoreForm, triggerCalendarRefetch } = useAppStore();
  const isEditing = !!chore;

  const [title, setTitle] = useState(chore?.title ?? '');
  const [description, setDescription] = useState(chore?.description ?? '');
  const [assigneeId, setAssigneeId] = useState<number | null>(chore?.default_assignee_id ?? null);
  const [isRecurring, setIsRecurring] = useState(isEditing ? !!chore.is_recurring : false);
  const [dueDate, setDueDate] = useState(todayStr());
  const [recurrence, setRecurrence] = useState<RecurrenceInput>(() => {
    if (chore?.recurrence) {
      const r = chore.recurrence;
      return {
        frequency: r.frequency,
        intervalValue: r.interval_value,
        daysOfWeek: r.days_of_week ? JSON.parse(r.days_of_week) : [],
        dayOfMonth: r.day_of_month ?? undefined,
        startDate: r.start_date,
        endDate: r.end_date,
      };
    }
    return { ...DEFAULT_RECURRENCE, startDate: todayStr() };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (isRecurring && !recurrence.startDate) { setError('Start date is required'); return; }
    if (isRecurring && recurrence.frequency !== 'daily' && recurrence.frequency !== 'monthly') {
      if (!recurrence.daysOfWeek?.length) { setError('Select at least one day'); return; }
    }

    setSaving(true);
    setError('');
    try {
      if (isEditing) {
        const wasRecurring = !!chore.is_recurring;
        await api.chores.update(chore.id, {
          title: title.trim(),
          description: description || undefined,
          defaultAssigneeId: assigneeId,
          ...(isRecurring ? { recurrence } : {}),
          ...(!isRecurring && wasRecurring ? { removeRecurrence: true, dueDate } : {}),
          ...(!isRecurring && !wasRecurring ? { dueDate } : {}),
        });
      } else {
        await api.chores.create({
          title: title.trim(),
          description: description || undefined,
          defaultAssigneeId: assigneeId,
          ...(isRecurring ? { recurrence } : { dueDate }),
        });
      }
      triggerCalendarRefetch();
      closeChoreForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={closeChoreForm}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEditing ? 'Edit Chore' : 'Add Chore'}</h2>
          <button className="modal__close" onClick={closeChoreForm}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}

            <div className="form-group">
              <label className="form-label">Title <span>*</span></label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details…"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default assignee</label>
              <select
                className="form-select"
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="toggle-row">
              <span className="toggle-label">Recurring chore</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {!isRecurring && (
              <div className="form-group">
                <label className="form-label">Due date <span>*</span></label>
                <input
                  className="form-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

            {isRecurring && (
              <RecurrenceBuilder value={recurrence} onChange={setRecurrence} />
            )}
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={closeChoreForm}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
