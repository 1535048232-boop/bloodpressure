import api from './api';
import { BloodPressureRecord } from '../types';

export const recordService = {
  // Get all blood pressure records
  getRecords: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ records: BloodPressureRecord[] }> => {
    const response = await api.get('/records', { params });
    return response.data;
  },

  // Create new blood pressure record
  createRecord: async (recordData: {
    systolic: number;
    diastolic: number;
    heartRate?: number;
    measurementTime?: string;
    notes?: string;
  }): Promise<{ record: BloodPressureRecord; message: string }> => {
    const response = await api.post('/records', recordData);
    return response.data;
  },

  // Update blood pressure record
  updateRecord: async (
    id: number,
    recordData: Partial<BloodPressureRecord>
  ): Promise<{ record: BloodPressureRecord; message: string }> => {
    const response = await api.put(`/records/${id}`, recordData);
    return response.data;
  },

  // Delete blood pressure record
  deleteRecord: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  }
};