import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import WaveSurfer from 'wavesurfer.js';
import { RecordingData } from '../../types/audio';
import { formatTime, audioBufferToWav, downloadBlob } from '../../utils/formatters';

interface WaveformVisualizerProps {
  recording?: RecordingData;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  onReady?: (wavesurfer: WaveSurfer) => void;
  onProgress?: (progress: number) => void;
  onFinish?: () => void;
  height?: number;
  showControls?: boolean;
  showTimeline?: boolean;
  enableRegions?: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  recording,
  audioUrl,
  audioBuffer,
  onReady,
  onProgress,
  onFinish,
  height = 128,
  showControls = true,
  showTimeline = true,
  enableRegions = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const theme = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer without AudioContext initially
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: theme.palette.primary.light,
      progressColor: theme.palette.primary.main,
      cursorColor: theme.palette.secondary.main,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height,
      normalize: true,
      interact: true,
      minPxPerSec: 50,
      plugins: [],
    });

    // TODO: Add timeline and regions plugins when available in v7
    // For now, we'll implement basic functionality

    // Event handlers
    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
      onReady?.(wavesurfer);
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
      const progress = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
      onProgress?.(progress);
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      onFinish?.();
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));

    wavesurferRef.current = wavesurfer;

    // Load audio
    if (audioUrl) {
      wavesurfer.load(audioUrl);
    } else if (audioBuffer || recording?.audioBuffer) {
      const buffer = audioBuffer || recording!.audioBuffer;
      
      // Convert AudioBuffer to WAV blob without creating new AudioContext
      const wav = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wav);
      wavesurfer.load(url);
      
      // Cleanup URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, audioBuffer, recording, height, showTimeline, enableRegions, theme, onReady, onProgress, onFinish]);

  // Control handlers
  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleStop = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const vol = value as number;
    setVolume(vol);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(vol);
    }
  };

  const handleZoomChange = (_: Event, value: number | number[]) => {
    const zoomLevel = value as number;
    setZoom(zoomLevel);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(zoomLevel);
    }
  };

  const handleDownload = () => {
    if (recording?.audioBuffer) {
      const wav = audioBufferToWav(recording.audioBuffer);
      const filename = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
      downloadBlob(wav, filename);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Waveform Visualization
        </Typography>

        {/* Loading indicator */}
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height,
              backgroundColor: theme.palette.action.hover,
              borderRadius: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Waveform container */}
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            display: isLoading ? 'none' : 'block',
          }}
        />

        {/* Controls */}
        {showControls && !isLoading && (
          <>
            {/* Playback controls */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <IconButton
                onClick={handlePlayPause}
                color="primary"
                size="large"
                disabled={isLoading}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>

              <IconButton
                onClick={handleStop}
                color="primary"
                disabled={isLoading}
              >
                <StopIcon />
              </IconButton>

              <Typography variant="body2" sx={{ minWidth: 100 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>

              <Box sx={{ flex: 1 }} />

              {recording && (
                <Tooltip title="Download Recording">
                  <IconButton onClick={handleDownload} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            {/* Volume and Zoom controls */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <VolumeIcon color="action" />
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ flex: 1 }}
                  aria-label="Volume"
                />
                <Typography variant="body2" sx={{ minWidth: 40 }}>
                  {Math.round(volume * 100)}%
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <ZoomOutIcon color="action" />
                <Slider
                  value={zoom}
                  onChange={handleZoomChange}
                  min={1}
                  max={200}
                  step={1}
                  sx={{ flex: 1 }}
                  aria-label="Zoom"
                />
                <ZoomInIcon color="action" />
                <Typography variant="body2" sx={{ minWidth: 40 }}>
                  {zoom}x
                </Typography>
              </Stack>
            </Stack>
          </>
        )}

        {/* Recording metadata */}
        {recording && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Sample Rate: {recording.metadata.sampleRate} Hz | 
              Channels: {recording.metadata.channels} | 
              Duration: {formatTime(recording.metadata.duration)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};