import React, { useState, useRef } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { Sun, Moon, Laptop, UserCheck, Download, Upload, AlertTriangle, RotateCcw, Check } from 'lucide-react';
import type { Theme } from '../types';

export const SettingsView: React.FC = () => {
  const { data, updateProfile, resetAllData, setTheme, importBackup, exportScheduleData } = useSchedule();
  
  const [fullName, setFullName] = useState(data.profile?.fullName || '');
  const [regNumber, setRegNumber] = useState(data.profile?.regNumber || '');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileChange = (field: 'fullName' | 'regNumber', val: string) => {
    if (field === 'fullName') {
      setFullName(val);
      if (data.profile) {
        updateProfile({ ...data.profile, fullName: val });
      }
    } else {
      setRegNumber(val);
      if (data.profile) {
        updateProfile({ ...data.profile, regNumber: val });
      }
    }
  };

  const handleExport = () => {
    const jsonStr = exportScheduleData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `idealab_backup_${data.profile?.regNumber || 'student'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackup(text);
        if (success) {
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 4000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 4000);
        }
      } catch (err) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 4000);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleExecuteReset = () => {
    resetAllData();
    setIsResetModalOpen(false);
  };

  const themeOptions: { id: Theme; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
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
                placeholder="e.g. PCEA25CS123"
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
              Select how Idea Lab Management looks on your screen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 select-none">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className="p-4 rounded-xl border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900/20 text-left flex flex-col justify-between hover:border-black dark:hover:border-white transition-all duration-150"
                >
                  <div className="flex justify-between items-center w-full mb-3">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs">{opt.label}</span>
                    <span className="block text-[10px] mt-0.5 leading-tight text-campus-secondary-light dark:text-campus-secondary-dark">
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
            <button
              onClick={handleExport}
              className="flex-1 inline-flex items-center justify-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-campus-border-light dark:border-campus-border-dark rounded-xl text-xs font-bold text-campus-primary-light dark:text-campus-primary-dark hover:bg-campus-bg-light dark:hover:bg-zinc-800 transition-colors shadow-soft-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export Backup (.json)</span>
            </button>

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
                <span>Import Backup (.json)</span>
              </button>
            </div>
          </div>

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

        {/* Danger Zone */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-red-600 dark:text-red-400">Danger Zone</h3>
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
              <span>Reset All Data</span>
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
                Delete all Idea Lab Management data?
              </h3>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark leading-relaxed">
                This action is permanent and will clear your student profile, timetables, and attendance records.
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
