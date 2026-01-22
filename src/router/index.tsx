import { createBrowserRouter, Navigate } from 'react-router-dom';
import { BasicLayout } from '../layouts/BasicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Main pages
import { HomePage } from '../pages/home/HomePage';
import { AddBillPage } from '../pages/bill/AddBillPage';
import { BatchUploadPage } from '../pages/bill/BatchUploadPage';
import { BillDetailPage } from '../pages/bill/BillDetailPage';
import { StatsPage } from '../pages/stats/StatsPage';
import { CategoryDetailPage } from '../pages/stats/CategoryDetailPage';
import { CategoryPage } from '../pages/category/CategoryPage';
import { ProfilePage } from '../pages/profile/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  // Auth routes (no auth required)
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  // Main routes with TabBar (auth required)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <BasicLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'home', element: <HomePage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  // Routes without TabBar (auth required)
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: 'bill/add', element: <AddBillPage /> },
      { path: 'bill/batch-upload', element: <BatchUploadPage /> },
      { path: 'bill/detail/:id', element: <BillDetailPage /> },
      { path: 'stats/category/:id', element: <CategoryDetailPage /> },
      { path: 'category', element: <CategoryPage /> },
    ],
  },
]);
