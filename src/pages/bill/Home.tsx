import { useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { BillItem } from '@/components/bill/BillItem';
import { CategoryFilter } from '@/components/bill/CategoryFilter';
import { getBills, deleteBill, Bill, BillListParams, BillListResponse } from '@/api/bill';
import { getStatsSummary, StatsSummary } from '@/api/stats';
import { ApiResponse } from '@/utils/request';
import { useUserStore } from '@/store/userStore';
import { useBillStore } from '@/store/billStore';
import { formatBillDate, formatCurrency } from '@/utils/date';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

const PAGE_SIZE = 20;

const Home = () => {
  const navigate = useNavigate();
  const { userInfo } = useUserStore();
  const { 
    bills, stats, page, hasMore, filters, scrollPosition,
    setBills, appendBills, setStats, setPage, setHasMore, setFilters, setScrollPosition 
  } = useBillStore();
  
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Additional stats for "Today"
  const [todayStats, setTodayStats] = useState<StatsSummary | null>(null);

  // Visibility state
  const [showAmounts, setShowAmounts] = useState(false);

  // Restore scroll position
  useLayoutEffect(() => {
    window.scrollTo(0, scrollPosition);
  }, [scrollPosition]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      setScrollPosition(window.scrollY);
    };
  }, [setScrollPosition]);

  // Fetch Data
  const fetchData = useCallback(async (pageNum: number, isRefresh: boolean) => {
    setLoading(true);
    try {
      const params: BillListParams = { 
        page: pageNum, 
        page_size: PAGE_SIZE,
        date: filters.date 
      };
      
      if (filters.categoryId) {
        params.category_id = filters.categoryId;
      }

      const requests: Promise<unknown>[] = [getBills(params)];
      // Only fetch stats if refreshing (page 1)
      if (isRefresh) {
        requests.push(getStatsSummary({ period: 'month', date: filters.date }));
        // Fetch today's stats
        // Note: Using simplified date string construction to avoid timezone issues with simple toISOString() in some environments,
        // but here we just want YYYY-MM-DD. 
        // We'll stick to a robust simple formatting or just use string manipulation if we trust local time.
        // Let's use a safe approach for "today" in local time as YYYY-MM-DD.
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        requests.push(getStatsSummary({ period: 'day', date: `${year}-${month}-${day}` }));
      }

      const results = await Promise.all(requests);
      const billsRes = results[0] as { data: ApiResponse<BillListResponse> };
      const statsRes = isRefresh ? (results[1] as { data: ApiResponse<StatsSummary> }) : null;
      const todayStatsRes = isRefresh ? (results[2] as { data: ApiResponse<StatsSummary> }) : null;
      
      const newBills = billsRes.data.data.list;
      
      if (isRefresh) {
        setBills(newBills);
        if (statsRes) {
          setStats(statsRes.data.data);
        }
        if (todayStatsRes) {
          setTodayStats(todayStatsRes.data.data);
        }
      } else {
        appendBills(newBills);
      }
      
      setHasMore(newBills.length >= PAGE_SIZE);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [filters, setBills, appendBills, setStats, setPage, setHasMore]);

  // Initial Data Load (only if empty) or when filters change
  useEffect(() => {
    if (bills.length === 0) {
      fetchData(1, true);
    }
  }, [filters, bills.length, fetchData]); 

  // Load More Data
  const loadMoreBills = useCallback(() => {
    if (loading || !hasMore) return;
    fetchData(page + 1, false);
  }, [page, hasMore, loading, fetchData]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && bills.length > 0) {
          loadMoreBills();
        }
      },
      { threshold: 0.1 }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMoreBills, bills.length]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const billToDelete = bills.find(b => b.id === deleteId);
      await deleteBill(deleteId);
      
      // Optimistic update
      const newBills = bills.filter(b => b.id !== deleteId);
      setBills(newBills);
      
      // Optimistic update for stats
      if (billToDelete && stats) {
        const amount = parseFloat(billToDelete.amount);
        setStats({
          ...stats,
          total_expense: billToDelete.bill_type === 1 
            ? stats.total_expense - amount 
            : stats.total_expense,
          total_income: billToDelete.bill_type === 2 
            ? stats.total_income - amount 
            : stats.total_income
        });
      }
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  // Group bills by date
  const groupedBills = useMemo(() => {
    const groups: Record<string, Bill[]> = {};
    bills.forEach(bill => {
      const dateKey = bill.pay_time.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(bill);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [bills]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const nickname = userInfo?.nickname || '朋友';
    if (hour < 6) return `夜深了，${nickname}`;
    if (hour < 12) return `早上好，${nickname}`;
    if (hour < 18) return `下午好，${nickname}`;
    return `晚上好，${nickname}`;
  }, [userInfo]);

  const handleFilterSelect = (id: number | null) => {
    setFilters({ categoryId: id });
  };

  return (
    <div className="min-h-screen pt-14 px-4 pb-20 bg-ios-background">
      <Header 
        title="智能记账" 
        rightAction={
          <Button 
            variant="ghost" 
            size="sm" 
            className="!p-0 w-8 h-8 rounded-full bg-gray-100 text-ios-blue"
            onClick={() => navigate('/bill/add')}
          >
            <Plus size={20} />
          </Button>
        } 
      />
      
      {/* Greeting & Stats Card */}
      <div className="mt-4 space-y-4">
        <div>
           <h2 className="text-xl font-bold text-gray-800">{greeting}</h2>
           <p className="text-xs text-gray-400 mt-1">每一笔账，都算数</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative">
           <button 
             onClick={() => setShowAmounts(!showAmounts)}
             className="absolute top-6 right-6 p-1 text-blue-100 hover:text-white transition-colors"
           >
             {showAmounts ? <Eye size={20} /> : <EyeOff size={20} />}
           </button>

           <div className="flex flex-col mb-6">
             <span className="text-blue-100 text-xs font-medium mb-1">今天支出</span>
             <span className="text-3xl font-bold tracking-tight">
               {showAmounts ? (todayStats ? formatCurrency(todayStats.total_expense) : '0.00') : '****'}
             </span>
           </div>
           
           <div className="flex items-center justify-between">
             <div>
               <span className="text-blue-100 text-xs block mb-1">本月支出</span>
               <span className="text-lg font-semibold">
                 {showAmounts ? (stats ? formatCurrency(stats.total_expense) : '0.00') : '****'}
               </span>
             </div>
             <div>
               <span className="text-blue-100 text-xs block mb-1">本月收入</span>
               <span className="text-lg font-semibold">
                 {showAmounts ? (stats ? formatCurrency(stats.total_income) : '0.00') : '****'}
               </span>
             </div>
             <div className="text-right">
               <span className="text-blue-100 text-xs block mb-1">结余</span>
                <span className="text-lg font-semibold">
                 {showAmounts ? (stats ? formatCurrency(stats.total_income - stats.total_expense) : '0.00') : '****'}
               </span>
             </div>
           </div>
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="mt-6">
        <CategoryFilter selectedId={filters.categoryId} onSelect={handleFilterSelect} />
      </div>

      <div className="space-y-6 mt-4">
        {bills.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center pt-20 text-ios-subtext">
            <p>没有找到相关账单</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/bill/add')}>记一笔</Button>
          </div>
        ) : (
          <>
            {groupedBills.map(([date, items]) => {
              const dailyStats = items.reduce((acc, curr) => {
                const amount = parseFloat(curr.amount);
                if (curr.bill_type === 1) acc.expense += amount;
                else acc.income += amount;
                return acc;
              }, { expense: 0, income: 0 });

              return (
                <motion.div 
                  key={date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="sticky top-14 z-30 bg-ios-background/95 backdrop-blur-sm py-2 mb-2 flex justify-between items-end">
                    <h3 className="text-sm font-semibold text-ios-subtext uppercase tracking-wide">
                      {formatBillDate(date)}
                    </h3>
                    <div className="text-xs text-gray-400 flex space-x-3">
                      {dailyStats.income > 0 && (
                        <span>收 {formatCurrency(dailyStats.income).replace('CN¥', '¥')}</span>
                      )}
                      {dailyStats.expense > 0 && (
                        <span>支 {formatCurrency(dailyStats.expense).replace('CN¥', '¥')}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-50">
                    {items.map(bill => (
                      <BillItem 
                        key={bill.id} 
                        bill={bill} 
                        onClick={() => navigate(`/bill/detail/${bill.id}`)}
                        onDelete={() => setDeleteId(bill.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Infinite Scroll Trigger / Loading Indicator */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center w-full mt-4">
              {loading && hasMore && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">加载中...</span>
                </div>
              )}
              {!hasMore && bills.length > 0 && (
                <span className="text-xs text-gray-300">没有更多了</span>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="删除账单"
        description="确定要删除这条记录吗？"
        confirmText="删除"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Home;