import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'primary';
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  variant = 'primary'
}: DialogProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
          />
          {/* 弹窗主体 - 居中定位 */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="pointer-events-auto w-full max-w-[280px] rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 leading-6">{title}</h3>
                {description && (
                  <p className="mt-2 text-[13px] leading-5 text-gray-500">
                    {description}
                  </p>
                )}
              </div>
              <div className="flex border-t border-gray-200/50">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 text-[17px] font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-200/50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3.5 text-[17px] font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    variant === 'danger' ? 'text-ios-red' : 'text-ios-blue'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};