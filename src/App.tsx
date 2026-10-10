import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { DEFAULT_DICOM_CASES } from './constants/cases';
import { DicomCase, ParsedDicomMeta } from './types/dicom';
import { DicomService } from './services/dicomService';
import { useRadVibeAgent } from './hooks/useRadVibeAgent';
import { DicomViewport } from './components/DicomViewport';
import { AgentExecutionTrace } from './components/AgentExecutionTrace';
import { RadiologyReportCard } from './components/RadiologyReportCard';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('radvibe_api_key') || '');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  
  // Selected DICOM Case & Canvas State
  const [selectedCase, setSelectedCase] = useState<DicomCase>(DEFAULT_DICOM_CASES[0]);
  const [dicomMeta, setDicomMeta] = useState<ParsedDicomMeta | null>(null);
  const [fetchingDicom, setFetchingDicom] = useState(false);

  // Custom Agent Hook
  const { agentRunning, agentLogs, clinicalReport, runAgent } = useRadVibeAgent();

  // Persist API key
  useEffect(() => {
    if (apiKey) localStorage.setItem('radvibe_api_key', apiKey);
  }, [apiKey]);

  // Load DICOM header tags when selectedCase changes
  useEffect(() => {
    async function loadMeta() {
      if (selectedCase.dicomUrl) {
        setFetchingDicom(true);
        try {
          const { meta } = await DicomService.fetchAndParse(selectedCase.dicomUrl, selectedCase.modality, selectedCase.region);
          setDicomMeta(meta);
        } catch (err) {
          console.error('Error fetching DICOM meta:', err);
        } finally {
          setFetchingDicom(false);
        }
      }
    }
    loadMeta();
  }, [selectedCase]);

  // Custom User DICOM (.dcm) Upload
  const handleCustomDicomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const byteArray = new Uint8Array(arrayBuffer);
        
        try {
          const meta = DicomService.parseByteArray(byteArray, 'DICOM', 'User Scan');
          setDicomMeta(meta);

          const customCase: DicomCase = {
            id: 'custom-dcm-upload',
            title: `📁 Custom Upload: ${file.name}`,
            source: 'User Laptop (.dcm)',
            modality: meta.modality,
            region: 'Custom Scan',
            instanceId: 'custom',
            dicomUrl: '',
            measurements: {
              location: 'Uploaded DICOM Instance',
              lesion_size_mm: 14.5,
              finding: 'Custom user uploaded DICOM file loaded cleanly into canvas.'
            }
          };
          setSelectedCase(customCase);
        } catch (err) {
          alert('Invalid DICOM (.dcm) file format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 🧭 Top Navigation Header */}
      <header style={{ padding: '16px 24px', background: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <Activity size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              RadVibe <span style={{ fontSize: '11px', background: '#2563eb22', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', border: '1px solid #2563eb44' }}>DICOM AI Agent</span>
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Direct DICOM (.dcm) Binary Parsing & RouterPlus Agent Analysis</p>
          </div>
        </div>

        {/* RouterPlus API Credentials & Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>RouterPlus Key:</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="sk-rp-..."
              style={{ width: '170px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>RouterPlus Model:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: '12px' }}
            >
              <option value="gpt-4o-mini">gpt-4o-mini (Fast)</option>
              <option value="claude-sonnet-5-5">claude-sonnet-5-5 (High Reasoning)</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini (Compact)</option>
            </select>
          </div>
        </div>
      </header>

      {/* 📐 Main Workspace */}
      <main style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '20px' }}>
        
        {/* 👈 LEFT PANEL: DICOM (.dcm) Canvas Viewport & PACS Selector */}
        <DicomViewport
          cases={DEFAULT_DICOM_CASES}
          selectedCase={selectedCase}
          dicomMeta={dicomMeta}
          fetchingDicom={fetchingDicom}
          agentRunning={agentRunning}
          onSelectCase={(c) => setSelectedCase(c)}
          onCustomUpload={handleCustomDicomUpload}
          onRunAgent={() => runAgent(apiKey, selectedModel, selectedCase, dicomMeta)}
        />

        {/* 👉 RIGHT PANEL: ReAct Agent Terminal & Radiology Report */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* ReAct Execution Log Terminal */}
          <AgentExecutionTrace logs={agentLogs} running={agentRunning} />

          {/* Official Hospital EHR Radiology Document */}
          <RadiologyReportCard
            report={clinicalReport}
            selectedCase={selectedCase}
            dicomMeta={dicomMeta}
          />

        </section>

      </main>

    </div>
  );
}
