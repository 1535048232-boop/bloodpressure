import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import { BloodPressureRecord } from '../../types';

const { Text } = Typography;

interface BPTrendChartProps {
  records: BloodPressureRecord[];
  height?: number;
}

const BPTrendChart: React.FC<BPTrendChartProps> = ({ records, height = 400 }) => {
  // Process and sort records by date
  const processedData = records
    .map(record => ({
      ...record,
      date: dayjs(record.measurementTime).format('MM-DD'),
      dateTime: dayjs(record.measurementTime).format('MM-DD HH:mm'),
      timestamp: dayjs(record.measurementTime).valueOf()
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-30); // Show last 30 records

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      const getBPCategory = (systolic: number, diastolic: number) => {
        if (systolic < 120 && diastolic < 80) return '正常';
        if (systolic < 130 && diastolic < 80) return '血压偏高';
        if (systolic < 140 || diastolic < 90) return '高血压1级';
        if (systolic < 180 || diastolic < 120) return '高血压2级';
        return '高血压危象';
      };

      const category = getBPCategory(data.systolic, data.diastolic);

      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Text strong style={{ fontSize: 14 }}>
            {data.dateTime}
          </Text>
          <br />
          <Text style={{ color: '#f5222d' }}>
            收缩压: {data.systolic} mmHg
          </Text>
          <br />
          <Text style={{ color: '#52c41a' }}>
            舒张压: {data.diastolic} mmHg
          </Text>
          {data.heartRate && (
            <>
              <br />
              <Text style={{ color: '#722ed1' }}>
                心率: {data.heartRate} 次/分
              </Text>
            </>
          )}
          <br />
          <Text style={{ color: '#1890ff', fontSize: 12 }}>
            分类: {category}
          </Text>
          {data.notes && (
            <>
              <br />
              <Text style={{ color: '#666', fontSize: 12 }}>
                备注: {data.notes}
              </Text>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: 16
      }}>
        暂无数据，请先添加血压记录
      </div>
    );
  }

  if (records.length < 2) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: 16
      }}>
        至少需要2条记录才能显示趋势图
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={processedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[60, 200]}
          tick={{ fontSize: 12 }}
          label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 14, paddingTop: 10 }}
        />

        {/* Reference lines for blood pressure categories */}
        <ReferenceLine y={120} stroke="#52c41a" strokeDasharray="5 5" strokeOpacity={0.6} />
        <ReferenceLine y={130} stroke="#faad14" strokeDasharray="5 5" strokeOpacity={0.6} />
        <ReferenceLine y={140} stroke="#fa8c16" strokeDasharray="5 5" strokeOpacity={0.6} />
        <ReferenceLine y={180} stroke="#f5222d" strokeDasharray="5 5" strokeOpacity={0.6} />

        <Line
          type="monotone"
          dataKey="systolic"
          stroke="#f5222d"
          strokeWidth={3}
          name="收缩压"
          dot={{ fill: '#f5222d', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#f5222d', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          stroke="#52c41a"
          strokeWidth={3}
          name="舒张压"
          dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#52c41a', strokeWidth: 2 }}
        />
        {processedData.some(d => d.heartRate) && (
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="#722ed1"
            strokeWidth={2}
            name="心率"
            dot={{ fill: '#722ed1', strokeWidth: 1, r: 3 }}
            yAxisId="right"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BPTrendChart;