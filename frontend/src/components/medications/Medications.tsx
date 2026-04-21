import React from 'react';
import { Typography } from 'antd';
import MainLayout from '../common/MainLayout';
import MedicationsList from './MedicationsList';

const { Title } = Typography;

const Medications: React.FC = () => {
  return (
    <MainLayout>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>
          用药管理
        </Title>

        <MedicationsList />
      </div>
    </MainLayout>
  );
};

export default Medications;