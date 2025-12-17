import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Bill } from '@/api/bill';
import { formatBillTime, formatCurrency } from '@/utils/date';
import { cn } from '@/utils/cn';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface BillItemProps {
  bill: Bill;
  onClick?: () => void;
  onDelete?: () => void;
}

export const BillItem = ({ bill, onClick, onDelete }: BillItemProps) => {
  const isExpense = bill.bill_type === 1;
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-50, -100], [0, 1]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // 如果向左拖拽超过 80px，或者速度很快，虽然这里我们不自动触发删除，
    // 而是让用户点击红色按钮，或者保持展开状态（类似 iOS）。
    // 简单起见：如果超过阈值，保持展开；否则回弹。
    if (info.offset.x < -60) {
      // 保持展开状态 (这里需要受控组件才能完美实现，为了简化，我们只做回弹或点击删除)
      // MVP: 这里实现"拖拽后回弹，但如果拖够远直接触发onDelete"可能误触。
      // iOS 风格通常是：拖拽显示按钮，按钮可点击。
      // 我们采用：拖拽显示背景，松手复位，但点击背景区域（按钮）触发删除。
    } 
  };

  return (
    <div className="relative overflow-hidden bg-ios-red first:rounded-t-xl last:rounded-b-xl border-b border-gray-50 last:border-none">
      {/* 底层删除按钮 */}
      <motion.div 
        style={{ opacity: deleteOpacity }}
        className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center text-white z-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
      >
        <Trash2 size={20} />
      </motion.div>

      {/* 上层内容卡片 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ backgroundColor: "rgba(0,0,0,0.02)" }}
        onClick={onClick}
        className="relative z-10 flex items-center justify-between py-3 px-4 bg-white active:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <CategoryIcon name={bill.category?.name || '未'} />
          <div className="flex flex-col">
            <span className="text-base font-medium text-ios-text">
              {bill.category?.name || '未分类'}
            </span>
            <span className="text-xs text-ios-subtext max-w-[150px] truncate">
              {formatBillTime(bill.pay_time)} · {bill.remark || bill.merchant || '无备注'}
            </span>
          </div>
        </div>
        <div className={cn(
          "font-semibold text-base",
          isExpense ? "text-ios-text" : "text-ios-green"
        )}>
          {isExpense ? '-' : '+'}{formatCurrency(bill.amount).replace('CN¥', '')}
        </div>
      </motion.div>
    </div>
  );
};