export interface QuranWord {
  id: string;
  position: number;
  arabicText: string;
  transliteration: string;
  translation: string;
  // DTW/HMM specific fields for enhanced analysis
  expectedTiming?: number;
  phonemes?: string[];
  targetFrequency?: number;
  isHighlighted?: boolean;
  matchScore?: number;
}

export interface QuranVerse {
  id: string;
  surahNumber: number;
  verseNumber: number;
  arabicText: string;
  transliteration: string;
  translation: string;
  words: QuranWord[];
  audioUrl?: string;
  metadata: {
    surahName: string;
    verseCount: number;
    revelationType: 'meccan' | 'medinan';
    juzNumber: number;
    hizbNumber: number;
    rukulNumber: number;
  };
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: 'meccan' | 'medinan';
  verses: QuranVerse[];
}

export interface RecitationAnalysis {
  verseId: string;
  overallScore: number;
  timingAccuracy: number;
  phonemeAccuracy: number;
  tajweedCompliance: number;
  wordAnalysis: WordAnalysis[];
  recommendations: string[];
  detectedErrors: TajweedError[];
}

export interface WordAnalysis {
  wordId: string;
  alignmentScore: number;
  timingDeviation: number;
  phonemeMatches: number;
  phonemeTotal: number;
  confidence: number;
  suggestions: string[];
}

export interface TajweedError {
  type: 'pronunciation' | 'timing' | 'elongation' | 'nasalization' | 'emphasis';
  severity: 'minor' | 'moderate' | 'major';
  wordId: string;
  description: string;
  correction: string;
  audioExample?: string;
}

export interface DTWAnalysisResult {
  alignmentScore: number;
  timingAccuracy: number;
  phonemeAccuracy: number;
  detectedPhonemes: string[];
  confidenceScores: number[];
  warping: {
    referencePath: number[];
    queryPath: number[];
    distance: number;
  };
  recommendedImprovements: {
    timing: string[];
    pronunciation: string[];
    tajweed: string[];
  };
}

export interface RecitationSession {
  id: string;
  verseId: string;
  startTime: Date;
  endTime?: Date;
  attempts: RecitationAttempt[];
  bestScore: number;
  totalAttempts: number;
  improvements: string[];
}

export interface RecitationAttempt {
  id: string;
  timestamp: Date;
  duration: number;
  analysis: RecitationAnalysis;
  audioData: Blob;
  userFeedback?: UserFeedback;
}

export interface UserFeedback {
  difficulty: 'easy' | 'medium' | 'hard';
  clarity: number; // 1-5 rating
  helpfulness: number; // 1-5 rating
  comments?: string;
}

export interface QuranDisplaySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajweedColors: boolean;
  language: 'en' | 'ar' | 'ur' | 'id' | 'tr';
  theme: 'light' | 'dark' | 'auto';
  autoScroll: boolean;
  highlightDuration: number; // milliseconds
}

export interface TajweedRule {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  color: string;
  pattern: RegExp;
  examples: string[];
  audioExamples: string[];
}

export interface QuranSelection {
  startSurah: number;
  startVerse: number;
  endSurah: number;
  endVerse: number;
  selectionType: 'verse' | 'surah' | 'juz' | 'hizb' | 'custom';
}