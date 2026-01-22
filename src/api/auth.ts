import request from './request';
import type { ApiResponse, AuthResponse, User } from '../types';

interface LoginParams {
  phone: string;
  password: string;
}

interface RegisterParams {
  phone: string;
  password: string;
  nickname?: string;
}

interface UpdateProfileParams {
  nickname?: string;
  avatar_url?: string;
}

export const authApi = {
  // 用户登录
  login: (params: LoginParams) =>
    request.post<ApiResponse<AuthResponse>>('/v1/user/login', params),

  // 用户注册
  register: (params: RegisterParams) =>
    request.post<ApiResponse<AuthResponse>>('/v1/user/register', params),

  // 获取用户信息
  getProfile: () =>
    request.get<ApiResponse<User>>('/v1/user/profile'),

  // 更新用户信息
  updateProfile: (params: UpdateProfileParams) =>
    request.put<ApiResponse<User>>('/v1/user/profile', params),
};
