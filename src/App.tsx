import { useState, useEffect } from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';

function AppContent() {
  const { data } = useSchedule();
  const isAdmin = data.profile?.role === 'admin';
  const [currentTab, setCurrentTab] = useState<string>(() => isAdmin ? 'admin' : 'dashboard');

  useEffect(() => {
    if (isAdmin && currentTab !== 'admin') {
      setCurrentTab('admin');
    }
  }, [isAdmin, currentTab]);

  const handleNavigateToTab = (tab: string) => {
    if (isAdmin) {
      setCurrentTab('admin');
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <Layout currentTab={isAdmin ? 'admin' : currentTab} setCurrentTab={setCurrentTab}>
      {isAdmin ? (
        <AdminView />
      ) : (
        <>
          {currentTab === 'dashboard' && (
            <DashboardView onNavigateToTab={handleNavigateToTab} />
          )}
          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </>
      )}
    </Layout>
  );
}

function App() {
  return (
    <ScheduleProvider>
      <AppContent />
    </ScheduleProvider>
  );
}

export default App;
