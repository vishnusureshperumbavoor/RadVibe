import dicomParser from 'dicom-parser';
import { ParsedDicomMeta } from '../types/dicom';

/**
 * Service for fetching, parsing, and rendering raw .dcm DICOM binary data
 */
export class DicomService {
  /**
   * Fetch DICOM file from URL and parse header tags
   */
  static async fetchAndParse(url: string, defaultModality: string, defaultRegion: string): Promise<{ byteArray: Uint8Array; meta: ParsedDicomMeta }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching DICOM`);

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    const meta = this.parseByteArray(byteArray, defaultModality, defaultRegion);
    return { byteArray, meta };
  }

  /**
   * Parse DICOM header tags from Uint8Array byte buffer
   */
  static parseByteArray(byteArray: Uint8Array, defaultModality: string = 'DICOM', defaultRegion: string = 'Scan'): ParsedDicomMeta {
    const dataSet = dicomParser.parseDicom(byteArray);
    
    return {
      patientName: dataSet.string('x00100010') || 'ANONYMIZED_PATIENT',
      patientId: dataSet.string('x00100020') || 'ID_992103',
      modality: dataSet.string('x00080060') || defaultModality,
      studyDescription: dataSet.string('x00081030') || defaultRegion,
      rows: dataSet.uint16('x00280010') || 512,
      columns: dataSet.uint16('x00280011') || 512,
      bitsAllocated: dataSet.uint16('x00280100') || 16,
      transferSyntaxUID: dataSet.string('x00020010') || '1.2.840.10008.1.2.1',
      pixelDataOffset: dataSet.elements.x7fe00010 ? dataSet.elements.x7fe00010.dataOffset : 0,
      pixelDataLength: dataSet.elements.x7fe00010 ? dataSet.elements.x7fe00010.length : 0,
      fileSizeKB: Math.round(byteArray.length / 1024)
    };
  }

  /**
   * Render raw DICOM Int16 pixel array to HTML5 Canvas
   */
  static renderToCanvas(canvas: HTMLCanvasElement, byteArray: Uint8Array, meta: ParsedDicomMeta, lesionSizeMm: number = 18.5) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = meta.columns || 512;
    const height = meta.rows || 512;

    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const pixelOffset = meta.pixelDataOffset;
    
    const pixelView = new Int16Array(byteArray.buffer, pixelOffset, width * height);

    let minPixel = 32767;
    let maxPixel = -32768;
    for (let i = 0; i < pixelView.length; i++) {
      const val = pixelView[i];
      if (val < minPixel) minPixel = val;
      if (val > maxPixel) maxPixel = val;
    }

    const range = maxPixel - minPixel || 1;

    for (let i = 0; i < pixelView.length; i++) {
      const pixelVal = pixelView[i];
      const normalized = Math.floor(((pixelVal - minPixel) / range) * 255);

      const idx = i * 4;
      imgData.data[idx] = normalized;     // Red
      imgData.data[idx + 1] = normalized; // Green
      imgData.data[idx + 2] = normalized; // Blue
      imgData.data[idx + 3] = 255;        // Alpha
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlay AI Agent ROI measurement lines over DICOM Canvas
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.45);
    ctx.lineTo(width * 0.65, height * 0.45);
    ctx.stroke();

    ctx.fillStyle = '#000000aa';
    ctx.fillRect(width * 0.35, height * 0.40, 160, 24);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`ROI Lesion: ${lesionSizeMm}mm`, width * 0.37, height * 0.44);
  }
}
