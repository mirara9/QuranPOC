// Audio Feature Extractor Worklet
// Processes audio in real-time to extract features for analysis

class FeatureExtractorProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Configuration from options
    this.bufferSize = options.processorOptions?.bufferSize || 2048;
    this.hopSize = options.processorOptions?.hopSize || 512;
    this.mfccCoefficients = options.processorOptions?.mfccCoefficients || 13;
    
    // Internal buffers
    this.inputBuffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.hopCounter = 0;
    
    // Feature extraction state
    this.sampleRate = sampleRate; // Global AudioWorklet property
    
    // Initialize window function (Hamming)
    this.window = new Float32Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      this.window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.bufferSize - 1));
    }
  }
  
  // Main processing function
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (!input || !input[0]) {
      return true;
    }
    
    const inputChannel = input[0];
    
    // Copy input to circular buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.inputBuffer[this.bufferIndex] = inputChannel[i];
      this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
      this.hopCounter++;
      
      // Process frame when hop size is reached
      if (this.hopCounter >= this.hopSize) {
        this.hopCounter = 0;
        this.processFrame();
      }
    }
    
    // Pass through audio
    const output = outputs[0];
    if (output && output[0]) {
      output[0].set(inputChannel);
    }
    
    return true;
  }
  
  // Process a single frame of audio
  processFrame() {
    // Reorder buffer to correct time sequence
    const frame = new Float32Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      const idx = (this.bufferIndex + i) % this.bufferSize;
      frame[i] = this.inputBuffer[idx] * this.window[i];
    }
    
    // Extract features
    const features = {
      energy: this.calculateEnergy(frame),
      zeroCrossingRate: this.calculateZeroCrossingRate(frame),
      spectralCentroid: this.calculateSpectralCentroid(frame),
      mfcc: this.calculateMFCC(frame),
      timestamp: currentTime, // Global AudioWorklet property
    };
    
    // Send features to main thread
    this.port.postMessage({
      type: 'features',
      data: features,
      timestamp: Date.now()
    });
  }
  
  // Calculate frame energy
  calculateEnergy(frame) {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i];
    }
    return Math.sqrt(sum / frame.length);
  }
  
  // Calculate zero crossing rate
  calculateZeroCrossingRate(frame) {
    let crossings = 0;
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / frame.length;
  }
  
  // Simple FFT implementation
  fft(frame) {
    const N = frame.length;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    
    // Copy input
    for (let i = 0; i < N; i++) {
      real[i] = frame[i];
      imag[i] = 0;
    }
    
    // Bit reversal
    let j = 0;
    for (let i = 0; i < N; i++) {
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
      let k = N >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }
    
    // FFT computation
    for (let size = 2; size <= N; size *= 2) {
      const halfSize = size / 2;
      const step = N / size;
      for (let i = 0; i < N; i += size) {
        for (let j = i, k = 0; j < i + halfSize; j++, k += step) {
          const tReal = real[j + halfSize] * Math.cos(2 * Math.PI * k / N) + 
                       imag[j + halfSize] * Math.sin(2 * Math.PI * k / N);
          const tImag = -real[j + halfSize] * Math.sin(2 * Math.PI * k / N) + 
                       imag[j + halfSize] * Math.cos(2 * Math.PI * k / N);
          real[j + halfSize] = real[j] - tReal;
          imag[j + halfSize] = imag[j] - tImag;
          real[j] += tReal;
          imag[j] += tImag;
        }
      }
    }
    
    // Calculate magnitude spectrum
    const spectrum = new Float32Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
      spectrum[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    
    return spectrum;
  }
  
  // Calculate spectral centroid
  calculateSpectralCentroid(frame) {
    const spectrum = this.fft(frame);
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * this.sampleRate) / (2 * spectrum.length);
      numerator += frequency * spectrum[i];
      denominator += spectrum[i];
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }
  
  // Simplified MFCC calculation
  calculateMFCC(frame) {
    const spectrum = this.fft(frame);
    const melFilters = this.createMelFilterBank(spectrum.length);
    const mfcc = new Float32Array(this.mfccCoefficients);
    
    // Apply mel filters
    const melEnergies = new Float32Array(26);
    for (let i = 0; i < 26; i++) {
      let energy = 0;
      for (let j = 0; j < spectrum.length; j++) {
        energy += spectrum[j] * melFilters[i][j];
      }
      melEnergies[i] = Math.log(Math.max(energy, 1e-10));
    }
    
    // DCT to get MFCCs
    for (let i = 0; i < this.mfccCoefficients; i++) {
      let sum = 0;
      for (let j = 0; j < 26; j++) {
        sum += melEnergies[j] * Math.cos(Math.PI * i * (j + 0.5) / 26);
      }
      mfcc[i] = sum;
    }
    
    return Array.from(mfcc);
  }
  
  // Create mel filter bank
  createMelFilterBank(spectrumLength) {
    const numFilters = 26;
    const filters = [];
    
    // Simplified mel filter bank
    for (let i = 0; i < numFilters; i++) {
      const filter = new Float32Array(spectrumLength);
      const center = (i + 1) * spectrumLength / (numFilters + 1);
      const width = spectrumLength / numFilters;
      
      for (let j = 0; j < spectrumLength; j++) {
        const distance = Math.abs(j - center);
        if (distance < width) {
          filter[j] = 1 - distance / width;
        }
      }
      
      filters.push(filter);
    }
    
    return filters;
  }
}

// Register the processor
registerProcessor('feature-extractor', FeatureExtractorProcessor);