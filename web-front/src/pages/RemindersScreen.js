import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Snackbar,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { API_URL } from '../config';

// Helper function to request web notification permissions
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Helper function to schedule a web notification
const scheduleWebNotification = (reminder) => {
  if (!reminder.enabled) return; // Don't schedule if disabled
  
  const [hour, minute] = reminder.time.split(':').map(Number);
  const now = new Date();
  const notificationTime = new Date();
  notificationTime.setHours(hour, minute, 0, 0);
  
  // If the time is already past for today, schedule for tomorrow
  if (notificationTime < now) {
    notificationTime.setDate(notificationTime.getDate() + 1);
  }
  
  const timeUntilNotification = notificationTime.getTime() - now.getTime();
  
  // Store the timeout ID with the reminder ID for later cancellation
  const notificationID = setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Wisp Reminder', {
        body: reminder.title,
        icon: '/logo192.png' // Assuming you have this icon in your public folder
      });
      
      // Schedule the next notification for tomorrow
      scheduleWebNotification(reminder);
    }
  }, timeUntilNotification);
  
  // Store the timeout ID in localStorage for potential cancellation
  const storedTimeouts = JSON.parse(localStorage.getItem('notificationTimeouts') || '{}');
  storedTimeouts[`reminder-${reminder.id}`] = notificationID;
  localStorage.setItem('notificationTimeouts', JSON.stringify(storedTimeouts));
  
  console.log(`Scheduled web notification for reminder ${reminder.id} at ${reminder.time}`);
  return notificationID;
};

// Helper function to cancel a web notification
const cancelWebNotification = (reminderId) => {
  const storedTimeouts = JSON.parse(localStorage.getItem('notificationTimeouts') || '{}');
  const timeoutId = storedTimeouts[`reminder-${reminderId}`];
  
  if (timeoutId) {
    clearTimeout(timeoutId);
    delete storedTimeouts[`reminder-${reminderId}`];
    localStorage.setItem('notificationTimeouts', JSON.stringify(storedTimeouts));
    console.log(`Cancelled web notification for reminder ${reminderId}`);
  }
};

const RemindersScreen = () => {
  const navigate = useNavigate();
  const [mindfulnessReminders, setMindfulnessReminders] = useState([]);
  const [waterReminders, setWaterReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [reminderType, setReminderType] = useState('mindfulness');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // On component mount, check notification permission
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await requestNotificationPermission();
      setNotificationPermission(hasPermission);
    };
    checkPermission();
    
    // Clean up any existing notification timeouts when component unmounts
    return () => {
      const storedTimeouts = JSON.parse(localStorage.getItem('notificationTimeouts') || '{}');
      Object.values(storedTimeouts).forEach(id => clearTimeout(id));
    };
  }, []);

  const fetchReminders = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.get(`${API_URL}/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let fetchedMindfulness = [];
      let fetchedWater = [];

      if (response.data) {
        fetchedMindfulness = response.data.mindfulness || [];
        fetchedWater = response.data.water || [];
        setMindfulnessReminders(fetchedMindfulness);
        setWaterReminders(fetchedWater);

        // Cancel and reschedule all notifications
        const storedTimeouts = JSON.parse(localStorage.getItem('notificationTimeouts') || '{}');
        Object.values(storedTimeouts).forEach(id => clearTimeout(id));
        localStorage.setItem('notificationTimeouts', JSON.stringify({}));
        
        if (notificationPermission) {
          for (const reminder of fetchedMindfulness) {
            if (reminder.enabled) scheduleWebNotification(reminder);
          }
          for (const reminder of fetchedWater) {
            if (reminder.enabled) scheduleWebNotification(reminder);
          }
        }
      } else {
        setMindfulnessReminders([]);
        setWaterReminders([]);
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching/scheduling reminders:', err.response?.data || err.message);
      setError('Failed to fetch reminders. Click refresh to try again.');
      setMindfulnessReminders([]);
      setWaterReminders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notificationPermission]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a reminder title',
        severity: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const formattedTime = reminderTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const response = await axios.post(
        `${API_URL}/reminders`,
        {
          type: reminderType,
          title: reminderTitle.trim(),
          time: formattedTime,
          enabled: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Close dialog and refresh reminders
      setShowAddDialog(false);
      setReminderTitle('');
      setReminderTime(new Date());
      
      if (notificationPermission && response.data) {
        scheduleWebNotification(response.data);
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Reminder added successfully',
        severity: 'success'
      });
      
      fetchReminders();
    } catch (err) {
      console.error('Error adding reminder:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to add reminder',
        severity: 'error'
      });
    }
  };

  const toggleReminder = async (id, type, currentEnabled) => {
    // Optimistic update
    const updateList = (prevState) => {
      return prevState.map(reminder => 
        reminder.id === id ? { ...reminder, enabled: !currentEnabled } : reminder
      );
    };

    if (type === 'mindfulness') {
      setMindfulnessReminders(updateList);
    } else {
      setWaterReminders(updateList);
    }

    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      await axios.patch(
        `${API_URL}/reminders/${type}/${id}`,
        { enabled: !currentEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update notifications based on the new state
      if (!currentEnabled) {
        if (notificationPermission) {
          // Find the reminder to schedule
          const reminders = type === 'mindfulness' ? mindfulnessReminders : waterReminders;
          const reminder = reminders.find(r => r.id === id);
          if (reminder) {
            scheduleWebNotification({ ...reminder, enabled: true });
          }
        }
      } else {
        cancelWebNotification(id);
      }
    } catch (err) {
      console.error('Error toggling reminder:', err);
      // Revert the optimistic update
      fetchReminders();
      setSnackbar({
        open: true,
        message: 'Failed to update reminder',
        severity: 'error'
      });
    }
  };

  const deleteReminder = async (id, type) => {
    // Show confirmation dialog using Material UI Dialog
    const confirmDelete = window.confirm('Are you sure you want to delete this reminder?');
    
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      await axios.delete(`${API_URL}/reminders/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update of UI
      if (type === 'mindfulness') {
        setMindfulnessReminders(prev => prev.filter(item => item.id !== id));
      } else {
        setWaterReminders(prev => prev.filter(item => item.id !== id));
      }

      // Cancel any scheduled notifications
      cancelWebNotification(id);

      setSnackbar({
        open: true,
        message: 'Reminder deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete reminder',
        severity: 'error'
      });
      fetchReminders(); // Refresh to ensure UI is in sync with server
    }
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

  const renderReminderItem = (reminder, type) => (
    <ListItem key={reminder.id} divider sx={{ py: 1.5 }}>
      <ListItemText
        primary={
          <Typography variant="subtitle1" sx={{ fontWeight: reminder.enabled ? 'bold' : 'normal' }}>
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
        <Switch
          edge="end"
          checked={reminder.enabled}
          onChange={() => toggleReminder(reminder.id, type, reminder.enabled)}
          color="primary"
        />
        <IconButton 
          edge="end" 
          onClick={() => deleteReminder(reminder.id, type)}
          color="error"
          sx={{ ml: 1 }}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!notificationPermission && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Notifications are not enabled. Please enable notifications in your browser to receive reminders.
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => requestNotificationPermission().then(setNotificationPermission)}
              sx={{ ml: 1 }}
            >
              Enable
            </Button>
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setRefreshing(true);
              fetchReminders();
            }}
            disabled={refreshing || loading}
          >
            Refresh
          </Button>
        </Box>
        
        <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="h6" component="h2">
              Mindfulness Reminders
            </Typography>
          </Box>
          <List sx={{ py: 0 }}>
            {loading && mindfulnessReminders.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : mindfulnessReminders.length > 0 ? (
              mindfulnessReminders.map(reminder => renderReminderItem(reminder, 'mindfulness'))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No mindfulness reminders set.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="h6" component="h2">
              Water Reminders
            </Typography>
          </Box>
          <List sx={{ py: 0 }}>
            {loading && waterReminders.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : waterReminders.length > 0 ? (
              waterReminders.map(reminder => renderReminderItem(reminder, 'water'))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No water reminders set.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        {/* Add Reminder Dialog */}
        <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Reminder</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3, mt: 1 }}>
              <ToggleButtonGroup
                value={reminderType}
                exclusive
                onChange={(_, newType) => newType && setReminderType(newType)}
                fullWidth
                color="primary"
              >
                <ToggleButton value="mindfulness">
                  Mindfulness
                </ToggleButton>
                <ToggleButton value="water">
                  Water
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              label="Reminder Title"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
            />

            <Box sx={{ mt: 3 }}>
              <TimePicker
                label="Reminder Time"
                value={reminderTime}
                onChange={(newTime) => setReminderTime(newTime)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddDialog(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleAddReminder} color="primary" variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowAddDialog(true)}
        >
          <AddIcon />
        </Fab>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default RemindersScreen;
