import api from '../utils/api';

export const authService = {
  async signup(data: {
    fullName: string;
    registrationNumber: string;
    password: string;
    confirmPassword?: string;
    branch?: string;
    year?: string;
    section?: string;
    batch?: string;
  }) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async login(data: { registrationNumber: string; password: string }) {
    const response = await api.post('/auth/login', data);
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
    }
  }
};

export default authService;
