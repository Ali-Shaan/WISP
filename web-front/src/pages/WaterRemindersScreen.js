import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config.js';
import {
  Box,
  Container,
  Typography,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const WaterReminderScreen = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState({
    currentIntakeMl: 0,
    goalMl: 3700, // Default, will be updated from API
    progressPercent: 0,
  });
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchWaterData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Use the new progress endpoint
      const progressResponse = await axios.get(
        `${API_URL}/water/progress?date=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Get daily logs
      const logsResponse = await axios.get(
        `${API_URL}/water/logs/detailed?date=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { goal, current, percentage } = progressResponse.data;
      
      setProgressData({
        currentIntakeMl: current,
        goalMl: goal,
        progressPercent: percentage
      });
      
      setProgress(percentage);
      setDailyLogs(logsResponse.data.logs || []);
    } catch (error) {
      console.error('Error fetching water data:', error);
      setError('Failed to load water data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaterData();
    
    // Optional: Set up a refresh interval
    const interval = setInterval(fetchWaterData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchWaterData]);

  const handleAddWater = async (amount) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.post(
        `${API_URL}/water/logs`,
        { amount_ml: amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the data after adding water
      fetchWaterData();
      
      localStorage.setItem('lastWaterDate', new Date().toLocaleDateString());
    } catch (error) {
      console.error('Error adding water:', error);
      setError('Failed to add water intake. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Error';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const progressColor = getProgressColor(progress);

  if (loading && dailyLogs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h1" gutterBottom>
            Daily Water Progress
          </Typography>
          <Typography variant="h4" component="div" align="center" gutterBottom>
            {progressData.currentIntakeMl}ml / {progressData.goalMl}ml
          </Typography>
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(progress, 100)}
              color={progressColor}
              sx={{ height: 20, borderRadius: 1 }}
            />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <Grid container spacing={2} justifyContent="space-between">
            {[250, 500, 1000].map((ml) => (
              <Grid item xs={4} key={ml} sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color={progressColor}
                  onClick={() => handleAddWater(ml)}
                  fullWidth
                >
                  +{ml}ml
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ boxShadow: 3 }}>
        <CardHeader title="Today's Entries" />
        <CardContent>
          {dailyLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              <Typography variant="body1">
                No water logged yet today.
              </Typography>
              <Typography variant="body1">
                Track your first glass!
              </Typography>
            </Box>
          ) : (
            dailyLogs.map((entry) => (
              <Box 
                key={entry.log_id} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  py: 2, 
                  borderBottom: 1, 
                  borderColor: 'divider' 
                }}
              >
                <Typography variant="body1" fontWeight="bold">
                  {entry.amount_ml}ml
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(entry.logged_at)}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default WaterReminderScreen;