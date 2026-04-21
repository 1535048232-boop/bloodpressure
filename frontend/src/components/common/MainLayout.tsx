import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/records',
      icon: <HeartOutlined />,
      label: '血压记录'
    },
    {
      key: '/medications',
      icon: <MedicineBoxOutlined />,
      label: '用药管理'
    },
    {
      key: '/profile',
      icon: <SettingOutlined />,
      label: '个人设置'
    }
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMobileDrawerVisible(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/profile')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const sidebarContent = (
    <>
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 16
      }}>
        <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
          🩺 血压记录
        </Text>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{
          borderRight: 0,
          fontSize: 16
        }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sider */}
      <Sider
        width={240}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
        breakpoint="lg"
        collapsedWidth={0}
        trigger={null}
        className="desktop-sider"
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileDrawerVisible}
        onClose={() => setMobileDrawerVisible(false)}
        width={240}
        bodyStyle={{ padding: 0 }}
        className="mobile-drawer"
      >
        {sidebarContent}
      </Drawer>

      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileDrawerVisible(true)}
              className="mobile-menu-btn"
              style={{ marginRight: 12, display: 'none' }}
            />
            <Text style={{ fontSize: 16, color: '#666' }}>
              欢迎回来，{user?.fullName || user?.username}
            </Text>
          </div>

          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') {
                  handleLogout();
                }
              }
            }}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{ padding: '4px 8px', height: 'auto' }}
            >
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ marginRight: 8 }}
              />
              <Text>{user?.username}</Text>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{
          padding: 24,
          margin: 0,
          background: '#f5f5f5',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
