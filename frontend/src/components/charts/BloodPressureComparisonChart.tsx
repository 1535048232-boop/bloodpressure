import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Empty } from 'antd';
import dayjs from 'dayjs';
import { BloodPressureRecord } from '../../types';

interface BloodPressureComparisonChartProps {
  records: BloodPressureRecord[];
  timeRange?: string;
}

const BloodPressureComparisonChart: React.FC<BloodPressureComparisonChartProps> = ({
  records,
  timeRange = 'month'
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

  // Group records by day and calculate pulse pressure
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
      const pulsePressure = avgSystolic - avgDiastolic;

      return {
        date: dayjs(date).format(timeRange === 'year' ? 'MM/DD' : 'MM-DD'),
        systolic: avgSystolic,
        diastolic: avgDiastolic,
        pulsePressure,
        fullDate: date
      };
    });
  };

  const filteredRecords = getFilteredRecords();
  const chartData = groupRecordsByDay(filteredRecords);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{`日期: ${label}`}</p>
          <p style={{ color: '#f5222d' }}>收缩压: {data.systolic} mmHg</p>
          <p style={{ color: '#52c41a' }}>舒张压: {data.diastolic} mmHg</p>
          <p style={{ color: '#1890ff' }}>脉压差: {data.pulsePressure} mmHg</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>血压分类: {getBPCategory(data.systolic, data.diastolic)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return '正常';
    } else if (systolic < 130 && diastolic < 80) {
      return '血压偏高';
    } else if (systolic < 140 || diastolic < 90) {
      return '高血压1级';
    } else if (systolic < 180 || diastolic < 120) {
      return '高血压2级';
    } else {
      return '高血压危象';
    }
  };

  if (chartData.length === 0) {
    return (
      <Card title="血压对比分析">
        <Empty
          description="暂无数据"
          style={{ padding: '60px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card title="血压对比分析">
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorSystolic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f5222d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f5222d" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorDiastolic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="systolic"
              stackId="1"
              stroke="#f5222d"
              fill="url(#colorSystolic)"
              name="收缩压"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="diastolic"
              stackId="2"
              stroke="#52c41a"
              fill="url(#colorDiastolic)"
              name="舒张压"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default BloodPressureComparisonChart;