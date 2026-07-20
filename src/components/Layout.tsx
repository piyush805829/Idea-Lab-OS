import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { AuthModal } from './AuthModal';
import { 
  Calendar, 
  Settings as SettingsIcon, 
  Clock, 
  GraduationCap, 
  Sun, 
  Moon, 
  Laptop,
  ShieldCheck,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { setTheme, data, saveStatus, isAuthModalOpen, logout } = useSchedule();
  const theme = data.theme;
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Calendar },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  if (data.profile?.role === 'admin') {
    navigationItems.push({ id: 'admin', name: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-campus-bg-light dark:bg-campus-bg-dark text-campus-primary-light dark:text-campus-primary-dark transition-colors duration-200">
      {/* Auth Modal Overlay when not authenticated */}
      <AuthModal isOpen={isAuthModalOpen} />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-campus-border-light dark:border-campus-border-dark bg-white/80 dark:bg-campus-card-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Side: Logo & App Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="h-8 w-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight block leading-none">Idea Lab Management</span>
              <span className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark tracking-wider uppercase font-medium">Idea Lab Platform</span>
            </div>
          </div>

          {/* Right Side: Live Clock & Date */}
          <div className="flex items-center space-x-4 text-sm font-medium">
            {/* Auto Save Status Indicator */}
            <div className="flex items-center space-x-1.5 text-xs select-none mr-2 font-semibold">
              {saveStatus === 'saving' ? (
                <span className="text-campus-secondary-light dark:text-campus-secondary-dark flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Saving...
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
                  ✓ All Changes Saved
                </span>
              )}
            </div>
            <div className="hidden md:block h-4 w-px bg-campus-border-light dark:bg-campus-border-dark" />
            <div className="hidden md:flex items-center space-x-2 text-campus-secondary-light dark:text-campus-secondary-dark">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="h-4 w-px bg-campus-border-light dark:bg-campus-border-dark hidden md:block" />
            <div className="flex items-center space-x-2 font-mono bg-campus-bg-light dark:bg-campus-bg-dark px-3 py-1.5 rounded-md border border-campus-border-light dark:border-campus-border-dark shadow-soft-sm">
              <Clock className="h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
              <span className="tabular-nums">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            {/* Student Profile in Sidebar */}
            {data.profile && (
              <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-4 rounded-campus shadow-soft-sm mb-4 select-none flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-campus-primary-light dark:text-campus-primary-dark truncate leading-none">
                      {data.profile.fullName}
                    </h4>
                    {data.profile.role === 'admin' && (
                      <span className="bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark tracking-wide font-mono font-bold mt-1.5 block truncate">
                    {data.profile.regNumber} {data.profile.section ? `• ${data.profile.section}` : ''}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-campus-secondary-light hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <nav className="flex md:flex-col flex-row gap-1 bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-2 rounded-campus shadow-soft-sm overflow-x-auto md:overflow-visible">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id || (item.id === 'dashboard' && currentTab === 'timetable');
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap flex-1 md:flex-none ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-soft-md'
                        : 'text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-light dark:hover:text-campus-primary-dark hover:bg-campus-bg-light dark:hover:bg-campus-bg-dark/40'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick theme toggles below menu (desktop only) */}
            <div className="hidden md:flex items-center justify-between mt-6 bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-1.5 rounded-campus shadow-soft-sm">
              <span className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark font-medium pl-3">Theme</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setTheme('light')}
                  title="Light mode"
                  className={`p-1.5 rounded-md transition-all ${
                    theme === 'light'
                      ? 'bg-campus-bg-light dark:bg-zinc-800 text-campus-primary-light shadow-soft-sm'
                      : 'text-campus-secondary-light hover:text-campus-primary-light'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  title="Dark mode"
                  className={`p-1.5 rounded-md transition-all ${
                    theme === 'dark'
                      ? 'bg-campus-bg-light dark:bg-zinc-800 text-campus-primary-dark shadow-soft-sm'
                      : 'text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-dark'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  title="System theme"
                  className={`p-1.5 rounded-md transition-all ${
                    theme === 'system'
                      ? 'bg-campus-bg-light dark:bg-zinc-800 text-campus-primary-light dark:text-campus-primary-dark shadow-soft-sm'
                      : 'text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-light dark:hover:text-campus-primary-dark'
                  }`}
                >
                  <Laptop className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Page Content area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
