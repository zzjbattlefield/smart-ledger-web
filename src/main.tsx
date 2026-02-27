import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { router } from './router';
import { getAuthToken } from './utils';
import './styles/index.css';

// 启动时触发一次登录态校验，自动清理过期或损坏的 token 缓存
getAuthToken();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>
);
