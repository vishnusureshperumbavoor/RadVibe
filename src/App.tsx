import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle2 } from 'lucide-react';
import { DEFAULT_DICOM_CASES } from './constants/cases';
import { DicomCase, ParsedDicomMeta } from './types/dicom';
import { DicomService } from './services/dicomService';
import { useSwarmAgentSystem } from './hooks/useSwarmAgentSystem';
import { DicomViewport } from './components/DicomViewport';
import { AgentExecutionTrace } from './components/AgentExecutionTrace';
import { RadiologyReportCard } from './components/RadiologyReportCard';
import { SwarmControlPanel } from './components/SwarmControlPanel';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('radvibe_api_key') || '');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  
  // Selected DICOM Case & Canvas State
  const [selectedCase, setSelectedCase] = useState<DicomCase>(DEFAULT_DICOM_CASES[0]);
  const [dicomMeta, setDicomMeta] = useState<ParsedDicomMeta | null>(null);
  const [metaMap, setMetaMap] = useState<Record<string, ParsedDicomMeta | null>>({});
  const [fetchingDicom, setFetchingDicom] = useState(false);

  // Swarm & Storage Hook
  const {
    swarmState,
    isSwarmRunning,
    agentLogs,
    savedReports,
    runSingleAnalysis,
    runBatchSwarm,
    clearSavedReports
  } = useSwarmAgentSystem();

  // Persist API key
  useEffect(() => {
    if (apiKey) localStorage.setItem('radvibe_api_key', apiKey);
  }, [apiKey]);

  // Load DICOM meta for default cases
  useEffect(() => {
    async function loadAllMeta() {
      const newMetaMap: Record<string, ParsedDicomMeta | null> = {};
      for (const c of DEFAULT_DICOM_CASES) {
        if (c.dicomUrl) {
          try {
            const { meta } = await DicomService.fetchAndParse(c.dicomUrl, c.modality, c.region);
            newMetaMap[c.id] = meta;
          } catch (err) {
            console.error('Error fetching meta for', c.id, err);
          }
        }
      }
      setMetaMap(newMetaMap);
      if (newMetaMap[selectedCase.id]) {
        setDicomMeta(newMetaMap[selectedCase.id]);
      }
    }
    loadAllMeta();
  }, []);

  // Update active dicomMeta on case switch
  useEffect(() => {
    if (metaMap[selectedCase.id]) {
      setDicomMeta(metaMap[selectedCase.id]);
    }
  }, [selectedCase, metaMap]);

  // Retrieve current active case report (from persistent storage or single run)
  const currentSavedRecord = savedReports.find((r) => r.caseId === selectedCase.id);
  const displayReportText = currentSavedRecord?.reportText || '';

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
            id: `custom-${Date.now()}`,
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
              RadVibe <span style={{ fontSize: '11px', background: '#7c3aed22', color: '#c084fc', padding: '2px 8px', borderRadius: '12px', border: '1px solid #7c3aed44' }}>Agent Swarm & Persistent Storage</span>
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Multi-Dataset Autonomous Swarm Analysis & Persistent Browser Storage</p>
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
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Default Model:</label>
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
          agentRunning={isSwarmRunning}
          hasAnalyzed={!!displayReportText}
          onSelectCase={(c) => setSelectedCase(c)}
          onCustomUpload={handleCustomDicomUpload}
          onRunAgent={() => runSingleAnalysis(apiKey, selectedModel, selectedCase, dicomMeta)}
        />

        {/* 👉 RIGHT PANEL: Swarm Control, ReAct Execution Trace & Persistent Report */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Swarm Control Panel & Batch Runner */}
          <SwarmControlPanel
            swarmState={swarmState}
            isSwarmRunning={isSwarmRunning}
            savedReports={savedReports}
            onRunBatchSwarm={() => runBatchSwarm(apiKey, DEFAULT_DICOM_CASES, metaMap)}
            onClearReports={clearSavedReports}
          />

          {/* ReAct Execution Log Terminal */}
          <AgentExecutionTrace logs={agentLogs} running={isSwarmRunning} />

          {/* Official Hospital EHR Radiology Document */}
          <RadiologyReportCard
            report={displayReportText}
            selectedCase={selectedCase}
            dicomMeta={dicomMeta}
          />

        </section>

      </main>

    </div>
  );
}
