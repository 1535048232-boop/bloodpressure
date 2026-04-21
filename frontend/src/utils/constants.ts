// API base configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Application constants
export const APP_NAME = '血压记录';
export const VERSION = '1.0.0';

// Blood pressure categories (mmHg)
export const BP_CATEGORIES = {
  NORMAL: {
    label: '正常',
    systolic: { min: 0, max: 120 },
    diastolic: { min: 0, max: 80 },
    color: '#52c41a'
  },
  ELEVATED: {
    label: '血压偏高',
    systolic: { min: 120, max: 129 },
    diastolic: { min: 0, max: 80 },
    color: '#faad14'
  },
  HIGH_STAGE_1: {
    label: '高血压1级',
    systolic: { min: 130, max: 139 },
    diastolic: { min: 80, max: 89 },
    color: '#fa8c16'
  },
  HIGH_STAGE_2: {
    label: '高血压2级',
    systolic: { min: 140, max: 179 },
    diastolic: { min: 90, max: 119 },
    color: '#f5222d'
  },
  HYPERTENSIVE_CRISIS: {
    label: '高血压危象',
    systolic: { min: 180, max: 300 },
    diastolic: { min: 120, max: 200 },
    color: '#820014'
  }
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'bp_token',
  USER: 'bp_user'
};