import request, { ApiResponse } from '@/utils/request';

export interface AuthResponse {
  token: string;
  expires_at: string;
  user: {
    id: number;
    phone: string;
    nickname: string;
    avatar_url: string;
  };
}

export const login = (data: { phone: string; password: string }) => {
  return request.post<ApiResponse<AuthResponse>>('/user/login', data);
};

export const register = (data: { phone: string; password: string; nickname?: string }) => {
  return request.post<ApiResponse<AuthResponse>>('/user/register', data);
};
