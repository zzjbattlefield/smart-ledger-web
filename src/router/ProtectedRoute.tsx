import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../store';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useUserStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}
