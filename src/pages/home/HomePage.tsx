import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BillItem } from '../../components/bill';
import { BillItemSkeleton, Dialog, Button, useToast } from '../../components/ui';
import { useBillStore, useCategoryStore } from '../../store';
import type { Bill } from '../../types';
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

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    const totalExpense = bills
      .filter((b) => b.bill_type === 1)
      .reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalIncome = bills
      .filter((b) => b.bill_type === 2)
      .reduce((sum, b) => sum + parseFloat(b.amount), 0);
    return { totalExpense, totalIncome };
  }, [bills]);

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
      <header className="sticky top-0 z-20 bg-light-bg dark:bg-dark-bg safe-area-top">
        <div className="px-4 py-4">
          {/* Month Selector */}
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-1 text-lg font-semibold text-light-text dark:text-dark-text"
          >
            {selectedYear}年{selectedMonth}月
            {showMonthPicker ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
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
                    className="px-3 py-1 text-sm text-light-text-secondary"
                  >
                    {selectedYear - 1}
                  </button>
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {selectedYear}
                  </span>
                  <button
                    onClick={() => setSelectedDate(selectedYear + 1, selectedMonth)}
                    className="px-3 py-1 text-sm text-light-text-secondary"
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
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        month === selectedMonth
                          ? 'bg-cta-blue text-white'
                          : 'bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text'
                      }`}
                    >
                      {month}月
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Card */}
          <div className="card mt-4 flex gap-6">
            <div className="flex-1">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                支出
              </p>
              <p className="text-xl font-bold text-expense-red">
                {formatAmount(monthlySummary.totalExpense)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                收入
              </p>
              <p className="text-xl font-bold text-income-green">
                {formatAmount(monthlySummary.totalIncome)}
              </p>
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
          <div className="py-20 text-center">
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              本月暂无账单
            </p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate('/bill/add')}
            >
              添加第一笔账单
            </Button>
          </div>
        ) : (
          // Bill groups
          groupedBills.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="sticky top-[140px] z-10 px-4 py-2 bg-light-bg dark:bg-dark-bg flex items-center justify-between">
                <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                  {group.displayDate}
                </span>
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
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/bill/add')}
        className="fixed right-4 bottom-24 z-50 w-14 h-14 rounded-full bg-cta-blue text-white shadow-lg flex items-center justify-center"
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
