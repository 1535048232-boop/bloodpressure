import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Empty, Statistic, Row, Col } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BloodPressureRecord } from '../../types';

interface HeartRateTrendProps {
  records: BloodPressureRecord[];
  timeRange?: string;
}

const HeartRateTrend: React.FC<HeartRateTrendProps> = ({
  records,
  timeRange = 'month'
}) => {
  // Filter records based on time range and only those with heart rate data
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
      .filter(record =>
        record.heartRate &&
        record.heartRate > 0 &&
        dayjs(record.measurementTime).isAfter(startDate)
      )
      .sort((a, b) => dayjs(a.measurementTime).valueOf() - dayjs(b.measurementTime).valueOf());
  };

  // Group records by day for heart rate analysis
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
      const heartRates = dayRecords.map(r => r.heartRate!);
      const avgHeartRate = Math.round(
        heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
      );
      const minHeartRate = Math.min(...heartRates);
      const maxHeartRate = Math.max(...heartRates);

      return {
        date: dayjs(date).format(timeRange === 'year' ? 'MM/DD' : 'MM-DD'),
        avgHeartRate,
        minHeartRate,
        maxHeartRate,
        count: dayRecords.length,
        fullDate: date
      };
    });
  };

  // Calculate heart rate statistics
  const getHeartRateStats = (filteredRecords: BloodPressureRecord[]) => {
    if (filteredRecords.length === 0) {
      return {
        avgHeartRate: 0,
        minHeartRate: 0,
        maxHeartRate: 0,
        normalCount: 0,
        bradycardiaCount: 0,
        tachycardiaCount: 0
      };
    }

    const heartRates = filteredRecords.map(r => r.heartRate!);
    const avgHeartRate = Math.round(
      heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
    );
    const minHeartRate = Math.min(...heartRates);
    const maxHeartRate = Math.max(...heartRates);

    // Categorize heart rates (normal: 60-100 bpm)
    const normalCount = heartRates.filter(hr => hr >= 60 && hr <= 100).length;
    const bradycardiaCount = heartRates.filter(hr => hr < 60).length;
    const tachycardiaCount = heartRates.filter(hr => hr > 100).length;

    return {
      avgHeartRate,
      minHeartRate,
      maxHeartRate,
      normalCount,
      bradycardiaCount,
      tachycardiaCount
    };
  };

  const filteredRecords = getFilteredRecords();
  const chartData = groupRecordsByDay(filteredRecords);
  const stats = getHeartRateStats(filteredRecords);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{`日期: ${label}`}</p>
          <p style={{ color: '#1890ff' }}>平均心率: {data.avgHeartRate} bpm</p>
          <p style={{ color: '#52c41a' }}>最低心率: {data.minHeartRate} bpm</p>
          <p style={{ color: '#f5222d' }}>最高心率: {data.maxHeartRate} bpm</p>
          <p className="text-sm text-gray-500">测量次数: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  const getHeartRateCategory = (heartRate: number) => {
    if (heartRate < 60) {
      return { category: '心率偏缓', color: '#faad14' };
    } else if (heartRate > 100) {
      return { category: '心率偏快', color: '#f5222d' };
    } else {
      return { category: '心率正常', color: '#52c41a' };
    }
  };

  if (filteredRecords.length === 0) {
    return (
      <Card title="心率趋势分析">
        <Empty
          description="暂无心率数据"
          style={{ padding: '60px 0' }}
        />
      </Card>
    );
  }

  return (
    <div>
      {/* Heart Rate Statistics */}
      <Card title="心率统计" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="平均心率"
              value={stats.avgHeartRate}
              suffix="bpm"
              prefix={<HeartOutlined />}
              valueStyle={{
                color: getHeartRateCategory(stats.avgHeartRate).color
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="最低心率"
              value={stats.minHeartRate}
              suffix="bpm"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="最高心率"
              value={stats.maxHeartRate}
              suffix="bpm"
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="正常心率占比"
              value={filteredRecords.length > 0 ? Math.round((stats.normalCount / filteredRecords.length) * 100) : 0}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Heart Rate Trend Chart */}
      <Card title="心率趋势图表">
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12 }}
                stroke="#666"
                label={{ value: 'bpm', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={customTooltip} />
              <Bar
                dataKey="avgHeartRate"
                fill="#1890ff"
                name="平均心率"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Heart Rate Categories Summary */}
      {filteredRecords.length > 0 && (
        <Card title="心率分类统计" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                  {stats.bradycardiaCount}
                </div>
                <div style={{ color: '#666' }}>心率偏缓 (&lt;60)</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.normalCount}
                </div>
                <div style={{ color: '#666' }}>心率正常 (60-100)</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                  {stats.tachycardiaCount}
                </div>
                <div style={{ color: '#666' }}>心率偏快 (&gt;100)</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default HeartRateTrend;