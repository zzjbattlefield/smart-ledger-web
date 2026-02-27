import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImagePreviewGrid, UploadResultSummary } from '../../components/bill';
import { useToast } from '../../components/ui';
import { aiApi } from '../../api';
import type { Bill } from '../../types';

export interface UploadItem {
  id: string;
  file: File | null;
  preview: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: Bill;
  error?: string;
}

// 可序列化的结果项（用于 sessionStorage）
interface SavedResultItem {
  id: string;
  status: 'success' | 'error';
  result?: Bill;
  error?: string;
}

interface SavedState {
  phase: 'result';
  results: SavedResultItem[];
}

const STORAGE_KEY = 'batch_upload_result';

type PagePhase = 'select' | 'processing' | 'result';

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function BatchUploadPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<UploadItem[]>([]);
  const prevItemsRef = useRef<UploadItem[]>([]);

  const [items, setItems] = useState<UploadItem[]>([]);
  const [phase, setPhase] = useState<PagePhase>('select');
  // 用于存储从 sessionStorage 恢复的纯结果数据
  const [savedResults, setSavedResults] = useState<SavedResultItem[]>([]);

  // 从 sessionStorage 恢复状态
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: SavedState = JSON.parse(saved);
        if (state.phase === 'result' && state.results.length > 0) {
          setSavedResults(state.results);
          setPhase('result');
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // 保存结果到 sessionStorage
  const saveResultsToStorage = useCallback((resultItems: UploadItem[]) => {
    const results: SavedResultItem[] = resultItems
      .filter(i => i.status === 'success' || i.status === 'error')
      .map(i => ({
        id: i.id,
        status: i.status as 'success' | 'error',
        result: i.result,
        error: i.error,
      }));

    const state: SavedState = { phase: 'result', results };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedResults(results);
  }, []);

  // 清除 sessionStorage
  const clearStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSavedResults([]);
  }, []);

  // 跟踪 items 变化：回收被移除的 blob URL；并保持一个最新快照供其它回调使用
  useEffect(() => {
    itemsRef.current = items;

    const prevItems = prevItemsRef.current;
    prevItems.forEach(prevItem => {
      const stillExists = items.some(i => i.id === prevItem.id);
      if (!stillExists && prevItem.preview.startsWith('blob:')) {
        URL.revokeObjectURL(prevItem.preview);
      }
    });

    prevItemsRef.current = items;
  }, [items]);

  // 组件卸载时，回收所有剩余的 blob URL
  useEffect(() => {
    return () => {
      prevItemsRef.current.forEach(item => {
        if (item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, []);

  // 预览图加载失败时的兜底：尝试将 blob URL 替换为 data URL（可规避部分环境对 blob: 的限制）
  const handlePreviewError = useCallback(async (id: string) => {
    const current = itemsRef.current.find(i => i.id === id);
    if (!current?.file) return;
    if (!current.preview.startsWith('blob:')) return;

    try {
      const dataUrl = await fileToDataUrl(current.file);
      URL.revokeObjectURL(current.preview);

      setItems(prev =>
        prev.map(i => (i.id === id ? { ...i, preview: dataUrl } : i))
      );
    } catch {
      // ignore
    }
  }, []);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 清除之前保存的结果
    clearStorage();

    const newItems: UploadItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));

    setItems(prev => [...prev, ...newItems]);

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除图片
  const handleDelete = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  // 处理单张图片
  const processItem = async (item: UploadItem): Promise<UploadItem> => {
    try {
      if (!item.file) {
        return { ...item, status: 'error', error: '原始文件不存在，无法识别' };
      }

      const { data } = await aiApi.recognizeAndSave(item.file);
      return {
        ...item,
        status: 'success',
        result: data.data,
      };
    } catch (err) {
      return {
        ...item,
        status: 'error',
        error: err instanceof Error ? err.message : '识别失败',
      };
    }
  };

  // 并发处理所有图片
  const processAllImages = useCallback(async () => {
    const concurrencyLimit = 3;
    const pendingItems = items.filter(i => (i.status === 'pending' || i.status === 'error') && i.file);

    if (pendingItems.length === 0) {
      toast.error('没有待处理的图片');
      return;
    }

    setPhase('processing');

    // 标记所有待处理项为 processing
    setItems(prev =>
      prev.map(item =>
        item.status === 'pending' || item.status === 'error'
          ? { ...item, status: 'processing' as const }
          : item
      )
    );

    const queue = [...pendingItems];
    let currentItems = [...items];

    const processNext = async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        const result = await processItem(item);

        // 更新单个项目状态
        currentItems = currentItems.map(i => (i.id === item.id ? result : i));
        setItems(currentItems);
      }
    };

    // 启动并发处理
    await Promise.all(
      Array.from({ length: Math.min(concurrencyLimit, pendingItems.length) }, () =>
        processNext()
      )
    );

    // 保存结果到 sessionStorage
    saveResultsToStorage(currentItems);
    setPhase('result');
  }, [items, toast, saveResultsToStorage]);

  // 重试单个失败项（仅在有原始文件时可用）
  const handleRetry = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !item.file) return;

    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, status: 'processing' as const, error: undefined } : i))
    );

    const result = await processItem(item);
    const newItems = items.map(i => (i.id === id ? result : i));
    setItems(newItems);
    saveResultsToStorage(newItems);
  };

  // 重试全部失败项
  const handleRetryAll = async () => {
    const failedItems = items.filter(i => i.status === 'error' && i.file);
    if (failedItems.length === 0) return;

    // 重置失败项状态为 pending
    setItems(prev =>
      prev.map(i => (i.status === 'error' ? { ...i, status: 'pending' as const, error: undefined } : i))
    );

    // 重新处理
    await processAllImages();
  };

  // 继续上传
  const handleContinueUpload = () => {
    clearStorage();
    setPhase('select');
    setItems([]);
  };

  // 完成
  const handleComplete = () => {
    clearStorage();
    navigate('/home');
  };

  // 返回上一页
  const handleBack = () => {
    // 如果在结果页且有保存的结果，保留 storage 以便返回时恢复
    // 如果在其他阶段，清除 storage
    if (phase !== 'result') {
      clearStorage();
    }
    navigate(-1);
  };

  // 点击账单项
  const handleBillClick = (bill: Bill) => {
    navigate(`/bill/detail/${bill.id}`);
  };

  // 合并当前 items 和从 storage 恢复的结果
  const displayItems: UploadItem[] = items.length > 0
    ? items
    : savedResults.map(r => ({
        id: r.id,
        file: null, // 恢复的项没有原始文件
        preview: '', // 恢复的项没有预览图
        status: r.status,
        result: r.result,
        error: r.error,
      }));

  const hasOriginalFiles = items.length > 0;
  const pendingCount = displayItems.filter(i => i.status === 'pending').length;
  const processingCount = displayItems.filter(i => i.status === 'processing').length;
  const successCount = displayItems.filter(i => i.status === 'success').length;
  const errorCount = displayItems.filter(i => i.status === 'error').length;

  const canProcess = phase === 'select' && displayItems.length > 0 && pendingCount === displayItems.length;
  const isProcessing = phase === 'processing' || processingCount > 0;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 safe-area-top">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-light-text dark:text-dark-text" />
        </button>
        <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
          批量导入
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 px-4 pb-4 overflow-auto">
        {/* 选择阶段 - 显示上传区域 */}
        {phase === 'select' && displayItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center"
            style={{ minHeight: 'calc(100vh - 200px)' }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm aspect-video border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-cta-blue dark:hover:border-cta-blue transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-cta-blue/10 flex items-center justify-center">
                <Plus className="w-7 h-7 text-cta-blue" />
              </div>
              <div className="text-center">
                <p className="text-light-text dark:text-dark-text font-medium">
                  选择支付截图
                </p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  支持批量选择多张图片
                </p>
              </div>
            </button>
          </motion.div>
        )}

        {/* 预览/处理/结果阶段 - 显示图片网格 */}
        {displayItems.length > 0 && (
          <div className="space-y-4">
            {/* 状态提示 */}
            {isProcessing && (
              <div className="bg-cta-blue/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-cta-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-cta-blue">
                  正在处理中... ({successCount + errorCount}/{displayItems.length})
                </span>
              </div>
            )}

            {/* 图片预览网格 - 仅在有原始文件时显示 */}
            {hasOriginalFiles && (
              <ImagePreviewGrid
                items={displayItems}
                onDelete={phase === 'select' ? handleDelete : undefined}
                onPreviewError={handlePreviewError}
              />
            )}

            {/* 结果汇总 */}
            {phase === 'result' && (
              <UploadResultSummary
                items={displayItems}
                onBillClick={handleBillClick}
                onRetry={hasOriginalFiles ? handleRetry : undefined}
                onRetryAll={hasOriginalFiles ? handleRetryAll : undefined}
              />
            )}

            {/* 添加更多按钮 - 仅在选择阶段显示 */}
            {phase === 'select' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-light-text-secondary dark:text-dark-text-secondary hover:border-cta-blue hover:text-cta-blue transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>添加更多图片</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="px-4 pb-4 safe-area-bottom">
        {phase === 'select' && displayItems.length > 0 && (
          <button
            onClick={processAllImages}
            disabled={!canProcess}
            className="w-full py-4 bg-cta-blue text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始识别 ({displayItems.length} 张)
          </button>
        )}

        {phase === 'result' && (
          <div className="flex gap-3">
            <button
              onClick={handleContinueUpload}
              className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-light-text dark:text-dark-text font-semibold rounded-xl"
            >
              继续上传
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-4 bg-cta-blue text-white font-semibold rounded-xl"
            >
              完成
            </button>
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
