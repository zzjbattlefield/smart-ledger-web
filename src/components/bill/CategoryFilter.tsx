import { useEffect, useState } from 'react';
import { getCategories, Category } from '@/api/category';
import { cn } from '@/utils/cn';

interface CategoryFilterProps {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export const CategoryFilter = ({ selectedId, onSelect }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Get all categories (both expense and income)
    // We could optimize to only get relevant ones if needed, but getting all is fine for now
    getCategories().then(res => {
      setCategories(res.data.data);
    });
  }, []);

  // Flatten the list for the filter? Or just use top-level?
  // Usually top-level is cleaner for a quick filter.
  // Let's stick to top-level for now as per typical design patterns.
  
  return (
    <div className="flex overflow-x-auto py-2 px-1 gap-2 no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
          selectedId === null
            ? "bg-ios-blue text-white border-ios-blue"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        )}
      >
        全部
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
            selectedId === cat.id
              ? "bg-ios-blue text-white border-ios-blue"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
