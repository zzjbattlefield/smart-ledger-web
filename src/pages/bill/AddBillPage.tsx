import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, MessageSquare, Camera, Images } from 'lucide-react';
import { motion } from 'framer-motion';
import { CategoryPicker, NumberKeypad, CategoryAvatar } from '../../components/bill';
import { useToast } from '../../components/ui';
import { useBillStore, useCategoryStore } from '../../store';
import { aiApi } from '../../api';
import { getLocalDateTimeString } from '../../utils/format';
import type { Category } from '../../types';

export function AddBillPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { createBill } = useBillStore();
  const { getCategoryById } = useCategoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [billType, setBillType] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('0');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [payTime, setPayTime] = useState(getLocalDateTimeString());
  const [remark, setRemark] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const selectedCategory = categoryId ? getCategoryById(categoryId) : undefined;

  const handleCategorySelect = (category: Category) => {
    setCategoryId(category.id);
  };

  const handleSubmit = async () => {
    if (amount === '0' || !amount) {
      toast.error('请输入金额');
      return;
    }

    try {
      await createBill({
        amount,
        bill_type: billType,
        category_id: categoryId,
        pay_time: new Date(payTime).toISOString(),
        remark,
      });
      toast.success('添加成功');
      navigate(-1);
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加失败';
      toast.error(message);
    }
  };

  const handleAIRecognize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRecognizing(true);
    try {
      const { data } = await aiApi.recognizeAndSave(file);
      const bill = data.data;
      toast.success('识别成功');
      navigate(`/bill/detail/${bill.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '识别失败';
      toast.error(message);
    } finally {
      setIsRecognizing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 safe-area-top">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-light-text dark:text-dark-text" />
        </button>
        <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
          记一笔
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/bill/batch-upload')}
            className="p-2"
            title="批量导入"
          >
            <Images className="w-6 h-6 text-cta-blue" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecognizing}
            className="p-2 -mr-2"
          >
            {isRecognizing ? (
              <div className="w-6 h-6 border-2 border-cta-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-cta-blue" />
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleAIRecognize}
          className="hidden"
        />
      </header>

      {/* Bill Type Tabs */}
      <div className="flex mx-4 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
        <button
          onClick={() => setBillType(1)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            billType === 1
              ? 'bg-light-card dark:bg-dark-card text-expense-red shadow-sm'
              : 'text-light-text-secondary dark:text-dark-text-secondary'
          }`}
        >
          支出
        </button>
        <button
          onClick={() => setBillType(2)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            billType === 2
              ? 'bg-light-card dark:bg-dark-card text-income-green shadow-sm'
              : 'text-light-text-secondary dark:text-dark-text-secondary'
          }`}
        >
          收入
        </button>
      </div>

      {/* Amount Display */}
      <div className="flex-1 px-4 py-8">
        <div className="text-center mb-8">
          <span className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
            ¥
          </span>
          <motion.span
            key={amount}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`text-5xl font-bold ml-2 tabular-nums ${
              billType === 1 ? 'text-expense-red' : 'text-income-green'
            }`}
          >
            {amount}
          </motion.span>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          {/* Category */}
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="w-full flex items-center gap-3 p-4 bg-light-card dark:bg-dark-card rounded-xl"
          >
            {selectedCategory ? (
              <CategoryAvatar name={selectedCategory.name} className="text-cta-blue" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Tag className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              </div>
            )}
            <span
              className={
                selectedCategory
                  ? 'text-light-text dark:text-dark-text font-medium'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              }
            >
              {selectedCategory?.name || '选择分类'}
            </span>
          </button>

          {/* Date */}
          <div className="flex items-center gap-3 p-4 bg-light-card dark:bg-dark-card rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            </div>
            <input
              type="datetime-local"
              value={payTime}
              onChange={(e) => setPayTime(e.target.value)}
              className="flex-1 bg-transparent text-light-text dark:text-dark-text outline-none"
            />
          </div>

          {/* Remark */}
          <div className="flex items-center gap-3 p-4 bg-light-card dark:bg-dark-card rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            </div>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="添加备注"
              className="flex-1 bg-transparent text-light-text dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary outline-none"
              maxLength={500}
            />
          </div>
        </div>
      </div>

      {/* Number Keypad */}
      <NumberKeypad value={amount} onChange={setAmount} onSubmit={handleSubmit} />

      {/* Category Picker */}
      <CategoryPicker
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        billType={billType}
        selectedId={categoryId}
        onSelect={handleCategorySelect}
      />
    </div>
  );
}
