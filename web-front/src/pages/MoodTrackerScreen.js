import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  ToggleButtonGroup, 
  ToggleButton, 
  CircularProgress,
  Paper
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

const MoodTrackerScreen = () => {
  const navigate = useNavigate();
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  const fetchMoodEntries = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${API_URL}/moods`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setMoodEntries(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching mood entries:', err);
      setError('Failed to load mood entries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.post(`${API_URL}/moods`, {
        mood: currentMood,
        note: note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Store the last mood entry date
      localStorage.setItem('lastMoodDate', new Date().toLocaleDateString());
      
      setNote('');
      fetchMoodEntries();
    } catch (err) {
      console.error('Error saving mood:', err);
      setError('Failed to save mood entry');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMoodEntries();
    setRefreshing(false);
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  const getMoodValue = (mood) => {
    switch (mood) {
      case 'happy': return 5;
      case 'neutral': return 4;
      case 'sad': return 3;
      case 'angry': return 1;
      case 'anxious': return 2;
      default: return 3;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const prepareChartData = () => {
    const last7Days = moodEntries.slice(-7);
    return {
      labels: last7Days.map(entry => new Date(entry.logged_at).toLocaleDateString('en-US', { weekday: 'short' })),
      datasets: [{
        label: 'Mood Level',
        data: last7Days.map(entry => getMoodValue(entry.mood)),
        borderColor: 'rgb(81, 150, 244)',
        backgroundColor: 'rgba(81, 150, 244, 0.5)',
        tension: 0.4
      }]
    };
  };

  if (loading && moodEntries.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ position: 'relative' }}>
        {refreshing && (
          <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              How are you feeling?
            </Typography>
            
            <ToggleButtonGroup
              value={currentMood}
              exclusive
              onChange={(e, newMood) => {
                if (newMood !== null) {
                  setCurrentMood(newMood);
                }
              }}
              aria-label="mood selection"
              sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}
            >
              <ToggleButton value="happy" aria-label="happy" sx={{ flex: '1 0 auto', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>😊</Typography>
                  <Typography>Happy</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="neutral" aria-label="neutral" sx={{ flex: '1 0 auto', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>😐</Typography>
                  <Typography>Neutral</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="sad" aria-label="sad" sx={{ flex: '1 0 auto', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>😢</Typography>
                  <Typography>Sad</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="angry" aria-label="angry" sx={{ flex: '1 0 auto', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>😠</Typography>
                  <Typography>Angry</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="anxious" aria-label="anxious" sx={{ flex: '1 0 auto', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>😰</Typography>
                  <Typography>Anxious</Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
            
            <TextField
              label="Notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            <Button
              variant="contained"
              onClick={handleSaveMood}
              sx={{ minWidth: 120 }}
            >
              Save Mood
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Paper elevation={0} sx={{ bgcolor: '#fdeded', color: 'error.main', p: 2, mb: 3, borderRadius: 2 }}>
            <Typography>{error}</Typography>
          </Paper>
        )}

        {moodEntries.length > 0 && (
          <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Mood Trends
              </Typography>
              <Box sx={{ height: 250 }}>
                <Line 
                  data={prepareChartData()} 
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 6,
                        ticks: {
                          stepSize: 1,
                          callback: function(value) {
                            return ['', 'Angry', 'Anxious', 'Sad', 'Neutral', 'Happy'][value] || '';
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
          Mood History
        </Typography>
        
        {moodEntries && moodEntries.map((entry) => (
          <Card key={entry.log_id} sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                  {getMoodEmoji(entry.mood)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(entry.logged_at)}
                </Typography>
              </Box>
              {entry.note && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {entry.note}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Button
          variant="outlined"
          onClick={onRefresh}
          sx={{ mt: 2 }}
          disabled={refreshing}
        >
          Refresh Data
        </Button>
      </Box>
    </Container>
  );
};

export default MoodTrackerScreen;