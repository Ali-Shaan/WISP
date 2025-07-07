import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const JournalDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId } = useParams();
  const [entry, setEntry] = useState(location.state?.entry);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(location.state?.entry);
  const [loading, setLoading] = useState(!location.state?.entry);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // If no entry in state, fetch it using the ID
    if (!entry && entryId) {
      fetchEntryData();
    }
    fetchCategories();
  }, [entryId, entry]);

  const fetchEntryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.get(
        `${API_URL}/journal/entries/${entryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEntry(response.data);
      setEditedEntry(response.data);
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to load journal entry');
      navigate('/journal');
    } finally {
      setLoading(false);
    }
  };

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

  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Show alert dialog
  const showAlert = (title, message) => {
    setAlertDialog({
      open: true,
      title,
      message
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');
  
      await axios.put(
        `${API_URL}/journal/entries/${entry.id}`, // Use id as per schema
        {
          title: editedEntry.title,
          content: editedEntry.content,
          mood: editedEntry.mood || 'neutral',
          category_id: editedEntry.category_id || null,
          is_locked: Boolean(editedEntry.is_locked)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIsEditing(false);
      showAlert('Success', 'Journal entry updated successfully');
      // Navigate back after dialog is closed
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to update journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.delete(
        `${API_URL}/journal/entries/${entry.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDeleteDialogOpen(false);
      showAlert('Success', 'Journal entry deleted successfully');
      // Navigate back after dialog is closed
    } catch (error) {
      setDeleteDialogOpen(false);
      showAlert('Error', error.response?.data?.message || 'Failed to delete journal entry');
    } finally {
      setLoading(false);
    }
  };

  // Handle alert dialog close
  const handleAlertClose = () => {
    setAlertDialog({ ...alertDialog, open: false });
    if (alertDialog.title === 'Success') {
      navigate(-1);
    }
  };

  const getMoodEmoji = (mood) => {
    switch (mood.toLowerCase()) {
      case 'happy':
        return '😊';
      case 'sad':
        return '😢';
      case 'anxious':
        return '😰';
      case 'neutral':
        return '😐';
      case 'angry':
        return '😠';
      default:
        return '🤔';
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
          mb: 4,
          borderRadius: 2,
          backgroundColor: '#fff'
        }}
      >
        <Box sx={{ maxHeight: '80vh', overflow: 'auto', pr: 1 }}>
          {isEditing ? (
            <Box component="form" sx={{ '& .MuiTextField-root': { mb: 3 } }}>
              <TextField
                label="Title"
                value={editedEntry.title}
                onChange={(e) => setEditedEntry({ ...editedEntry, title: e.target.value })}
                fullWidth
                variant="outlined"
                autoFocus
              />
              <TextField
                label="Content"
                value={editedEntry.content}
                onChange={(e) => setEditedEntry({ ...editedEntry, content: e.target.value })}
                fullWidth
                multiline
                rows={10}
                variant="outlined"
              />
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Category (optional)</InputLabel>
                <Select
                  value={editedEntry.category_id || ''}
                  onChange={(e) => setEditedEntry({ ...editedEntry, category_id: e.target.value })}
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
              <TextField
                label="Mood"
                value={editedEntry.mood}
                onChange={(e) => setEditedEntry({ ...editedEntry, mood: e.target.value })}
                fullWidth
                variant="outlined"
                helperText="Examples: happy, sad, anxious, neutral"
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handleSave} 
                  startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                  fullWidth
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => setIsEditing(false)} 
                  startIcon={<CancelIcon />}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {entry.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {formatDate(entry.created_at)}
                </Typography>
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3, 
                  lineHeight: 1.8, 
                  whiteSpace: 'pre-wrap' 
                }}
              >
                {entry.content}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                {entry.category_name && (
                  <Chip 
                    label={entry.category_name} 
                    sx={{ mb: 1, mr: 1 }} 
                  />
                )}
                <Chip 
                  label={`Mood: ${entry.mood}`} 
                  sx={{ mb: 1 }}
                  icon={<Typography sx={{ fontSize: '1.2rem', mr: 0.5 }}>{getMoodEmoji(entry.mood)}</Typography>}
                />
              </Box>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  mt: 2 
                }}
              >
                <IconButton
                  onClick={() => setIsEditing(true)}
                  size="large"
                  color="primary"
                  sx={{ mr: 1 }}
                  aria-label="edit journal entry"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  size="large"
                  color="error"
                  aria-label="delete journal entry"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this journal entry? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default JournalDetailScreen;
