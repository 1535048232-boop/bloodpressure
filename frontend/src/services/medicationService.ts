import api from './api';
import { Medication, MedicationRecord } from '../types';

export const medicationService = {
  // Get all medications
  getMedications: async (): Promise<{ medications: Medication[] }> => {
    const response = await api.get('/medications');
    return response.data;
  },

  // Create new medication
  createMedication: async (medicationData: {
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
  }): Promise<{ medication: Medication; message: string }> => {
    const response = await api.post('/medications', medicationData);
    return response.data;
  },

  // Update medication
  updateMedication: async (
    id: number,
    medicationData: {
      name?: string;
      dosage?: string;
      frequency?: string;
      instructions?: string;
      isActive?: boolean;
    }
  ): Promise<{ medication: Medication; message: string }> => {
    const response = await api.put(`/medications/${id}`, medicationData);
    return response.data;
  },

  // Delete medication
  deleteMedication: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/medications/${id}`);
    return response.data;
  },

  // Record medication taken
  recordMedicationTaken: async (
    medicationId: number,
    data: {
      takenAt?: string;
      notes?: string;
    }
  ): Promise<{ record: MedicationRecord; message: string }> => {
    const response = await api.post(`/medications/${medicationId}/taken`, data);
    return response.data;
  },

  // Get medication history
  getMedicationHistory: async (
    medicationId: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ records: MedicationRecord[] }> => {
    const response = await api.get(`/medications/${medicationId}/history`, { params });
    return response.data;
  },

  // Get all medication intake records
  getAllIntakes: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ records: MedicationRecord[] }> => {
    const response = await api.get('/medications/intakes/all', { params });
    return response.data;
  }
};
