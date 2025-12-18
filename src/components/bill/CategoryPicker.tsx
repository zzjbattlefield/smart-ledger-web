import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { getCategories, Category } from '@/api/category';
import { cn } from '@/utils/cn';

interface CategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: number;
  type?: 1 | 2; // Add type prop
  onSelect: (category: Category) => void;
}

export const CategoryPicker = ({ isOpen, onClose, selectedId, type, onSelect }: CategoryPickerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCategories(type).then(res => { // Pass type to getCategories
        setCategories(res.data.data);
        // 如果已选中的是子分类，自动展开父分类
        const flatCats = res.data.data;
        const selectedParent = flatCats.find(p => p.children?.some(c => c.id === selectedId));
        if (selectedParent) {
          setActiveParentId(selectedParent.id);
        } else if (!activeParentId && flatCats.length > 0) {
           setActiveParentId(flatCats[0].id);
        }
      });
    }
  }, [isOpen]);

  const activeParent = categories.find(c => c.id === activeParentId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-[70] h-[70vh] rounded-t-3xl bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <span className="text-lg font-semibold text-gray-900">选择分类</span>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
