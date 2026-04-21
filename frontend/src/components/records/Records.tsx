import React from 'react';
import { Typography } from 'antd';
import MainLayout from '../common/MainLayout';
import RecordsList from './RecordsList';

const { Title } = Typography;

const Records: React.FC = () => {
  return (
    <MainLayout>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>
          血压记录
        </Title>

        <RecordsList />
      </div>
    </MainLayout>
  );
};

export default Records;