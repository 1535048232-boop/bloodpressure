import React, { useState } from 'react';
import { Modal, Form, InputNumber, DatePicker, Input, Button, message, Row, Col } from 'antd';
import { HeartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { recordService } from '../../services/recordService';
import { BloodPressureRecord } from '../../types';

const { TextArea } = Input;

interface AddRecordModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (record: BloodPressureRecord) => void;
  editRecord?: BloodPressureRecord | null;
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  editRecord
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEditing = !!editRecord;

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const recordData = {
        systolic: values.systolic,
        diastolic: values.diastolic,
        heartRate: values.heartRate,
        measurementTime: values.measurementTime?.toISOString() || new Date().toISOString(),
        notes: values.notes
      };

      let result;
      if (isEditing) {
        result = await recordService.updateRecord(editRecord!.id, recordData);
      } else {
        result = await recordService.createRecord(recordData);
      }

      message.success(isEditing ? '记录更新成功！' : '记录添加成功！');
      onSuccess(result.record);
      form.resetFields();
      onCancel();
    } catch (error: any) {
      console.error('Save record error:', error);
      message.error(error.response?.data?.error || '保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (!systolic || !diastolic) return null;

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

  const [currentBP, setCurrentBP] = useState<{systolic?: number; diastolic?: number}>({});

  const handleBPChange = (field: 'systolic' | 'diastolic', value: string | number | null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || null : value;
    setCurrentBP(prev => ({ ...prev, [field]: numValue || undefined }));
  };

  const bpCategory = currentBP.systolic && currentBP.diastolic
    ? getBPCategory(currentBP.systolic, currentBP.diastolic)
    : null;

  // Initialize form when editing
  React.useEffect(() => {
    if (visible && editRecord) {
      form.setFieldsValue({
        systolic: editRecord.systolic,
        diastolic: editRecord.diastolic,
        heartRate: editRecord.heartRate,
        measurementTime: dayjs(editRecord.measurementTime),
        notes: editRecord.notes
      });
      setCurrentBP({
        systolic: editRecord.systolic,
        diastolic: editRecord.diastolic
      });
    } else if (visible && !editRecord) {
      form.setFieldsValue({
        measurementTime: dayjs()
      });
      setCurrentBP({});
    }
  }, [visible, editRecord, form]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
          <HeartOutlined style={{ marginRight: 8, color: '#f5222d' }} />
          {isEditing ? '编辑血压记录' : '添加血压记录'}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="systolic"
              label="收缩压 (高压)"
              rules={[
                { required: true, message: '请输入收缩压' },
                { type: 'number', min: 60, max: 300, message: '请输入60-300之间的有效值' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="例如：120"
                suffix="mmHg"
                onChange={(value) => handleBPChange('systolic', value)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="diastolic"
              label="舒张压 (低压)"
              rules={[
                { required: true, message: '请输入舒张压' },
                { type: 'number', min: 40, max: 200, message: '请输入40-200之间的有效值' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="例如：80"
                suffix="mmHg"
                onChange={(value) => handleBPChange('diastolic', value)}
              />
            </Form.Item>
          </Col>
        </Row>

        {bpCategory && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 6,
            backgroundColor: '#f6f8fa',
            border: `2px solid ${bpCategory.color}`,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <span style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: bpCategory.color
            }}>
              血压分类：{bpCategory.label}
            </span>
          </div>
        )}

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="heartRate"
              label="心率 (选填)"
              rules={[
                { type: 'number', min: 30, max: 300, message: '请输入30-300之间的有效值' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="例如：72"
                suffix="次/分"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="measurementTime"
              label="测量时间"
              rules={[{ required: true, message: '请选择测量时间' }]}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                format="YYYY-MM-DD HH:mm"
                placeholder="选择测量时间"
                suffixIcon={<ClockCircleOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="备注说明 (选填)"
        >
          <TextArea
            rows={3}
            placeholder="记录测量时的特殊情况，如：餐后、运动后、服药前等"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button
            size="large"
            onClick={onCancel}
            style={{ minWidth: 100 }}
          >
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={loading}
            style={{ minWidth: 100 }}
          >
            {isEditing ? '更新' : '保存'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddRecordModal;