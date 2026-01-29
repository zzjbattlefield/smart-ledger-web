import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';
import { clearAuthStorage, getAuthToken } from '../utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
let isHandlingUnauthorized = false;

export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle authentication errors
      if (status === 401) {
        clearAuthStorage();

        // 避免并发请求 401 时重复触发跳转，导致“home/login 来回闪动”
        if (!isHandlingUnauthorized) {
          isHandlingUnauthorized = true;
          window.location.replace('/login');
        }
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }

      // Return API error message
      if (data?.message) {
        return Promise.reject(new Error(data.message));
      }
    }

    // Network error
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请稍后重试'));
    }

    return Promise.reject(new Error('网络错误，请检查网络连接'));
  }
);

export default request;
