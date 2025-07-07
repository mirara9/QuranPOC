import React from 'react';
import { WaveSurfer } from 'wavesurfer.js';
import { AudioFeatures, RecordingData } from './audio';
import { RecognitionResult } from './recognition';
import { TajweedAnalysisResult } from './tajweed';

export interface AudioRecorderProps {
  onRecordingComplete: (data: RecordingData) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  maxDuration?: number;
  className?: string;
}

export interface WaveformVisualizerProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  onReady?: (wavesurfer: WaveSurfer) => void;
  onProgress?: (progress: number) => void;
  onFinish?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  className?: string;
}

export interface RecitationPlayerProps {
  audioUrl: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  showWaveform?: boolean;
  showControls?: boolean;
  className?: string;
}

export interface TajweedFeedbackProps {
  analysisResult: TajweedAnalysisResult;
  onFeedbackClick?: (feedbackId: string) => void;
  showDetails?: boolean;
  highlightSeverity?: 'low' | 'medium' | 'high';
  className?: string;
}

export interface RecognitionResultsProps {
  results: RecognitionResult[];
  onResultSelect?: (result: RecognitionResult) => void;
  showComparison?: boolean;
  sortBy?: 'similarity' | 'confidence' | 'name';
  className?: string;
}

export interface AudioVisualizerProps {
  features: AudioFeatures;
  selectedFeature: 'mfcc' | 'energy' | 'pitch' | 'spectralCentroid';
  onFeatureChange?: (feature: string) => void;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export interface ProgressIndicatorProps {
  progress: number;
  status: 'recording' | 'processing' | 'analyzing' | 'complete' | 'error';
  statusText?: string;
  showPercentage?: boolean;
  className?: string;
}

export interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  canPlay: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  duration: number;
  currentTime: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export interface VerseSelectorProps {
  selectedSurah: number;
  selectedAyah: number;
  onSurahChange: (surah: number) => void;
  onAyahChange: (ayah: number) => void;
  surahList: SurahInfo[];
  className?: string;
}

export interface SurahInfo {
  number: number;
  name: string;
  arabicName: string;
  ayahCount: number;
  revelationType: 'meccan' | 'medinan';
}

export interface ComparisonViewProps {
  originalRecording: RecordingData;
  templateRecording: RecordingData;
  recognitionResult: RecognitionResult;
  onSegmentClick?: (segmentIndex: number) => void;
  showAlignment?: boolean;
  syncPlayback?: boolean;
  className?: string;
}

export interface SettingsProps {
  audioConfig: AudioServiceConfig;
  recognitionConfig: RecognitionConfig;
  tajweedConfig: TajweedConfig;
  onAudioConfigChange: (config: Partial<AudioServiceConfig>) => void;
  onRecognitionConfigChange: (config: Partial<RecognitionConfig>) => void;
  onTajweedConfigChange: (config: Partial<TajweedConfig>) => void;
  onReset: () => void;
  className?: string;
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  className?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}