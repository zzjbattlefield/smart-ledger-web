import { createBrowserRouter, Navigate } from 'react-router-dom';
import BasicLayout from '@/layouts/BasicLayout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Home from '@/pages/bill/Home';
import AddBill from '@/pages/bill/AddBill';
import BillDetail from '@/pages/bill/Detail';
import CategoryList from '@/pages/category/CategoryList';
import Stats from '@/pages/stats/Stats';
import Profile from '@/pages/profile/Profile';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/bill/add',
    element: <AddBill />,
  },
  {
    path: '/bill/detail/:id',
    element: <BillDetail />,
  },
  {
    path: '/category',
    element: <CategoryList />,
  },
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'stats',
        element: <Stats />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      // More routes will be added later
    ],
  },
  {
    path: '*',
    element: <div>404 Not Found</div>,
  }
]);

export default router;
