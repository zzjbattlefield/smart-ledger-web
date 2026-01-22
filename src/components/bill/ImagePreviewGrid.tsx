import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UploadItem } from '../../pages/bill/BatchUploadPage';

interface ImagePreviewGridProps {
  items: UploadItem[];
  onDelete?: (id: string) => void;
}

export function ImagePreviewGrid({ items, onDelete }: ImagePreviewGridProps) {
  const getStatusIndicator = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return null;
      case 'processing':
        return (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        );
      case 'success':
        return (
          <div className="absolute top-2 right-2 w-6 h-6 bg-income-green rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        );
      case 'error':
        return (
          <div className="absolute top-2 right-2 w-6 h-6 bg-expense-red rounded-full flex items-center justify-center shadow-lg">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative aspect-square"
        >
          <img
            src={item.preview}
            alt={`预览 ${index + 1}`}
            className="w-full h-full object-cover rounded-xl"
          />

          {/* 状态指示器 */}
          {getStatusIndicator(item.status)}

          {/* 删除按钮 - 仅在可删除且状态为 pending 时显示 */}
          {onDelete && item.status === 'pending' && (
            <button
              onClick={() => onDelete(item.id)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
