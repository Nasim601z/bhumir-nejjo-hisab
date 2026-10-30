// ============================================================
// quizEngine.js
// ভূমি অ্যাপ — কুইজ ইঞ্জিন
// সংস্করণ: ১.০ | ভাষা: বাংলা
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
// ১. সব কনটেন্ট
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
// ২. সব কুইজ সংগ্রহ
// ============================================================
function collectAllQuizzes() {
  const all = [];
  ALL_CONTENT.forEach((item) => {
    if (!item.quiz || !Array.isArray(item.quiz)) return;

    item.quiz.forEach((q, idx) => {
      all.push({
        ...q,
        sourceId: item.id,
        sourceType: item.type || 'chapter',
        sourceTitle: item.title,
        chapterNo: item.chapterNo || null,
        appendixLetter: item.appendixLetter || null,
        icon: item.icon || '📄',
        part: item.part || null,
        quizIndex: idx,
        // ইউনিক আইডি
        uid: `${item.id}-q${idx}`,
        correctAnswer: q.answer,
      });
    });
  });
  return all;
}

// ============================================================
// ৩. কুইজ ইঞ্জিন
// ============================================================
class QuizEngine {
  constructor() {
    this.allQuizzes = collectAllQuizzes();
    this.session = null;
    this.history = [];
    this.stats = this._loadStats();
  }

  // ============================================================
  // ৩.১ সেশন শুরু
  // ============================================================
  /**
   * @param {object} options
   *   - mode: 'practice' | 'exam' | 'random' | 'timed'
   *   - category: 'all' | 'chapter' | 'appendix' | chapterId
   *   - count: সংখ্যা (ডিফল্ট ১০)
   *   - shuffleOptions: অপশন শাফল
   *   - timer: সেকেন্ড (exam mode-এ)
   *   - allowReview: সেশন শেষে রিভিউ
   */
  startSession(options = {}) {
    const {
      mode = 'practice',
      category = 'all',
      count = 10,
      shuffleOptions = true,
      timer = mode === 'exam' ? 60 * count : 0,
      difficulty = 'mixed',
    } = options;

    // ফিল্টার
    let pool = this.allQuizzes;
    if (category === 'chapter') {
      pool = pool.filter((q) => q.sourceType !== 'appendix' && q.chapterNo);
    } else if (category === 'appendix') {
      pool = pool.filter((q) => q.appendixLetter);
    } else if (category && category !== 'all') {
      pool = pool.filter((q) => q.sourceId === category);
    }

    if (pool.length === 0) {
      return { error: 'এই ক্যাটাগরিতে কোনো কুইজ পাওয়া যায়নি।' };
    }

    // শাফল
    pool = this._shuffle([...pool]).slice(0, Math.min(count, pool.length));

    // অপশন শাফল
    const questions = pool.map((q) => {
      const correctText = q.options[q.answer];
      let options = [...q.options];
      let answerIndex = q.answer;

      if (shuffleOptions) {
        options = this._shuffle([...options]);
        answerIndex = options.indexOf(correctText);
      }

      return {
        ...q,
        options,
        answer: answerIndex,
        userAnswer: null,
        isCorrect: null,
        timeSpent: 0,
        answered: false,
      };
    });

    this.session = {
      id: `quiz-${Date.now()}`,
      mode,
      category,
      timer,
      allowReview: mode !== 'exam',
      questions,
      currentIndex: 0,
      startTime: Date.now(),
      endTime: null,
      status: 'active', // active | completed | timedout
      score: 0,
      correct: 0,
      wrong: 0,
      skipped: 0,
    };

    return this.session;
  }

  // ============================================================
  // ৩.২ উত্তর দেওয়া
  // ============================================================
  answer(questionIndex, selectedOptionIndex) {
    if (!this.session || this.session.status !== 'active') {
      return { error: 'সেশন সক্রিয় নয়।' };
    }
    if (questionIndex < 0 || questionIndex >= this.session.questions.length) {
      return { error: 'প্রশ্নের নম্বর ভুল।' };
    }

    const question = this.session.questions[questionIndex];
    if (question.answered) {
      return { error: 'এই প্রশ্নের উত্তর দেওয়া হয়ে গেছে।' };
    }

    question.userAnswer = selectedOptionIndex;
    question.isCorrect = selectedOptionIndex === question.answer;
    question.answered = true;
    question.timeSpent = Date.now() - this.session.startTime;

    if (question.isCorrect) {
      this.session.correct++;
      this.session.score += 10;
    } else {
      this.session.wrong++;
    }

    // পরের প্রশ্নে যাওয়া
    if (this.session.currentIndex < this.session.questions.length - 1) {
      this.session.currentIndex++;
    }

    return {
      correct: question.isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation || null,
      currentIndex: this.session.currentIndex,
    };
  }

  // ============================================================
  // ৩.৩ এড়িয়ে যাওয়া
  // ============================================================
  skip(questionIndex) {
    if (!this.session || this.session.status !== 'active') return { error: 'সেশন সক্রিয় নয়।' };
    const question = this.session.questions[questionIndex];
    if (question.answered) return { error: 'ইতিমধ্যে উত্তর দেওয়া হয়েছে।' };

    question.answered = true;
    question.isCorrect = false;
    this.session.skipped++;

    if (this.session.currentIndex < this.session.questions.length - 1) {
      this.session.currentIndex++;
    }
    return { skipped: true };
  }

  // ============================================================
  // ৩.৪ সেশন শেষ
  // ============================================================
  finishSession() {
    if (!this.session) return { error: 'কোনো সেশন নেই।' };

    // বাকি প্রশ্নগুলো skip হিসেবে গণনা
    this.session.questions.forEach((q) => {
      if (!q.answered) {
        q.answered = true;
        q.isCorrect = false;
        this.session.skipped++;
      }
    });

    this.session.status = 'completed';
    this.session.endTime = Date.now();
    this.session.totalTime = this.session.endTime - this.session.startTime;

    const total = this.session.questions.length;
    const percentage = total > 0 ? Math.round((this.session.correct / total) * 100) : 0;

    const result = {
      sessionId: this.session.id,
      mode: this.session.mode,
      category: this.session.category,
      total,
      correct: this.session.correct,
      wrong: this.session.wrong,
      skipped: this.session.skipped,
      score: this.session.score,
      percentage,
      totalTime: this.session.totalTime,
      grade: this._getGrade(percentage),
      questions: this.session.questions.map((q) => ({
        uid: q.uid,
        question: q.question,
        userAnswer: q.userAnswer,
        correctAnswer: q.answer,
        isCorrect: q.isCorrect,
        options: q.options,
        sourceTitle: q.sourceTitle,
      })),
    };

    // হিস্টোরি ও স্ট্যাটস আপডেট
    this.history.push(result);
    this._updateStats(result);

    return result;
  }

  // ============================================================
  // ৩.৫ বর্তমান প্রশ্ন
  // ============================================================
  getCurrentQuestion() {
    if (!this.session || this.session.status !== 'active') return null;
    return this.session.questions[this.session.currentIndex];
  }

  // ============================================================
  // ৩.৬ অগ্রগতি
  // ============================================================
  getProgress() {
    if (!this.session) return null;
    const total = this.session.questions.length;
    const answered = this.session.questions.filter((q) => q.answered).length;
    return {
      currentIndex: this.session.currentIndex,
      total,
      answered,
      remaining: total - answered,
      percent: Math.round((answered / total) * 100),
      correct: this.session.correct,
      wrong: this.session.wrong,
      skipped: this.session.skipped,
    };
  }

  // ============================================================
  // ৩.৭ ক্যাটাগরি তালিকা
  // ============================================================
  getCategories() {
    const categories = {
      all: {
        name: 'সব কুইজ',
        icon: '🎯',
        count: this.allQuizzes.length,
      },
      chapter: {
        name: 'অধ্যায়ভিত্তিক',
        icon: '📚',
        count: this.allQuizzes.filter((q) => q.chapterNo).length,
      },
      appendix: {
        name: 'অ্যাপেন্ডিক্স',
        icon: '📎',
        count: this.allQuizzes.filter((q) => q.appendixLetter).length,
      },
    };

    // প্রতিটি অধ্যায়ের আলাদা ক্যাটাগরি
    const chapterMap = {};
    this.allQuizzes.forEach((q) => {
      if (q.chapterNo) {
        if (!chapterMap[q.chapterNo]) {
          chapterMap[q.chapterNo] = {
            id: q.sourceId,
            name: `অধ্যায় ${q.chapterNo}: ${q.sourceTitle}`,
            icon: q.icon,
            count: 0,
          };
        }
        chapterMap[q.chapterNo].count++;
      }
    });

    return {
      main: categories,
      chapters: Object.values(chapterMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      total: this.allQuizzes.length,
    };
  }

  // ============================================================
  // ৩.৮ পরিসংখ্যান
  // ============================================================
  _loadStats() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('landQuizStats');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }
    return {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      bestPercentage: 0,
      lastSessionDate: null,
    };
  }

  _saveStats() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('landQuizStats', JSON.stringify(this.stats));
      }
    } catch (e) {
      // ignore
    }
  }

  _updateStats(result) {
    this.stats.totalSessions++;
    this.stats.totalQuestions += result.total;
    this.stats.totalCorrect += result.correct;
    this.stats.totalWrong += result.wrong;
    if (result.percentage > this.stats.bestPercentage) {
      this.stats.bestPercentage = result.percentage;
    }
    this.stats.lastSessionDate = new Date().toISOString();
    this._saveStats();
  }

  getStats() {
    return {
      ...this.stats,
      averagePercentage:
        this.stats.totalQuestions > 0
          ? Math.round(
              (this.stats.totalCorrect / this.stats.totalQuestions) * 100
            )
          : 0,
      totalAvailable: this.allQuizzes.length,
    };
  }

  resetStats() {
    this.stats = {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      bestPercentage: 0,
      lastSessionDate: null,
    };
    this._saveStats();
  }

  // ============================================================
  // ৩.৯ গ্রেড
  // ============================================================
  _getGrade(percentage) {
    if (percentage >= 90) return { grade: 'A+', label: 'অসাধারণ', color: '#10b981' };
    if (percentage >= 80) return { grade: 'A', label: 'খুব ভালো', color: '#22c55e' };
    if (percentage >= 70) return { grade: 'B', label: 'ভালো', color: '#3b82f6' };
    if (percentage >= 60) return { grade: 'C', label: 'মাঝারি', color: '#f59e0b' };
    if (percentage >= 40) return { grade: 'D', label: 'দুর্বল', color: '#f97316' };
    return { grade: 'F', label: 'ব্যর্থ', color: '#ef4444' };
  }

  // ============================================================
  // ৩.১০ শাফল (Fisher-Yates)
  // ============================================================
  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ============================================================
  // ৩.১১ সেশন রিসেট
  // ============================================================
  resetSession() {
    this.session = null;
  }
}

// ============================================================
// ৪. সিঙ্গেলটন এক্সপোর্ট
// ============================================================
const quizEngine = new QuizEngine();

export default quizEngine;

// নেমড এক্সপোর্ট
export const startQuiz = (opts) => quizEngine.startSession(opts);
export const answerQuestion = (idx, opt) => quizEngine.answer(idx, opt);
export const skipQuestion = (idx) => quizEngine.skip(idx);
export const finishQuiz = () => quizEngine.finishSession();
export const getCurrentQuiz = () => quizEngine.getCurrentQuestion();
export const getQuizProgress = () => quizEngine.getProgress();
export const getQuizCategories = () => quizEngine.getCategories();
export const getQuizStats = () => quizEngine.getStats();
export const resetQuizStats = () => quizEngine.resetStats();
export const resetCurrentQuiz = () => quizEngine.resetSession();