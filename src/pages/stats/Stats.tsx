import { useEffect, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts';
import { format } from 'date-fns';
import { Header } from '@/components/ui/Header';
import { getStatsSummary, getCategoryStats, StatsSummary, CategoryStats } from '@/api/stats';
import { formatCurrency } from '@/utils/date';
import { cn } from '@/utils/cn';

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#FF2D55', '#34C759', '#5AC8FA', '#AF52DE', '#FFCC00'];

const Stats = () => {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [categories, setCategories] = useState<CategoryStats['categories']>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dateParam = format(currentDate, 'yyyy-MM'); // 默认按月统计
      
      const [summaryRes, categoryRes] = await Promise.all([
        getStatsSummary({ period: 'month', date: dateParam }),
        getCategoryStats({ period: 'month', date: dateParam })
      ]);

      setSummary(summaryRes.data.data);
      setCategories(categoryRes.data.data.categories);
    } catch (error) {
      console.error('获取统计数据失败', error);
      // 真实接口失败时，不显示 Mock 数据，而是显示错误状态或空状态
      setSummary(null);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setActiveIndex(null); // Reset selection on date change
  }, [currentDate]);

  // Transform data for PieChart
  const pieData = categories.map((cat, index) => ({
    name: cat.name,
    value: Number(cat.amount),
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  const onPieClick = (data: any, index: number) => {
    // Recharts sometimes passes index in the second argument, sometimes in data.payload or data.index
    // We prioritize the direct index argument, then fallback to data properties
    const clickedIndex = index ?? data?.index ?? data?.payload?.index;
    if (clickedIndex === undefined) return;
    
    setActiveIndex(prev => prev === clickedIndex ? null : clickedIndex);
  };

  return (
    <div className="min-h-screen pt-14 pb-24 px-4 bg-ios-background">
      <Header title="收支统计" />
      
      {/* 简单的月份选择器 */}
      <div className="flex justify-center my-4">
        <input 
          type="month" 
          value={format(currentDate, 'yyyy-MM')}
          onChange={(e) => setCurrentDate(new Date(e.target.value))}
          className="bg-white px-4 py-2 rounded-xl text-ios-blue font-medium shadow-sm focus:outline-none"
        />
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
                <BarChart data={summary.trend}>
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
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`¥${value}`, '支出']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="expense" fill="#007AFF" radius={[4, 4, 4, 4]} barSize={12} />
                </BarChart>
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
