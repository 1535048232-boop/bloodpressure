import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import { BloodPressureRecord, Medication } from '../types';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  records: BloodPressureRecord[];
  medications?: Medication[];
  reportTitle?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

class ExportService {
  /**
   * Export blood pressure data to Excel
   */
  exportToExcel(data: ExportData): void {
    const { records, medications, reportTitle = '血压记录报告', dateRange } = data;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Blood pressure records worksheet
    const recordsData = records.map((record, index) => ({
      '序号': index + 1,
      '测量日期': dayjs(record.measurementTime).format('YYYY-MM-DD'),
      '测量时间': dayjs(record.measurementTime).format('HH:mm:ss'),
      '收缩压(mmHg)': record.systolic,
      '舒张压(mmHg)': record.diastolic,
      '心率(bpm)': record.heartRate || '未记录',
      '血压分类': this.getBPCategory(record.systolic, record.diastolic),
      '备注': record.notes || ''
    }));

    const recordsWS = XLSX.utils.json_to_sheet(recordsData);

    // Set column widths
    recordsWS['!cols'] = [
      { wch: 8 },   // 序号
      { wch: 12 },  // 测量日期
      { wch: 10 },  // 测量时间
      { wch: 12 },  // 收缩压
      { wch: 12 },  // 舒张压
      { wch: 10 },  // 心率
      { wch: 12 },  // 血压分类
      { wch: 20 }   // 备注
    ];

    XLSX.utils.book_append_sheet(wb, recordsWS, '血压记录');

    // Medications worksheet (if provided)
    if (medications && medications.length > 0) {
      const medicationsData = medications.map((med, index) => ({
        '序号': index + 1,
        '药物名称': med.name,
        '剂量': med.dosage || '',
        '服用频率': med.frequency || '',
        '用药说明': med.instructions || '',
        '状态': med.isActive ? '活跃' : '停用',
        '创建时间': dayjs(med.createdAt).format('YYYY-MM-DD HH:mm')
      }));

      const medicationsWS = XLSX.utils.json_to_sheet(medicationsData);
      medicationsWS['!cols'] = [
        { wch: 8 },   // 序号
        { wch: 15 },  // 药物名称
        { wch: 12 },  // 剂量
        { wch: 15 },  // 服用频率
        { wch: 20 },  // 用药说明
        { wch: 8 },   // 状态
        { wch: 18 }   // 创建时间
      ];

      XLSX.utils.book_append_sheet(wb, medicationsWS, '用药记录');
    }

    // Generate statistics worksheet
    const stats = this.calculateStatistics(records);
    const statisticsData = [
      ['统计项目', '数值', '单位'],
      ['总记录数', stats.totalRecords, '次'],
      ['平均收缩压', stats.avgSystolic, 'mmHg'],
      ['平均舒张压', stats.avgDiastolic, 'mmHg'],
      ['最高收缩压', stats.maxSystolic, 'mmHg'],
      ['最低收缩压', stats.minSystolic, 'mmHg'],
      ['最高舒张压', stats.maxDiastolic, 'mmHg'],
      ['最低舒张压', stats.minDiastolic, 'mmHg'],
      ['正常血压次数', stats.normalCount, '次'],
      ['异常血压次数', stats.abnormalCount, '次'],
      ['血压正常率', `${stats.normalRate}%`, '%']
    ];

    const statisticsWS = XLSX.utils.aoa_to_sheet(statisticsData);
    statisticsWS['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, statisticsWS, '统计分析');

    // Generate filename
    const filename = this.generateFilename(reportTitle, 'excel', dateRange);

    // Save the file
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export blood pressure data to PDF
   */
  exportToPDF(data: ExportData): void {
    const { records, medications, reportTitle = '血压记录报告', dateRange } = data;

    const pdf = new jsPDF();

    // Set Chinese font (for better Chinese character support)
    pdf.setFont('helvetica');

    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.text(reportTitle, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Date range (if provided)
    if (dateRange) {
      pdf.setFontSize(12);
      pdf.text(`报告期间: ${dateRange.start} 至 ${dateRange.end}`, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Generation date
    pdf.setFontSize(10);
    pdf.text(`生成日期: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Statistics summary
    const stats = this.calculateStatistics(records);
    pdf.setFontSize(14);
    pdf.text('统计摘要', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    const summaryText = [
      `总记录数: ${stats.totalRecords} 次`,
      `平均收缩压: ${stats.avgSystolic} mmHg`,
      `平均舒张压: ${stats.avgDiastolic} mmHg`,
      `血压正常率: ${stats.normalRate}%`
    ];

    summaryText.forEach(text => {
      pdf.text(text, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Blood pressure records table
    if (records.length > 0) {
      const recordsTableData = records.slice(0, 50).map((record, index) => [
        (index + 1).toString(),
        dayjs(record.measurementTime).format('MM-DD'),
        dayjs(record.measurementTime).format('HH:mm'),
        record.systolic.toString(),
        record.diastolic.toString(),
        record.heartRate?.toString() || '-',
        this.getBPCategory(record.systolic, record.diastolic),
        record.notes?.substring(0, 10) || ''
      ]);

      pdf.autoTable({
        head: [['序号', '日期', '时间', '收缩压', '舒张压', '心率', '分类', '备注']],
        body: recordsTableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { cellWidth: 15 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 15 },
          6: { cellWidth: 25 },
          7: { cellWidth: 25 }
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Medications table (if provided and space allows)
    if (medications && medications.length > 0 && yPosition < 250) {
      pdf.setFontSize(14);
      pdf.text('用药记录', 20, yPosition);
      yPosition += 10;

      const medicationsTableData = medications.slice(0, 10).map((med, index) => [
        (index + 1).toString(),
        med.name.substring(0, 15),
        (med.dosage || '').substring(0, 10),
        (med.frequency || '').substring(0, 10),
        med.isActive ? '活跃' : '停用'
      ]);

      pdf.autoTable({
        head: [['序号', '药物名称', '剂量', '频率', '状态']],
        body: medicationsTableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [139, 195, 74],
          textColor: 255
        }
      });
    }

    // If too many records, add a note
    if (records.length > 50) {
      const finalY = (pdf as any).lastAutoTable?.finalY || yPosition;
      pdf.setFontSize(8);
      pdf.text(`注: 仅显示前50条记录，完整数据请使用Excel导出功能`, 20, finalY + 10);
    }

    // Generate filename and save
    const filename = this.generateFilename(reportTitle, 'pdf', dateRange);
    pdf.save(filename);
  }

  /**
   * Get blood pressure category
   */
  private getBPCategory(systolic: number, diastolic: number): string {
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
  }

  /**
   * Calculate basic statistics
   */
  private calculateStatistics(records: BloodPressureRecord[]) {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        maxSystolic: 0,
        minSystolic: 0,
        maxDiastolic: 0,
        minDiastolic: 0,
        normalCount: 0,
        abnormalCount: 0,
        normalRate: 0
      };
    }

    const systolicValues = records.map(r => r.systolic);
    const diastolicValues = records.map(r => r.diastolic);

    const avgSystolic = Math.round(systolicValues.reduce((a, b) => a + b, 0) / records.length);
    const avgDiastolic = Math.round(diastolicValues.reduce((a, b) => a + b, 0) / records.length);

    const maxSystolic = Math.max(...systolicValues);
    const minSystolic = Math.min(...systolicValues);
    const maxDiastolic = Math.max(...diastolicValues);
    const minDiastolic = Math.min(...diastolicValues);

    const normalCount = records.filter(r => r.systolic < 120 && r.diastolic < 80).length;
    const abnormalCount = records.length - normalCount;
    const normalRate = Math.round((normalCount / records.length) * 100);

    return {
      totalRecords: records.length,
      avgSystolic,
      avgDiastolic,
      maxSystolic,
      minSystolic,
      maxDiastolic,
      minDiastolic,
      normalCount,
      abnormalCount,
      normalRate
    };
  }

  /**
   * Generate filename based on report type and date range
   */
  private generateFilename(reportTitle: string, type: 'excel' | 'pdf', dateRange?: { start: string; end: string }): string {
    const timestamp = dayjs().format('YYYY-MM-DD');
    const extension = type === 'excel' ? 'xlsx' : 'pdf';

    let filename = `${reportTitle}_${timestamp}.${extension}`;

    if (dateRange) {
      const start = dayjs(dateRange.start).format('MMDD');
      const end = dayjs(dateRange.end).format('MMDD');
      filename = `${reportTitle}_${start}-${end}_${timestamp}.${extension}`;
    }

    return filename;
  }
}

export const exportService = new ExportService();