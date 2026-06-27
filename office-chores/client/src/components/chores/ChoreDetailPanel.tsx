import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../api';
import { InstanceStatus } from '../../types';
import { format } from 'date-fns';

const STATUS_LABEL: Record<InstanceStatus, string> = {
  pending: '⏳ Pending',
  completed: '✓ Completed',
  skipped: '— Skipped',
};

export function ChoreDetailPanel() {
  const {
    selectedInstance,
    setSelectedInstance,
    teamMembers,
    openChoreForm,
    triggerCalendarRefetch,
  } = useAppStore();

  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!selectedInstance) return null;

  const inst = selectedInstance;
  const notes = localNotes !== null ? localNotes : (inst.notes ?? '');

  async function doAction(action: 'complete' | 'skip' | 'reopen') {
    const fn = { complete: api.instances.complete, skip: api.instances.skip, reopen: api.instances.reopen }[action];
    await fn(inst.id);
    triggerCalendarRefetch();
    setSelectedInstance({ ...inst, status: action === 'complete' ? 'completed' : action === 'skip' ? 'skipped' : 'pending' });
  }

  async function handleAssigneeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const assigneeId = e.target.value ? Number(e.target.value) : null;
    const assignee = teamMembers.find((m) => m.id === assigneeId) ?? null;
    await api.instances.update(inst.id, { assigneeId });
    triggerCalendarRefetch();
    setSelectedInstance({
      ...inst,
      assignee_id: assigneeId,
      assignee_name: assignee?.name ?? null,
      assignee_color: assignee?.color ?? null,
    });
  }

  async function saveNotes() {
    if (localNotes === null) return;
    setSavingNotes(true);
    try {
      await api.instances.update(inst.id, { notes: localNotes });
      setSelectedInstance({ ...inst, notes: localNotes });
      setLocalNotes(null);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDeleteChore() {
    await api.chores.delete(inst.chore_id);
    triggerCalendarRefetch();
    setSelectedInstance(null);
    setConfirmDelete(false);
  }

  async function handleEditChore() {
    try {
      const chores = await api.chores.list();
      const chore = chores.find((c) => c.id === inst.chore_id);
      if (chore) openChoreForm(chore);
    } catch {
      // ignore
    }
  }

  let dueDateDisplay = inst.due_date;
  try {
    dueDateDisplay = format(new Date(inst.due_date.replace(/-/g, '/')), 'EEEE, MMMM d, yyyy');
  } catch { /* fallback */ }

  return (
    <aside className="detail-panel">
      <div className="detail-panel__header">
        <h2 className="detail-panel__title">{inst.chore_title}</h2>
        <button className="detail-panel__close" onClick={() => setSelectedInstance(null)}>×</button>
      </div>

      <div className="detail-panel__body">
        {inst.chore_description && (
          <div className="detail-row">
            <span className="detail-label">Description</span>
            <p className="detail-value" style={{ lineHeight: 1.5 }}>{inst.chore_description}</p>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">Due</span>
          <span className="detail-value">{dueDateDisplay}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Status</span>
          <span className={`status-badge ${inst.status}`}>{STATUS_LABEL[inst.status]}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Assignee</span>
          <select
            className="assignee-select"
            value={inst.assignee_id ?? ''}
            onChange={handleAssigneeChange}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {inst.is_recurring === 1 && (
          <div className="detail-row">
            <span className="detail-label">Type</span>
            <span className="detail-value" style={{ color: '#666' }}>🔁 Recurring</span>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">Notes</span>
          <textarea
            className="notes-input"
            placeholder="Add notes…"
            value={notes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={saveNotes}
          />
          {localNotes !== null && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '5px 12px', alignSelf: 'flex-start' }}
              onClick={saveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? 'Saving…' : 'Save notes'}
            </button>
          )}
        </div>

        <div className="detail-panel__actions">
          {inst.status !== 'completed' && (
            <button className="btn btn-success" onClick={() => doAction('complete')}>✓ Complete</button>
          )}
          {inst.status !== 'skipped' && inst.status !== 'completed' && (
            <button className="btn btn-secondary" onClick={() => doAction('skip')}>Skip</button>
          )}
          {inst.status !== 'pending' && (
            <button className="btn btn-secondary" onClick={() => doAction('reopen')}>Reopen</button>
          )}
        </div>
      </div>

      <div className="detail-panel__footer">
        <button className="btn btn-ghost" onClick={handleEditChore} style={{ flex: 1 }}>
          ✎ Edit chore
        </button>
        <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      </div>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Delete "{inst.chore_title}"?</h3>
            <p>All pending occurrences will be removed. Completed records are kept. This cannot be undone.</p>
            <div className="confirm-box__actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteChore}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
