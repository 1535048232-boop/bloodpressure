import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { medicationService } from '../../services/medicationService';
import { Medication } from '../../types';

const { TextArea } = Input;

interface AddMedicationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (medication: Medication) => void;
  editMedication?: Medication | null;
}

const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  editMedication
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEditing = !!editMedication;

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      let result;
      if (isEditing) {
        result = await medicationService.updateMedication(editMedication!.id, {
          name: values.name,
          dosage: values.dosage,
          frequency: values.frequency,
          instructions: values.instructions,
          isActive: editMedication!.isActive
        });
      } else {
        result = await medicationService.createMedication({
          name: values.name,
          dosage: values.dosage,
          frequency: values.frequency,
          instructions: values.instructions
        });
      }

      message.success(isEditing ? '药物信息已更新！' : '药物添加成功！');
      onSuccess(result.medication);
      form.resetFields();
      onCancel();
    } catch (error: any) {
      console.error('Save medication error:', error);
      message.error(error.response?.data?.error || '保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Initialize form when editing
  React.useEffect(() => {
    if (visible && editMedication) {
      form.setFieldsValue({
        name: editMedication.name,
        dosage: editMedication.dosage,
        frequency: editMedication.frequency,
        instructions: editMedication.instructions
      });
    } else if (visible && !editMedication) {
      form.resetFields();
    }
  }, [visible, editMedication, form]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
          <MedicineBoxOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          {isEditing ? '编辑药物' : '添加药物'}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
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
          name="name"
          label="药物名称"
          rules={[
            { required: true, message: '请输入药物名称' },
            { min: 2, message: '药物名称至少2个字符' }
          ]}
        >
          <Input
            placeholder="例如：氨氯地平片、硝苯地平缓释片"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="dosage"
          label="剂量规格"
        >
          <Input
            placeholder="例如：5mg、10mg/片"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          name="frequency"
          label="服药频率"
        >
          <Input
            placeholder="例如：每日1次、早晚各1次、每日3次"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          name="instructions"
          label="用法说明"
        >
          <TextArea
            rows={3}
            placeholder="例如：餐后服用、空腹服用、睡前服用等特殊说明"
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
            {isEditing ? '更新' : '添加'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddMedicationModal;
