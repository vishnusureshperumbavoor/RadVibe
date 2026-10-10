import React, { useRef, useEffect } from 'react';
import { FileCode, CheckCircle2, Upload, Download, Play, RefreshCw } from 'lucide-react';
import { DicomCase, ParsedDicomMeta } from '../types/dicom';
import { DicomService } from '../services/dicomService';

interface DicomViewportProps {
  cases: DicomCase[];
  selectedCase: DicomCase;
  dicomMeta: ParsedDicomMeta | null;
  fetchingDicom: boolean;
  agentRunning: boolean;
  hasAnalyzed: boolean;
  onSelectCase: (c: DicomCase) => void;
  onCustomUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onZipUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunAgent: () => void;
  sliceCount?: number;
  currentSliceIdx?: number;
  onSliceChange?: (idx: number) => void;
  activeSlice?: { byteArray: Uint8Array; meta: ParsedDicomMeta } | null;
}

export const DicomViewport: React.FC<DicomViewportProps> = ({
  cases,
  selectedCase,
  dicomMeta,
  fetchingDicom,
  agentRunning,
  hasAnalyzed,
  onSelectCase,
  onCustomUpload,
  onZipUpload,
  onRunAgent,
  sliceCount = 1,
  currentSliceIdx = 0,
  onSliceChange,
  activeSlice
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-render DICOM canvas when selectedCase, activeSlice, dicomMeta, or hasAnalyzed updates
  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (activeSlice) {
        if (isMounted && canvasRef.current) {
          DicomService.renderToCanvas(canvasRef.current, activeSlice.byteArray, activeSlice.meta, selectedCase.measurements.lesion_size_mm || 18.5, hasAnalyzed);
        }
      } else if (selectedCase.dicomUrl) {
        try {
          const { byteArray, meta } = await DicomService.fetchAndParse(selectedCase.dicomUrl, selectedCase.modality, selectedCase.region);
          if (isMounted && canvasRef.current) {
            DicomService.renderToCanvas(canvasRef.current, byteArray, meta, selectedCase.measurements.lesion_size_mm || 18.5, hasAnalyzed);
          }
        } catch (err) {
          console.error('Viewport render error:', err);
        }
      }
    }

    load();

    return () => { isMounted = false; };
  }, [selectedCase, activeSlice, hasAnalyzed]);

  return (
    <section style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={18} /> Direct DICOM (.dcm) Viewport
        </h2>
        {fetchingDicom && <span style={{ fontSize: '11px', color: '#f59e0b' }}>Fetching DICOM Binary...</span>}
      </div>

      {/* Select DICOM Case */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', color: '#94a3b8' }}>Select PACS DICOM Instance:</label>
        {cases.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectCase(item)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: selectedCase.id === item.id ? '1px solid #3b82f6' : '1px solid #1f2937',
              background: selectedCase.id === item.id ? '#1e3a8a33' : '#1f2937',
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>{item.title}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Source: {item.source} • {item.modality}</div>
            </div>
            {selectedCase.id === item.id && <CheckCircle2 size={16} color="#3b82f6" />}
          </button>
        ))}

        {/* Custom DICOM (.dcm) Upload */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
          <label style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px dashed #4b5563',
            background: '#1f293755',
            color: '#9ca3af',
            fontSize: '11px',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Upload size={13} /> Single .dcm
            <input type="file" accept=".dcm" onChange={onCustomUpload} style={{ display: 'none' }} />
          </label>

          <label style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px dashed #7c3aed',
            background: '#7c3aed11',
            color: '#c084fc',
            fontSize: '11px',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Upload size={13} /> Multi-Slice Series (.zip)
            <input type="file" accept=".zip" onChange={onZipUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Slice Navigation Slider for Multi-Slice Series */}
      {sliceCount > 1 && (
        <div style={{ background: '#020617', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>Slice {currentSliceIdx + 1} / {sliceCount}</span>
          <input 
            type="range" 
            min={0} 
            max={sliceCount - 1} 
            value={currentSliceIdx} 
            onChange={(e) => onSliceChange?.(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: '#7c3aed' }}
          />
        </div>
      )}

      {/* 🖼️ Canvas rendering DICOM Pixel Array */}
      <div style={{ position: 'relative', width: '100%', height: '320px', background: '#020617', borderRadius: '10px', border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <canvas 
          ref={canvasRef} 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
        />

        {/* Overlay DICOM Meta Info */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#000000aa', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#38bdf8', border: '1px solid #38bdf833' }}>
          Format: DICOM (.dcm) | {dicomMeta ? `${dicomMeta.columns}x${dicomMeta.rows}` : '512x512'} | {dicomMeta ? `${dicomMeta.fileSizeKB}KB` : ''}
        </div>
      </div>

      {/* Parsed DICOM Header Metadata Box */}
      {dicomMeta && (
        <div style={{ background: '#020617', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '11px', color: '#94a3b8' }}>
          <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>Parsed DICOM Tags:</div>
          <div>• Patient ID: <span style={{ color: '#38bdf8' }}>{dicomMeta.patientId}</span></div>
          <div>• Modality: <span style={{ color: '#38bdf8' }}>{dicomMeta.modality}</span></div>
          <div>• Transfer Syntax: <span style={{ color: '#a78bfa' }}>{dicomMeta.transferSyntaxUID}</span></div>
        </div>
      )}

      {/* 🚀 Agent Launch Button */}
      <button
        onClick={onRunAgent}
        disabled={agentRunning}
        style={{
          padding: '14px',
          borderRadius: '8px',
          background: agentRunning ? '#374151' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: '14px',
          cursor: agentRunning ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
        }}
      >
        {agentRunning ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
        {agentRunning ? 'Agent ReAct Loop Running...' : 'Analyze DICOM with AI Agent'}
      </button>

    </section>
  );
};
