import { addDays, addMonths, getDay, getDaysInMonth, differenceInCalendarDays } from 'date-fns';

interface Rule {
  frequency: string;
  interval_value: number;
  days_of_week: string | null;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateInstances(rule: Rule, fromDate: Date, toDate: Date): string[] {
  const dueDates: string[] = [];
  const startRef = parseLocalDate(rule.start_date);
  const endLimit = rule.end_date ? parseLocalDate(rule.end_date) : toDate;
  const effectiveEnd = endLimit < toDate ? endLimit : toDate;
  const rangeStart = fromDate < startRef ? startRef : fromDate;

  if (rangeStart > effectiveEnd) return dueDates;

  const daysOfWeek: number[] = rule.days_of_week ? JSON.parse(rule.days_of_week) : [];

  if (rule.frequency === 'daily') {
    const daysFromStart = differenceInCalendarDays(rangeStart, startRef);
    const periodsElapsed = Math.ceil(daysFromStart / rule.interval_value);
    let current = addDays(startRef, periodsElapsed * rule.interval_value);
    if (current < rangeStart) current = addDays(current, rule.interval_value);

    while (current <= effectiveEnd) {
      dueDates.push(formatLocalDate(current));
      current = addDays(current, rule.interval_value);
    }
  } else if (rule.frequency === 'weekly' || rule.frequency === 'custom') {
    let cursor = new Date(rangeStart);
    while (cursor <= effectiveEnd) {
      const dow = getDay(cursor);
      if (daysOfWeek.includes(dow)) {
        const diffFromStart = differenceInCalendarDays(cursor, startRef);
        if (diffFromStart >= 0) {
          const weekIdx = Math.floor(diffFromStart / 7);
          if (weekIdx % rule.interval_value === 0) {
            dueDates.push(formatLocalDate(cursor));
          }
        }
      }
      cursor = addDays(cursor, 1);
    }
  } else if (rule.frequency === 'monthly') {
    const targetDay = rule.day_of_month ?? 1;
    let monthBase = new Date(startRef.getFullYear(), startRef.getMonth(), 1);
    let monthIdx = 0;

    // Advance to the month of rangeStart (minus one to avoid missing edge cases)
    const rangeMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (monthBase < rangeMonth) {
      monthBase = addMonths(monthBase, 1);
      monthIdx++;
    }
    if (monthIdx > 0) {
      monthBase = addMonths(monthBase, -1);
      monthIdx--;
    }

    while (monthBase <= effectiveEnd) {
      if (monthIdx % rule.interval_value === 0) {
        const daysInMonth = getDaysInMonth(monthBase);
        const actualDay = Math.min(targetDay, daysInMonth);
        const candidate = new Date(monthBase.getFullYear(), monthBase.getMonth(), actualDay);

        if (candidate >= rangeStart && candidate <= effectiveEnd) {
          dueDates.push(formatLocalDate(candidate));
        }
      }
      monthBase = addMonths(monthBase, 1);
      monthIdx++;
    }
  }

  return dueDates;
}

export function todayString(): string {
  return formatLocalDate(new Date());
}

export function daysFromToday(days: number): string {
  return formatLocalDate(addDays(new Date(), days));
}
