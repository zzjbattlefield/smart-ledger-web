import { Check, AlertCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UploadItem } from '../../pages/bill/BatchUploadPage';
import type { Bill } from '../../types';
import { formatAmount } from '../../utils/format';

interface UploadResultSummaryProps {
  items: UploadItem[];
  onBillClick: (bill: Bill) => void;
  onRetry?: (id: string) => void;
  onRetryAll?: () => void;
}

export function UploadResultSummary({
  items,
  onBillClick,
  onRetry,
  onRetryAll,
}: UploadResultSummaryProps) {
  const successItems = items.filter(i => i.status === 'success' && i.result);
  const errorItems = items.filter(i => i.status === 'error');

  // 计算总金额
  const totalExpense = successItems
    .filter(i => i.result?.bill_type === 1)
    .reduce((sum, i) => sum + parseFloat(i.result?.amount || '0'), 0);

  const totalIncome = successItems
    .filter(i => i.result?.bill_type === 2)
    .reduce((sum, i) => sum + parseFloat(i.result?.amount || '0'), 0);

  // 是否可以重试（需要有原始文件）
  const canRetry = !!onRetry;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 成功汇总 */}
      {successItems.length > 0 && (
        <div className="bg-light-card dark:bg-dark-card rounded-xl overflow-hidden">
          {/* 成功标题 */}
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-income-green/20 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-income-green" />
              </div>
              <span className="font-semibold text-light-text dark:text-dark-text">
                成功导入 {successItems.length} 笔
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              {totalExpense > 0 && (
                <span className="text-expense-red">
                  支出 ¥{formatAmount(totalExpense.toFixed(2))}
                </span>
              )}
              {totalIncome > 0 && (
                <span className="text-income-green">
                  收入 ¥{formatAmount(totalIncome.toFixed(2))}
                </span>
              )}
            </div>
          </div>

          {/* 成功账单列表 */}
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {successItems.map(item => {
              const bill = item.result!;
              const isExpense = bill.bill_type === 1;
              return (
                <button
                  key={item.id}
                  onClick={() => onBillClick(bill)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="text-light-text dark:text-dark-text font-medium truncate">
                      {bill.merchant || bill.category?.name || '未分类'}
                    </p>
                    {bill.remark && (
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">
                        {bill.remark}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold tabular-nums ${
                        isExpense ? 'text-expense-red' : 'text-income-green'
                      }`}
                    >
                      {isExpense ? '-' : '+'}¥{formatAmount(bill.amount)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 失败列表 */}
      {errorItems.length > 0 && (
        <div className="bg-light-card dark:bg-dark-card rounded-xl overflow-hidden">
          {/* 失败标题 */}
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-expense-red/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-expense-red" />
              </div>
              <span className="font-semibold text-light-text dark:text-dark-text">
                {errorItems.length} 笔识别失败
              </span>
            </div>
            {!canRetry && (
              <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                原始图片已丢失，请重新上传
              </p>
            )}
          </div>

          {/* 失败项列表 */}
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {errorItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4"
              >
                {/* 缩略图或占位符 */}
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={`失败 ${index + 1}`}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                  </div>
                )}

                {/* 错误信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-light-text dark:text-dark-text font-medium">
                    图片 {index + 1}
                  </p>
                  <p className="text-sm text-expense-red truncate">
                    {item.error || '识别失败'}
                  </p>
                </div>

                {/* 重试按钮 - 仅在可重试时显示 */}
                {canRetry && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="flex-shrink-0 px-3 py-1.5 bg-cta-blue/10 text-cta-blue rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重试
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 重试全部按钮 */}
          {canRetry && errorItems.length > 1 && onRetryAll && (
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={onRetryAll}
                className="w-full py-2.5 bg-cta-blue/10 text-cta-blue rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重试全部失败项
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
