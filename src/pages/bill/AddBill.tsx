import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Camera, Loader2, ImagePlus, Trash2, Keyboard, RefreshCcw, AlertCircle, ChevronRight } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryPicker } from '@/components/bill/CategoryPicker';
import { recognizeBill, recognizeAndSaveBill, RecognizeResponse } from '@/api/ai';
import { createBill, updateBill, Bill } from '@/api/bill';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { toLocalISOString } from '@/utils/date';

interface QueueItem {
  id: string;
  file: File | null; // null represents manual entry
  previewUrl: string | null;
  status: 'waiting' | 'analyzing' | 'success' | 'error' | 'saving' | 'completed';
  result?: RecognizeResponse;
  billId?: number; // Store ID after save
  form: {
    amount: string;
    merchant: string;
    remark: string;
    pay_time: string;
    category_id: number;
    categoryName: string;
    bill_type: 1 | 2;
  };
}

// Simple Switch Component
const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => onChange(!checked)}>
    <div className={cn("w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out", checked ? "bg-ios-green" : "bg-gray-200")}>
      <div className={cn("bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out", checked ? "translate-x-5" : "translate-x-0")} />
    </div>
    <span className="text-sm font-medium text-gray-600">{label}</span>
  </div>
);

const AddBill = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  // 默认开启自动提交，并记住用户选择
  const [autoSubmit, setAutoSubmit] = useState(() => {
    const saved = localStorage.getItem('sl_auto_submit');
    return saved !== null ? saved === 'true' : true;
  });

  // 同步自动提交设置到本地存储
  useEffect(() => {
    localStorage.setItem('sl_auto_submit', String(autoSubmit));
  }, [autoSubmit]);
  
  const activeItem = queue.find(item => item.id === activeId);

  const getCurrentTimeStr = () => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");

  // Create base form data
  const createInitialForm = () => ({
    amount: '',
    merchant: '',
    remark: '',
    pay_time: getCurrentTimeStr(),
    category_id: 1,
    categoryName: '餐饮',
    bill_type: 1 as const,
  });

  // Handle Manual Entry Add
  const handleManualAdd = () => {
    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      file: null,
      previewUrl: null,
      status: 'success', // Manual entry is ready to edit immediately
      form: createInitialForm()
    };
    setQueue(prev => [...prev, newItem]);
    setActiveId(newItem.id);
  };

  // Handle File Select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: QueueItem[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'waiting',
      form: createInitialForm()
    }));

    setQueue(prev => [...prev, ...newItems]);
    if (!activeId && newItems.length > 0) {
      setActiveId(newItems[0].id);
    }
    // Clear input so same file can be selected again if needed
    e.target.value = '';
  };

  // Process Queue Effect
  useEffect(() => {
    const processItem = async (item: QueueItem) => {
      // 1. Mark as analyzing
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'analyzing' } : i));

      try {
        if (!item.file) throw new Error("No file");
        
        let savedBill: Bill | null = null;
        let formToUpdate = null;

        if (autoSubmit) {
           // Auto Submit Mode: Direct recognize-and-save
           const { data } = await recognizeAndSaveBill(item.file);
           savedBill = data.data; 
           
           // Construct form from saved data
           formToUpdate = {
             amount: savedBill.amount.toString(),
             merchant: savedBill.merchant || '',
             pay_time: savedBill.pay_time ? format(new Date(savedBill.pay_time), "yyyy-MM-dd'T'HH:mm:ss") : getCurrentTimeStr(),
             remark: savedBill.remark || '',
             category_id: savedBill.category?.id || 1,
             categoryName: savedBill.category?.name || '餐饮',
             bill_type: savedBill.bill_type || 1,
           };
           
           // Logic: If multiple items, keep in queue as completed. If single, return.
           setQueue(prev => {
             // Check current queue length inside updater to get latest state
             if (prev.length === 1) {
               navigate(-1);
               return prev; // Component will unmount
             }
             
             // Mark as completed and store ID
             const nextQueue = prev.map(i => i.id === item.id ? { 
               ...i, 
               status: 'completed' as const, 
               billId: savedBill!.id,
               form: formToUpdate!
             } : i);
             
             // Auto-select next waiting item if active was the current one
             if (activeId === item.id) {
               const nextWaiting = nextQueue.find(i => i.status === 'waiting' || i.status === 'error');
               if (nextWaiting) setActiveId(nextWaiting.id);
             }
             
             return nextQueue;
           });
        } else {
          // Manual Mode: Call AI for preview
          const { data } = await recognizeBill(item.file);
          const res = data.data;

          formToUpdate = {
            amount: res.amount.toString(),
            merchant: res.merchant,
            pay_time: res.pay_time ? format(new Date(res.pay_time), "yyyy-MM-dd'T'HH:mm:ss") : getCurrentTimeStr(),
            remark: `${res.platform || ''} - ${res.items?.[0]?.name || ''}`,
            category_id: 1, // 暂无法从名称反推ID，后续可优化
            categoryName: res.category || '餐饮', // AI 返回的分类名
            bill_type: (res.bill_type as 1 | 2) || 1,
          };

          // Update to success and wait for user confirmation
          setQueue(prev => prev.map(i => {
            if (i.id === item.id) {
              return {
                ...i,
                status: 'success',
                result: res,
                form: formToUpdate!
              };
            }
            return i;
          }));
        }

      } catch (error) {
        console.error('Processing failed', error);
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    };

    // Find next waiting item
    const nextItem = queue.find(item => item.status === 'waiting');
    if (nextItem) {
      processItem(nextItem);
    }
  }, [queue, autoSubmit, navigate]);

  // Handle Retry
  const handleRetry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'waiting' } : item
    ));
  };

  const updateForm = (field: keyof QueueItem['form'], value: any) => {
    if (!activeId) return;
    setQueue(prev => prev.map(item => 
      item.id === activeId ? { ...item, form: { ...item.form, [field]: value } } : item
    ));
  };

  const handleTypeChange = (type: 1 | 2) => {
    if (!activeId || activeItem?.form.bill_type === type) return;
    setQueue(prev => prev.map(item => 
        item.id === activeId ? { 
            ...item, 
            form: { 
                ...item.form, 
                bill_type: type,
                category_id: 0,
                categoryName: '请选择分类' 
            } 
        } : item
    ));
  };

  const handleSaveCurrent = async () => {
    if (!activeItem || !activeItem.form.amount) return;
    
    setQueue(prev => prev.map(i => i.id === activeId ? { ...i, status: 'saving' } : i));
    
    try {
      let savedBill;
      
      // If already completed (has ID), perform Update. Otherwise Create.
      if (activeItem.status === 'completed' && activeItem.billId) {
         const { data } = await updateBill(activeItem.billId, {
           ...activeItem.form,
           pay_time: toLocalISOString(activeItem.form.pay_time),
           // category update if needed
         });
         savedBill = data.data; // Assuming update returns the bill
      } else {
         const { data } = await createBill({
          ...activeItem.form,
          pay_time: toLocalISOString(activeItem.form.pay_time),
          uuid: crypto.randomUUID(),
          platform: activeItem.file ? 'AI/ManualConfirm' : 'Manual',
          bill_type: activeItem.form.bill_type,
          category: { id: activeItem.form.category_id, name: 'General', icon: 'food' }
        });
        savedBill = data.data;
      }

      setQueue(prev => {
        if (prev.length === 1) {
          navigate(-1);
          return prev;
        }

        const nextQueue = prev.map(item => item.id === activeId ? { 
          ...item, 
          status: 'completed' as const,
          billId: savedBill.id 
        } : item);

        // If we just saved the current item, try to move to the next 'waiting' or 'success' (unsaved) item
        // Priority: waiting -> success (unsaved) -> stay
        const nextTodo = nextQueue.find(i => i.id !== activeId && (i.status === 'waiting' || i.status === 'success' || i.status === 'error'));
        if (nextTodo) {
          setActiveId(nextTodo.id);
        }
        
        return nextQueue;
      });
    } catch (error) {
      console.error('Save failed', error);
      // Revert status on error. If it was completed, stay completed? Or go back to success/error?
      // Simple revert:
      setQueue(prev => prev.map(i => i.id === activeId ? { ...i, status: activeItem.billId ? 'completed' : 'success' } : i)); 
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setQueue(prev => {
      const next = prev.filter(item => item.id !== id);
      if (activeId === id) {
        if (next.length > 0) setActiveId(next[0].id);
        else setActiveId(null);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen flex-col bg-ios-background relative z-50">
      <Header 
        title="记一笔"
        className="bg-ios-background border-b-0"
        rightAction={
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-ios-blue font-normal px-0">
            {queue.some(item => item.status === 'completed') ? '完成' : '取消'}
          </Button>
        }
      />
      
      {/* Control Bar */}
      <div className="px-4 py-2 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-gray-100 z-10">
        <Switch 
          checked={autoSubmit} 
          onChange={setAutoSubmit} 
          label="识别后自动提交" 
        />
        <span className="text-xs text-gray-400">
          {queue.length > 0 ? `${queue.length} 个待处理` : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {queue.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center space-y-4 text-gray-400 cursor-pointer p-10 border-2 border-dashed border-gray-300 rounded-3xl active:bg-gray-50 transition-colors w-full max-w-sm hover:border-ios-blue hover:text-ios-blue"
            >
              <Camera size={64} strokeWidth={1} />
              <div className="text-center">
                <p className="text-lg font-medium text-current">批量识别账单</p>
                <p className="text-sm opacity-70">支持多图上传 • AI 自动解析</p>
              </div>
            </div>

            <div className="flex items-center w-full max-w-sm px-4">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="px-4 text-gray-400 text-sm">或者</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <Button 
              variant="secondary" 
              className="w-full max-w-sm shadow-sm bg-white text-ios-text hover:bg-gray-50 border border-gray-100 h-14 text-base"
              onClick={handleManualAdd}
            >
              <Keyboard className="mr-2 h-5 w-5 text-gray-500" />
              手动录入
            </Button>
          </div>
        ) : activeItem ? (
          // Editor
          <div className="space-y-6 mt-4">
            {/* Preview Area */}
            {activeItem.file ? (
              <div className="relative aspect-video w-full rounded-2xl bg-black/5 overflow-hidden shadow-inner border border-black/5">
                <img src={activeItem.previewUrl!} alt="Preview" className="h-full w-full object-contain" />
                
                {/* Status Overlays */}
                {activeItem.status === 'analyzing' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-sm font-medium">AI 正在识别...</span>
                    </div>
                  </div>
                )}
                {activeItem.status === 'saving' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                     <div className="flex flex-col items-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-sm font-medium">正在保存...</span>
                    </div>
                  </div>
                )}
                {activeItem.status === 'error' && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-center">
                    <AlertCircle className="h-10 w-10 text-white mb-2 opacity-80" />
                    <span className="text-white font-medium mb-4">识别失败</span>
                    <Button size="sm" onClick={(e) => handleRetry(e, activeItem.id)} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none">
                      <RefreshCcw className="mr-2 h-4 w-4" /> 重试
                    </Button>
                  </div>
                )}
                
                <button 
                  onClick={(e) => handleDelete(e, activeItem.id)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors backdrop-blur-md"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              // Manual Entry Header
              <div className="relative h-32 w-full rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100">
                <div className="flex flex-col items-center text-ios-blue">
                  <Keyboard size={32} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium">手动录入模式</span>
                </div>
                 <button 
                  onClick={(e) => handleDelete(e, activeItem.id)}
                  className="absolute top-2 right-2 p-2 bg-white/50 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-6 pb-24">
              
              {/* Type Switcher */}
              <div className="flex justify-center">
                <div className="bg-gray-100 p-1 rounded-xl flex space-x-1">
                   <button
                     onClick={() => handleTypeChange(1)}
                     className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", activeItem.form.bill_type === 1 ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700")}
                   >支出</button>
                   <button
                     onClick={() => handleTypeChange(2)}
                     className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", activeItem.form.bill_type === 2 ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700")}
                   >收入</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <div className="relative">
                   <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">金额</label>
                   <div className="flex items-center mt-1">
                     <span className="text-3xl font-bold text-ios-text mr-2">¥</span>
                     <input 
                       type="number" 
                       value={activeItem.form.amount}
                       onChange={e => updateForm('amount', e.target.value)}
                       className="w-full text-4xl font-bold text-ios-text bg-transparent focus:outline-none placeholder:text-gray-200"
                       placeholder="0.00"
                       autoFocus
                     />
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-1 shadow-sm space-y-1">
                {/* 分类选择 */}
                <div 
                  className="flex items-center justify-between px-4 h-12 active:bg-gray-50 transition-colors cursor-pointer rounded-t-lg"
                  onClick={() => setShowCategoryPicker(true)}
                >
                  <span className="text-gray-400">分类</span>
                  <div className="flex items-center text-ios-text font-medium">
                    {activeItem.form.categoryName}
                    <ChevronRight size={18} className="text-gray-300 ml-1" />
                  </div>
                </div>
                <div className="h-px bg-gray-100 mx-4" />

                <Input 
                  placeholder="商户名称" 
                  value={activeItem.form.merchant} 
                  onChange={e => updateForm('merchant', e.target.value)}
                  className="border-none bg-transparent focus:bg-gray-50 rounded-lg"
                />
                <div className="h-px bg-gray-100 mx-4" />
                <Input 
                  placeholder="备注信息" 
                  value={activeItem.form.remark} 
                  onChange={e => updateForm('remark', e.target.value)}
                  className="border-none bg-transparent focus:bg-gray-50 rounded-lg"
                />
                <div className="h-px bg-gray-100 mx-4" />
                 <input
                  type="datetime-local"
                  step="1" 
                  value={activeItem.form.pay_time}
                  onChange={e => updateForm('pay_time', e.target.value)}
                  className="w-full h-12 rounded-lg bg-transparent px-4 text-ios-text focus:outline-none focus:bg-gray-50 font-sans"
                />
              </div>

              <div className="pt-2">
                <Button 
                  className={cn(
                    "w-full h-14 text-lg shadow-xl", 
                    activeItem.status === 'completed' ? "bg-ios-green shadow-ios-green/40" : "shadow-ios-blue/40"
                  )}
                  onClick={handleSaveCurrent}
                  isLoading={activeItem.status === 'saving'}
                  disabled={!activeItem.form.amount || activeItem.status === 'analyzing'}
                >
                  {activeItem.status === 'completed' ? '更新账单' : '确认并保存'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Queue Bar */}
      {queue.length > 0 && (
        <div className="h-24 bg-white border-t border-gray-100 flex items-center px-4 space-x-3 overflow-x-auto no-scrollbar pb-safe">
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="flex-shrink-0 h-16 w-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:bg-gray-50 cursor-pointer hover:border-ios-blue hover:text-ios-blue transition-colors"
           >
             <ImagePlus size={24} />
           </div>
           
           {/* Manual Add Small Button */}
            <div 
             onClick={handleManualAdd}
             className="flex-shrink-0 h-16 w-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:bg-gray-50 cursor-pointer hover:border-ios-blue hover:text-ios-blue transition-colors"
           >
             <Keyboard size={24} />
           </div>

           {queue.map((item) => (
             <div 
               key={item.id}
               onClick={() => setActiveId(item.id)}
               className={cn(
                 "relative flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-gray-50",
                 activeId === item.id ? "border-ios-blue ring-2 ring-ios-blue/20" : "border-transparent",
                 item.status === 'error' && "border-ios-red"
               )}
             >
               {item.previewUrl ? (
                 <img src={item.previewUrl} className="h-full w-full object-cover" />
               ) : (
                 <div className="h-full w-full flex flex-col items-center justify-center bg-blue-50/50">
                   <span className="text-xs font-bold text-ios-blue truncate w-full text-center px-0.5">
                     {item.form.amount ? `¥${item.form.amount}` : '新账单'}
                   </span>
                   <span className="text-xs text-ios-blue/60 scale-75 transform -mt-0.5">
                      {item.form.bill_type === 1 ? '支' : '收'}
                   </span>
                 </div>
               )}
               
               {/* Queue Status Indicators */}
               {item.status === 'analyzing' && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                   <Loader2 size={16} className="text-white animate-spin" />
                 </div>
               )}
               {item.status === 'success' && (
                 <div className="absolute bottom-0 right-0 p-0.5 bg-ios-blue rounded-tl-md">
                   <span className="text-[8px] text-white px-1">待确认</span>
                 </div>
               )}
               {item.status === 'completed' && (
                 <>
                   <div className="absolute inset-0 border-2 border-ios-green rounded-xl pointer-events-none" />
                   <div className="absolute bottom-0 right-0 p-0.5 bg-ios-green rounded-tl-md">
                     <Check size={10} className="text-white" />
                   </div>
                 </>
               )}
               {item.status === 'error' && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-ios-red">
                   <AlertCircle size={16} />
                 </div>
               )}
             </div>
           ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple 
        onChange={handleFileSelect} 
      />
      
      <CategoryPicker
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        selectedId={activeItem?.form.category_id || 0}
        type={activeItem?.form.bill_type}
        onSelect={(cat) => {
          updateForm('category_id', cat.id);
          updateForm('categoryName', cat.name);
        }}
      />
    </div>
  );
};

export default AddBill;