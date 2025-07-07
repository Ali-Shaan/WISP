import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const NewMoodScreen = () => {
  const navigate = useNavigate();
  const [moodValue, setMoodValue] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '' });

  const getMoodEmoji = (value) => {
    if (value >= 9) return '😄';
    if (value >= 7) return '🙂';
    if (value >= 5) return '😐';
    if (value >= 3) return '😰';
    return '😢';
  };

  const getMoodColor = (value) => {
    if (value >= 9) return '#4CAF50'; // Green
    if (value >= 7) return '#8BC34A'; // Light Green
    if (value >= 5) return '#FFC107'; // Amber
    if (value >= 3) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getMoodType = (value) => {
    if (value >= 9) return 'happy';
    if (value >= 7) return 'happy';
    if (value >= 5) return 'neutral';
    if (value >= 3) return 'anxious';
    return 'sad';
  };

  // Show alert dialog
  const showAlert = (title, message) => {
    setAlertDialog({
      open: true,
      title,
      message
    });
  };

  // Handle alert dialog close
  const handleAlertClose = () => {
    setAlertDialog({ ...alertDialog, open: false });
    if (alertDialog.title === 'Success') {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (!note.trim()) {
      showAlert('Error', 'Please add a note about your mood');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.post(`${API_URL}/moods`, {
        mood: getMoodType(moodValue),
        note: note.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Store the current date as last mood entry date
      localStorage.setItem('lastMoodDate', new Date().toLocaleDateString());
      
      showAlert('Success', 'Mood entry saved successfully');
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to save mood entry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          maxWidth: 600, 
          mx: 'auto' 
        }}
      >
        <CardContent>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: 4, 
              textAlign: 'center',
              fontWeight: 500 
            }}
          >
            How are you feeling?
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 2 
            }}
          >
            <Typography 
              sx={{ 
                fontSize: 72, 
                mb: 1,
                lineHeight: 1 
              }}
            >
              {getMoodEmoji(moodValue)}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold' 
              }}
            >
              {moodValue}/10
            </Typography>
          </Box>
          
          <Box sx={{ px: 2, mb: 3 }}>
            <Slider
              value={moodValue}
              onChange={(_, value) => setMoodValue(value)}
              min={1}
              max={10}
              step={1}
              sx={{
                '& .MuiSlider-track': {
                  backgroundColor: getMoodColor(moodValue),
                },
                '& .MuiSlider-thumb': {
                  backgroundColor: getMoodColor(moodValue),
                }
              }}
            />
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              px: 2,
              mb: 4 
            }}
          >
            <Typography sx={{ fontSize: 24 }}>😢</Typography>
            <Typography sx={{ fontSize: 24 }}>😐</Typography>
            <Typography sx={{ fontSize: 24 }}>😄</Typography>
          </Box>
          
          <TextField
            label="How are you feeling? (Add a note)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            sx={{ mb: 4 }}
          />
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2
            }}
          >
            <Button 
              variant="contained" 
              onClick={handleSave} 
              fullWidth
              size="large"
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              Save Mood
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)} 
              fullWidth
              size="large"
              disabled={loading}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Paper>

      {/* Alert Dialog */}
      <Dialog
        open={alertDialog.open}
        onClose={handleAlertClose}
      >
        <DialogTitle>{alertDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {alertDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAlertClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NewMoodScreen;
