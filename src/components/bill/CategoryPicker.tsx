import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Search } from 'lucide-react';
import type { Category } from '../../types';
import { useCategoryStore } from '../../store';

interface CategoryPickerProps {
  open: boolean;
  onClose: () => void;
  billType: 1 | 2;
  selectedId?: number;
  onSelect: (category: Category) => void;
}

export function CategoryPicker({
  open,
  onClose,
  billType,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  const { expenseCategories, incomeCategories, fetchCategories, isLoading } =
    useCategoryStore();
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = billType === 1 ? expenseCategories : incomeCategories;

  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCategories(billType);
    }
  }, [open, billType, categories.length, fetchCategories]);

  useEffect(() => {
    if (!open) {
      setSelectedParent(null);
      setSearchTerm('');
    }
  }, [open]);

  const handleSelectParent = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setSelectedParent(category);
    } else {
      onSelect(category);
      onClose();
    }
  };

  const handleSelectChild = (category: Category) => {
    onSelect(category);
    onClose();
  };

  const displayCategories = selectedParent?.children || categories;

  // 扁平化分类列表（包含一级和二级）
  const flattenCategories = useMemo(() => {
    const result: Array<{ category: Category; parentName?: string }> = [];
    categories.forEach((parent) => {
      result.push({ category: parent });
      if (parent.children) {
        parent.children.forEach((child) => {
          result.push({ category: child, parentName: parent.name });
        });
      }
    });
    return result;
  }, [categories]);

  // 搜索过滤
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return flattenCategories.filter((item) =>
      item.category.name.toLowerCase().includes(term)
    );
  }, [flattenCategories, searchTerm]);

  const isSearching = searchTerm.trim().length > 0;

  // 高亮匹配文字
  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-700 rounded-sm">
          {text.slice(index, index + term.length)}
        </span>
        {text.slice(index + term.length)}
      </>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-light-card dark:bg-dark-card rounded-t-3xl max-h-[70vh] overflow-hidden safe-area-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                {selectedParent && !isSearching && (
                  <button
                    onClick={() => setSelectedParent(null)}
                    className="text-cta-blue text-sm"
                  >
                    返回
                  </button>
                )}
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                  {isSearching ? '搜索分类' : selectedParent ? selectedParent.name : '选择分类'}
                </h3>
              </div>
              <button onClick={onClose} className="p-1">
                <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 pb-3 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索分类"
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl text-sm text-light-text dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary outline-none focus:ring-2 focus:ring-cta-blue transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Grid */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-120px)]">
              {isLoading ? (
                <div className="py-8 text-center text-light-text-secondary">加载中...</div>
              ) : isSearching ? (
                // 搜索模式
                searchResults.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {searchResults.map((item) => {
                      const { category, parentName } = item;
                      const isSelected = category.id === selectedId;

                      return (
                        <motion.button
                          key={category.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            onSelect(category);
                            onClose();
                          }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-cta-blue/10 border-2 border-cta-blue'
                              : 'bg-gray-50 dark:bg-zinc-900 border-2 border-transparent'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                              isSelected
                                ? 'bg-cta-blue text-white'
                                : 'bg-gray-100 dark:bg-zinc-800 text-light-text-secondary dark:text-dark-text-secondary'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              category.name.charAt(0)
                            )}
                          </div>
                          <div className="flex flex-col items-center w-full">
                            <span
                              className={`text-xs font-medium truncate w-full text-center ${
                                isSelected
                                  ? 'text-cta-blue'
                                  : 'text-light-text dark:text-dark-text'
                              }`}
                            >
                              {highlightMatch(category.name, searchTerm)}
                            </span>
                            {parentName && (
                              <span className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary truncate w-full text-center">
                                {parentName}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-light-text-secondary">
                    未找到匹配的分类
                  </div>
                )
              ) : (
                // 正常模式
                <div className="grid grid-cols-4 gap-3">
                  {displayCategories.map((category) => {
                    const isSelected = category.id === selectedId;
                    const hasChildren =
                      category.children && category.children.length > 0;

                    return (
                      <motion.button
                        key={category.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          selectedParent
                            ? handleSelectChild(category)
                            : handleSelectParent(category)
                        }
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-cta-blue/10 border-2 border-cta-blue'
                            : 'bg-gray-50 dark:bg-zinc-900 border-2 border-transparent'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                            isSelected
                              ? 'bg-cta-blue text-white'
                              : 'bg-gray-100 dark:bg-zinc-800 text-light-text-secondary dark:text-dark-text-secondary'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            category.name.charAt(0)
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium truncate w-full text-center ${
                            isSelected
                              ? 'text-cta-blue'
                              : 'text-light-text dark:text-dark-text'
                          }`}
                        >
                          {category.name}
                          {hasChildren && !selectedParent && ' >'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
