import { create } from 'zustand';
import type { Bill, BillListParams } from '../types';
import { billApi } from '../api';
import { getMonthDateRange } from '../utils/format';

interface BillState {
  bills: Bill[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  // Date selection
  selectedYear: number;
  selectedMonth: number;

  // Filters
  filters: BillListParams;

  // Actions
  fetchBills: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<BillListParams>) => void;
  setSelectedDate: (year: number, month: number) => void;
  createBill: (data: Parameters<typeof billApi.create>[0]) => Promise<Bill>;
  updateBill: (id: number, data: Parameters<typeof billApi.update>[1]) => Promise<Bill>;
  deleteBill: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  error: null,
  hasMore: true,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  filters: {},

  fetchBills: async (reset = true) => {
    const state = get();
    if (state.isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const page = reset ? 1 : state.page;
      const { data } = await billApi.getList({
        ...state.filters,
        page,
        page_size: state.pageSize,
      });

      const { list, total } = data.data;
      set({
        bills: reset ? list : [...state.bills, ...list],
        total,
        page,
        hasMore: list.length === state.pageSize,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取账单失败';
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const state = get();
    if (!state.hasMore || state.isLoading) return;

    set({ page: state.page + 1 });
    await get().fetchBills(false);
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    get().fetchBills(true);
  },

  setSelectedDate: (year, month) => {
    const { start, end } = getMonthDateRange(year, month);
    set((state) => ({
      selectedYear: year,
      selectedMonth: month,
      filters: { ...state.filters, start_date: start, end_date: end },
    }));
    get().fetchBills(true);
  },

  createBill: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await billApi.create(data);
      const newBill = response.data.data;
      set((state) => ({
        bills: [newBill, ...state.bills],
        total: state.total + 1,
        isLoading: false,
      }));
      return newBill;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建账单失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateBill: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await billApi.update(id, data);
      const updatedBill = response.data.data;
      set((state) => ({
        bills: state.bills.map((bill) =>
          bill.id === id ? updatedBill : bill
        ),
        isLoading: false,
      }));
      return updatedBill;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新账单失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteBill: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await billApi.delete(id);
      set((state) => ({
        bills: state.bills.filter((bill) => bill.id !== id),
        total: state.total - 1,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除账单失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
