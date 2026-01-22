import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { SummaryCard, TrendChart, CategoryPieChart } from '../../components/stats';
import { CardSkeleton, useToast } from '../../components/ui';
import { CategoryAvatar } from '../../components/bill';
import { statsApi } from '../../api';
import type { StatsSummary, CategoryStats } from '../../types';
import { formatAmount } from '../../utils/format';

type Period = 'week' | 'month' | 'year';

export function StatsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format date for API based on period
  const getDateParam = () => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    switch (period) {
      case 'week':
        return `${year}-${month}-${day}`;
      case 'month':
        return `${year}-${month}`;
      case 'year':
        return `${year}`;
    }
  };

  // Display label for current period
  const getPeriodLabel = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    switch (period) {
      case 'week': {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
      }
      case 'month':
        return `${year}年${month}月`;
      case 'year':
        return `${year}年`;
    }
  };

  // Navigate periods
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const delta = direction === 'prev' ? -1 : 1;

    switch (period) {
      case 'week':
        newDate.setDate(newDate.getDate() + delta * 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + delta);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + delta);
        break;
    }

    setCurrentDate(newDate);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const dateParam = getDateParam();
        const [summaryRes, categoryRes] = await Promise.all([
          statsApi.getSummary({ period, date: dateParam }),
          statsApi.getCategoryStats({ period, date: dateParam }),
        ]);

        setSummary(summaryRes.data.data);
        setCategoryStats(categoryRes.data.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '获取统计数据失败';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period, currentDate]);

  const periods: { value: Period; label: string }[] = [
    { value: 'week', label: '周' },
    { value: 'month', label: '月' },
    { value: 'year', label: '年' },
  ];

  return (
    <div className="min-h-screen pb-8 safe-area-top">
      {/* Header */}
      <header className="px-4 py-4">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-4">
          统计
        </h1>

        {/* Period Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl mb-4">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setPeriod(value);
                setCurrentDate(new Date());
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-light-card dark:bg-dark-card text-cta-blue shadow-sm'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Period Navigator */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigatePeriod('prev')} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5 text-light-text-secondary" />
          </button>
          <span className="font-medium text-light-text dark:text-dark-text">
            {getPeriodLabel()}
          </span>
          <button onClick={() => navigatePeriod('next')} className="p-2 -mr-2">
            <ChevronRight className="w-5 h-5 text-light-text-secondary" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : summary ? (
          <>
            {/* Summary Card */}
            <SummaryCard
              totalExpense={summary.total_expense}
              totalIncome={summary.total_income}
              billCount={summary.bill_count}
              dailyAverage={summary.daily_average}
            />

            {/* Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">
                收支趋势
              </h3>
              <TrendChart data={summary.trend} period={period} />
            </motion.div>

            {/* Category Pie Chart */}
            {categoryStats && categoryStats.categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">
                  支出分类
                </h3>
                <CategoryPieChart data={categoryStats.categories} />
              </motion.div>
            )}

            {/* Top Categories List */}
            {summary.top_categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">
                  支出排行
                </h3>
                <div className="space-y-3">
                  {summary.top_categories.map((category, index) => {
                    const handleCategoryClick = () => {
                      const dateParam = getDateParam();
                      const params = new URLSearchParams({
                        period,
                        date: dateParam,
                        name: category.name,
                        amount: category.amount,
                        percent: category.percent.toString(),
                      });
                      navigate(`/stats/category/${category.id}?${params.toString()}`);
                    };
                    return (
                      <div
                        key={category.id}
                        onClick={handleCategoryClick}
                        className="flex items-center gap-3 cursor-pointer active:bg-gray-50 dark:active:bg-zinc-900 -mx-4 px-4 py-2 transition-colors"
                      >
                        <span className="w-6 text-center text-sm text-light-text-secondary">
                          {index + 1}
                        </span>
                        <CategoryAvatar name={category.name} size="sm" />
                        <span className="flex-1 text-light-text dark:text-dark-text">
                          {category.name}
                        </span>
                        <div className="text-right">
                          <p className="font-medium text-light-text dark:text-dark-text">
                            ¥{formatAmount(category.amount)}
                          </p>
                          <p className="text-xs text-light-text-secondary">
                            {category.percent.toFixed(1)}%
                          </p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-light-text-secondary" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-light-text-secondary dark:text-dark-text-secondary">
            暂无统计数据
          </div>
        )}
      </div>
    </div>
  );
}
