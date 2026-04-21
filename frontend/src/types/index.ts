export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  birthDate?: string;
  gender?: string;
  createdAt?: string;
}

export interface BloodPressureRecord {
  id: number;
  userId: number;
  systolic: number;
  diastolic: number;
  heartRate?: number;
  measurementTime: string;
  notes?: string;
  createdAt: string;
}

export interface Medication {
  id: number;
  userId: number;
  name: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationRecord {
  id: number;
  medicationId: number;
  userId: number;
  takenAt: string;
  notes?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  message?: string;
  error?: string;
  [key: string]: T | string | undefined;
}