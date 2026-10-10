import React from 'react';
import { Cpu, AgentLog } from '../types/dicom';

interface AgentTraceProps {
  logs: AgentLog[];
  running: boolean;
}

export const AgentExecutionTrace: React.FC<AgentTraceProps> = ({ logs, running }) => {
  return (
    <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Agent ReAct Execution Trace (Thought → Tool Call → Observation)
      </h3>
      
      <div style={{ background: '#020617', borderRadius: '8px', padding: '12px', minHeight: '100px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '12px' }}>
        {logs.length === 0 ? (
          <span style={{ color: '#475569' }}>Click "Analyze DICOM with AI Agent" to execute...</span>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '6px' }}>
              <span style={{ color: log.status === 'success' ? '#4ade80' : log.status === 'pending' ? '#facc15' : '#38bdf8', fontWeight: 700 }}>
                [{log.step}]
              </span>{' '}
              <span style={{ color: '#cbd5e1' }}>{log.detail}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
