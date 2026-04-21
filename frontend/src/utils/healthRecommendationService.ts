import dayjs from 'dayjs';
import { BloodPressureRecord, Medication } from '../types';

export interface HealthRecommendation {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  actions: string[];
  priority: number;
  category: 'blood_pressure' | 'heart_rate' | 'medication' | 'lifestyle' | 'trend';
  trend?: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    confidence: number;
    description: string;
  };
}

export interface TrendAnalysis {
  systolicTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number; // mmHg per week
    confidence: number;
  };
  diastolicTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number; // mmHg per week
    confidence: number;
  };
  heartRateTrend?: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number; // bpm per week
    confidence: number;
  };
  variability: {
    systolicSD: number;
    diastolicSD: number;
    isHighVariability: boolean;
  };
  recentPattern: {
    timeOfDayEffect: boolean;
    weekendEffect: boolean;
    consistentMeasurement: boolean;
  };
}

class HealthRecommendationService {
  /**
   * Generate personalized health recommendations based on trend analysis
   */
  generateRecommendations(
    records: BloodPressureRecord[],
    medications: Medication[],
    timeRange: string = 'month'
  ): HealthRecommendation[] {
    if (records.length === 0) {
      return this.getBasicRecommendations();
    }

    const filteredRecords = this.filterRecordsByTimeRange(records, timeRange);
    const trendAnalysis = this.analyzeTrends(filteredRecords);
    const currentStatus = this.getCurrentStatus(filteredRecords);

    const recommendations: HealthRecommendation[] = [];

    // Critical blood pressure recommendations
    recommendations.push(...this.getCriticalRecommendations(currentStatus, trendAnalysis));

    // Trend-based recommendations
    recommendations.push(...this.getTrendBasedRecommendations(trendAnalysis));

    // Medication-related recommendations
    recommendations.push(...this.getMedicationRecommendations(medications, currentStatus));

    // Lifestyle recommendations
    recommendations.push(...this.getLifestyleRecommendations(currentStatus, trendAnalysis));

    // Variability recommendations
    recommendations.push(...this.getVariabilityRecommendations(trendAnalysis));

    // Sort by priority (higher priority first)
    return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 8);
  }

  /**
   * Analyze trends in blood pressure data
   */
  private analyzeTrends(records: BloodPressureRecord[]): TrendAnalysis {
    if (records.length < 3) {
      return this.getDefaultTrendAnalysis();
    }

    // Sort records by date
    const sortedRecords = records.sort((a, b) =>
      dayjs(a.measurementTime).valueOf() - dayjs(b.measurementTime).valueOf()
    );

    // Calculate linear trend using least squares
    const systolicTrend = this.calculateLinearTrend(
      sortedRecords.map(r => ({ date: dayjs(r.measurementTime), value: r.systolic }))
    );

    const diastolicTrend = this.calculateLinearTrend(
      sortedRecords.map(r => ({ date: dayjs(r.measurementTime), value: r.diastolic }))
    );

    let heartRateTrend;
    const heartRateRecords = sortedRecords.filter(r => r.heartRate);
    if (heartRateRecords.length >= 3) {
      heartRateTrend = this.calculateLinearTrend(
        heartRateRecords.map(r => ({ date: dayjs(r.measurementTime), value: r.heartRate! }))
      );
    }

    // Calculate variability
    const systolicValues = sortedRecords.map(r => r.systolic);
    const diastolicValues = sortedRecords.map(r => r.diastolic);

    const systolicSD = this.calculateStandardDeviation(systolicValues);
    const diastolicSD = this.calculateStandardDeviation(diastolicValues);

    // Analyze patterns
    const recentPattern = this.analyzePatterns(sortedRecords);

    return {
      systolicTrend,
      diastolicTrend,
      heartRateTrend,
      variability: {
        systolicSD,
        diastolicSD,
        isHighVariability: systolicSD > 15 || diastolicSD > 10
      },
      recentPattern
    };
  }

  /**
   * Calculate linear trend using least squares regression
   */
  private calculateLinearTrend(data: Array<{ date: dayjs.Dayjs; value: number }>) {
    if (data.length < 2) {
      return { direction: 'stable' as const, rate: 0, confidence: 0 };
    }

    const n = data.length;
    const startTime = data[0].date.valueOf();

    // Convert dates to days from start
    const points = data.map(d => ({
      x: (d.date.valueOf() - startTime) / (24 * 60 * 60 * 1000), // days
      y: d.value
    }));

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const weeklyRate = slope * 7; // Convert to weekly rate

    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const predicted = points.map(p => slope * p.x + (sumY - slope * sumX) / n);
    const ssRes = points.reduce((sum, p, i) => sum + Math.pow(p.y - predicted[i], 2), 0);
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(weeklyRate) < 0.5) {
      direction = 'stable';
    } else {
      direction = weeklyRate > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      rate: Math.abs(weeklyRate),
      confidence: Math.max(0, Math.min(1, rSquared))
    };
  }

  /**
   * Generate critical recommendations based on current status
   */
  private getCriticalRecommendations(currentStatus: any, trends: TrendAnalysis): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    if (currentStatus.hasCrisis) {
      recommendations.push({
        id: 'crisis-alert',
        type: 'critical',
        title: '⚠️ 血压危象警告',
        message: '检测到血压危象级别的测量值，需要立即就医。',
        actions: [
          '立即就医或联系急救服务',
          '记录具体症状和时间',
          '携带血压记录就诊',
          '遵医嘱紧急处理'
        ],
        priority: 100,
        category: 'blood_pressure'
      });
    }

    if (currentStatus.avgSystolic >= 140 || currentStatus.avgDiastolic >= 90) {
      const trendInfo = trends.systolicTrend.direction === 'increasing' || trends.diastolicTrend.direction === 'increasing'
        ? '血压呈上升趋势，' : '';

      recommendations.push({
        id: 'hypertension-warning',
        type: 'warning',
        title: '🔍 高血压预警',
        message: `${trendInfo}平均血压已达高血压水平，建议加强监测和管理。`,
        actions: [
          '增加血压监测频率',
          '咨询医生调整治疗方案',
          '严格控制饮食中的钠摄入',
          '坚持规律运动和作息'
        ],
        priority: 80,
        category: 'blood_pressure',
        trend: {
          direction: trends.systolicTrend.direction,
          confidence: trends.systolicTrend.confidence,
          description: `收缩压${trends.systolicTrend.direction === 'increasing' ? '上升' : trends.systolicTrend.direction === 'decreasing' ? '下降' : '稳定'}趋势`
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate trend-based recommendations
   */
  private getTrendBasedRecommendations(trends: TrendAnalysis): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Systolic trend recommendations
    if (trends.systolicTrend.direction === 'increasing' && trends.systolicTrend.confidence > 0.6) {
      recommendations.push({
        id: 'systolic-increasing',
        type: 'warning',
        title: '📈 收缩压上升趋势',
        message: `收缩压呈现上升趋势，每周约增加${trends.systolicTrend.rate.toFixed(1)}mmHg。`,
        actions: [
          '检查生活方式变化',
          '评估压力水平',
          '复查用药依从性',
          '考虑调整治疗方案'
        ],
        priority: 70,
        category: 'trend',
        trend: {
          direction: 'increasing',
          confidence: trends.systolicTrend.confidence,
          description: '收缩压持续上升'
        }
      });
    }

    if (trends.diastolicTrend.direction === 'increasing' && trends.diastolicTrend.confidence > 0.6) {
      recommendations.push({
        id: 'diastolic-increasing',
        type: 'warning',
        title: '📈 舒张压上升趋势',
        message: `舒张压呈现上升趋势，每周约增加${trends.diastolicTrend.rate.toFixed(1)}mmHg。`,
        actions: [
          '减少钠盐摄入',
          '增加有氧运动',
          '管理体重',
          '评估心血管风险'
        ],
        priority: 65,
        category: 'trend',
        trend: {
          direction: 'increasing',
          confidence: trends.diastolicTrend.confidence,
          description: '舒张压持续上升'
        }
      });
    }

    // Good trend recognition
    if (trends.systolicTrend.direction === 'decreasing' && trends.systolicTrend.confidence > 0.5) {
      recommendations.push({
        id: 'good-trend',
        type: 'success',
        title: '✅ 血压改善趋势',
        message: '血压呈现改善趋势，请继续保持当前的管理方式。',
        actions: [
          '继续当前的生活方式',
          '保持用药依从性',
          '定期监测以确认趋势',
          '与医生分享这一改善'
        ],
        priority: 60,
        category: 'trend',
        trend: {
          direction: 'decreasing',
          confidence: trends.systolicTrend.confidence,
          description: '血压改善趋势良好'
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate medication-related recommendations
   */
  private getMedicationRecommendations(medications: Medication[], currentStatus: any): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];
    const activeMeds = medications.filter(med => med.isActive);

    if (activeMeds.length === 0 && (currentStatus.avgSystolic > 130 || currentStatus.avgDiastolic > 85)) {
      recommendations.push({
        id: 'medication-needed',
        type: 'warning',
        title: '💊 考虑药物治疗',
        message: '血压水平较高但未记录活跃的降压药物，建议咨询医生。',
        actions: [
          '咨询医生是否需要药物治疗',
          '讨论降压药物的选择',
          '了解药物的副作用',
          '制定用药计划'
        ],
        priority: 75,
        category: 'medication'
      });
    }

    if (activeMeds.length > 0) {
      recommendations.push({
        id: 'medication-adherence',
        type: 'info',
        title: '⏰ 用药依从性提醒',
        message: '保持良好的用药依从性对血压控制至关重要。',
        actions: [
          '按时服用所有处方药物',
          '使用提醒工具避免遗漏',
          '定期检查药物库存',
          '记录服药时间和反应'
        ],
        priority: 45,
        category: 'medication'
      });
    }

    return recommendations;
  }

  /**
   * Generate lifestyle recommendations
   */
  private getLifestyleRecommendations(currentStatus: any, trends: TrendAnalysis): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // High variability lifestyle recommendations
    if (trends.variability.isHighVariability) {
      recommendations.push({
        id: 'reduce-variability',
        type: 'info',
        title: '📊 改善血压稳定性',
        message: '血压变异性较大，建议改善生活规律以稳定血压。',
        actions: [
          '保持规律的作息时间',
          '固定血压测量时间',
          '减少咖啡因摄入',
          '管理压力和情绪'
        ],
        priority: 50,
        category: 'lifestyle'
      });
    }

    // General lifestyle recommendations
    if (currentStatus.avgSystolic > 120 || currentStatus.avgDiastolic > 80) {
      recommendations.push({
        id: 'lifestyle-improvement',
        type: 'info',
        title: '🌱 生活方式优化',
        message: '通过健康的生活方式改善血压管理效果。',
        actions: [
          '采用DASH饮食模式',
          '每周至少150分钟中等强度运动',
          '维持健康体重',
          '限制酒精摄入'
        ],
        priority: 40,
        category: 'lifestyle'
      });
    }

    return recommendations;
  }

  /**
   * Generate variability-specific recommendations
   */
  private getVariabilityRecommendations(trends: TrendAnalysis): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    if (trends.variability.isHighVariability) {
      recommendations.push({
        id: 'high-variability',
        type: 'warning',
        title: '⚡ 血压波动较大',
        message: `血压变异性较高（收缩压SD: ${trends.variability.systolicSD.toFixed(1)}），需要关注。`,
        actions: [
          '标准化测量条件',
          '记录测量时的情况',
          '评估白大衣高血压',
          '考虑24小时动态血压监测'
        ],
        priority: 55,
        category: 'blood_pressure'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private filterRecordsByTimeRange(records: BloodPressureRecord[], timeRange: string): BloodPressureRecord[] {
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
  }

  private getCurrentStatus(records: BloodPressureRecord[]) {
    if (records.length === 0) {
      return { avgSystolic: 0, avgDiastolic: 0, hasCrisis: false };
    }

    const avgSystolic = records.reduce((sum, r) => sum + r.systolic, 0) / records.length;
    const avgDiastolic = records.reduce((sum, r) => sum + r.diastolic, 0) / records.length;
    const hasCrisis = records.some(r => r.systolic >= 180 || r.diastolic >= 120);

    return { avgSystolic, avgDiastolic, hasCrisis };
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private analyzePatterns(records: BloodPressureRecord[]) {
    // Simplified pattern analysis
    return {
      timeOfDayEffect: false,
      weekendEffect: false,
      consistentMeasurement: records.length >= 7
    };
  }

  private getDefaultTrendAnalysis(): TrendAnalysis {
    return {
      systolicTrend: { direction: 'stable', rate: 0, confidence: 0 },
      diastolicTrend: { direction: 'stable', rate: 0, confidence: 0 },
      variability: { systolicSD: 0, diastolicSD: 0, isHighVariability: false },
      recentPattern: { timeOfDayEffect: false, weekendEffect: false, consistentMeasurement: false }
    };
  }

  private getBasicRecommendations(): HealthRecommendation[] {
    return [
      {
        id: 'start-monitoring',
        type: 'info',
        title: '📋 开始血压监测',
        message: '建议开始规律的血压监测，建立健康档案。',
        actions: [
          '每天固定时间测量血压',
          '记录测量环境和身体状态',
          '建立血压监测习惯',
          '定期与医生分享数据'
        ],
        priority: 50,
        category: 'blood_pressure'
      }
    ];
  }
}

export const healthRecommendationService = new HealthRecommendationService();