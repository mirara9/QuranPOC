import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Fab,
  Alert,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import theme from './theme';
import Layout from './components/common/Layout';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    setHasRecording(false);
    // TODO: Implement actual recording logic
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
    // TODO: Implement actual stop recording logic
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // TODO: Implement analysis logic
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
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

          {/* Main Recording Card */}
          <Card sx={{ mb: 4, p: 2 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                  {isRecording ? 'Recording...' : 'Ready to Record'}
                </Typography>
                
                {/* Recording Button */}
                <Box sx={{ my: 4 }}>
                  <Fab
                    color={isRecording ? 'error' : 'primary'}
                    size="large"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: 60,
                    }}
                  >
                    {isRecording ? <StopIcon fontSize="inherit" /> : <MicIcon fontSize="inherit" />}
                  </Fab>
                </Box>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {isRecording
                    ? 'Click the stop button when you finish your recitation'
                    : 'Click the microphone to start recording your recitation'}
                </Typography>

                {/* Action Buttons */}
                {hasRecording && !isRecording && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      size="large"
                    >
                      Play Recording
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<AnalyticsIcon />}
                      size="large"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Recitation'}
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
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