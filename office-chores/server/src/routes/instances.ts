import { Router } from 'express';
import db from '../db/database';
import { ChoreInstanceRow } from '../types';

const router = Router();

const INSTANCES_QUERY = `
  SELECT
    ci.id,
    ci.chore_id,
    c.title   AS chore_title,
    c.description AS chore_description,
    ci.due_date,
    ci.assignee_id,
    tm.name   AS assignee_name,
    tm.color  AS assignee_color,
    ci.status,
    ci.completed_at,
    c.is_recurring,
    ci.notes
  FROM chore_instances ci
  JOIN chores c ON c.id = ci.chore_id AND c.is_active = 1
  LEFT JOIN team_members tm ON tm.id = ci.assignee_id
  WHERE ci.due_date >= ? AND ci.due_date <= ?
  ORDER BY ci.due_date ASC, c.title ASC
`;

router.get('/', (req, res) => {
  const { start, end } = req.query as { start?: string; end?: string };
  if (!start || !end) return res.status(400).json({ error: 'start and end query params required' });

  const rows = db.prepare(INSTANCES_QUERY).all(start, end) as unknown as ChoreInstanceRow[];
  res.json(rows);
});

router.put('/:id/complete', (req, res) => {
  const { id } = req.params;
  const instance = db.prepare('SELECT id FROM chore_instances WHERE id = ?').get(id);
  if (!instance) return res.status(404).json({ error: 'Instance not found' });

  db.prepare(
    `UPDATE chore_instances SET status = 'completed', completed_at = datetime('now') WHERE id = ?`
  ).run(id);
  res.json({ ok: true });
});

router.put('/:id/skip', (req, res) => {
  const { id } = req.params;
  const instance = db.prepare('SELECT id FROM chore_instances WHERE id = ?').get(id);
  if (!instance) return res.status(404).json({ error: 'Instance not found' });

  db.prepare(`UPDATE chore_instances SET status = 'skipped' WHERE id = ?`).run(id);
  res.json({ ok: true });
});

router.put('/:id/reopen', (req, res) => {
  const { id } = req.params;
  const instance = db.prepare('SELECT id FROM chore_instances WHERE id = ?').get(id);
  if (!instance) return res.status(404).json({ error: 'Instance not found' });

  db.prepare(`UPDATE chore_instances SET status = 'pending', completed_at = NULL WHERE id = ?`).run(id);
  res.json({ ok: true });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { assigneeId, notes, dueDate } = req.body as {
    assigneeId?: number | null;
    notes?: string;
    dueDate?: string;
  };

  const instance = db.prepare('SELECT * FROM chore_instances WHERE id = ?').get(id) as unknown as
    | { id: number; assignee_id: number | null; notes: string | null; due_date: string }
    | undefined;
  if (!instance) return res.status(404).json({ error: 'Instance not found' });

  db.prepare(
    'UPDATE chore_instances SET assignee_id = ?, notes = ?, due_date = ? WHERE id = ?'
  ).run(
    assigneeId !== undefined ? assigneeId : instance.assignee_id,
    notes !== undefined ? notes : instance.notes,
    dueDate ?? instance.due_date,
    id
  );
  res.json({ ok: true });
});

export default router;
