// ============================================================
// searchEngine.js
// ভূমি অ্যাপ — সব কনটেন্টে দ্রুত খোঁজার ইঞ্জিন
// সংস্করণ: ১.০ | ভাষা: বাংলা
// ============================================================

// ============================================================
// ১. সব অধ্যায় ও অ্যাপেন্ডিক্স ইমপোর্ট
// ============================================================
import chapter1 from './chapter1.js';
import chapter2 from './chapter2.js';
import chapter3 from './chapter3.js';
import chapter4 from './chapter4.js';
import chapter5 from './chapter5.js';
import chapter6 from './chapter6.js';
import chapter7 from './chapter7.js';
import chapter8 from './chapter8.js';
import chapter9 from './chapter9.js';
import chapter10 from './chapter10.js';
import chapter11 from './chapter11.js';
import chapter12 from './chapter12.js';
import chapter13 from './chapter13.js';
import chapter14 from './chapter14.js';
import chapter15 from './chapter15.js';
import chapter16 from './chapter16.js';
import chapter17 from './chapter17.js';
import chapter18 from './chapter18.js';
import chapter19 from './chapter19.js';
import chapter20 from './chapter20.js';
import chapter21 from './chapter21.js';
import chapter22 from './chapter22.js';
import chapter23 from './chapter23.js';

import appendixA from './appendixA.js';
import appendixB from './appendixB.js';
import appendixC from './appendixC.js';
import appendixD from './appendixD.js';
import appendixE from './appendixE.js';
import appendixF from './appendixF.js';
import appendixG from './appendixG.js';
import appendixH from './appendixH.js';
import appendixI from './appendixI.js';
import appendixJ from './appendixJ.js';

// ============================================================
// ২. সব কনটেন্ট এক জায়গায়
// ============================================================
const ALL_CONTENT = [
  chapter1, chapter2, chapter3, chapter4, chapter5,
  chapter6, chapter7, chapter8, chapter9, chapter10,
  chapter11, chapter12, chapter13, chapter14, chapter15,
  chapter16, chapter17, chapter18, chapter19, chapter20,
  chapter21, chapter22, chapter23,
  appendixA, appendixB, appendixC, appendixD, appendixE,
  appendixF, appendixG, appendixH, appendixI, appendixJ,
];

// ============================================================
// ৩. টেক্সট নরমালাইজ (বাংলা ইউনিকোড সমর্থন)
// ============================================================
function normalizeBengali(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    // যুক্তাক্ষর/কার-চিহ্ন অপরিবর্তিত রাখুন (বাংলা Unicode range)
    // শুধু যতিচিহ্ন ও একাধিক স্পেস সরান
    .replace(/[।,;:!?؟"'`~@#$%^&*()_+=\[\]{}|\\<>\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// ৪. কনটেন্ট ফ্ল্যাটেন (সব টেক্সট এক জায়গায়)
// ============================================================
function flattenContent(item, version = 'short') {
  const chunks = [];
  const baseMeta = {
    id: item.id,
    type: item.type || 'chapter',
    chapterNo: item.chapterNo || null,
    appendixLetter: item.appendixLetter || null,
    title: item.title || '',
    subtitle: item.subtitle || '',
    icon: item.icon || '📄',
    part: item.part || null,
    version,
  };

  const content = item[version];
  if (!content) return chunks;

  //intro
  if (content.intro) {
    chunks.push({
      ...baseMeta,
      sectionId: 'intro',
      sectionTitle: 'ভূমিকা',
      field: 'intro',
      text: content.intro,
      weight: 1.2,
    });
  }

  // sections
  if (content.sections && Array.isArray(content.sections)) {
    content.sections.forEach((section) => {
      const sectionTitle = section.title || '';
      const sectionId = section.id || '';

      // টেবিল
      if (section.rows && Array.isArray(section.rows)) {
        section.rows.forEach((row, idx) => {
          const rowText = Array.isArray(row) ? row.join(' | ') : String(row);
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'table_row',
            text: rowText,
            weight: 1.0,
            rowIndex: idx,
            columns: section.columns,
          });
        });
        // টেবিলের কলাম হেডারও খুঁজতে হবে
        if (section.columns) {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'table_header',
            text: section.columns.join(' | '),
            weight: 0.9,
          });
        }
      }

      // সূত্র
      if (section.formulas && Array.isArray(section.formulas)) {
        section.formulas.forEach((f) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'formula',
            text: `${f.name}: ${f.formula}${f.example ? ' — উদাহরণ: ' + f.example : ''}`,
            weight: 1.3,
          });
        });
      }

      // উদাহরণ
      if (section.examples && Array.isArray(section.examples)) {
        section.examples.forEach((ex) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'example',
            text: `${ex.title || ''}: ${(ex.steps || []).join(' → ')}`,
            weight: 1.0,
          });
        });
      }

      // mistakes
      if (section.items && section.items[0]?.mistake) {
        section.items.forEach((m) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'mistake',
            text: `${m.mistake} → সংশোধন: ${m.correction || ''}`,
            weight: 1.1,
          });
        });
      }

      // tips (array of strings)
      else if (section.items && typeof section.items[0] === 'string') {
        section.items.forEach((tip) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'tip',
            text: tip,
            weight: 1.0,
          });
        });
      }

      // faq
      else if (section.items && section.items[0]?.q) {
        section.items.forEach((faq) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'faq',
            text: `প্রশ্ন: ${faq.q} — উত্তর: ${faq.a || ''}`,
            weight: 1.2,
          });
        });
      }

      // glossary
      else if (section.items && section.items[0]?.term) {
        section.items.forEach((g) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'glossary',
            text: `${g.term} — ${g.definition || ''}${g.example ? ' (উদাহরণ: ' + g.example + ')' : ''}`,
            weight: 1.2,
          });
        });
      }

      // paragraphs
      if (section.content && Array.isArray(section.content)) {
        section.content.forEach((para) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'paragraph',
            text: para,
            weight: 1.0,
          });
        });
      }

      // checklist
      if (section.items && section.items[0]?.step) {
        section.items.forEach((s) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'checklist',
            text: `ধাপ ${s.step}: ${s.task}${s.detail ? ' — ' + s.detail : ''}`,
            weight: 1.0,
          });
        });
      }

      // summary points
      if (section.points && Array.isArray(section.points)) {
        section.points.forEach((p) => {
          chunks.push({
            ...baseMeta,
            sectionId,
            sectionTitle,
            field: 'summary',
            text: p,
            weight: 1.0,
          });
        });
      }

      // general text (text, formula, code, etc.)
      if (section.text && typeof section.text === 'string') {
        chunks.push({
          ...baseMeta,
          sectionId,
          sectionTitle,
          field: 'text',
          text: section.text,
          weight: 1.1,
        });
      }
      if (section.formula && typeof section.formula === 'string') {
        chunks.push({
          ...baseMeta,
          sectionId,
          sectionTitle,
          field: 'formula',
          text: section.formula + (section.example ? ' — ' + section.example : ''),
          weight: 1.3,
        });
      }
      if (section.code && typeof section.code === 'string') {
        chunks.push({
          ...baseMeta,
          sectionId,
          sectionTitle,
          field: 'code',
          text: section.code,
          weight: 0.7, // কোড কম স্কোর
        });
      }
    });
  }

  return chunks;
}

// ============================================================
// ৫. ইনডেক্স তৈরি
// ============================================================
let SEARCH_INDEX = [];

function buildIndex() {
  SEARCH_INDEX = [];
  ALL_CONTENT.forEach((item) => {
    SEARCH_INDEX.push(...flattenContent(item, 'short'));
    SEARCH_INDEX.push(...flattenContent(item, 'detailed'));
  });
  // টাইটেল ও সার্চইনডেক্স আলাদা যোগ
  ALL_CONTENT.forEach((item) => {
    if (item.title) {
      SEARCH_INDEX.push({
        id: item.id,
        type: item.type || 'chapter',
        chapterNo: item.chapterNo || null,
        appendixLetter: item.appendixLetter || null,
        title: item.title,
        subtitle: item.subtitle || '',
        icon: item.icon || '📄',
        part: item.part || null,
        version: 'meta',
        sectionId: 'title',
        sectionTitle: item.title,
        field: 'title',
        text: `${item.title} ${item.subtitle || ''}`,
        weight: 2.0, // টাইটেল বেশি গুরুত্ব
      });
    }
    if (item.searchIndex && Array.isArray(item.searchIndex)) {
      item.searchIndex.forEach((keyword) => {
        SEARCH_INDEX.push({
          id: item.id,
          type: item.type || 'chapter',
          chapterNo: item.chapterNo || null,
          appendixLetter: item.appendixLetter || null,
          title: item.title,
          icon: item.icon || '📄',
          version: 'meta',
          sectionId: 'keyword',
          sectionTitle: 'কীওয়ার্ড',
          field: 'keyword',
          text: keyword,
          weight: 1.5,
        });
      });
    }
  });
}

// ============================================================
// ৬. টোকেনাইজ
// ============================================================
function tokenize(text) {
  const normalized = normalizeBengali(text);
  if (!normalized) return [];
  return normalized.split(' ').filter((t) => t.length >= 1);
}

// ============================================================
// ৭. স্কোরিং — কতটা প্রাসঙ্গিক
// ============================================================
function scoreChunk(chunk, queryTokens, fullQuery) {
  const chunkText = normalizeBengali(chunk.text);
  const chunkTitle = normalizeBengali(chunk.title || '');
  const chunkSection = normalizeBengali(chunk.sectionTitle || '');

  let score = 0;
  let matches = 0;

  // ফুল ফ্রেজ ম্যাচ (সর্বোচ্চ স্কোর)
  if (chunkText.includes(fullQuery)) {
    score += 50;
    matches++;
  }
  if (chunkTitle.includes(fullQuery)) score += 100;
  if (chunkSection.includes(fullQuery)) score += 60;

  // প্রতিটি টোকেনের জন্য
  queryTokens.forEach((token) => {
    if (token.length < 2) return;

    // text-এ টোকেন
    const textCount = (chunkText.match(new RegExp(token, 'g')) || []).length;
    if (textCount > 0) {
      score += Math.min(textCount, 5) * 5;
      matches++;
    }

    // title-এ টোকেন
    if (chunkTitle.includes(token)) score += 40;

    // sectionTitle-এ টোকেন
    if (chunkSection.includes(token)) score += 20;

    // শব্দের শুরুতে মিললে বোনাস
    if (chunkText.startsWith(token) || chunkText.includes(' ' + token)) {
      score += 3;
    }
  });

  // weight প্রয়োগ
  score *= chunk.weight || 1;

  // সব টোকেন ম্যাচ না করলে কম স্কোর
  if (matches < queryTokens.length) {
    score *= matches / queryTokens.length;
  }

  return score;
}

// ============================================================
// ৮. স্নিপেট তৈরি (ম্যাচ করা অংশ তুলে আনা)
// ============================================================
function makeSnippet(text, queryTokens, maxLen = 120) {
  if (!text) return '';
  const lower = text.toLowerCase();
  let firstIndex = -1;

  for (const token of queryTokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
  }

  const start = Math.max(0, firstIndex - 40);
  const end = Math.min(text.length, firstIndex + maxLen - 40);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';

  return snippet;
}

// ============================================================
// ৯. মূল সার্চ ফাংশন
// ============================================================
/**
 * @param {string} query - সার্চ কীওয়ার্ড
 * @param {object} options - { type, chapterNo, version, limit }
 * @returns {array} - র‌্যাংকড ফলাফল
 */
export function search(query, options = {}) {
  const {
    type = null,        // 'chapter' | 'appendix' | null
    chapterNo = null,   // নির্দিষ্ট অধ্যায়
    version = null,     // 'short' | 'detailed' | null
    limit = 20,
    minScore = 1,
  } = options;

  if (!query || query.trim().length < 1) return [];

  const normalized = normalizeBengali(query);
  const tokens = tokenize(query);

  if (tokens.length === 0) return [];

  // ফিল্টার প্রয়োগ
  let candidates = SEARCH_INDEX;
  if (type) candidates = candidates.filter((c) => c.type === type);
  if (chapterNo) candidates = candidates.filter((c) => c.chapterNo === chapterNo);
  if (version && version !== 'meta') {
    candidates = candidates.filter((c) => c.version === version || c.version === 'meta');
  }

  // স্কোরিং
  const scored = candidates
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, tokens, normalized),
    }))
    .filter((s) => s.score >= minScore);

  // সাজানো
  scored.sort((a, b) => b.score - a.score);

  // ডুপ্লিকেট অপসারণ (একই সেকশন বারবার না আসা)
  const seen = new Set();
  const results = [];

  for (const { chunk, score } of scored) {
    const key = `${chunk.id}-${chunk.sectionId}-${chunk.version}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      id: chunk.id,
      type: chunk.type,
      chapterNo: chunk.chapterNo,
      appendixLetter: chunk.appendixLetter,
      title: chunk.title,
      subtitle: chunk.subtitle,
      icon: chunk.icon,
      part: chunk.part,
      version: chunk.version,
      sectionId: chunk.sectionId,
      sectionTitle: chunk.sectionTitle,
      field: chunk.field,
      snippet: makeSnippet(chunk.text, tokens),
      score: Math.round(score * 100) / 100,
    });

    if (results.length >= limit) break;
  }

  return results;
}

// ============================================================
// ১০. সার্চ সাজেশন (টাইপিং-এর সাথে সাথে)
// ============================================================
export function suggest(input, limit = 8) {
  if (!input || input.length < 1) return [];
  const tokens = tokenize(input);
  if (!tokens.length) return [];

  const lastToken = tokens[tokens.length - 1];
  const suggestions = new Set();

  // টাইটেল থেকে সাজেশন
  ALL_CONTENT.forEach((item) => {
    const text = normalizeBengali(`${item.title} ${item.subtitle || ''}`);
    if (text.includes(lastToken)) {
      suggestions.add(item.title);
    }
  });

  // searchIndex কীওয়ার্ড থেকে সাজেশন
  ALL_CONTENT.forEach((item) => {
    if (item.searchIndex) {
      item.searchIndex.forEach((kw) => {
        if (normalizeBengali(kw).includes(lastToken)) {
          suggestions.add(kw);
        }
      });
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

// ============================================================
// ১১. টপিক-ভিত্তিক ব্রাউজিং
// ============================================================
export function getTopics() {
  return ALL_CONTENT.map((item) => ({
    id: item.id,
    type: item.type || 'chapter',
    chapterNo: item.chapterNo || null,
    appendixLetter: item.appendixLetter || null,
    title: item.title,
    subtitle: item.subtitle,
    icon: item.icon,
    part: item.part,
  }));
}

// ============================================================
// ১২. নির্দিষ্ট অধ্যায়/অ্যাপেন্ডিক্স ফেচ
// ============================================================
export function getContent(id) {
  return ALL_CONTENT.find((item) => item.id === id) || null;
}

// ============================================================
// ১৩. স্ট্যাটস
// ============================================================
export function getStats() {
  return {
    totalChapters: ALL_CONTENT.filter((i) => i.type !== 'appendix' && i.chapterNo).length,
    totalAppendices: ALL_CONTENT.filter((i) => i.appendixLetter).length,
    totalChunks: SEARCH_INDEX.length,
    totalKeywords: ALL_CONTENT.reduce(
      (sum, i) => sum + (i.searchIndex?.length || 0),
      0
    ),
  };
}

// ============================================================
// ১৪. ইনিশিয়ালাইজ (অ্যাপ চালু হলে একবার)
// ============================================================
let isInitialized = false;

export function initSearchEngine() {
  if (isInitialized) return;
  buildIndex();
  isInitialized = true;
  if (typeof console !== 'undefined') {
    console.log('🔍 Search Engine Ready:', getStats());
  }
}

// অটো-ইনিশিয়ালাইজ
initSearchEngine();

// ============================================================
// ১৫. ডিফল্ট এক্সপোর্ট
// ============================================================
export default {
  search,
  suggest,
  getTopics,
  getContent,
  getStats,
  initSearchEngine,
};