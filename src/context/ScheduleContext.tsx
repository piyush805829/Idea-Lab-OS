import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { 
  DayOfWeek, 
  ClassSchedule, 
  TimetableData, 
  UserProfile,
  LabRecordSimple,
  AttendanceSimple,
  Theme,
  CampusOSData
} from '../types';

interface ScheduleContextType {
  data: CampusOSData;
  saveStatus: 'saving' | 'saved';
  updateProfile: (profile: UserProfile | null) => void;
  saveClass: (day: DayOfWeek, slotId: string, classData: ClassSchedule | null) => void;
  deleteClass: (day: DayOfWeek, slotId: string) => void;
  updateLabRecord: (labName: string, record: LabRecordSimple) => void;
  updateAttendance: (subjectName: string, present: number, absent: number) => void;
  setTheme: (theme: Theme) => void;
  importBackup: (jsonData: string) => boolean;
  exportScheduleData: () => string;
  resetAllData: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Default Timetable Mock Data
const defaultTimetable: TimetableData = {
  'Monday-1': { subject: 'DSA', teacher: 'Dr. Alan', room: 'CS-101', importance: 'important', type: 'lecture' },
  'Monday-2': { subject: 'DBMS', teacher: 'Dr. Grace', room: 'CS-202', importance: 'can_skip', type: 'lecture' },
  'Tuesday-1': { subject: 'UI/UX Lab', teacher: 'Prof. Dieter', room: 'Design-Lab', importance: 'can_skip', type: 'lab' },
  'Tuesday-2': { subject: 'DSA', teacher: 'Dr. Alan', room: 'CS-101', importance: 'important', type: 'lecture' },
  'Wednesday-3': { subject: 'DE', teacher: 'Dr. Claude', room: 'EC-304', importance: 'important', type: 'lecture' },
  'Wednesday-5': { subject: 'DSA', teacher: 'Dr. Alan', room: 'CS-101', importance: 'important', type: 'lecture' },
  'Thursday-2': { subject: 'DBMS Lab', teacher: 'Dr. Grace', room: 'CS-205', importance: 'can_skip', type: 'lab' },
  'Thursday-6': { subject: 'DE', teacher: 'Dr. Claude', room: 'EC-304', importance: 'important', type: 'lecture' },
  'Friday-1': { subject: 'DBMS', teacher: 'Dr. Grace', room: 'CS-202', importance: 'can_skip', type: 'lecture' },
  'Friday-3': { subject: 'UI/UX', teacher: 'Prof. Dieter', room: 'Design-Lab', importance: 'can_skip', type: 'lecture' },
  'Friday-6': { subject: 'DE Lab', teacher: 'Dr. Claude', room: 'EC-302', importance: 'important', type: 'lab' },
};

// Default Labs Mock Records
const defaultLabs: Record<string, LabRecordSimple> = {
  'UI/UX Lab': { recordNumber: 2, topic: 'Figma Interactive Prototyping', status: 'pending', notes: 'Due coming Wednesday. Setup auto transitions.' },
  'DBMS Lab': { recordNumber: 4, topic: 'Relational Algebra & Subqueries', status: 'completed', notes: 'Checked and signed off by Dr. Grace.' },
  'DE Lab': { recordNumber: 1, topic: 'Combinational Adders & Subtractors', status: 'completed', notes: 'Verified output waveforms.' },
};

// Default Attendance Mock Logs
const defaultAttendance: Record<string, AttendanceSimple> = {
  'DSA': { present: 14, absent: 1 },
  'DBMS': { present: 8, absent: 3 },
  'UI/UX': { present: 12, absent: 0 },
  'DE': { present: 10, absent: 2 },
};

const defaultData: CampusOSData = {
  profile: null, // Force welcome modal on first open if profile is null
  timetable: defaultTimetable,
  labs: defaultLabs,
  attendance: defaultAttendance,
  theme: 'light',
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CampusOSData>(() => {
    const saved = localStorage.getItem('campusos-data');
    return saved ? JSON.parse(saved) : defaultData;
  });

  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state modifications to LocalStorage & update save status indicator
  const triggerSave = (updatedData: CampusOSData) => {
    setSaveStatus('saving');
    setData(updatedData);
    localStorage.setItem('campusos-data', JSON.stringify(updatedData));

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  };

  // Sync theme changes with DOM classes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    const theme = data.theme;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [data.theme]);

  // Handle system theme updates dynamically
  useEffect(() => {
    if (data.theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [data.theme]);

  // Expose CRUD actions
  const updateProfile = (profile: UserProfile | null) => {
    triggerSave({
      ...data,
      profile
    });
  };

  const saveClass = (day: DayOfWeek, slotId: string, classData: ClassSchedule | null) => {
    const key = `${day}-${slotId}`;
    const newTimetable = { ...data.timetable };
    
    if (classData) {
      newTimetable[key] = classData;
    } else {
      delete newTimetable[key];
    }

    // Automatically scaffold empty attendance for new subjects
    const newAttendance = { ...data.attendance };
    if (classData && classData.subject.trim()) {
      const name = classData.subject.trim();
      if (!newAttendance[name]) {
        newAttendance[name] = { present: 0, absent: 0 };
      }
    }

    triggerSave({
      ...data,
      timetable: newTimetable,
      attendance: newAttendance
    });
  };

  const deleteClass = (day: DayOfWeek, slotId: string) => {
    const key = `${day}-${slotId}`;
    const newTimetable = { ...data.timetable };
    delete newTimetable[key];

    triggerSave({
      ...data,
      timetable: newTimetable
    });
  };

  const updateLabRecord = (labName: string, record: LabRecordSimple) => {
    const newLabs = {
      ...data.labs,
      [labName]: record
    };

    triggerSave({
      ...data,
      labs: newLabs
    });
  };

  const updateAttendance = (subjectName: string, present: number, absent: number) => {
    const newAttendance = {
      ...data.attendance,
      [subjectName]: {
        present: Math.max(0, present),
        absent: Math.max(0, absent)
      }
    };

    triggerSave({
      ...data,
      attendance: newAttendance
    });
  };

  const setTheme = (theme: Theme) => {
    triggerSave({
      ...data,
      theme
    });
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      // Validate schema minimally
      if (parsed.timetable && parsed.labs && parsed.attendance && parsed.theme) {
        triggerSave(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const exportScheduleData = (): string => {
    return JSON.stringify(data, null, 2);
  };

  const resetAllData = () => {
    localStorage.removeItem('campusos-data');
    setData(defaultData);
    setSaveStatus('saved');
  };

  return (
    <ScheduleContext.Provider value={{
      data,
      saveStatus,
      updateProfile,
      saveClass,
      deleteClass,
      updateLabRecord,
      updateAttendance,
      setTheme,
      importBackup,
      exportScheduleData,
      resetAllData
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
