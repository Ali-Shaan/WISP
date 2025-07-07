import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const NewThreadScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Get topic info from either params, location state, or set to null
  const initialTopicId = params.topicId || (location.state?.topicId) || null;
  const initialTopicName = location.state?.topicName || null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(initialTopicId);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [guidelinesVisible, setGuidelinesVisible] = useState(!initialTopicId);

  useEffect(() => {
    if (!initialTopicId) {
      fetchTopics();
    } else {
      setSelectedTopic(initialTopicId);
    }
  }, [initialTopicId]);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/community/topics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTopics(response.data);
      if (initialTopicId) {
        setSelectedTopic(initialTopicId);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedTopic) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/community/topics/${selectedTopic}/threads`,
        {
          title: title.trim(),
          content: content.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Navigate to the thread detail page with the new thread
      navigate(`/threads/${response.data.thread_id}`);
    } catch (err) {
      console.error('Error creating thread:', err);
      setError(err.response?.data?.message || 'Failed to create thread. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 2 }}>
        <Toolbar sx={{ px: 0 }}>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Create New Thread</Typography>
        </Toolbar>
      </AppBar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {!initialTopicId && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="topic-select-label">Select Topic</InputLabel>
            <Select
              labelId="topic-select-label"
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value)}
              label="Select Topic"
            >
              {topics.map((topic) => (
                <MenuItem key={topic.topic_id} value={topic.topic_id}>
                  {topic.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {initialTopicId && initialTopicName && (
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Topic: {initialTopicName}
          </Typography>
        )}

        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          placeholder="Write a descriptive title"
        />

        <TextField
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          sx={{ mb: 2 }}
          placeholder="Share your thoughts, experiences, or questions..."
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
          fullWidth
          sx={{ mt: 2 }}
        >
          {submitting ? <CircularProgress size={24} /> : 'Create Thread'}
        </Button>
      </Paper>

      <Dialog open={guidelinesVisible} onClose={() => setGuidelinesVisible(false)}>
        <DialogTitle>Community Guidelines</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please follow these guidelines when creating a thread:
          </Typography>
          <ul>
            <li>Be respectful to other community members</li>
            <li>Stay on topic and avoid spam</li>
            <li>Do not share personal information</li>
            <li>Provide clear and concise information</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuidelinesVisible(false)}>Got it</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NewThreadScreen;
