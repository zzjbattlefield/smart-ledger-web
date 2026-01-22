import request from './request';
import type {
  ApiResponse,
  Bill,
  BillListResponse,
  CreateBillRequest,
  UpdateBillRequest,
  BillListParams,
  ImportResult
} from '../types';

export const billApi = {
  // 获取账单列表
  getList: (params?: BillListParams) =>
    request.get<ApiResponse<BillListResponse>>('/v1/bills', { params }),

  // 获取账单详情
  getDetail: (id: number) =>
    request.get<ApiResponse<Bill>>(`/v1/bills/${id}`),

  // 创建账单
  create: (data: CreateBillRequest) =>
    request.post<ApiResponse<Bill>>('/v1/bills', data),

  // 更新账单
  update: (id: number, data: UpdateBillRequest) =>
    request.put<ApiResponse<Bill>>(`/v1/bills/${id}`, data),

  // 删除账单
  delete: (id: number) =>
    request.delete<ApiResponse<null>>(`/v1/bills/${id}`),

  // 导入账单
  import: (file: File, parserType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parser_type', parserType);
    return request.post<ApiResponse<ImportResult>>('/v1/bills/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
