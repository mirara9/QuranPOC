import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  Settings as SettingsIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  TextFields as TextFieldsIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { QuranVerse, QuranWord, QuranDisplaySettings, RecitationAnalysis } from '../../types/quran';
import { formatArabicForDisplay } from '../../utils/arabicText';

interface QuranDisplayProps {
  verse: QuranVerse;
  settings: QuranDisplaySettings;
  onSettingsChange: (settings: Partial<QuranDisplaySettings>) => void;
  onWordClick?: (word: QuranWord) => void;
  onPlayVerse?: (verseId: string) => void;
  onRecitationAnalysis?: (analysis: RecitationAnalysis) => void;
  isPlaying?: boolean;
  currentWordIndex?: number;
  highlightedWords?: Set<string>;
  analysisResults?: RecitationAnalysis;
  showSettings?: boolean;
}

export const QuranDisplay: React.FC<QuranDisplayProps> = ({
  verse,
  settings,
  onSettingsChange,
  onWordClick,
  onPlayVerse,
  onRecitationAnalysis,
  isPlaying = false,
  currentWordIndex = -1,
  highlightedWords = new Set(),
  analysisResults,
  showSettings = true,
}) => {
  const theme = useTheme();
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [selectedWord, setSelectedWord] = useState<QuranWord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current word during playback
  useEffect(() => {
    if (currentWordIndex >= 0 && containerRef.current) {
      const wordElement = containerRef.current.querySelector(
        `[data-word-index="${currentWordIndex}"]`
      );
      if (wordElement) {
        wordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }
  }, [currentWordIndex]);

  const handleWordClick = useCallback((word: QuranWord) => {
    setSelectedWord(word);
    onWordClick?.(word);
  }, [onWordClick]);

  const handlePlayVerse = useCallback(() => {
    onPlayVerse?.(verse.id);
  }, [onPlayVerse, verse.id]);

  const getWordColor = (word: QuranWord, index: number): string => {
    // Current word during playback
    if (currentWordIndex === index) {
      return theme.palette.secondary.main;
    }
    
    // Highlighted words from analysis
    if (highlightedWords.has(word.id)) {
      return theme.palette.primary.light;
    }
    
    // Analysis-based coloring
    if (analysisResults?.wordAnalysis) {
      const wordAnalysis = analysisResults.wordAnalysis.find(w => w.wordId === word.id);
      if (wordAnalysis) {
        if (wordAnalysis.confidence > 0.8) {
          return theme.palette.success.light;
        } else if (wordAnalysis.confidence > 0.6) {
          return theme.palette.warning.light;
        } else {
          return theme.palette.error.light;
        }
      }
    }
    
    // Tajweed coloring (if enabled)
    if (settings.showTajweedColors) {
      // This would be enhanced with actual tajweed rules
      return theme.palette.text.primary;
    }
    
    return theme.palette.text.primary;
  };

  const getWordBackgroundColor = (word: QuranWord, index: number): string => {
    if (currentWordIndex === index) {
      return alpha(theme.palette.secondary.main, 0.1);
    }
    
    if (selectedWord?.id === word.id) {
      return alpha(theme.palette.primary.main, 0.1);
    }
    
    if (analysisResults?.wordAnalysis) {
      const wordAnalysis = analysisResults.wordAnalysis.find(w => w.wordId === word.id);
      if (wordAnalysis) {
        if (wordAnalysis.confidence > 0.8) {
          return alpha(theme.palette.success.main, 0.1);
        } else if (wordAnalysis.confidence > 0.6) {
          return alpha(theme.palette.warning.main, 0.1);
        } else {
          return alpha(theme.palette.error.main, 0.1);
        }
      }
    }
    
    return 'transparent';
  };

  const getFontSize = (): string => {
    switch (settings.fontSize) {
      case 'small': return '1.5rem';
      case 'medium': return '2rem';
      case 'large': return '2.5rem';
      case 'xlarge': return '3rem';
      default: return '2rem';
    }
  };

  const renderWord = (word: QuranWord, index: number) => (
    <Box
      key={word.id}
      component="span"
      data-word-index={index}
      onClick={() => handleWordClick(word)}
      sx={{
        display: 'inline-block',
        margin: '0 0.25rem',
        padding: '0.125rem 0.25rem',
        borderRadius: 1,
        cursor: 'pointer',
        color: getWordColor(word, index),
        backgroundColor: getWordBackgroundColor(word, index),
        border: selectedWord?.id === word.id ? `2px solid ${theme.palette.primary.main}` : 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          transform: 'scale(1.05)',
        },
      }}
    >
      {formatArabicForDisplay(word.arabicText)}
    </Box>
  );

  const renderAnalysisChips = () => {
    if (!analysisResults) return null;

    return (
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          label={`Score: ${Math.round(analysisResults.overallScore)}%`}
          color={analysisResults.overallScore > 80 ? 'success' : 
                 analysisResults.overallScore > 60 ? 'warning' : 'error'}
          size="small"
        />
        <Chip
          label={`Timing: ${Math.round(analysisResults.timingAccuracy)}%`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`Pronunciation: ${Math.round(analysisResults.phonemeAccuracy)}%`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`Tajweed: ${Math.round(analysisResults.tajweedCompliance)}%`}
          variant="outlined"
          size="small"
        />
      </Stack>
    );
  };

  const renderSettingsPanel = () => {
    if (!showSettingsPanel) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Display Settings
          </Typography>
          
          <Stack spacing={2}>
            <FormControl size="small">
              <InputLabel>Font Size</InputLabel>
              <Select
                value={settings.fontSize}
                onChange={(e) => onSettingsChange({ fontSize: e.target.value as any })}
                label="Font Size"
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
                <MenuItem value="xlarge">Extra Large</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showTransliteration}
                  onChange={(e) => onSettingsChange({ showTransliteration: e.target.checked })}
                />
              }
              label="Show Transliteration"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showTranslation}
                  onChange={(e) => onSettingsChange({ showTranslation: e.target.checked })}
                />
              }
              label="Show Translation"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showTajweedColors}
                  onChange={(e) => onSettingsChange({ showTajweedColors: e.target.checked })}
                />
              }
              label="Tajweed Colors"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoScroll}
                  onChange={(e) => onSettingsChange({ autoScroll: e.target.checked })}
                />
              }
              label="Auto Scroll"
            />
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Surah {verse.metadata.surahName} - Verse {verse.verseNumber}
            </Typography>
            
            <Stack direction="row" spacing={1}>
              {showSettings && (
                <Tooltip title="Settings">
                  <IconButton
                    onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                    color={showSettingsPanel ? 'primary' : 'default'}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Play Verse">
                <IconButton onClick={handlePlayVerse} color="primary">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Bookmark">
                <IconButton>
                  <BookmarkIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Share">
                <IconButton>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Analysis Results */}
          {renderAnalysisChips()}

          {/* Arabic Text */}
          <Box
            ref={containerRef}
            sx={{
              direction: 'rtl',
              textAlign: 'right',
              fontSize: getFontSize(),
              lineHeight: 2,
              fontFamily: 'Amiri, "Times New Roman", serif',
              mb: 3,
              p: 2,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            {verse.words.map((word, index) => renderWord(word, index))}
          </Box>

          {/* Transliteration */}
          {settings.showTransliteration && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {verse.transliteration}
              </Typography>
            </Box>
          )}

          {/* Translation */}
          {settings.showTranslation && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                {verse.translation}
              </Typography>
            </Box>
          )}

          {/* Selected Word Details */}
          {selectedWord && (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Word Details
                </Typography>
                <Typography variant="h5" sx={{ direction: 'rtl', mb: 1 }}>
                  {formatArabicForDisplay(selectedWord.arabicText)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transliteration: {selectedWord.transliteration}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Translation: {selectedWord.translation}
                </Typography>
                {analysisResults?.wordAnalysis && (
                  <>
                    {(() => {
                      const wordAnalysis = analysisResults.wordAnalysis.find(w => w.wordId === selectedWord.id);
                      return wordAnalysis ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            Confidence: {Math.round(wordAnalysis.confidence * 100)}%
                          </Typography>
                          <Typography variant="caption" display="block">
                            Timing: {wordAnalysis.timingDeviation > 0 ? '+' : ''}{Math.round(wordAnalysis.timingDeviation * 1000)}ms
                          </Typography>
                          {wordAnalysis.suggestions.length > 0 && (
                            <Typography variant="caption" display="block" color="primary">
                              Suggestion: {wordAnalysis.suggestions[0]}
                            </Typography>
                          )}
                        </Box>
                      ) : null;
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {renderSettingsPanel()}
    </Box>
  );
};