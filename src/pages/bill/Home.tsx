import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { BillItem } from '@/components/bill/BillItem';
import { getBills, deleteBill, Bill } from '@/api/bill';
import { getStatsSummary, StatsSummary } from '@/api/stats';
import { useUserStore } from '@/store/userStore';
import { formatBillDate, formatCurrency } from '@/utils/date';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

const PAGE_SIZE = 20;

const Home = () => {
  const navigate = useNavigate();
  const { userInfo } = useUserStore();
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Visibility state
  const [showAmounts, setShowAmounts] = useState(true);

  // Initial Data Load
  const initData = async () => {
    try {
      setLoading(true);
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      const [billsRes, statsRes] = await Promise.all([
        getBills({ page: 1, page_size: PAGE_SIZE }),
        getStatsSummary({ period: 'month', date: currentMonth })
      ]);
      
      setBills(billsRes.data.data.list);
      setStats(statsRes.data.data);
      setHasMore(billsRes.data.data.list.length >= PAGE_SIZE);
      setPage(1);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // Load More Data
  const loadMoreBills = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await getBills({ page: nextPage, page_size: PAGE_SIZE });
      const newBills = res.data.data.list;
      
      if (newBills.length > 0) {
        setBills(prev => [...prev, ...newBills]);
        setPage(nextPage);
      }
      
      if (newBills.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more bills', error);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    initData();
  }, []);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreBills();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadMoreBills]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const billToDelete = bills.find(b => b.id === deleteId);
      await deleteBill(deleteId);
      
      // Optimistic update
      setBills(prev => prev.filter(b => b.id !== deleteId));
      
      // Optimistic update for stats
      if (billToDelete && stats) {
        const currentMonth = format(new Date(), 'yyyy-MM');
        const billMonth = format(new Date(billToDelete.pay_time), 'yyyy-MM');
        
        if (billMonth === currentMonth) {
          const amount = parseFloat(billToDelete.amount);
          setStats(prev => {
            if (!prev) return null;
            return {
              ...prev,
              total_expense: billToDelete.bill_type === 1 
                ? prev.total_expense - amount 
                : prev.total_expense,
              total_income: billToDelete.bill_type === 2 
                ? prev.total_income - amount 
                : prev.total_income
            };
          });
        }
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

           <div className="flex flex-col">
             <span className="text-blue-100 text-xs font-medium mb-1">本月总支出</span>
             <span className="text-3xl font-bold tracking-tight">
               {showAmounts ? (stats ? formatCurrency(stats.total_expense) : '...') : '****'}
             </span>
           </div>
           
           <div className="mt-6 flex items-center justify-between">
             <div>
               <span className="text-blue-100 text-xs block mb-1">本月收入</span>
               <span className="text-lg font-semibold">
                 {showAmounts ? (stats ? formatCurrency(stats.total_income) : '...') : '****'}
               </span>
             </div>
             <div className="text-right">
               <span className="text-blue-100 text-xs block mb-1">结余</span>
                <span className="text-lg font-semibold">
                 {showAmounts ? (stats ? formatCurrency(stats.total_income - stats.total_expense) : '...') : '****'}
               </span>
             </div>
           </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        {bills.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center pt-20 text-ios-subtext">
            <p>本月暂无账单</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/bill/add')}>记一笔</Button>
          </div>
        ) : (
          <>
            {groupedBills.map(([date, items]) => (
              <motion.div 
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="sticky top-14 z-30 bg-ios-background/95 backdrop-blur-sm py-2 mb-2">
                  <h3 className="text-sm font-semibold text-ios-subtext uppercase tracking-wide">
                    {formatBillDate(date)}
                  </h3>
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
            ))}
            
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
