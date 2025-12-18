import request, { ApiResponse } from '@/utils/request';

export interface StatsSummary {
  period: string;
  total_expense: number;
  total_income: number;
  bill_count: number;
  daily_average: number;
  top_categories: Array<{
    name: string;
    amount: number;
    percent: number;
  }>;
  trend: Array<{
    date: string;
    expense: number;
    income: number;
  }>;
}

export interface CategoryStats {
  period: string;
  categories: Array<{
    id: number;
    name: string;
    amount: number;
    percent: number;
  }>;
}

export const getStatsSummary = (params: { period: 'month' | 'week' | 'day' | 'year'; date: string }) => {
  return request.get<ApiResponse<StatsSummary>>('/stats/summary', { params });
};

export const getCategoryStats = (params: { period: 'month' | 'week' | 'day' | 'year'; date: string }) => {
  return request.get<ApiResponse<CategoryStats>>('/stats/category', { params });
};