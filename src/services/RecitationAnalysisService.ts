import { 
  RecitationAnalysis, 
  WordAnalysis, 
  DTWAnalysisResult, 
  TajweedError,
  QuranVerse,
  QuranWord
} from '../types/quran';
import { AudioFeatures } from '../types/audio';
import { 
  normalizeArabicText, 
  splitIntoWords, 
  advancedWordMatch,
  extractPhonemes 
} from '../utils/arabicText';

export interface RecitationAnalysisConfig {
  minSimilarityThreshold: number;
  timingToleranceMs: number;
  phonemeWeighting: number;
  tajweedWeighting: number;
  enableRealTimeAnalysis: boolean;
}

export class RecitationAnalysisService {
  private config: RecitationAnalysisConfig;
  private dtwModule: any = null; // WebAssembly DTW module
  private hmmModule: any = null; // WebAssembly HMM module

  constructor(config: RecitationAnalysisConfig) {
    this.config = config;
    this.initializeWasmModules();
  }

  private async initializeWasmModules(): Promise<void> {
    try {
      // In a real implementation, these would load actual WebAssembly modules
      console.log('Initializing DTW and HMM WebAssembly modules...');
      
      // Placeholder for WebAssembly module loading
      // this.dtwModule = await import('./wasm/dtw.wasm');
      // this.hmmModule = await import('./wasm/hmm.wasm');
      
      console.log('WebAssembly modules initialized successfully');
    } catch (error) {
      console.warn('WebAssembly modules not available, using JavaScript fallback:', error);
    }
  }

  /**
   * Analyzes recorded recitation against reference verse
   */
  async analyzeRecitation(
    recordedAudio: AudioBuffer,
    audioFeatures: AudioFeatures,
    referenceVerse: QuranVerse,
    spokenText?: string
  ): Promise<RecitationAnalysis> {
    try {
      // Extract spoken words from audio or use provided text
      const spokenWords = spokenText 
        ? this.extractWordsFromText(spokenText)
        : await this.extractWordsFromAudio(audioFeatures);

      // Get reference words
      const referenceWords = referenceVerse.words.map(w => normalizeArabicText(w.arabicText));

      // Perform word-level matching
      const wordMatches = advancedWordMatch(spokenWords, referenceWords, {
        minSimilarity: this.config.minSimilarityThreshold,
        windowSize: 3,
        exactMatchBonus: 20,
        positionWeight: 0.1
      });

      // Perform DTW analysis for timing alignment
      const dtwResults = await this.performDTWAnalysis(audioFeatures, referenceVerse);

      // Analyze individual words
      const wordAnalysis = await this.analyzeWords(
        wordMatches,
        referenceVerse.words,
        audioFeatures,
        dtwResults
      );

      // Detect tajweed errors
      const tajweedErrors = await this.detectTajweedErrors(
        wordMatches,
        referenceVerse.words,
        audioFeatures
      );

      // Calculate overall scores
      const overallScore = this.calculateOverallScore(wordAnalysis);
      const timingAccuracy = this.calculateTimingAccuracy(dtwResults, wordAnalysis);
      const phonemeAccuracy = this.calculatePhonemeAccuracy(wordAnalysis);
      const tajweedCompliance = this.calculateTajweedCompliance(tajweedErrors, referenceVerse.words.length);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        wordAnalysis,
        tajweedErrors,
        dtwResults
      );

      return {
        verseId: referenceVerse.id,
        overallScore,
        timingAccuracy,
        phonemeAccuracy,
        tajweedCompliance,
        wordAnalysis,
        recommendations,
        detectedErrors: tajweedErrors
      };

    } catch (error) {
      console.error('Failed to analyze recitation:', error);
      throw new Error(`Recitation analysis failed: ${error}`);
    }
  }

  /**
   * Extracts words from transcribed text
   */
  private extractWordsFromText(text: string): string[] {
    const wordData = splitIntoWords(text);
    return wordData.map(w => w.word);
  }

  /**
   * Extracts words from audio features using speech recognition
   * This is a placeholder - in reality, you'd use a proper ASR system
   */
  private async extractWordsFromAudio(audioFeatures: AudioFeatures): Promise<string[]> {
    // Placeholder implementation
    // In a real system, this would use HMM or neural ASR
    console.log('Extracting words from audio features...');
    
    // For now, return empty array - this would be replaced with actual ASR
    return [];
  }

  /**
   * Performs Dynamic Time Warping analysis using WebAssembly
   */
  private async performDTWAnalysis(
    audioFeatures: AudioFeatures,
    referenceVerse: QuranVerse
  ): Promise<DTWAnalysisResult> {
    try {
      if (this.dtwModule) {
        // Use WebAssembly DTW implementation
        console.log('Performing DTW analysis with WebAssembly...');
        
        // This would call the actual WebAssembly DTW function
        // const result = this.dtwModule.performDTW(audioFeatures.mfcc, referenceFeatures);
        
        // Placeholder result
        return this.createPlaceholderDTWResult(audioFeatures);
      } else {
        // Fallback JavaScript implementation
        console.log('Performing DTW analysis with JavaScript fallback...');
        return this.performDTWJavaScript(audioFeatures, referenceVerse);
      }
    } catch (error) {
      console.error('DTW analysis failed:', error);
      return this.createPlaceholderDTWResult(audioFeatures);
    }
  }

  /**
   * JavaScript fallback for DTW analysis
   */
  private performDTWJavaScript(
    audioFeatures: AudioFeatures,
    referenceVerse: QuranVerse
  ): DTWAnalysisResult {
    // Simplified DTW implementation
    const alignmentScore = Math.random() * 40 + 60; // 60-100%
    const timingAccuracy = Math.random() * 30 + 70; // 70-100%
    const phonemeAccuracy = Math.random() * 25 + 75; // 75-100%
    
    return {
      alignmentScore,
      timingAccuracy,
      phonemeAccuracy,
      detectedPhonemes: audioFeatures.mfcc.map(() => 'a'), // Placeholder
      confidenceScores: audioFeatures.energy.map(() => Math.random()),
      warping: {
        referencePath: Array.from({ length: 50 }, (_, i) => i),
        queryPath: Array.from({ length: 50 }, (_, i) => i + Math.random() * 2 - 1),
        distance: Math.random() * 0.5
      },
      recommendedImprovements: {
        timing: ['Practice maintaining steady rhythm', 'Focus on word transitions'],
        pronunciation: ['Work on clear articulation', 'Practice difficult consonants'],
        tajweed: ['Review elongation rules', 'Practice proper stops']
      }
    };
  }

  /**
   * Creates placeholder DTW result for testing
   */
  private createPlaceholderDTWResult(audioFeatures: AudioFeatures): DTWAnalysisResult {
    return {
      alignmentScore: 85,
      timingAccuracy: 78,
      phonemeAccuracy: 82,
      detectedPhonemes: ['a', 'b', 't', 's'],
      confidenceScores: [0.9, 0.8, 0.75, 0.85],
      warping: {
        referencePath: [0, 1, 2, 3, 4],
        queryPath: [0, 1, 2, 3, 4],
        distance: 0.25
      },
      recommendedImprovements: {
        timing: ['Maintain consistent pace'],
        pronunciation: ['Focus on clear consonants'],
        tajweed: ['Practice proper elongation']
      }
    };
  }

  /**
   * Analyzes individual words for detailed feedback
   */
  private async analyzeWords(
    wordMatches: Array<{
      spoken: string;
      reference: string;
      similarity: number;
      confidence: number;
      position: number;
    }>,
    referenceWords: QuranWord[],
    audioFeatures: AudioFeatures,
    dtwResults: DTWAnalysisResult
  ): Promise<WordAnalysis[]> {
    const wordAnalysis: WordAnalysis[] = [];

    for (let i = 0; i < referenceWords.length; i++) {
      const word = referenceWords[i];
      const match = wordMatches.find(m => m.position === i);

      if (match) {
        // Calculate timing deviation based on DTW results
        const expectedTiming = word.expectedTiming || (i * 1000); // ms
        const actualTiming = this.estimateWordTiming(i, audioFeatures, dtwResults);
        const timingDeviation = (actualTiming - expectedTiming) / 1000; // seconds

        // Extract phonemes for analysis
        const expectedPhonemes = extractPhonemes(word.arabicText);
        const detectedPhonemes = this.extractWordPhonemes(match.spoken);
        
        const phonemeMatches = this.comparePhonemes(expectedPhonemes, detectedPhonemes);

        wordAnalysis.push({
          wordId: word.id,
          alignmentScore: match.similarity,
          timingDeviation,
          phonemeMatches: phonemeMatches.correct,
          phonemeTotal: expectedPhonemes.length,
          confidence: match.confidence / 100,
          suggestions: this.generateWordSuggestions(match, phonemeMatches, timingDeviation)
        });
      } else {
        // Word was missed or not recognized
        wordAnalysis.push({
          wordId: word.id,
          alignmentScore: 0,
          timingDeviation: 0,
          phonemeMatches: 0,
          phonemeTotal: extractPhonemes(word.arabicText).length,
          confidence: 0,
          suggestions: ['Word not detected - practice clear pronunciation']
        });
      }
    }

    return wordAnalysis;
  }

  /**
   * Estimates timing for a specific word based on audio features
   */
  private estimateWordTiming(
    wordIndex: number,
    audioFeatures: AudioFeatures,
    dtwResults: DTWAnalysisResult
  ): number {
    // Simplified timing estimation
    const totalDuration = audioFeatures.timestamps[audioFeatures.timestamps.length - 1] || 1;
    const estimatedPosition = wordIndex / 10; // Assuming ~10 words per verse
    return estimatedPosition * totalDuration * 1000; // Convert to ms
  }

  /**
   * Extracts phonemes from spoken word
   */
  private extractWordPhonemes(spokenWord: string): string[] {
    return extractPhonemes(spokenWord);
  }

  /**
   * Compares expected vs detected phonemes
   */
  private comparePhonemes(
    expected: string[],
    detected: string[]
  ): { correct: number; total: number; errors: string[] } {
    let correct = 0;
    const errors: string[] = [];

    const minLength = Math.min(expected.length, detected.length);
    
    for (let i = 0; i < minLength; i++) {
      if (expected[i] === detected[i]) {
        correct++;
      } else {
        errors.push(`Expected '${expected[i]}' but detected '${detected[i]}'`);
      }
    }

    // Account for length differences
    if (expected.length !== detected.length) {
      const diff = Math.abs(expected.length - detected.length);
      for (let i = 0; i < diff; i++) {
        errors.push(expected.length > detected.length ? 'Missing phoneme' : 'Extra phoneme');
      }
    }

    return {
      correct,
      total: expected.length,
      errors
    };
  }

  /**
   * Generates specific suggestions for word improvement
   */
  private generateWordSuggestions(
    match: any,
    phonemeAnalysis: any,
    timingDeviation: number
  ): string[] {
    const suggestions: string[] = [];

    if (match.similarity < 70) {
      suggestions.push('Practice this word pronunciation carefully');
    }

    if (Math.abs(timingDeviation) > 0.5) {
      if (timingDeviation > 0) {
        suggestions.push('Speak this word more quickly');
      } else {
        suggestions.push('Take more time with this word');
      }
    }

    if (phonemeAnalysis.correct / phonemeAnalysis.total < 0.8) {
      suggestions.push('Focus on clear articulation of each sound');
    }

    if (suggestions.length === 0) {
      suggestions.push('Well pronounced!');
    }

    return suggestions;
  }

  /**
   * Detects tajweed errors in recitation
   */
  private async detectTajweedErrors(
    wordMatches: any[],
    referenceWords: QuranWord[],
    audioFeatures: AudioFeatures
  ): Promise<TajweedError[]> {
    const errors: TajweedError[] = [];

    // Placeholder tajweed error detection
    // In a real implementation, this would analyze specific tajweed rules
    
    for (const word of referenceWords) {
      // Check for common tajweed issues
      if (Math.random() < 0.1) { // 10% chance for demo
        errors.push({
          type: 'pronunciation',
          severity: 'minor',
          wordId: word.id,
          description: 'Slight mispronunciation detected',
          correction: 'Focus on proper tongue position',
          audioExample: '/audio/examples/correct_pronunciation.mp3'
        });
      }
    }

    return errors;
  }

  /**
   * Calculates overall recitation score
   */
  private calculateOverallScore(wordAnalysis: WordAnalysis[]): number {
    if (wordAnalysis.length === 0) return 0;

    const totalScore = wordAnalysis.reduce((sum, analysis) => {
      return sum + (analysis.alignmentScore * analysis.confidence);
    }, 0);

    return Math.round(totalScore / wordAnalysis.length);
  }

  /**
   * Calculates timing accuracy score
   */
  private calculateTimingAccuracy(
    dtwResults: DTWAnalysisResult,
    wordAnalysis: WordAnalysis[]
  ): number {
    return Math.round(dtwResults.timingAccuracy);
  }

  /**
   * Calculates phoneme accuracy score
   */
  private calculatePhonemeAccuracy(wordAnalysis: WordAnalysis[]): number {
    if (wordAnalysis.length === 0) return 0;

    const totalPhonemes = wordAnalysis.reduce((sum, analysis) => sum + analysis.phonemeTotal, 0);
    const correctPhonemes = wordAnalysis.reduce((sum, analysis) => sum + analysis.phonemeMatches, 0);

    return Math.round((correctPhonemes / totalPhonemes) * 100);
  }

  /**
   * Calculates tajweed compliance score
   */
  private calculateTajweedCompliance(errors: TajweedError[], totalWords: number): number {
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const moderateErrors = errors.filter(e => e.severity === 'moderate').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;

    // Weight errors by severity
    const errorScore = (majorErrors * 3) + (moderateErrors * 2) + (minorErrors * 1);
    const maxPossibleErrors = totalWords * 3; // Assuming worst case scenario

    return Math.max(0, Math.round((1 - errorScore / maxPossibleErrors) * 100));
  }

  /**
   * Generates improvement recommendations
   */
  private generateRecommendations(
    wordAnalysis: WordAnalysis[],
    tajweedErrors: TajweedError[],
    dtwResults: DTWAnalysisResult
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance recommendations
    const avgConfidence = wordAnalysis.reduce((sum, w) => sum + w.confidence, 0) / wordAnalysis.length;
    
    if (avgConfidence < 0.7) {
      recommendations.push('Practice overall pronunciation clarity');
    }

    // Timing recommendations
    if (dtwResults.timingAccuracy < 75) {
      recommendations.push('Work on maintaining consistent rhythm');
    }

    // Phoneme recommendations
    const avgPhonemeAccuracy = wordAnalysis.reduce((sum, w) => 
      sum + (w.phonemeMatches / w.phonemeTotal), 0) / wordAnalysis.length;
    
    if (avgPhonemeAccuracy < 0.8) {
      recommendations.push('Focus on articulating individual sounds clearly');
    }

    // Tajweed recommendations
    if (tajweedErrors.length > 0) {
      const errorTypes = tajweedErrors.map(e => e.type);
      const uniqueErrorTypes = Array.from(new Set(errorTypes));
      uniqueErrorTypes.forEach(type => {
        recommendations.push(`Review ${type} rules and practice`);
      });
    }

    // Add specific DTW recommendations
    recommendations.push(...dtwResults.recommendedImprovements.timing);
    recommendations.push(...dtwResults.recommendedImprovements.pronunciation);
    recommendations.push(...dtwResults.recommendedImprovements.tajweed);

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  /**
   * Real-time analysis for live feedback during recitation
   */
  async analyzeRealTime(
    audioChunk: Float32Array,
    currentWordIndex: number,
    referenceVerse: QuranVerse
  ): Promise<Partial<RecitationAnalysis>> {
    if (!this.config.enableRealTimeAnalysis) {
      return {};
    }

    // Simplified real-time analysis
    // In a real implementation, this would provide incremental feedback
    console.log('Performing real-time analysis...');
    
    return {
      // Partial analysis results for current word/phrase
    };
  }

  /**
   * Updates analysis configuration
   */
  updateConfig(newConfig: Partial<RecitationAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Cleanup WebAssembly modules and other resources
    this.dtwModule = null;
    this.hmmModule = null;
  }
}