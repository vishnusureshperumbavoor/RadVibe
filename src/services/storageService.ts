import { ReportRecord } from '../types/dicom';

const STORAGE_KEY = 'radvibe_persistent_reports_v1';

/**
 * Service for persisting generated radiology reports into localStorage (survives browser refresh)
 */
export class StorageService {
  /**
   * Load all saved report records from localStorage
   */
  static getReports(): ReportRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to load reports from localStorage:', err);
      return [];
    }
  }

  /**
   * Save a newly generated report record
   */
  static saveReport(record: ReportRecord): ReportRecord[] {
    const existing = this.getReports();
    // Replace if exists for same caseId, or prepend
    const filtered = existing.filter((r) => r.caseId !== record.caseId);
    const updated = [record, ...filtered];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save report to localStorage:', err);
    }
    return updated;
  }

  /**
   * Get report by case ID
   */
  static getReportByCaseId(caseId: string): ReportRecord | undefined {
    const reports = this.getReports();
    return reports.find((r) => r.caseId === caseId);
  }

  /**
   * Clear all saved reports
   */
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
