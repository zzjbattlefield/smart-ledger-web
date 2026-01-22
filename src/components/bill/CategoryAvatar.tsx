interface CategoryAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export function CategoryAvatar({
  name,
  size = 'md',
  className = '',
}: CategoryAvatarProps) {
  const firstChar = name?.charAt(0) || '?';

  return (
    <div
      className={`rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-medium text-light-text-secondary dark:text-dark-text-secondary ${sizeClasses[size]} ${className}`}
    >
      {firstChar}
    </div>
  );
}
