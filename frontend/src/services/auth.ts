import api from './api';
import type { User, LoginRequest, RegisterRequest, TokenResponse } from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/refresh');
    return response.data;
  },
};
