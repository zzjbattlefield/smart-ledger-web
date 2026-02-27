import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../utils';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}
