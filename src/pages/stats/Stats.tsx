import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell, Sector, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Header } from '@/components/ui/Header';
import { getStatsSummary, getCategoryStats, StatsSummary, CategoryStats } from '@/api/stats';
import { formatCurrency } from '@/utils/date';
import { cn } from '@/utils/cn';

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#FF2D55', '#34C759', '#5AC8FA', '#AF52DE', '#FFCC00'];

const Stats = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [categories, setCategories] = useState<CategoryStats['categories']>([]);
  const [loading, setLoading] = useState(true);
  // We'll store the date string directly to simplify input handling for different types
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM'));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Helper to convert input value to API date
  const getApiDate = (period: string, value: string) => {
    if (period === 'week' && value.includes('-W')) {
      // HTML week input returns "YYYY-Www"
      // date-fns parseISO doesn't support YYYY-Www directly in all versions comfortably
      // We manually parse it or use a simpler approach
      const [year, week] = value.split('-W');
      const date = new Date(parseInt(year), 0, 1);
      const dayOffset = (parseInt(week) - 1) * 7;
      date.setDate(date.getDate() + dayOffset);
      return format(date, 'yyyy-MM-dd');
    }
    return value;
  };

  // Update dateStr default when switching periods
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === 'week') {
      // Input value for type="week" must be yyyy-Www
      setDateStr(format(now, "RRRR-'W'II"));
    } else if (newPeriod === 'month') {
      setDateStr(format(now, 'yyyy-MM'));
    } else {
      setDateStr(format(now, 'yyyy'));
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const apiDate = getApiDate(period, dateStr);
      
      const [summaryRes, categoryRes] = await Promise.all([
        getStatsSummary({ period, date: apiDate }),
        getCategoryStats({ period, date: apiDate })
      ]);

      setSummary(summaryRes.data.data);
      setCategories(categoryRes.data.data.categories);
    } catch (error) {
      console.error('获取统计数据失败', error);
      setSummary(null);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [period, dateStr]);

  useEffect(() => {
    fetchData();
    setActiveIndex(null);
  }, [fetchData]);

  // Transform data for PieChart
  const pieData = categories.map((cat, index) => ({
    name: cat.name,
    value: Number(cat.amount),
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPieClick = (data: any, index: number) => {
    const clickedIndex = index ?? data?.index ?? data?.payload?.index;
    if (clickedIndex === undefined) return;
    setActiveIndex(prev => prev === clickedIndex ? null : clickedIndex);
  };

  return (
    <div className="min-h-screen pt-14 pb-24 px-4 bg-ios-background">
      <Header title="收支统计" />
      
      {/* Period Selector */}
      <div className="flex justify-center mt-4 mb-2">
        <div className="bg-gray-100 p-1 rounded-xl flex space-x-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                period === p 
                  ? "bg-white text-ios-text shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p === 'week' ? '周报' : p === 'month' ? '月报' : '年报'}
            </button>
          ))}
        </div>
      </div>

      {/* Date Picker */}
      <div className="flex justify-center mb-6">
        {period === 'year' ? (
          <input 
            type="number" 
            min="2000"
            max="2099"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="bg-white px-4 py-2 rounded-xl text-ios-blue font-medium shadow-sm focus:outline-none text-center min-w-[120px]"
          />
        ) : (
          <input 
            type={period === 'week' ? "week" : "month"}
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="bg-white px-4 py-2 rounded-xl text-ios-blue font-medium shadow-sm focus:outline-none text-center min-w-[150px]"
          />
        )}
      </div>

      {loading ? (
        <div className="pt-20 text-center text-gray-400">正在加载统计数据...</div>
      ) : !summary ? (
        <div className="pt-20 text-center text-gray-400">获取数据失败，请重试</div>
      ) : (
        <div className="space-y-6">
          {/* 总览卡片 */}
          <div className="bg-ios-blue text-white rounded-2xl p-6 shadow-xl shadow-ios-blue/20">
            <span className="text-blue-100 text-sm font-medium">本月总支出</span>
            <div className="text-4xl font-bold mt-1">
              {formatCurrency(summary.total_expense)}
            </div>
            <div className="mt-4 flex space-x-6">
               <div>
                 <span className="text-blue-100 text-xs">总收入</span>
                 <p className="font-semibold text-lg">{formatCurrency(summary.total_income)}</p>
               </div>
               <div>
                 <span className="text-blue-100 text-xs">记账笔数</span>
                 <p className="font-semibold text-lg">{summary.bill_count}</p>
               </div>
            </div>
          </div>

          {/* 趋势图表 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm h-64">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">每日支出趋势</h3>
            {summary.trend && summary.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.trend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F7" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.slice(-2)} // 只显示日期号
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#8E8E93' }} 
                    dy={10}
                    interval={Math.ceil(summary.trend.length / 7)} // 自适应间隔
                  />
                  <Tooltip 
                    cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`¥${value}`, '支出']}
                    labelFormatter={(label) => label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#007AFF" 
                    strokeWidth={3} 
                    dot={{ fill: '#007AFF', strokeWidth: 2, r: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">暂无趋势数据</div>
            )}
          </div>

          {/* 支出构成饼图 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm relative">
             <h3 className="text-sm font-semibold text-gray-500 mb-2">支出构成</h3>
             <div className="h-64 flex items-center justify-center relative">
               {/* Center Info Overlay */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                 <span className="text-xs text-gray-400 mb-1">
                   {activeIndex !== null ? pieData[activeIndex].name : '总支出'}
                 </span>
                 <span className="text-xl font-bold text-gray-800">
                   {activeIndex !== null 
                     ? formatCurrency(pieData[activeIndex].value) 
                     : formatCurrency(summary.total_expense)}
                 </span>
               </div>

               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
	                     <Pie
	                       // 这里用自定义 shape 来控制“点击放大/再次点击还原”，避免 Recharts 内部 tooltip 的 activeIndex 状态干扰
	                       // eslint-disable-next-line @typescript-eslint/no-explicit-any
	                       shape={(props: any) => {
	                         const isActive = activeIndex !== null && props.index === activeIndex;
	                         return (
	                           <Sector
	                             {...props}
	                             outerRadius={Number(props.outerRadius) + (isActive ? 6 : 0)}
	                           />
	                         );
	                       }}
	                       onClick={onPieClick}
	                       data={pieData}
	                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                       label={({ cx, x, y, name, percent }) => {
                         return (
                           <text 
                             x={x} 
                             y={y} 
                             fill="#8E8E93" 
                             textAnchor={x > cx ? 'start' : 'end'} 
                             dominantBaseline="central" 
                             fontSize={12}
                           >
                             {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                           </text>
                         );
                       }}
                       labelLine={{ stroke: '#E5E5EA', strokeWidth: 1 }}
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} style={{ outline: 'none' }} />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        wrapperStyle={{ pointerEvents: 'none' }}
                        formatter={(value: number, name: string) => [`¥${value}`, name]}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="text-gray-300">暂无分类数据</div>
               )}
             </div>
          </div>

          {/* 分类排行 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">支出分类排行</h3>
            <div className="space-y-4">
              {categories.length > 0 ? categories.map((cat, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm font-semibold">{cat.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500")} 
                        style={{ width: `${cat.percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} 
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium w-24 text-right">
                    {formatCurrency(cat.amount).replace('CN¥', '¥')}
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-4">暂无分类数据</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
