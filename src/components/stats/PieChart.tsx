import { useMemo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryStat } from '../../types';
import { formatAmount } from '../../utils/format';

interface PieChartProps {
  data: CategoryStat[];
}

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

export function CategoryPieChart({ data }: PieChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 8).map((item) => ({
      name: item.name,
      value: parseFloat(item.amount),
      percent: item.percent,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
        暂无数据
      </div>
    );
  }

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
        <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
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
        </RechartsPieChart>
        </ResponsiveContainer>
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
