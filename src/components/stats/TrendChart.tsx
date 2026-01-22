import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TrendItem } from '../../types';

interface TrendChartProps {
  data: TrendItem[];
  period: 'week' | 'month' | 'year';
}

export function TrendChart({ data, period }: TrendChartProps) {
  const [showExpense, setShowExpense] = useState(true);
  const [showIncome, setShowIncome] = useState(false);

  const chartData = useMemo(() => {
    return data.map((item) => {
      const date = new Date(item.date);
      let label: string;

      if (period === 'week') {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        label = `周${weekdays[date.getDay()]}`;
      } else if (period === 'month') {
        label = `${date.getDate()}日`;
      } else {
        label = `${date.getMonth() + 1}月`;
      }

      return {
        label,
        expense: parseFloat(item.expense),
        income: parseFloat(item.income),
      };
    });
  }, [data, period]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
        暂无数据
      </div>
    );
  }

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-gray-200 dark:text-zinc-800"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-light-text-secondary dark:text-dark-text-secondary"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-light-text-secondary dark:text-dark-text-secondary"
            tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value: number, name: string) => [
              `¥${value.toFixed(2)}`,
              name === 'expense' ? '支出' : '收入',
            ]}
          />
          {showExpense && (
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
          {showIncome && (
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
        </ResponsiveContainer>
      </div>
      {/* 自定义图例 */}
      <div className="flex justify-center gap-6 mt-2">
        <button
          type="button"
          onClick={() => setShowExpense(!showExpense)}
          className={`flex items-center gap-1.5 text-sm cursor-pointer transition-opacity ${
            showExpense ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full ${
              showExpense ? 'bg-expense-red' : 'bg-gray-400'
            }`}
          />
          <span className="text-light-text-primary dark:text-dark-text-primary">
            支出
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowIncome(!showIncome)}
          className={`flex items-center gap-1.5 text-sm cursor-pointer transition-opacity ${
            showIncome ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full ${
              showIncome ? 'bg-income-green' : 'bg-gray-400'
            }`}
          />
          <span className="text-light-text-primary dark:text-dark-text-primary">
            收入
          </span>
        </button>
      </div>
    </div>
  );
}
