import api from '../utils/api';

export const authService = {
  async signup(data: {
    fullName: string;
    registrationNumber?: string;
    regNumber?: string;
    password: string;
    confirmPassword?: string;
    branch?: string;
    year?: string;
    section?: string;
    batch?: string;
  }) {
    const regNo = data.registrationNumber || data.regNumber || '';
    const payload = {
      ...data,
      registrationNumber: regNo,
      regNumber: regNo
    };
    const response = await api.post('/auth/signup', payload);
    return response.data;
  },

  async login(data: { registrationNumber?: string; regNumber?: string; identifier?: string; password: string }) {
    const regNo = data.registrationNumber || data.regNumber || data.identifier || '';
    const payload = {
      registrationNumber: regNo,
      regNumber: regNo,
      identifier: regNo,
      password: data.password
    };
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('campusos_token');
      localStorage.removeItem('idealab_token');
      localStorage.removeItem('campusos-token');
    }
  }
};

export default authService;
