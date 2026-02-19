'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Recharts to avoid SSR issues
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export interface LunaChartProps {
  /** Chart type */
  type: 'line' | 'bar' | 'area' | 'pie';
  /** Chart data */
  data: any[];
  /** Data key for x-axis (not used for pie) */
  dataKey?: string;
  /** Series to display */
  series?: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  /** Chart height */
  height?: number;
  /** Show grid */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Custom colors for pie chart */
  colors?: string[];
  /** Additional class name */
  className?: string;
}

const DEFAULT_COLORS = [
  '#1449E8', // Luna Blue
  '#00185F', // Luna Navy
  '#FFDF2B', // Luna Yellow
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

/**
 * LunaChart - Chart component for analytics and data visualization.
 *
 * @example
 * ```tsx
 * <LunaChart
 *   type="line"
 *   data={[
 *     { month: 'Jan', applications: 65, interviews: 28 },
 *     { month: 'Feb', applications: 59, interviews: 48 },
 *   ]}
 *   dataKey="month"
 *   series={[
 *     { key: 'applications', name: 'Applications', color: '#1449E8' },
 *     { key: 'interviews', name: 'Interviews', color: '#00185F' },
 *   ]}
 * />
 * ```
 */
export function LunaChart({
  type,
  data,
  dataKey = 'name',
  series = [],
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  colors = DEFAULT_COLORS,
  className,
}: LunaChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />}
            <XAxis dataKey={dataKey} stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {series.map((s, index) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: s.color || colors[index % colors.length] }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />}
            <XAxis dataKey={dataKey} stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color || colors[index % colors.length]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />}
            <XAxis dataKey={dataKey} stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {series.map((s, index) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || colors[index % colors.length]}
                fill={s.color || colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        );
    }
  };

  return (
    <div className={className} data-slot="luna-chart">
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

