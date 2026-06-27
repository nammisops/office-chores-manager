export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type InstanceStatus = 'pending' | 'completed' | 'skipped';

export interface TeamMember {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  default_assignee_id: number | null;
  is_recurring: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  id: number;
  chore_id: number;
  frequency: Frequency;
  interval_value: number;
  days_of_week: string | null;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  generate_until: string;
}

export interface RecurrenceInput {
  frequency: Frequency;
  intervalValue: number;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
}

export interface ChoreInstance {
  id: number;
  chore_id: number;
  due_date: string;
  assignee_id: number | null;
  status: InstanceStatus;
  completed_at: string | null;
  completed_by_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface ChoreInstanceRow {
  id: number;
  chore_id: number;
  chore_title: string;
  chore_description: string | null;
  due_date: string;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_color: string | null;
  status: InstanceStatus;
  completed_at: string | null;
  is_recurring: number;
  notes: string | null;
}
