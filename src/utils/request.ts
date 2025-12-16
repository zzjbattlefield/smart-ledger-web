import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useUserStore } from '../store/userStore';

// 定义 API 响应的通用结构
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

const service = axios.create({
  baseURL: '/v1', // 配合 vite proxy
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
  window.location.href = '/login';
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
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    // 根据后端约定，code === 0 代表成功
    if (res.code !== 0) {
      // 处理 Token 过期/无效等情况
      // 20001: 未授权, 20002: Token过期, 20003: Token无效, 30001: 用户不存在
      if ([20001, 20002, 20003, 30001].includes(res.code)) {
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
    if (error.response && error.response.status === 401) {
      handleUnauthorized();
    }
    
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

export default service;
