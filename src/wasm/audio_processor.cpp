#include <vector>
#include <cmath>
#include <algorithm>
#include <complex>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

const double PI = 3.14159265358979323846;

class AudioProcessor {
private:
    std::vector<double> hammingWindow(int size) {
        std::vector<double> window(size);
        for (int i = 0; i < size; i++) {
            window[i] = 0.54 - 0.46 * std::cos(2.0 * PI * i / (size - 1));
        }
        return window;
    }
    
    std::vector<double> hannWindow(int size) {
        std::vector<double> window(size);
        for (int i = 0; i < size; i++) {
            window[i] = 0.5 * (1.0 - std::cos(2.0 * PI * i / (size - 1)));
        }
        return window;
    }
    
    std::vector<std::complex<double>> fft(const std::vector<double>& input) {
        int n = input.size();
        std::vector<std::complex<double>> output(n);
        
        // Simple DFT implementation (not optimized)
        for (int k = 0; k < n; k++) {
            std::complex<double> sum = 0.0;
            for (int j = 0; j < n; j++) {
                double angle = -2.0 * PI * k * j / n;
                sum += input[j] * std::complex<double>(std::cos(angle), std::sin(angle));
            }
            output[k] = sum;
        }
        
        return output;
    }
    
    std::vector<double> getMagnitudeSpectrum(const std::vector<std::complex<double>>& fft_result) {
        std::vector<double> magnitude(fft_result.size() / 2);
        for (size_t i = 0; i < magnitude.size(); i++) {
            magnitude[i] = std::abs(fft_result[i]);
        }
        return magnitude;
    }
    
    double hzToMel(double hz) {
        return 2595.0 * std::log10(1.0 + hz / 700.0);
    }
    
    double melToHz(double mel) {
        return 700.0 * (std::pow(10.0, mel / 2595.0) - 1.0);
    }
    
    std::vector<std::vector<double>> createMelFilterBank(int nFilters, int nFFT, double sampleRate) {
        double nyquist = sampleRate / 2.0;
        double melMin = hzToMel(0);
        double melMax = hzToMel(nyquist);
        
        std::vector<double> melPoints(nFilters + 2);
        for (int i = 0; i < nFilters + 2; i++) {
            melPoints[i] = melMin + (melMax - melMin) * i / (nFilters + 1);
        }
        
        std::vector<double> hzPoints(nFilters + 2);
        for (int i = 0; i < nFilters + 2; i++) {
            hzPoints[i] = melToHz(melPoints[i]);
        }
        
        std::vector<int> binPoints(nFilters + 2);
        for (int i = 0; i < nFilters + 2; i++) {
            binPoints[i] = static_cast<int>(hzPoints[i] * nFFT / sampleRate);
        }
        
        std::vector<std::vector<double>> filterBank(nFilters, std::vector<double>(nFFT / 2, 0.0));
        
        for (int i = 1; i <= nFilters; i++) {
            for (int j = binPoints[i - 1]; j < binPoints[i]; j++) {
                if (j < nFFT / 2) {
                    filterBank[i - 1][j] = static_cast<double>(j - binPoints[i - 1]) / 
                                          (binPoints[i] - binPoints[i - 1]);
                }
            }
            
            for (int j = binPoints[i]; j < binPoints[i + 1]; j++) {
                if (j < nFFT / 2) {
                    filterBank[i - 1][j] = static_cast<double>(binPoints[i + 1] - j) / 
                                          (binPoints[i + 1] - binPoints[i]);
                }
            }
        }
        
        return filterBank;
    }
    
    std::vector<double> dct(const std::vector<double>& input) {
        int n = input.size();
        std::vector<double> output(n);
        
        for (int k = 0; k < n; k++) {
            double sum = 0.0;
            for (int j = 0; j < n; j++) {
                sum += input[j] * std::cos(PI * k * (j + 0.5) / n);
            }
            output[k] = sum;
        }
        
        return output;
    }
    
public:
    std::vector<double> extractMFCC(const std::vector<double>& audioFrame, 
                                   double sampleRate, int nCoeffs = 13) {
        int frameSize = audioFrame.size();
        
        // Apply window
        std::vector<double> window = hammingWindow(frameSize);
        std::vector<double> windowedFrame(frameSize);
        for (int i = 0; i < frameSize; i++) {
            windowedFrame[i] = audioFrame[i] * window[i];
        }
        
        // FFT
        std::vector<std::complex<double>> fftResult = fft(windowedFrame);
        std::vector<double> spectrum = getMagnitudeSpectrum(fftResult);
        
        // Mel filter bank
        int nFilters = 26;
        std::vector<std::vector<double>> filterBank = createMelFilterBank(nFilters, frameSize, sampleRate);
        
        // Apply filters
        std::vector<double> filterEnergies(nFilters);
        for (int i = 0; i < nFilters; i++) {
            double energy = 0.0;
            for (size_t j = 0; j < spectrum.size(); j++) {
                energy += spectrum[j] * filterBank[i][j];
            }
            filterEnergies[i] = std::log(std::max(energy, 1e-10));
        }
        
        // DCT
        std::vector<double> mfcc = dct(filterEnergies);
        
        // Return first n coefficients
        std::vector<double> result(nCoeffs);
        for (int i = 0; i < nCoeffs && i < static_cast<int>(mfcc.size()); i++) {
            result[i] = mfcc[i];
        }
        
        return result;
    }
    
    double calculateEnergy(const std::vector<double>& audioFrame) {
        double sum = 0.0;
        for (double sample : audioFrame) {
            sum += sample * sample;
        }
        return std::sqrt(sum / audioFrame.size());
    }
    
    double calculateZeroCrossingRate(const std::vector<double>& audioFrame) {
        int crossings = 0;
        for (size_t i = 1; i < audioFrame.size(); i++) {
            if ((audioFrame[i] >= 0) != (audioFrame[i - 1] >= 0)) {
                crossings++;
            }
        }
        return static_cast<double>(crossings) / audioFrame.size();
    }
    
    double calculateSpectralCentroid(const std::vector<double>& audioFrame, double sampleRate) {
        std::vector<std::complex<double>> fftResult = fft(audioFrame);
        std::vector<double> spectrum = getMagnitudeSpectrum(fftResult);
        
        double numerator = 0.0;
        double denominator = 0.0;
        
        for (size_t i = 0; i < spectrum.size(); i++) {
            double frequency = i * sampleRate / (2.0 * spectrum.size());
            numerator += frequency * spectrum[i];
            denominator += spectrum[i];
        }
        
        return denominator > 0 ? numerator / denominator : 0.0;
    }
    
    double estimatePitch(const std::vector<double>& audioFrame, double sampleRate) {
        // Autocorrelation-based pitch estimation
        int frameSize = audioFrame.size();
        std::vector<double> autocorr(frameSize);
        
        for (int lag = 0; lag < frameSize; lag++) {
            double sum = 0.0;
            for (int i = 0; i < frameSize - lag; i++) {
                sum += audioFrame[i] * audioFrame[i + lag];
            }
            autocorr[lag] = sum;
        }
        
        // Find peak in autocorrelation (excluding lag 0)
        int minPeriod = static_cast<int>(sampleRate / 800.0); // 800 Hz max
        int maxPeriod = static_cast<int>(sampleRate / 80.0);  // 80 Hz min
        
        double maxCorr = 0.0;
        int bestPeriod = 0;
        
        for (int period = minPeriod; period <= maxPeriod && period < frameSize; period++) {
            if (autocorr[period] > maxCorr) {
                maxCorr = autocorr[period];
                bestPeriod = period;
            }
        }
        
        return bestPeriod > 0 ? sampleRate / bestPeriod : 0.0;
    }
    
    std::vector<std::vector<double>> processAudioFrames(const std::vector<double>& audioData,
                                                       double sampleRate, int frameSize, int hopSize) {
        std::vector<std::vector<double>> features;
        
        for (int i = 0; i <= static_cast<int>(audioData.size()) - frameSize; i += hopSize) {
            std::vector<double> frame(frameSize);
            for (int j = 0; j < frameSize; j++) {
                frame[j] = audioData[i + j];
            }
            
            // Extract features for this frame
            std::vector<double> mfcc = extractMFCC(frame, sampleRate);
            double energy = calculateEnergy(frame);
            double zcr = calculateZeroCrossingRate(frame);
            double spectralCentroid = calculateSpectralCentroid(frame, sampleRate);
            double pitch = estimatePitch(frame, sampleRate);
            
            // Combine features
            std::vector<double> frameFeatures;
            frameFeatures.insert(frameFeatures.end(), mfcc.begin(), mfcc.end());
            frameFeatures.push_back(energy);
            frameFeatures.push_back(zcr);
            frameFeatures.push_back(spectralCentroid);
            frameFeatures.push_back(pitch);
            
            features.push_back(frameFeatures);
        }
        
        return features;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(audio_processor_module) {
    register_vector<double>("VectorDouble");
    register_vector<std::vector<double>>("VectorVectorDouble");
    
    class_<AudioProcessor>("AudioProcessor")
        .constructor<>()
        .function("extractMFCC", &AudioProcessor::extractMFCC)
        .function("calculateEnergy", &AudioProcessor::calculateEnergy)
        .function("calculateZeroCrossingRate", &AudioProcessor::calculateZeroCrossingRate)
        .function("calculateSpectralCentroid", &AudioProcessor::calculateSpectralCentroid)
        .function("estimatePitch", &AudioProcessor::estimatePitch)
        .function("processAudioFrames", &AudioProcessor::processAudioFrames);
}

// C-style API
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    double* process_audio_features(double* audio_data, int data_len, 
                                  double sample_rate, int frame_size) {
        AudioProcessor processor;
        
        std::vector<double> audioVec(audio_data, audio_data + data_len);
        int hopSize = frame_size / 2;
        
        auto features = processor.processAudioFrames(audioVec, sample_rate, frame_size, hopSize);
        
        // Flatten features array
        int totalFeatures = features.size() * (features.empty() ? 0 : features[0].size());
        double* result = (double*)malloc(totalFeatures * sizeof(double));
        
        int idx = 0;
        for (const auto& frame : features) {
            for (double feature : frame) {
                result[idx++] = feature;
            }
        }
        
        return result;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double* extract_mfcc(double* spectrum, int spectrum_len, 
                        double sample_rate, int num_coeffs) {
        AudioProcessor processor;
        
        std::vector<double> audioFrame(spectrum, spectrum + spectrum_len);
        auto mfcc = processor.extractMFCC(audioFrame, sample_rate, num_coeffs);
        
        double* result = (double*)malloc(mfcc.size() * sizeof(double));
        for (size_t i = 0; i < mfcc.size(); i++) {
            result[i] = mfcc[i];
        }
        
        return result;
    }
}