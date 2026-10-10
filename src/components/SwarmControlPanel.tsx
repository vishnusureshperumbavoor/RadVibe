import React from 'react';
import { Users, CheckCircle2, RefreshCw, AlertCircle, Play, Database, Trash2 } from 'lucide-react';
import { SwarmAgentState, ReportRecord } from '../types/dicom';

interface SwarmControlPanelProps {
  swarmState: SwarmAgentState[];
  isSwarmRunning: boolean;
  savedReports: ReportRecord[];
  onRunBatchSwarm: () => void;
  onClearReports: () => void;
}

export const SwarmControlPanel: React.FC<SwarmControlPanelProps> = ({
  swarmState,
  isSwarmRunning,
  savedReports,
  onRunBatchSwarm,
  onClearReports
}) => {
  return (
    <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} /> Autonomous Agent Swarm & Persistence
        </h3>
        <span style={{ fontSize: '11px', background: '#3b82f622', color: '#60a5fa', padding: '3px 8px', borderRadius: '12px', border: '1px solid #3b82f644' }}>
          {savedReports.length} Reports Saved (Survives Refresh)
        </span>
      </div>

      {/* Agent Swarm Active Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {swarmState.map((agent) => (
          <div key={agent.id} style={{ background: '#020617', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '11px' }}>
            <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>{agent.name}</div>
            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '6px' }}>{agent.role}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {agent.status === 'analyzing' ? (
                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={10} className="spin" /> Analyzing
                </span>
              ) : agent.status === 'completed' ? (
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={10} /> Completed
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>Status: Idle</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Swarm Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onRunBatchSwarm}
          disabled={isSwarmRunning}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            background: isSwarmRunning ? '#374151' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: isSwarmRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isSwarmRunning ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
          {isSwarmRunning ? 'Swarm Running Batch Reports...' : '⚡ Run Swarm on ALL Datasets'}
        </button>

        {savedReports.length > 0 && (
          <button
            onClick={onClearReports}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#1f2937',
              color: '#ef4444',
              border: '1px solid #374151',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} /> Clear Cache
          </button>
        )}
      </div>

    </div>
  );
};
