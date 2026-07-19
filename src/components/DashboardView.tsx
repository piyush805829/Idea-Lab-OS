import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { 
  TIME_SLOTS, 
  getDayName, 
  getTomorrowDayName,
  timeToMinutes,
  getCurrentTimeInMinutes,
  getCountdown
} from '../utils/timeUtils';
import { 
  Clock, 
  MapPin, 
  User, 
  Coffee, 
  Plus,
  BookOpen,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import type { DayOfWeek, TimeSlot, ClassSchedule } from '../types';
import { TimetableGrid } from './TimetableGrid';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab }) => {
  const { data, saveClass, deleteClass, updateProfile, updateLabRecord } = useSchedule();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Timetable Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  // Timetable Form State
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formImportance, setFormImportance] = useState<'important' | 'can_skip'>('can_skip');
  const [formType, setFormType] = useState<'lecture' | 'lab'>('lecture');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Tomorrow Lab Edit Modal State
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labModalTargetName, setLabModalTargetName] = useState('');
  const [labFormRecordNum, setLabFormRecordNum] = useState(1);
  const [labFormTopic, setLabFormTopic] = useState('');
  const [labFormStatus, setLabFormStatus] = useState<'pending' | 'completed'>('pending');
  const [labFormNotes, setLabFormNotes] = useState('');

  // Welcome modal inputs (for first time profile setup)
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeReg, setWelcomeReg] = useState('');

  const timetable = data.timetable;
  const labs = data.labs;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayName = getDayName(currentDate);

  // 1. Current Class Card Logic (handles custom timings)
  let currentClass: ClassSchedule | null = null;
  let activeSlotLabel = '';
  let activeSlotIsLunch = false;

  if (todayName) {
    const currentMinutes = getCurrentTimeInMinutes(currentDate);
    for (const slot of TIME_SLOTS) {
      if (slot.isLunch) {
        const start = timeToMinutes(slot.startTime);
        const end = timeToMinutes(slot.endTime);
        if (currentMinutes >= start && currentMinutes < end) {
          activeSlotIsLunch = true;
          activeSlotLabel = 'Lunch';
          break;
        }
        continue;
      }

      const cls = timetable[`${todayName}-${slot.id}`];
      const startStr = cls?.startTime || slot.startTime;
      const endStr = cls?.endTime || slot.endTime;
      const start = timeToMinutes(startStr);
      const end = timeToMinutes(endStr);

      if (currentMinutes >= start && currentMinutes < end) {
        currentClass = cls || null;
        activeSlotLabel = `${startStr}–${endStr}`;
        break;
      }
    }
  }

  // 2. Next Class Card Logic (handles custom timings + countdown until starts)
  let nextClassSlot: { id: string; startTime: string; endTime: string } | null = null;
  let nextClass: ClassSchedule | null = null;

  if (todayName) {
    const currentMins = getCurrentTimeInMinutes(currentDate);
    let closestDiff = Infinity;

    for (const slot of TIME_SLOTS) {
      if (slot.isLunch) continue;

      const cls = timetable[`${todayName}-${slot.id}`];
      if (cls) {
        const startStr = cls.startTime || slot.startTime;
        const start = timeToMinutes(startStr);
        if (start > currentMins) {
          const diff = start - currentMins;
          if (diff < closestDiff) {
            closestDiff = diff;
            nextClass = cls;
            nextClassSlot = {
              id: slot.id,
              startTime: startStr,
              endTime: cls.endTime || slot.endTime
            };
          }
        }
      }
    }
  }

  // 3. Tomorrow's Lab Card Logic (scans tomorrow's classes for type === 'lab' and merges with custom lab log)
  const tomorrowName = getTomorrowDayName(currentDate);
  let tomorrowLabInfo: {
    labName: string;
    room: string;
    teacher: string;
    startTime: string;
    endTime: string;
    recordNumber: number;
    topic: string;
    status: 'pending' | 'completed';
    notes: string;
  } | null = null;

  if (tomorrowName) {
    for (const slot of TIME_SLOTS) {
      if (slot.isLunch) continue;
      const cls = timetable[`${tomorrowName}-${slot.id}`];
      if (cls && cls.type === 'lab') {
        const name = cls.subject;
        const record = labs[name] || {
          recordNumber: 1,
          topic: 'No topic set',
          status: 'pending',
          notes: ''
        };

        tomorrowLabInfo = {
          labName: name,
          room: cls.room,
          teacher: cls.teacher,
          startTime: cls.startTime || slot.startTime,
          endTime: cls.endTime || slot.endTime,
          recordNumber: record.recordNumber,
          topic: record.topic,
          status: record.status,
          notes: record.notes
        };
        break;
      }
    }
  }

  // Timetable Edit Dialog actions
  const handleOpenEditModal = (day: DayOfWeek, slot: TimeSlot) => {
    setSelectedDay(day);
    setSelectedSlot(slot);
    
    const existing = timetable[`${day}-${slot.id}`];
    if (existing) {
      setFormSubject(existing.subject);
      setFormTeacher(existing.teacher);
      setFormRoom(existing.room);
      setFormImportance(existing.importance);
      setFormType(existing.type || 'lecture');
      setFormStartTime(existing.startTime || slot.startTime);
      setFormEndTime(existing.endTime || slot.endTime);
      setFormNotes(existing.notes || '');
    } else {
      setFormSubject('');
      setFormTeacher('');
      setFormRoom('');
      setFormImportance('can_skip');
      setFormType('lecture');
      setFormStartTime(slot.startTime);
      setFormEndTime(slot.endTime);
      setFormNotes('');
    }
    setIsEditModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!formSubject.trim()) {
      deleteClass(selectedDay, selectedSlot.id);
    } else {
      saveClass(selectedDay, selectedSlot.id, {
        subject: formSubject.trim(),
        teacher: formTeacher.trim() || 'Unknown Teacher',
        room: formRoom.trim() || 'Unknown Room',
        importance: formImportance,
        type: formType,
        startTime: formStartTime.trim() || selectedSlot.startTime,
        endTime: formEndTime.trim() || selectedSlot.endTime,
        notes: formNotes.trim()
      });
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteClass = () => {
    if (!selectedSlot) return;
    deleteClass(selectedDay, selectedSlot.id);
    setIsEditModalOpen(false);
  };

  // Tomorrow Lab card edit modal launcher
  const handleOpenLabModal = () => {
    if (!tomorrowLabInfo) return;
    const name = tomorrowLabInfo.labName;
    setLabModalTargetName(name);

    const record = labs[name] || {
      recordNumber: 1,
      topic: '',
      status: 'pending',
      notes: ''
    };

    setLabFormRecordNum(record.recordNumber);
    setLabFormTopic(record.topic);
    setLabFormStatus(record.status);
    setLabFormNotes(record.notes);
    setIsLabModalOpen(true);
  };

  const handleSaveLabRecord = (e: React.FormEvent) => {
    e.preventDefault();
    updateLabRecord(labModalTargetName, {
      recordNumber: labFormRecordNum,
      topic: labFormTopic.trim(),
      status: labFormStatus,
      notes: labFormNotes.trim()
    });
    setIsLabModalOpen(false);
  };

  const handleWelcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (welcomeName.trim() && welcomeReg.trim()) {
      updateProfile({
        fullName: welcomeName.trim(),
        regNumber: welcomeReg.trim().toUpperCase()
      });
    }
  };

  // Check if today has classes scheduled (on weekdays)
  const todayClassCount = todayName 
    ? TIME_SLOTS.filter(slot => !slot.isLunch && timetable[`${todayName}-${slot.id}`]).length 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* FIRST TIME SETUP WELCOME MODAL */}
      {!data.profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus shadow-soft-lg w-full max-w-md overflow-hidden transform scale-100 transition-all duration-300 animate-slide-up">
            <div className="px-6 py-6 border-b border-campus-border-light dark:border-campus-border-dark bg-campus-bg-light dark:bg-zinc-900/50 text-center space-y-1.5 select-none">
              <div className="h-10 w-10 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black mx-auto mb-2">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-extrabold text-lg text-campus-primary-light dark:text-campus-primary-dark">
                Welcome to CampusOS
              </h3>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark max-w-[280px] mx-auto">
                Set up your student profile details to customize your timetable dashboard.
              </p>
            </div>
            
            <form onSubmit={handleWelcomeSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="welcomeName" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="welcomeName"
                    type="text"
                    required
                    placeholder="e.g. Piyush"
                    value={welcomeName}
                    onChange={(e) => setWelcomeName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark"
                  />
                </div>
                <div>
                  <label htmlFor="welcomeReg" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                    Registration Number
                  </label>
                  <input
                    id="welcomeReg"
                    type="text"
                    required
                    placeholder="e.g. 24EJICS089"
                    value={welcomeReg}
                    onChange={(e) => setWelcomeReg(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="px-6 py-4.5 bg-campus-bg-light dark:bg-zinc-900/50 border-t border-campus-border-light dark:border-campus-border-dark flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-extrabold bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg shadow-soft-sm transition-colors text-center"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3 Grid Live Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SECTION 1: CURRENT CLASS CARD */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm flex flex-col justify-between min-h-[170px] transition-all hover:translate-y-[-2px] hover:shadow-soft-md duration-200 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark tracking-wider uppercase">Current Class</span>
              {currentClass && (
                <div className="flex space-x-1.5 select-none">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    currentClass.type === 'lab'
                      ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                      : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                  }`}>
                    {currentClass.type === 'lab' ? 'LAB' : 'LECTURE'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    currentClass.importance === 'important' 
                      ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' 
                      : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                  }`}>
                    {currentClass.importance === 'important' ? '🔴 IMPORTANT' : '🟢 CAN SKIP'}
                  </span>
                </div>
              )}
            </div>

            {currentClass ? (
              <div className="space-y-1">
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-xl font-bold tracking-tight text-campus-primary-light dark:text-campus-primary-dark">
                    {currentClass.subject}
                  </h3>
                  <span className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark font-medium font-mono">
                    ({activeSlotLabel})
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-campus-secondary-light dark:text-campus-secondary-dark pt-1.5 font-medium select-none">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {currentClass.teacher}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="h-3.5 w-3.5" />
                    {currentClass.room}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 select-none">
                <p className="text-base font-bold text-campus-secondary-light dark:text-campus-secondary-dark">
                  {activeSlotIsLunch ? 'Lunch break' : 'No class right now'}
                </p>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-1">
                  Enjoy your free time.
                </p>
              </div>
            )}
          </div>

          {currentClass && (
            <div className="mt-4 pt-3 border-t border-campus-border-light dark:border-campus-border-dark flex items-center space-x-1.5 text-xs select-none">
              {currentClass.importance === 'important' ? (
                <span className="font-semibold text-red-600 dark:text-red-400">Don't Bunk</span>
              ) : (
                <span className="font-semibold text-green-600 dark:text-green-400">You may skip this lecture.</span>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: NEXT CLASS CARD */}
        <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm flex flex-col justify-between min-h-[170px] transition-all hover:translate-y-[-2px] hover:shadow-soft-md duration-200">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark tracking-wider uppercase">Next Class</span>
              {nextClassSlot && (
                <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  <span className="tabular-nums">{getCountdown(nextClassSlot.startTime, currentDate)}</span>
                </div>
              )}
            </div>

            {nextClass && nextClassSlot ? (
              <div className="space-y-1">
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-xl font-bold tracking-tight text-campus-primary-light dark:text-campus-primary-dark">
                    {nextClass.subject}
                  </h3>
                  <span className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark font-medium font-mono">
                    ({nextClassSlot.startTime})
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-campus-secondary-light dark:text-campus-secondary-dark pt-1.5 font-medium select-none">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {nextClass.teacher}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="h-3.5 w-3.5" />
                    {nextClass.room}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 select-none">
                <p className="text-base font-bold text-campus-secondary-light dark:text-campus-secondary-dark">
                  No more classes today
                </p>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-1">
                  You are all set for the day!
                </p>
              </div>
            )}
          </div>

          {nextClass && nextClassSlot && (
            <div className="mt-4 pt-3 border-t border-campus-border-light dark:border-campus-border-dark text-[11px] text-campus-secondary-light dark:text-campus-secondary-dark flex items-center justify-between select-none">
              <span>Starts at {nextClassSlot.startTime}</span>
              <span className="font-semibold uppercase text-campus-primary-light dark:text-campus-primary-dark">
                {nextClass.type === 'lab' ? 'Lab Module' : 'Lecture'}
              </span>
            </div>
          )}
        </div>

        {/* SECTION 3: TOMORROW'S LAB CARD */}
        <div 
          onClick={handleOpenLabModal}
          className={`bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm flex flex-col justify-between min-h-[170px] transition-all duration-200 ${
            tomorrowLabInfo ? 'cursor-pointer hover:translate-y-[-2px] hover:shadow-soft-md' : 'select-none'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark tracking-wider uppercase">Tomorrow's Lab</span>
              {tomorrowLabInfo && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider select-none ${
                  tomorrowLabInfo.status === 'completed'
                    ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                }`}>
                  {tomorrowLabInfo.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              )}
            </div>

            {tomorrowLabInfo ? (
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight text-campus-primary-light dark:text-campus-primary-dark truncate">
                  {tomorrowLabInfo.labName}
                </h3>
                <div className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-medium select-none">
                    <span className="font-bold text-campus-primary-light dark:text-campus-primary-dark">Record #{tomorrowLabInfo.recordNumber}:</span>
                    <span className="truncate max-w-[140px] italic">{tomorrowLabInfo.topic || 'No topic configured'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {tomorrowLabInfo.startTime}–{tomorrowLabInfo.endTime}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-base font-bold text-campus-secondary-light dark:text-campus-secondary-dark">
                  No lab tomorrow
                </p>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-1">
                  Enjoy a lighter lab schedule.
                </p>
              </div>
            )}
          </div>

          {tomorrowLabInfo && (
            <div className="mt-4 pt-3 border-t border-campus-border-light dark:border-campus-border-dark text-[10px] font-semibold text-campus-secondary-light dark:text-campus-secondary-dark flex items-center justify-between select-none">
              <span>Click to Edit Record Details</span>
              <span className="font-mono">{tomorrowLabInfo.room}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 & 5 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 4: TODAY'S TIMELINE */}
        <div className="lg:col-span-1 bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base text-campus-primary-light dark:text-campus-primary-dark">Today's Timeline</h3>
            <span className="text-[11px] bg-campus-bg-light dark:bg-zinc-800 text-campus-secondary-light dark:text-campus-secondary-dark px-2 py-0.5 rounded font-semibold border border-campus-border-light dark:border-campus-border-dark">
              {todayName || 'Weekend'}
            </span>
          </div>

          {!todayName || todayClassCount === 0 ? (
            <div className="py-12 text-center space-y-3 select-none">
              <span className="text-3xl">☕</span>
              <p className="text-sm font-bold text-campus-primary-light dark:text-campus-primary-dark">
                No classes scheduled today.
              </p>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark max-w-[200px] mx-auto leading-relaxed">
                Timetable tracks classes scheduled Monday to Friday.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 border-l border-campus-border-light dark:border-campus-border-dark space-y-6">
              {TIME_SLOTS.map((slot) => {
                const isLunch = slot.isLunch;
                const cls = timetable[`${todayName}-${slot.id}`];
                
                const startStr = cls?.startTime || slot.startTime;
                const endStr = cls?.endTime || slot.endTime;

                // Determine layout states
                const currentMinutes = getCurrentTimeInMinutes(currentDate);
                const endMins = timeToMinutes(endStr);

                let isCurrent = false;
                if (currentMinutes >= timeToMinutes(startStr) && currentMinutes < endMins) {
                  isCurrent = true;
                }

                const isCompleted = currentMinutes >= endMins;

                return (
                  <div key={slot.id} className="relative group animate-fade-in">
                    {/* Node Dot indicator */}
                    <span className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 transition-all duration-200 ${
                      isCurrent 
                        ? 'bg-blue-600 border-blue-200 dark:border-blue-900/50 scale-125 animate-pulse' 
                        : isCompleted
                        ? 'bg-gray-300 border-white dark:bg-zinc-700 dark:border-campus-card-dark'
                        : 'bg-white border-gray-300 dark:bg-zinc-900 dark:border-zinc-700'
                    }`} />

                    {/* Timeline Item Content */}
                    <div className={`transition-opacity duration-200 ${
                      isCompleted ? 'opacity-40' : 'opacity-100'
                    }`}>
                      <div className="flex items-baseline justify-between">
                        <span className={`text-[10px] font-semibold tracking-wider font-mono ${
                          isCurrent 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-campus-secondary-light dark:text-campus-secondary-dark'
                        }`}>
                          {startStr}–{endStr}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-1.5 py-0.2 rounded-sm animate-pulse">
                            Live
                          </span>
                        )}
                      </div>

                      {isLunch ? (
                        <div className={`mt-1 p-2.5 rounded-lg border border-dashed flex items-center justify-between ${
                          isCurrent 
                            ? 'bg-amber-50/30 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30 text-amber-800 dark:text-amber-300'
                            : 'bg-campus-bg-light dark:bg-zinc-800/30 border-campus-border-light dark:border-campus-border-dark text-campus-secondary-light dark:text-campus-secondary-dark'
                        }`}>
                          <div className="flex items-center space-x-2 text-xs font-semibold select-none">
                            <Coffee className="h-3.5 w-3.5" />
                            <span>Lunch Break</span>
                          </div>
                        </div>
                      ) : cls ? (
                        <div className={`mt-1 p-3 rounded-lg border transition-all duration-200 ${
                          isCurrent
                            ? 'bg-blue-50/20 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30 shadow-soft-sm'
                            : 'bg-campus-bg-light dark:bg-zinc-900/30 border-campus-border-light dark:border-campus-border-dark'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-campus-primary-light dark:text-campus-primary-dark">
                                {cls.subject}
                              </h4>
                              <span className={`px-1.5 py-0.2 text-[8px] rounded font-bold uppercase select-none ${
                                cls.type === 'lab' 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                                  : 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                              }`}>
                                {cls.type === 'lab' ? 'Lab' : 'Lec'}
                              </span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border select-none ${
                              cls.importance === 'important'
                                ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                                : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                            }`}>
                              {cls.importance === 'important' ? 'Important' : 'Skip'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark mt-2 font-medium">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {cls.teacher}
                            </span>
                            <span className="flex items-center gap-1 font-mono font-semibold">
                              <MapPin className="h-3 w-3" />
                              {cls.room}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 p-2 bg-campus-bg-light/40 dark:bg-zinc-900/10 border border-dotted border-campus-border-light dark:border-campus-border-dark rounded-lg text-[11px] text-campus-secondary-light dark:text-campus-secondary-dark flex items-center justify-between select-none">
                          <span>Free Slot</span>
                          <button
                            onClick={() => handleOpenEditModal(todayName, slot)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-campus-border-light dark:hover:bg-zinc-800 rounded transition-opacity"
                            title="Add schedule"
                          >
                            <Plus className="h-3 w-3 text-campus-primary-light dark:text-campus-primary-dark" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 5: WEEKLY TIMETABLE grid */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-campus-primary-light dark:text-campus-primary-dark">Weekly Timetable</h3>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                  Click any cell to edit details. Hover to see slot info. Includes Friday editing.
                </p>
              </div>
              <button 
                onClick={() => onNavigateToTab('settings')}
                className="text-xs bg-campus-bg-light hover:bg-campus-border-light dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold px-3 py-1.5 border border-campus-border-light dark:border-campus-border-dark rounded-lg transition-all"
              >
                Reset / Import
              </button>
            </div>

            {/* Timetable Grid Component */}
            <TimetableGrid onCellClick={handleOpenEditModal} />
          </div>
        </div>

      </div>

      {/* CLASS EDIT DIALOG (MODAL) WITH INLINE ATTENDANCE LOGGING */}
      {isEditModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus shadow-soft-lg w-full max-w-lg overflow-hidden transform scale-100 transition-all duration-300 animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-campus-border-light dark:border-campus-border-dark flex justify-between items-center bg-campus-bg-light dark:bg-zinc-900/50">
              <div>
                <h3 className="font-bold text-sm text-campus-primary-light dark:text-campus-primary-dark">
                  Edit Class Slot
                </h3>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                  {selectedDay} &bull; {selectedSlot.label.replace(' Lunch', '')}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-campus-secondary-light hover:text-campus-primary-light dark:text-campus-secondary-dark dark:hover:text-campus-primary-dark text-lg font-semibold"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClass}>
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-none">
                
                {/* Subject name */}
                <div>
                  <label htmlFor="subject" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                    Subject Name
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="e.g. DSA, DBMS, UI/UX"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-medium"
                  />
                </div>

                {/* Class Type Options (Lecture or Lab) */}
                <div>
                  <span className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-2">
                    Class Type
                  </span>
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="classType"
                        value="lecture"
                        checked={formType === 'lecture'}
                        onChange={() => setFormType('lecture')}
                        className="h-4 w-4 text-black dark:text-white border-campus-border-light dark:border-campus-border-dark focus:ring-0 cursor-pointer accent-black dark:accent-white"
                      />
                      <span className="text-campus-primary-light dark:text-campus-primary-dark flex items-center gap-1.5 font-medium">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                        Lecture
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="classType"
                        value="lab"
                        checked={formType === 'lab'}
                        onChange={() => setFormType('lab')}
                        className="h-4 w-4 text-black dark:text-white border-campus-border-light dark:border-campus-border-dark focus:ring-0 cursor-pointer accent-black dark:accent-white"
                      />
                      <span className="text-campus-primary-light dark:text-campus-primary-dark flex items-center gap-1.5 font-medium">
                        <Layers className="h-3.5 w-3.5 text-amber-500" />
                        Lab Class
                      </span>
                    </label>
                  </div>
                </div>

                {/* Teacher & Room Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="teacher" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                      Teacher
                    </label>
                    <input
                      id="teacher"
                      type="text"
                      placeholder="e.g. Dr. Alan"
                      value={formTeacher}
                      onChange={(e) => setFormTeacher(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark"
                    />
                  </div>
                  <div>
                    <label htmlFor="room" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                      Room Number
                    </label>
                    <input
                      id="room"
                      type="text"
                      placeholder="e.g. CS-101"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-mono"
                    />
                  </div>
                </div>

                {/* Timings overrides */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                      Start Time (24h)
                    </label>
                    <input
                      id="startTime"
                      type="text"
                      required
                      placeholder="e.g. 08:00"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                      End Time (24h)
                    </label>
                    <input
                      id="endTime"
                      type="text"
                      required
                      placeholder="e.g. 09:00"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark font-mono"
                    />
                  </div>
                </div>

                {/* Importance Radio Selection */}
                <div>
                  <span className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-2">
                    Importance
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="importance"
                        value="important"
                        checked={formImportance === 'important'}
                        onChange={() => setFormImportance('important')}
                        className="h-4 w-4 text-black dark:text-white border-campus-border-light dark:border-campus-border-dark focus:ring-0 cursor-pointer accent-black dark:accent-white"
                      />
                      <span className="text-campus-primary-light dark:text-campus-primary-dark flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Important (Cannot Bunk)
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="importance"
                        value="can_skip"
                        checked={formImportance === 'can_skip'}
                        onChange={() => setFormImportance('can_skip')}
                        className="h-4 w-4 text-black dark:text-white border-campus-border-light dark:border-campus-border-dark focus:ring-0 cursor-pointer accent-black dark:accent-white"
                      />
                      <span className="text-campus-primary-light dark:text-campus-primary-dark flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Can Skip
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4.5 bg-campus-bg-light dark:bg-zinc-900/50 border-t border-campus-border-light dark:border-campus-border-dark flex justify-between items-center">
                {/* Delete button */}
                <div>
                  {timetable[`${selectedDay}-${selectedSlot.id}`] ? (
                    <button
                      type="button"
                      onClick={handleDeleteClass}
                      className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Save and Cancel */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold border border-campus-border-light dark:border-campus-border-dark rounded-lg text-campus-secondary-light hover:text-campus-primary-light dark:text-campus-secondary-dark dark:hover:text-campus-primary-dark transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg shadow-soft-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOMORROW LAB EDIT RECORD MODAL */}
      {isLabModalOpen && tomorrowLabInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus shadow-soft-lg w-full max-w-md overflow-hidden transform scale-100 transition-all duration-300 animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-campus-border-light dark:border-campus-border-dark flex justify-between items-center bg-campus-bg-light dark:bg-zinc-900/50">
              <div>
                <h3 className="font-bold text-sm text-campus-primary-light dark:text-campus-primary-dark">
                  Edit Lab Record Details
                </h3>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                  Configure assignment checklist for {labModalTargetName}
                </p>
              </div>
              <button
                onClick={() => setIsLabModalOpen(false)}
                className="text-campus-secondary-light hover:text-campus-primary-light dark:text-campus-secondary-dark dark:hover:text-campus-primary-dark text-lg font-semibold"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveLabRecord}>
              <div className="p-6 space-y-4">
                
                {/* Record Number */}
                <div>
                  <label htmlFor="labRecordNum" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                    Record Number
                  </label>
                  <input
                    id="labRecordNum"
                    type="number"
                    required
                    min={1}
                    value={labFormRecordNum}
                    onChange={(e) => setLabFormRecordNum(parseInt(e.target.value) || 1)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label htmlFor="labTopic" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                    Topic / Assignment Title
                  </label>
                  <input
                    id="labTopic"
                    type="text"
                    required
                    placeholder="e.g. Relational Calculus & Keys"
                    value={labFormTopic}
                    onChange={(e) => setLabFormTopic(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark"
                  />
                </div>

                {/* Status Toggle */}
                <div>
                  <span className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-2">
                    Checklist Status
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="labStatus"
                        value="pending"
                        checked={labFormStatus === 'pending'}
                        onChange={() => setLabFormStatus('pending')}
                        className="h-4 w-4 text-black dark:text-white border-campus-border-light dark:border-campus-border-dark focus:ring-0 cursor-pointer accent-black dark:accent-white"
                      />
                      <span className="text-campus-primary-light dark:text-campus-primary-dark font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        Pending
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="labStatus"
                        value="completed"
                        checked={labFormStatus === 'completed'}
                        onChange={() => setLabFormStatus('completed')}
                        className="h-4 w-4 text-black dark:text-white border-campus-border-light dark:border-campus-border-dark focus:ring-0 cursor-pointer accent-black dark:accent-white"
                      />
                      <span className="text-campus-primary-light dark:text-campus-primary-dark font-medium flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Completed
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="labNotes" className="block text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-1.5">
                    Record Notes / Rules
                  </label>
                  <textarea
                    id="labNotes"
                    placeholder="Enter submission notes..."
                    rows={3}
                    value={labFormNotes}
                    onChange={(e) => setLabFormNotes(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-campus-primary-light dark:text-campus-primary-dark resize-none font-normal"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-campus-bg-light dark:bg-zinc-900/50 border-t border-campus-border-light dark:border-campus-border-dark flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLabModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-campus-border-light dark:border-campus-border-dark rounded-lg text-campus-secondary-light hover:text-campus-primary-light dark:text-campus-secondary-dark dark:hover:text-campus-primary-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg shadow-soft-sm transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
