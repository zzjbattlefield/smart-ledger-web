import { create } from 'zustand';
import type { Category } from '../types';
import { categoryApi } from '../api';

interface CategoryState {
  expenseCategories: Category[];
  incomeCategories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: (type?: 1 | 2) => Promise<void>;
  createCategory: (data: Parameters<typeof categoryApi.create>[0]) => Promise<Category>;
  updateCategory: (id: number, data: Parameters<typeof categoryApi.update>[1]) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  getCategoryById: (id: number) => Category | undefined;
  reorderCategories: (reorderedIds: number[], parentId?: number) => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  expenseCategories: [],
  incomeCategories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await categoryApi.getList(type);
      const categories = data.data;

      if (!type) {
        // Fetch all, separate by type
        set({
          expenseCategories: categories.filter((c) => c.type === 1),
          incomeCategories: categories.filter((c) => c.type === 2),
          isLoading: false,
        });
      } else if (type === 1) {
        set({ expenseCategories: categories, isLoading: false });
      } else {
        set({ incomeCategories: categories, isLoading: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取分类失败';
      set({ error: message, isLoading: false });
    }
  },

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoryApi.create(data);
      const newCategory = response.data.data;

      // Refresh categories
      await get().fetchCategories();
      set({ isLoading: false });
      return newCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建分类失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoryApi.update(id, data);
      const updatedCategory = response.data.data;

      // Refresh categories
      await get().fetchCategories();
      set({ isLoading: false });
      return updatedCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新分类失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await categoryApi.delete(id);

      // Refresh categories
      await get().fetchCategories();
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除分类失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  getCategoryById: (id) => {
    const state = get();
    const allCategories = [...state.expenseCategories, ...state.incomeCategories];

    // Search in top level
    let found = allCategories.find((c) => c.id === id);
    if (found) return found;

    // Search in children
    for (const category of allCategories) {
      if (category.children) {
        found = category.children.find((c) => c.id === id);
        if (found) return found;
      }
    }

    return undefined;
  },

  reorderCategories: async (reorderedIds, _parentId) => {
    set({ isLoading: true, error: null });
    try {
      // 按新顺序更新每个分类的 sort_order
      const updatePromises = reorderedIds.map((id, index) =>
        categoryApi.update(id, { sort_order: index })
      );
      await Promise.all(updatePromises);

      // 刷新分类列表
      await get().fetchCategories();
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '排序更新失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
