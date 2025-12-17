import request from '@/utils/request';

export interface Bill {
  id: number;
  uuid: string;
  amount: string;
  bill_type: 1 | 2; // 1: expense, 2: income
  platform: string;
  merchant: string;
  category: {
    id: number;
    name: string;
    icon: string;
  };
  pay_time: string;
  remark: string;
}

export interface BillListParams {
  page?: number;
  page_size?: number;
  date?: string; // YYYY-MM
}

interface BillListResponse {
  list: Bill[];
  total: number;
  page: number;
  page_size: number;
}

export const getBills = (params: BillListParams) => {
  return request.get<BillListResponse>('/bills', { params });
};

export const createBill = (data: Partial<Bill>) => {
  return request.post<Bill>('/bills', data);
};

export const getBillDetail = (id: number | string) => {
  return request.get<Bill>(`/bills/${id}`);
};

export const updateBill = (id: number | string, data: Partial<Bill>) => {
  return request.put<Bill>(`/bills/${id}`, data);
};

export const deleteBill = (id: number | string) => {
  return request.delete(`/bills/${id}`);
};

export interface ImportBillError {
  row: number;
  column?: string;
  message: string;
  row_data?: Record<string, any>;
}

export interface ImportBillResponse {
  total: number;
  failed: number;
  errors: ImportBillError[];
}

export const importBills = (file: File, parserType: string = 'vivo') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('parser_type', parserType);
  
  return request.post<ImportBillResponse>('/bills/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
