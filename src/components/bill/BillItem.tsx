import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Bill } from '../../types';
import { formatAmount, formatTime } from '../../utils/format';
import { CategoryAvatar } from './CategoryAvatar';

interface BillItemProps {
  bill: Bill;
  onDelete?: (id: number) => void;
  onClick?: () => void;
}

export function BillItem({ bill, onDelete, onClick }: BillItemProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
  const deleteWidth = useTransform(x, [-100, 0], [80, 0]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100 && onDelete) {
      onDelete(bill.id);
    }
  };

  const isExpense = bill.bill_type === 1;

  return (
    <div className="relative overflow-hidden">
      {/* Delete button behind */}
      <motion.div
        style={{ width: deleteWidth, opacity: deleteOpacity }}
        className="absolute right-0 top-0 bottom-0 bg-expense-red flex items-center justify-center"
      >
        <Trash2 className="w-5 h-5 text-white" />
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClick={onClick}
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
