import request from './request';
import type { ApiResponse, AIRecognitionResult, Bill } from '../types';

export const aiApi = {
  // 识别支付截图
  recognize: (image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    return request.post<ApiResponse<AIRecognitionResult>>('/v1/ai/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 识别并保存账单
  recognizeAndSave: (image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    return request.post<ApiResponse<Bill>>('/v1/ai/recognize-and-save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
