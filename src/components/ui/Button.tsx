import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-ios-blue text-white active:bg-blue-600",
      secondary: "bg-gray-100 text-ios-text active:bg-gray-200",
      ghost: "bg-transparent text-ios-blue hover:bg-blue-50 active:bg-blue-100",
      danger: "bg-ios-red text-white active:bg-red-600",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "relative flex items-center justify-center rounded-2xl font-semibold transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
