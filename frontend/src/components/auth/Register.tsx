import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Row, Col, DatePicker, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ContactsOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user, register } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      const success = await register({
        username: values.username,
        password: values.password,
        email: values.email,
        fullName: values.fullName,
        birthDate: values.birthDate?.format('YYYY-MM-DD'),
        gender: values.gender
      });

      if (success) {
        message.success('注册成功！');
      } else {
        message.error('注册失败，用户名可能已存在');
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px 0' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
              🩺 血压记录
            </Title>
            <Text type="secondary">创建新账户</Text>
          </div>

          <Form
            name="register"
            size="large"
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="姓名"
            >
              <Input
                prefix={<ContactsOutlined />}
                placeholder="请输入您的姓名（选填）"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱（选填）"
              />
            </Form.Item>

            <Form.Item
              name="birthDate"
              label="出生日期"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择出生日期（选填）"
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              name="gender"
              label="性别"
            >
              <Select placeholder="请选择性别（选填）" allowClear>
                <Option value="male">男</Option>
                <Option value="female">女</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 48 }}
              >
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                已有账户？ <Link to="/login">立即登录</Link>
              </Text>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;