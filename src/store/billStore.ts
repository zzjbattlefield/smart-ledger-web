import { create } from 'zustand';
import { Bill } from '@/api/bill';
import { StatsSummary } from '@/api/stats';

interface BillState {
  bills: Bill[];
  stats: StatsSummary | null;
  page: number;
  hasMore: boolean;
  filters: {
    date: string; // YYYY-MM
    categoryId: number | null;
  };
  scrollPosition: number;
  
  // Actions
  setBills: (bills: Bill[]) => void;
  appendBills: (bills: Bill[]) => void;
  updateBill: (id: number | string, data: Partial<Bill>) => void;
  removeBill: (id: number | string) => void; // Add this
  setStats: (stats: StatsSummary | null) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setFilters: (filters: Partial<BillState['filters']>) => void;
  setScrollPosition: (pos: number) => void;
  reset: () => void;
}

const initialState = {
  bills: [],
  stats: null,
  page: 1,
  hasMore: true,
  filters: {
    date: new Date().toISOString().slice(0, 7), // Current YYYY-MM
    categoryId: null,
  },
  scrollPosition: 0,
};

export const useBillStore = create<BillState>((set) => ({
  ...initialState,
  
  setBills: (bills) => set({ bills }),
  appendBills: (newBills) => set((state) => ({ bills: [...state.bills, ...newBills] })),
  updateBill: (id, data) => set((state) => ({
    bills: state.bills.map((b) => (b.id === id ? { ...b, ...data } : b))
  })),
  removeBill: (id) => set((state) => ({
    bills: state.bills.filter((b) => b.id !== id)
  })), // Add this implementation
  setStats: (stats) => set({ stats }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setFilters: (newFilters) => set((state) => ({ 
    filters: { ...state.filters, ...newFilters },
    // Reset list when filters change
    bills: [],
    page: 1,
    hasMore: true,
    scrollPosition: 0
  })),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
  reset: () => set(initialState),
}));
