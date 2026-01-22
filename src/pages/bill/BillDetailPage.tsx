import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button, Dialog, useToast, Skeleton } from '../../components/ui';
import { CategoryPicker, CategoryAvatar } from '../../components/bill';
import { billApi } from '../../api';
import { useBillStore, useCategoryStore } from '../../store';
import type { Bill, Category } from '../../types';
import { formatAmount } from '../../utils/format';

export function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { deleteBill, updateBill } = useBillStore();
  const { getCategoryById } = useCategoryStore();

  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Edit form state
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>();
  const [editRemark, setEditRemark] = useState('');
  const [editBillType, setEditBillType] = useState<1 | 2>(1);
  const [editPayTime, setEditPayTime] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editPlatform, setEditPlatform] = useState('');
  const [editPayMethod, setEditPayMethod] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchBill = async () => {
      try {
        const { data } = await billApi.getDetail(parseInt(id));
        setBill(data.data);
        setEditAmount(data.data.amount);
        setEditCategoryId(data.data.category?.id);
        setEditRemark(data.data.remark);
        setEditBillType(data.data.bill_type);
        setEditPayTime(data.data.pay_time);
        setEditMerchant(data.data.merchant || '');
        setEditPlatform(data.data.platform || '');
        setEditPayMethod(data.data.pay_method || '');
      } catch {
        toast.error('获取账单详情失败');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBill();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!bill) return;
    try {
      await deleteBill(bill.id);
      toast.success('删除成功');
      navigate(-1);
    } catch {
      toast.error('删除失败');
    }
  };

  const handleSave = async () => {
    if (!bill) return;
    try {
      const updated = await updateBill(bill.id, {
        amount: editAmount,
        bill_type: editBillType,
        category_id: editCategoryId,
        remark: editRemark,
        pay_time: editPayTime,
        merchant: editMerchant,
        platform: editPlatform,
        pay_method: editPayMethod,
      });
      setBill(updated);
      setIsEditing(false);
      toast.success('保存成功');
    } catch {
      toast.error('保存失败');
    }
  };

  const handleCategorySelect = (category: Category) => {
    setEditCategoryId(category.id);
  };

  const selectedCategory = editCategoryId ? getCategoryById(editCategoryId) : undefined;
  const isExpense = isEditing ? editBillType === 1 : bill?.bill_type === 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg p-4 safe-area-top">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-16 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 safe-area-top">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-light-text dark:text-dark-text" />
        </button>
        <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
          账单详情
        </h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="p-2">
                <X className="w-5 h-5 text-light-text-secondary" />
              </button>
              <button onClick={handleSave} className="p-2">
                <Check className="w-5 h-5 text-cta-blue" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="p-2">
                <Edit2 className="w-5 h-5 text-cta-blue" />
              </button>
              <button onClick={() => setShowDeleteDialog(true)} className="p-2">
                <Trash2 className="w-5 h-5 text-expense-red" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Bill Type Switch (Edit Mode) */}
        {isEditing && (
          <div className="flex mx-0 mb-4 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
            <button
              onClick={() => setEditBillType(1)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                editBillType === 1
                  ? 'bg-light-card dark:bg-dark-card text-expense-red shadow-sm'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              }`}
            >
              支出
            </button>
            <button
              onClick={() => setEditBillType(2)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                editBillType === 2
                  ? 'bg-light-card dark:bg-dark-card text-income-green shadow-sm'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              }`}
            >
              收入
            </button>
          </div>
        )}

        {/* Amount */}
        <div className="text-center mb-8">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
            {isExpense ? '支出' : '收入'}
          </p>
          {isEditing ? (
            <div className="flex items-center justify-center">
              <span className="text-2xl text-light-text-secondary">¥</span>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className={`text-4xl font-bold bg-transparent text-center outline-none w-40 ${
                  isExpense ? 'text-expense-red' : 'text-income-green'
                }`}
              />
            </div>
          ) : (
            <p
              className={`text-4xl font-bold ${
                isExpense ? 'text-expense-red' : 'text-income-green'
              }`}
            >
              {isExpense ? '-' : '+'}¥{formatAmount(bill.amount)}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="card space-y-4">
          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">
              分类
            </span>
            {isEditing ? (
              <button
                onClick={() => setShowCategoryPicker(true)}
                className="flex items-center gap-2 text-cta-blue"
              >
                <CategoryAvatar name={selectedCategory?.name || bill?.category?.name || '?'} size="sm" />
                {selectedCategory?.name || bill?.category?.name || '选择分类'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <CategoryAvatar name={bill?.category?.name || '?'} size="sm" />
                <span className="text-light-text dark:text-dark-text">
                  {bill?.category?.name || '未分类'}
                </span>
              </div>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center justify-between">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">
              时间
            </span>
            {isEditing ? (
              <input
                type="datetime-local"
                value={editPayTime.slice(0, 16)}
                onChange={(e) => setEditPayTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="text-right bg-transparent text-light-text dark:text-dark-text outline-none"
              />
            ) : (
              <span className="text-light-text dark:text-dark-text">
                {new Date(bill.pay_time).toLocaleString('zh-CN')}
              </span>
            )}
          </div>

          {/* Merchant */}
          {(isEditing || bill.merchant) && (
            <div className="flex items-center justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                商户
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  placeholder="输入商户名称"
                  className="text-right bg-transparent text-light-text dark:text-dark-text outline-none"
                />
              ) : (
                <span className="text-light-text dark:text-dark-text">{bill.merchant || '-'}</span>
              )}
            </div>
          )}

          {/* Platform */}
          {(isEditing || bill.platform) && (
            <div className="flex items-center justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                平台
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  placeholder="输入平台名称"
                  className="text-right bg-transparent text-light-text dark:text-dark-text outline-none"
                />
              ) : (
                <span className="text-light-text dark:text-dark-text">{bill.platform || '-'}</span>
              )}
            </div>
          )}

          {/* Pay Method */}
          {(isEditing || bill.pay_method) && (
            <div className="flex items-center justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                支付方式
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editPayMethod}
                  onChange={(e) => setEditPayMethod(e.target.value)}
                  placeholder="输入支付方式"
                  className="text-right bg-transparent text-light-text dark:text-dark-text outline-none"
                />
              ) : (
                <span className="text-light-text dark:text-dark-text">
                  {bill.pay_method || '-'}
                </span>
              )}
            </div>
          )}

          {/* Remark */}
          <div className="flex items-center justify-between">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">
              备注
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                placeholder="添加备注"
                className="text-right bg-transparent text-light-text dark:text-dark-text outline-none"
              />
            ) : (
              <span className="text-light-text dark:text-dark-text">
                {bill.remark || '-'}
              </span>
            )}
          </div>

          {/* Confidence (for AI recognized bills) */}
          {bill.confidence > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                AI 识别置信度
              </span>
              <span className="text-light-text dark:text-dark-text">
                {(bill.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="确认删除"
      >
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
          确定要删除这笔账单吗？此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowDeleteDialog(false)}
          >
            取消
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            删除
          </Button>
        </div>
      </Dialog>

      {/* Category Picker */}
      <CategoryPicker
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        billType={editBillType}
        selectedId={editCategoryId}
        onSelect={handleCategorySelect}
      />
    </div>
  );
}
