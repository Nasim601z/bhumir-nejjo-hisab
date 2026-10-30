import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { D } from './data/allData.js';
import { startQuiz, answerQuestion, finishQuiz, getQuizStats } from './data/quizEngine.js';
import { search as searchContent, suggest } from './data/searchEngine.js';
import Ongsidar from './components/Ongsidar.jsx';
import ProfileSettings from './components/ProfileSettings.jsx';
import './App.css';

/* ---------- হেল্পার ---------- */
const byId = Object.fromEntries(D.map((o) => [o.id, o]));
const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
const en = (s) => String(s).replace(/[০-৯]/g, (d) => BN.indexOf(d)).replace(/,/g, '').trim();
const fmt = (n, dp = 4) => bn((+n).toLocaleString('en-US', { maximumFractionDigits: dp }));
const num = (s) => parseFloat(en(s)) || 0;
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const L = { mistake: 'ভুল', correction: 'সংশোধন', formula: 'সূত্র', example: 'উদাহরণ', examples: 'উদাহরণ', step: 'ধাপ', steps: 'ধাপসমূহ', detail: 'বিস্তারিত', unit: 'একক', category: 'বিভাগ', note: 'টীকা', notes: 'টীকা', ref: 'সূত্র', date: 'তারিখ', event: 'ঘটনা', events: 'ঘটনা', language: 'ভাষা', special: 'বিশেষ', role: 'ভূমিকা', formulas: 'সূত্র', lesson: 'শিক্ষা', characters: 'চরিত্র', timeline: 'সময়রেখা', legalAnalysis: 'আইনি বিশ্লেষণ', resolution: 'সমাধান', specs: 'বৈশিষ্ট্য', use: 'ব্যবহার', history: 'ইতিহাস', districts: 'জেলাসমূহ', standard: 'প্রচলিত মান', value: 'মান', scenario: 'ঘটনা', legal: 'আইনি দিক', solution: 'সমাধান', warning: 'সতর্কতা', tools: 'যন্ত্রপাতি', definition: 'সংজ্ঞা', task: 'কাজ' };
const HEAD = ['name', 'term', 'q', 'mistake', 'era', 'division', 'district', 'title', 'task', 'date'];

/* ---------- কনটেন্ট রেন্ডারার ---------- */
function Tbl({ c, r }) {
  return (
    <div className="tw"><table><tbody>
      {c && <tr>{c.map((x, i) => <th key={i}>{x}</th>)}</tr>}
      {r.map((x, i) => <tr key={i}>{x.map((y, j) => <td key={j}>{String(y)}</td>)}</tr>)}
    </tbody></table></div>
  );
}
function Gen({ v }) {
  if (v == null || v === '') return null;
  if (typeof v !== 'object') return <p>{String(v)}</p>;
  if (Array.isArray(v)) {
    if (!v.length) return null;
    if (v.every((x) => typeof x !== 'object')) return <ul>{v.map((x, i) => <li key={i}>{String(x)}</li>)}</ul>;
    if (v.every(Array.isArray)) return <Tbl r={v} />;
    return v.map((x, i) => <div className="card" key={i}><Gen v={x} /></div>);
  }
  if (typeof v.q === 'string' && v.a !== undefined) {
    return <details className="faq"><summary>{v.q}</summary><Gen v={v.a} />{v.ref && <p><small>{v.ref}</small></p>}</details>;
  }
  const hk = HEAD.find((h) => typeof v[h] === 'string' || typeof v[h] === 'number');
  return (
    <>
      {hk && <h4>{v[hk]}</h4>}
      {Object.entries(v).filter(([a]) => a !== hk && a !== 'id' && a !== 'type').map(([a, x]) => <Row key={a} a={a} x={x} />)}
    </>
  );
}
function Row({ a, x }) {
  if (x == null || x === '') return null;
  return L[a] ? <div className="kv"><b>{L[a]}</b><Gen v={x} /></div> : <Gen v={x} />;
}
function Sec({ s }) {
  const t = s.type;
  const rest = Object.entries(s).filter(([k]) => !['id', 'title', 'type'].includes(k));
  let body;
  if (s.columns && s.rows) {
    body = <><Tbl c={s.columns} r={s.rows} />{rest.filter(([k]) => k !== 'columns' && k !== 'rows').map(([k, v]) => <Row key={k} a={k} x={v} />)}</>;
  } else if (t === 'paragraphs') body = (s.content || []).map((p, i) => <p key={i}>{p}</p>);
  else if (['warning', 'tip', 'definition', 'example'].includes(t)) body = <div className={'co ' + (t === 'warning' ? 'w' : '')}>{s.text}</div>;
  else if (t === 'tips' || t === 'summary') body = <div className="co"><Gen v={s.items || s.points} /></div>;
  else if (t === 'code_block') body = <pre>{s.code}</pre>;
  else if (t === 'formula_box') body = <><div className="fb">{s.formula}</div><Row a="example" x={s.example} />{s.note && <p>{s.note}</p>}</>;
  else body = rest.map(([k, v]) => <Row key={k} a={k} x={v} />);
  return <section id={'sec-' + s.id}><h3>{s.title}</h3>{body}</section>;
}

/* ---------- এলাকা ও এককের ডেটা ---------- */
const REG = { 'মান্দা, নওগাঁ': {}, 'ঢাকা': {}, 'চট্টগ্রাম': {}, 'ময়মনসিংহ': { katha: 6.75 * 435.6 }, 'নেত্রকোনা': { katha: 10 * 435.6 }, 'দিনাজপুর / রংপুর': { bigha: 13280 } };
const BASE = { sqft: ['বর্গফুট', 1], sqm: ['বর্গমিটার', 10.7639], shotok: ['শতক', 435.6], katha: ['কাঠা', 720], bigha: ['বিঘা', 14400], acre: ['একর', 43560], hectare: ['হেক্টর', 107639] };
const unitsFor = (reg) => { const o = REG[reg] || {}; const r = {}; Object.keys(BASE).forEach((k) => { r[k] = [BASE[k][0], o[k] || BASE[k][1]]; }); return r; };
const CATS = {
  records: ['দলিল ও রেকর্ড', ['ch13', 'ch14', 'ch15', 'ch17', 'appB', 'appD']],
  maps: ['মানচিত্র ও নকশা', ['ch22', 'ch07', 'ch06', 'ch10', 'ch04']],
  law: ['আইন ও নিয়ম', ['ch20', 'ch21', 'ch16', 'ch18', 'ch23', 'ch19']],
  cases: ['উদাহরণ ও কেস স্টাডি', ['appG', 'ch04', 'ch08', 'ch09', 'appF']],
  chapters: ['সব অধ্যায়', D.filter((c) => c.chapterNo).map((c) => c.id)],
  apps: ['পরিশিষ্ট (A–J)', D.filter((c) => c.appendixLetter).map((c) => c.id)],
};
const NAV = [['🏠', 'হোম', 'home'], ['🔍', 'খোঁজ', 'search'], ['🗺️', 'মানচিত্র', 'list', 'maps'], ['♥', 'পছন্দ', 'fav'], ['⋮', 'আরো', 'more']];

/* ---------- অ্যাপ বন্ধ ---------- */
function exitApp(toast) {
  const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (A && A.exitApp) return A.exitApp();
  window.close();
  setTimeout(() => toast('ব্রাউজার/ট্যাব নিজে বন্ধ করুন'), 300);
}

const Ctx = createContext(null);
const useX = () => useContext(Ctx);

/* ---------- কাঠামো ---------- */
function Shell({ title, children, back = true, right, nav = true }) {
  const { go, goBack, r } = useX();
  return (
    <>
      <div className="hd">
        {back ? <b onClick={goBack} aria-label="পেছনে">←</b> : <b onClick={() => go('more')} aria-label="মেনু">☰</b>}
        <h1>{title}</h1>
        {right || <b />}
      </div>
      <div className="ct">{children}</div>
      {nav && (
        <div className="nv">
          {NAV.map((n) => (
            <div key={n[1]} className={r.n === n[2] && (!n[3] || r.a === n[3]) ? 'on' : ''} onClick={() => go(n[2], n[3])}>
              <i>{n[0]}</i>{n[1]}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function Item({ c }) {
  const { go } = useX();
  return (
    <div className="li" onClick={() => go('chap', c.id)}>
      <div className="ic">{c.icon || '📘'}</div>
      <div><b>{c.title}</b><small>{c.subtitle || ''}</small></div><em>›</em>
    </div>
  );
}

/* ---------- স্ক্রিন ---------- */
function Splash() {
  const { go } = useX();
  const start = () => (LS.get('asked') ? go('home', undefined, undefined, true) : go('perm', undefined, undefined, true));
  return (
    <div className="sp ct" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div>
        <h1>ভূমির<br />ন্যায্য হিসাব</h1>
        <p style={{ fontSize: '1.15rem', fontWeight: 500 }}>সঠিক তথ্য, নিরাপদ জমি</p>
        <div className="lg">🏡</div>
      </div>
      <div>
        <p>লেখক</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 0 }}>আবু সালেহ মোহাম্মদ নাসিম</p>
        <button className="btn" onClick={start}>শুরু করুন</button>
        <p onClick={() => go('about')} style={{ cursor: 'pointer' }}>অ্যাপ সম্পর্কে</p>
      </div>
    </div>
  );
}

function Home() {
  const { go, reg, setReg, toast } = useX();
  const last = LS.get('last');
  const prof = LS.get('userProfile', {});
  const T = [['🧮', 'জমির মাপ ও হিসাব', ['calc'], '#d4efe9'], ['📄', 'দলিল ও রেকর্ড', ['list', 'records'], '#fbdcdc'], ['🗺️', 'মানচিত্র ও নকশা', ['list', 'maps'], '#d7ecd9'], ['⚖️', 'আইন ও নিয়ম', ['list', 'law'], '#e0e0fb'], ['📖', 'উদাহরণ ও কেস স্টাডি', ['list', 'cases'], '#d4ecef'], ['🎓', 'প্রশিক্ষণ / অনুশীলন', ['quizmenu'], '#fcebd3'],
    ['📚', 'সব অধ্যায়', ['list', 'chapters'], '#e6f0d4'], ['📎', 'পরিশিষ্ট (A–J)', ['list', 'apps'], '#f3e1f5'], ['📕', 'শব্দকোষ (Glossary)', ['chap', 'appE'], '#fff0c9'], ['☎️', 'ভূমি অফিস ঠিকানা ও যোগাযোগ', ['chap', 'appC'], '#d9e8fb'], ['🌐', 'অনলাইন সেবার লিংক ও হটলাইন', ['chap', 'appH'], '#dff3e4']];
  return (
    <Shell title="ভূমির ন্যায্য হিসাব" back={false} right={<b onClick={() => go('settings')} aria-label="সেটিংস">🔔</b>}>
      <div className="li" style={{ marginBottom: 0 }} onClick={() => go('profile')}>
        <div className="ic" style={{ borderRadius: '50%' }}>👤</div>
        <div><b>স্বাগতম, {prof.name || 'ব্যবহারকারী'}</b><small>{prof.address || reg} • প্রোফাইল এডিট করতে ক্লিক করুন</small></div><em>›</em>
      </div>
      <p style={{ color: 'var(--mu)', fontSize: '.88rem', margin: '8px 4px 0' }}>“জমির সঠিক হিসাব জানুন, নিজের অধিকার নিশ্চিত করুন।”</p>
      <div className="grid">
        {T.map((t, i) => <div key={t[1]} className="tile" style={{ background: t[3], gridColumn: i === T.length - 1 && T.length % 2 ? '1 / -1' : undefined }} onClick={() => go(...t[2])}><i>{t[0]}</i>{t[1]}</div>)}
      </div>
      {last && byId[last] && <><label>সর্বশেষ পড়া</label><Item c={byId[last]} /></>}
      <label>📍 আপনার এলাকা নির্বাচন করুন</label>
      <select value={reg} onChange={(e) => { setReg(e.target.value); toast('এলাকা: ' + e.target.value); }}>
        {Object.keys(REG).map((x) => <option key={x}>{x}</option>)}
      </select>
      <div className="li" style={{ marginTop: 12 }} onClick={() => go('chap', 'ch12')}>
        <div className="ic">📍</div><div><b>মান্দা, নওগাঁ এলাকার স্থানীয় মাপ</b></div><em>›</em>
      </div>
    </Shell>
  );
}

function List({ a }) {
  const c = CATS[a] || CATS.chapters;
  return <Shell title={c[0]}>{c[1].filter((id) => byId[id]).map((id) => <Item key={id} c={byId[id]} />)}</Shell>;
}

function More() {
  const { go, askExit, reg } = useX();
  const it = [['📋', 'আমার পছন্দের তালিকা', ['fav']], ['❓', 'প্রশ্ন ও উত্তর', ['chap', 'appF']], ['🎓', 'অনুশীলন ও কুইজ', ['quizmenu']], ['ℹ️', 'অ্যাপ সম্পর্কে', ['about']], ['⚙️', 'সেটিংস ও অনুমতি', ['settings']]];
  return (
    <Shell title="আরো">
      <div className="wel" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => go('profile')}><div className="av">👤</div><div><b>{LS.get('userProfile', {}).name || 'ব্যবহারকারী'}</b><br /><small style={{ color: 'var(--mu)' }}>{LS.get('userProfile', {}).address || reg} • এডিট করুন</small></div></div>
      {it.map((i) => <div key={i[1]} className="li" onClick={() => go(...i[2])}><div className="ic">{i[0]}</div><div><b>{i[1]}</b></div><em>›</em></div>)}
      <button className="btn o" onClick={askExit}>অ্যাপ বন্ধ করুন</button>
    </Shell>
  );
}

function Chap({ a, t }) {
  const { go, toast } = useX();
  const [, force] = useState(0);
  const c = byId[a];
  const tb = t === 'detailed' || t === 'quiz' ? t : 'short';
  useEffect(() => {
    if (!c) return;
    LS.set('last', a);
    const sid = window.__scrollSec;
    if (sid) { window.__scrollSec = null; setTimeout(() => { const e = document.getElementById('sec-' + sid); if (e) e.scrollIntoView(); }, 60); }
  }, [a, tb, c]);
  if (!c) return <Home />;
  const fav = LS.get('bm', []).includes(a);
  const toggleFav = () => {
    const b = LS.get('bm', []); const n = b.includes(a) ? b.filter((x) => x !== a) : [...b, a];
    LS.set('bm', n); force((x) => x + 1); toast(n.includes(a) ? 'পছন্দে যোগ হয়েছে' : 'পছন্দ থেকে সরানো হয়েছে');
  };
  const share = async () => {
    const txt = c.title + ' — ভূমির ন্যায্য হিসাব';
    try {
      if (navigator.share) await navigator.share({ title: txt, text: txt + '\n' + (c.subtitle || ''), url: location.href });
      else { await navigator.clipboard.writeText(txt); toast('কপি করা হয়েছে'); }
    } catch { /* ignore */ }
  };
  const nearby = () => {
    if (!navigator.geolocation) return toast('অবস্থান সমর্থিত নয়');
    navigator.geolocation.getCurrentPosition(
      (p) => window.open(`https://www.google.com/maps/search/${encodeURIComponent('ভূমি অফিস')}/@${p.coords.latitude},${p.coords.longitude},13z`, '_blank'),
      () => toast('অবস্থানের অনুমতি দিন (সেটিংস)'), { timeout: 8000 });
  };
  const nav = c.navigation || {};
  const x = c[tb];
  return (
    <Shell title={c.title} right={<><b onClick={share}>⤴</b><b onClick={toggleFav} style={{ color: fav ? '#ff8a8a' : '#fff' }}>{fav ? '♥' : '♡'}</b></>}>
      <div className="co" style={{ marginBottom: 12 }}><b>{c.icon} {c.title}</b><br /><small>{c.subtitle || ''}</small></div>
      {a === 'appC' && <button className="btn" onClick={nearby}>📍 কাছের ভূমি অফিস মানচিত্রে খুঁজুন</button>}
      <div className="tabs">
        {[['short', 'সংক্ষিপ্ত'], ['detailed', 'বিস্তারিত'], ['quiz', 'অনুশীলন']].map((k) => (
          <span key={k[0]} className={tb === k[0] ? 'on' : ''} onClick={() => go('chap', a, k[0], true)}>{k[1]}</span>
        ))}
      </div>
      {tb === 'quiz' ? (
        <>
          <p>এই অধ্যায়ে {fmt((c.quiz || []).length)}টি প্রশ্ন আছে।</p>
          {(c.quiz || []).length > 0 && <QuizStarter category={a} label="কুইজ শুরু করুন" count={c.quiz.length} />}
        </>
      ) : (
        <>{x.intro && <p>{x.intro}</p>}{x.sections.map((s, i) => <Sec key={s.id || i} s={s} />)}</>
      )}
      <div className="r2">
        {nav.prev && byId[nav.prev] && <button className="btn o" onClick={() => go('chap', nav.prev)}>‹ আগের</button>}
        {nav.next && byId[nav.next] && <button className="btn" onClick={() => go('chap', nav.next)}>পরের ›</button>}
      </div>
    </Shell>
  );
}

function Fav() {
  const b = LS.get('bm', []).filter((i) => byId[i]);
  return <Shell title="আমার পছন্দ">{b.length ? b.map((i) => <Item key={i} c={byId[i]} />) : <div className="co">এখনো কিছু যোগ করা হয়নি। অধ্যায়ের উপরের ♡ চিহ্নে চাপ দিন।</div>}</Shell>;
}

/* ---------- খোঁজ (আপনার searchEngine.js) ---------- */
function Hl({ text, q }) {
  const toks = q.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!toks.length) return text;
  return text.split(new RegExp('(' + toks.join('|') + ')', 'gi')).map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p));
}
function Search() {
  const { go } = useX();
  const [q, setQ] = useState('');
  const res = q.trim() ? searchContent(q, { limit: 40 }) : [];
  const sug = q.trim() && !res.length ? suggest(q, 6) : [];
  return (
    <Shell title="খোঁজ">
      <input type="search" placeholder="যেমন: কাঠা, নামজারি, খতিয়ান" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <div style={{ marginTop: 12 }}>
        {!q.trim() && <div className="co">কোনো শব্দ লিখুন — অধ্যায়ের সব অংশে খোঁজা হবে।</div>}
        {q.trim() && res.length > 0 && <p style={{ color: 'var(--mu)' }}>{fmt(res.length)}টি ফলাফল</p>}
        {res.map((r, i) => (
          <div key={i} className="li" onClick={() => { window.__scrollSec = r.sectionId; go('chap', r.id, r.version === 'detailed' ? 'detailed' : 'short'); }}>
            <div className="ic">{r.icon || '📘'}</div>
            <div><b>{r.sectionTitle || r.title}</b><small>{r.title}</small><small><Hl text={r.snippet || ''} q={q} /></small></div>
          </div>
        ))}
        {q.trim() && !res.length && <div className="co">কিছু পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।</div>}
        {sug.length > 0 && <div className="tabs" style={{ marginTop: 8 }}>{sug.map((s) => <span key={s} onClick={() => setQ(s)}>{s}</span>)}</div>}
      </div>
    </Shell>
  );
}

/* ---------- ক্যালকুলেটর ---------- */
function Calc() {
  const { reg } = useX();
  const u = unitsFor(reg);
  const [ct, setCt] = useState('u');
  const [cv, setCv] = useState('1'); const [cu, setCu] = useState('bigha');
  const [sh, setSh] = useState('rect'); const [dims, setDims] = useState(['', '', '']); const [su, setSu] = useState('1');
  const [pv, setPv] = useState('৫'); const [pu, setPu] = useState('shotok'); const [pp, setPp] = useState('৫,০০,০০০');
  const labels = { rect: ['দৈর্ঘ্য', 'প্রস্থ'], tri: ['ভূমি', 'উচ্চতা'], circ: ['ব্যাসার্ধ'], trap: ['সমান্তরাল বাহু ১', 'সমান্তরাল বাহু ২', 'উচ্চতা'] }[sh];
  const x = dims.map((d) => num(d) * +su);
  const area = sh === 'rect' ? x[0] * x[1] : sh === 'tri' ? (x[0] * x[1]) / 2 : sh === 'circ' ? Math.PI * x[0] * x[0] : ((x[0] + x[1]) / 2) * x[2];
  const sq = num(cv) * u[cu][1];
  const ps = (num(pv) * u[pu][1]) / u.shotok[1];
  return (
    <Shell title="জমির মাপ ও হিসাব">
      <div className="tabs">{[['u', 'একক রূপান্তর'], ['s', 'মাপ হিসাব'], ['p', 'মূল্য'], ['w', 'উত্তরাধিকার']].map((t) => <span key={t[0]} className={ct === t[0] ? 'on' : ''} onClick={() => setCt(t[0])}>{t[1]}</span>)}</div>
      {ct === 'u' && (
        <>
          <section><h3>প্রচলিত এককসমূহ ({reg})</h3>
            <Tbl r={[['১ বিঘা', '২০ কাঠা = ' + fmt(u.bigha[1]) + ' বর্গফুট'], ['১ কাঠা', fmt(u.katha[1]) + ' বর্গফুট (১৬ ছটাক)'], ['১ শতক', fmt(u.shotok[1]) + ' বর্গফুট'], ['১ একর', '১০০ শতক = ' + fmt(u.acre[1]) + ' বর্গফুট']]} /></section>
          <section><h3>মাপ রূপান্তর করুন</h3>
            <div className="r2">
              <div><label>পরিমাণ</label><input inputMode="decimal" value={cv} onChange={(e) => setCv(e.target.value)} /></div>
              <div><label>ইউনিট</label><select value={cu} onChange={(e) => setCu(e.target.value)}>{Object.keys(u).map((k) => <option key={k} value={k}>{u[k][0]}</option>)}</select></div>
            </div>
            <div className="res">{Object.keys(u).filter((k) => k !== cu).map((k) => <div key={k}>{fmt(num(cv))} {u[cu][0]} = <b>{fmt(sq / u[k][1])}</b> {u[k][0]}</div>)}</div>
          </section>
          <p className="co w">কাঠা, বিঘা, কানি এলাকাভেদে বদলায়। কেনা-বেচার আগে স্থানীয় আমিন বা সার্ভে রেকর্ড দিয়ে মিলিয়ে নিন।</p>
        </>
      )}
      {ct === 's' && (
        <section><h3>আকার অনুযায়ী ক্ষেত্রফল</h3>
          <label>জমির আকার</label>
          <select value={sh} onChange={(e) => { setSh(e.target.value); setDims(['', '', '']); }}>{[['rect', 'আয়তক্ষেত্র / বর্গ'], ['tri', 'ত্রিভুজ'], ['circ', 'বৃত্ত'], ['trap', 'ট্রাপিজিয়াম']].map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
          {labels.map((l, i) => <div key={l}><label>{l}</label><input inputMode="decimal" value={dims[i]} onChange={(e) => setDims(dims.map((d, j) => (j === i ? e.target.value : d)))} /></div>)}
          <label>মাপের একক</label>
          <select value={su} onChange={(e) => setSu(e.target.value)}><option value="1">ফুট</option><option value="1.5">হাত</option><option value="3.28084">মিটার</option><option value="3">গজ</option></select>
          <div className="res">{area ? <>ক্ষেত্রফল = <b>{fmt(area, 2)}</b> বর্গফুট<br />= {fmt(area / u.shotok[1], 2)} শতক<br />= {fmt(area / u.katha[1], 2)} কাঠা<br />= {fmt(area / u.bigha[1], 3)} বিঘা<br />= {fmt(area / u.acre[1], 4)} একর</> : 'মাপ লিখুন'}</div>
        </section>
      )}
      {ct === 'w' && <Ongsidar unitTable={u} />}
      {ct === 'p' && (
        <section><h3>জমির মূল্য হিসাব</h3>
          <div className="r2">
            <div><label>পরিমাণ</label><input inputMode="decimal" value={pv} onChange={(e) => setPv(e.target.value)} /></div>
            <div><label>একক</label><select value={pu} onChange={(e) => setPu(e.target.value)}>{Object.keys(u).map((k) => <option key={k} value={k}>{u[k][0]}</option>)}</select></div>
          </div>
          <label>প্রতি শতকের দাম (টাকা)</label>
          <input inputMode="decimal" value={pp} onChange={(e) => setPp(e.target.value)} />
          <div className="res">{fmt(num(pv))} {u[pu][0]} = {fmt(ps, 3)} শতক<br />মোট দাম = <b>{fmt(Math.round(ps * num(pp)))}</b> টাকা</div>
        </section>
      )}
    </Shell>
  );
}

/* ---------- কুইজ (আপনার quizEngine.js) ---------- */
function QuizStarter({ category = 'all', count = 10, mode = 'practice', label, outline, sub }) {
  const { go, toast, setSess } = useX();
  const run = () => {
    const s = startQuiz({ mode, category, count });
    if (s.error) return toast(s.error);
    setSess(s); go('quiz');
  };
  return sub
    ? <div className="li" onClick={run}><div className="ic">{sub.icon}</div><div><b>{sub.name}</b><small>{fmt(sub.count)}টি প্রশ্ন</small></div><em>›</em></div>
    : <button className={'btn ' + (outline ? 'o' : '')} onClick={run}>{label}</button>;
}
function QuizMenu() {
  const s = getQuizStats();
  const cats = D.filter((c) => (c.quiz || []).length);
  return (
    <Shell title="প্রশিক্ষণ / অনুশীলন">
      <div className="co">সম্পন্ন কুইজ: {bn(s.totalSessions)} | সর্বোচ্চ স্কোর: {bn(s.bestPercentage)}% | গড়: {bn(s.averagePercentage)}%</div>
      <QuizStarter label="র্যান্ডম ১০টি প্রশ্ন" />
      <QuizStarter label="পরীক্ষা মোড: ২০টি প্রশ্ন" mode="exam" count={20} outline />
      <h3 style={{ marginTop: 16 }}>অধ্যায় অনুযায়ী</h3>
      {cats.map((c) => <QuizStarter key={c.id} category={c.id} count={c.quiz.length} sub={{ icon: c.icon || '📘', name: c.title, count: c.quiz.length }} />)}
    </Shell>
  );
}
function Quiz() {
  const { sess, go } = useX();
  if (!sess) return <QuizMenu />;
  return <QuizRun key={sess.id} sess={sess} go={go} />;
}
function QuizRun({ sess, go }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [fb, setFb] = useState(null);
  const [res, setRes] = useState(null);
  const total = sess.questions.length;
  const q = sess.questions[i];
  const pick = (k) => { if (sel != null) return; setSel(k); setFb(answerQuestion(i, k)); };
  const next = () => { if (i + 1 < total) { setI(i + 1); setSel(null); setFb(null); } else setRes(finishQuiz()); };
  if (res) {
    const wrong = res.questions.filter((x) => !x.isCorrect);
    return (
      <Shell title="ফলাফল" nav={false}>
        <section style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>{res.percentage >= 80 ? '🏆' : res.percentage >= 60 ? '👍' : '📚'}</div>
          <h3>{res.grade.label} ({res.grade.grade})</h3>
          <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>{fmt(res.correct)} / {fmt(res.total)} ({fmt(res.percentage)}%)</p>
        </section>
        {wrong.length > 0 && <h3>যেগুলো ভুল হয়েছে</h3>}
        {wrong.map((x) => <div className="card" key={x.uid}><b>{x.question}</b><p>সঠিক উত্তর: {x.options[x.correctAnswer]}</p></div>)}
        <QuizStarter label="আবার চেষ্টা করুন" category={sess.category} count={total} mode={sess.mode} />
        <button className="btn o" onClick={() => go('quizmenu', undefined, undefined, true)}>কুইজ মেনু</button>
      </Shell>
    );
  }
  return (
    <Shell title="কুইজ" nav={false}>
      <div className="bar"><div style={{ width: (i * 100) / total + '%' }} /></div>
      <p style={{ color: 'var(--mu)' }}>প্রশ্ন {fmt(i + 1)} / {fmt(total)}</p>
      <h3 style={{ fontSize: '1.15rem', lineHeight: 1.6 }}>{q.question}</h3>
      {q.options.map((o, k) => <div key={k} className={'opt ' + (sel == null ? '' : k === q.answer ? 'ok' : k === sel ? 'no' : '')} onClick={() => pick(k)}>{o}</div>)}
      {fb && fb.explanation && <div className="co">{fb.explanation}</div>}
      {sel != null && <button className="btn" onClick={next}>{i + 1 < total ? 'পরের প্রশ্ন' : 'ফলাফল দেখুন'}</button>}
    </Shell>
  );
}

/* ---------- সেটিংস ও অনুমতি ---------- */
async function askNotif() { try { if (!window.Notification) return false; const r = await Notification.requestPermission(); if (r === 'granted') { try { new Notification('ভূমির ন্যায্য হিসাব', { body: 'নোটিফিকেশন চালু হয়েছে' }); } catch { /* ignore */ } } return r === 'granted'; } catch { return false; } }
function askGeo() { return new Promise((res) => { if (!navigator.geolocation) return res(false); navigator.geolocation.getCurrentPosition(() => { const m = LS.get('pm', {}); m.geo = 1; LS.set('pm', m); res(true); }, () => res(false), { timeout: 8000 }); }); }
async function askStore() { try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); const m = LS.get('pm', {}); m.st = 1; LS.set('pm', m); return true; } catch { return false; } }

function PermRow({ t, d, ok, f }) {
  const [, force] = useState(0);
  return (
    <div className="sw"><div><b>{t}</b><small>{d}</small></div>
      <button className={ok ? 'd' : ''} onClick={async () => { await f(); force((x) => x + 1); }}>{ok ? 'চালু ✓' : 'অনুমতি দিন'}</button></div>
  );
}
function Settings() {
  const { toast, dlg, setTheme, setFs } = useX();
  const nt = window.Notification ? Notification.permission : 'unsupported';
  const pm = LS.get('pm', {});
  return (
    <Shell title="সেটিংস ও অনুমতি">
      <section><h3>অনুমতি</h3>
        <PermRow t="🔔 নোটিফিকেশন" d="পড়ার রিমাইন্ডার ও জরুরি আপডেটের জন্য (ঐচ্ছিক)" ok={nt === 'granted'} f={askNotif} />
        <PermRow t="📍 অবস্থান" d="কাছের ভূমি অফিস মানচিত্রে খুঁজতে (ঐচ্ছিক)" ok={!!pm.geo} f={askGeo} />
        <PermRow t="💾 স্থায়ী সংরক্ষণ" d="পছন্দ ও কুইজের অগ্রগতি যেন মুছে না যায়" ok={!!pm.st} f={askStore} />
        <p style={{ color: 'var(--mu)', fontSize: '.85rem' }}>অনুমতি না দিলেও অ্যাপের সব পড়ার অংশ কাজ করবে। ফোনের সেটিংস থেকে যেকোনো সময় বদলানো যায়।</p>
      </section>
      <section><h3>দেখতে কেমন হবে</h3>
        <div className="r2"><button className="btn o" onClick={() => setTheme('light')}>☀️ দিন</button><button className="btn o" onClick={() => setTheme('dark')}>🌙 রাত</button></div>
        <div className="r2"><button className="btn o" onClick={() => setFs(-10)}>A− ছোট</button><button className="btn o" onClick={() => setFs(10)}>A+ বড়</button></div>
      </section>
      <section><h3>ডেটা</h3>
        <button className="btn o" onClick={() => dlg('মুছে ফেলবেন?', 'পছন্দের তালিকা ও কুইজের অগ্রগতি মুছে যাবে।', [['মুছুন', () => { ['bm', 'last', 'landQuizStats'].forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } }); toast('মুছে ফেলা হয়েছে'); }], ['বাতিল', null, 'o']])}>পছন্দ ও অগ্রগতি মুছুন</button>
      </section>
    </Shell>
  );
}
function Perm() {
  const { go } = useX();
  const done = () => { LS.set('asked', 1); go('home', undefined, undefined, true); };
  return (
    <Shell title="শুরুর আগে" nav={false} back={false}>
      <section><h3>কিছু অনুমতি দরকার হতে পারে</h3>
        <p>অ্যাপ আরও কাজের করতে আমরা নিচের অনুমতিগুলো চাই। সবগুলোই ঐচ্ছিক — পরেও দিতে পারবেন।</p>
        <div className="co">🔔 নোটিফিকেশন — রিমাইন্ডার<br />📍 অবস্থান — কাছের ভূমি অফিস খোঁজা<br />💾 সংরক্ষণ — পছন্দ ও কুইজের অগ্রগতি</div>
        <button className="btn" onClick={async () => { await askNotif(); await askGeo(); await askStore(); done(); }}>অনুমতি দিন</button>
        <button className="btn o" onClick={done}>পরে করব</button>
      </section>
    </Shell>
  );
}
function About() {
  return (
    <Shell title="অ্যাপ সম্পর্কে">
      <section><h3>ভূমির ন্যায্য হিসাব</h3>
        <p>জমির মাপ, দলিল, খতিয়ান, নামজারি, আইন ও ভূমি সেবা — বাংলায় সহজ ভাষায়। সব তথ্য অফলাইনে পড়া যায়।</p>
        <p><b>লেখক:</b> আবু সালেহ মোহাম্মদ নাসিম</p>
        <p>{fmt(D.filter((c) => c.chapterNo).length)}টি অধ্যায় ও {fmt(D.filter((c) => c.appendixLetter).length)}টি পরিশিষ্ট।</p>
      </section>
      <p className="co w">এই অ্যাপের তথ্য সাধারণ জ্ঞানের জন্য। আইনি সিদ্ধান্তের আগে ভূমি অফিস বা আইনজীবীর পরামর্শ নিন।</p>
    </Shell>
  );
}

function Profile() {
  const { goBack } = useX();
  return <div className="ct" style={{ background: '#fff', color: '#1b2a22' }}><ProfileSettings onBack={goBack} /></div>;
}

const VIEWS = { profile: Profile, splash: Splash, home: Home, list: List, more: More, chap: Chap, fav: Fav, search: Search, calc: Calc, quizmenu: QuizMenu, quiz: Quiz, settings: Settings, perm: Perm, about: About };

/* ---------- মূল অ্যাপ (ব্যাক বাটন এখানে) ---------- */
export default function App() {
  const [r, setR] = useState({ n: 'splash' });
  const [dlg, setDlgS] = useState(null);
  const [tst, setTst] = useState(null);
  const [reg, setRegS] = useState(LS.get('reg', 'মান্দা, নওগাঁ'));
  const [sess, setSess] = useState(null);
  const rRef = useRef(r); rRef.current = r;
  const dRef = useRef(dlg); dRef.current = dlg;

  const toast = (m) => { setTst(m); setTimeout(() => setTst(null), 2400); };
  const dlgOpen = (h, m, btns) => setDlgS({ h, m, btns });
  const go = (n, a, t, rep) => {
    const s = { n, a, t };
    if (rep) history.replaceState(s, ''); else history.pushState(s, '');
    setR(s);
    const c = document.querySelector('.ct'); if (c) c.scrollTop = 0;
  };
  const goBack = () => history.back();
  const askExit = () => dlgOpen('অ্যাপ থেকে বের হবেন?', 'আপনার পছন্দের তালিকা ও অগ্রগতি সংরক্ষিত থাকবে।', [['থাকুন', null], ['বের হন', () => exitApp(toast), 'o']]);
  const setReg = (v) => { LS.set('reg', v); setRegS(v); };
  const setTheme = (t) => { document.documentElement.dataset.theme = t; LS.set('th', t); };
  const setFs = (d) => { const v = Math.min(140, Math.max(80, LS.get('fs', 100) + d)); LS.set('fs', v); document.documentElement.style.fontSize = v + '%'; };
  const askExitRef = useRef(askExit); askExitRef.current = askExit;

  useEffect(() => {
    const t = LS.get('th'); if (t) document.documentElement.dataset.theme = t;
    document.documentElement.style.fontSize = LS.get('fs', 100) + '%';
    if (!window.__bhumirBoot) { window.__bhumirBoot = 1; history.replaceState({ n: 'exit' }, ''); history.pushState({ n: 'splash' }, ''); }
    const onPop = (e) => {
      if (dRef.current) { setDlgS(null); history.pushState(rRef.current, ''); return; }
      const s = e.state;
      if (!s || s.n === 'exit') { history.pushState(rRef.current, ''); askExitRef.current(); return; }
      setR(s);
    };
    window.addEventListener('popstate', onPop);
    const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    const h = A && A.addListener ? A.addListener('backButton', () => history.back()) : null;
    return () => { window.removeEventListener('popstate', onPop); if (h) Promise.resolve(h).then((x) => x && x.remove && x.remove()); };
  }, []);

  const View = VIEWS[r.n] || Home;
  return (
    <Ctx.Provider value={{ r, go, goBack, toast, dlg: dlgOpen, askExit, reg, setReg, sess, setSess, setTheme, setFs }}>
      <div className="app"><View a={r.a} t={r.t} /></div>
      {dlg && (
        <div className="mk" onClick={() => setDlgS(null)}>
          <div role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{dlg.h}</h3><p>{dlg.m}</p>
            {dlg.btns.map((b, i) => <button key={i} className={'btn ' + (b[2] || '')} onClick={() => { setDlgS(null); if (b[1]) b[1](); }}>{b[0]}</button>)}
          </div>
        </div>
      )}
      {tst && <div className="ts">{tst}</div>}
    </Ctx.Provider>
  );
}
