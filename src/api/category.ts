import request from './request';
import type { ApiResponse, Category } from '../types';

interface CreateCategoryParams {
  name: string;
  type?: 1 | 2;
  parent_id?: number;
  icon?: string;
  sort_order?: number;
}

interface UpdateCategoryParams {
  name?: string;
  icon?: string;
  sort_order?: number;
}

export const categoryApi = {
  // 获取分类列表
  getList: (type?: 1 | 2) =>
    request.get<ApiResponse<Category[]>>('/v1/categories', { params: { type } }),

  // 获取分类详情
  getDetail: (id: number) =>
    request.get<ApiResponse<Category>>(`/v1/categories/${id}`),

  // 创建分类
  create: (data: CreateCategoryParams) =>
    request.post<ApiResponse<Category>>('/v1/categories', data),

  // 更新分类
  update: (id: number, data: UpdateCategoryParams) =>
    request.put<ApiResponse<Category>>(`/v1/categories/${id}`, data),

  // 删除分类
  delete: (id: number) =>
    request.delete<ApiResponse<null>>(`/v1/categories/${id}`),
};
