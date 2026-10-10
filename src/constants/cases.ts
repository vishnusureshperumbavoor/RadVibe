import { DicomCase } from '../types/dicom';

export const ORTHANC_BASE = 'https://orthanc.uclouvain.be/demo';

export const DEFAULT_DICOM_CASES: DicomCase[] = [
  {
    id: 'brain-dcm',
    title: '🧠 Brain DICOM (.dcm)',
    source: 'Local DICOM Asset',
    modality: 'MRI',
    region: 'Brain',
    instanceId: 'brain-01',
    dicomUrl: '/dicom/brain.dcm',
    measurements: {
      location: 'Left Middle Cerebral Artery (MCA) Territory',
      lesion_size_mm: 18.5,
      attenuation_hu: 22,
      aspect_score: '7/10',
      finding: 'Hyperacute ischemic infarct in left insular ribbon & basal ganglia.'
    }
  },
  {
    id: 'chest-dcm',
    title: '🫁 Chest CT DICOM (.dcm)',
    source: 'Local DICOM Asset',
    modality: 'CT',
    region: 'Chest',
    instanceId: 'chest-01',
    dicomUrl: '/dicom/chest.dcm',
    measurements: {
      location: 'Right Upper Lobe Subpleural Region',
      nodule_diameter_mm: 12.8,
      density_hu: 45,
      calcification: 'Non-calcified',
      finding: 'Solitary pulmonary nodule requiring Fleischner criteria workup.'
    }
  },
  {
    id: 'spine-dcm',
    title: '🦴 Spine MRI DICOM (.dcm)',
    source: 'Local DICOM Asset',
    modality: 'MRI',
    region: 'Spine',
    instanceId: 'spine-01',
    dicomUrl: '/dicom/spine.dcm',
    measurements: {
      location: 'L4-L5 Intervertebral Disc Level',
      disc_height_mm: 4.2,
      canal_diameter_mm: 7.1,
      severity: 'Severe Focal Narrowing',
      finding: 'Posterior disc protrusion causing subarticular neuroforaminal impaction.'
    }
  }
];
