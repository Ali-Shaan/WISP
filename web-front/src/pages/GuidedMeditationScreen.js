import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Button,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ArrowBack as ArrowBackIcon,
  Air as WindIcon,
  Person as HumanIcon,
  Favorite as HeartIcon,
  DirectionsWalk as WalkIcon
} from '@mui/icons-material';

import breathingMeditation from '../assets/Guided Meditation/Breathing Meditation.mp3';
import bodyScan from '../assets/Guided Meditation/Body Scan.mp3';
import lovingKindness from '../assets/Guided Meditation/Loving-Kindess.mp3';
import mindfulWalking from '../assets/Guided Meditation/Mindful Walking.mp3';

const GuidedMeditationScreen = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayingModalOpen, setIsPlayingModalOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [nextMeditation, setNextMeditation] = useState(null);

  // Meditation data
  const meditations = [
    {
      id: 1,
      title: 'Breathing Meditation',
      description: 'Calming breathing exercises for stress reduction',
      audioFile: breathingMeditation,
      icon: 'wind'
    },
    {
      id: 2,
      title: 'Body Scan',
      description: 'Progressive relaxation for physical tension release',
      audioFile: bodyScan,
      icon: 'human'
    },
    {
      id: 3,
      title: 'Loving-Kindness',
      description: 'Cultivate compassion and positive emotions',
      audioFile: lovingKindness,
      icon: 'heart'
    },
    {
      id: 4,
      title: 'Mindful Walking',
      description: 'Practice mindfulness through walking meditation',
      audioFile: mindfulWalking,
      icon: 'walk'
    }
  ];

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (currentTrack) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = currentTrack.audioFile;
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current.duration * 1000);
        setLoading(false);
        if (isPlaying) {
          audioRef.current.play();
        }
      };
      audioRef.current.onended = () => {
        handleMeditationComplete();
      };
      audioRef.current.ontimeupdate = () => {
        setPosition(audioRef.current.currentTime * 1000);
      };
      audioRef.current.onerror = () => {
        setLoading(false);
        alert('Error loading audio file. Please try again.');
      };
    }
  }, [currentTrack]);

  const handleMeditationComplete = () => {
    if (!currentTrack) return;
    
    const currentIndex = meditations.findIndex(m => m.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % meditations.length;
    const nextTrack = meditations[nextIndex];
    
    setIsPlaying(false);
    setNextMeditation(nextTrack);
    setCompletionDialogOpen(true);
  };

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onSliderValueChange = (event, value) => {
    if (audioRef.current && !loading) {
      const newPosition = value / 1000;
      audioRef.current.currentTime = newPosition;
      setPosition(value);
    }
  };

  const handlePlayPause = (meditation) => {
    if (loading) return;

    if (currentTrack && meditation.id === currentTrack.id) {
      // Toggle current track
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          alert('Unable to play audio. Please try again.');
        });
        setIsPlaying(true);
      }
    } else {
      // Start a new track
      setLoading(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentTrack(meditation);
      setIsPlaying(true);
      setIsPlayingModalOpen(true);
    }
  };

  const getIconForMeditation = (iconName) => {
    switch (iconName) {
      case 'wind':
        return <WindIcon />;
      case 'human':
        return <HumanIcon />;
      case 'heart':
        return <HeartIcon />;
      case 'walk':
        return <WalkIcon />;
      default:
        return <PlayIcon />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Guided Meditation
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        {meditations.map((meditation) => (
          <Card key={meditation.id} sx={{ mb: 2, borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Box sx={{ mr: 2 }}>
                  {getIconForMeditation(meditation.icon)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {meditation.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {meditation.description}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                sx={{
                  bgcolor: currentTrack?.id === meditation.id && isPlaying ? 'primary.dark' : 'primary.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 48, 
                  height: 48
                }}
                onClick={() => handlePlayPause(meditation)}
                disabled={loading}
              >
                {loading && currentTrack?.id === meditation.id ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  currentTrack?.id === meditation.id && isPlaying ? <PauseIcon /> : <PlayIcon />
                )}
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Now Playing Dialog */}
      <Dialog 
        open={isPlayingModalOpen} 
        onClose={() => { if (!isPlaying) setIsPlayingModalOpen(false) }}
        fullWidth
        maxWidth="sm"
      >
        {currentTrack && (
          <>
            <DialogTitle sx={{ textAlign: 'center' }}>
              {currentTrack.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(position)}
                  </Typography>
                  <Slider
                    sx={{ mx: 2, flex: 1 }}
                    min={0}
                    max={duration || 100}
                    value={position}
                    onChange={(e, val) => setPosition(val)}
                    onChangeCommitted={onSliderValueChange}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(duration)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <IconButton 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 64, 
                      height: 64 
                    }}
                    onClick={() => handlePlayPause(currentTrack)}
                  >
                    {isPlaying ? <PauseIcon fontSize="large" /> : <PlayIcon fontSize="large" />}
                  </IconButton>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button onClick={() => setIsPlayingModalOpen(false)} variant="outlined">
                Close Player
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Meditation Complete Dialog */}
      <Dialog
        open={completionDialogOpen}
        onClose={() => setCompletionDialogOpen(false)}
      >
        <DialogTitle>Meditation Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Would you like to continue with the next meditation?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCompletionDialogOpen(false);
          }} variant="outlined">
            No
          </Button>
          <Button onClick={() => {
            setCompletionDialogOpen(false);
            if (nextMeditation) {
              handlePlayPause(nextMeditation);
            }
          }} variant="contained" color="primary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GuidedMeditationScreen;