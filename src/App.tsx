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
  Divider,
} from '@mui/material';
import theme from './theme';
import Layout from './components/common/Layout';
import { AudioRecorder } from './components/audio/AudioRecorder';
import { WaveformVisualizer } from './components/audio/WaveformVisualizer';
import { RecordingData } from './types/audio';

function App() {
  const [currentRecording, setCurrentRecording] = useState<RecordingData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      // TODO: Implement actual analysis using DTW/HMM
      // For now, simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysisResults({
        overallScore: 85,
        feedback: [
          { rule: 'Medd', status: 'correct', score: 90 },
          { rule: 'Ghunnah', status: 'warning', score: 75 },
          { rule: 'Qalqalah', status: 'correct', score: 88 },
        ],
      });
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 6, mt: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              Quranic Recitation Analysis
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Record your recitation and receive instant feedback on your Tajweed
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

          {/* Main Content Grid */}
          <Grid container spacing={3}>
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

            {/* Analysis Results Section */}
            {currentRecording && (
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Analysis Results
                  </Typography>
                  
                  {!analysisResults && !isAnalyzing && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        Recording complete! Click the "Analyze Recitation" button in the recording panel to start analysis.
                      </Typography>
                    </Box>
                  )}
                  
                  {isAnalyzing && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="primary" paragraph>
                        Analyzing your recitation using DTW and HMM algorithms...
                      </Typography>
                    </Box>
                  )}
                  
                  {analysisResults && !isAnalyzing && (
                    <Box>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Overall Score: {analysisResults.overallScore}%
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        {analysisResults.feedback.map((item: any, index: number) => (
                          <Grid item xs={12} sm={4} key={index}>
                            <Paper
                              sx={{
                                p: 2,
                                textAlign: 'center',
                                backgroundColor: 
                                  item.status === 'correct' ? 'success.light' :
                                  item.status === 'warning' ? 'warning.light' :
                                  'error.light',
                              }}
                              variant="outlined"
                            >
                              <Typography variant="h6">{item.rule}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Score: {item.score}%
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Features Grid */}
          <Box sx={{ mt: 6 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Real-time Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get instant feedback on your recitation using advanced signal processing
                    algorithms (DTW & HMM).
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Tajweed Rules
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comprehensive analysis of Medd, Ghunnah, Qalqalah, and other
                    essential Tajweed rules.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Offline Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Works offline! Your recordings are processed locally and synced
                    when you're back online.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Info Alert */}
          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="body2">
              This app uses classical signal processing techniques without AI/ML models
              to analyze your Quranic recitation. All processing happens locally on your
              device for privacy and performance.
            </Typography>
          </Alert>
        </Container>
      </Layout>
    </ThemeProvider>
  );
}

export default App;