import React, { useState } from 'react';
import { Modal, Form, DatePicker, Input, Button, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { medicationService } from '../../services/medicationService';
import { MedicationRecord } from '../../types';

const { TextArea } = Input;

interface RecordIntakeModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (record: MedicationRecord) => void;
  medicationId: number;
  medicationName: string;
}

const RecordIntakeModal: React.FC<RecordIntakeModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  medicationId,
  medicationName
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const result = await medicationService.recordMedicationTaken(medicationId, {
        takenAt: values.takenAt?.toISOString() || new Date().toISOString(),
        notes: values.notes
      });

      message.success('服药记录添加成功！');
      onSuccess(result.record);
      form.resetFields();
      onCancel();
    } catch (error: any) {
      console.error('Record medication error:', error);
      message.error(error.response?.data?.error || '记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        takenAt: dayjs()
      });
    }
  }, [visible, form]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
          <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          记录服药 - {medicationName}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={450}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="takenAt"
          label="服药时间"
          rules={[{ required: true, message: '请选择服药时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm"
            placeholder="选择服药时间"
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="服药备注"
        >
          <TextArea
            rows={3}
            placeholder="记录服药情况，如：按时服用、忘记服用、剂量调整等"
            maxLength={200}
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
            记录
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RecordIntakeModal;