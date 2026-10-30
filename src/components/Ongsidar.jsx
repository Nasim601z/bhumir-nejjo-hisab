import React, { useState } from 'react';

// বাংলা সংখ্যা ও দশমিক প্রসেস করার হেল্পার
const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, d => BN[d]);
const en = (s) => String(s).replace(/[০-৯]/g, d => BN.indexOf(d)).replace(/,/g, '').trim();
// fmt ফাংশনটি দশমিকের পর ৩ ঘর পর্যন্ত দেখাবে
const fmt = (n, dp = 3) => bn((+n).toLocaleString('en-US', { maximumFractionDigits: dp }));

// unitTable (ঐচ্ছিক): অ্যাপের বর্তমান এলাকার মাপ — { bigha:[নাম, বর্গফুট], katha:[...], shotok:[...] }
export default function WarisCalculator({ unitTable }) {
  const [totalLand, setTotalLand] = useState('');
  const [unit, setUnit] = useState('bigha');
  const [sons, setSons] = useState('');
  const [daughters, setDaughters] = useState('');
  const [result, setResult] = useState(null);

  // একক রূপান্তর (প্রতিটি এককের বর্গফুট মান; এলাকা অনুযায়ী বদলাতে পারে)
  const SQ = unitTable
    ? { bigha: unitTable.bigha[1], katha: unitTable.katha[1], shotok: unitTable.shotok[1], sqft: 1 }
    : { bigha: 14400, katha: 720, shotok: 14400 / 33, sqft: 1 };
  const units = {
    bigha: { label: 'বিঘা', factor: SQ.bigha / SQ.bigha },
    katha: { label: 'কাঠা', factor: SQ.bigha / SQ.katha },
    shotok: { label: 'শতক', factor: SQ.bigha / SQ.shotok },
    sqft: { label: 'বর্গফুট', factor: SQ.bigha / SQ.sqft }
  };

  const calculate = () => {
    const land = parseFloat(en(totalLand)) || 0;
    const s = parseInt(en(sons)) || 0;
    const d = parseInt(en(daughters)) || 0;

    if (land <= 0) return alert('জমির পরিমাণ দিন');
    if (s === 0 && d === 0) return alert('ছেলে বা মেয়ের সংখ্যা দিন');

    // ইনপুট জমিকে প্রথমে বিঘায় রূপান্তর
    const landInBigha = land / units[unit].factor;

    // ২:১ অনুপাতে মোট ভাগ (ছেলে ২, মেয়ে ১)
    const totalParts = (s * 2) + d;
    const partValue = landInBigha / totalParts;

    const sonShare = partValue * 2;      // ছেলের অংশ
    const daughterShare = partValue * 1; // মেয়ের অংশ

    // সব এককে দশমিকসহ রূপান্তর
    const convert = (val) => ({
      bigha: val * units.bigha.factor,
      katha: val * units.katha.factor,
      shotok: val * units.shotok.factor,
      sqft: val * units.sqft.factor
    });

    setResult({
      sonShare: convert(sonShare),
      daughterShare: convert(daughterShare),
      totalLand: land,
      totalUnit: units[unit].label,
      totalParts,
      landInBigha
    });
  };

  const reset = () => {
    setTotalLand('');
    setSons('');
    setDaughters('');
    setResult(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'inherit', color: '#1b2a22' }}>
      <div style={{ background: '#e4f3ea', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#14573a' }}>উত্তরাধিকার ক্যালকুলেটর</h2>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          ইসলামী আইন অনুযায়ী ছেলে ও মেয়ের অংশের অনুপাত <b>২:১</b>। এখানে মোট জমি ও ওয়ারিশ সংখ্যা দিলে প্রত্যেকের প্রাপ্য অংশ দশমিকসহ দেখাবে।
        </p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>জমির পরিমাণ</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>মোট জমি</label>
            <input 
              type="text" 
              placeholder="যেমন: ১০" 
              value={totalLand} 
              onChange={(e) => setTotalLand(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>একক</label>
            <select 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              {Object.entries(units).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>ওয়ারিশ সংখ্যা</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>ছেলের সংখ্যা</label>
            <input 
              type="number" 
              placeholder="০" 
              value={sons} 
              onChange={(e) => setSons(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>মেয়ের সংখ্যা</label>
            <input 
              type="number" 
              placeholder="০" 
              value={daughters} 
              onChange={(e) => setDaughters(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={calculate}
            style={{ flex: 1, padding: '12px', background: '#14573a', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            হিসাব করুন
          </button>
          <button 
            onClick={reset}
            style={{ flex: 1, padding: '12px', background: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            রিসেট
          </button>
        </div>
      </div>

      {result && (
        <div style={{ padding: '15px', border: '1px solid #14573a', borderRadius: '10px', background: '#f8fcf9' }}>
          <h3 style={{ marginTop: 0 }}>প্রাপ্য অংশ</h3>
          
          {parseInt(en(sons)) > 0 && (
            <div style={{ background: '#e4f3ea', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
              <b style={{ fontSize: '1.1rem' }}>প্রত্যেক ছেলে পাবে:</b>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><b>{fmt(result.sonShare.bigha, 4)}</b> বিঘা</li>
                <li><b>{fmt(result.sonShare.katha, 4)}</b> কাঠা</li>
                <li><b>{fmt(result.sonShare.shotok, 4)}</b> শতক</li>
                <li><b>{fmt(result.sonShare.sqft, 2)}</b> বর্গফুট</li>
              </ul>
            </div>
          )}

          {parseInt(en(daughters)) > 0 && (
            <div style={{ background: '#fcebd3', padding: '15px', borderRadius: '8px' }}>
              <b style={{ fontSize: '1.1rem' }}>প্রত্যেক মেয়ে পাবে:</b>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><b>{fmt(result.daughterShare.bigha, 4)}</b> বিঘা</li>
                <li><b>{fmt(result.daughterShare.katha, 4)}</b> কাঠা</li>
                <li><b>{fmt(result.daughterShare.shotok, 4)}</b> শতক</li>
                <li><b>{fmt(result.daughterShare.sqft, 2)}</b> বর্গফুট</li>
              </ul>
            </div>
          )}
          
          <p style={{ background: '#fff4d6', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.6 }}>
            ⚠️ স্বামী/স্ত্রী, পিতা-মাতা বা অন্য ওয়ারিশ থাকলে ভাগ বদলে যায়। তাদের অংশ বাদ দিয়ে বাকি জমির পরিমাণ এখানে দিন। চূড়ান্ত সিদ্ধান্তের আগে আইনজীবী বা ভূমি অফিসের পরামর্শ নিন।
          </p>
          <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '0.9rem', color: '#555' }}>
            <p>মোট সম্পত্তি: {fmt(result.totalLand, 2)} {result.totalUnit} ({fmt(result.landInBigha, 4)} বিঘা)</p>
            <p>মোট ভাগ: {fmt(result.totalParts, 0)} (ছেলে ২ ভাগ, মেয়ে ১ ভাগ)</p>
          </div>
        </div>
      )}
    </div>
  );
}