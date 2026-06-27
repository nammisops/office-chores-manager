import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../api';
import { TeamMember } from '../../types';
import { TeamMemberForm } from './TeamMemberForm';

export function TeamList() {
  const { teamMembers, addTeamMember, updateTeamMember, removeTeamMember } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<TeamMember | null>(null);

  async function handleCreate(name: string, color: string) {
    const m = await api.teamMembers.create(name, color);
    addTeamMember(m);
  }

  async function handleUpdate(name: string, color: string) {
    if (!editingMember) return;
    const m = await api.teamMembers.update(editingMember.id, name, color);
    updateTeamMember(m);
  }

  async function handleDelete(member: TeamMember) {
    await api.teamMembers.delete(member.id);
    removeTeamMember(member.id);
    setConfirmDelete(null);
  }

  return (
    <>
      <div className="member-list">
        {teamMembers.map((m) => (
          <div key={m.id} className="member-item">
            <div className="member-dot" style={{ backgroundColor: m.color }} />
            <span className="member-name">{m.name}</span>
            <div className="member-actions">
              <button
                className="icon-btn"
                title="Edit"
                onClick={() => { setEditingMember(m); setFormOpen(true); }}
              >
                ✎
              </button>
              <button
                className="icon-btn danger"
                title="Delete"
                onClick={() => setConfirmDelete(m)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          className="btn-add-member"
          onClick={() => { setEditingMember(undefined); setFormOpen(true); }}
        >
          + Add member
        </button>
      </div>

      {formOpen && (
        <TeamMemberForm
          member={editingMember}
          onSave={editingMember ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditingMember(undefined); }}
        />
      )}

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Remove {confirmDelete.name}?</h3>
            <p>Their chore assignments will be cleared. This cannot be undone.</p>
            <div className="confirm-box__actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
