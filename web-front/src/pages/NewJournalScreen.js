import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  FormHelperText,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Fade,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const NewJournalScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const entryToEdit = location.state?.entry;

  const [title, setTitle] = useState(entryToEdit?.title || '');
  const [content, setContent] = useState(entryToEdit?.content || '');
  const [mood, setMood] = useState(entryToEdit?.mood || 'neutral');
  const [category, setCategory] = useState(entryToEdit?.category_id || '');
  const [categories, setCategories] = useState([]);
  const [isLocked, setIsLocked] = useState(entryToEdit?.is_locked || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasJournalPassword, setHasJournalPassword] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '' });

  useEffect(() => {
    checkJournalPassword();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(`${API_URL}/journal/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Don't show error to user, categories are optional
    }
  };

  const checkJournalPassword = async () => {
    setHasJournalPassword(false); 
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Token not found for password check');
      
      await axios.post(`${API_URL}/users/me/journal-password/verify`, 
        { password: `dummy_check_${Date.now()}` }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[NewJournalScreen] Password check: Verify endpoint succeeded unexpectedly?');
      setHasJournalPassword(true); 

    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          console.log('[NewJournalScreen] Password check: Received 401, password IS set.');
          setHasJournalPassword(true);
        } else if (err.response.status === 400 && err.response.data?.message === 'Journal password is not set.') {
          console.log('[NewJournalScreen] Password check: Received 400 "not set", password NOT set.');
          setHasJournalPassword(false);
        } else {
          console.warn('[NewJournalScreen] Password check: Received unexpected error:', err.response.status, err.response.data);
          setHasJournalPassword(false);
        }
      } else {
        console.warn('[NewJournalScreen] Password check: Network or other error:', err.message);
        setHasJournalPassword(false);
      }
    }
  };

  const showAlert = (title, message) => {
    setAlertDialog({
      open: true,
      title,
      message
    });
  };

  const handleAlertClose = () => {
    setAlertDialog({ ...alertDialog, open: false });
    if (alertDialog.title === 'Success') {
      navigate(-1);
    }
  };

  const validateEntryData = (data) => {
    return {
      title: String(data.title).trim(),
      content: String(data.content).trim(),
      mood: ['happy', 'sad', 'angry', 'anxious', 'neutral'].includes(data.mood) 
        ? data.mood 
        : 'neutral',
      category_id: data.category_id || null,
      is_locked: Boolean(data.is_locked)
    };
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a title for your journal entry');
      return;
    }

    if (!content.trim()) {
      showAlert('Error', 'Please write some content for your journal entry');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const entryData = validateEntryData({
        title,
        content,
        mood,
        category_id: category,
        is_locked: isLocked
      });

      let response;
      if (entryToEdit?.id) { // Use id instead of entry_id
        response = await axios.put(
          `${API_URL}/journal/entries/${entryToEdit.id}`,
          entryData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_URL}/journal/entries`,
          entryData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server');
      }

      const now = new Date().toISOString();
      localStorage.setItem('lastJournalEntryDate', now);
      showAlert('Success', entryToEdit ? 'Journal entry updated!' : 'Journal entry saved!');

    } catch (err) {
      console.error('Error saving journal entry:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save journal entry. Please try again.';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error) => {
    if (error.response) {
      // Server responded with error
      if (error.response.status === 401) {
        localStorage.removeItem('userToken');
        navigate('/login');
        return 'Session expired. Please login again.';
      }
      return error.response.data?.message || 'Server error occurred.';
    }
    if (error.request) {
      // No response received
      return 'Unable to reach server. Please check your connection.';
    }
    // Something else went wrong
    return 'An unexpected error occurred. Please try again.';
  };

  const getMoodLabel = (moodValue) => {
    switch (moodValue) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      default: return '😐';
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {entryToEdit ? 'Edit Journal Entry' : 'New Journal Entry'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" sx={{ '& .MuiTextField-root': { mb: 3 } }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Give your entry a title"
              autoFocus
            />

            <TextField
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              placeholder="Write about your day, feelings, thoughts..."
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Category (optional)</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category (optional)"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                How are you feeling?
              </Typography>
              <Card variant="outlined" sx={{ p: 2 }}>
                <ToggleButtonGroup
                  value={mood}
                  exclusive
                  onChange={(e, newValue) => newValue && setMood(newValue)}
                  fullWidth
                  aria-label="mood selection"
                >
                  <ToggleButton value="happy" aria-label="happy" sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '24px' }}>{getMoodLabel('happy')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="neutral" aria-label="neutral" sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '24px' }}>{getMoodLabel('neutral')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="sad" aria-label="sad" sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '24px' }}>{getMoodLabel('sad')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="angry" aria-label="angry" sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '24px' }}>{getMoodLabel('angry')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="anxious" aria-label="anxious" sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '24px' }}>{getMoodLabel('anxious')}</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Card>
            </Box>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">
                      Lock this entry?
                    </Typography>
                    {!hasJournalPassword && (
                      <FormHelperText>
                        Set a journal password in settings to enable locking
                      </FormHelperText>
                    )}
                  </Box>
                  <Switch
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.target.checked)}
                    disabled={!hasJournalPassword && !isLocked}
                    color="primary"
                  />
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
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
              <Button
                variant="contained"
                onClick={handleSave}
                fullWidth
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              >
                {entryToEdit ? 'Update Entry' : 'Save Entry'}
              </Button>
            </Box>
          </Box>
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
    </Fade>
  );
};

export default NewJournalScreen;
