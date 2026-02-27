import { useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { motion, useMotionValue, type PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Bill } from '../../types';
import { formatAmount, formatTime } from '../../utils/format';
import { CategoryAvatar } from './CategoryAvatar';

interface BillItemProps {
  bill: Bill;
  onDelete?: (id: number) => void;
  onClick?: () => void;
}

const SWIPE_OPEN_OFFSET = -80;
const SWIPE_OPEN_THRESHOLD = -40;

export function BillItem({ bill, onDelete, onClick }: BillItemProps) {
  const x = useMotionValue(0);
  const [isSwipedOpen, setIsSwipedOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const closeSwipe = useCallback(() => {
    x.stop();
    x.set(0);
    setIsSwipedOpen(false);
  }, [x]);

  const openSwipe = useCallback(() => {
    x.stop();
    x.set(SWIPE_OPEN_OFFSET);
    setIsSwipedOpen(true);
  }, [x]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!onDelete) {
      setIsDragging(false);
      return;
    }

    if (info.offset.x <= SWIPE_OPEN_THRESHOLD) {
      openSwipe();
    } else {
      closeSwipe();
    }

    requestAnimationFrame(() => setIsDragging(false));
  };

  const handleDeleteClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    closeSwipe();
    onDelete?.(bill.id);
  };

  const handleItemClick = () => {
    if (isDragging) return;

    if (isSwipedOpen) {
      closeSwipe();
      return;
    }

    onClick?.();
  };

  const isExpense = bill.bill_type === 1;

  return (
    <div className="relative overflow-hidden">
      {onDelete && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-expense-red flex items-center justify-center">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="w-full h-full flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 text-white" />
            <span className="sr-only">删除账单</span>
          </button>
        </div>
      )}

      {/* Draggable content */}
      <motion.div
        drag={onDelete ? 'x' : false}
        dragConstraints={{ left: onDelete ? SWIPE_OPEN_OFFSET : 0, right: 0 }}
        dragElastic={0.05}
        style={{ x }}
        onDragStart={onDelete ? handleDragStart : undefined}
        onDragEnd={onDelete ? handleDragEnd : undefined}
        onClick={handleItemClick}
        className="flex items-center gap-3 p-4 bg-light-card dark:bg-dark-card cursor-pointer active:bg-gray-50 dark:active:bg-zinc-900 transition-colors"
      >
        {/* Category Icon */}
        <CategoryAvatar name={bill.category?.name || '未'} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-light-text dark:text-dark-text truncate">
            {bill.merchant || bill.category?.name || '未分类'}
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {formatTime(bill.pay_time)}
            {bill.remark && ` · ${bill.remark}`}
          </p>
        </div>

        {/* Amount */}
        <span
          className={`font-semibold tabular-nums ${
            isExpense ? 'text-expense-red' : 'text-income-green'
          }`}
        >
          {isExpense ? '-' : '+'}
          {formatAmount(bill.amount)}
        </span>
      </motion.div>
    </div>
  );
}
