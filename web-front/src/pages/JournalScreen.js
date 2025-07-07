import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  CircularProgress, 
  Paper, 
  Alert,
  FormHelperText,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Lock as LockIcon, 
  LockOpen as LockOpenIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const JournalScreen = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [searchQuery, entries]);

  const fetchJournalEntries = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${API_URL}/journal/entries`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const entries = Array.isArray(response.data) ? response.data : [];
      const formattedEntries = entries.map(entry => ({
        ...entry,
        id: entry.id, // Use id from schema
        title: entry.title || 'Untitled',
        content: entry.content || '',
        mood: entry.mood || 'neutral',
        is_locked: Boolean(entry.is_locked),
        category_id: entry.category_id || null,
        created_at: entry.created_at || new Date().toISOString(),
        updated_at: entry.updated_at || entry.created_at || new Date().toISOString()
      }));

      setEntries(formattedEntries);
      setFilteredEntries(formattedEntries);
      setError('');
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError(err.response?.data?.message || 'Failed to load journal entries. Please try again later.');
      setEntries([]);
      setFilteredEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApiError = (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('userToken');
        navigate('/login');
        return 'Session expired. Please login again.';
      }
      return error.response.data?.message || 'Server error occurred.';
    }
    if (error.request) {
      return 'Unable to reach server. Please check your connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournalEntries();
    setRefreshing(false);
  };

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

  const handleEntryPress = (entry) => {
    if (entry.is_locked === true) { 
      setSelectedEntryId(entry.id);
      setPasswordInput('');
      setUnlockError('');
      setIsPasswordModalVisible(true);
    } else {
      navigate(`/journal/${entry.id}`, { state: { entry } });
    }
  };

  const handleUnlockEntry = async () => {
    setUnlockLoading(true);
    setUnlockError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.post(`${API_URL}/journal/entries/${selectedEntryId}/unlock`, {
        password: passwordInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && typeof response.data.content === 'string') {
        const fullEntry = response.data;
        setIsPasswordModalVisible(false);
        navigate(`/journal/${fullEntry.id}`, { state: { entry: fullEntry } });
      } else {
        console.warn('Unlock response did not contain expected content:', response.data);
        throw new Error('Failed to unlock entry (invalid response)');
      }
    } catch (err) {
      console.error('Error unlocking entry:', err.response?.data || err.message || err);
      if (err.response?.status === 401) {
        setUnlockError(err.response.data?.message || 'Incorrect journal password.');
      } else {
        setUnlockError(err.response?.data?.message || 'Failed to unlock entry. Please try again.');
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  if (loading && entries.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading journal entries...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search journal entries"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchQuery('')} edge="end">
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ mb: 2 }}
        />
        
        {refreshing && (
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {filteredEntries.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            No journal entries found.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchQuery ? 'Try a different search term.' : 'Create your first entry!'}
          </Typography>
          {!searchQuery && (
            <Button 
              variant="contained" 
              sx={{ mt: 2 }} 
              onClick={() => navigate('/new-journal')} 
              startIcon={<EditIcon />}
            >
              Create Journal Entry
            </Button>
          )}
        </Paper>
      ) : (
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={onRefresh} 
            disabled={refreshing} 
            sx={{ mb: 2 }}
            variant="outlined"
          >
            Refresh
          </Button>
          
          {filteredEntries.map(entry => (
            <Card 
              key={entry.id || Math.random().toString()}
              sx={{ 
                mb: 2, 
                cursor: 'pointer', 
                transition: 'transform 0.2s', 
                '&:hover': { transform: 'translateY(-2px)' },
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main',
                overflow: 'hidden',
                borderRadius: 2
              }}
              onClick={() => handleEntryPress(entry)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    {entry.title}
                  </Typography>
                  <Typography sx={{ fontSize: '24px', ml: 1 }}>
                    {getMoodEmoji(entry.mood)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                  {formatDate(entry.created_at)}
                </Typography>
                {entry.category_name && (
                  <Chip 
                    label={entry.category_name} 
                    size="small" 
                    sx={{ mb: 1 }} 
                  />
                )}
                <Typography variant="body1" sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical' 
                }}>
                  {entry.content}
                </Typography>
                {entry.is_locked && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                    <LockIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">Password protected</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 20, right: 20 }}
        onClick={() => navigate('/new-journal')}
        aria-label="add journal entry"
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
        PaperProps={{
          sx: { borderRadius: 2, p: 1 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Unlock Journal Entry
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, textAlign: 'center' }}>
            This entry is locked for privacy. Please enter your journal password.
          </DialogContentText>
          
          <TextField
            label="Journal Password"
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setUnlockError('');
            }}
            fullWidth
            variant="outlined"
            autoFocus
            disabled={unlockLoading}
            error={!!unlockError}
            helperText={unlockError}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && passwordInput) {
                handleUnlockEntry();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={() => setIsPasswordModalVisible(false)}
            disabled={unlockLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUnlockEntry}
            disabled={unlockLoading || !passwordInput}
            startIcon={unlockLoading ? <CircularProgress size={20} /> : <LockOpenIcon />}
          >
            Unlock
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JournalScreen;
