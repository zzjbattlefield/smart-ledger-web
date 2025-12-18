import { NavLink } from 'react-router-dom';
import { Home, PieChart, User } from 'lucide-react';
import { cn } from '@/utils/cn';

const tabs = [
  { path: '/home', icon: Home, label: '账本' },
  { path: '/stats', icon: PieChart, label: '统计' },
  { path: '/profile', icon: User, label: '我的' },
];

const BottomTab = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100/50 bg-white/80 pb-safe backdrop-blur-xl">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center space-y-1 py-1 transition-colors duration-200",
                isActive ? "text-ios-blue" : "text-gray-400 hover:text-gray-500"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform duration-200 active:scale-90"
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomTab;