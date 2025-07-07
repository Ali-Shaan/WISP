import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  LinearProgress,
  CircularProgress,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import {
  Mood as MoodIcon,
  MenuBook as JournalIcon,
  LocalDrink as WaterIcon,
  Psychology as MindfulnessIcon,
  MusicNote as MusicIcon,
  Spa as TherapyIcon,
  Forum as CommunityIcon,
  LocalHospital as EmergencyIcon,
  Doorbell as DoorbellIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const HomeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyQuote, setDailyQuote] = useState({ text: '', author: '' });
  const [moodData, setMoodData] = useState({ currentMood: 'neutral', streak: 0 });
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  const [moodError, setMoodError] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [showMoodBanner, setShowMoodBanner] = useState(false);
  const [showJournalBanner, setShowJournalBanner] = useState(false);
  const [showWaterBanner, setShowWaterBanner] = useState(false);
  const [waterProgress, setWaterProgress] = useState({ currentIntakeMl: 0, goalMl: 2000 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    content: '',
    actions: []
  });

  useEffect(() => {
    const initializeScreen = async () => {
      setLoading(true);
      await loadUserData();
      await fetchDailyQuote();
      await fetchMoodData();
      await checkDailyActivities();
      setLoading(false);
    };
    initializeScreen();
  }, []);

  const checkDailyActivities = async () => {
    try {
      const lastMoodCheck = localStorage.getItem('lastMoodCheck');
      const lastJournalCheck = localStorage.getItem('lastJournalCheck');
      const lastWaterCheck = localStorage.getItem('lastWaterCheck');
      const today = new Date().toDateString();

      if (lastMoodCheck !== today) {
        setShowMoodBanner(true);
      }

      if (lastJournalCheck !== today) {
        setShowJournalBanner(true);
      }

      if (lastWaterCheck !== today) {
        setShowWaterBanner(true);
      }
    } catch (error) {
      console.error('Error checking daily activities:', error);
    }
  };

  const loadUserData = useCallback(async () => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        setUsername(userData.username || '');
        setProfileImage(userData.profile_image || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUsername('');
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("[HomeScreen] Page loaded/changed, reloading profile data.");
    loadUserData();
    fetchDailyQuote();
    fetchMoodData();
  }, [location.pathname, loadUserData]);

  const fallbackQuotes = [
    { text: "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.", author: "Unknown" },
    { text: "You are not alone in this journey. Every step forward is progress.", author: "Unknown" },
    { text: "Self-care is not selfish. You cannot serve from an empty vessel.", author: "Eleanor Brown" },
    { text: "It's okay to take a moment to rest and recharge.", author: "Unknown" },
    { text: "Your feelings are valid. Your emotions matter. Your journey is important.", author: "Unknown" },
    { text: "Small steps still move you forward. Progress isn't always visible, but it's happening.", author: "Unknown" },
    { text: "You are stronger than you think and braver than you believe.", author: "A.A. Milne" },
    { text: "Recovery is not linear. Be patient with yourself.", author: "Unknown" },
    { text: "Every day is a new beginning. Take a deep breath and start again.", author: "Unknown" },
    { text: "Your worth is not measured by your productivity.", author: "Unknown" },
    { text: "It's okay to not be okay. It's okay to ask for help.", author: "Unknown" },
    { text: "Peace begins with a smile.", author: "Mother Teresa" },
    { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { text: "Happiness can be found even in the darkest of times if one only remembers to turn on the light.", author: "Albus Dumbledore" },
    { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
    { text: "Be gentle with yourself. You're doing the best you can.", author: "Unknown" },
    { text: "The sun will rise, and we will try again.", author: "Unknown" },
    { text: "Sometimes the smallest step in the right direction ends up being the biggest step of your life.", author: "Unknown" },
    { text: "You are worthy of peace, joy, and all things good.", author: "Unknown" },
    { text: "Never Surrender!!", author: "Ahmad Hashmi" },
    { text: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson" },
    { text: "The only way out of the labyrinth of suffering is to forgive.", author: "John Green" },
    { text: "You are enough just as you are.", author: "Mark Darcy" },
    { text: "Your life is your story, and the adventure ahead of you is the journey to fulfill your own purpose and potential.", author: "Kerry Washington" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },  
    { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi" }
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    const rotateQuotes = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % fallbackQuotes.length);
    }, 15000);
    return () => clearInterval(rotateQuotes);
  }, []);

  const fetchDailyQuote = async () => {
    setQuoteLoading(true);
    setQuoteError('');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication required');
      const response = await axios.get(`${API_URL}/quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.text && response.data.author) {
        setDailyQuote(response.data);
      } else {
        setDailyQuote(fallbackQuotes[currentQuoteIndex]);
      }
    } catch (error) {
      setDailyQuote(fallbackQuotes[currentQuoteIndex]);
    } finally {
      setQuoteLoading(false);
    }
  };

  const fetchMoodData = async () => {
    setMoodError('');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No token');
      const response = await axios.get(`${API_URL}/moods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const latestMood = response.data[response.data.length - 1];
        setMoodData({
          currentMood: latestMood.mood,
          streak: response.data.length
        });
      } else {
        setMoodData({ currentMood: 'neutral', streak: 0 });
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
      setMoodError('Could not load mood data.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await fetchDailyQuote();
    await fetchMoodData();
    await checkDailyActivities();
    setRefreshing(false);
  };

  const allFeatures = [
    {
      key: 'MoodTracker',
      title: 'Mood Tracker',
      icon: MoodIcon,
      screen: '/mood-tracker',
      description: 'Track your daily moods'
    },
    {
      key: 'Journal',
      title: 'Journal',
      icon: JournalIcon,
      screen: '/journal',
      description: 'Write your thoughts'
    },
    {
      key: 'GuidedMeditation',
      title: 'Meditation',
      icon: MindfulnessIcon,
      screen: '/guided-meditation',
      description: 'Practice guided meditation'
    },
    {
      key: 'SedonaMethod',
      title: 'Sedona Method',
      icon: TherapyIcon,
      screen: '/sedona-method',
      description: 'Learn the Sedona Method technique'
    },
    {
      key: 'MusicTherapy',
      title: 'Music Therapy',
      icon: MusicIcon,
      screen: '/music-therapy',
      description: 'Listen to therapeutic music'
    },
    {
      key: 'MindfulnessReminders',
      title: 'Reminders',
      icon: DoorbellIcon,
      screen: '/reminders',
      description: 'Set mindfulness practice reminders'
    },
    {
      key: 'WaterReminders',
      title: 'Water Intake',
      icon: WaterIcon,
      screen: '/water-reminders',
      description: 'Track your daily water intake'
    },
    {
      key: 'ProfessionalSupport',
      title: 'Support',
      icon: EmergencyIcon,
      screen: '/support-resources',
      description: 'Access professional support resources'
    },
    {
      key: 'EmergencyButton',
      title: 'Emergency Support',
      icon: EmergencyIcon,
      screen: '/emergency-support',
      color: '#FFFFFF',
      backgroundColor: '#D32F2F',
      description: 'Get immediate support in crisis'
    },
  ];

  const emergencyFeature = allFeatures.find(f => f.key === 'EmergencyButton');
  const mainFeatures = allFeatures.filter(f => f.key !== 'EmergencyButton');

  const renderFeatureGrid = () => {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gridTemplateRows: 'repeat(2, 1fr)',
          gridColumnGap: '7px',
          gridRowGap: '10px',
          mt: 3,
        }}
      >
        {mainFeatures.map((feature) => (
          <Card
            key={feature.key}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              p: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              backgroundColor: 'rgb(255, 255, 255)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
              }
            }}
            onClick={() => {
              if (feature.screen) {
                navigate(feature.screen);
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
              {React.createElement(feature.icon, {
                sx: { fontSize: 40, color: feature.color || 'primary.main', mb: 1 }
              })}
              <Typography variant="h6" component="div" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {feature.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  const renderEmergencyButton = () => {
    if (!emergencyFeature) return null;
    return (
      <Button
        variant="contained"
        startIcon={React.createElement(emergencyFeature.icon)}
        sx={{
          backgroundColor: emergencyFeature.backgroundColor || '#D32F2F',
          color: emergencyFeature.color || '#FFFFFF',
          fontWeight: 'bold',
          py: 1.5,
          px: 3,
          borderRadius: 2,
          boxShadow: 3,
          width: '100%',
          mt: 2,
          mb: 3,
          '&:hover': {
            backgroundColor: '#B71C1C'
          }
        }}
        onClick={() => {
          if (emergencyFeature.screen) {
            navigate(emergencyFeature.screen);
          } else {
            handleEmergencyPress();
          }
        }}
      >
        {emergencyFeature.title}
      </Button>
    );
  };

  const renderHeader = () => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            {profileImage ? (
              <Avatar
                src={`data:image/jpeg;base64,${profileImage}`}
                sx={{ width: 48, height: 48, mr: 2 }}
              />
            ) : (
              <Avatar
                sx={{ bgcolor: 'primary.main', width: 48, height: 48, mr: 2 }}
              >
                {(username || 'U').substring(0, 2).toUpperCase()}
              </Avatar>
            )}
          </Box>
          <Typography variant="subtitle1">
            Welcome back,
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', ml: 0.5 }}>
            {username || 'Friend'}!
          </Typography>
        </Box>
        <IconButton
          onClick={() => navigate('/profile')}
          aria-label="profile settings"
          sx={{ color: 'primary.main' }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
    );
  };

  const renderQuoteWidget = () => {
    if (quoteLoading) return <CircularProgress sx={{ my: 3, mx: 'auto', display: 'block' }} />;
    const quoteToShow = dailyQuote.text ? dailyQuote : fallbackQuotes[currentQuoteIndex];

    return (
      <Card
        sx={{
          my: 3,
          p: 2,
          boxShadow: 2,
          borderRadius: 2,
          backgroundColor: '#f8f9ff',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)'
          }
        }}
        onClick={fetchDailyQuote}
      >
        <CardContent>
          <Typography
            variant="body1"
            sx={{
              fontStyle: 'italic',
              mb: 1,
              lineHeight: 1.6,
              fontSize: '1.1rem',
              textAlign: 'center'
            }}
          >
            "{quoteToShow.text}"
          </Typography>
          {quoteToShow.author && quoteToShow.author !== 'Unknown' && (
            <Typography
              variant="body2"
              sx={{
                textAlign: 'right',
                color: 'text.secondary',
                fontWeight: 'medium'
              }}
            >
              — {quoteToShow.author}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleEmergencyPress = () => {
    setDialogConfig({
      title: 'Emergency Support',
      content: 'Are you experiencing a mental health emergency?',
      actions: [
        {
          text: 'Call Emergency Services',
          onClick: () => window.location.href = 'tel:1122',
          color: 'error',
          variant: 'contained'
        },
        {
          text: 'View Crisis Resources',
          onClick: () => navigate('/support-resources'),
          color: 'primary',
          variant: 'contained'
        },
        {
          text: 'Cancel',
          onClick: () => setDialogOpen(false),
          color: 'inherit',
          variant: 'outlined'
        }
      ]
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    const waterCheckInterval = setInterval(() => checkWaterIntake(), 3600000);
    return () => {
      clearInterval(waterCheckInterval);
    };
  }, []);

  const checkWaterIntake = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;
      const response = await axios.get(`${API_URL}/water/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        const progress = response.data;
        setWaterProgress(progress);
        setShowWaterBanner(progress.currentIntakeMl < (progress.goalMl * 0.75));
      }
    } catch (error) {
      console.error('Error checking water intake:', error);
    }
  };

  const renderBanners = () => {
    return (
      <Box sx={{ mb: 3 }}>
        {showMoodBanner && (
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f5f0ff'
            }}
          >
            <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
              <MoodIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Time for a mood check!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  How are you feeling today?
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  sx={{ mr: 1 }}
                  onClick={() => {
                    navigate('/mood-tracker');
                    setShowMoodBanner(false);
                    localStorage.setItem('lastMoodCheck', new Date().toDateString());
                  }}
                >
                  Log Mood
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setShowMoodBanner(false)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}
        {showJournalBanner && (
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f0f9f0'
            }}
          >
            <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
              <JournalIcon sx={{ fontSize: 32, color: '#4CAF50', mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Write in Your Journal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Take a moment to reflect on your day
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mr: 1, bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
                  onClick={() => {
                    navigate('/new-journal');
                    setShowJournalBanner(false);
                    localStorage.setItem('lastJournalCheck', new Date().toDateString());
                  }}
                >
                  Write Entry
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setShowJournalBanner(false)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}

        {showWaterBanner && (
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f0f8ff'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WaterIcon sx={{ fontSize: 32, color: '#2196F3', mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Stay Hydrated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Log your water intake today
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setShowWaterBanner(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <LinearProgress
              variant="determinate"
              value={(waterProgress.currentIntakeMl / waterProgress.goalMl) * 100}
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
            />

            <Box sx={{ alignSelf: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: '#2196F3', '&:hover': { bgcolor: '#1976D2' } }}
                onClick={() => {
                  navigate('/water-reminders');
                  setShowWaterBanner(false);
                  localStorage.setItem('lastWaterCheck', new Date().toDateString());
                }}
              >
                Log Water
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    );
  };

  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {renderHeader()}

      <Box
        sx={{
          overflow: 'auto',
          pb: 4
        }}
      >
        {renderBanners()}

        {renderEmergencyButton()}
        {renderQuoteWidget()}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 3, mb: 2, px: 2 }}>
          Explore Features
        </Typography>
        {renderFeatureGrid()}

        {/* Dialog for emergency actions */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          aria-labelledby="emergency-dialog-title"
          aria-describedby="emergency-dialog-description"
        >
          <DialogTitle id="emergency-dialog-title">
            {dialogConfig.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="emergency-dialog-description">
              {dialogConfig.content}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            {dialogConfig.actions.map((action, index) => (
              <Button
                key={index}
                onClick={() => {
                  action.onClick();
                  if (action.text !== 'Cancel') setDialogOpen(false);
                }}
                color={action.color || 'primary'}
                variant={action.variant || 'text'}
                autoFocus={index === 0}
              >
                {action.text}
              </Button>
            ))}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default HomeScreen;