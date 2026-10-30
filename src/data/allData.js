// src/data/allData.js
const chapterModules = import.meta.glob('./chapter*.js', { eager: true });
const appendixModules = import.meta.glob('./appendix*.js', { eager: true });

const sortByNumber = (a, b) => {
  const numA = parseInt(a.replace(/\D/g, '')) || 0;
  const numB = parseInt(b.replace(/\D/g, '')) || 0;
  return numA - numB;
};

// মডিউল থেকে ডেটা বের করার নতুন ফাংশন
const extractData = (mod) => {
  // যদি export default থাকে
  if (mod.default) return mod.default;
  // যদি export const chapter1 = {...} থাকে
  const keys = Object.keys(mod);
  if (keys.length > 0) return mod[keys[0]];
  return mod;
};

export const chapters = Object.keys(chapterModules)
  .sort(sortByNumber)
  .map(key => extractData(chapterModules[key]));

export const appendices = Object.keys(appendixModules)
  .sort(sortByNumber)
  .map(key => extractData(appendixModules[key]));

export const D = [...chapters, ...appendices];