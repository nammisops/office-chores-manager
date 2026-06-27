import { Router } from 'express';
import db, { transaction } from '../db/database';
import { generateInstances, daysFromToday } from '../services/recurrenceService';
import { RecurrenceRule } from '../types';

const router = Router();

router.post('/extend', (_req, res) => {
  const threshold = daysFromToday(60);
  const generateUntil = daysFromToday(90);

  const rules = db.prepare(
    `SELECT rr.*, c.default_assignee_id
     FROM recurrence_rules rr
     JOIN chores c ON c.id = rr.chore_id AND c.is_active = 1
     WHERE rr.generate_until < ?`
  ).all(threshold) as unknown as (RecurrenceRule & { default_assignee_id: number | null })[];

  const stmt = db.prepare(
    'INSERT OR IGNORE INTO chore_instances (chore_id, due_date, assignee_id) VALUES (?, ?, ?)'
  );

  let extended = 0;
  transaction(() => {
    for (const rule of rules) {
      const fromDate = new Date(rule.generate_until.replace(/-/g, '/'));
      fromDate.setDate(fromDate.getDate() + 1);
      const toDate = new Date(generateUntil.replace(/-/g, '/'));

      const dates = generateInstances(rule, fromDate, toDate);
      for (const d of dates) {
        stmt.run(rule.chore_id, d, rule.default_assignee_id);
      }

      db.prepare('UPDATE recurrence_rules SET generate_until = ? WHERE id = ?').run(generateUntil, rule.id);
      extended++;
    }
  });

  res.json({ extended });
});

export default router;
