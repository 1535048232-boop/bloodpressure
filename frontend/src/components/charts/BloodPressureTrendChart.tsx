import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Select, Empty } from 'antd';
import dayjs from 'dayjs';
import { BloodPressureRecord } from '../../types';

interface BloodPressureTrendChartProps {
  records: BloodPressureRecord[];
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: string) => void;
}

const BloodPressureTrendChart: React.FC<BloodPressureTrendChartProps> = ({
  records,
  timeRange = 'month',
  onTimeRangeChange
}) => {
  // Filter records based on time range
  const getFilteredRecords = () => {
    const now = dayjs();
    let startDate: dayjs.Dayjs;

    switch (timeRange) {
      case 'week':
        startDate = now.subtract(7, 'day');
        break;
      case 'month':
        startDate = now.subtract(30, 'day');
        break;
      case 'quarter':
        startDate = now.subtract(90, 'day');
        break;
      case 'year':
        startDate = now.subtract(365, 'day');
        break;
      default:
        startDate = now.subtract(30, 'day');
    }

    return records
      .filter(record => dayjs(record.measurementTime).isAfter(startDate))
      .sort((a, b) => dayjs(a.measurementTime).valueOf() - dayjs(b.measurementTime).valueOf());
  };

  // Group records by day for better visualization
  const groupRecordsByDay = (filteredRecords: BloodPressureRecord[]) => {
    const grouped = filteredRecords.reduce((acc, record) => {
      const date = dayjs(record.measurementTime).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {} as Record<string, BloodPressureRecord[]>);

    return Object.entries(grouped).map(([date, dayRecords]) => {
      const avgSystolic = Math.round(
        dayRecords.reduce((sum, r) => sum + r.systolic, 0) / dayRecords.length
      );
      const avgDiastolic = Math.round(
        dayRecords.reduce((sum, r) => sum + r.diastolic, 0) / dayRecords.length
      );
      const avgHeartRate = dayRecords.some(r => r.heartRate) ?
        Math.round(
          dayRecords
            .filter(r => r.heartRate)
            .reduce((sum, r) => sum + (r.heartRate || 0), 0) / dayRecords.filter(r => r.heartRate).length
        ) : null;

      return {
        date: dayjs(date).format(timeRange === 'year' ? 'MM/DD' : 'MM-DD'),
        systolic: avgSystolic,
        diastolic: avgDiastolic,
        heartRate: avgHeartRate,
        count: dayRecords.length,
        fullDate: date
      };
    });
  };

  const filteredRecords = getFilteredRecords();
  const chartData = groupRecordsByDay(filteredRecords);

  const timeRangeOptions = [
    { label: '近7天', value: 'week' },
    { label: '近30天', value: 'month' },
    { label: '近3个月', value: 'quarter' },
    { label: '近1年', value: 'year' }
  ];

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{`日期: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name !== '心率' ? ' mmHg' : ' bpm'}
            </p>
          ))}
          <p className="text-sm text-gray-500">
            测量次数: {payload[0]?.payload?.count || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card
        title="血压趋势图表"
        extra={
          onTimeRangeChange && (
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              options={timeRangeOptions}
              style={{ width: 120 }}
            />
          )
        }
      >
        <Empty
          description="暂无数据"
          style={{ padding: '60px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card
      title="血压趋势图表"
      extra={
        onTimeRangeChange && (
          <Select
            value={timeRange}
            onChange={onTimeRangeChange}
            options={timeRangeOptions}
            style={{ width: 120 }}
          />
        )
      }
    >
      <div style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis
              domain={['dataMin - 10', 'dataMax + 10']}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#f5222d"
              strokeWidth={2}
              name="收缩压"
              dot={{ fill: '#f5222d', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#52c41a"
              strokeWidth={2}
              name="舒张压"
              dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {chartData.some(d => d.heartRate) && (
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#1890ff"
                strokeWidth={2}
                name="心率"
                dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default BloodPressureTrendChart;