// src/components/DataRenderer.jsx
import React from 'react';

export default function DataRenderer({ section }) {
  const renderContent = () => {
    switch (section.type) {
      case 'list':
        return (
          <ul className="custom-list">
            {section.items?.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
      case 'table':
      case 'table_with_notes':
        return (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>{section.columns?.map((col, i) => <th key={i}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {section.rows?.map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'paragraphs':
        return section.content?.map((p, i) => <p key={i} className="custom-p">{p}</p>);
      case 'formula_list':
        return (
          <div className="formula-container">
            {section.formulas?.map((f, i) => (
              <div key={i} className="formula-card">
                <strong>{f.name}:</strong> <span>{f.formula}</span>
                {f.example && <p className="example-text">উদাহরণ: {f.example}</p>}
              </div>
            ))}
          </div>
        );
      case 'checklist':
        return (
          <div className="checklist-container">
            {section.items?.map((item, i) => (
              <div key={i} className="checklist-item">
                <span className="check-box">✓</span>
                <div>
                  <strong>ধাপ {item.step}:</strong> {item.task}
                  {item.detail && <p className="detail-text">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <p className="custom-p">{section.text || section.formula || 'ডেটা লোড হচ্ছে...'}</p>;
    }
  };

  return (
    <div className="section-card">
      <h3 className="section-title">{section.title}</h3>
      {renderContent()}
    </div>
  );
}