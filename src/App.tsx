import { useState } from 'react';
import { ScheduleProvider } from './context/ScheduleContext';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const handleNavigateToTab = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && (
        <DashboardView onNavigateToTab={handleNavigateToTab} />
      )}
      {currentTab === 'settings' && (
        <SettingsView />
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
