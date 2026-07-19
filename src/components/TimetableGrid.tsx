import React from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { DAYS, TIME_SLOTS } from '../utils/timeUtils';
import type { DayOfWeek, TimeSlot } from '../types';
import { MapPin, User, Plus } from 'lucide-react';

interface TimetableGridProps {
  onCellClick: (day: DayOfWeek, slot: TimeSlot) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({ onCellClick }) => {
  const { data } = useSchedule();
  const timetable = data.timetable;

  return (
    <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
      <table className="w-full border-collapse text-left min-w-[650px] xl:min-w-0">
        <thead>
          <tr className="border-b border-campus-border-light dark:border-campus-border-dark">
            <th className="py-3 pr-4 text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider w-[120px]">
              Time Slot
            </th>
            {DAYS.map((day) => (
              <th key={day} className="py-3 px-4 text-xs font-bold text-campus-primary-light dark:text-campus-primary-dark uppercase tracking-wider w-[18%]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-campus-border-light dark:divide-campus-border-dark">
          {TIME_SLOTS.map((slot) => {
            if (slot.isLunch) {
              return (
                <tr key={slot.id} className="bg-campus-bg-light/50 dark:bg-zinc-900/20">
                  <td className="py-3 pr-4 text-xs font-mono font-bold text-campus-secondary-light dark:text-campus-secondary-dark select-none">
                    {slot.label.split(' ')[0]}
                  </td>
                  <td colSpan={5} className="py-3 px-4 text-center">
                    <span className="text-xs font-bold tracking-wider text-campus-secondary-light dark:text-campus-secondary-dark uppercase flex items-center justify-center gap-1.5 py-0.5 select-none">
                      ☕ Lunch Break ({slot.startTime} - {slot.endTime})
                    </span>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={slot.id} className="hover:bg-campus-bg-light/30 dark:hover:bg-zinc-900/10 transition-colors">
                <td className="py-4.5 pr-4 text-xs font-mono font-semibold text-campus-secondary-light dark:text-campus-secondary-dark select-none">
                  {slot.label}
                </td>
                {DAYS.map((day) => {
                  const key = `${day}-${slot.id}`;
                  const cls = timetable[key];

                  return (
                    <td 
                      key={day} 
                      onClick={() => onCellClick(day, slot)}
                      className="py-2.5 px-3 relative align-top cursor-pointer group"
                    >
                      {cls ? (
                        <div className={`h-full p-2.5 rounded-lg border transition-all duration-200 flex flex-col justify-between min-h-[76px] hover:shadow-soft-sm ${
                          cls.importance === 'important'
                            ? 'bg-red-50/40 hover:bg-red-50/60 border-red-100 text-red-950 dark:bg-red-950/10 dark:hover:bg-red-950/15 dark:border-red-950/30 dark:text-red-300'
                            : 'bg-green-50/40 hover:bg-green-50/60 border-green-100 text-green-950 dark:bg-green-950/10 dark:hover:bg-green-950/15 dark:border-green-950/30 dark:text-green-300'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold truncate leading-snug">
                                {cls.subject}
                              </span>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span className={`text-[7px] font-extrabold uppercase px-1 rounded-sm select-none ${
                                  cls.type === 'lab' 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                                }`}>
                                  {cls.type === 'lab' ? 'Lab' : 'Lec'}
                                </span>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  cls.importance === 'important' ? 'bg-red-500' : 'bg-green-500'
                                }`} />
                              </div>
                            </div>
                            {cls.startTime && cls.endTime && (cls.startTime !== slot.startTime || cls.endTime !== slot.endTime) && (
                              <span className="text-[8px] font-mono bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded text-campus-secondary-light dark:text-campus-secondary-dark block mt-1 w-max font-medium select-none">
                                {cls.startTime}–{cls.endTime}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2.5 space-y-0.5">
                            <span className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{cls.teacher}</span>
                            </span>
                            <span className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark flex items-center gap-1 font-mono font-medium">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{cls.room}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full border border-dashed border-campus-border-light hover:border-campus-primary-light/40 dark:border-campus-border-dark dark:hover:border-campus-primary-dark/30 rounded-lg min-h-[76px] flex items-center justify-center transition-all duration-150 bg-transparent hover:bg-white dark:hover:bg-zinc-900/50">
                          <Plus className="h-4 w-4 text-gray-300 dark:text-zinc-700 group-hover:text-campus-secondary-light dark:group-hover:text-campus-secondary-dark transition-colors" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
