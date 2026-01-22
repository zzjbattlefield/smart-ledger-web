import { NavLink } from 'react-router-dom';
import { Home, BarChart3, User } from 'lucide-react';

const tabs = [
  { path: '/home', icon: Home, label: '首页' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/profile', icon: User, label: '我的' },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-light-card dark:bg-dark-card border-t border-gray-100 dark:border-zinc-900 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {tabs.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-6 py-1.5 transition-colors ${
                isActive
                  ? 'text-cta-blue'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
