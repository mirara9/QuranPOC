export interface DTWResult {
  distance: number;
  path: Array<[number, number]>;
  normalizedDistance: number;
  alignment: AlignmentPoint[];
}

export interface AlignmentPoint {
  templateIndex: number;
  recordingIndex: number;
  cost: number;
  timestamp: number;
}

export interface HMMState {
  id: string;
  name: string;
  emissionProbabilities: Map<string, number>;
  transitionProbabilities: Map<string, number>;
}

export interface HMMModel {
  states: HMMState[];
  observations: string[];
  initialProbabilities: Map<string, number>;
}

export interface ViterbiResult {
  path: string[];
  probability: number;
  stateSequence: HMMState[];
}

export interface RecognitionTemplate {
  id: string;
  name: string;
  features: AudioFeatures;
  phonemeSequence: string[];
  metadata: {
    duration: number;
    speaker: string;
    quality: number;
    createdAt: Date;
  };
}

export interface RecognitionResult {
  templateId: string;
  templateName: string;
  similarity: number;
  dtw: DTWResult;
  hmm?: ViterbiResult;
  segments: RecognitionSegment[];
  overallScore: number;
  confidence: number;
}

export interface RecognitionSegment {
  startTime: number;
  endTime: number;
  templateMatch: string;
  recordingPhoneme: string;
  similarity: number;
  feedback?: string;
}

export interface RecognitionConfig {
  enableDTW: boolean;
  enableHMM: boolean;
  dtwWeight: number;
  hmmWeight: number;
  similarityThreshold: number;
  segmentationThreshold: number;
  maxTemplateDistance: number;
}

export interface RecognitionServiceInterface {
  initialize(): Promise<void>;
  loadTemplate(templateId: string): Promise<RecognitionTemplate>;
  compareRecording(recording: RecordingData, templateId: string): Promise<RecognitionResult>;
  trainHMM(trainingData: RecordingData[]): Promise<HMMModel>;
  updateConfig(config: Partial<RecognitionConfig>): void;
}