import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  DatePicker,
  Card,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BloodPressureRecord } from '../../types';
import { recordService } from '../../services/recordService';
import { BP_CATEGORIES } from '../../utils/constants';
import AddRecordModal from './AddRecordModal';

const { RangePicker } = DatePicker;

const RecordsList: React.FC = () => {
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BloodPressureRecord | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchRecords = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await recordService.getRecords(params);
      setRecords(response.records);
    } catch (error: any) {
      console.error('Fetch records error:', error);
      message.error('获取记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      const validDates: [dayjs.Dayjs, dayjs.Dayjs] = [dates[0], dates[1]];
      setDateRange(validDates);
      fetchRecords(
        validDates[0].format('YYYY-MM-DD'),
        validDates[1].format('YYYY-MM-DD')
      );
    } else {
      setDateRange(null);
      fetchRecords();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await recordService.deleteRecord(id);
      message.success('记录删除成功');
      setRecords(records.filter(record => record.id !== id));
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (record: BloodPressureRecord) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleRecordSuccess = (record: BloodPressureRecord) => {
    if (editingRecord) {
      // Update existing record
      setRecords(records.map(r => r.id === record.id ? record : r));
    } else {
      // Add new record
      setRecords([record, ...records]);
    }
    setEditingRecord(null);
  };

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

  const getStats = () => {
    if (records.length === 0) {
      return { avgSystolic: 0, avgDiastolic: 0, avgHeartRate: 0 };
    }

    const total = records.length;
    const avgSystolic = Math.round(
      records.reduce((sum, r) => sum + r.systolic, 0) / total
    );
    const avgDiastolic = Math.round(
      records.reduce((sum, r) => sum + r.diastolic, 0) / total
    );
    const recordsWithHR = records.filter(r => r.heartRate);
    const avgHeartRate = recordsWithHR.length > 0
      ? Math.round(
          recordsWithHR.reduce((sum, r) => sum + (r.heartRate || 0), 0) / recordsWithHR.length
        )
      : 0;

    return { avgSystolic, avgDiastolic, avgHeartRate };
  };

  const stats = getStats();

  const columns = [
    {
      title: '测量时间',
      dataIndex: 'measurementTime',
      key: 'measurementTime',
      render: (time: string) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {dayjs(time).format('MM-DD HH:mm')}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {dayjs(time).format('YYYY年')}
          </div>
        </div>
      ),
    },
    {
      title: '血压值',
      key: 'bloodPressure',
      render: (_: any, record: BloodPressureRecord) => {
        const category = getBPCategory(record.systolic, record.diastolic);
        return (
          <div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>
              {record.systolic}/{record.diastolic}
              <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>
                mmHg
              </span>
            </div>
            <Tag color={category.color} style={{ marginTop: 4 }}>
              {category.label}
            </Tag>
          </div>
        );
      },
    },
    {
      title: '心率',
      dataIndex: 'heartRate',
      key: 'heartRate',
      render: (heartRate: number | null) => (
        heartRate ? (
          <div style={{ fontSize: 14 }}>
            {heartRate} <span style={{ color: '#999' }}>次/分</span>
          </div>
        ) : (
          <span style={{ color: '#ccc' }}>未记录</span>
        )
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => (
        notes ? (
          <div style={{ maxWidth: 200, fontSize: 12, color: '#666' }}>
            {notes}
          </div>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        )
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: BloodPressureRecord) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={records.length}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="平均收缩压"
              value={stats.avgSystolic}
              suffix="mmHg"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="平均舒张压"
              value={stats.avgDiastolic}
              suffix="mmHg"
              prefix={<FallOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="平均心率"
              value={stats.avgHeartRate}
              suffix="次/分"
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                placeholder={['开始日期', '结束日期']}
                allowClear
              />
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setModalVisible(true)}
              style={{ minWidth: 120 }}
            >
              添加记录
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Records Table */}
      <Card>
        {records.length === 0 ? (
          <Empty
            image="/api/placeholder/400/200"
            description={
              <div>
                <p style={{ fontSize: 16, marginBottom: 16 }}>暂无血压记录</p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                  size="large"
                >
                  添加第一条记录
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            size="middle"
          />
        )}
      </Card>

      {/* Add/Edit Record Modal */}
      <AddRecordModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
        }}
        onSuccess={handleRecordSuccess}
        editRecord={editingRecord}
      />
    </div>
  );
};

export default RecordsList;