import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  Fab,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  IconButton,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { API_URL } from '../config';

const MindfulnessRemindersScreen = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '',
    time: '09:00',
    enabled: true
  });

  const [reminderTime, setReminderTime] = useState(new Date('2023-01-01T09:00:00'));

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${API_URL}/reminders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReminders(response.data.reminders);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
      // Mock data for development
      setReminders([
        {
          id: '1',
          title: 'Morning Meditation',
          time: '09:00',
          enabled: true
        },
        {
          id: '2',
          title: 'Evening Reflection',
          time: '20:00',
          enabled: true
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      setError('Please enter a reminder title');
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Format time from the date picker
      const formattedTime = reminderTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const reminderToSubmit = {
        ...newReminder,
        time: formattedTime
      };

      const response = await axios.post(
        `${API_URL}/reminders`,
        reminderToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReminders([...reminders, response.data.reminder]);
      setNewReminder({
        title: '',
        time: '09:00',
        enabled: true
      });
      setReminderTime(new Date('2023-01-01T09:00:00'));
    } catch (err) {
      console.error('Error adding reminder:', err);
      setError('Failed to add reminder');
    }
  };

  const handleToggleReminder = async (id, enabled) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.put(
        `${API_URL}/reminders/${id}`,
        { enabled },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReminders(reminders.map(reminder =>
        reminder.id === id ? { ...reminder, enabled } : reminder
      ));
    } catch (err) {
      console.error('Error updating reminder:', err);
      setError('Failed to update reminder');
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.delete(`${API_URL}/reminders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReminders(reminders.filter(reminder => reminder.id !== id));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0);
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Mindfulness Reminders
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
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Add New Reminder
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Reminder Title"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Reminder Time"
                value={reminderTime}
                onChange={(newTime) => setReminderTime(newTime)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newReminder.enabled}
                      onChange={(e) => setNewReminder({ ...newReminder, enabled: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Enable Reminder"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddReminder}
                disabled={!newReminder.title.trim()}
                fullWidth
              >
                Add Reminder
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && reminders.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Your Reminders
            </Typography>
            
            {reminders.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No reminders found. Add your first reminder above.
                </Typography>
              </Paper>
            ) : (
              <List sx={{ mb: 4 }}>
                {reminders.map((reminder) => (
                  <Paper key={reminder.id} sx={{ mb: 2 }}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="h6" component="span">
                            {reminder.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {formatTime(reminder.time)}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={reminder.enabled}
                              onChange={(e) => handleToggleReminder(reminder.id, e.target.checked)}
                              color="primary"
                            />
                          }
                          label=""
                        />
                        <IconButton 
                          edge="end" 
                          color="error" 
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default MindfulnessRemindersScreen;
