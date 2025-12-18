import { cn } from '@/utils/cn';

interface CategoryIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colors = [
  'bg-ios-blue',
  'bg-ios-green',
  'bg-ios-orange',
  'bg-ios-purple',
  'bg-ios-teal',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-amber-500'
];

export const CategoryIcon = ({ name, size = 'md', className }: CategoryIconProps) => {
  const firstChar = name ? name.charAt(0) : '?';
  
  // 基于名称生成稳定的颜色索引
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }[size];

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full text-white font-semibold shadow-sm",
      bgColor,
      sizeClass,
      className
    )}>
      {firstChar}
    </div>
  );
};
