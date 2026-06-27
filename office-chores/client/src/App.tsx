import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useAppStore } from './store/appStore';
import { api } from './api';

export function App() {
  const setTeamMembers = useAppStore((s) => s.setTeamMembers);

  useEffect(() => {
    // Extend rolling instance window on mount
    api.cron.extend().catch(console.error);

    // Load team members into global store
    api.teamMembers.list().then(setTeamMembers).catch(console.error);
  }, [setTeamMembers]);

  return <AppShell />;
}
