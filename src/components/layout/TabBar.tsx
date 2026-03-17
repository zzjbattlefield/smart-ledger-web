import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/home', icon: Home, label: '首页' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/profile', icon: User, label: '我的' },
];

export function TabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-gray-100 dark:border-zinc-800/50 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="relative flex flex-col items-center gap-0.5 px-6 py-1.5"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-1 bg-cta-blue/10 dark:bg-cta-blue/15 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`relative w-5 h-5 transition-colors duration-200 ${
                  isActive
                    ? 'text-cta-blue'
                    : 'text-light-text-secondary dark:text-dark-text-secondary'
                }`}
              />
              <span
                className={`relative text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-cta-blue'
                    : 'text-light-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
