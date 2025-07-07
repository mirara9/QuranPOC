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
      // Don't create AudioContext here - wait for user gesture
      console.log('AudioService initialized successfully (AudioContext will be created on first use)');
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
      
      // Get media stream first
      this.stream = await navigator.mediaDevices.getUserMedia(this.config.constraints);
      console.log('Microphone access granted, stream obtained');
      
      // Log audio track settings for debugging
      const audioTrack = this.stream.getAudioTracks()[0];
      let streamSampleRate = 44100; // default fallback
      
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log('Audio track settings:', settings);
        if (settings.sampleRate) {
          streamSampleRate = settings.sampleRate;
        }
      }
      
      // Create AudioContext - let browser choose optimal sample rate
      if (!this.audioContext) {
        console.log('Creating AudioContext without specifying sample rate');
        this.audioContext = new AudioContext({
          latencyHint: 'interactive'
        });
        
        console.log('AudioContext created with sample rate:', this.audioContext.sampleRate);
        console.log('Stream sample rate:', streamSampleRate);
        
        // Try to load AudioWorklet after AudioContext is created
        try {
          await this.loadAudioWorklet();
          console.log('AudioWorklet loaded successfully');
        } catch (workletError) {
          console.warn('AudioWorklet not available, will use fallback processing:', workletError);
        }
      }
      
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

      const mimeType = this.getSupportedMimeType();
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 128000
      };
      
      // Only add mimeType if it's not empty
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);

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

    console.log('Stopping recording...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Recording stop timeout - forcing cleanup');
        this.cleanup();
        reject(new Error('Recording stop timeout'));
      }, 5000);

      // Set up the stop handler before calling stop
      const handleStop = async () => {
        console.log('MediaRecorder stop event received');
        clearTimeout(timeout);
        
        // Remove the event listener to prevent multiple calls
        if (this.mediaRecorder) {
          this.mediaRecorder.onstop = null;
        }
        
        try {
          const recordingData = await this.handleRecordingComplete();
          resolve(recordingData);
        } catch (error) {
          console.error('Error handling recording completion:', error);
          this.cleanup();
          reject(error);
        }
      };

      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = handleStop;
      }

      // Stop the recording
      try {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          console.log('MediaRecorder.stop() called');
        } else {
          console.log('MediaRecorder state is:', this.mediaRecorder?.state);
          // If not recording, handle immediately
          handleStop();
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error('Error stopping MediaRecorder:', error);
        this.cleanup();
        reject(error);
      }

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
      'audio/mp4',
      'audio/mpeg',
      '' // Empty string as last resort
    ];

    for (const mimeType of mimeTypes) {
      if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Using MIME type:', mimeType || 'default');
        return mimeType;
      }
    }

    console.log('Using fallback MIME type: audio/webm');
    return 'audio/webm';
  }

  private generateId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setProcessingCallback(callback: AudioProcessingCallback): void {
    this.processingCallback = callback;
  }

  private cleanup(): void {
    console.log('Cleaning up audio resources...');
    
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log('Audio track stopped');
        });
        this.stream = null;
      }

      if (this.workletNode) {
        try {
          this.workletNode.disconnect();
          this.workletNode = null;
          console.log('AudioWorklet disconnected');
        } catch (e) {
          console.warn('Error disconnecting worklet:', e);
        }
      }

      if (this.analyzerNode) {
        try {
          this.analyzerNode.disconnect();
          this.analyzerNode = null;
          console.log('AnalyserNode disconnected');
        } catch (e) {
          console.warn('Error disconnecting analyzer:', e);
        }
      }

      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.ondataavailable = null;
        this.mediaRecorder = null;
        console.log('MediaRecorder cleaned up');
      }

      this.recordedChunks = [];
      this.isRecording = false;
      
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
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