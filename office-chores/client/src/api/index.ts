import { TeamMember, Chore, ChoreInstanceRow, NotificationResponse, RecurrenceInput } from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

// Team members
export const api = {
  teamMembers: {
    list: () => request<TeamMember[]>('/api/team-members'),
    create: (name: string, color: string) =>
      request<TeamMember>('/api/team-members', { method: 'POST', body: JSON.stringify({ name, color }) }),
    update: (id: number, name: string, color: string) =>
      request<TeamMember>(`/api/team-members/${id}`, { method: 'PUT', body: JSON.stringify({ name, color }) }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/team-members/${id}`, { method: 'DELETE' }),
  },

  chores: {
    list: () => request<Chore[]>('/api/chores'),
    create: (payload: {
      title: string;
      description?: string;
      defaultAssigneeId?: number | null;
      recurrence?: RecurrenceInput;
      dueDate?: string;
    }) => request<Chore>('/api/chores', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: number, payload: {
      title?: string;
      description?: string;
      defaultAssigneeId?: number | null;
      recurrence?: RecurrenceInput;
      dueDate?: string;
      removeRecurrence?: boolean;
    }) => request<Chore>(`/api/chores/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/chores/${id}`, { method: 'DELETE' }),
  },

  instances: {
    list: (start: string, end: string) =>
      request<ChoreInstanceRow[]>(`/api/instances?start=${start}&end=${end}`),
    complete: (id: number) =>
      request<{ ok: boolean }>(`/api/instances/${id}/complete`, { method: 'PUT' }),
    skip: (id: number) =>
      request<{ ok: boolean }>(`/api/instances/${id}/skip`, { method: 'PUT' }),
    reopen: (id: number) =>
      request<{ ok: boolean }>(`/api/instances/${id}/reopen`, { method: 'PUT' }),
    update: (id: number, payload: { assigneeId?: number | null; notes?: string; dueDate?: string }) =>
      request<{ ok: boolean }>(`/api/instances/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  },

  notifications: {
    get: () => request<NotificationResponse>('/api/notifications'),
  },

  cron: {
    extend: () => request<{ extended: number }>('/api/cron/extend', { method: 'POST' }),
  },
};
