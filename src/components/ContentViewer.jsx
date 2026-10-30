// src/components/ContentViewer.jsx
import React, { useState } from 'react';

export default function ContentViewer({ data }) {
  const [viewMode, setViewMode] = useState('detailed'); // 'short' বা 'detailed'

  if (!data) return <p>ডেটা পাওয়া যায়নি।</p>;

  const content = data[viewMode];

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* ট্যাব সুইচ (সংক্ষিপ্ত / বিস্তারিত) */}
      <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
        <button 
          onClick={() => setViewMode('short')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: viewMode === 'short' ? '#064e3b' : '#e2e8f0', color: viewMode === 'short' ? 'white' : '#333' }}
        >সংক্ষিপ্ত</button>
        <button 
          onClick={() => setViewMode('detailed')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: viewMode === 'detailed' ? '#064e3b' : '#e2e8f0', color: viewMode === 'detailed' ? 'white' : '#333' }}
        >বিস্তারিত</button>
      </div>

      <h2 style={{ color: '#064e3b' }}>{data.title}</h2>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>{content.intro}</p>

      {/* সেকশন রেন্ডারিং */}
      {content.sections?.map((sec, idx) => (
        <div key={idx} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ borderBottom: '2px solid #ccfbf1', paddingBottom: '5px', marginBottom: '10px', color: '#0f766e' }}>{sec.title}</h3>
          
          {sec.type === 'list' && (
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              {sec.items?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}

          {sec.type === 'table' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {sec.columns?.map((col, i) => <th key={i} style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sec.rows?.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j} style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sec.type === 'paragraphs' && sec.content?.map((p, i) => (
            <p key={i} style={{ marginBottom: '10px', lineHeight: '1.6' }}>{p}</p>
          ))}

          {sec.type === 'formula_list' && sec.formulas?.map((f, i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #10b981' }}>
              <strong>{f.name}:</strong> {f.formula}
              {f.example && <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>উদাহরণ: {f.example}</p>}
            </div>
          ))}
          
          {/* অন্যান্য টাইপগুলো এখানে যোগ করা যাবে (checklist, examples ইত্যাদি) */}
        </div>
      ))}
    </div>
  );
}