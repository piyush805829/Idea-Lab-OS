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
  id?: string;
  fullName: string;
  regNumber: string;
  role?: 'student' | 'admin';
  section?: string;
  batch?: string;
  branch?: string;
  profilePicture?: string;
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

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface SharedScheduleItem {
  _id: string;
  fromUserId: string;
  fromRegNumber: string;
  fromStudentName: string;
  fromSection: string;
  toRegNumber: string;
  timetableData: TimetableData;
  isImported: boolean;
  createdAt: string;
}

export interface IdeaLabRecord {
  _id?: string;
  studentName: string;
  regNumber: string;
  department?: string;
  section?: string;
  batch?: string;
  subjectMissed: string;
  teacher?: string;
  room?: string;
  lectureTime?: string;
  date: string;
  attendanceTime?: string;
  reason: string;
  status: string;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface TimetableTemplateItem {
  _id: string;
  title: string;
  branch: string;
  section: string;
  timetableData: TimetableData;
  createdBy: string;
  createdAt?: string;
}

export interface AdminDashboardStats {
  totalStudents: number;
  todayActiveStudents: number;
  schedulesCreated: number;
  pendingLabsCount: number;
  todayIdeaLabCount: number;
  mostMissedSubjects: { subject: string; count: number }[];
  mostActiveStudents: { fullName: string; regNumber: string; branch: string; section: string; lastActive: string }[];
}

export interface CampusOSData {
  profile: UserProfile | null;
  timetable: TimetableData;
  labs: Record<string, LabRecordSimple>;
  attendance: Record<string, AttendanceSimple>;
  theme: Theme;
}
