import { Outlet, Navigate } from 'react-router-dom';
import { getAuthToken } from '../utils';

export function AuthLayout() {
  const token = getAuthToken();

  // If already logged in with valid token, redirect to home
  if (token) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
