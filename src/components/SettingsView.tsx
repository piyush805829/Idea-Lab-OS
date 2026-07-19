import React, { useRef, useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { 
  Sun, 
  Moon, 
  Laptop, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import type { Theme } from '../types';

export const SettingsView: React.FC = () => {
  const { data, updateProfile, setTheme, exportScheduleData, importBackup, resetAllData } = useSchedule();
  const theme = data.theme;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local profile states
  const [fullName, setFullName] = useState(data.profile?.fullName || '');
  const [regNumber, setRegNumber] = useState(data.profile?.regNumber || '');

  // Notification states
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync profile details if changed externally
  useEffect(() => {
    if (data.profile) {
      setFullName(data.profile.fullName);
      setRegNumber(data.profile.regNumber);
    } else {
      setFullName('');
      setRegNumber('');
    }
  }, [data.profile]);

  const handleProfileChange = (field: 'fullName' | 'regNumber', value: string) => {
    if (field === 'fullName') {
      setFullName(value);
      updateProfile({ fullName: value, regNumber });
    } else {
      setRegNumber(value);
      updateProfile({ fullName, regNumber: value });
    }
  };

  const handleExport = () => {
    const dataStr = exportScheduleData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'campusos-data-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = importBackup(result);
        if (success) {
          setImportStatus('success');
          setTimeout(() => {
            setImportStatus('idle');
            // Auto reload to re-scaffold UI state
            window.location.reload();
          }, 1500);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteReset = () => {
    resetAllData();
    setIsResetModalOpen(false);
    // Reload to return back to first-time setup state
    window.location.reload();
  };

  const themeOptions: { id: Theme; label: string; icon: typeof Sun; desc: string }[] = [
    { id: 'light', label: 'Light Theme', icon: Sun, desc: 'Clean background with soft gray borders.' },
    { id: 'dark', label: 'Dark Theme', icon: Moon, desc: 'Vibrant text highlights on dark cards.' },
    { id: 'system', label: 'System Sync', icon: Laptop, desc: 'Adapts to your operating system settings.' }
  ];

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-campus-primary-light dark:text-campus-primary-dark">Settings</h2>
        <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
          Configure profile metadata, theme settings and back up dashboard assets.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* PROFILE SECTION */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="h-5 w-5 text-campus-primary-light dark:text-campus-primary-dark" />
            <div>
              <h3 className="font-bold text-sm text-campus-primary-light dark:text-campus-primary-dark">Student Profile</h3>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                Update name and registration details displayed in your sidebar. Saves automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="e.g. Piyush"
                value={fullName}
                onChange={(e) => handleProfileChange('fullName', e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-medium"
              />
            </div>
            <div>
              <label htmlFor="regNumber" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                Registration Number
              </label>
              <input
                id="regNumber"
                type="text"
                required
                placeholder="e.g. 24EJICS089"
                value={regNumber}
                onChange={(e) => handleProfileChange('regNumber', e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-mono font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-campus-primary-light dark:text-campus-primary-dark">Appearance</h3>
            <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
              Select how CampusOS looks on your screen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 select-none">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative ${
                    isSelected
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-soft-sm'
                      : 'border-campus-border-light bg-white hover:bg-campus-bg-light/60 dark:border-campus-border-dark dark:bg-zinc-900/20 dark:hover:bg-zinc-900/60 text-campus-primary-light dark:text-campus-primary-dark'
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-3">
                    <Icon className="h-4.5 w-4.5" />
                    {isSelected && (
                      <span className="h-4 w-4 bg-white/20 dark:bg-black/10 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block font-bold text-xs">{opt.label}</span>
                    <span className={`block text-[10px] mt-0.5 leading-tight ${
                      isSelected ? 'text-gray-300 dark:text-zinc-500' : 'text-campus-secondary-light dark:text-campus-secondary-dark'
                    }`}>
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data & Timetable Backup Management */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-campus-primary-light dark:text-campus-primary-dark">Data Backup</h3>
            <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
              Export layout data to backup files or import from previous configurations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex-1 inline-flex items-center justify-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-campus-border-light dark:border-campus-border-dark rounded-xl text-xs font-bold text-campus-primary-light dark:text-campus-primary-dark hover:bg-campus-bg-light dark:hover:bg-zinc-800 transition-colors shadow-soft-sm"
            >
              <Download className="h-4 w-4" />
              Export Backup
            </button>

            {/* Import Button */}
            <div className="flex-1 relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="w-full inline-flex items-center justify-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-campus-border-light dark:border-campus-border-dark rounded-xl text-xs font-bold text-campus-primary-light dark:text-campus-primary-dark hover:bg-campus-bg-light dark:hover:bg-zinc-800 transition-colors shadow-soft-sm"
              >
                <Upload className="h-4 w-4" />
                Import Backup
              </button>
            </div>
          </div>

          {/* Import Notification Banner */}
          {importStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-100 dark:bg-green-950/20 dark:border-green-950/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-lg flex items-center gap-2 animate-fade-in">
              <Check className="h-4 w-4 shrink-0 text-green-500" />
              <span>Timetable data restored successfully! Re-populating dashboard view...</span>
            </div>
          )}
          {importStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-950/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>Invalid backup file format. Make sure you load a valid backup JSON.</span>
            </div>
          )}
        </div>

        {/* Reset Settings */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-campus-primary-light dark:text-campus-primary-dark text-red-600 dark:text-red-400">Danger Zone</h3>
            <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
              Permanently clear your timetable data and reset the student profile.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Data
            </button>
          </div>
        </div>

      </div>

      {/* CUSTOM CONFIRMATION RESET DIALOG MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus shadow-soft-lg w-full max-w-sm overflow-hidden transform scale-100 transition-all duration-300 animate-slide-up">
            <div className="p-6 space-y-4 text-center">
              <div className="h-12 w-12 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-campus-primary-light dark:text-campus-primary-dark">
                Delete all CampusOS data?
              </h3>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark leading-relaxed">
                This action is permanent and will clear your student profile, timetables, and attendance records from LocalStorage.
              </p>
            </div>
            
            <div className="px-6 py-4.5 bg-campus-bg-light dark:bg-zinc-900/50 border-t border-campus-border-light dark:border-campus-border-dark flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold border border-campus-border-light dark:border-campus-border-dark rounded-lg text-campus-secondary-light hover:text-campus-primary-light dark:text-campus-secondary-dark dark:hover:text-campus-primary-dark transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-soft-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
