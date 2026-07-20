import bcrypt from 'bcryptjs';

// Fast In-Memory Database Store for Instant Fallback
const memoryStore = {
  users: {},
  userList: [],
  timetables: {},
  schedules: {},
  labs: {},
  attendance: {},
  shared: [],
  sharedSchedules: [],
  ideaLabAttendance: [],
  ideaLabRecords: [],
  auditLogs: [],
  templates: []
};

// Seed testing accounts in memory
export const initMemoryDb = async () => {
  if (memoryStore.userList.length === 0) {
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    const adminUser = {
      _id: 'admin_id_001',
      fullName: 'System Administrator',
      regNumber: 'ADMIN001',
      registrationNumber: 'ADMIN001',
      password: adminPass,
      role: 'admin',
      section: 'ADMIN',
      batch: 'ADMIN',
      branch: 'ADMIN',
      lastActive: new Date()
    };

    const studentUser = {
      _id: 'student_id_001',
      fullName: 'Piyush',
      regNumber: 'PCEA25CS123',
      registrationNumber: 'PCEA25CS123',
      password: studentPass,
      role: 'student',
      section: 'B',
      batch: '2',
      branch: 'CSE',
      lastActive: new Date()
    };

    memoryStore.users['ADMIN001'] = adminUser;
    memoryStore.users['PCEA25CS123'] = studentUser;
    memoryStore.userList.push(adminUser, studentUser);

    memoryStore.timetables['admin_id_001'] = { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {} };
    memoryStore.timetables['student_id_001'] = { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {} };
    memoryStore.schedules['admin_id_001'] = {};
    memoryStore.schedules['student_id_001'] = {};
    memoryStore.labs['admin_id_001'] = {};
    memoryStore.labs['student_id_001'] = {};
    memoryStore.attendance['admin_id_001'] = {};
    memoryStore.attendance['student_id_001'] = {};

    console.log('Fast In-Memory Database initialized with test accounts: ADMIN001 & PCEA25CS123');
  }
};

export { memoryStore };
export default memoryStore;
