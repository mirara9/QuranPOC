import { 
  AudioServiceInterface, 
  AudioServiceConfig, 
  RecordingData, 
  AudioFeatures, 
  AudioProcessingCallback,
  AudioWorkletMessage
} from '../types/audio';
import { extractFeatures } from '../utils/audioFeatures';

export class AudioService implements AudioServiceInterface {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private processingCallback: AudioProcessingCallback | null = null;
  private config: AudioServiceConfig;

  constructor(config: AudioServiceConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext({
        sampleRate: this.config.processingOptions.sampleRate || 44100,
        latencyHint: 'interactive'
      });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Try to load AudioWorklet, but don't fail if it doesn't work
      try {
        await this.loadAudioWorklet();
        console.log('AudioWorklet loaded successfully');
      } catch (workletError) {
        console.warn('AudioWorklet not available, will use fallback processing:', workletError);
      }
      
      console.log('AudioService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioService:', error);
      throw new Error(`AudioService initialization failed: ${error}`);
    }
  }

  private async loadAudioWorklet(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      await this.audioContext.audioWorklet.addModule('/worklets/feature-extractor.js');
      console.log('AudioWorklet loaded successfully');
    } catch (error) {
      console.warn('AudioWorklet not available, falling back to ScriptProcessorNode');
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      console.log('Requesting microphone access with constraints:', this.config.constraints);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }
      
      this.stream = await navigator.mediaDevices.getUserMedia(this.config.constraints);
      console.log('Microphone access granted, stream obtained');
      
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('AudioContext resumed');
      }

      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.analyzerNode.smoothingTimeConstant = 0.8;
      
      source.connect(this.analyzerNode);

      if (this.config.enableRealTimeProcessing) {
        await this.setupRealTimeProcessing(source);
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000
      });

      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingComplete();
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  async stopRecording(): Promise<RecordingData> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Recording stop timeout'));
      }, 5000);

      this.mediaRecorder!.onstop = async () => {
        clearTimeout(timeout);
        try {
          const recordingData = await this.handleRecordingComplete();
          resolve(recordingData);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder!.stop();
      this.isRecording = false;
    });
  }

  private async setupRealTimeProcessing(source: MediaStreamAudioSourceNode): Promise<void> {
    if (!this.audioContext) return;

    try {
      this.workletNode = new AudioWorkletNode(this.audioContext, 'feature-extractor', {
        processorOptions: {
          bufferSize: this.config.processingOptions.bufferSize || 2048,
          hopSize: this.config.processingOptions.hopSize || 512,
          mfccCoefficients: this.config.processingOptions.mfccCoefficients || 13
        }
      });

      this.workletNode.port.onmessage = (event) => {
        if (this.processingCallback) {
          this.processingCallback(event.data as AudioWorkletMessage);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
      
      console.log('Real-time processing enabled');
    } catch (error) {
      console.warn('AudioWorklet not available, using fallback processing');
      this.setupFallbackProcessing(source);
    }
  }

  private setupFallbackProcessing(source: MediaStreamAudioSourceNode): void {
    if (!this.audioContext) return;

    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    processor.onaudioprocess = (event) => {
      if (!this.processingCallback) return;
      
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      
      const features = this.extractBasicFeatures(inputData);
      
      const message: AudioWorkletMessage = {
        type: 'features',
        data: features,
        timestamp: Date.now()
      };
      
      this.processingCallback(message);
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  private extractBasicFeatures(audioData: Float32Array): AudioFeatures {
    const energy = this.calculateEnergy(audioData);
    const zeroCrossings = this.calculateZeroCrossings(audioData);
    
    return {
      mfcc: [],
      energy: [energy],
      pitch: [],
      spectralCentroid: [],
      spectralRolloff: [],
      zeroCrossingRate: [zeroCrossings],
      durations: [],
      timestamps: [Date.now()]
    };
  }

  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  private calculateZeroCrossings(audioData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / audioData.length;
  }

  private async handleRecordingComplete(): Promise<RecordingData> {
    try {
      const audioBlob = new Blob(this.recordedChunks, { 
        type: this.getSupportedMimeType() 
      });
      
      const audioBuffer = await this.blobToAudioBuffer(audioBlob);
      const features = await this.processAudioBuffer(audioBuffer);
      
      const recordingData: RecordingData = {
        id: this.generateId(),
        audioBuffer,
        features,
        segments: [],
        metadata: {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          bitDepth: 16,
          recordedAt: new Date()
        }
      };

      this.cleanup();
      return recordingData;
    } catch (error) {
      console.error('Failed to process recording:', error);
      this.cleanup();
      throw new Error(`Failed to process recording: ${error}`);
    }
  }

  async processAudioBuffer(buffer: AudioBuffer): Promise<AudioFeatures> {
    try {
      return await extractFeatures(buffer, this.config.processingOptions);
    } catch (error) {
      console.error('Failed to extract features:', error);
      throw new Error(`Feature extraction failed: ${error}`);
    }
  }

  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const arrayBuffer = await blob.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
      'audio/mp4'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'audio/webm';
  }

  private generateId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setProcessingCallback(callback: AudioProcessingCallback): void {
    this.processingCallback = callback;
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.analyzerNode) {
      this.analyzerNode.disconnect();
      this.analyzerNode = null;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  destroy(): void {
    this.cleanup();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.processingCallback = null;
  }
}