import request from '@/utils/request';
import { Bill } from './bill';

export interface RecognizeResponse {
  platform: string;
  amount: number;
  merchant: string;
  bill_type: 1 | 2;
  category: string; // Returns category name, need to map to ID
  sub_category: string;
  pay_time: string;
  pay_method: string;
  order_no: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  confidence: number;
}

export const recognizeBill = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return request.post<RecognizeResponse>('/ai/recognize', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 90000, // AI might be slow
  });
};

export const recognizeAndSaveBill = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return request.post<Bill>('/ai/recognize-and-save', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 90000,
  });
};
