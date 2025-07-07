import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const TopicThreadsScreen = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [threads, setThreads] = useState([]);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchThreads();
  }, [topicId]);

  const fetchThreads = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/community/topics/${topicId}/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setThreads(response.data.threads || []);
      setTopic(response.data.topic || null);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load threads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 2 }}>
        <Toolbar sx={{ px: 0 }}>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">
            {topic ? topic.name : 'Topic Threads'}
          </Typography>
        </Toolbar>
      </AppBar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mb: 2 }}
            onClick={() =>
              navigate(`/community/new-thread/${topicId}`, {
                state: { topicId, topicName: topic?.name }
              })
            }
          >
            Create New Post
          </Button>

          {threads.length === 0 ? (
            <Typography>No threads found for this topic.</Typography>
          ) : (
            <Stack spacing={2}>
              {threads.map((thread) => (
                <Card
                  key={thread.thread_id}
                  onClick={() => navigate(`/threads/${thread.thread_id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <CardContent>
                    <Typography variant="h6">{thread.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Posted by {thread.username} • {new Date(thread.created_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}
    </Container>
  );
};

export default TopicThreadsScreen;
