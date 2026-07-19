export type Importance = 'important' | 'can_skip';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  isLunch?: boolean;
}

export interface ClassSchedule {
  subject: string;
  teacher: string;
  room: string;
  importance: Importance;
  type: 'lecture' | 'lab';
  startTime?: string;
  endTime?: string;
  notes?: string;
  color?: string; // Optional hex or label color
}

// Representing weekly timetable where key is "Day-SlotId"
export type TimetableData = Record<string, ClassSchedule>;

export interface UserProfile {
  fullName: string;
  regNumber: string;
}

export interface LabRecordSimple {
  recordNumber: number;
  topic: string;
  status: 'pending' | 'completed';
  notes: string;
}

export interface AttendanceSimple {
  present: number;
  absent: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface CampusOSData {
  profile: UserProfile | null;
  timetable: TimetableData;
  labs: Record<string, LabRecordSimple>;
  attendance: Record<string, AttendanceSimple>;
  theme: Theme;
}
