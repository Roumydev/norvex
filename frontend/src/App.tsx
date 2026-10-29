'use client'

import type React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Properties from './views/Properties';
import Clients from './views/Clients';
import Agents from './views/Agents';
import Leads from './views/Leads';
import Visits from './views/Visits';
import Contracts from './views/Contracts';
import Payments from './views/Payments';
import Analytics from './views/Analytics';
import Notifications from './views/Notifications';
import Settings from './views/Settings';
import Profile from './views/Profile';

function AppContent() {
  const { isAuthed, page } = useApp();

  if (!isAuthed) return <Login />;

  const pageMap: Record<string, React.ReactElement> = {
    dashboard: <Dashboard />,
    properties: <Properties />,
    'property-detail': <Properties />,
    'add-property': <Properties />,
    clients: <Clients />,
    'client-detail': <Clients />,
    agents: <Agents />,
    'agent-detail': <Agents />,
    leads: <Leads />,
    visits: <Visits />,
    contracts: <Contracts />,
    'contract-detail': <Contracts />,
    payments: <Payments />,
    analytics: <Analytics />,
    notifications: <Notifications />,
    settings: <Settings />,
    profile: <Profile />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main className="norvex-main">
        {pageMap[page] ?? <Dashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}