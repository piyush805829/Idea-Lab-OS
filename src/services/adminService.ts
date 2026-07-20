import api from '../utils/api';
import * as XLSX from 'xlsx';

export const adminService = {
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getAllStudents() {
    const response = await api.get('/admin/students');
    return response.data;
  },

  async getStudentDetail(idOrReg: string) {
    const response = await api.get(`/admin/student/${idOrReg}`);
    return response.data;
  },

  async markAttendance(data: {
    regNumber: string;
    reason?: string;
    subject?: string;
    teacher?: string;
    room?: string;
    slot?: string;
  }) {
    const response = await api.post('/admin/attendance', data);
    return response.data;
  },

  async getReports() {
    const response = await api.get('/admin/report');
    return response.data;
  },

  // Formats and downloads Excel file with dynamic multi-slot columns per student row
  async exportExcelReport(reportData?: any[]) {
    let records = reportData;
    if (!records) {
      const res = await this.getReports();
      records = res.report || res.data || [];
    }

    const list = records || [];
    const formattedList = list.length > 0 ? list : [
      { 'Name': 'N/A', 'Reg No': 'N/A', 'Date': new Date().toLocaleDateString('en-GB'), 'Time Slot 1': '-' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(formattedList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Idea Lab Attendance');

    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Idea_Lab_Attendance_Report_${dateStr}.xlsx`);
  }
};

export default adminService;
