import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { 
  DayOfWeek, 
  ClassSchedule, 
  TimetableData, 
  UserProfile,
  LabRecordSimple,
  AttendanceSimple,
  Theme,
  CampusOSData,
  SharedScheduleItem,
  NotificationItem
} from '../types';

import { getApiBaseUrl } from '../utils/api';

const API_BASE = getApiBaseUrl();

interface AuthResponse {
  success: boolean;
  message: string;
}

interface ScheduleContextType {
  data: CampusOSData;
  token: string | null;
  saveStatus: 'saving' | 'saved';
  isAuthModalOpen: boolean;
  incomingShared: SharedScheduleItem[];
  notifications: NotificationItem[];

  // Auth actions
  login: (identifier: string, password: string) => Promise<AuthResponse>;
  signup: (payload: any) => Promise<AuthResponse>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Data mutations
  updateProfile: (profile: UserProfile | null) => Promise<void>;
  saveClass: (day: DayOfWeek, slotId: string, classData: ClassSchedule | null) => Promise<void>;
  deleteClass: (day: DayOfWeek, slotId: string) => Promise<void>;
  updateLabRecord: (labName: string, record: LabRecordSimple) => Promise<void>;
  updateAttendance: (subjectName: string, present: number, absent: number) => Promise<void>;
  setTheme: (theme: Theme) => void;

  // Sharing & Importing
  shareSearch: (regNumber: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  shareSend: (toRegNumber: string) => Promise<{ success: boolean; message: string }>;
  importSharedSchedule: (sharedId: string) => Promise<{ success: boolean; message: string }>;
  refreshIncomingShared: () => Promise<void>;

  // Backups
  importBackup: (jsonData: string) => Promise<boolean>;
  exportScheduleData: () => string;
  resetAllData: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const defaultTimetable: TimetableData = {};
const defaultLabs: Record<string, LabRecordSimple> = {};
const defaultAttendance: Record<string, AttendanceSimple> = {};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read token from localStorage on initial mount
  const getStoredToken = () => 
    localStorage.getItem('campusos-token') || 
    localStorage.getItem('idealab_token') || 
    localStorage.getItem('campusos_token');

  const [token, setToken] = useState<string | null>(getStoredToken);
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('campusos-theme') as Theme) || 'light');
  
  const [data, setData] = useState<CampusOSData>({
    profile: null,
    timetable: defaultTimetable,
    labs: defaultLabs,
    attendance: defaultAttendance,
    theme: theme
  });

  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');
  // Don't show login modal immediately if stored token exists (prevents 1 second login window flash on refresh)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !getStoredToken());
  const [incomingShared, setIncomingShared] = useState<SharedScheduleItem[]>([]);
  const [notifications] = useState<NotificationItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaving = () => {
    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaveStatus('saved'), 600);
  };

  const saveTokenToStorage = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('campusos-token', newToken);
      localStorage.setItem('idealab_token', newToken);
      localStorage.setItem('campusos_token', newToken);
    } else {
      localStorage.removeItem('campusos-token');
      localStorage.removeItem('idealab_token');
      localStorage.removeItem('campusos_token');
    }
  };

  // Sync theme changes with DOM & LocalStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('campusos-theme', newTheme);
    setData(prev => ({ ...prev, theme: newTheme }));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Load student data from backend if token is saved
  const loadBackendData = useCallback(async () => {
    const activeToken = token || getStoredToken();

    if (!activeToken) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      // 1. Fetch User Profile
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (meRes.status === 401 || meRes.status === 403) {
        saveTokenToStorage(null);
        setIsAuthModalOpen(true);
        return;
      }

      if (meRes.ok) {
        const meJson = await meRes.json();
        const user = meJson.user;
        if (user) {
          const profile: UserProfile = {
            id: user._id || user.id,
            fullName: user.fullName,
            regNumber: user.registrationNumber || user.regNumber,
            role: user.role,
            section: user.section || 'A',
            batch: user.batch || '1',
            branch: user.branch || 'CSE'
          };

          // 2. Fetch User Timetable from MongoDB Atlas
          let timetable: TimetableData = {};
          try {
            const ttRes = await fetch(`${API_BASE}/timetable`, {
              headers: { Authorization: `Bearer ${activeToken}` }
            });
            if (ttRes.ok) {
              const ttJson = await ttRes.json();
              timetable = ttJson.timetable || {};
            }
          } catch (e) {}

          setData(prev => ({
            ...prev,
            profile,
            timetable
          }));

          // Ensure auth modal remains hidden for active session
          setIsAuthModalOpen(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, operating on local session');
    }
  }, [token]);

  // Fetch incoming shared timetables
  const refreshIncomingShared = useCallback(async () => {
    const activeToken = token || getStoredToken();
    if (!activeToken) return;

    try {
      const res = await fetch(`${API_BASE}/share`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setIncomingShared(json.sharedTimetables || []);
      }
    } catch (e) {
      console.error('Failed to fetch shared schedules:', e);
    }
  }, [token]);

  useEffect(() => {
    loadBackendData();
    refreshIncomingShared();
  }, [loadBackendData, refreshIncomingShared]);

  // Auth: Login
  const login = async (identifier: string, password: string): Promise<AuthResponse> => {
    const cleanId = identifier.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registrationNumber: cleanId, 
          regNumber: cleanId,
          identifier: cleanId,
          password 
        })
      });

      const json = await res.json();
      if (res.ok && json.token) {
        saveTokenToStorage(json.token);

        const user = json.user;
        if (user) {
          setData(prev => ({
            ...prev,
            profile: {
              id: user.id || user._id,
              fullName: user.fullName,
              regNumber: user.registrationNumber || user.regNumber,
              role: user.role,
              section: user.section || 'A',
              batch: user.batch || '1',
              branch: user.branch || 'CSE'
            }
          }));
        }

        setIsAuthModalOpen(false);
        await loadBackendData();
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: json.message || 'Invalid registration number or password.' };
      }
    } catch (err) {
      console.warn('Network error during login, attempting fallback login');
    }

    // Client-side fallback check for Admin
    if ((cleanId.toUpperCase() === 'IDEALAB2026' || cleanId.toLowerCase() === 'idea lab administrator') && password === 'Idealab8058') {
      const dummyToken = 'mock_admin_jwt_token';
      saveTokenToStorage(dummyToken);
      setData(prev => ({
        ...prev,
        profile: {
          id: 'admin_id_001',
          fullName: 'Idea Lab Administrator',
          regNumber: 'IDEALAB2026',
          role: 'admin',
          section: 'ADMIN',
          batch: 'ADMIN',
          branch: 'ADMIN'
        }
      }));
      setIsAuthModalOpen(false);
      return { success: true, message: 'Login successful' };
    }

    return { success: false, message: 'Invalid registration number/name or password' };
  };

  // Auth: Signup (Automatic Redirect to Student Dashboard)
  const signup = async (payload: any): Promise<AuthResponse> => {
    try {
      const regNo = (payload.registrationNumber || payload.regNumber || '').trim();
      const signupBody = {
        ...payload,
        registrationNumber: regNo,
        regNumber: regNo
      };

      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupBody)
      });

      const json = await res.json();
      if (res.ok && json.token) {
        saveTokenToStorage(json.token);

        const user = json.user;
        if (user) {
          setData(prev => ({
            ...prev,
            profile: {
              id: user.id || user._id,
              fullName: user.fullName,
              regNumber: user.registrationNumber || user.regNumber,
              role: user.role,
              section: user.section || 'A',
              batch: user.batch || '1',
              branch: user.branch || 'CSE'
            },
            timetable: {}
          }));
        }

        setIsAuthModalOpen(false);
        await loadBackendData();
        return { success: true, message: 'Account created successfully!' };
      } else {
        return { success: false, message: json.message || 'Signup failed' };
      }
    } catch (err) {
      return { success: false, message: 'Unable to connect to server.' };
    }
  };

  const logout = () => {
    saveTokenToStorage(null);
    setData({
      profile: null,
      timetable: defaultTimetable,
      labs: defaultLabs,
      attendance: defaultAttendance,
      theme: theme
    });
    setIsAuthModalOpen(true);
  };

  // Update Profile
  const updateProfile = async (profile: UserProfile | null) => {
    if (!profile) return;
    setData(prev => ({ ...prev, profile }));
  };

  // Save / Modify Class & Persist to MongoDB Atlas Database
  const saveClass = async (day: DayOfWeek, slotId: string, classData: ClassSchedule | null) => {
    markSaving();
    const key = `${day}-${slotId}`;
    const newTimetable = { ...data.timetable };
    
    if (classData) {
      newTimetable[key] = classData;
    } else {
      delete newTimetable[key];
    }
    
    setData(prev => ({ ...prev, timetable: newTimetable }));

    const activeToken = token || getStoredToken();
    if (activeToken) {
      try {
        await fetch(`${API_BASE}/timetable`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}` 
          },
          body: JSON.stringify({ timetable: newTimetable })
        });
      } catch (e) {
        console.error('Error saving timetable to MongoDB:', e);
      }
    }
  };

  const deleteClass = async (day: DayOfWeek, slotId: string) => {
    await saveClass(day, slotId, null);
  };

  const updateLabRecord = async (labName: string, record: LabRecordSimple) => {
    setData(prev => ({
      ...prev,
      labs: {
        ...prev.labs,
        [labName]: record
      }
    }));
  };

  const updateAttendance = async (subjectName: string, present: number, absent: number) => {
    setData(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [subjectName]: { present, absent }
      }
    }));
  };

  const shareSearch = async (regNumber: string) => {
    const activeToken = token || getStoredToken();
    try {
      const res = await fetch(`${API_BASE}/share/search?regNumber=${encodeURIComponent(regNumber)}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const json = await res.json();
      return { success: res.ok, data: json.user, message: json.message };
    } catch (e) {
      return { success: false, message: 'Share search failed' };
    }
  };

  const shareSend = async (toRegNumber: string) => {
    const activeToken = token || getStoredToken();
    try {
      const res = await fetch(`${API_BASE}/share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}` 
        },
        body: JSON.stringify({ toRegNumber, timetableData: data.timetable })
      });
      const json = await res.json();
      return { success: res.ok, message: json.message || 'Timetable shared!' };
    } catch (e) {
      return { success: false, message: 'Share failed' };
    }
  };

  const importSharedSchedule = async (sharedId: string) => {
    const activeToken = token || getStoredToken();
    try {
      const res = await fetch(`${API_BASE}/share/import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}` 
        },
        body: JSON.stringify({ shareId: sharedId })
      });
      const json = await res.json();
      if (res.ok) {
        await loadBackendData();
        return { success: true, message: json.message || 'Schedule imported!' };
      }
      return { success: false, message: json.message || 'Import failed' };
    } catch (e) {
      return { success: false, message: 'Import failed' };
    }
  };

  const importBackup = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);

      let newTimetable = parsed.timetable || (parsed.data && parsed.data.timetable) || null;
      let newLabs = parsed.labs || (parsed.data && parsed.data.labs) || data.labs;
      let newAttendance = parsed.attendance || (parsed.data && parsed.data.attendance) || data.attendance;

      if (!newTimetable && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        const isTimetableDict = keys.some(k => k.includes('-') || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].some(d => k.toLowerCase().startsWith(d)));
        if (isTimetableDict) {
          newTimetable = parsed;
        }
      }

      if (newTimetable && typeof newTimetable === 'object') {
        setData(prev => ({
          ...prev,
          timetable: newTimetable,
          labs: newLabs,
          attendance: newAttendance
        }));

        markSaving();

        const activeToken = token || getStoredToken();
        if (activeToken) {
          try {
            await fetch(`${API_BASE}/timetable`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeToken}`
              },
              body: JSON.stringify({ timetable: newTimetable })
            });
            console.log('✓ Imported timetable persisted to database successfully!');
          } catch (e) {
            console.error('Error persisting imported timetable:', e);
          }
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to parse import JSON:', e);
    }
    return false;
  };

  const exportScheduleData = (): string => {
    return JSON.stringify(data, null, 2);
  };

  const resetAllData = async () => {
    setData(prev => ({
      ...prev,
      timetable: {},
      labs: {},
      attendance: {}
    }));
    markSaving();

    const activeToken = token || getStoredToken();
    if (activeToken) {
      try {
        await fetch(`${API_BASE}/timetable`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ timetable: {} })
        });
      } catch (e) {
        console.error('Error clearing timetable on backend:', e);
      }
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <ScheduleContext.Provider value={{
      data,
      token,
      saveStatus,
      isAuthModalOpen,
      incomingShared,
      notifications,
      login,
      signup,
      logout,
      openAuthModal,
      closeAuthModal,
      updateProfile,
      saveClass,
      deleteClass,
      updateLabRecord,
      updateAttendance,
      setTheme,
      shareSearch,
      shareSend,
      importSharedSchedule,
      refreshIncomingShared,
      importBackup,
      exportScheduleData,
      resetAllData
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
