import React, { useState } from 'react';
import { Card, Button, Space, DatePicker, Select, message, Spin } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import { exportService, ExportData } from '../../utils/exportService';
import { BloodPressureRecord, Medication } from '../../types';

const { RangePicker } = DatePicker;

interface DataExportProps {
  records: BloodPressureRecord[];
  medications: Medication[];
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

const DataExport: React.FC<DataExportProps> = ({
  records,
  medications,
  onExportStart,
  onExportComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [exportType, setExportType] = useState<'all' | 'records' | 'medications'>('all');

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      const validDates: [dayjs.Dayjs, dayjs.Dayjs] = [dates[0], dates[1]];
      setDateRange(validDates);
    } else {
      setDateRange(null);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setLoading(true);
    onExportStart?.();

    try {
      // Filter records based on selected date range
      let filteredRecords = records;
      if (dateRange) {
        const [start, end] = dateRange;
        filteredRecords = records.filter(record =>
          dayjs(record.measurementTime).isAfter(start.startOf('day')) &&
          dayjs(record.measurementTime).isBefore(end.endOf('day'))
        );
      }

      if (filteredRecords.length === 0) {
        message.warning('选定时间范围内没有数据可导出');
        return;
      }

      const exportData: ExportData = {
        records: filteredRecords,
        reportTitle: '血压记录报告'
      };

      // Include medications if requested
      if (exportType === 'all' || exportType === 'medications') {
        exportData.medications = medications;
      }

      // Include date range info if selected
      if (dateRange) {
        exportData.dateRange = {
          start: dateRange[0].format('YYYY-MM-DD'),
          end: dateRange[1].format('YYYY-MM-DD')
        };
      }

      // Export based on format
      if (format === 'excel') {
        exportService.exportToExcel(exportData);
        message.success(`Excel文件导出成功！共导出 ${filteredRecords.length} 条记录`);
      } else {
        exportService.exportToPDF(exportData);
        message.success(`PDF文件导出成功！共导出 ${Math.min(filteredRecords.length, 50)} 条记录`);
        if (filteredRecords.length > 50) {
          message.info('PDF格式限制显示前50条记录，完整数据请使用Excel导出');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
      onExportComplete?.();
    }
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    // Disable dates after today
    return current && current > dayjs().endOf('day');
  };

  const getRecordCount = () => {
    if (!dateRange) return records.length;

    const [start, end] = dateRange;
    return records.filter(record =>
      dayjs(record.measurementTime).isAfter(start.startOf('day')) &&
      dayjs(record.measurementTime).isBefore(end.endOf('day'))
    ).length;
  };

  const presetRanges = [
    {
      label: '最近7天',
      value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
    },
    {
      label: '最近30天',
      value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
    },
    {
      label: '最近3个月',
      value: [dayjs().subtract(3, 'month'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
    },
    {
      label: '最近1年',
      value: [dayjs().subtract(1, 'year'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
    },
  ];

  return (
    <Card title="数据导出" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Date Range Selection */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择导出时间范围：</div>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              presets={presetRanges}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%', maxWidth: 400 }}
            />
            <div style={{ marginTop: 4, color: '#666', fontSize: '12px' }}>
              {dateRange
                ? `将导出 ${getRecordCount()} 条记录`
                : `全部 ${records.length} 条记录`
              }
            </div>
          </div>

          {/* Export Content Selection */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择导出内容：</div>
            <Select
              value={exportType}
              onChange={setExportType}
              style={{ width: 200 }}
              options={[
                { label: '血压记录 + 用药记录', value: 'all' },
                { label: '仅血压记录', value: 'records' },
                { label: '仅用药记录', value: 'medications' }
              ]}
            />
          </div>

          {/* Export Buttons */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择导出格式：</div>
            <Space>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => handleExport('excel')}
                loading={loading}
                disabled={records.length === 0}
              >
                导出Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => handleExport('pdf')}
                loading={loading}
                disabled={records.length === 0}
              >
                导出PDF
              </Button>
            </Space>
          </div>
        </Space>
      </div>

      {/* Export Tips */}
      <div style={{
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: 6,
        padding: 12,
        marginTop: 16
      }}>
        <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 4 }}>导出说明：</div>
        <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
          • Excel格式包含完整数据，支持进一步分析<br />
          • PDF格式适合打印和分享，但限制显示50条记录<br />
          • 导出文件将自动保存到您的下载文件夹<br />
          • 文件名包含时间戳以便识别
        </div>
      </div>

      {loading && (
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          padding: 20,
          background: '#fafafa',
          borderRadius: 6
        }}>
          <Spin />
          <div style={{ marginTop: 8, color: '#666' }}>正在生成导出文件...</div>
        </div>
      )}
    </Card>
  );
};

export default DataExport;