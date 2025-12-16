import React, { useEffect, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Header } from '@/components/ui/Header';
import { getStatsSummary, getCategoryStats, StatsSummary, CategoryStats } from '@/api/stats';
import { formatCurrency } from '@/utils/date';
import { cn } from '@/utils/cn';

const Stats = () => {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [categories, setCategories] = useState<CategoryStats['categories']>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
  }, [currentDate]);

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
                        className={cn(
                          "h-full rounded-full transition-all duration-500", 
                          idx === 0 ? "bg-ios-blue" : idx === 1 ? "bg-ios-purple" : "bg-ios-orange"
                        )} 
                        style={{ width: `${cat.percent}%` }} 
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