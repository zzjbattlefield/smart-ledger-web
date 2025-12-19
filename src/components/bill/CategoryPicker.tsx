import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Search } from 'lucide-react';
import { getCategories, Category } from '@/api/category';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/Input';

interface CategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: number;
  type?: 1 | 2;
  onSelect: (category: Category) => void;
}

const CategoryPickerContent = ({ onClose, selectedId, type, onSelect }: Omit<CategoryPickerProps, 'isOpen'>) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<1 | 2>(type || 1);

  useEffect(() => {
    getCategories(activeType).then(res => {
      setCategories(res.data.data);
      // If selected is a child, expand parent (only if matching type or initial load)
      const flatCats = res.data.data;
      
      // Try to find currently selected category to expand parent
      // Note: selectedId might belong to the OTHER type if we switched tabs.
      // So we only auto-expand if we find it in current list.
      const selectedParent = flatCats.find(p => p.children?.some(c => c.id === selectedId));
      
      if (selectedParent) {
        setActiveParentId(selectedParent.id);
      } else if (flatCats.length > 0) {
         // Default to first if nothing active
         setActiveParentId(flatCats[0].id);
      } else {
        setActiveParentId(null);
      }
    });
  }, [activeType, selectedId]);

  const activeParent = categories.find(c => c.id === activeParentId);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const results: Category[] = [];
    
    categories.forEach(parent => {
      // Check parent
      if (parent.name.toLowerCase().includes(term)) {
        results.push(parent);
      }
      // Check children
      parent.children?.forEach(child => {
        if (child.name.toLowerCase().includes(term)) {
          results.push(child);
        }
      });
    });
    
    return Array.from(new Set(results));
  }, [categories, searchTerm]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-[70] h-[80vh] rounded-t-3xl bg-white shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <span className="text-lg font-semibold text-gray-900">选择分类</span>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
          <X size={20} />
        </button>
      </div>
      
      {/* Type Switcher Tabs */}
      <div className="flex p-2 gap-2 border-b border-gray-50">
        <button
          onClick={() => setActiveType(1)}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
            activeType === 1 ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
          )}
        >
          支出
        </button>
        <button
          onClick={() => setActiveType(2)}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
            activeType === 2 ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
          )}
        >
          收入
        </button>
      </div>
      
      <div className="px-4 py-2 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索分类名称" 
            className="pl-9 bg-gray-50 border-none h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {searchTerm ? (
          // Search Results View
          <div className="flex-1 overflow-y-auto p-4">
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                未找到相关分类
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {searchResults.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      onSelect(cat);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl active:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("text-base", selectedId === cat.id ? "font-semibold text-ios-blue" : "text-gray-700")}>
                        {cat.name}
                      </span>
                       {cat.parent_id !== 0 && (
                         <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                           {categories.find(p => p.id === cat.parent_id)?.name}
                         </span>
                       )}
                    </div>
                    {selectedId === cat.id && <Check size={18} className="text-ios-blue" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Standard Split View
          <>
            {/* 左侧：一级分类 */}
            <div className="w-1/3 bg-gray-50 overflow-y-auto">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setActiveParentId(cat.id)}
                  className={cn(
                    "p-4 text-sm font-medium transition-colors cursor-pointer relative",
                    activeParentId === cat.id ? "bg-white text-ios-blue" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {activeParentId === cat.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-blue" />
                  )}
                  {cat.name}
                </div>
              ))}
            </div>

            {/* 右侧：二级分类 */}
            <div className="flex-1 overflow-y-auto bg-white p-4">
              {/* 始终允许选择当前一级分类 */}
              {activeParent && (
                 <div 
                  onClick={() => {
                    onSelect(activeParent);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl active:bg-gray-50 transition-colors cursor-pointer mb-2 border-b border-gray-50"
                >
                  <span className={cn("text-base font-medium", selectedId === activeParent.id ? "text-ios-blue" : "text-gray-900")}>
                    {activeParent.name}
                  </span>
                  {selectedId === activeParent.id && <Check size={18} className="text-ios-blue" />}
                </div>
              )}

              {activeParent?.children?.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => {
                    onSelect(sub);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl active:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className={cn("text-base", selectedId === sub.id ? "font-semibold text-ios-blue" : "text-gray-700")}>
                    {sub.name}
                  </span>
                  {selectedId === sub.id && <Check size={18} className="text-ios-blue" />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export const CategoryPicker = ({ isOpen, ...props }: CategoryPickerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <CategoryPickerContent key="content" {...props} />
        </>
      )}
    </AnimatePresence>
  );
};