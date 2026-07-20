import bcrypt from 'bcryptjs';

// Fast In-Memory Database Store for Instant Fallback
const memoryStore = {
  users: [],
  schedules: {},
  labs: {},
  attendance: {},
  sharedSchedules: [],
  ideaLabRecords: [],
  auditLogs: [],
  templates: []
};

// Seed testing accounts in memory
export const initMemoryDb = async () => {
  if (memoryStore.users.length === 0) {
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    const adminUser = {
      _id: 'admin_id_001',
      fullName: 'System Administrator',
      regNumber: 'ADMIN001',
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
      password: studentPass,
      role: 'student',
      section: 'B',
      batch: '2',
      branch: 'CSE',
      lastActive: new Date()
    };

    memoryStore.users.push(adminUser, studentUser);
    memoryStore.schedules['admin_id_001'] = {};
    memoryStore.schedules['student_id_001'] = {};
    memoryStore.labs['admin_id_001'] = {};
    memoryStore.labs['student_id_001'] = {};
    memoryStore.attendance['admin_id_001'] = {};
    memoryStore.attendance['student_id_001'] = {};

    console.log('Fast In-Memory Database initialized with test accounts: ADMIN001 & PCEA25CS123');
  }
};

export default memoryStore;
