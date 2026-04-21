import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Row,
  Col,
  Tag,
  Typography,
  Empty,
  Avatar,
  Popconfirm,
  Modal,
  List,

  Tooltip
} from 'antd';
import {
  PlusOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Medication, MedicationRecord } from '../../types';
import { medicationService } from '../../services/medicationService';
import AddMedicationModal from './AddMedicationModal';
import RecordIntakeModal from './RecordIntakeModal';

const { Title, Text, Paragraph } = Typography;

const MedicationsList: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<MedicationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await medicationService.getMedications();
      setMedications(response.medications);
    } catch (error: any) {
      console.error('Fetch medications error:', error);
      message.error('获取药物列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleAddSuccess = (medication: Medication) => {
    if (editingMedication) {
      setMedications(medications.map(m => m.id === medication.id ? medication : m));
      setEditingMedication(null);
    } else {
      setMedications([medication, ...medications]);
    }
  };

  const handleRecordIntake = (medication: Medication) => {
    setSelectedMedication(medication);
    setIntakeModalVisible(true);
  };

  const handleIntakeSuccess = () => {
    setSelectedMedication(null);
    message.success('服药记录已添加');
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setAddModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await medicationService.deleteMedication(id);
      setMedications(medications.filter(m => m.id !== id));
      message.success('药物已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleActive = async (medication: Medication) => {
    try {
      const result = await medicationService.updateMedication(medication.id, {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        instructions: medication.instructions,
        isActive: !medication.isActive
      });
      setMedications(medications.map(m => m.id === medication.id ? result.medication : m));
      message.success(medication.isActive ? '已停用该药物' : '已恢复使用该药物');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewHistory = async (medication: Medication) => {
    setSelectedMedication(medication);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const response = await medicationService.getMedicationHistory(medication.id, { limit: 50 });
      setHistoryRecords(response.records);
    } catch (error) {
      message.error('获取服药历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const MedicationCard: React.FC<{ medication: Medication }> = ({ medication }) => (
    <Card
      size="small"
      style={{ marginBottom: 16, opacity: medication.isActive ? 1 : 0.7 }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Row align="middle" justify="space-between" wrap={true} gutter={[16, 12]}>
        <Col flex={1} style={{ minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Avatar
              size="small"
              icon={<MedicineBoxOutlined />}
              style={{ backgroundColor: medication.isActive ? '#722ed1' : '#999', marginRight: 12 }}
            />
            <Title level={5} style={{ margin: 0, fontSize: 16 }}>
              {medication.name}
            </Title>
            <Tag color={medication.isActive ? 'green' : 'default'} style={{ marginLeft: 8 }}>
              {medication.isActive ? '使用中' : '已停用'}
            </Tag>
          </div>

          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text type="secondary" style={{ minWidth: 60 }}>剂量：</Text>
                <Text>{medication.dosage || '未设置'}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text type="secondary" style={{ minWidth: 60 }}>频率：</Text>
                <Text>{medication.frequency || '未设置'}</Text>
              </div>
            </Col>
          </Row>

          {medication.instructions && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">用法：</Text>
              <Paragraph style={{ margin: '4px 0 0 0', fontSize: 13, color: '#666' }}>
                {medication.instructions}
              </Paragraph>
            </div>
          )}
        </Col>

        <Col>
          <Space direction="vertical" size="small">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleRecordIntake(medication)}
              style={{ width: 110 }}
              disabled={!medication.isActive}
            >
              记录服药
            </Button>
            <Button
              type="default"
              icon={<HistoryOutlined />}
              size="small"
              style={{ width: 110 }}
              onClick={() => handleViewHistory(medication)}
            >
              查看历史
            </Button>
            <Space size="small">
              <Tooltip title="编辑">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(medication)}
                />
              </Tooltip>
              <Tooltip title={medication.isActive ? '停用' : '启用'}>
                <Button
                  type="text"
                  icon={<StopOutlined />}
                  size="small"
                  onClick={() => handleToggleActive(medication)}
                  style={{ color: medication.isActive ? '#faad14' : '#52c41a' }}
                />
              </Tooltip>
              <Popconfirm
                title="确定要删除该药物及其所有服药记录吗？"
                onConfirm={() => handleDelete(medication.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ fontSize: 24, marginRight: 12, color: '#722ed1' }} />
            <div>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>我的药物</Text>
              <div style={{ fontSize: 14, color: '#999', marginTop: 2 }}>
                共 {medications.length} 种药物，{medications.filter(m => m.isActive).length} 种使用中
              </div>
            </div>
          </div>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              setEditingMedication(null);
              setAddModalVisible(true);
            }}
            style={{ minWidth: 120 }}
          >
            添加药物
          </Button>
        </Col>
      </Row>

      {/* Quick Actions Card */}
      <Card style={{ marginBottom: 24, backgroundColor: '#fafafa' }}>
        <Row align="middle">
          <Col flex={1}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 12 }} />
              <div>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>今日用药提醒</Text>
                <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                  记得按时服药，保持健康
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <Text style={{ color: '#1890ff', fontSize: 14 }}>
              {dayjs().format('YYYY年MM月DD日 HH:mm')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Medications List */}
      <Card title="药物列表" bodyStyle={{ padding: medications.length === 0 ? '40px 20px' : '20px' }}>
        {medications.length === 0 ? (
          <Empty
            description={
              <div>
                <p style={{ fontSize: 16, marginBottom: 16 }}>暂无药物记录</p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddModalVisible(true)}
                  size="large"
                >
                  添加第一个药物
                </Button>
              </div>
            }
          />
        ) : (
          <div>
            {medications.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Medication Modal */}
      <AddMedicationModal
        visible={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setEditingMedication(null);
        }}
        onSuccess={handleAddSuccess}
        editMedication={editingMedication}
      />

      {/* Record Intake Modal */}
      <RecordIntakeModal
        visible={intakeModalVisible}
        onCancel={() => {
          setIntakeModalVisible(false);
          setSelectedMedication(null);
        }}
        onSuccess={handleIntakeSuccess}
        medicationId={selectedMedication?.id || 0}
        medicationName={selectedMedication?.name || ''}
      />

      {/* History Modal */}
      <Modal
        title={`${selectedMedication?.name || ''} - 服药历史`}
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setHistoryRecords([]);
        }}
        footer={null}
        width={500}
      >
        <List
          loading={historyLoading}
          dataSource={historyRecords}
          locale={{ emptyText: '暂无服药记录' }}
          renderItem={(record: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginTop: 4 }} />}
                title={dayjs(record.taken_at).format('YYYY-MM-DD HH:mm')}
                description={record.notes || '按时服用'}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default MedicationsList;
