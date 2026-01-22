import { Outlet } from 'react-router-dom';
import { TabBar } from '../components/layout';

export function BasicLayout() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        <Outlet />
      </main>

      {/* Tab Bar */}
      <TabBar />
    </div>
  );
}
