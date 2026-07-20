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
  AlertCircle, 
  Activity, 
  Layers, 
  Eye,
  Plus
} from 'lucide-react';
import type { AdminDashboardStats, UserProfile, TimetableData, AuditLogItem, TimetableTemplateItem } from '../types';
import { ReadOnlyStudentViewModal } from './ReadOnlyStudentViewModal';

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

  // Idea Lab state
  const [ideaLabRegInput, setIdeaLabRegInput] = useState('');
  const [searchingIdeaLab, setSearchingIdeaLab] = useState(false);
  const [ideaLabSearchResult, setIdeaLabSearchResult] = useState<{
    student: UserProfile;
    timetable: TimetableData;
  } | null>(null);
  const [ideaLabReason, setIdeaLabReason] = useState('Idea Lab Work');
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [ideaLabStatusMsg, setIdeaLabStatusMsg] = useState('');

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

  // Fetch admin stats
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
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
      const res = await fetch(`http://localhost:5000/api/admin/students?query=${encodeURIComponent(query)}`, {
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
      const res = await fetch('http://localhost:5000/api/admin/templates', {
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
      const res = await fetch('http://localhost:5000/api/admin/audit-logs', {
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
    const idToFetch = studentId || 'PCEA25CS123';
    try {
      if (token && token !== 'mock_admin_jwt_token') {
        const res = await fetch(`http://localhost:5000/api/admin/students/${encodeURIComponent(idToFetch)}/details`, {
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
        id: 'student_id_001',
        fullName: 'Piyush',
        regNumber: 'PCEA25CS123',
        role: 'student',
        section: 'B',
        batch: '2',
        branch: 'CSE'
      },
      timetable: {
        'Monday-1': { subject: 'DSA', teacher: 'Dr. Alan', room: 'CS-101', importance: 'important', type: 'lecture' },
        'Monday-2': { subject: 'DBMS', teacher: 'Dr. Grace', room: 'CS-202', importance: 'can_skip', type: 'lecture' },
        'Tuesday-1': { subject: 'UI/UX Lab', teacher: 'Prof. Dieter', room: 'Design-Lab', importance: 'can_skip', type: 'lab' },
        'Wednesday-3': { subject: 'DE', teacher: 'Dr. Claude', room: 'EC-304', importance: 'important', type: 'lecture' },
        'Thursday-2': { subject: 'DBMS Lab', teacher: 'Dr. Grace', room: 'CS-205', importance: 'can_skip', type: 'lab' },
        'Friday-1': { subject: 'DBMS', teacher: 'Dr. Grace', room: 'CS-202', importance: 'can_skip', type: 'lecture' }
      },
      labs: {
        'UI/UX Lab': { status: 'completed', lastUpdated: new Date().toISOString() },
        'DBMS Lab': { status: 'pending', lastUpdated: new Date().toISOString() }
      },
      attendance: {
        'DSA': { present: 14, absent: 2 },
        'DBMS': { present: 10, absent: 4 },
        'DE': { present: 12, absent: 1 }
      }
    });
  };

  // Search student for Idea Lab
  const handleIdeaLabSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdeaLabStatusMsg('');
    setIdeaLabSearchResult(null);
    if (!ideaLabRegInput.trim()) return;

    setSearchingIdeaLab(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/idealab/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ regNumber: ideaLabRegInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setIdeaLabSearchResult(data);
      } else {
        setIdeaLabStatusMsg(data.message || 'Student not found.');
      }
    } catch (e) {
      setIdeaLabStatusMsg('Error searching student.');
    } finally {
      setSearchingIdeaLab(false);
    }
  };

  // Mark Idea Lab Present
  const handleMarkIdeaLabPresent = async (subjectMissed: string, teacher: string, room: string, timeStr: string) => {
    if (!ideaLabSearchResult || !token) return;
    setMarkingAttendance(true);
    setIdeaLabStatusMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/admin/idealab/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName: ideaLabSearchResult.student.fullName,
          regNumber: ideaLabSearchResult.student.regNumber,
          department: ideaLabSearchResult.student.branch || 'N/A',
          section: ideaLabSearchResult.student.section || 'N/A',
          batch: ideaLabSearchResult.student.batch || 'N/A',
          subjectMissed,
          teacher,
          room,
          lectureTime: timeStr,
          reason: ideaLabReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIdeaLabStatusMsg(data.message);
        fetchStats(); // Refresh stats
      } else {
        setIdeaLabStatusMsg(data.message || 'Error marking attendance.');
      }
    } catch (e) {
      setIdeaLabStatusMsg('Error recording attendance.');
    } finally {
      setMarkingAttendance(false);
    }
  };

  // Download Excel Report
  const handleDownloadExcel = () => {
    let url = `http://localhost:5000/api/admin/idealab/export?range=${exportRange}`;
    if (exportRange === 'custom') {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    // Trigger file download with Auth header via temporary fetch blob
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `IdeaLab_Attendance_Report_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error('Error downloading Excel report:', err));
  };

  const navTabs: { id: 'analytics' | 'directory' | 'idealab' | 'reports' | 'templates' | 'audit'; name: string; icon: any }[] = [
    { id: 'analytics', name: 'Dashboard Analytics', icon: Activity },
    { id: 'directory', name: 'Student Directory', icon: Users },
    { id: 'idealab', name: 'Idea Lab Attendance', icon: FlaskConical },
    { id: 'reports', name: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'templates', name: 'Timetable Templates', icon: Layers },
    { id: 'audit', name: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
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
                    <div key={idx} className="flex items-center justify-between p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark">
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
                    <div key={idx} className="flex items-center justify-between p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark">
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
            {studentsList.map((st) => (
              <div key={st.id || st.regNumber} className="bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark p-4 rounded-campus shadow-soft-sm flex items-center justify-between gap-3 hover:border-black/30 dark:hover:border-white/30 transition">
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
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-orange-500" />
                Idea Lab Lecture Skip Attendance Logger
              </h3>
              <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5">
                Whenever a student skips a lecture to work in Idea Lab, search their Registration Number to record attendance.
              </p>
            </div>

            {/* Search Input */}
            <form onSubmit={handleIdeaLabSearch} className="flex gap-2">
              <input
                type="text"
                value={ideaLabRegInput}
                onChange={(e) => setIdeaLabRegInput(e.target.value)}
                placeholder="Enter Student Registration Number (e.g. PCEA25CS123)..."
                className="flex-1 px-3.5 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium uppercase focus:outline-none"
              />
              <button
                type="submit"
                disabled={searchingIdeaLab}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 shadow-soft-sm"
              >
                <Search className="h-3.5 w-3.5" />
                Search Student
              </button>
            </form>

            {ideaLabStatusMsg && (
              <div className="p-3 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span>{ideaLabStatusMsg}</span>
              </div>
            )}

            {/* Search Result & Attendance Mark Card */}
            {ideaLabSearchResult && (
              <div className="p-5 bg-campus-bg-light dark:bg-campus-bg-dark/60 border border-campus-border-light dark:border-campus-border-dark rounded-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-campus-border-light dark:border-campus-border-dark">
                  <div>
                    <h4 className="text-sm font-extrabold">{ideaLabSearchResult.student.fullName}</h4>
                    <p className="text-xs font-mono text-campus-secondary-light dark:text-campus-secondary-dark">
                      Reg: {ideaLabSearchResult.student.regNumber} • Sec: {ideaLabSearchResult.student.section || 'N/A'} • Branch: {ideaLabSearchResult.student.branch || 'N/A'} • Batch: {ideaLabSearchResult.student.batch || 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    Idea Lab Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-campus-border-light dark:border-campus-border-dark">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider">Attendance Reason</label>
                    <input
                      type="text"
                      value={ideaLabReason}
                      onChange={(e) => setIdeaLabReason(e.target.value)}
                      placeholder="Reason (e.g. Idea Lab Work, Hackathon Prep)"
                      className="w-full px-3 py-1.5 bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-campus-secondary-light dark:text-campus-secondary-dark uppercase tracking-wider mb-2">
                    Student's Today Timetable & Classes
                  </h5>
                  {Object.keys(ideaLabSearchResult.timetable || {}).length === 0 ? (
                    <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark">No classes scheduled in timetable.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(ideaLabSearchResult.timetable).map(([key, cls]: [string, any]) => (
                        <div key={key} className="p-3 bg-white dark:bg-campus-card-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark space-y-2">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-campus-secondary-light dark:text-campus-secondary-dark uppercase block">{key}</span>
                            <p className="text-xs font-bold truncate">{cls.subject}</p>
                            <p className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark">Teacher: {cls.teacher} • Room {cls.room}</p>
                          </div>
                          <button
                            onClick={() => handleMarkIdeaLabPresent(cls.subject, cls.teacher, cls.room, key)}
                            disabled={markingAttendance}
                            className="w-full py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold text-[11px] rounded-lg shadow-soft-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Mark Present
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
                templates.map((tmpl) => (
                  <div key={tmpl._id} className="p-4 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark space-y-2">
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
                        const res = await fetch('http://localhost:5000/api/admin/templates', {
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
              {auditLogs.map((log) => (
                <div key={log._id} className="p-3 bg-campus-bg-light dark:bg-campus-bg-dark rounded-xl border border-campus-border-light dark:border-campus-border-dark flex items-center justify-between text-xs">
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
