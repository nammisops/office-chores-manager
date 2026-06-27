import { useState } from 'react';
import { TeamMember } from '../../types';

const PALETTE = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
];

interface Props {
  member?: TeamMember;
  onSave: (name: string, color: string) => Promise<void>;
  onClose: () => void;
}

export function TeamMemberForm({ member, onSave, onClose }: Props) {
  const [name, setName] = useState(member?.name ?? '');
  const [color, setColor] = useState(member?.color ?? PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await onSave(name.trim(), color);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="modal__header">
          <h2 className="modal__title">{member ? 'Edit Member' : 'Add Member'}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}
            <div className="form-group">
              <label className="form-label">Name <span>*</span></label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team member name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-palette">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
