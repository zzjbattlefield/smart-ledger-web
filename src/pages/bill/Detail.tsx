import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Pencil, Trash2, ChevronLeft, CreditCard, Calendar, Tag, FileText, Loader2, ListTree } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { CategoryPicker } from '@/components/bill/CategoryPicker';
import { getBillDetail, deleteBill, updateBill, Bill } from '@/api/bill';
import { formatCurrency, toLocalISOString } from '@/utils/date';
import { cn } from '@/utils/cn';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 弹窗状态
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState<Partial<Bill>>({});
  const [saving, setSaving] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const { data } = await getBillDetail(id!);
      setBill(data.data);
      setEditForm(data.data);
    } catch (error) {
      console.error('获取详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteBill(id!);
      navigate(-1);
    } catch (error) {
      console.error('删除失败', error);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // 构造更新数据，确保 category_id 正确
      const payload = {
        ...editForm,
        pay_time: editForm.pay_time ? toLocalISOString(editForm.pay_time) : undefined,
        category_id: editForm.category?.id || bill?.category.id
      };
      
      await updateBill(id!, payload);
      // 重新获取最新详情，因为分类对象可能需要从后端更新
      await fetchDetail();
      setIsEditing(false);
    } catch (error) {
      console.error('更新失败', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-background pt-14 flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mr-2" /> 加载中...
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="min-h-screen bg-ios-background flex flex-col">
      <Header 
        title={isEditing ? "编辑账单" : "账单详情"}
        className="bg-ios-background border-b-0"
        leftAction={
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-ios-blue font-normal px-0">
            <ChevronLeft size={24} className="mr-1" />
            返回
          </Button>
        }
      />

      <div className="flex-1 px-4 pt-20 pb-20 overflow-y-auto">
        {/* 主要卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
          <div className="text-sm text-gray-400 mb-1">金额</div>
          {isEditing ? (
             <div className="flex justify-center items-center">
               <span className="text-2xl font-bold mr-1">¥</span>
               <input 
                 className="text-4xl font-bold text-center w-40 border-b border-gray-200 focus:outline-none focus:border-ios-blue bg-transparent"
                 value={editForm.amount}
                 type="number"
                 onChange={e => setEditForm({...editForm, amount: e.target.value})}
               />
             </div>
          ) : (
            <div className={cn("text-4xl font-bold mb-2", bill.bill_type === 1 ? "text-ios-text" : "text-ios-green")}>
              {bill.bill_type === 1 ? '-' : '+'}{formatCurrency(bill.amount).replace('CN¥', '')}
            </div>
          )}
          
          <div 
            onClick={() => isEditing && setShowCategoryPicker(true)}
            className={cn(
              "text-sm bg-gray-100 text-gray-500 py-1 px-3 rounded-full inline-flex items-center mt-2 transition-colors",
              isEditing && "bg-blue-50 text-ios-blue cursor-pointer active:bg-blue-100"
            )}
          >
            {editForm.category?.name || bill.category?.name || '未分类'}
            {isEditing && <ListTree size={12} className="ml-1" />}
          </div>
        </div>

        {/* 详细信息列表 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm space-y-px">
          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center text-gray-500">
              <CreditCard size={18} className="mr-3" />
              <span className="text-sm">商户</span>
            </div>
            {isEditing ? (
              <input 
                className="text-right text-sm font-medium focus:outline-none bg-gray-50 rounded px-2 py-1"
                value={editForm.merchant || ''}
                onChange={e => setEditForm({...editForm, merchant: e.target.value})}
              />
            ) : (
              <span className="text-sm font-medium">{bill.merchant || '-'}</span>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center text-gray-500">
              <Calendar size={18} className="mr-3" />
              <span className="text-sm">时间</span>
            </div>
             {isEditing ? (
              <input 
                type="datetime-local"
                step="1"
                className="text-right text-sm font-medium focus:outline-none bg-gray-50 rounded px-2 py-1"
                value={editForm.pay_time ? format(new Date(editForm.pay_time), "yyyy-MM-dd'T'HH:mm:ss") : ''}
                onChange={e => setEditForm({...editForm, pay_time: e.target.value})}
              />
            ) : (
              <span className="text-sm font-medium">
                {format(new Date(bill.pay_time), "yyyy年MM月dd日 HH:mm:ss")}
              </span>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center text-gray-500">
              <FileText size={18} className="mr-3" />
              <span className="text-sm">备注</span>
            </div>
             {isEditing ? (
              <input 
                className="text-right text-sm font-medium focus:outline-none bg-gray-50 rounded px-2 py-1 w-40"
                value={editForm.remark || ''}
                onChange={e => setEditForm({...editForm, remark: e.target.value})}
              />
            ) : (
              <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{bill.remark || '-'}</span>
            )}
          </div>
          
           <div className="h-px bg-gray-100 mx-4" />
           
           <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center text-gray-500">
              <Tag size={18} className="mr-3" />
              <span className="text-sm">平台</span>
            </div>
             {isEditing ? (
              <input 
                className="text-right text-sm font-medium focus:outline-none bg-gray-50 rounded px-2 py-1 w-32"
                value={editForm.platform || ''}
                onChange={e => setEditForm({...editForm, platform: e.target.value})}
              />
            ) : (
              <span className="text-sm font-medium text-gray-900">{bill.platform || '手动录入'}</span>
            )}
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="mt-8 flex gap-4">
          {isEditing ? (
            <>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(bill); // Reset
                }}
              >
                取消
              </Button>
              <Button 
                className="flex-1 shadow-lg shadow-ios-blue/30"
                onClick={handleUpdate}
                isLoading={saving}
              >
                保存修改
              </Button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 h-12 rounded-xl border border-ios-red/30 text-ios-red font-medium flex items-center justify-center active:bg-red-50 transition-colors"
              >
                <Trash2 size={18} className="mr-2" />
                删除
              </button>
              <Button 
                className="flex-1 shadow-lg shadow-ios-blue/30"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={18} className="mr-2" />
                编辑
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* 弹窗组件 */}
      <Dialog 
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="删除账单"
        description="确定要删除这条账单吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        onConfirm={handleDelete}
      />
      
      <CategoryPicker
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        selectedId={editForm.category?.id || 0}
        onSelect={(cat) => setEditForm({ ...editForm, category: { ...editForm.category!, id: cat.id, name: cat.name } })}
      />
    </div>
  );
};

export default BillDetail;
