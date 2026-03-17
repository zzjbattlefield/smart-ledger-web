import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Eye, EyeOff, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BillItem } from '../../components/bill';
import { BillItemSkeleton, Dialog, Button, useToast } from '../../components/ui';
import { useBillStore, useCategoryStore } from '../../store';
import { statsApi } from '../../api';
import type { Bill, StatsSummary } from '../../types';
import { formatDate, formatAmount } from '../../utils/format';

interface GroupedBills {
  date: string;
  displayDate: string;
  bills: Bill[];
  totalExpense: number;
  totalIncome: number;
}

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const { bills, isLoading, hasMore, loadMore, deleteBill, selectedYear, selectedMonth, setSelectedDate } =
    useBillStore();
  const { fetchCategories } = useCategoryStore();

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [showAmount, setShowAmount] = useState(() => {
    return localStorage.getItem('showAmount') === 'true';
  });

  const toggleShowAmount = () => {
    setShowAmount((prev) => {
      const next = !prev;
      localStorage.setItem('showAmount', String(next));
      return next;
    });
  };

  // Group bills by date
  const groupedBills = useMemo<GroupedBills[]>(() => {
    const groups: Record<string, GroupedBills> = {};

    bills.forEach((bill) => {
      const date = bill.pay_time.split('T')[0];
      if (!groups[date]) {
        groups[date] = {
          date,
          displayDate: formatDate(bill.pay_time),
          bills: [],
          totalExpense: 0,
          totalIncome: 0,
        };
      }
      groups[date].bills.push(bill);
      if (bill.bill_type === 1) {
        groups[date].totalExpense += parseFloat(bill.amount);
      } else {
        groups[date].totalIncome += parseFloat(bill.amount);
      }
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [bills]);

  // Fetch data on mount
  useEffect(() => {
    setSelectedDate(selectedYear, selectedMonth);
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch monthly summary
  useEffect(() => {
    const fetchSummary = async () => {
      const month = String(selectedMonth).padStart(2, '0');
      const dateParam = `${selectedYear}-${month}`;
      const res = await statsApi.getSummary({ period: 'month', date: dateParam });
      setSummary(res.data.data);
    };
    fetchSummary();
  }, [selectedYear, selectedMonth]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      hasMore &&
      !isLoading
    ) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteBill(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
    } catch {
      toast.error('删除失败');
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-lg safe-area-top">
        <div className="px-4 py-4">
          {/* Month Selector */}
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-1.5 text-lg font-semibold text-light-text dark:text-dark-text cursor-pointer"
          >
            {selectedYear}年{selectedMonth}月
            <motion.div
              animate={{ rotate: showMonthPicker ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>

          {/* Month Picker Dropdown */}
          <AnimatePresence>
            {showMonthPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                {/* Year selector */}
                <div className="flex items-center justify-center gap-4 mb-3">
                  <button
                    onClick={() => setSelectedDate(selectedYear - 1, selectedMonth)}
                    className="px-3 py-1 text-sm text-light-text-secondary cursor-pointer hover:text-light-text dark:hover:text-dark-text transition-colors"
                  >
                    {selectedYear - 1}
                  </button>
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {selectedYear}
                  </span>
                  <button
                    onClick={() => setSelectedDate(selectedYear + 1, selectedMonth)}
                    className="px-3 py-1 text-sm text-light-text-secondary cursor-pointer hover:text-light-text dark:hover:text-dark-text transition-colors"
                    disabled={selectedYear >= new Date().getFullYear()}
                  >
                    {selectedYear + 1}
                  </button>
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-4 gap-2">
                  {months.map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedDate(selectedYear, month);
                        setShowMonthPicker(false);
                      }}
                      className={`py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        month === selectedMonth
                          ? 'bg-cta-blue text-white shadow-sm'
                          : 'bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {month}月
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Card - Gradient */}
          <div className="mt-4 bg-gradient-to-br from-cta-blue to-blue-700 dark:from-cta-blue dark:to-blue-900 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-1">
                  支出
                </p>
                <p className="text-xl font-bold text-white">
                  {showAmount ? formatAmount(summary?.total_expense || '0') : '****'}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-1">
                  收入
                </p>
                <p className="text-xl font-bold text-white">
                  {showAmount ? formatAmount(summary?.total_income || '0') : '****'}
                </p>
              </div>
              <button
                onClick={toggleShowAmount}
                className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                {showAmount ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bill List */}
      <div className="pb-24">
        {isLoading && bills.length === 0 ? (
          // Loading skeleton
          <div className="divide-y divide-gray-100 dark:divide-zinc-900">
            {Array.from({ length: 5 }).map((_, i) => (
              <BillItemSkeleton key={i} />
            ))}
          </div>
        ) : bills.length === 0 ? (
          // Empty state
          <div className="py-20 text-center px-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cta-blue/10 dark:bg-cta-blue/20 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-cta-blue/60" />
            </div>
            <p className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
              本月暂无账单
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
              点击下方按钮开始记录第一笔
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/bill/add')}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              添加账单
            </Button>
          </div>
        ) : (
          // Bill groups
          groupedBills.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="sticky top-[140px] z-10 px-4 py-2.5 bg-light-bg/90 dark:bg-dark-bg/90 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cta-blue/60" />
                  <span className="text-sm font-medium text-light-text dark:text-dark-text">
                    {group.displayDate}
                  </span>
                </div>
                <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {group.totalExpense > 0 && `支出 ${formatAmount(group.totalExpense)}`}
                  {group.totalIncome > 0 && group.totalExpense > 0 && ' / '}
                  {group.totalIncome > 0 && `收入 ${formatAmount(group.totalIncome)}`}
                </span>
              </div>

              {/* Bills */}
              <div className="divide-y divide-gray-100 dark:divide-zinc-900">
                {group.bills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                    onDelete={(id) => setDeleteId(id)}
                    onClick={() => navigate(`/bill/detail/${bill.id}`)}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Load more indicator */}
        {isLoading && bills.length > 0 && (
          <div className="py-4 text-center">
            <div className="inline-block w-5 h-5 border-2 border-cta-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && bills.length > 0 && (
          <p className="py-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            没有更多了
          </p>
        )}
      </div>

      {/* Floating Add Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate('/bill/add')}
        className="fixed right-4 bottom-24 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cta-blue to-blue-600 text-white shadow-fab flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-xl"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="确认删除"
      >
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
          确定要删除这笔账单吗？此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>
            取消
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            删除
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
