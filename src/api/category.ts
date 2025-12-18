import request from '@/utils/request';

export interface Category {
  id: number;
  name: string;
  type: 1 | 2; // 1: expense, 2: income
  parent_id: number;
  icon: string;
  sort_order: number;
  children?: Category[];
}

export const getCategories = (type?: 1 | 2) => {
  return request.get<Category[]>('/categories', { params: { type } });
};

export const createCategory = (data: Partial<Category>) => {
  return request.post<Category>('/categories', data);
};

export const updateCategory = (id: number, data: Partial<Category>) => {
  return request.put<Category>(`/categories/${id}`, data);
};

export const deleteCategory = (id: number) => {
  return request.delete(`/categories/${id}`);
};
