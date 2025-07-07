import { AudioFeatures, AudioProcessingOptions } from '../types/audio';

export async function extractFeatures(
  audioBuffer: AudioBuffer,
  options: AudioProcessingOptions = {}
): Promise<AudioFeatures> {
  const {
    hopSize = 512,
    windowSize = 2048,
    mfccCoefficients = 13,
    preEmphasis = 0.97
  } = options;

  const audioData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  const frames = createFrames(audioData, windowSize, hopSize);
  const windowedFrames = frames.map(frame => applyWindow(frame, 'hamming'));
  
  const features: AudioFeatures = {
    mfcc: [],
    energy: [],
    pitch: [],
    spectralCentroid: [],
    spectralRolloff: [],
    zeroCrossingRate: [],
    durations: [],
    timestamps: []
  };

  for (let i = 0; i < windowedFrames.length; i++) {
    const frame = windowedFrames[i];
    const timestamp = (i * hopSize) / sampleRate;
    
    features.timestamps.push(timestamp);
    features.energy.push(calculateEnergy(frame));
    features.zeroCrossingRate.push(calculateZeroCrossingRate(frame));
    features.pitch.push(estimatePitch(frame, sampleRate));
    
    const spectrum = fft(frame);
    features.spectralCentroid.push(calculateSpectralCentroid(spectrum, sampleRate));
    features.spectralRolloff.push(calculateSpectralRolloff(spectrum, sampleRate));
    
    const mfcc = calculateMFCC(spectrum, sampleRate, mfccCoefficients);
    features.mfcc.push(mfcc);
  }

  features.durations = features.timestamps.map((_, i) => 
    i < features.timestamps.length - 1 
      ? features.timestamps[i + 1] - features.timestamps[i]
      : hopSize / sampleRate
  );

  return features;
}

function createFrames(audioData: Float32Array, windowSize: number, hopSize: number): Float32Array[] {
  const frames: Float32Array[] = [];
  
  for (let i = 0; i <= audioData.length - windowSize; i += hopSize) {
    const frame = new Float32Array(windowSize);
    for (let j = 0; j < windowSize; j++) {
      frame[j] = audioData[i + j];
    }
    frames.push(frame);
  }
  
  return frames;
}

function applyWindow(frame: Float32Array, windowType: string): Float32Array {
  const windowed = new Float32Array(frame.length);
  const N = frame.length;
  
  for (let i = 0; i < N; i++) {
    let windowValue = 1;
    
    switch (windowType) {
      case 'hamming':
        windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
        break;
      case 'hann':
        windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        break;
      case 'blackman':
        windowValue = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 
                     0.08 * Math.cos(4 * Math.PI * i / (N - 1));
        break;
    }
    
    windowed[i] = frame[i] * windowValue;
  }
  
  return windowed;
}

function calculateEnergy(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    sum += frame[i] * frame[i];
  }
  return Math.sqrt(sum / frame.length);
}

function calculateZeroCrossingRate(frame: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < frame.length; i++) {
    if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / frame.length;
}

function estimatePitch(frame: Float32Array, sampleRate: number): number {
  const autocorrelation = calculateAutocorrelation(frame);
  const minPeriod = Math.floor(sampleRate / 800);
  const maxPeriod = Math.floor(sampleRate / 80);
  
  let maxCorr = 0;
  let bestPeriod = 0;
  
  for (let period = minPeriod; period <= maxPeriod; period++) {
    if (period < autocorrelation.length && autocorrelation[period] > maxCorr) {
      maxCorr = autocorrelation[period];
      bestPeriod = period;
    }
  }
  
  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
}

function calculateAutocorrelation(frame: Float32Array): Float32Array {
  const N = frame.length;
  const autocorr = new Float32Array(N);
  
  for (let lag = 0; lag < N; lag++) {
    let sum = 0;
    for (let i = 0; i < N - lag; i++) {
      sum += frame[i] * frame[i + lag];
    }
    autocorr[lag] = sum;
  }
  
  return autocorr;
}

function fft(frame: Float32Array): Float32Array {
  const N = frame.length;
  const spectrum = new Float32Array(N / 2);
  
  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      real += frame[n] * Math.cos(angle);
      imag += frame[n] * Math.sin(angle);
    }
    
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }
  
  return spectrum;
}

function calculateSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < spectrum.length; i++) {
    const frequency = (i * sampleRate) / (2 * spectrum.length);
    numerator += frequency * spectrum[i];
    denominator += spectrum[i];
  }
  
  return denominator > 0 ? numerator / denominator : 0;
}

function calculateSpectralRolloff(spectrum: Float32Array, sampleRate: number, rolloffPercent: number = 0.85): number {
  const totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
  const rolloffEnergy = totalEnergy * rolloffPercent;
  
  let cumulativeEnergy = 0;
  for (let i = 0; i < spectrum.length; i++) {
    cumulativeEnergy += spectrum[i];
    if (cumulativeEnergy >= rolloffEnergy) {
      return (i * sampleRate) / (2 * spectrum.length);
    }
  }
  
  return (spectrum.length * sampleRate) / (2 * spectrum.length);
}

function calculateMFCC(spectrum: Float32Array, sampleRate: number, numCoefficients: number): number[] {
  const numFilters = 26;
  const melFilters = createMelFilterBank(spectrum.length, sampleRate, numFilters);
  
  const filterEnergies = new Float32Array(numFilters);
  for (let i = 0; i < numFilters; i++) {
    let energy = 0;
    for (let j = 0; j < spectrum.length; j++) {
      energy += spectrum[j] * melFilters[i][j];
    }
    filterEnergies[i] = Math.log(Math.max(energy, 1e-10));
  }
  
  const mfcc = dct(filterEnergies);
  return Array.from(mfcc.slice(0, numCoefficients));
}

function createMelFilterBank(spectrumLength: number, sampleRate: number, numFilters: number): number[][] {
  const melFilters: number[][] = [];
  const nyquist = sampleRate / 2;
  
  const melMin = hzToMel(0);
  const melMax = hzToMel(nyquist);
  const melPoints = Array.from({ length: numFilters + 2 }, (_, i) => 
    melMin + (melMax - melMin) * i / (numFilters + 1)
  );
  
  const hzPoints = melPoints.map(melToHz);
  const binPoints = hzPoints.map(hz => Math.floor(hz * spectrumLength / nyquist));
  
  for (let i = 1; i <= numFilters; i++) {
    const filter = new Array(spectrumLength).fill(0);
    
    for (let j = binPoints[i - 1]; j < binPoints[i]; j++) {
      if (j < spectrumLength) {
        filter[j] = (j - binPoints[i - 1]) / (binPoints[i] - binPoints[i - 1]);
      }
    }
    
    for (let j = binPoints[i]; j < binPoints[i + 1]; j++) {
      if (j < spectrumLength) {
        filter[j] = (binPoints[i + 1] - j) / (binPoints[i + 1] - binPoints[i]);
      }
    }
    
    melFilters.push(filter);
  }
  
  return melFilters;
}

function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1);
}

function dct(input: Float32Array): Float32Array {
  const N = input.length;
  const output = new Float32Array(N);
  
  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += input[n] * Math.cos(Math.PI * k * (n + 0.5) / N);
    }
    output[k] = sum;
  }
  
  return output;
}