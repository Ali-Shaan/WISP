import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Paper,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  Divider,
  Grid
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  MusicNote as MusicNoteIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { API_URL } from '../config';

import arriving from '../assets/Music Therapy/Arriving.mp3';
import ascendingDawnSky from '../assets/Music Therapy/Ascending, Dawn Sky.mp3';
import deepInTheGlowingHeart from '../assets/Music Therapy/Deep In The Glowing Heart.mp3';
import loveFlowsOverUs from '../assets/Music Therapy/Love Flows Over Us In Prismatic Waves.mp3';
import tayosCaves1 from '../assets/Music Therapy/Tayos Caves, Ecuador i.mp3';
import tayosCaves2 from '../assets/Music Therapy/Tayos Caves, Ecuador ii.mp3';
import tayosCaves3 from '../assets/Music Therapy/Tayos Caves, Ecuador iii.mp3';

const PLAYLISTS_DATA = [
  {
    id: '1',
    title: 'Relaxation & Calm',
    description: 'Soothing melodies to help you relax and find inner peace',
    duration: '25 min',
    tracks: [
      {
        id: '1-1',
        title: 'Arriving',
        duration: '5:30',
        audioFile: arriving
      },
      {
        id: '1-2',
        title: 'Ascending Dawn Sky',
        duration: '6:15',
        audioFile: ascendingDawnSky
      },
      {
        id: '1-3',
        title: 'Deep In The Glowing Heart',
        duration: '7:20',
        audioFile: deepInTheGlowingHeart
      }
    ]
  },
  {
    id: '2',
    title: 'Ambient Journey',
    description: 'Immersive ambient soundscapes for deep focus and meditation',
    duration: '35 min',
    tracks: [
      {
        id: '2-1',
        title: 'Love Flows Over Us',
        duration: '8:45',
        audioFile: loveFlowsOverUs
      },
      {
        id: '2-2',
        title: 'Tayos Caves I',
        duration: '6:30',
        audioFile: tayosCaves1
      },
      {
        id: '2-3',
        title: 'Tayos Caves II',
        duration: '7:15',
        audioFile: tayosCaves2
      },
      {
        id: '2-4',
        title: 'Tayos Caves III',
        duration: '8:00',
        audioFile: tayosCaves3
      }
    ]
  }
];

const MusicTherapyScreen = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [tempSliderPosition, setTempSliderPosition] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [speedMenuAnchorEl, setSpeedMenuAnchorEl] = useState(null);
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setPlaylists(PLAYLISTS_DATA);
    setLoading(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const startProgressTimer = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Create new interval to update position
    intervalRef.current = setInterval(() => {
      if (audioRef.current && !isSeeking) {
        setPosition(audioRef.current.currentTime);
      }
    }, 1000);
  };

  const handleSelectTrack = (track) => {
    try {
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }

      setCurrentTrack(track);
      setPosition(0);
      setDuration(0);
      setIsPlaying(false);
      setSpeed(1.0);
      setLoading(true);

      // Create new audio element
      const audio = new Audio(track.audioFile);
      audio.playbackRate = 1.0;
      
      // Setup event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        setLoading(false);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setPosition(0);
        audio.currentTime = 0;
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setError('Failed to load audio file');
        setLoading(false);
      });

      audioRef.current = audio;
    } catch (err) {
      console.error('Error selecting track:', err);
      setError('Failed to load audio track');
      setLoading(false);
    }
  };

  const handleSeek = (_, value) => {
    setPosition(value);
    setTempSliderPosition(value);
    setIsSeeking(true);
  };

  const handleSeekCommitted = (_, value) => {
    setIsSeeking(false);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleSpeedChange = (newSpeed) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
    setSpeedMenuAnchorEl(null);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      clearInterval(intervalRef.current);
    } else {
      audioRef.current.play();
      startProgressTimer();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPosition(0);
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const renderPlayer = () => {
    if (!currentTrack) {
      return null;
    }

    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <MusicNoteIcon sx={{ mr: 1 }} />
            {currentTrack.title}
          </Typography>
        </Box>

        <Box sx={{ width: '100%', mb: 2 }}>
          <Slider
            value={isSeeking ? tempSliderPosition : position}
            max={duration}
            onChange={handleSeek}
            onChangeCommitted={handleSeekCommitted}
            aria-labelledby="audio-slider"
            sx={{ color: '#6200ee' }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {formatTime(position)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
            onClick={handlePlayPause}
            disabled={loading}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={handleStop}
            disabled={loading}
          >
            Stop
          </Button>
          <Button
            variant="outlined"
            startIcon={<SpeedIcon />}
            onClick={(e) => setSpeedMenuAnchorEl(e.currentTarget)}
            disabled={loading}
          >
            {speed}x
          </Button>
          <Menu
            anchorEl={speedMenuAnchorEl}
            open={Boolean(speedMenuAnchorEl)}
            onClose={() => setSpeedMenuAnchorEl(null)}
          >
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <MenuItem 
                key={rate} 
                onClick={() => handleSpeedChange(rate)}
                selected={speed === rate}
              >
                {rate}x
              </MenuItem>
            ))}
          </Menu>
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Just simulate refresh since we're using mock data
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Music Therapy
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Listen to therapeutic music to improve your mood and well-being
        </Typography>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {renderPlayer()}

      <Box sx={{ mb: 4 }}>
        {playlists.map((playlist) => (
          <Paper key={playlist.id} elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" component="h2">
                {playlist.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {playlist.duration}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {playlist.description}
              </Typography>
            </Box>
            
            <Divider />
            
            <Accordion disableGutters>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="tracks-content"
                id="tracks-header"
              >
                <Typography>Tracks</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List sx={{ width: '100%', p: 0 }}>
                  {playlist.tracks.map((track) => (
                    <ListItem 
                      key={track.id}
                      secondaryAction={
                        currentTrack?.id === track.id ? (
                          <IconButton
                            edge="end"
                            onClick={handlePlayPause}
                            color="primary"
                          >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                          </IconButton>
                        ) : (
                          <IconButton
                            edge="end"
                            onClick={() => handleSelectTrack(track)}
                            color="primary"
                          >
                            <PlayIcon />
                          </IconButton>
                        )
                      }
                      divider
                    >
                      <ListItemIcon>
                        <MusicNoteIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={track.title}
                        secondary={track.duration}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Paper>
        ))}
      </Box>
    </Container>
  );
};

export default MusicTherapyScreen;
