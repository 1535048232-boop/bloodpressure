import React, { useState } from 'react';
import { Typography, Card, Form, Input, Button, Select, DatePicker, message, Row, Col, Divider, Avatar } from 'antd';
import { UserOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import MainLayout from '../common/MainLayout';
import { useAuth } from '../auth/AuthContext';
import { authService } from '../../services/authService';

const { Title, Text } = Typography;
const { Option } = Select;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        birthDate: user.birthDate ? dayjs(user.birthDate) : null,
        gender: user.gender
      });
    }
  }, [user, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await authService.updateProfile({
        email: values.email,
        fullName: values.fullName,
        birthDate: values.birthDate?.format('YYYY-MM-DD'),
        gender: values.gender
      });
      message.success('个人信息已更新');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>
          个人设置
        </Title>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card style={{ textAlign: 'center' }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
              />
              <Title level={4}>{user?.fullName || user?.username}</Title>
              <Text type="secondary">@{user?.username}</Text>
              <Divider />
              <Text type="secondary" style={{ fontSize: 12 }}>
                注册时间：{user?.createdAt ? dayjs(user.createdAt).format('YYYY年MM月DD日') : '未知'}
              </Text>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="基本信息">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                size="large"
              >
                <Form.Item
                  name="username"
                  label="用户名"
                >
                  <Input prefix={<UserOutlined />} disabled />
                </Form.Item>

                <Form.Item
                  name="fullName"
                  label="姓名"
                >
                  <Input placeholder="请输入您的姓名" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="birthDate" label="出生日期">
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择出生日期" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="gender" label="性别">
                      <Select placeholder="选择性别" allowClear>
                        <Option value="male">男</Option>
                        <Option value="female">女</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    style={{ minWidth: 120 }}
                  >
                    保存修改
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
};

export default Profile;
