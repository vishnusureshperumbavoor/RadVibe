import React, { useState } from 'react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<string>('Idle');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testRouterPlusAPI = async () => {
    if (!apiKey) {
      alert('Please paste your RouterPlus API Key first!');
      return;
    }

    setLoading(true);
    setStatus('Calling RouterPlus API...');
    setResponse('');

    try {
      const res = await fetch('https://api.routerplus.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: 'Say "RadVibe Agent Connection Successful!" in 5 words.' }
          ]
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ RouterPlus API Connected!');
        setResponse(data.choices?.[0]?.message?.content || JSON.stringify(data));
      } else {
        setStatus(`❌ API Error: ${res.status}`);
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setStatus(`❌ Network Error: ${err.message}`);
      setResponse('Failed to reach https://app.routerplus.com/api/v1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '24px', background: '#161e2e', borderRadius: '12px', border: '1px solid #374151' }}>
      <h1 style={{ color: '#38bdf8', marginTop: 0 }}>🩺 RadVibe - Netlify & API Test</h1>
      <p style={{ color: '#9ca3af' }}>Step 1: Test Netlify build and verify RouterPlus API live connection.</p>
      
      <div style={{ margin: '20px 0' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#e5e7eb', fontWeight: 600 }}>
          RouterPlus API Key:
        </label>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          placeholder="sk-rp-..."
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #4b5563', background: '#1f2937', color: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      <button 
        onClick={testRouterPlusAPI} 
        disabled={loading}
        style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
      >
        {loading ? 'Testing Connection...' : 'Test RouterPlus API Connection'}
      </button>

      <div style={{ marginTop: '24px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#f3f4f6' }}>Status: {status}</h3>
        {response && (
          <pre style={{ background: '#020617', padding: '12px', borderRadius: '6px', color: '#4ade80', overflowX: 'auto', margin: 0 }}>
            {response}
          </pre>
        )}
      </div>
    </div>
  );
}
