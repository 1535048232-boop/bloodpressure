import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Alert } from 'antd';
import { WarningOutlined, CheckCircleOutlined, HeartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BloodPressureRecord } from '../../types';

interface StatisticalReportProps {
  records: BloodPressureRecord[];
  timeRange?: string;
}

interface BPStats {
  totalRecords: number;
  averageSystolic: number;
  averageDiastolic: number;
  averageHeartRate: number | null;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  normalCount: number;
  elevatedCount: number;
  hypertension1Count: number;
  hypertension2Count: number;
  crisisCount: number;
  abnormalValues: Array<{
    date: string;
    systolic: number;
    diastolic: number;
    category: string;
    severity: 'warning' | 'error';
  }>;
}

const StatisticalReport: React.FC<StatisticalReportProps> = ({
  records,
  timeRange = 'month'
}) => {
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

    return records.filter(record =>
      dayjs(record.measurementTime).isAfter(startDate)
    );
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { label: '正常', color: 'success', severity: 'normal' as const };
    } else if (systolic < 130 && diastolic < 80) {
      return { label: '血压偏高', color: 'warning', severity: 'elevated' as const };
    } else if (systolic < 140 || diastolic < 90) {
      return { label: '高血压1级', color: 'warning', severity: 'hypertension1' as const };
    } else if (systolic < 180 || diastolic < 120) {
      return { label: '高血压2级', color: 'error', severity: 'hypertension2' as const };
    } else {
      return { label: '高血压危象', color: 'error', severity: 'crisis' as const };
    }
  };

  const calculateStatistics = (filteredRecords: BloodPressureRecord[]): BPStats => {
    if (filteredRecords.length === 0) {
      return {
        totalRecords: 0,
        averageSystolic: 0,
        averageDiastolic: 0,
        averageHeartRate: null,
        minSystolic: 0,
        maxSystolic: 0,
        minDiastolic: 0,
        maxDiastolic: 0,
        normalCount: 0,
        elevatedCount: 0,
        hypertension1Count: 0,
        hypertension2Count: 0,
        crisisCount: 0,
        abnormalValues: []
      };
    }

    const totalRecords = filteredRecords.length;
    const systolicValues = filteredRecords.map(r => r.systolic);
    const diastolicValues = filteredRecords.map(r => r.diastolic);
    const heartRateValues = filteredRecords.filter(r => r.heartRate).map(r => r.heartRate!);

    const averageSystolic = Math.round(systolicValues.reduce((a, b) => a + b, 0) / totalRecords);
    const averageDiastolic = Math.round(diastolicValues.reduce((a, b) => a + b, 0) / totalRecords);
    const averageHeartRate = heartRateValues.length > 0 ?
      Math.round(heartRateValues.reduce((a, b) => a + b, 0) / heartRateValues.length) : null;

    const minSystolic = Math.min(...systolicValues);
    const maxSystolic = Math.max(...systolicValues);
    const minDiastolic = Math.min(...diastolicValues);
    const maxDiastolic = Math.max(...diastolicValues);

    let normalCount = 0;
    let elevatedCount = 0;
    let hypertension1Count = 0;
    let hypertension2Count = 0;
    let crisisCount = 0;
    const abnormalValues: BPStats['abnormalValues'] = [];

    filteredRecords.forEach(record => {
      const category = getBPCategory(record.systolic, record.diastolic);

      switch (category.severity) {
        case 'normal':
          normalCount++;
          break;
        case 'elevated':
          elevatedCount++;
          abnormalValues.push({
            date: dayjs(record.measurementTime).format('MM-DD HH:mm'),
            systolic: record.systolic,
            diastolic: record.diastolic,
            category: category.label,
            severity: 'warning'
          });
          break;
        case 'hypertension1':
          hypertension1Count++;
          abnormalValues.push({
            date: dayjs(record.measurementTime).format('MM-DD HH:mm'),
            systolic: record.systolic,
            diastolic: record.diastolic,
            category: category.label,
            severity: 'warning'
          });
          break;
        case 'hypertension2':
          hypertension2Count++;
          abnormalValues.push({
            date: dayjs(record.measurementTime).format('MM-DD HH:mm'),
            systolic: record.systolic,
            diastolic: record.diastolic,
            category: category.label,
            severity: 'error'
          });
          break;
        case 'crisis':
          crisisCount++;
          abnormalValues.push({
            date: dayjs(record.measurementTime).format('MM-DD HH:mm'),
            systolic: record.systolic,
            diastolic: record.diastolic,
            category: category.label,
            severity: 'error'
          });
          break;
      }
    });

    return {
      totalRecords,
      averageSystolic,
      averageDiastolic,
      averageHeartRate,
      minSystolic,
      maxSystolic,
      minDiastolic,
      maxDiastolic,
      normalCount,
      elevatedCount,
      hypertension1Count,
      hypertension2Count,
      crisisCount,
      abnormalValues: abnormalValues.slice(0, 10) // Show latest 10 abnormal values
    };
  };

  const filteredRecords = getFilteredRecords();
  const stats = calculateStatistics(filteredRecords);

  const normalPercentage = stats.totalRecords > 0 ? Math.round((stats.normalCount / stats.totalRecords) * 100) : 0;
  const abnormalCount = stats.elevatedCount + stats.hypertension1Count + stats.hypertension2Count + stats.crisisCount;
  const abnormalPercentage = stats.totalRecords > 0 ? Math.round((abnormalCount / stats.totalRecords) * 100) : 0;

  const columns = [
    {
      title: '日期时间',
      dataKey: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '血压值',
      key: 'bloodPressure',
      render: (record: any) => `${record.systolic}/${record.diastolic}`,
      width: 100,
    },
    {
      title: '分类',
      dataKey: 'category',
      key: 'category',
      render: (category: string, record: any) => (
        <Tag color={record.severity === 'error' ? 'red' : 'orange'}>
          {category}
        </Tag>
      ),
      width: 100,
    }
  ];

  const getHealthRiskLevel = () => {
    if (stats.crisisCount > 0) {
      return { level: '高风险', color: '#f5222d', icon: <WarningOutlined /> };
    } else if (stats.hypertension2Count > 0) {
      return { level: '中高风险', color: '#fa8c16', icon: <WarningOutlined /> };
    } else if (stats.hypertension1Count > 0 || stats.elevatedCount > 0) {
      return { level: '中等风险', color: '#faad14', icon: <WarningOutlined /> };
    } else {
      return { level: '低风险', color: '#52c41a', icon: <CheckCircleOutlined /> };
    }
  };

  const riskLevel = getHealthRiskLevel();

  if (filteredRecords.length === 0) {
    return (
      <Card title="统计报告">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无数据可统计
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* 总体统计 */}
      <Card title="总体统计" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={6}>
            <Statistic
              title="总记录数"
              value={stats.totalRecords}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic
              title="平均收缩压"
              value={stats.averageSystolic}
              suffix="mmHg"
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic
              title="平均舒张压"
              value={stats.averageDiastolic}
              suffix="mmHg"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {stats.averageHeartRate ? (
              <Statistic
                title="平均心率"
                value={stats.averageHeartRate}
                suffix="bpm"
                valueStyle={{ color: '#1890ff' }}
              />
            ) : (
              <Statistic
                title="心率数据"
                value="无"
                valueStyle={{ color: '#999' }}
              />
            )}
          </Col>
        </Row>
      </Card>

      {/* 血压分布 */}
      <Card title="血压分布分析" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>正常血压占比</span>
                <span style={{ color: '#52c41a' }}>{normalPercentage}%</span>
              </div>
              <Progress
                percent={normalPercentage}
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>异常血压占比</span>
                <span style={{ color: '#f5222d' }}>{abnormalPercentage}%</span>
              </div>
              <Progress
                percent={abnormalPercentage}
                strokeColor="#f5222d"
                showInfo={false}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
              <h4 style={{ marginBottom: 12, color: '#666' }}>详细分类统计</h4>
              <div style={{ marginBottom: 8 }}>
                <Tag color="green">正常</Tag> {stats.normalCount} 次
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="orange">血压偏高</Tag> {stats.elevatedCount} 次
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="orange">高血压1级</Tag> {stats.hypertension1Count} 次
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="red">高血压2级</Tag> {stats.hypertension2Count} 次
              </div>
              <div>
                <Tag color="red">高血压危象</Tag> {stats.crisisCount} 次
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 健康风险评估 */}
      <Card title="健康风险评估" style={{ marginBottom: 16 }}>
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {riskLevel.icon}
              <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                当前健康风险等级：{riskLevel.level}
              </span>
            </div>
          }
          description={
            <div>
              <p>基于近期血压记录分析，您的血压状况属于{riskLevel.level}范围。</p>
              {abnormalCount > 0 && (
                <p>发现 {abnormalCount} 次异常血压记录，建议关注血压变化并咨询医生。</p>
              )}
            </div>
          }
          type={riskLevel.level === '低风险' ? 'success' : riskLevel.level === '高风险' ? 'error' : 'warning'}
          showIcon
        />
      </Card>

      {/* 异常值检测 */}
      {stats.abnormalValues.length > 0 && (
        <Card title={`异常血压记录 (最近${stats.abnormalValues.length}次)`}>
          <Table
            dataSource={stats.abnormalValues}
            columns={columns}
            pagination={false}
            size="small"
            rowKey={(record, index) => `abnormal-${index}`}
          />
        </Card>
      )}
    </div>
  );
};

export default StatisticalReport;