import { Router } from 'express';
import db from '../db/database';
import { TeamMember } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  const members = db.prepare('SELECT * FROM team_members ORDER BY name ASC').all() as unknown as TeamMember[];
  res.json(members);
});

router.post('/', (req, res) => {
  const { name, color } = req.body as { name: string; color: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare('INSERT INTO team_members (name, color) VALUES (?, ?)').run(
    name.trim(),
    color ?? '#4A90D9'
  );
  const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(result.lastInsertRowid) as unknown as TeamMember;
  res.status(201).json(member);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body as { name?: string; color?: string };

  const existing = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as unknown as TeamMember | undefined;
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  db.prepare('UPDATE team_members SET name = ?, color = ? WHERE id = ?').run(
    name?.trim() ?? existing.name,
    color ?? existing.color,
    id
  );
  const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as unknown as TeamMember;
  res.json(member);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM team_members WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
