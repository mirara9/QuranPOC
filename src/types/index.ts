export * from './audio';
export * from './recognition';
export * from './tajweed';
export * from './components';

import { 
  RecordingData, 
  AudioServiceConfig, 
  AudioServiceInterface 
} from './audio';
import { 
  RecognitionTemplate, 
  RecognitionResult, 
  RecognitionConfig, 
  RecognitionServiceInterface 
} from './recognition';
import { 
  TajweedAnalysisResult, 
  TajweedConfig, 
  TajweedServiceInterface 
} from './tajweed';

export interface AppState {
  isRecording: boolean;
  isProcessing: boolean;
  currentRecording?: RecordingData;
  selectedTemplate?: RecognitionTemplate;
  analysisResults?: TajweedAnalysisResult;
  recognitionResults?: RecognitionResult[];
  error?: string;
  settings: {
    audio: AudioServiceConfig;
    recognition: RecognitionConfig;
    tajweed: TajweedConfig;
  };
}

export interface AppActions {
  startRecording: () => void;
  stopRecording: () => void;
  processRecording: (data: RecordingData) => void;
  selectTemplate: (templateId: string) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  clearError: () => void;
  reset: () => void;
}

export type AppStore = AppState & AppActions;

export interface ServiceInstances {
  audioService: AudioServiceInterface;
  recognitionService: RecognitionServiceInterface;
  tajweedService: TajweedServiceInterface;
}

export interface GlobalConfig {
  apiBaseUrl: string;
  wasmPath: string;
  templatesPath: string;
  workletPath: string;
  enablePWA: boolean;
  enableAnalytics: boolean;
  enableOfflineMode: boolean;
  debugMode: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
}