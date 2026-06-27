import { create } from 'zustand';
import { TeamMember, ChoreInstanceRow, Chore } from '../types';

interface AppStore {
  currentView: string;
  setCurrentView: (view: string) => void;

  selectedInstance: ChoreInstanceRow | null;
  setSelectedInstance: (instance: ChoreInstanceRow | null) => void;

  choreFormOpen: boolean;
  choreFormChore: Chore | null;
  openChoreForm: (chore?: Chore) => void;
  closeChoreForm: () => void;

  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (member: TeamMember) => void;
  removeTeamMember: (id: number) => void;

  calendarRefetchKey: number;
  triggerCalendarRefetch: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'dayGridMonth',
  setCurrentView: (view) => set({ currentView: view }),

  selectedInstance: null,
  setSelectedInstance: (instance) => set({ selectedInstance: instance }),

  choreFormOpen: false,
  choreFormChore: null,
  openChoreForm: (chore) => set({ choreFormOpen: true, choreFormChore: chore ?? null }),
  closeChoreForm: () => set({ choreFormOpen: false, choreFormChore: null }),

  teamMembers: [],
  setTeamMembers: (members) => set({ teamMembers: members }),
  addTeamMember: (member) => set((s) => ({ teamMembers: [...s.teamMembers, member] })),
  updateTeamMember: (member) =>
    set((s) => ({ teamMembers: s.teamMembers.map((m) => (m.id === member.id ? member : m)) })),
  removeTeamMember: (id) =>
    set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) })),

  calendarRefetchKey: 0,
  triggerCalendarRefetch: () => set((s) => ({ calendarRefetchKey: s.calendarRefetchKey + 1 })),
}));
