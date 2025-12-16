import React from 'react';
import { cn } from '@/utils/cn';

interface HeaderProps {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export const Header = ({ title, leftAction, rightAction, className }: HeaderProps) => {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center h-14 px-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 transition-all",
      className
    )}>
      <div className="flex items-center justify-start">
        {leftAction}
      </div>
      
      <h1 className="text-lg font-semibold text-ios-text text-center truncate px-2">
        {title}
      </h1>
      
      <div className="flex items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
};