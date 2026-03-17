import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Receipt, CalendarDays } from 'lucide-react';
import { formatAmount } from '../../utils/format';

interface SummaryCardProps {
  totalExpense: string;
  totalIncome: string;
  billCount: number;
  dailyAverage: string;
}

export function SummaryCard({
  totalExpense,
  totalIncome,
  billCount,
  dailyAverage,
}: SummaryCardProps) {
  const balance = parseFloat(totalIncome) - parseFloat(totalExpense);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {/* Expense */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-expense-red" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              支出
            </p>
            <p className="text-lg font-bold text-expense-red truncate">
              {formatAmount(totalExpense)}
            </p>
          </div>
        </div>

        {/* Income */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-income-green" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              收入
            </p>
            <p className="text-lg font-bold text-income-green truncate">
              {formatAmount(totalIncome)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="col-span-2 border-t border-gray-100 dark:border-zinc-800/50" />

        {/* Balance */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 text-cta-blue" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              结余
            </p>
            <p
              className={`text-lg font-bold truncate ${
                balance >= 0 ? 'text-income-green' : 'text-expense-red'
              }`}
            >
              {balance >= 0 ? '+' : ''}
              {formatAmount(balance)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {billCount}笔账单
            </p>
            <p className="text-lg font-bold text-light-text dark:text-dark-text">
              日均 <span className="text-base">¥</span>{formatAmount(dailyAverage)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
