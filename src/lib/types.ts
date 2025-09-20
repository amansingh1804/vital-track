
export type EcgDataPoint = {
  time: number;
  value: number;
};

export type Vitals = {
  heartRate: number | null;
  spo2: number | null;
  systolic: number | null;
  diastolic: number | null;
  ecgData: EcgDataPoint[];
  bodyMovement: string | null;
  temperature: number | null;
};

export type PatientData = {
  patientName: string;
  patientAge: number;
  patientContext: string;
};

export type Thresholds = {
  hrMax: number;
  spo2Min: number;
  bpSystolicMax: number;
  bpDiastolicMax: number;
  tempMax: number;
};

export type Alert = {
  severity: 'critical' | 'warning' | 'normal';
  reason: string;
  recommendation: string;
  vitalSign: string;
  reading: number | string;
  timestamp: Date;
  isRead?: boolean;
};
