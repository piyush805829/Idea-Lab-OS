import api from '../utils/api';

export const shareService = {
  async shareTimetable(toRegNumber: string, timetableData: any) {
    const response = await api.post('/share', { toRegNumber, timetableData });
    return response.data;
  },

  async getSharedTimetables() {
    const response = await api.get('/share');
    return response.data;
  },

  async importSharedSchedule(shareId: string) {
    const response = await api.post('/share/import', { shareId });
    return response.data;
  }
};

export default shareService;
