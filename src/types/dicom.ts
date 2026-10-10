export interface DicomMeasurements {
  location: string;
  lesion_size_mm?: number;
  attenuation_hu?: number;
  aspect_score?: string;
  disc_height_mm?: number;
  canal_diameter_mm?: number;
  nodule_diameter_mm?: number;
  calcification?: string;
  severity?: string;
  finding: string;
}

export interface DicomCase {
  id: string;
  title: string;
  source: string;
  modality: string;
  region: string;
  instanceId: string;
  dicomUrl: string;
  measurements: DicomMeasurements;
}

export interface ParsedDicomMeta {
  patientName: string;
  patientId: string;
  modality: string;
  studyDescription: string;
  rows: number;
  columns: number;
  bitsAllocated?: number;
  transferSyntaxUID: string;
  pixelDataOffset: number;
  pixelDataLength?: number;
  fileSizeKB: number;
}

export interface AgentLog {
  step: string;
  detail: string;
  status: 'pending' | 'success' | 'info';
}
