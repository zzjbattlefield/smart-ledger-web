import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CardSkeleton, useToast } from '../../components/ui';
import { BillItem } from '../../components/bill';
import { statsApi, billApi } from '../../api';
import type { CategoryStat, Bill } from '../../types';
import { formatAmount, getPreviousPeriods, getPeriodDateRange } from '../../utils/format';
import { getCategoryIcon } from '../../utils/categoryIcons';

type Period = 'week' | 'month' | 'year';

interface TrendDataPoint {
  label: string;
  amount: number;
}

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // URL 参数
  const period = (searchParams.get('period') || 'month') as Period;
  const date = searchParams.get('date') || '';
  const name = searchParams.get('name') || '';
  const currentAmount = searchParams.get('amount') || '0';
  const currentPercent = parseFloat(searchParams.get('percent') || '0');

  // 状态
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryStat[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previousAmount, setPreviousAmount] = useState<number | null>(null);

  const categoryId = parseInt(id || '0');
  const Icon = getCategoryIcon(name);

  // 计算环比变化
  const comparison = useMemo(() => {
    if (previousAmount === null) return null;
    const current = parseFloat(currentAmount);
    if (previousAmount === 0) {
      return current > 0 ? { type: 'up' as const, percent: 100 } : null;
    }
    const change = ((current - previousAmount) / previousAmount) * 100;
    return {
      type: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'same' as const,
      percent: Math.abs(change),
    };
  }, [currentAmount, previousAmount]);

  // 获取数据
  useEffect(() => {
    if (!categoryId || !date) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 构建日期对象
        let baseDate: Date;
        if (period === 'year') {
          baseDate = new Date(parseInt(date), 0, 1);
        } else if (period === 'month') {
          const [year, month] = date.split('-').map(Number);
          baseDate = new Date(year, month - 1, 1);
        } else {
          baseDate = new Date(date);
        }

        // 获取最近 6 个周期
        const periods = getPreviousPeriods(period, baseDate, 6);

        // 并发请求
        const [trendResults, subCategoryRes, billsRes] = await Promise.all([
          // 趋势数据：并发请求 6 个周期
          Promise.all(
            periods.map(p =>
              statsApi.getCategoryStats({ period, date: p.date })
                .then(res => {
                  const category = res.data.data.categories.find(c => c.id === categoryId);
                  return {
                    label: p.label,
                    amount: category ? parseFloat(category.amount) : 0,
                  };
                })
                .catch(() => ({ label: p.label, amount: 0 }))
            )
          ),
          // 二级分类
          statsApi.getSecondaryCategoryStats({ period, date, category_id: categoryId }),
          // 账单明细
          (() => {
            const dateRange = getPeriodDateRange(period, date);
            return billApi.getList({
              category_id: categoryId,
              start_date: dateRange.start,
              end_date: dateRange.end,
              page: 1,
              page_size: 100,
            });
          })(),
        ]);

        setTrendData(trendResults);
        setSubCategories(subCategoryRes.data.data.categories || []);
        setBills(billsRes.data.data.list || []);

        // 设置上一周期金额用于计算环比
        if (trendResults.length >= 2) {
          setPreviousAmount(trendResults[trendResults.length - 2].amount);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '获取数据失败';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, period, date]);

  const handleBillClick = (billId: number) => {
    navigate(`/bill/detail/${billId}`);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-light-bg dark:bg-dark-bg px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-light-text dark:text-dark-text" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
          </div>
          <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
            {name}
          </h1>
        </div>
      </header>

      <div className="px-4 pb-8 space-y-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* 汇总卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    本周期支出
                  </p>
                  <p className="text-3xl font-bold text-expense-red">
                    ¥{formatAmount(currentAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    占总支出
                  </p>
                  <p className="text-xl font-semibold text-light-text dark:text-dark-text">
                    {currentPercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              {comparison && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    {comparison.type === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-expense-red" />
                    ) : comparison.type === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-income-green" />
                    ) : (
                      <Minus className="w-4 h-4 text-light-text-secondary" />
                    )}
                    <span className={`text-sm ${
                      comparison.type === 'up'
                        ? 'text-expense-red'
                        : comparison.type === 'down'
                        ? 'text-income-green'
                        : 'text-light-text-secondary'
                    }`}>
                      环比{comparison.type === 'up' ? '上升' : comparison.type === 'down' ? '下降' : '持平'}{' '}
                      {comparison.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 趋势折线图 */}
            {trendData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">
                  花费趋势
                </h3>
                <TrendLineChartInner data={trendData} />
              </motion.div>
            )}

            {/* 二级分类分布 */}
            {subCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">
                  二级分类分布
                </h3>
                <SubCategoryPieChartInner data={subCategories} />
              </motion.div>
            )}

            {/* 账单明细 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-semibold text-light-text dark:text-dark-text mb-3">
                账单明细 ({bills.length})
              </h3>
              {bills.length > 0 ? (
                <div className="rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
                  {bills.map((bill) => (
                    <BillItem
                      key={bill.id}
                      bill={bill}
                      onClick={() => handleBillClick(bill.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                  暂无账单记录
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

// 内联趋势折线图组件
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function TrendLineChartInner({ data }: { data: TrendDataPoint[] }) {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
          domain={[0, maxAmount * 1.1]}
          tickFormatter={(value) => `¥${value}`}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number) => [`¥${formatAmount(value)}`, '支出']}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#F87171"
          strokeWidth={2}
          dot={{ fill: '#F87171', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: '#F87171' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 内联二级分类饼图组件
import { PieChart, Pie, Cell, ResponsiveContainer as PieResponsiveContainer } from 'recharts';

const COLORS = [
  '#2563EB', // blue
  '#22C55E', // green
  '#EF4444', // red
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

function SubCategoryPieChartInner({ data }: { data: CategoryStat[] }) {
  const chartData = data.slice(0, 8).map(item => ({
    name: item.name,
    value: parseFloat(item.amount),
    percent: item.percent,
  }));

  // 自定义标签渲染
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    name: string;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs fill-light-text dark:fill-dark-text"
      >
        {name}
      </text>
    );
  };

  return (
    <div className="relative">
      <div className="h-64 [&_svg]:outline-none">
        <PieResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={{
                stroke: '#888',
                strokeWidth: 1,
              }}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`¥${formatAmount(value)}`, '金额']}
            />
          </PieChart>
        </PieResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-light-text dark:text-dark-text truncate">
              {item.name}
            </span>
            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary ml-auto">
              {item.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
