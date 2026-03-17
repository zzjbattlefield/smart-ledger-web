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

const CATEGORY_COLORS = [
  { bg: 'bg-cat-red', darkBg: 'dark:bg-cat-red-dark', text: 'text-cat-red-text', darkText: 'dark:text-cat-red-dark-text' },
  { bg: 'bg-cat-orange', darkBg: 'dark:bg-cat-orange-dark', text: 'text-cat-orange-text', darkText: 'dark:text-cat-orange-dark-text' },
  { bg: 'bg-cat-yellow', darkBg: 'dark:bg-cat-yellow-dark', text: 'text-cat-yellow-text', darkText: 'dark:text-cat-yellow-dark-text' },
  { bg: 'bg-cat-green', darkBg: 'dark:bg-cat-green-dark', text: 'text-cat-green-text', darkText: 'dark:text-cat-green-dark-text' },
  { bg: 'bg-cat-teal', darkBg: 'dark:bg-cat-teal-dark', text: 'text-cat-teal-text', darkText: 'dark:text-cat-teal-dark-text' },
  { bg: 'bg-cat-blue', darkBg: 'dark:bg-cat-blue-dark', text: 'text-cat-blue-text', darkText: 'dark:text-cat-blue-dark-text' },
  { bg: 'bg-cat-purple', darkBg: 'dark:bg-cat-purple-dark', text: 'text-cat-purple-text', darkText: 'dark:text-cat-purple-dark-text' },
  { bg: 'bg-cat-pink', darkBg: 'dark:bg-cat-pink-dark', text: 'text-cat-pink-text', darkText: 'dark:text-cat-pink-dark-text' },
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % CATEGORY_COLORS.length;
}

export function CategoryAvatar({
  name,
  size = 'md',
  className = '',
}: CategoryAvatarProps) {
  const firstChar = name?.charAt(0) || '?';
  const color = CATEGORY_COLORS[getColorIndex(name || '?')];

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold ${color.bg} ${color.darkBg} ${color.text} ${color.darkText} ${sizeClasses[size]} ${className}`}
    >
      {firstChar}
    </div>
  );
}
