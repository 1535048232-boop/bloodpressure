import React, { useState, useEffect } from 'react';
import { Button, Modal, Steps, Typography, Space } from 'antd';
import { MobileOutlined, DownloadOutlined, HomeOutlined, CloseOutlined } from '@ant-design/icons';
import './InstallPWAPrompt.css';

const { Title, Paragraph } = Typography;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPromptBanner, setShowPromptBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any)?.standalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Show banner after a delay
      setTimeout(() => {
        setShowPromptBanner(true);
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPromptBanner(false);
      setShowInstallModal(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual installation instructions for iOS/other browsers
      setShowInstallModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      } else {
        console.log('User dismissed PWA installation');
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }

      setDeferredPrompt(null);
      setShowPromptBanner(false);
    } catch (error) {
      console.error('PWA installation failed:', error);
      setShowInstallModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOS && isSafari) {
      return [
        {
          title: '点击分享按钮',
          description: '在Safari浏览器底部找到分享图标',
          icon: '📤'
        },
        {
          title: '选择"添加到主屏幕"',
          description: '在分享菜单中找到并点击此选项',
          icon: '📱'
        },
        {
          title: '确认添加',
          description: '点击"添加"按钮完成安装',
          icon: '✅'
        }
      ];
    }

    return [
      {
        title: '打开浏览器菜单',
        description: '点击浏览器右上角的菜单按钮',
        icon: '⋮'
      },
      {
        title: '选择"安装应用"',
        description: '在菜单中找到安装选项',
        icon: '📲'
      },
      {
        title: '确认安装',
        description: '点击确认按钮完成安装',
        icon: '✅'
      }
    ];
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      {showPromptBanner && (
        <div className="install-pwa-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <MobileOutlined />
            </div>
            <div className="banner-text">
              <div className="banner-title">安装血压记录APP</div>
              <div className="banner-description">
                安装后可离线使用，体验更流畅
              </div>
            </div>
          </div>
          <div className="banner-actions">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleInstallClick}
              size="small"
            >
              安装
            </Button>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleDismiss}
              size="small"
            />
          </div>
        </div>
      )}

      {/* Install Button in Dashboard */}
      {isInstallable && !showPromptBanner && (
        <div className="install-pwa-button">
          <Button
            type="dashed"
            icon={<DownloadOutlined />}
            onClick={handleInstallClick}
            size="large"
            block
          >
            安装到桌面，体验更佳
          </Button>
        </div>
      )}

      {/* Manual Installation Modal */}
      <Modal
        title="安装血压记录APP"
        open={showInstallModal}
        onCancel={() => setShowInstallModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowInstallModal(false)}>
            我知道了
          </Button>
        ]}
        width={600}
        className="install-pwa-modal"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <HomeOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={3}>将应用添加到主屏幕</Title>
            <Paragraph>
              安装后可以：
            </Paragraph>
            <ul style={{ textAlign: 'left', fontSize: '16px' }}>
              <li>离线使用应用</li>
              <li>更快的启动速度</li>
              <li>全屏体验，无浏览器界面干扰</li>
              <li>接收血压提醒通知</li>
            </ul>
          </div>

          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={getInstallInstructions().map((step, index) => ({
              title: (
                <span style={{ fontSize: '16px' }}>
                  <span style={{ marginRight: '8px', fontSize: '20px' }}>
                    {step.icon}
                  </span>
                  {step.title}
                </span>
              ),
              description: (
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {step.description}
                </span>
              )
            }))}
          />
        </Space>
      </Modal>
    </>
  );
};

export default InstallPWAPrompt;