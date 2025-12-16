import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-ios-subtext ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full h-12 rounded-xl bg-gray-100 px-4 text-ios-text placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:bg-white transition-all duration-300 ease-out",
              "border border-transparent focus:border-ios-blue/50",
              error && "bg-red-50 focus:ring-red-100 border-red-200",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-ios-red ml-1 animate-fadeIn">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
