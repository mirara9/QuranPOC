export interface AudioFeatures {
  mfcc: number[][];
  energy: number[];
  pitch: number[];
  spectralCentroid: number[];
  spectralRolloff: number[];
  zeroCrossingRate: number[];
  durations: number[];
  timestamps: number[];
}

export interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  features: AudioFeatures;
  phoneme?: string;
  confidence?: number;
}

export interface RecordingData {
  id: string;
  audioBuffer: AudioBuffer;
  features: AudioFeatures;
  segments: AudioSegment[];
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
    bitDepth: number;
    recordedAt: Date;
  };
}

export interface AudioProcessingOptions {
  sampleRate?: number;
  bufferSize?: number;
  hopSize?: number;
  windowSize?: number;
  mfccCoefficients?: number;
  preEmphasis?: number;
  windowType?: 'hamming' | 'hann' | 'blackman';
}

export interface AudioServiceConfig {
  constraints: MediaStreamConstraints;
  processingOptions: AudioProcessingOptions;
  enableRealTimeProcessing: boolean;
  outputFormat: 'wav' | 'mp3' | 'ogg';
}

export interface AudioWorkletMessage {
  type: 'features' | 'segment' | 'error';
  data: AudioFeatures | AudioSegment | string;
  timestamp: number;
}

export type AudioProcessingCallback = (message: AudioWorkletMessage) => void;

export interface AudioServiceInterface {
  initialize(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<RecordingData>;
  processAudioBuffer(buffer: AudioBuffer): Promise<AudioFeatures>;
  setProcessingCallback(callback: AudioProcessingCallback): void;
  destroy(): void;
}