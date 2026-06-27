import { RecurrenceInput, Frequency } from '../../types';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  value: RecurrenceInput;
  onChange: (v: RecurrenceInput) => void;
}

export function RecurrenceBuilder({ value, onChange }: Props) {
  function update(partial: Partial<RecurrenceInput>) {
    onChange({ ...value, ...partial });
  }

  const freq = value.frequency;
  const showDow = freq === 'weekly' || freq === 'custom';
  const showDom = freq === 'monthly';

  function toggleDow(d: number) {
    const current = value.daysOfWeek ?? [];
    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d].sort();
    update({ daysOfWeek: next });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Frequency</label>
          <select
            className="form-select"
            value={freq}
            onChange={(e) => update({ frequency: e.target.value as Frequency, daysOfWeek: [], dayOfMonth: undefined })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Every</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="form-input"
              type="number"
              min={1}
              max={30}
              value={value.intervalValue}
              onChange={(e) => update({ intervalValue: Math.max(1, parseInt(e.target.value) || 1) })}
              style={{ width: 70 }}
            />
            <span style={{ color: '#555', fontSize: 13 }}>
              {freq === 'daily' ? 'day(s)' : freq === 'weekly' ? 'week(s)' : 'month(s)'}
            </span>
          </div>
        </div>
      </div>

      {showDow && (
        <div className="form-group">
          <label className="form-label">On days</label>
          <div className="dow-grid">
            {DAYS.map((label, i) => (
              <button
                key={i}
                type="button"
                className={`dow-btn ${(value.daysOfWeek ?? []).includes(i) ? 'selected' : ''}`}
                onClick={() => toggleDow(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showDom && (
        <div className="form-group">
          <label className="form-label">Day of month</label>
          <input
            className="form-input"
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? 1}
            onChange={(e) => update({ dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
            style={{ width: 100 }}
          />
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start date <span>*</span></label>
          <input
            className="form-input"
            type="date"
            value={value.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <input
            className="form-input"
            type="date"
            value={value.endDate ?? ''}
            onChange={(e) => update({ endDate: e.target.value || null })}
          />
        </div>
      </div>
    </div>
  );
}
