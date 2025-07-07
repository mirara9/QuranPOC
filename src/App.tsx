import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Alert,
  Collapse,
  Tab,
  Tabs,
} from '@mui/material';
import theme from './theme';
import Layout from './components/common/Layout';
import { AudioRecorder } from './components/audio/AudioRecorder';
import { WaveformVisualizer } from './components/audio/WaveformVisualizer';
import { QuranDisplay } from './components/quran/QuranDisplay';
import { RecitationFeedback } from './components/analysis/RecitationFeedback';
import { RecordingData } from './types/audio';
import { 
  QuranVerse, 
  QuranDisplaySettings, 
  RecitationAnalysis,
  DTWAnalysisResult 
} from './types/quran';
import { FastAnalysisService } from './services/FastAnalysisService';

// Sample verse data - in production this would come from an API
const sampleVerse: QuranVerse = {
  id: 'al-fatiha-1',
  surahNumber: 1,
  verseNumber: 1,
  arabicText: 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ',
  transliteration: 'Bismillāhi r-raḥmāni r-raḥīm',
  translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
  words: [
    {
      id: 'word-1',
      position: 0,
      arabicText: 'بِسۡمِ',
      transliteration: 'Bismi',
      translation: 'In the name of'
    },
    {
      id: 'word-2',
      position: 1,
      arabicText: 'ٱللَّهِ',
      transliteration: 'Allāhi',
      translation: 'Allah'
    },
    {
      id: 'word-3',
      position: 2,
      arabicText: 'ٱلرَّحۡمَـٰنِ',
      transliteration: 'ar-Raḥmāni',
      translation: 'the Entirely Merciful'
    },
    {
      id: 'word-4',
      position: 3,
      arabicText: 'ٱلرَّحِيمِ',
      transliteration: 'ar-Raḥīm',
      translation: 'the Especially Merciful'
    }
  ],
  metadata: {
    surahName: 'Al-Fatiha',
    verseCount: 7,
    revelationType: 'meccan',
    juzNumber: 1,
    hizbNumber: 1,
    rukulNumber: 1
  }
};

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<RecordingData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<RecitationAnalysis | null>(null);
  const [dtwResults, setDtwResults] = useState<DTWAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentWordIndex] = useState(-1);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  
  // Quran display settings
  const [displaySettings, setDisplaySettings] = useState<QuranDisplaySettings>({
    fontSize: 'large',
    showTransliteration: true,
    showTranslation: true,
    showTajweedColors: false,
    language: 'en',
    theme: 'light',
    autoScroll: true,
    highlightDuration: 2000
  });

  // Fast analysis service instance
  const [analysisService] = useState(() => new FastAnalysisService({
    enableLogging: true,
    timeoutMs: 3000 // 3 second timeout
  }));

  const handleRecordingComplete = (recording: RecordingData) => {
    setCurrentRecording(recording);
    setError(null);
    console.log('Recording complete:', recording);
  };

  const handleRecordingStart = () => {
    setCurrentRecording(null);
    setAnalysisResults(null);
    setError(null);
  };

  const handleRecordingError = (err: Error) => {
    setError(err.message);
    console.error('Recording error:', err);
  };

  const handleAnalyze = async () => {
    if (!currentRecording) return;

    setIsAnalyzing(true);
    setError(null);
    setCurrentTab(1); // Switch to results tab

    try {
      console.log('Starting fast recitation analysis...');
      const startTime = Date.now();
      
      // Perform fast analysis
      const analysis = await analysisService.analyzeRecitation(
        currentRecording.audioBuffer,
        currentRecording.features,
        sampleVerse
      );

      // Generate DTW results for compatibility
      const dtwResults = analysisService.generateDTWResults(
        currentRecording.features, 
        analysis.overallScore
      );

      const duration = Date.now() - startTime;
      console.log(`Analysis completed in ${duration}ms`);

      setAnalysisResults(analysis);
      setDtwResults(dtwResults);

      // Highlight words based on analysis
      const wordsToHighlight = new Set(
        analysis.wordAnalysis
          .filter(wa => wa.confidence < 0.7)
          .map(wa => wa.wordId)
      );
      setHighlightedWords(wordsToHighlight);

      console.log('Analysis completed successfully:', analysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(`${errorMessage}. Please try recording again.`);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSettingsChange = (newSettings: Partial<QuranDisplaySettings>) => {
    setDisplaySettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleWordClick = (word: any) => {
    console.log('Word clicked:', word);
    // Could implement word-specific audio playback here
  };

  const handlePlayVerse = (verseId: string) => {
    console.log('Play verse:', verseId);
    // Could implement verse audio playback here
  };

  const handleRetryWord = (wordId: string) => {
    console.log('Retry word:', wordId);
    // Could implement word-specific practice mode
  };

  const handlePlayExample = (audioUrl: string) => {
    console.log('Play example:', audioUrl);
    // Could implement example audio playback
  };

  const handleShowLearningMaterial = (topic: string) => {
    console.log('Show learning material:', topic);
    // Could navigate to learning resources
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 4, mt: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              Quranic Recitation Analysis
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Recite verses with real-time DTW/HMM analysis and detailed Tajweed feedback
            </Typography>
          </Box>

          {/* Error Alert */}
          <Collapse in={!!error}>
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          </Collapse>

          {/* Main Navigation Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="main navigation">
              <Tab label="Practice Recitation" />
              <Tab label="Analysis Results" disabled={!analysisResults && !isAnalyzing} />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {currentTab === 0 && (
            <Grid container spacing={3}>
              {/* Verse Display Section */}
              <Grid item xs={12}>
                <QuranDisplay
                  verse={sampleVerse}
                  settings={displaySettings}
                  onSettingsChange={handleSettingsChange}
                  onWordClick={handleWordClick}
                  onPlayVerse={handlePlayVerse}
                  currentWordIndex={currentWordIndex}
                  highlightedWords={highlightedWords}
                  analysisResults={analysisResults || undefined}
                  showSettings={true}
                />
              </Grid>

              {/* Recording Section */}
              <Grid item xs={12} lg={6}>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingStart={handleRecordingStart}
                  onError={handleRecordingError}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  maxDuration={300}
                />
              </Grid>

              {/* Visualization Section */}
              <Grid item xs={12} lg={6}>
                {currentRecording ? (
                  <WaveformVisualizer
                    recording={currentRecording}
                    showControls={true}
                    showTimeline={true}
                    enableRegions={false}
                  />
                ) : (
                  <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Start recording to see the waveform visualization
                    </Typography>
                  </Paper>
                )}
              </Grid>

              {/* Instructions */}
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Instructions:</strong> Read the verse above, then click the microphone button to record your recitation. 
                    Speak clearly and maintain a consistent distance from your device. 
                    After recording, click "Analyze Recitation" to receive detailed feedback.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}

          {currentTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {isAnalyzing ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Analyzing Your Recitation
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Processing audio and generating feedback... This should complete in 2-3 seconds.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <div>🎵 Analyzing speech quality...</div>
                      <div>⏱️ Checking timing and pace...</div>
                      <div>📊 Evaluating pronunciation...</div>
                    </Box>
                  </Paper>
                ) : analysisResults ? (
                  <RecitationFeedback
                    analysis={analysisResults}
                    dtwResults={dtwResults || undefined}
                    onPlayExample={handlePlayExample}
                    onRetryWord={handleRetryWord}
                    onShowLearningMaterial={handleShowLearningMaterial}
                    showDetailedAnalysis={true}
                  />
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      No Analysis Available
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Please record your recitation first, then click "Analyze Recitation" to see detailed feedback.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}

          {/* Features Grid */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
              Advanced Features
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    DTW/HMM Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Advanced Dynamic Time Warping and Hidden Markov Models provide 
                    precise timing and pronunciation analysis.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Word-Level Feedback
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interactive verse display with individual word analysis,
                    pronunciation scores, and specific improvement suggestions.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Comprehensive Tajweed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed analysis of Medd, Ghunnah, Qalqalah, and other
                    essential Tajweed rules with corrective guidance.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Info Alert */}
          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="body2">
              This app uses classical signal processing techniques (DTW/HMM) without AI/ML models
              to analyze your Quranic recitation. All processing happens locally on your
              device for privacy and performance. The analysis is superior to basic speech recognition systems.
            </Typography>
          </Alert>
        </Container>
      </Layout>
    </ThemeProvider>
  );
}

export default App;