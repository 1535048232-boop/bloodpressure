import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Row, Col, Card, Statistic, List, Tag, Button, Tabs, message } from 'antd';
import { HeartOutlined, MedicineBoxOutlined, RiseOutlined, FallOutlined, PlusOutlined, BarChartOutlined, LineChartOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import MainLayout from '../common/MainLayout';
import InstallPWAPrompt from '../pwa/InstallPWAPrompt';
import { recordService } from '../../services/recordService';
import { medicationService } from '../../services/medicationService';
import { healthRecommendationService } from '../../utils/healthRecommendationService';
import { useOptimizedData, useStatistics } from '../../utils/performanceHooks';
import { BloodPressureRecord, Medication } from '../../types';
import { BloodPressureTrendChart, BloodPressureComparisonChart, HeartRateTrend } from '../charts';
import { StatisticalReport, MedicationAdherence } from '../statistics';
import { DataExport } from '../export';
import './Dashboard.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [allRecords, setAllRecords] = useState<BloodPressureRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [chartTimeRange, setChartTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const handleTimeRangeChange = (range: string) => {
    if (range === 'week' || range === 'month' || range === 'quarter' || range === 'year') {
      setChartTimeRange(range);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent records (last 10 for dashboard)
        const recentRecordsResponse = await recordService.getRecords({ limit: 10 });
        setRecords(recentRecordsResponse.records);

        // Fetch all records for charts (limit to last 200 for performance)
        const allRecordsResponse = await recordService.getRecords({ limit: 200 });
        setAllRecords(allRecordsResponse.records);

        // Fetch medications
        const medicationsResponse = await medicationService.getMedications();
        setMedications(medicationsResponse.medications);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      }
    };

    fetchData();
  }, []);

  // Performance optimized data processing
  const optimizedRecords = useOptimizedData(records, 10);
  const optimizedAllRecords = useOptimizedData(allRecords, 200);
  const stats = useStatistics(optimizedRecords);

  // Memoized health advice calculation
  const healthAdvice = useMemo(() => {
    const recommendations = healthRecommendationService.generateRecommendations(
      optimizedAllRecords,
      medications,
      'month'
    );

    if (recommendations.length === 0) {
      return {
        title: '🌟 开始记录您的血压',
        advice: ['点击"血压记录"开始第一次测量', '建议每天定时测量血压', '保持良好的生活习惯'],
        type: 'info' as const
      };
    }

    const topRecommendation = recommendations[0];
    return {
      title: topRecommendation.title,
      advice: topRecommendation.actions.slice(0, 3),
      type: topRecommendation.type,
      trend: topRecommendation.trend
    };
  }, [optimizedAllRecords, medications]);

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { label: '正常', color: '#52c41a' };
    } else if (systolic < 130 && diastolic < 80) {
      return { label: '血压偏高', color: '#faad14' };
    } else if (systolic < 140 || diastolic < 90) {
      return { label: '高血压1级', color: '#fa8c16' };
    } else if (systolic < 180 || diastolic < 120) {
      return { label: '高血压2级', color: '#f5222d' };
    } else {
      return { label: '高血压危象', color: '#820014' };
    }
  };

  // Use optimized stats instead of calculating again
  const dashboardStats = {
    totalRecords: stats.total,
    avgSystolic: stats.avgSystolic,
    avgDiastolic: stats.avgDiastolic,
    medicationsCount: medications.filter(m => m.isActive).length
  };

  return (
    <MainLayout>
      <InstallPWAPrompt />
      <div>
        <Title level={2} className="dashboard-title" style={{ marginBottom: 24 }}>
          仪表盘
        </Title>

        <Row gutter={[16, 16]} className="dashboard-stats" style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总记录数"
                value={dashboardStats.totalRecords}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均收缩压"
                value={dashboardStats.avgSystolic}
                suffix="mmHg"
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均舒张压"
                value={dashboardStats.avgDiastolic}
                suffix="mmHg"
                prefix={<FallOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="用药种类"
                value={dashboardStats.medicationsCount}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="数据可视化分析" className="dashboard-charts" style={{ minHeight: 500 }}>
              <Tabs defaultActiveKey="trend">
                <TabPane
                  tab={
                    <span>
                      <LineChartOutlined />
                      血压趋势
                    </span>
                  }
                  key="trend"
                >
                  <BloodPressureTrendChart
                    records={optimizedAllRecords}
                    timeRange={chartTimeRange}
                    onTimeRangeChange={handleTimeRangeChange}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <BarChartOutlined />
                      血压对比
                    </span>
                  }
                  key="comparison"
                >
                  <BloodPressureComparisonChart
                    records={optimizedAllRecords}
                    timeRange={chartTimeRange}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <HeartOutlined />
                      心率分析
                    </span>
                  }
                  key="heartrate"
                >
                  <HeartRateTrend
                    records={optimizedAllRecords}
                    timeRange={chartTimeRange}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <BarChartOutlined />
                      统计报告
                    </span>
                  }
                  key="statistics"
                >
                  <StatisticalReport
                    records={optimizedAllRecords}
                    timeRange={chartTimeRange}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <MedicineBoxOutlined />
                      用药依从性
                    </span>
                  }
                  key="medication"
                >
                  <MedicationAdherence
                    medications={medications}
                    timeRange={chartTimeRange}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <DownloadOutlined />
                      数据导出
                    </span>
                  }
                  key="export"
                >
                  <DataExport
                    records={optimizedAllRecords}
                    medications={medications}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="最近记录"
              className="dashboard-recent-records"
              style={{ minHeight: 500 }}
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/records')}
                >
                  查看全部
                </Button>
              }
            >
              {optimizedRecords.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 300,
                  color: '#999'
                }}>
                  <Text style={{ marginBottom: 16 }}>暂无记录</Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/records')}
                  >
                    添加记录
                  </Button>
                </div>
              ) : (
                <List
                  dataSource={optimizedRecords.slice(0, 5)}
                  renderItem={(record) => {
                    const category = getBPCategory(record.systolic, record.diastolic);
                    return (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text strong style={{ fontSize: 14 }}>
                              {record.systolic}/{record.diastolic}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(record.measurementTime).format('MM-DD HH:mm')}
                            </Text>
                          </div>
                          <Tag color={category.color}>
                            {category.label}
                          </Tag>
                        </div>
                      </List.Item>
                    );
                  }}
                  size="small"
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title="智能健康建议" className="dashboard-health-advice" bodyStyle={{ padding: 24 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text style={{
                  fontSize: 16,
                  color: healthAdvice.type === 'critical' ? '#f5222d' :
                         healthAdvice.type === 'warning' ? '#fa8c16' :
                         healthAdvice.type === 'success' ? '#52c41a' : '#1890ff'
                }}>
                  {healthAdvice.title}
                </Text>
                {healthAdvice.trend && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    趋势分析：{healthAdvice.trend.description} (置信度: {Math.round(healthAdvice.trend.confidence * 100)}%)
                  </div>
                )}
                <div style={{ marginTop: 12, color: '#666', textAlign: 'left' }}>
                  {healthAdvice.advice.map((advice, index) => (
                    <p key={index} style={{ margin: '8px 0' }}>• {advice}</p>
                  ))}
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    // In a real app, this could navigate to a detailed health insights page
                    message.info('完整健康建议功能开发中');
                  }}
                  style={{ marginTop: 8 }}
                >
                  查看详细建议 →
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
};

export default Dashboard;