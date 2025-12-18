import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useUserStore } from '../store/userStore';

// 定义 API 响应的通用结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 处理未授权逻辑
const handleUnauthorized = () => {
  const { logout } = useUserStore.getState();
  logout();
  localStorage.removeItem('token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 Store 或 LocalStorage 获取 token
    const storeToken = useUserStore.getState().token;
    const token = storeToken || localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
const UNAUTHORIZED_CODES = [20001, 20002, 20003, 30001];

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    // 根据后端约定，code === 0 代表成功
    if (res.code !== 0) {
      // 处理 Token 过期/无效等情况
      if (UNAUTHORIZED_CODES.includes(res.code)) {
        handleUnauthorized();
        // 返回一个被拒绝的 Promise，中断后续业务逻辑
        return Promise.reject(new Error(res.message || 'Unauthorized'));
      }

      // TODO: 全局错误提示 (Toast)
      console.error(res.message || 'Error');
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return response;
  },
  (error: AxiosError) => {
    // 处理 HTTP 状态码错误
    if (error.response) {
      // 尝试解析响应体中的业务错误码
      const res = error.response.data as ApiResponse | undefined;
      
      if (error.response.status === 401 || (res && UNAUTHORIZED_CODES.includes(res.code))) {
        handleUnauthorized();
      }
    }
    
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

export default service;
