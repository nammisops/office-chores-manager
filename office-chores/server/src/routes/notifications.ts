import { Router } from 'express';
import db from '../db/database';

const router = Router();

interface NotifRow {
  instanceId: number;
  choreTitle: string;
  dueDate: string;
  type: string;
  assigneeName: string | null;
}

const QUERY = `
  SELECT
    ci.id   AS instanceId,
    c.title AS choreTitle,
    ci.due_date AS dueDate,
    ? AS type,
    tm.name AS assigneeName
  FROM chore_instances ci
  JOIN chores c ON c.id = ci.chore_id AND c.is_active = 1
  LEFT JOIN team_members tm ON tm.id = ci.assignee_id
  WHERE ci.status = 'pending' AND ci.due_date [CONDITION]
  ORDER BY ci.due_date ASC
  LIMIT 20
`;

router.get('/', (_req, res) => {
  const overdueRows = db.prepare(
    QUERY.replace('[CONDITION]', "< date('now')")
  ).all('overdue') as unknown as NotifRow[];

  const todayRows = db.prepare(
    QUERY.replace('[CONDITION]', "= date('now')")
  ).all('due_today') as unknown as NotifRow[];

  res.json({
    overdueCount: overdueRows.length,
    dueTodayCount: todayRows.length,
    items: [...overdueRows, ...todayRows],
  });
});

export default router;
