import { useState, useEffect, useCallback } from 'react';
import { AgentLog, DicomCase, ParsedDicomMeta, ReportRecord, SwarmAgentState } from '../types/dicom';
import { RouterPlusService } from '../services/routerPlusService';
import { StorageService } from '../services/storageService';

export const INITIAL_SWARM: SwarmAgentState[] = [
  { id: 'agent-neuro', name: '🧠 Neuro-Radiology Specialist Agent', role: 'Brain & Spine Stroke/Lesion Specialist', status: 'idle', model: 'gpt-4o-mini' },
  { id: 'agent-thoracic', name: '🫁 Thoracic Imaging Specialist Agent', role: 'Chest CT Nodule & Lung Pathology Specialist', status: 'idle', model: 'claude-sonnet-5-5' },
  { id: 'agent-qc', name: '🛡️ Clinical Quality & Verification Agent', role: 'Cross-checks Findings & ICD-10 Coding Accuracy', status: 'idle', model: 'gpt-4.1-mini' }
];

export function useSwarmAgentSystem() {
  const [swarmState, setSwarmState] = useState<SwarmAgentState[]>(INITIAL_SWARM);
  const [isSwarmRunning, setIsSwarmRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [savedReports, setSavedReports] = useState<ReportRecord[]>([]);

  // Load persistent reports on initial mount (Survives Refresh!)
  useEffect(() => {
    const reports = StorageService.getReports();
    setSavedReports(reports);
  }, []);

  const addLog = useCallback((step: string, detail: string, status: 'pending' | 'success' | 'info') => {
    setAgentLogs((prev) => [...prev, { step, detail, status }]);
  }, []);

  // Run a single case analysis and save to persistent storage
  const runSingleAnalysis = async (apiKey: string, selectedModel: string, selectedCase: DicomCase, dicomMeta: ParsedDicomMeta | null) => {
    if (!apiKey) {
      alert('Please enter your RouterPlus API Key first!');
      return;
    }

    setIsSwarmRunning(true);
    addLog('SWARM INITIATED', `Assigning single scan ${selectedCase.title} to Swarm Agent...`, 'info');

    try {
      const rawReport = await RouterPlusService.synthesizeReport(apiKey, selectedModel, selectedCase, dicomMeta);
      
      const newRecord: ReportRecord = {
        id: `report-${Date.now()}`,
        caseId: selectedCase.id,
        caseTitle: selectedCase.title,
        modality: selectedCase.modality,
        region: selectedCase.region,
        reportText: rawReport,
        agentRole: 'Neuro/Thoracic Specialist',
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel
      };

      // Save to localStorage so it never gets lost on refresh!
      const updatedReports = StorageService.saveReport(newRecord);
      setSavedReports(updatedReports);
      addLog('PERSISTENCE STORED', `Report for ${selectedCase.title} saved to browser storage (Survives Refresh).`, 'success');

    } catch (err: any) {
      addLog('ERROR', `Analysis failed: ${err.message}`, 'info');
    } finally {
      setIsSwarmRunning(false);
    }
  };

  // Run Agent Swarm: Parallel Batch Analysis on ALL Datasets at once!
  const runBatchSwarm = async (apiKey: string, allCases: DicomCase[], metaMap: Record<string, ParsedDicomMeta | null>) => {
    if (!apiKey) {
      alert('Please enter your RouterPlus API Key first!');
      return;
    }

    setIsSwarmRunning(true);
    setAgentLogs([]);
    addLog('SWARM BATCH', `Launching ${allCases.length} specialized agents across all datasets simultaneously...`, 'info');

    // Update Swarm states to analyzing
    setSwarmState((prev) => prev.map((a) => ({ ...a, status: 'analyzing' })));

    try {
      // Execute RouterPlus calls in parallel for each case
      const swarmPromises = allCases.map(async (c, idx) => {
        const assignedAgent = INITIAL_SWARM[idx % INITIAL_SWARM.length];
        const meta = metaMap[c.id] || null;

        addLog(`AGENT: ${assignedAgent.name}`, `Analyzing ${c.title}...`, 'pending');
        
        const rawReport = await RouterPlusService.synthesizeReport(apiKey, assignedAgent.model, c, meta);
        
        const record: ReportRecord = {
          id: `report-${Date.now()}-${idx}`,
          caseId: c.id,
          caseTitle: c.title,
          modality: c.modality,
          region: c.region,
          reportText: rawReport,
          agentRole: assignedAgent.name,
          timestamp: new Date().toLocaleTimeString(),
          model: assignedAgent.model
        };

        StorageService.saveReport(record);
        addLog(`AGENT: ${assignedAgent.name}`, `✅ Completed report for ${c.title}`, 'success');
        return record;
      });

      await Promise.all(swarmPromises);
      
      const finalReports = StorageService.getReports();
      setSavedReports(finalReports);
      setSwarmState((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      addLog('SWARM COMPLETED', `All ${allCases.length} datasets reported and saved to local storage!`, 'success');

    } catch (err: any) {
      addLog('SWARM ERROR', `Batch execution error: ${err.message}`, 'info');
      setSwarmState((prev) => prev.map((a) => ({ ...a, status: 'error' })));
    } finally {
      setIsSwarmRunning(false);
    }
  };

  const clearSavedReports = () => {
    StorageService.clearAll();
    setSavedReports([]);
  };

  return {
    swarmState,
    isSwarmRunning,
    agentLogs,
    savedReports,
    runSingleAnalysis,
    runBatchSwarm,
    clearSavedReports
  };
}
