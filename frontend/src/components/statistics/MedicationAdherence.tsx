import React from 'react';
import { Card, Row, Col, Progress, Statistic, Calendar, Badge, Empty, Tag } from 'antd';
import { MedicineBoxOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Medication } from '../../types';

interface MedicationAdherenceProps {
  medications: Medication[];
  // In a real implementation, you'd have intake records
  // medicationIntakes: MedicationIntake[];
  timeRange?: string;
}

// Mock medication intake data for demonstration
// In a real app, this would come from your backend
interface MockMedicationIntake {
  medicationId: string;
  takenAt: string;
  scheduledAt: string;
  taken: boolean;
}

const MedicationAdherence: React.FC<MedicationAdherenceProps> = ({
  medications,
  timeRange = 'month'
}) => {
  // Mock data for demonstration - in real implementation, fetch from API
  const generateMockIntakeData = (): MockMedicationIntake[] => {
    const intakes: MockMedicationIntake[] = [];
    const now = dayjs();

    medications.filter(med => med.isActive).forEach(medication => {
      // Generate intake records for the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = now.subtract(i, 'day');
        const scheduledTime = date.hour(9).minute(0).second(0); // Mock: 9:00 AM daily

        // 85% adherence rate (mock)
        const taken = Math.random() > 0.15;
        const takenTime = taken
          ? scheduledTime.add(Math.random() * 120 - 60, 'minute') // ±1 hour variance
          : scheduledTime;

        intakes.push({
          medicationId: medication.id!.toString(),
          scheduledAt: scheduledTime.toISOString(),
          takenAt: takenTime.toISOString(),
          taken
        });
      }
    });

    return intakes;
  };

  const mockIntakes = generateMockIntakeData();

  const getFilteredIntakes = () => {
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
      default:
        startDate = now.subtract(30, 'day');
    }

    return mockIntakes.filter(intake =>
      dayjs(intake.scheduledAt).isAfter(startDate)
    );
  };

  const calculateAdherenceStats = () => {
    const filteredIntakes = getFilteredIntakes();

    if (filteredIntakes.length === 0) {
      return {
        totalScheduled: 0,
        totalTaken: 0,
        adherenceRate: 0,
        missedDoses: 0,
        onTimeDoses: 0,
        lateDoses: 0
      };
    }

    const totalScheduled = filteredIntakes.length;
    const totalTaken = filteredIntakes.filter(intake => intake.taken).length;
    const adherenceRate = Math.round((totalTaken / totalScheduled) * 100);
    const missedDoses = totalScheduled - totalTaken;

    // Calculate on-time vs late doses (within 30 minutes is considered on-time)
    let onTimeDoses = 0;
    let lateDoses = 0;

    filteredIntakes.filter(intake => intake.taken).forEach(intake => {
      const scheduledTime = dayjs(intake.scheduledAt);
      const takenTime = dayjs(intake.takenAt);
      const timeDiff = Math.abs(takenTime.diff(scheduledTime, 'minute'));

      if (timeDiff <= 30) {
        onTimeDoses++;
      } else {
        lateDoses++;
      }
    });

    return {
      totalScheduled,
      totalTaken,
      adherenceRate,
      missedDoses,
      onTimeDoses,
      lateDoses
    };
  };

  const getMedicationAdherenceByDrug = () => {
    const activeMedications = medications.filter(med => med.isActive);

    return activeMedications.map(medication => {
      const medicationIntakes = mockIntakes.filter(
        intake => intake.medicationId === medication.id!.toString()
      );

      const scheduled = medicationIntakes.length;
      const taken = medicationIntakes.filter(intake => intake.taken).length;
      const adherenceRate = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

      return {
        medication,
        scheduled,
        taken,
        adherenceRate,
        missed: scheduled - taken
      };
    });
  };

  const getCalendarData = (date: Dayjs) => {
    const dayIntakes = mockIntakes.filter(intake =>
      dayjs(intake.scheduledAt).isSame(date, 'day')
    );

    if (dayIntakes.length === 0) return null;

    const takenCount = dayIntakes.filter(intake => intake.taken).length;
    const totalCount = dayIntakes.length;

    if (takenCount === totalCount) {
      return { status: 'success' as const, text: '完全服药' };
    } else if (takenCount > 0) {
      return { status: 'warning' as const, text: '部分服药' };
    } else {
      return { status: 'error' as const, text: '遗漏服药' };
    }
  };

  const stats = calculateAdherenceStats();
  const medicationStats = getMedicationAdherenceByDrug();

  if (medications.filter(med => med.isActive).length === 0) {
    return (
      <Card title="用药依从性统计">
        <Empty
          description="暂无活跃用药记录"
          style={{ padding: '40px 0' }}
        />
      </Card>
    );
  }

  return (
    <div>
      {/* 总体依从性统计 */}
      <Card title="用药依从性总览" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="依从率"
              value={stats.adherenceRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color: stats.adherenceRate >= 80 ? '#52c41a' : stats.adherenceRate >= 60 ? '#faad14' : '#f5222d'
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="应服次数"
              value={stats.totalScheduled}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="已服次数"
              value={stats.totalTaken}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="遗漏次数"
              value={stats.missedDoses}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: 8 }}>按时服药率</div>
            <Progress
              percent={stats.totalTaken > 0 ? Math.round((stats.onTimeDoses / stats.totalTaken) * 100) : 0}
              strokeColor="#52c41a"
              format={(percent) => `${stats.onTimeDoses}/${stats.totalTaken}`}
            />
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: 8 }}>总体依从率</div>
            <Progress
              percent={stats.adherenceRate}
              strokeColor={
                stats.adherenceRate >= 80 ? '#52c41a' :
                stats.adherenceRate >= 60 ? '#faad14' : '#f5222d'
              }
            />
          </Col>
        </Row>
      </Card>

      {/* 各药物依从性 */}
      <Card title="各药物依从性分析" style={{ marginBottom: 16 }}>
        {medicationStats.map((medStat, index) => (
          <div key={index} style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold' }}>{medStat.medication.name}</span>
              <Tag color={medStat.adherenceRate >= 80 ? 'green' : medStat.adherenceRate >= 60 ? 'orange' : 'red'}>
                {medStat.adherenceRate}%
              </Tag>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
              {medStat.medication.dosage} | {medStat.medication.frequency}
            </div>
            <Progress
              percent={medStat.adherenceRate}
              format={(percent) => `${medStat.taken}/${medStat.scheduled}次`}
              strokeColor={
                medStat.adherenceRate >= 80 ? '#52c41a' :
                medStat.adherenceRate >= 60 ? '#faad14' : '#f5222d'
              }
              size="small"
            />
          </div>
        ))}
      </Card>

      {/* 服药日历 */}
      <Card title="服药日历">
        <Calendar
          fullscreen={false}
          dateCellRender={(date) => {
            const data = getCalendarData(date);
            if (!data) return null;

            return (
              <Badge
                status={data.status}
                text={data.text}
                style={{ fontSize: '10px' }}
              />
            );
          }}
        />
        <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
          <Badge status="success" text="完全服药" style={{ marginRight: 16 }} />
          <Badge status="warning" text="部分服药" style={{ marginRight: 16 }} />
          <Badge status="error" text="遗漏服药" />
        </div>
      </Card>
    </div>
  );
};

export default MedicationAdherence;