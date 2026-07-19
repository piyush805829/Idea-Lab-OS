import type { TimeSlot, DayOfWeek } from '../types';

export const TIME_SLOTS: TimeSlot[] = [
  { id: '1', label: '8:00–9:00', startTime: '08:00', endTime: '09:00' },
  { id: '2', label: '9:00–10:00', startTime: '09:00', endTime: '10:00' },
  { id: '3', label: '10:00–11:00', startTime: '10:00', endTime: '11:00' },
  { id: '4', label: '11:00–11:50 Lunch', startTime: '11:00', endTime: '11:50', isLunch: true },
  { id: '5', label: '11:50–12:50', startTime: '11:50', endTime: '12:50' },
  { id: '6', label: '12:50–1:50', startTime: '12:50', endTime: '13:50' },
  { id: '7', label: '1:50–2:50', startTime: '13:50', endTime: '14:50' },
];

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getCurrentTimeInMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getDayName(date: Date): DayOfWeek | null {
  const days: (DayOfWeek | null)[] = [
    null, // Sunday
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    null // Saturday
  ];
  return days[date.getDay()];
}

export function getTomorrowDayName(date: Date): DayOfWeek | null {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return getDayName(tomorrow);
}

export function getCurrentSlot(date: Date): TimeSlot | null {
  const dayName = getDayName(date);
  if (!dayName) return null; // Weekend

  const currentMinutes = getCurrentTimeInMinutes(date);
  for (const slot of TIME_SLOTS) {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    if (currentMinutes >= start && currentMinutes < end) {
      return slot;
    }
  }
  return null;
}

export function getNextSlot(date: Date): TimeSlot | null {
  const dayName = getDayName(date);
  if (!dayName) return null; // Weekend

  const currentMinutes = getCurrentTimeInMinutes(date);
  // Find the first slot that starts in the future today
  for (const slot of TIME_SLOTS) {
    const start = timeToMinutes(slot.startTime);
    if (start > currentMinutes) {
      return slot;
    }
  }
  return null;
}

export function getCountdown(targetTimeStr: string, date: Date): string {
  const targetMins = timeToMinutes(targetTimeStr);
  const currentMins = getCurrentTimeInMinutes(date);
  const currentSecs = date.getSeconds();

  let diffMins = targetMins - currentMins;
  
  if (diffMins <= 0) return '0s';

  // Account for seconds remaining to the next minute
  const totalSeconds = diffMins * 60 - currentSecs;
  if (totalSeconds <= 0) return '0s';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}
