import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  FlaskConical, 
  Download, 
  Search, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  AlertCircle, 
  Activity, 
  Layers, 
  Eye,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import type { AdminDashboardStats, UserProfile, TimetableData, AuditLogItem, TimetableTemplateItem } from '../types';
import { ReadOnlyStudentViewModal } from './ReadOnlyStudentViewModal';
import { adminService } from '../services/adminService';
import { getApiBaseUrl } from '../utils/api';
import { TIME_SLOTS, getDayName } from '../utils/timeUtils';

export const AdminView: React.FC = () => {
  const { token } = useSchedule();
  const [activeTab, setActiveTab] = useState<'analytics' | 'directory' | 'idealab' | 'reports' | 'templates' | 'audit'>('analytics');

  // Stats state
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  // Student directory state
  const [searchQuery, setSearchQuery] = useState('');
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<{
    student: UserProfile;
    timetable: TimetableData;
    labs: Record<string, any>;
    attendance: Record<string, any>;
  } | null>(null);

  // Idea Lab Attendance Module state
  const [ideaLabSearchFilter, setIdeaLabSearchFilter] = useState('');
  const [selectedStudentRegs, setSelectedStudentRegs] = useState<string[]>([]);
  const [expandedStudentReg, setExpandedStudentReg] = useState<string | null>(null);
  const [expandedStudentData, setExpandedStudentData] = useState<{
    student: UserProfile;
    timetable: TimetableData;
    markedSlots: string[];
  } | null>(null);
  const [fetchingExpanded, setFetchingExpanded] = useState(false);

  // Batch Attendance Modal (Step 2)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchSlot, setBatchSlot] = useState('08:00 - 09:00');
  const [batchReason, setBatchReason] = useState('Idea Lab Work');
  const [markingBatch, setMarkingBatch] = useState(false);

  // Single student action status
  const [ideaLabStatusMsg, setIdeaLabStatusMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Report export state
  const [exportRange, setExportRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Templates state
  const [templates, setTemplates] = useState<TimetableTemplateItem[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateBranch, setTemplateBranch] = useState('');
  const [templateSection, setTemplateSection] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Format slot key ("Monday-1") to human readable time range ("08:00 - 09:00")
  const formatSlotLabel = (slotKey: string) => {
    const parts = slotKey.split('-');
    const slotId = parts[1] || slotKey;
    const slotObj = TIME_SLOTS.find(s => s.id === slotId);
    return slotObj ? `${slotObj.startTime} - ${slotObj.endTime}` : `Slot ${slotId}`;
  };

  const todayDayName = getDayName(new Date()) || 'Monday';
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  // Fetch admin stats
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching admin stats:', e);
    }
  };

  // Fetch student directory
  const fetchStudents = async (query = '') => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/students?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data);
      }
    } catch (e) {
      console.error('Error fetching students:', e);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (e) {
      console.error('Error fetching templates:', e);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchTemplates();
    fetchAuditLogs();
  }, [token]);

  // View student full detail
  const handleViewStudent = async (studentId: string) => {
    const idToFetch = studentId;
    if (!idToFetch) return;

    try {
      if (token && token !== 'mock_admin_jwt_token') {
        const res = await fetch(`${getApiBaseUrl()}/admin/students/${encodeURIComponent(idToFetch)}/details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedStudentDetail(data);
          return;
        }
      }
    } catch (e) {
      console.error('Error fetching student detail from API:', e);
    }

    // Fallback student details view
    setSelectedStudentDetail({
      student: {
        id: studentId,
        fullName: 'Student',
        regNumber: studentId,
        role: 'student',
        section: 'A',
        batch: '1',
        branch: 'CSE'
      },
      timetable: {},
      labs: {},
      attendance: {}
    });
  };

  // Expand student dropdown arrow in Attendance tab
  const handleToggleExpandStudent = async (regNumber: string) => {
    if (!regNumber) return;

    if (expandedStudentReg === regNumber) {
      setExpandedStudentReg(null);
      setExpandedStudentData(null);
      return;
    }

    setExpandedStudentReg(regNumber);
    setExpandedStudentData(null);
    setFetchingExpanded(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/idealab/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ regNumber, query: regNumber })
      });
      if (res.ok) {
        const data = await res.json();
        setExpandedStudentData(data);
      }
    } catch (e) {
      console.error('Error fetching expanded student schedule:', e);
    } finally {
      setFetchingExpanded(false);
    }
  };

  // Mark single attendance in expanded row
  const handleMarkSingle = async (student: UserProfile, subjectMissed: string, teacher: string, room: string, slotKey: string, timeLabel: string) => {
    if (!token) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/idealab/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName: student.fullName,
          regNumber: student.regNumber,
          department: student.branch || 'N/A',
          section: student.section || 'N/A',
          batch: student.batch || 'N/A',
          subjectMissed,
          teacher,
          room,
          slot: timeLabel,
          lectureTime: timeLabel,
          reason: 'Idea Lab Work'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIdeaLabStatusMsg(data.message);
        if (expandedStudentData) {
          setExpandedStudentData(prev => prev ? ({
            ...prev,
            markedSlots: Array.from(new Set([...(prev.markedSlots || []), slotKey, timeLabel]))
          }) : null);
        }
        fetchStats();
      } else {
        setIdeaLabStatusMsg(data.message || 'Error marking attendance.');
      }
    } catch (e) {
      setIdeaLabStatusMsg('Error recording attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel single attendance in expanded row
  const handleCancelSingle = async (regNumber: string, subjectMissed: string, slotKey: string, timeLabel: string) => {
    if (!token) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/idealab/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          regNumber,
          slot: timeLabel,
          subject: subjectMissed,
          lectureTime: timeLabel
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIdeaLabStatusMsg(data.message);
        if (expandedStudentData) {
          setExpandedStudentData(prev => prev ? ({
            ...prev,
            markedSlots: (prev.markedSlots || []).filter(s => s !== slotKey && s !== timeLabel)
          }) : null);
        }
        fetchStats();
      } else {
        setIdeaLabStatusMsg(data.message || 'Error cancelling attendance.');
      }
    } catch (e) {
      setIdeaLabStatusMsg('Error cancelling attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle student selection checkbox
  const handleToggleSelectStudent = (regNumber: string) => {
    setSelectedStudentRegs(prev => 
      prev.includes(regNumber) ? prev.filter(r => r !== regNumber) : [...prev, regNumber]
    );
  };

  // Select all / deselect all
  const handleToggleSelectAll = (filteredStudents: UserProfile[]) => {
    const allRegs = filteredStudents.map(s => s.regNumber);
    if (selectedStudentRegs.length === allRegs.length && allRegs.length > 0) {
      setSelectedStudentRegs([]);
    } else {
      setSelectedStudentRegs(allRegs);
    }
  };

  // Execute batch attendance marking (Step 2 Submit)
  const handleExecuteBatchAttendance = async () => {
    if (!token || selectedStudentRegs.length === 0) return;
    setMarkingBatch(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/idealab/batch-mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          regNumbers: selectedStudentRegs,
          slot: batchSlot,
          reason: batchReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIdeaLabStatusMsg(data.message);
        setIsBatchModalOpen(false);
        setSelectedStudentRegs([]);
        fetchStats();
      } else {
        setIdeaLabStatusMsg(data.message || 'Error executing batch attendance.');
      }
    } catch (e) {
      setIdeaLabStatusMsg('Error submitting batch attendance.');
    } finally {
      setMarkingBatch(false);
    }
  };

  // Download Excel Report (.xlsx)
  const handleDownloadExcel = async () => {
    try {
      await adminService.exportExcelReport();
    } catch (err) {
      console.error('Error downloading Excel report:', err);
    }
  };

  const navTabs: { id: 'analytics' | 'directory' | 'idealab' | 'reports' | 'templates' | 'audit'; name: string; icon: any }[] = [
    { id: 'analytics', name: 'Dashboard Analytics', icon: Activity },
    { id: 'directory', name: 'Student Directory', icon: Users },
    { id: 'idealab', name: 'Idea Lab Attendance', icon: FlaskConical },
    { id: 'reports', name: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'templates', name: 'Timetable Templates', icon: Layers },
    { id: 'audit', name: 'Audit Logs', icon: ShieldCheck },
  ];

  const filteredAttendanceStudents = studentsList.filter(st => {
    const filter = ideaLabSearchFilter.trim().toLowerCase();
    if (!filter) return true;
    const name = (st.fullName || '').toLowerCase();
    const reg = (st.regNumber || (st as any).registrationNumber || '').toLowerCase();
    return name.includes(filter) || reg.includes(filter);
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight">Admin Management Dashboard</h2>
          </div>
          <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-1">
            Complete overview of students, timetables, Idea Lab attendance logs, and system audit records.
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-soft-sm'
                    : 'bg-campus-bg-light dark:bg-campus-bg-dark/60 text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-light dark:hover:text-campus-primary-dark'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. DASHBOARD ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-5 rounded-campus shadow-soft-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider block">Total Students</span>
                <span className="text-2xl font-black font-mono tracking-tight mt-1 block">{stats?.totalStudents ?? 0}</span>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-5 rounded-campus shadow-soft-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider block">Today Active</span>
                <span className="text-2xl font-black font-mono tracking-tight mt-1 block">{stats?.todayActiveStudents ?? 0}</span>
              </div>
              <div className="h-10 w-10 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-5 rounded-campus shadow-soft-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider block">Schedules Created</span>
                <span className="text-2xl font-black font-mono tracking-tight mt-1 block">{stats?.schedulesCreated ?? 0}</span>
              </div>
              <div className="h-10 w-10 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-bold">
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-5 rounded-campus shadow-soft-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider block">Idea Lab Today</span>
                <span className="text-2xl font-black font-mono tracking-tight mt-1 block">{stats?.todayIdeaLabCount ?? 0}</span>
              </div>
              <div className="h-10 w-10 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center font-bold">
                <FlaskConical className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Breakdown grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Missed Subjects Card */}
            <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-orange-500" />
                Most Missed Subjects (Idea Lab Skips)
              </h3>
              {!stats?.mostMissedSubjects || stats.mostMissedSubjects.length === 0 ? (
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark py-4 text-center">
                  No Idea Lab skips recorded yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {stats.mostMissedSubjects.map((item, idx) => (
                    <div key={item.subject ? `missed-${item.subject}-${idx}` : `missed-${idx}`} className="flex items-center justify-between p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark">
                      <span className="text-xs font-bold">{item.subject}</span>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                        {item.count} skips
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Active Students */}
            <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Recently Active Students
              </h3>
              {!stats?.mostActiveStudents || stats.mostActiveStudents.length === 0 ? (
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark py-4 text-center">
                  No active student logs.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {stats.mostActiveStudents.map((st, idx) => (
                    <div key={st.regNumber ? `active-${st.regNumber}-${idx}` : `active-${idx}`} className="flex items-center justify-between p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark">
                      <div>
                        <p className="text-xs font-bold">{st.fullName}</p>
                        <p className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark font-mono font-medium">
                          {st.regNumber} {st.section ? `• ${st.section}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-mono font-semibold">
                        {new Date(st.lastActive).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENT DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Search bar */}
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-4 rounded-campus shadow-soft-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchStudents(e.target.value);
                }}
                placeholder="Search by Registration Number or Student Name..."
                className="w-full pl-9 pr-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
              />
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsList.map((st, idx) => (
              <div key={st.id || (st as any)._id || st.regNumber || `student-${idx}`} className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-4 rounded-campus shadow-soft-sm flex items-center justify-between gap-3 hover:border-black/30 dark:hover:border-white/30 transition">
                <div>
                  <h4 className="text-xs font-bold">{st.fullName}</h4>
                  <p className="text-[11px] font-mono text-campus-secondary-light dark:text-campus-secondary-dark font-medium mt-0.5">
                    {st.regNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark font-semibold">
                    <span>Sec: {st.section || 'N/A'}</span>
                    <span>•</span>
                    <span>Branch: {st.branch || 'N/A'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewStudent(st.id || (st as any)._id || st.regNumber)}
                  className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-lg hover:opacity-90 transition flex items-center gap-1 shrink-0 shadow-soft-sm"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
              </div>
            ))}
          </div>

          {/* Student Profile & View-Only Timetable Modal */}
          {selectedStudentDetail && (
            <ReadOnlyStudentViewModal
              studentDetail={selectedStudentDetail}
              onClose={() => setSelectedStudentDetail(null)}
            />
          )}
        </div>
      )}

      {/* 3. IDEA LAB ATTENDANCE MODULE */}
      {activeTab === 'idealab' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-campus-border-light dark:border-campus-border-dark">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-orange-500" />
                  Idea Lab Lecture Skip Attendance Logger
                </h3>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                  Mark single attendance via dropdown arrow or select multiple student checkboxes for batch marking ({todayDateStr}).
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-max">
                {todayDayName}
              </span>
            </div>

            {/* Status Message Alert */}
            {ideaLabStatusMsg && (
              <div className="p-3 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>{ideaLabStatusMsg}</span>
                </div>
                <button onClick={() => setIdeaLabStatusMsg('')} className="text-campus-secondary-light hover:text-black dark:hover:text-white text-xs">✕</button>
              </div>
            )}

            {/* Filter Search Bar & Select All Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
                <input
                  type="text"
                  value={ideaLabSearchFilter}
                  onChange={(e) => {
                    setIdeaLabSearchFilter(e.target.value);
                    fetchStudents(e.target.value);
                  }}
                  placeholder="Filter student list by Name or Registration Number (e.g. Piyush or PCEA25CS123)..."
                  className="w-full pl-9 pr-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleToggleSelectAll(filteredAttendanceStudents)}
                className="flex items-center gap-1.5 px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
              >
                {selectedStudentRegs.length > 0 && selectedStudentRegs.length === filteredAttendanceStudents.length ? (
                  <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Square className="h-4 w-4 text-campus-secondary-light" />
                )}
                <span>Select All ({filteredAttendanceStudents.length})</span>
              </button>
            </div>

            {/* Attendance Student List Table / Cards */}
            <div className="space-y-2.5">
              {filteredAttendanceStudents.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-campus-border-light dark:border-campus-border-dark rounded-xl">
                  <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark">No students found matching "{ideaLabSearchFilter}".</p>
                </div>
              ) : (
                filteredAttendanceStudents.map((st, idx) => {
                  const regNum = st.regNumber || (st as any).registrationNumber || st.fullName || `st-${idx}`;
                  const isChecked = selectedStudentRegs.includes(regNum);
                  const isExpanded = expandedStudentReg === regNum;

                  return (
                    <div 
                      key={regNum}
                      className={`border rounded-xl transition-all ${
                        isChecked 
                          ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' 
                          : 'border-campus-border-light dark:border-campus-border-dark bg-white dark:bg-campus-card-dark'
                      }`}
                    >
                      {/* Student Header Bar */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectStudent(regNum)}
                            className="p-1 hover:opacity-80 transition"
                          >
                            {isChecked ? (
                              <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="h-5 w-5 text-campus-secondary-light dark:text-campus-secondary-dark" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold">{st.fullName}</h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                                {regNum}
                              </span>
                            </div>
                            <p className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark font-medium mt-0.5">
                              Branch: {st.branch || 'CSE'} • Sec: {st.section || 'A'} • Batch: {st.batch || '1'}
                            </p>
                          </div>
                        </div>

                        {/* Dropdown Arrow Toggle Button */}
                        <button
                          onClick={() => handleToggleExpandStudent(regNum)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
                        >
                          <span>{isExpanded ? 'Hide Classes' : 'View Schedule'}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Expandable Accordion (Today's Classes & Mark/Cancel Toggle) */}
                      {isExpanded && (
                        <div className="p-4 border-t border-campus-border-light dark:border-campus-border-dark bg-campus-bg-light/50 dark:bg-campus-bg-dark/50 rounded-b-xl space-y-3 animate-fadeIn">
                          {fetchingExpanded ? (
                            <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark py-2">Loading schedule...</p>
                          ) : expandedStudentData ? (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-[11px] font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider">
                                  Today's Scheduled Classes ({todayDateStr})
                                </h5>
                              </div>

                              {(() => {
                                const todayClasses = Object.entries(expandedStudentData.timetable || {}).filter(([key]) => {
                                  const [day] = key.split('-');
                                  return day && day.toLowerCase() === todayDayName.toLowerCase();
                                });

                                const displayClasses = todayClasses.length > 0 ? todayClasses : Object.entries(expandedStudentData.timetable || {});

                                if (displayClasses.length > 0) {
                                  return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {displayClasses.map(([key, cls]: [string, any]) => {
                                        const timeLabel = formatSlotLabel(key);
                                        const isMarked = (expandedStudentData.markedSlots || []).includes(key) || (expandedStudentData.markedSlots || []).includes(timeLabel);

                                        return (
                                          <div key={key} className="p-3 bg-white dark:bg-campus-card-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark space-y-2 shadow-soft-sm">
                                            <div>
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono font-bold text-campus-secondary-light dark:text-campus-secondary-dark uppercase block">
                                                  {timeLabel}
                                                </span>
                                                <span className="text-[9px] font-bold text-campus-secondary-light dark:text-campus-secondary-dark uppercase">
                                                  {key.split('-')[0]}
                                                </span>
                                              </div>
                                              <p className="text-xs font-bold truncate mt-1">{cls.subject || 'General Class'}</p>
                                              <p className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark">
                                                Teacher: {cls.teacher || 'N/A'} • Room {cls.room || 'N/A'}
                                              </p>
                                            </div>

                                            {isMarked ? (
                                              <button
                                                onClick={() => handleCancelSingle(st.regNumber, cls.subject || 'Idea Lab Work', key, timeLabel)}
                                                disabled={actionLoading}
                                                className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-soft-sm transition disabled:opacity-50 flex items-center justify-center gap-1"
                                              >
                                                <XCircle className="h-3.5 w-3.5" />
                                                Cancel Attendance
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => handleMarkSingle(st, cls.subject || 'Idea Lab Work', cls.teacher || 'Instructor', cls.room || 'Idea Lab', key, timeLabel)}
                                                disabled={actionLoading}
                                                className="w-full py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold text-[11px] rounded-lg shadow-soft-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                              >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Mark Present
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }

                                // Fallback: Render Standard Today Time Slots if student has no custom timetable
                                return (
                                  <div className="space-y-2">
                                    <p className="text-[11px] text-campus-secondary-light dark:text-campus-secondary-dark">
                                      No custom timetable configured. Select any time slot below to mark Idea Lab attendance:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {TIME_SLOTS.filter(s => !s.isLunch).map((slot) => {
                                        const timeLabel = `${slot.startTime} - ${slot.endTime}`;
                                        const isMarked = (expandedStudentData.markedSlots || []).includes(timeLabel) || (expandedStudentData.markedSlots || []).includes(slot.id);

                                        return (
                                          <div key={slot.id} className="p-3 bg-white dark:bg-campus-card-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark space-y-2 shadow-soft-sm">
                                            <div>
                                              <span className="text-[10px] font-mono font-bold text-campus-secondary-light dark:text-campus-secondary-dark uppercase block">
                                                {timeLabel}
                                              </span>
                                              <p className="text-xs font-bold truncate mt-1">Idea Lab Work</p>
                                            </div>

                                            {isMarked ? (
                                              <button
                                                onClick={() => handleCancelSingle(st.regNumber, 'Idea Lab Work', slot.id, timeLabel)}
                                                disabled={actionLoading}
                                                className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-soft-sm transition disabled:opacity-50 flex items-center justify-center gap-1"
                                              >
                                                <XCircle className="h-3.5 w-3.5" />
                                                Cancel Attendance
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => handleMarkSingle(st, 'Idea Lab Work', 'Instructor', 'Idea Lab', slot.id, timeLabel)}
                                                disabled={actionLoading}
                                                className="w-full py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold text-[11px] rounded-lg shadow-soft-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                              >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Mark Present
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark">Unable to load schedule.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sticky Bottom Action Bar when Students are Selected */}
          {selectedStudentRegs.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/20 animate-slideUp">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-400 dark:text-blue-600" />
                <span className="text-xs font-extrabold whitespace-nowrap">
                  {selectedStudentRegs.length} Student{selectedStudentRegs.length > 1 ? 's' : ''} Selected
                </span>
              </div>

              <div className="h-4 w-px bg-white/30 dark:bg-black/30" />

              <button
                onClick={() => setSelectedStudentRegs([])}
                className="text-xs text-white/70 dark:text-black/70 hover:text-white dark:hover:text-black font-semibold transition"
              >
                Clear
              </button>

              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition flex items-center gap-1.5 shadow-soft-sm"
              >
                <span>Next: Select Time Slot</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Step 2 Batch Attendance Modal */}
          {isBatchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-lg bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus p-6 space-y-5 shadow-2xl">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    Batch Mark Idea Lab Attendance
                  </h3>
                  <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                    Marking attendance for {selectedStudentRegs.length} selected student(s) on {todayDateStr}.
                  </p>
                </div>

                {/* Selected Students Preview */}
                <div className="p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-campus-secondary-light dark:text-campus-secondary-dark block mb-1">
                    Selected Students ({selectedStudentRegs.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {selectedStudentRegs.map(reg => (
                      <span key={reg} className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded">
                        {reg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Slot & Details Selection */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider">
                      Select Time Slot *
                    </label>
                    <select
                      value={batchSlot}
                      onChange={(e) => setBatchSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot.id} value={`${slot.startTime} - ${slot.endTime}`}>
                          {slot.startTime} - {slot.endTime} {slot.isLunch ? '(Lunch Break)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider">
                      Attendance Reason
                    </label>
                    <input
                      type="text"
                      value={batchReason}
                      onChange={(e) => setBatchReason(e.target.value)}
                      placeholder="e.g. Idea Lab Work, Hackathon Prep"
                      className="w-full px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-campus-border-light dark:border-campus-border-dark">
                  <button
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold border border-campus-border-light dark:border-campus-border-dark rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleExecuteBatchAttendance}
                    disabled={markingBatch}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-soft-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{markingBatch ? 'Marking...' : `Mark Attendance for ${selectedStudentRegs.length} Student(s)`}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. REPORTS & EXCEL EXPORT TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
                Download Idea Lab Attendance Excel Report (.xlsx)
              </h3>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-1">
                Filter and export comprehensive student lecture skip records automatically into formatted Excel spreadsheets.
              </p>
            </div>

            {/* Filter selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-campus-secondary-light dark:text-campus-secondary-dark">
                Select Report Filter
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'today', label: "Today's Attendance" },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'custom', label: 'Custom Date Range' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setExportRange(f.id as any)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      exportRange === f.id
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-soft-sm'
                        : 'bg-campus-bg-light dark:bg-campus-bg-dark border-campus-border-light dark:border-campus-border-dark text-campus-secondary-light dark:text-campus-secondary-dark'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {exportRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleDownloadExcel}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow-soft-sm transition flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Excel Report (.xlsx)
            </button>
          </div>
        </div>
      )}

      {/* 5. TIMETABLE TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  Admin Timetable Templates
                </h3>
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                  Create master timetable templates for sections or branches.
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-3.5 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-lg shadow-soft-sm hover:opacity-90 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.length === 0 ? (
                <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark col-span-2 py-4 text-center">
                  No master timetable templates created yet.
                </p>
              ) : (
                templates.map((tmpl, idx) => (
                  <div key={tmpl._id || `tmpl-${idx}`} className="p-4 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark space-y-2">
                    <h4 className="text-xs font-bold">{tmpl.title}</h4>
                    <p className="text-[11px] text-campus-secondary-light dark:text-campus-secondary-dark font-mono">
                      Branch: {tmpl.branch || 'All'} • Section: {tmpl.section || 'All'}
                    </p>
                    <p className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark">
                      Created by {tmpl.createdBy}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Template Modal */}
          {isTemplateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus p-6 space-y-4 shadow-2xl">
                <h3 className="text-sm font-bold">New Master Timetable Template</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Template Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE 3rd Year Master Schedule"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Branch</label>
                      <input
                        type="text"
                        placeholder="CSE"
                        value={templateBranch}
                        onChange={(e) => setTemplateBranch(e.target.value)}
                        className="w-full px-3 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Section</label>
                      <input
                        type="text"
                        placeholder="III-B"
                        value={templateSection}
                        onChange={(e) => setTemplateSection(e.target.value)}
                        className="w-full px-3 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsTemplateModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs border border-campus-border-light dark:border-campus-border-dark rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!templateTitle) return;
                      try {
                        const res = await fetch(`${getApiBaseUrl()}/admin/templates`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            title: templateTitle,
                            branch: templateBranch,
                            section: templateSection,
                            timetableData: {}
                          })
                        });
                        if (res.ok) {
                          setIsTemplateModalOpen(false);
                          setTemplateTitle('');
                          setTemplateBranch('');
                          setTemplateSection('');
                          fetchTemplates();
                        }
                      } catch (e) {
                        console.error('Error saving template:', e);
                      }
                    }}
                    className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-lg"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-6 rounded-campus shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              System Activity & Audit Logs
            </h3>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {auditLogs.map((log, idx) => (
                <div key={log._id || `log-${idx}`} className="p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold font-mono text-[10px] px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded mr-2 uppercase">
                      {log.action}
                    </span>
                    <span className="font-medium">{log.details}</span>
                  </div>
                  <span className="text-[10px] font-mono text-campus-secondary-light dark:text-campus-secondary-dark">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
