import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import { AudioService } from '../../services/AudioService';
import { AudioServiceConfig, RecordingData, AudioWorkletMessage } from '../../types/audio';
import { formatTime } from '../../utils/formatters';

interface AudioRecorderProps {
  onRecordingComplete: (recording: RecordingData) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: Error) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  maxDuration?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  onError,
  onAnalyze,
  isAnalyzing = false,
  maxDuration = 300, // 5 minutes default
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);

  const audioServiceRef = useRef<AudioService | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Handle real-time audio processing
  const handleAudioProcessing = useCallback((message: AudioWorkletMessage) => {
    if (message.type === 'features' && message.data) {
      const features = message.data as any;
      if (features.energy && features.energy.length > 0) {
        const level = Math.min(100, features.energy[0] * 500);
        setAudioLevel(level);
      }
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    if (!audioServiceRef.current || !isRecording) return;

    try {
      const recordingData = await audioServiceRef.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setAudioLevel(0);
      setHasRecording(true);
      startTimeRef.current = null;
      
      onRecordingStop?.();
      onRecordingComplete(recordingData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  }, [isRecording, onRecordingStop, onRecordingComplete, onError]);

  // Initialize audio service
  useEffect(() => {
    const initializeAudioService = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        // Check microphone permissions - some browsers don't support this API
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(result.state);

          result.addEventListener('change', () => {
            setPermissionStatus(result.state);
          });
        } catch (permError) {
          console.log('Permissions API not supported, will request on recording start');
          setPermissionStatus('prompt');
        }

        // Create audio service config
        const config: AudioServiceConfig = {
          constraints: {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100,
            },
          },
          processingOptions: {
            sampleRate: 44100,
            bufferSize: 2048,
            hopSize: 512,
            mfccCoefficients: 13,
          },
          enableRealTimeProcessing: true,
          outputFormat: 'wav',
        };

        // Initialize audio service
        audioServiceRef.current = new AudioService(config);
        await audioServiceRef.current.initialize();

        // Set up real-time processing callback
        audioServiceRef.current.setProcessingCallback(handleAudioProcessing);

        console.log('Audio service initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize audio service';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAudioService();

    return () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.destroy();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onError, handleAudioProcessing]);

  // Update recording time
  useEffect(() => {
    if (isRecording && !isPaused && startTimeRef.current) {
      const updateTime = () => {
        const elapsed = (Date.now() - startTimeRef.current!) / 1000;
        setRecordingTime(elapsed);

        if (elapsed >= maxDuration) {
          handleStopRecording();
        } else {
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPaused, maxDuration, handleStopRecording]);

  const handleStartRecording = async () => {
    if (isInitializing) {
      setError('Audio service is still initializing...');
      return;
    }

    if (!audioServiceRef.current) {
      setError('Audio service not ready');
      return;
    }

    try {
      setError(null);
      setHasRecording(false);
      
      // Request microphone permission explicitly
      console.log('Requesting microphone access...');
      await audioServiceRef.current.startRecording();
      
      setIsRecording(true);
      setRecordingTime(0);
      setPermissionStatus('granted');
      startTimeRef.current = Date.now();
      onRecordingStart?.();
      
      console.log('Recording started successfully');
    } catch (err) {
      console.error('Recording start failed:', err);
      
      // Handle permission denied
      if (err instanceof Error && err.message.includes('Permission denied')) {
        setPermissionStatus('denied');
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
        setError(errorMessage);
      }
      
      onError?.(new Error(err instanceof Error ? err.message : 'Failed to start recording'));
    }
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    if (audioServiceRef.current && isRecording) {
      audioServiceRef.current.stopRecording().catch(console.error);
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioLevel(0);
    startTimeRef.current = null;
    setError(null);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Audio Recorder
        </Typography>

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Microphone Access Denied</AlertTitle>
            Please enable microphone access in your browser settings to record.
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Recording Status */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
            {isRecording && (
              <>
                <Chip
                  icon={<MicIcon />}
                  label={isPaused ? 'Paused' : 'Recording'}
                  color={isPaused ? 'warning' : 'error'}
                  sx={{ animation: !isPaused ? 'pulse 2s infinite' : 'none' }}
                />
                <Typography variant="h6" component="span">
                  {formatTime(recordingTime)}
                </Typography>
              </>
            )}
          </Stack>

          {/* Audio Level Indicator */}
          {isRecording && !isPaused && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VolumeUpIcon color="action" />
              <LinearProgress
                variant="determinate"
                value={audioLevel}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    transition: 'transform 0.1s ease',
                  },
                }}
              />
            </Box>
          )}

          {/* Recording Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            {!isRecording ? (
              <Tooltip title="Start Recording">
                <Fab
                  color="primary"
                  size="large"
                  onClick={handleStartRecording}
                  disabled={isInitializing}
                  sx={{
                    width: 80,
                    height: 80,
                  }}
                >
                  <MicIcon sx={{ fontSize: 40 }} />
                </Fab>
              </Tooltip>
            ) : (
              <>
                <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
                  <IconButton
                    onClick={handleTogglePause}
                    color="primary"
                    size="large"
                    disabled={!isRecording}
                  >
                    {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Stop Recording">
                  <Fab
                    color="error"
                    size="large"
                    onClick={handleStopRecording}
                    sx={{
                      width: 80,
                      height: 80,
                    }}
                  >
                    <StopIcon sx={{ fontSize: 40 }} />
                  </Fab>
                </Tooltip>

                <Tooltip title="Cancel Recording">
                  <IconButton
                    onClick={handleReset}
                    color="error"
                    size="large"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          {/* Recording Time Limit */}
          {isRecording && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Maximum recording time: {formatTime(maxDuration)}
            </Typography>
          )}
        </Box>

        {/* Post-recording actions */}
        {hasRecording && !isRecording && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              sx={{ mr: 2 }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Recitation'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => setHasRecording(false)}
            >
              New Recording
            </Button>
          </Box>
        )}

        {/* Loading State */}
        {isInitializing && (
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              Initializing audio service... Please wait.
            </Typography>
          </Alert>
        )}

        {/* Instructions */}
        {!isRecording && !hasRecording && !isInitializing && (
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              Click the microphone button to start recording your Quranic recitation. 
              Speak clearly and maintain a consistent distance from your device.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// CSS animation for recording indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);