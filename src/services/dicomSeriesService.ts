import JSZip from 'jszip';
import { DicomService } from './dicomService';
import { ParsedDicomMeta } from '../types/dicom';

export interface MultiSliceDicomSeries {
  seriesId: string;
  totalSlices: number;
  slices: {
    index: number;
    filename: string;
    byteArray: Uint8Array;
    meta: ParsedDicomMeta;
  }[];
}

export class DicomSeriesService {
  /**
   * Unzip a multi-slice DICOM series (.zip file containing multiple .dcm files)
   */
  static async parseZipSeries(zipBuffer: ArrayBuffer): Promise<MultiSliceDicomSeries> {
    const zip = await JSZip.loadAsync(zipBuffer);
    const slices: { index: number; filename: string; byteArray: Uint8Array; meta: ParsedDicomMeta }[] = [];

    const fileEntries = Object.keys(zip.files).filter((name) => !zip.files[name].dir && (name.endsWith('.dcm') || !name.includes('.')));

    let idx = 0;
    for (const filename of fileEntries) {
      const fileData = await zip.files[filename].async('uint8array');
      try {
        const meta = DicomService.parseByteArray(fileData, 'CT/MRI', 'Multi-Slice Series');
        slices.push({
          index: idx++,
          filename,
          byteArray: fileData,
          meta
        });
      } catch (err) {
        // skip non-dicom zip entries
      }
    }

    return {
      seriesId: `series-${Date.now()}`,
      totalSlices: slices.length,
      slices
    };
  }
}
