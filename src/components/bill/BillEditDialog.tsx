import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryPicker } from './CategoryPicker';
import { createBill } from '@/api/bill';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface BillEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Record<string, any>;
  onSuccess: () => void;
}

export const BillEditDialog = ({ isOpen, onClose, initialData, onSuccess }: BillEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [form, setForm] = useState({
    amount: '',
    merchant: '',
    remark: '',
    pay_time: '',
    category_id: 1,
    categoryName: '餐饮',
    bill_type: 1 as 1 | 2,
    order_no: ''
  });

  // Map initialData to form when dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      // Basic mapping strategy for Vivo/Common exports
      const amount = initialData['交易金额'] || initialData['金额'] || '';
      const timeStr = initialData['交易时间'] || initialData['时间'] || '';
      const typeStr = initialData['收支类型'] || initialData['类型'] || '';
      const merchant = initialData['交易对方'] || initialData['商户'] || initialData['商品说明'] || ''; // Vivo uses 商品说明 often for merchant-like info if 商户 is missing
      const remark = initialData['备注'] || '';
      const orderNo = initialData['交易单号'] || initialData['订单号'] || '';
      const categoryName = initialData['记账分类'] || '餐饮';

      // Parse Time
      let formattedTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
      if (timeStr) {
        try {
          // Attempt to parse standard formats like "2025/12/15 12:00:00" or "2025-12-15"
          const date = new Date(timeStr.replace(/\//g, '-'));
          if (!isNaN(date.getTime())) {
            formattedTime = format(date, "yyyy-MM-dd'T'HH:mm:ss");
          }
        } catch (e) {
          console.warn('Date parse failed', e);
        }
      }

      setForm({
        amount: String(amount).replace(/[^0-9.]/g, ''),
        merchant: merchant,
        remark: remark,
        pay_time: formattedTime,
        category_id: 1, // Default, user needs to pick if we can't map ID. Ideally backend could return mapped ID but here we only have raw data.
        categoryName: categoryName,
        bill_type: typeStr.includes('收入') ? 2 : 1,
        order_no: orderNo
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    if (!form.amount) return;
    setLoading(true);
    try {
      await createBill({
        amount: form.amount,
        merchant: form.merchant,
        remark: form.remark,
        pay_time: new Date(form.pay_time).toISOString(),
        category_id: form.category_id,
        bill_type: form.bill_type,
        order_no: form.order_no,
        platform: 'Import/ManualCorrection'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create bill', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="修正账单信息">
        <div className="space-y-4">
          {/* Debug/Raw Info - Optional, maybe hidden or small */}
          {/* <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
            原始数据: {JSON.stringify(initialData)}
          </div> */}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                <Input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-8 text-lg font-bold"
                  autoFocus
                />
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer active:bg-gray-100 transition-colors"
              onClick={() => setShowCategoryPicker(true)}
            >
              <span className="text-sm font-medium text-gray-700">分类</span>
              <div className="flex items-center text-sm text-gray-900">
                {form.categoryName}
                <ChevronRight size={16} className="ml-1 text-gray-400" />
              </div>
            </div>

            <Input 
              label="商户/说明"
              value={form.merchant}
              onChange={e => setForm(prev => ({ ...prev, merchant: e.target.value }))}
            />

            <Input 
              label="备注"
              value={form.remark}
              onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间</label>
              <input
                type="datetime-local"
                step="1"
                value={form.pay_time}
                onChange={e => setForm(prev => ({ ...prev, pay_time: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue bg-white"
              />
            </div>
            
            <div className="flex items-center space-x-4 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.bill_type === 1 ? 'border-ios-green bg-ios-green' : 'border-gray-300'}`}>
                  {form.bill_type === 1 && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input type="radio" className="hidden" checked={form.bill_type === 1} onChange={() => setForm(prev => ({ ...prev, bill_type: 1 }))} />
                <span className="text-sm">支出</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.bill_type === 2 ? 'border-ios-red bg-ios-red' : 'border-gray-300'}`}>
                  {form.bill_type === 2 && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input type="radio" className="hidden" checked={form.bill_type === 2} onChange={() => setForm(prev => ({ ...prev, bill_type: 2 }))} />
                <span className="text-sm">收入</span>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSubmit} isLoading={loading} className="w-full h-12 text-base">
              保存并移除错误
            </Button>
          </div>
        </div>
      </Modal>

      <CategoryPicker
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        selectedId={form.category_id}
        onSelect={(cat) => {
          setForm(prev => ({ ...prev, category_id: cat.id, categoryName: cat.name }));
        }}
      />
    </>
  );
};
