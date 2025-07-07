import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Container,
  Paper
} from '@mui/material';
import { MusicNote, PlayArrow, Pause, PlayCircle } from '@mui/icons-material';

const TherapyScreen = () => {
  const navigate = useNavigate();
  const [showSedonaDialog, setShowSedonaDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const musicPlaylists = [
    {
      id: '1',
      title: 'Calming Meditation',
      description: 'Peaceful melodies for deep relaxation',
      duration: '45 min',
      tracks: 8,
    },
    {
      id: '2',
      title: 'Stress Relief',
      description: 'Soothing sounds to reduce anxiety',
      duration: '30 min',
      tracks: 6,
    },
    {
      id: '3',
      title: 'Sleep Better',
      description: 'Gentle music for better sleep',
      duration: '60 min',
      tracks: 10,
    },
  ];

  const sedonaSteps = [
    {
      id: '1',
      title: 'Welcome',
      description: 'Introduction to the Sedona Method',
      duration: '2 min',
    },
    {
      id: '2',
      title: 'Letting Go',
      description: 'Release negative emotions and thoughts',
      duration: '5 min',
    },
    {
      id: '3',
      title: 'Acceptance',
      description: 'Practice accepting the present moment',
      duration: '5 min',
    },
    {
      id: '4',
      title: 'Gratitude',
      description: 'Cultivate feelings of gratitude',
      duration: '3 min',
    },
  ];

  const handlePlayMusic = (playlistId) => {
    // In a real app, this would start playing the music
    setIsPlaying(!isPlaying);
    // You might add audio playback logic here
    console.log(`Playing playlist: ${playlistId}`);
  };

  const startSedonaMethod = () => {
    setShowSedonaDialog(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < sedonaSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSedonaDialog(false);
      setCurrentStep(0);
    }
  };

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh', py: 2 }}>
      <Container maxWidth="md">
        <Card sx={{ mb: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 1, textAlign: 'center' }}>Music Therapy</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#666', textAlign: 'center' }}>
              Curated playlists for emotional well-being
            </Typography>
            
            <List>
              {musicPlaylists.map(playlist => (
                <ListItem key={playlist.id} divider sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <MusicNote />
                  </ListItemIcon>
                  <ListItemText
                    primary={playlist.title}
                    secondary={`${playlist.description}\n${playlist.duration} • ${playlist.tracks} tracks`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                      onClick={() => handlePlayMusic(playlist.id)}
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 1, textAlign: 'center' }}>Sedona Method</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#666', textAlign: 'center' }}>
              A powerful technique for releasing negative emotions and achieving emotional freedom
            </Typography>
            <Button
              variant="contained"
              onClick={startSedonaMethod}
              startIcon={<PlayCircle />}
              sx={{ mt: 2, display: 'block', mx: 'auto' }}
            >
              Start Exercise
            </Button>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={showSedonaDialog} onClose={() => setShowSedonaDialog(false)}>
        <DialogTitle>{sedonaSteps[currentStep]?.title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 16, mb: 1 }}>
            {sedonaSteps[currentStep]?.description}
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#666', mb: 2 }}>
            Duration: {sedonaSteps[currentStep]?.duration}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(currentStep + 1) / sedonaSteps.length * 100} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSedonaDialog(false)}>Exit</Button>
          <Button onClick={nextStep} variant="contained">
            {currentStep < sedonaSteps.length - 1 ? 'Next Step' : 'Finish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TherapyScreen;