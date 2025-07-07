import { RecordingData } from './audio';

export interface TajweedRule {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  category: TajweedCategory;
  conditions: TajweedCondition[];
  examples: string[];
  priority: number;
}

export enum TajweedCategory {
  MEDD = 'medd',
  GHUNNAH = 'ghunnah',
  QALQALAH = 'qalqalah',
  IDGHAAM = 'idghaam',
  IKHFA = 'ikhfa',
  IZHAR = 'izhar',
  IQLAB = 'iqlab',
  TAFKHEEM = 'tafkheem',
  TARQEEQ = 'tarqeeq'
}

export interface TajweedCondition {
  type: 'duration' | 'frequency' | 'energy' | 'phoneme' | 'position';
  operator: 'greater' | 'less' | 'equal' | 'between' | 'matches';
  value: number | string | [number, number];
  tolerance?: number;
}

export interface TajweedFeedback {
  ruleId: string;
  ruleName: string;
  position: {
    startTime: number;
    endTime: number;
    word?: string;
    phoneme?: string;
  };
  status: 'correct' | 'incorrect' | 'partially_correct';
  actualValue: number | string;
  expectedValue: number | string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  arabicText?: string;
}

export interface TajweedAnalysisResult {
  overallScore: number;
  feedback: TajweedFeedback[];
  rulesSummary: {
    [key in TajweedCategory]: {
      total: number;
      correct: number;
      incorrect: number;
      score: number;
    };
  };
  detailedAnalysis: {
    meddRules: MeddAnalysis[];
    ghunnahRules: GhunnahAnalysis[];
    qalqalahRules: QalqalahAnalysis[];
  };
}

export interface MeddAnalysis {
  type: 'medd_tabi' | 'medd_munfasil' | 'medd_muttasil' | 'medd_lazim';
  expectedDuration: number;
  actualDuration: number;
  position: { startTime: number; endTime: number };
  isCorrect: boolean;
  feedback: string;
}

export interface GhunnahAnalysis {
  letter: string;
  position: { startTime: number; endTime: number };
  nasalization: number;
  expectedNasalization: number;
  isCorrect: boolean;
  feedback: string;
}

export interface QalqalahAnalysis {
  letter: string;
  position: { startTime: number; endTime: number };
  echoIntensity: number;
  expectedIntensity: number;
  isCorrect: boolean;
  feedback: string;
}

export interface TajweedConfig {
  strictMode: boolean;
  toleranceLevel: 'beginner' | 'intermediate' | 'advanced';
  enabledRules: TajweedCategory[];
  customThresholds: Map<string, number>;
  feedbackLanguage: 'arabic' | 'english' | 'both';
}

export interface TajweedServiceInterface {
  initialize(): Promise<void>;
  analyzeRecitation(recording: RecordingData, verseText: string): Promise<TajweedAnalysisResult>;
  getRuleDefinition(ruleId: string): Promise<TajweedRule>;
  updateConfig(config: Partial<TajweedConfig>): void;
  exportAnalysis(result: TajweedAnalysisResult): Promise<string>;
}