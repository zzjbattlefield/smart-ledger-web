import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Receipt } from 'lucide-react';
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
      className="card"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Expense */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-expense-red" />
          </div>
          <div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              支出
            </p>
            <p className="text-lg font-bold text-expense-red">
              {formatAmount(totalExpense)}
            </p>
          </div>
        </div>

        {/* Income */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-income-green" />
          </div>
          <div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              收入
            </p>
            <p className="text-lg font-bold text-income-green">
              {formatAmount(totalIncome)}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-cta-blue" />
          </div>
          <div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              结余
            </p>
            <p
              className={`text-lg font-bold ${
                balance >= 0 ? 'text-income-green' : 'text-expense-red'
              }`}
            >
              {balance >= 0 ? '+' : ''}
              {formatAmount(balance)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            账单数
          </p>
          <p className="text-lg font-bold text-light-text dark:text-dark-text">
            {billCount}笔
          </p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            日均 ¥{formatAmount(dailyAverage)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
