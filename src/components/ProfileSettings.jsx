import React, { useState, useEffect } from 'react';
import { User, MapPin, Save, ArrowLeft } from 'lucide-react'; // আইকন ব্যবহারের জন্য

export default function ProfileSettings({ onBack }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // পেজ লোড হলে আগের সেভ করা ডেটা লোড করবে
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setName(parsed.name || '');
      setAddress(parsed.address || '');
    }
  }, []);

  // ডেটা সেভ করার ফাংশন
  const handleSave = () => {
    if (!name.trim()) {
      alert('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }
    const profileData = { name, address };
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setIsSaved(true);
    
    // ২ সেকেন্ড পর সাকসেস মেসেজ মুছে যাবে
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      {/* হেডার */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} color="#14573a" />
        </button>
        <h2 style={{ margin: 0, color: '#14573a' }}>প্রোফাইল সেটিংস</h2>
      </div>

      {/* প্রোফাইল আপডেট ফর্ম */}
      <div style={{ background: '#f8fcf9', padding: '20px', borderRadius: '12px', border: '1px solid #dfe8e2' }}>
        
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#e4f3ea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <User size={40} color="#14573a" />
          </div>
          <p style={{ margin: 0, color: '#5d6e64', fontSize: '0.9rem' }}>আপনার ছবি আপলোডের কাজ চলছে...</p>
        </div>

        {/* নাম ইনপুট */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>আপনার নাম</label>
          <input 
            type="text" 
            placeholder="যেমন: আব্দুল করিম" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
          />
        </div>

        {/* ঠিকানা ইনপুট */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>আপনার এলাকা / ঠিকানা</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={18} color="#5d6e64" style={{ position: 'absolute', top: '14px', left: '12px' }} />
            <input 
              type="text" 
              placeholder="যেমন: মান্দা, নওগাঁ" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
            />
          </div>
        </div>

        {/* সেভ বাটন */}
        <button 
          onClick={handleSave}
          style={{ width: '100%', padding: '15px', background: '#14573a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <Save size={20} /> তথ্য সেভ করুন
        </button>

        {/* সাকসেস মেসেজ */}
        {isSaved && (
          <p style={{ textAlign: 'center', color: '#16a34a', marginTop: '15px', fontWeight: 'bold' }}>
            ✓ প্রোফাইল সফলভাবে সেভ হয়েছে!
          </p>
        )}
      </div>
    </div>
  );
}