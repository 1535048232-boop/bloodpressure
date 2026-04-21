import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  // Register new user
  register: async (userData: {
    username: string;
    password: string;
    email?: string;
    fullName?: string;
    birthDate?: string;
    gender?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User>): Promise<{ user: User; message: string }> => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};