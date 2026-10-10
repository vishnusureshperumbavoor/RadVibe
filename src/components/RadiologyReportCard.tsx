import React from 'react';
import { Stethoscope } from 'lucide-react';
import { ParsedDicomMeta, DicomCase } from '../types/dicom';

interface RadiologyReportCardProps {
  report: string;
  selectedCase: DicomCase;
  dicomMeta: ParsedDicomMeta | null;
}

export const RadiologyReportCard: React.FC<RadiologyReportCardProps> = ({ report, selectedCase, dicomMeta }) => {
  return (
    <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Hospital / Clinic Document Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e293b', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope size={20} color="#38bdf8" /> RADIOLOGY CONSULTATION REPORT
          </h3>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>DEPARTMENT OF DIAGNOSTIC & MOLECULAR IMAGING</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', background: '#0369a133', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', border: '1px solid #0284c744', fontWeight: 700 }}>
            VERIFIED BY RADVIBE AI
          </span>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>STATUS: FINAL CLINICAL REPORT</div>
        </div>
      </div>

      {/* Patient & Exam Metadata Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#020617', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '12px' }}>
        <div>
          <div style={{ color: '#64748b', fontWeight: 600, fontSize: '10px' }}>PATIENT NAME</div>
          <div style={{ color: '#f8fafc', fontWeight: 700 }}>{dicomMeta?.patientName || 'PHENIX^PATIENT'}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontWeight: 600, fontSize: '10px' }}>MODALITY / EXAM</div>
          <div style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedCase.modality} - {selectedCase.region}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontWeight: 600, fontSize: '10px' }}>TRANSFER SYNTAX</div>
          <div style={{ color: '#a78bfa', fontWeight: 700 }}>{dicomMeta?.transferSyntaxUID || '1.2.840.10008.1.2.1'}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontWeight: 600, fontSize: '10px' }}>MATRIX SIZE</div>
          <div style={{ color: '#f8fafc', fontWeight: 700 }}>{dicomMeta ? `${dicomMeta.columns} x ${dicomMeta.rows}` : '512 x 512'}</div>
        </div>
      </div>

      {/* Main Report Body */}
      <div style={{ flex: 1, background: '#020617', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b', overflowY: 'auto', minHeight: '300px' }}>
        {report ? (
          <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.8' }}>
            {report
              .split('\n')
              .map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} style={{ height: '8px' }} />;

                // Header line (e.g. **CLINICAL HISTORY** or CLINICAL HISTORY)
                const isHeader = /^(\*\*|\#\#\#?\s*)?[A-Z\s\&\-\:\,]{4,}(\*\*|\:)?$/.test(trimmed) || 
                                 (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes(': '));

                if (isHeader) {
                  const titleText = trimmed.replace(/[\*\#]/g, '').trim();
                  return (
                    <div key={idx} style={{ marginTop: '20px', marginBottom: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '14px', letterSpacing: '0.8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      {titleText}
                    </div>
                  );
                }

                // Line containing bold key-value (e.g. 1. **Location**: Left MCA)
                if (trimmed.includes('**')) {
                  const formattedParts = trimmed.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={pIdx} style={{ color: '#f8fafc', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                  return (
                    <div key={idx} style={{ marginBottom: '6px', color: '#cbd5e1' }}>
                      {formattedParts}
                    </div>
                  );
                }

                // Bullet points or normal text
                return (
                  <div key={idx} style={{ marginBottom: '6px', color: trimmed.startsWith('-') ? '#cbd5e1' : '#f8fafc' }}>
                    {trimmed}
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '60px 0' }}>
            No clinical report generated yet. Select a DICOM scan and click "Analyze DICOM with AI Agent".
          </div>
        )}
      </div>

    </div>
  );
};
