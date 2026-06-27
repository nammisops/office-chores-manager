import { Router } from 'express';
import db, { transaction } from '../db/database';
import { generateInstances, todayString, daysFromToday } from '../services/recurrenceService';
import { Chore, RecurrenceRule, RecurrenceInput } from '../types';

const router = Router();

function getChoreWithRule(id: number | bigint) {
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(id) as unknown as Chore | undefined;
  if (!chore) return null;
  const rule = db.prepare('SELECT * FROM recurrence_rules WHERE chore_id = ?').get(id) as unknown as RecurrenceRule | undefined;
  return { ...chore, recurrence: rule ?? null };
}

function insertInstances(choreId: number | bigint, assigneeId: number | null, rule: RecurrenceRule) {
  const fromDate = new Date();
  const toDate = new Date(daysFromToday(90).replace(/-/g, '/'));
  const dates = generateInstances(rule, fromDate, toDate);

  const stmt = db.prepare(
    'INSERT OR IGNORE INTO chore_instances (chore_id, due_date, assignee_id) VALUES (?, ?, ?)'
  );
  transaction(() => {
    for (const d of dates) stmt.run(choreId, d, assigneeId);
  });
}

router.get('/', (_req, res) => {
  const chores = db.prepare('SELECT * FROM chores WHERE is_active = 1 ORDER BY title ASC').all() as unknown as Chore[];
  const result = chores.map((c) => {
    const rule = db.prepare('SELECT * FROM recurrence_rules WHERE chore_id = ?').get(c.id) as unknown as RecurrenceRule | undefined;
    return { ...c, recurrence: rule ?? null };
  });
  res.json(result);
});

router.post('/', (req, res) => {
  const {
    title,
    description,
    defaultAssigneeId,
    recurrence,
    dueDate,
  } = req.body as {
    title: string;
    description?: string;
    defaultAssigneeId?: number | null;
    recurrence?: RecurrenceInput;
    dueDate?: string;
  };

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!recurrence && !dueDate) return res.status(400).json({ error: 'dueDate required for one-time chores' });

  const isRecurring = recurrence ? 1 : 0;
  const choreResult = db.prepare(
    `INSERT INTO chores (title, description, default_assignee_id, is_recurring)
     VALUES (?, ?, ?, ?)`
  ).run(title.trim(), description ?? null, defaultAssigneeId ?? null, isRecurring);

  const choreId = choreResult.lastInsertRowid;

  if (recurrence) {
    const generateUntil = daysFromToday(90);
    const ruleResult = db.prepare(
      `INSERT INTO recurrence_rules
         (chore_id, frequency, interval_value, days_of_week, day_of_month, start_date, end_date, generate_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      choreId,
      recurrence.frequency,
      recurrence.intervalValue ?? 1,
      recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
      recurrence.dayOfMonth ?? null,
      recurrence.startDate,
      recurrence.endDate ?? null,
      generateUntil
    );

    const rule = db.prepare('SELECT * FROM recurrence_rules WHERE id = ?').get(ruleResult.lastInsertRowid) as unknown as RecurrenceRule;
    insertInstances(choreId, defaultAssigneeId ?? null, rule);
  } else if (dueDate) {
    db.prepare(
      'INSERT OR IGNORE INTO chore_instances (chore_id, due_date, assignee_id) VALUES (?, ?, ?)'
    ).run(choreId, dueDate, defaultAssigneeId ?? null);
  }

  res.status(201).json(getChoreWithRule(choreId));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const choreId = Number(id);
  const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId) as unknown as Chore | undefined;
  if (!existing) return res.status(404).json({ error: 'Chore not found' });

  const {
    title,
    description,
    defaultAssigneeId,
    recurrence,
    dueDate,
    removeRecurrence,
  } = req.body as {
    title?: string;
    description?: string;
    defaultAssigneeId?: number | null;
    recurrence?: RecurrenceInput;
    dueDate?: string;
    removeRecurrence?: boolean;
  };

  const today = todayString();
  const newAssigneeId = defaultAssigneeId !== undefined ? defaultAssigneeId : existing.default_assignee_id;
  const newIsRecurring = recurrence ? 1 : removeRecurrence ? 0 : existing.is_recurring;

  db.prepare(
    `UPDATE chores SET title = ?, description = ?, default_assignee_id = ?, is_recurring = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title?.trim() ?? existing.title,
    description !== undefined ? description : existing.description,
    newAssigneeId,
    newIsRecurring,
    choreId
  );

  if (recurrence) {
    db.prepare(
      `DELETE FROM chore_instances WHERE chore_id = ? AND due_date >= ? AND status = 'pending'`
    ).run(choreId, today);

    const generateUntil = daysFromToday(90);
    const existingRule = db.prepare('SELECT * FROM recurrence_rules WHERE chore_id = ?').get(choreId) as unknown as RecurrenceRule | undefined;

    if (existingRule) {
      db.prepare(
        `UPDATE recurrence_rules SET frequency = ?, interval_value = ?, days_of_week = ?,
         day_of_month = ?, start_date = ?, end_date = ?, generate_until = ? WHERE chore_id = ?`
      ).run(
        recurrence.frequency,
        recurrence.intervalValue ?? 1,
        recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
        recurrence.dayOfMonth ?? null,
        recurrence.startDate,
        recurrence.endDate ?? null,
        generateUntil,
        choreId
      );
    } else {
      db.prepare(
        `INSERT INTO recurrence_rules
           (chore_id, frequency, interval_value, days_of_week, day_of_month, start_date, end_date, generate_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        choreId,
        recurrence.frequency,
        recurrence.intervalValue ?? 1,
        recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
        recurrence.dayOfMonth ?? null,
        recurrence.startDate,
        recurrence.endDate ?? null,
        generateUntil
      );
    }

    const rule = db.prepare('SELECT * FROM recurrence_rules WHERE chore_id = ?').get(choreId) as unknown as RecurrenceRule;
    insertInstances(choreId, newAssigneeId, rule);
  } else if (removeRecurrence) {
    db.prepare(`DELETE FROM chore_instances WHERE chore_id = ? AND due_date >= ? AND status = 'pending'`).run(choreId, today);
    db.prepare('DELETE FROM recurrence_rules WHERE chore_id = ?').run(choreId);

    if (dueDate) {
      db.prepare('INSERT OR IGNORE INTO chore_instances (chore_id, due_date, assignee_id) VALUES (?, ?, ?)').run(
        choreId, dueDate, newAssigneeId
      );
    }
  } else if (!existing.is_recurring) {
    if (dueDate) {
      db.prepare(`UPDATE chore_instances SET due_date = ?, assignee_id = ? WHERE chore_id = ? AND status = 'pending'`).run(
        dueDate, newAssigneeId, choreId
      );
    } else {
      db.prepare(`UPDATE chore_instances SET assignee_id = ? WHERE chore_id = ? AND status = 'pending'`).run(
        newAssigneeId, choreId
      );
    }
  } else {
    db.prepare(`UPDATE chore_instances SET assignee_id = ? WHERE chore_id = ? AND due_date >= ? AND status = 'pending'`).run(
      newAssigneeId, choreId, today
    );
  }

  res.json(getChoreWithRule(choreId));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM chores WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Chore not found' });

  db.prepare(`UPDATE chores SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(id);
  db.prepare(`DELETE FROM chore_instances WHERE chore_id = ? AND status = 'pending'`).run(id);
  res.json({ ok: true });
});

export default router;
