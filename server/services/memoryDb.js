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
    const adminPass = await bcrypt.hash('Idealab8058', 10);

    const adminUser = {
      _id: 'admin_id_001',
      fullName: 'Idea Lab Administrator',
      regNumber: 'IDEALAB2026',
      registrationNumber: 'IDEALAB2026',
      password: adminPass,
      role: 'admin',
      section: 'ADMIN',
      batch: 'ADMIN',
      branch: 'ADMIN',
      lastActive: new Date()
    };

    memoryStore.users['IDEALAB2026'] = adminUser;
    memoryStore.userList.push(adminUser);

    memoryStore.timetables['admin_id_001'] = { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {} };
    memoryStore.schedules['admin_id_001'] = {};
    memoryStore.labs['admin_id_001'] = {};
    memoryStore.attendance['admin_id_001'] = {};

    console.log('Fast In-Memory Database initialized with Admin account: Idealab2026');
  }
};

export { memoryStore };
export default memoryStore;
