import api from '../utils/api';

export const timetableService = {
  async getTimetable() {
    const response = await api.get('/timetable');
    return response.data;
  },

  async updateTimetable(timetableData: any) {
    const response = await api.put('/timetable', { timetable: timetableData });
    return response.data;
  }
};

export default timetableService;
