import request from './request';
import type { ApiResponse, StatsSummary, CategoryStats } from '../types';

type Period = 'day' | 'week' | 'month' | 'year';

interface StatsParams {
  period: Period;
  date: string;
}

interface SecondaryCategoryParams extends StatsParams {
  category_id: number;
}

export const statsApi = {
  // 获取统计摘要
  getSummary: (params: StatsParams) =>
    request.get<ApiResponse<StatsSummary>>('/v1/stats/summary', { params }),

  // 获取分类统计
  getCategoryStats: (params: StatsParams) =>
    request.get<ApiResponse<CategoryStats>>('/v1/stats/category', { params }),

  // 获取二级分类统计
  getSecondaryCategoryStats: (params: SecondaryCategoryParams) =>
    request.get<ApiResponse<CategoryStats>>('/v1/stats/secondary-category', { params }),
};
