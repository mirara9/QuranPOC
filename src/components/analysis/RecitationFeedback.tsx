import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as ImprovementIcon,
  PlayArrow as PlayIcon,
  School as LearnIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material';
import { 
  RecitationAnalysis, 
  DTWAnalysisResult 
} from '../../types/quran';

interface RecitationFeedbackProps {
  analysis: RecitationAnalysis;
  dtwResults?: DTWAnalysisResult;
  onPlayExample?: (audioUrl: string) => void;
  onRetryWord?: (wordId: string) => void;
  onShowLearningMaterial?: (topic: string) => void;
  showDetailedAnalysis?: boolean;
}

export const RecitationFeedback: React.FC<RecitationFeedbackProps> = ({
  analysis,
  dtwResults,
  onPlayExample,
  onRetryWord,
  onShowLearningMaterial,
  showDetailedAnalysis = true,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const renderOverviewSection = () => (
    <Accordion 
      expanded={expandedSection === 'overview'} 
      onChange={handleAccordionChange('overview')}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Overall Performance</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          {/* Overall Score */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getScoreIcon(analysis.overallScore)}
              <Typography variant="h4" sx={{ ml: 1 }}>
                {analysis.overallScore}%
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
                Overall Score
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={analysis.overallScore}
              color={getScoreColor(analysis.overallScore)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Performance Metrics */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              icon={getScoreIcon(analysis.timingAccuracy)}
              label={`Timing: ${analysis.timingAccuracy}%`}
              color={getScoreColor(analysis.timingAccuracy)}
              variant="outlined"
            />
            <Chip
              icon={getScoreIcon(analysis.phonemeAccuracy)}
              label={`Pronunciation: ${analysis.phonemeAccuracy}%`}
              color={getScoreColor(analysis.phonemeAccuracy)}
              variant="outlined"
            />
            <Chip
              icon={getScoreIcon(analysis.tajweedCompliance)}
              label={`Tajweed: ${analysis.tajweedCompliance}%`}
              color={getScoreColor(analysis.tajweedCompliance)}
              variant="outlined"
            />
          </Stack>

          {/* Quick Summary */}
          <Alert 
            severity={analysis.overallScore >= 80 ? 'success' : 
                     analysis.overallScore >= 60 ? 'warning' : 'error'}
            sx={{ mt: 2 }}
          >
            <AlertTitle>
              {analysis.overallScore >= 80 ? 'Excellent Recitation!' :
               analysis.overallScore >= 60 ? 'Good Progress' : 'Needs Improvement'}
            </AlertTitle>
            {analysis.overallScore >= 80 
              ? 'Your recitation shows strong mastery of pronunciation and timing.'
              : analysis.overallScore >= 60
              ? 'You\'re making good progress. Focus on the areas highlighted below.'
              : 'There\'s room for improvement. Don\'t worry - practice makes perfect!'}
          </Alert>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderWordAnalysisSection = () => (
    <Accordion 
      expanded={expandedSection === 'words'} 
      onChange={handleAccordionChange('words')}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Word-by-Word Analysis</Typography>
        <Chip 
          label={`${analysis.wordAnalysis.length} words`} 
          size="small" 
          sx={{ ml: 2 }} 
        />
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {analysis.wordAnalysis.map((wordAnalysis, index) => (
            <Card key={wordAnalysis.wordId} variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      Word {index + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={wordAnalysis.confidence * 100}
                        color={getScoreColor(wordAnalysis.confidence * 100)}
                        sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(wordAnalysis.confidence * 100)}%
                      </Typography>
                    </Box>
                    
                    {/* Detailed metrics */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        label={`Timing: ${wordAnalysis.timingDeviation > 0 ? '+' : ''}${Math.round(wordAnalysis.timingDeviation * 1000)}ms`}
                        size="small"
                        color={Math.abs(wordAnalysis.timingDeviation) < 0.2 ? 'success' : 'warning'}
                        variant="outlined"
                      />
                      <Chip
                        label={`Phonemes: ${wordAnalysis.phonemeMatches}/${wordAnalysis.phonemeTotal}`}
                        size="small"
                        color={wordAnalysis.phonemeMatches === wordAnalysis.phonemeTotal ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Stack>

                    {/* Suggestions */}
                    {wordAnalysis.suggestions.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {wordAnalysis.suggestions.map((suggestion, i) => (
                          <Typography key={i} variant="caption" color="primary" display="block">
                            💡 {suggestion}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ ml: 2 }}>
                    <Tooltip title="Retry this word">
                      <IconButton 
                        onClick={() => onRetryWord?.(wordAnalysis.wordId)}
                        size="small"
                        color="primary"
                      >
                        <PlayIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderTajweedErrorsSection = () => (
    <Accordion 
      expanded={expandedSection === 'tajweed'} 
      onChange={handleAccordionChange('tajweed')}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Tajweed Analysis</Typography>
        <Chip 
          label={analysis.detectedErrors.length === 0 ? 'No errors' : `${analysis.detectedErrors.length} issues`}
          color={analysis.detectedErrors.length === 0 ? 'success' : 'warning'}
          size="small" 
          sx={{ ml: 2 }} 
        />
      </AccordionSummary>
      <AccordionDetails>
        {analysis.detectedErrors.length === 0 ? (
          <Alert severity="success">
            <AlertTitle>Excellent Tajweed!</AlertTitle>
            No tajweed errors were detected in your recitation.
          </Alert>
        ) : (
          <List dense>
            {analysis.detectedErrors.map((error, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {error.severity === 'major' ? (
                    <ErrorIcon color="error" />
                  ) : error.severity === 'moderate' ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <CheckCircleIcon color="info" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={error.description}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {error.correction}
                      </Typography>
                      {error.audioExample && (
                        <Button
                          size="small"
                          startIcon={<PlayIcon />}
                          onClick={() => onPlayExample?.(error.audioExample!)}
                          sx={{ mt: 0.5 }}
                        >
                          Listen to Example
                        </Button>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  );

  const renderDTWAnalysisSection = () => {
    if (!dtwResults || !showDetailedAnalysis) return null;

    return (
      <Accordion 
        expanded={expandedSection === 'dtw'} 
        onChange={handleAccordionChange('dtw')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Advanced Analysis (DTW/HMM)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              This analysis uses Dynamic Time Warping and Hidden Markov Models for precise comparison.
            </Typography>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Alignment Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={dtwResults.alignmentScore}
                color={getScoreColor(dtwResults.alignmentScore)}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {dtwResults.alignmentScore}% - Measures how well your timing aligns with the reference
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Detected Phonemes
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {dtwResults.detectedPhonemes.map((phoneme, index) => (
                  <Chip
                    key={index}
                    label={phoneme}
                    size="small"
                    color={dtwResults.confidenceScores[index] > 0.8 ? 'success' : 'warning'}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Warping Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warping Distance: {dtwResults.warping.distance.toFixed(3)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Lower values indicate better timing alignment with the reference recitation.
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderRecommendationsSection = () => (
    <Accordion 
      expanded={expandedSection === 'recommendations'} 
      onChange={handleAccordionChange('recommendations')}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Recommendations</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {analysis.recommendations.map((recommendation, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <TipIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={recommendation} />
            </ListItem>
          ))}
        </List>

        {dtwResults?.recommendedImprovements && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Specific Areas for Improvement
            </Typography>
            
            {dtwResults.recommendedImprovements.timing.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="primary" gutterBottom>
                  ⏱️ Timing
                </Typography>
                <List dense>
                  {dtwResults.recommendedImprovements.timing.map((tip, index) => (
                    <ListItem key={index} sx={{ pl: 2 }}>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {dtwResults.recommendedImprovements.pronunciation.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="primary" gutterBottom>
                  🗣️ Pronunciation
                </Typography>
                <List dense>
                  {dtwResults.recommendedImprovements.pronunciation.map((tip, index) => (
                    <ListItem key={index} sx={{ pl: 2 }}>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {dtwResults.recommendedImprovements.tajweed.length > 0 && (
              <Box>
                <Typography variant="body2" color="primary" gutterBottom>
                  📿 Tajweed
                </Typography>
                <List dense>
                  {dtwResults.recommendedImprovements.tajweed.map((tip, index) => (
                    <ListItem key={index} sx={{ pl: 2 }}>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<LearnIcon />}
            onClick={() => onShowLearningMaterial?.('pronunciation')}
            sx={{ mr: 2, mb: 1 }}
          >
            Practice Exercises
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImprovementIcon />}
            onClick={() => onShowLearningMaterial?.('improvement')}
            sx={{ mb: 1 }}
          >
            Improvement Guide
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Recitation Analysis Results
      </Typography>

      {renderOverviewSection()}
      {renderWordAnalysisSection()}
      {renderTajweedErrorsSection()}
      {renderDTWAnalysisSection()}
      {renderRecommendationsSection()}
    </Box>
  );
};