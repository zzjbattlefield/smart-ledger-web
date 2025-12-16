import request from '@/utils/request';

export interface Category {
  id: number;
  name: string;
  parent_id: number;
  icon: string;
  sort_order: number;
  children?: Category[];
}

export const getCategories = () => {
  return request.get<Category[]>('/categories');
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
