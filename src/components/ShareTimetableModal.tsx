import React, { useState } from 'react';
import { Share2, Search, UserCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

interface ShareTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareTimetableModal: React.FC<ShareTimetableModalProps> = ({ isOpen, onClose }) => {
  const { shareSearch, shareSend } = useSchedule();

  const [regInput, setRegInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [targetStudent, setTargetStudent] = useState<{
    fullName: string;
    regNumber: string;
    section?: string;
    batch?: string;
    branch?: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setTargetStudent(null);

    if (!regInput.trim()) {
      setErrorMsg('Please enter a Registration Number.');
      return;
    }

    setSearching(true);
    const res = await shareSearch(regInput.trim());
    setSearching(false);

    if (res.success && res.data) {
      setTargetStudent(res.data);
    } else {
      setErrorMsg(res.message || 'Student with this Registration Number does not exist.');
    }
  };

  const handleAddShare = async () => {
    if (!targetStudent) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSending(true);

    const res = await shareSend(targetStudent.regNumber);
    setSending(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
        setTargetStudent(null);
        setRegInput('');
        setSuccessMsg('');
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus shadow-2xl overflow-hidden text-campus-primary-light dark:text-campus-primary-dark transition-all">
        {/* Header */}
        <div className="p-5 bg-campus-bg-light dark:bg-campus-bg-dark/40 border-b border-campus-border-light dark:border-campus-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shadow-soft-sm">
              <Share2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Share Timetable</h3>
              <p className="text-[11px] text-campus-secondary-light dark:text-campus-secondary-dark">
                Share by Registration Number
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-light dark:hover:text-campus-primary-dark hover:bg-campus-bg-light dark:hover:bg-campus-bg-dark transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                Friend's Registration Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regInput}
                  onChange={(e) => setRegInput(e.target.value)}
                  placeholder="e.g. PCEA25CS123"
                  className="flex-1 px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition uppercase"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-soft-sm"
                >
                  {searching ? (
                    <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {targetStudent && (
            <div className="p-4 bg-campus-bg-light dark:bg-campus-bg-dark/60 border border-campus-border-light dark:border-campus-border-dark rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-sm">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold">{targetStudent.fullName}</h4>
                    <p className="text-[11px] font-mono text-campus-secondary-light dark:text-campus-secondary-dark font-medium">
                      {targetStudent.regNumber} {targetStudent.section ? `• ${targetStudent.section}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddShare}
                  disabled={sending}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-lg hover:opacity-90 transition shadow-soft-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sending ? (
                    <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark">
                Clicking Add will send a copy of your schedule to {targetStudent.fullName}. They can import it into their account independently.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
