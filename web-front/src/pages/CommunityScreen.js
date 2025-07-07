import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Paper,
  Grid,
  Badge,
  Alert,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,  Favorite as HeartIcon,
  FavoriteBorder as HeartBorderIcon,
  Chat as ChatIcon,
  ArrowBack as ArrowBackIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  ReportProblem as ReportProblemIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';
import { formatDistanceToNow, parseISO } from 'date-fns';

const CommunityScreen = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('topics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTopicName, setSelectedTopicName] = useState('');
  const [threads, setThreads] = useState([]);
  const [selectedThreadData, setSelectedThreadData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [currentUser, setCurrentUser] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [itemToReport, setItemToReport] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        setCurrentUser(null);
      }
    } else {
      navigate('/login');
    }
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const endpoint = `${API_URL}/community/topics`;
      const topicsResponse = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!topicsResponse.data || !Array.isArray(topicsResponse.data)) {
        throw new Error('Invalid response format for topics from server');
      }
      
      let topicsWithCounts = topicsResponse.data.map(topic => ({ ...topic, thread_count: "N/A" }));

      try {
        const countsResponse = await axios.get(`${API_URL}/community/topic-thread-counts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (countsResponse.data && Array.isArray(countsResponse.data)) {
          const threadCountMap = countsResponse.data.reduce((acc, item) => {
            if (item.topic_id !== undefined && item.thread_count !== undefined) {
              acc[item.topic_id] = item.thread_count;
            }
            return acc;
          }, {});
          topicsWithCounts = topicsResponse.data.map(topic => ({
            ...topic,
            thread_count: threadCountMap[topic.topic_id] !== undefined ? threadCountMap[topic.topic_id] : "N/A"
          }));
        } else {
          console.warn("Topic thread counts response was not an array or was empty:", countsResponse.data);
        }
      } catch (countError) {
        console.error("Failed to fetch topic thread counts:", countError);
        setSnackbar({ open: true, message: 'Could not load thread counts for topics.', severity: 'warning' });
      }

      setTopics(topicsWithCounts);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(
        err.response?.data?.message ||
        'Failed to load topics. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async (topicId, page = 1) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const topicDetails = topics.find(t => t.topic_id === topicId);
      if (topicDetails) setSelectedTopicName(topicDetails.name);

      const response = await axios.get(`${API_URL}/community/topics/${topicId}/threads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' // Not needed for GET
        },
        params: { page, limit: 20 }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format for threads');
      }
      setThreads(response.data);
      setSelectedThreadData(null);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(
        err.response?.data?.message ||
        'Failed to load threads. Please try again.'
      );
      if (err.response) {
        console.error("Backend error response for fetchThreads:", err.response);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadDetails = async (threadId) => {
    console.log(`[CommunityScreen] fetchThreadDetails called for threadId: ${threadId}`);
    setLoading(true);
    setError('');
    setSelectedThreadData(null);
    setComments([]);

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log(`[CommunityScreen] Fetching main thread data for ${threadId}...`);
      const threadResponse = await axios.get(`${API_URL}/community/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[CommunityScreen] Main thread data API response:', threadResponse.data);
      setSelectedThreadData(threadResponse.data);

      console.log(`[CommunityScreen] Fetching comments for thread ${threadId}...`);
      const commentsResponse = await axios.get(`${API_URL}/community/threads/${threadId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[CommunityScreen] Comments API response:', commentsResponse.data);

      if (commentsResponse.data && Array.isArray(commentsResponse.data)) {
          const sortedComments = commentsResponse.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          setComments(sortedComments);
          console.log('[CommunityScreen] Comments state SET with:', sortedComments);
      } else {
          console.warn(`[CommunityScreen] Comments response for thread ${threadId} is not an array or data is missing:`, commentsResponse.data);
          setComments([]); 
      }
      setView('threadDetail');
    } catch (err) {
      console.error('[CommunityScreen] Error fetching thread details:', err);
      setError(err.response?.data?.message || 'Failed to load thread details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    if (view === 'topics') {
      fetchTopics();
      setSelectedTopic(null);
      setSelectedTopicName('');
      setThreads([]);
      setSelectedThreadData(null);
    } else if (view === 'threads' && selectedTopic && threads.length === 0) {
    } else if (view === 'threadDetail') {
    } else if (view === 'newThread') {
      setNewThreadTitle('');
      setNewThreadContent('');
    }
  }, [view, selectedTopic, navigate]);

  const handleLikeThread = async (threadIdToLike, sourceView = view) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const originalThreads = JSON.parse(JSON.stringify(threads)); 
    const originalSelectedThreadData = selectedThreadData ? JSON.parse(JSON.stringify(selectedThreadData)) : null;

    // Optimistic update logic from previous correct state
    if (sourceView === 'threads') {
      setThreads(prevThreads => prevThreads.map(t => 
        t.thread_id === threadIdToLike 
          ? { ...t, 
              like_count: t.user_liked ? t.like_count - 1 : t.like_count + 1, 
              user_liked: !t.user_liked 
            } 
          : t
      ));
    } else if (sourceView === 'threadDetail') {
      if (selectedThreadData && selectedThreadData.thread_id === threadIdToLike) {
        setSelectedThreadData(prev => ({
          ...prev,
          like_count: prev.user_liked ? prev.like_count - 1 : prev.like_count + 1,
          user_liked: !prev.user_liked
        }));
      }
    }

    try {
      await axios.post(`${API_URL}/community/threads/${threadIdToLike}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error liking thread:', err);
      setSnackbar({ open: true, message: 'Failed to update like status. Please try again.', severity: 'error' });
      // Revert optimistic update on error
      if (sourceView === 'threads') {
        setThreads(originalThreads);
      } else if (sourceView === 'threadDetail') {
        setSelectedThreadData(originalSelectedThreadData);
      }
      if (err.response) {
        console.error("Backend error response for likeThread:", err.response);
      }
    }
  };

  const handleLikeComment = async (commentIdToLike) => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }
    
    const originalComments = [...comments];
    setComments(prevComments => prevComments.map(c =>
      c.comment_id === commentIdToLike
        ? { ...c, 
            like_count: c.user_liked ? c.like_count - 1 : c.like_count + 1,
            user_liked: !c.user_liked 
          }
        : c
    ));

    try {
      await axios.post(`${API_URL}/community/comments/${commentIdToLike}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error liking comment:', err);
      setSnackbar({ open: true, message: 'Failed to like comment.', severity: 'error' });
      setComments(originalComments);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedThreadData) return;
    setSubmittingComment(true);
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); setSubmittingComment(false); return; }

    try {
      const payload = {
        content: newComment.trim(),
        parent_comment_id: replyTo ? replyTo.comment_id : null
      };
      const response = await axios.post(
        `${API_URL}/community/threads/${selectedThreadData.thread_id}/comments`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newCommentData = response.data;
      setComments(prevComments => [...prevComments, newCommentData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      setSelectedThreadData(prev => ({...prev, comments_count: (prev.comments_count || 0) + 1})); 

      setNewComment('');
      setReplyTo(null);
      setSnackbar({ open: true, message: 'Comment posted!', severity: 'success' });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    } catch (err) {
      console.error('Error posting comment:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to post comment', severity: 'error' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCreateNewThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !selectedTopic) {
      setSnackbar({open: true, message: 'Title and content are required, and a topic must be selected.', severity: 'warning'});
      return;
    }
    setLoading(true); 
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/community/topics/${selectedTopic}/threads`,
        { title: newThreadTitle.trim(), content: newThreadContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({open: true, message: 'Thread created successfully!', severity: 'success'});
      setNewThreadTitle('');
      setNewThreadContent('');
      fetchThreadDetails(response.data.thread_id);
    } catch (err) {
      console.error('Error creating thread:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create thread. Please try again.';
      setSnackbar({open: true, message: errorMessage, severity: 'error'});
      if (err.response) {
        console.error("Backend error response for createThread:", err.response);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportDialog = (type, id) => {
    setItemToReport({ type, id });
    setReportDialogOpen(true);
    setReportReason('');
  };

  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
    setItemToReport(null);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!itemToReport || !reportReason.trim() || !currentUser) return;
    setSubmittingComment(true);
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); setSubmittingComment(false); return; }
    const payload = {
      reason: reportReason.trim(),
      threadId: itemToReport.type === 'thread' ? itemToReport.id : null,
      commentId: itemToReport.type === 'comment' ? itemToReport.id : null,
    };
    // Debug log
    console.log('Reporting payload:', payload, 'itemToReport:', itemToReport);
    try {
      await axios.post(`${API_URL}/community/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: 'Report submitted successfully. Thank you.', severity: 'success' });
      handleCloseReportDialog();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to submit report.', severity: 'error' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderTopicList = () => (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Support Community Topics
        </Typography>
      </Box>

      {topics.length === 0 && !loading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No topics available. Check back later.
          </Typography>
        </Paper>
      ) : (
        <Grid elevation={2}
        sx={{
          height: '100%',
              display: 'flex',
              flexDirection: 'column',
              p: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                
              }
        }}>
          {topics.map((topic) => (
            <Grid item xs={12} md={6} key={topic.topic_id}>
              <Card sx={{ height: '100%', margin: 2 }}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {topic.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topic.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setSelectedTopic(topic.topic_id);
                      setSelectedTopicName(topic.name);
                      fetchThreads(topic.topic_id);
                      setView('threads');
                    }}
                  >
                    View Discussions ({topic.thread_count || 0})
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );

  const renderThreads = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            setView('topics');
          }}
        >
          Back to Topics
        </Button>
        <Typography variant="h5" component="h2" sx={{ textAlign: 'center', flexGrow: 1 }}>
          {selectedTopicName || 'Discussions'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            if (!selectedTopic) {
                setSnackbar({open: true, message: 'Please select a topic first or go back to topics.', severity: 'warning'});
                return;
            }
            setView('newThread'); 
          }}
        >
          Create New Post
        </Button>
      </Box>

      {loading && threads.length === 0 && <CircularProgress sx={{ display: 'block', margin: 'auto', mt:4 }} />}
      {!loading && threads.length === 0 && !error && (
        <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No posts yet. Be the first to start a discussion!
          </Typography>
        </Paper>
      )}

      {threads.length > 0 && (
        <Grid container spacing={3}>
          {threads.map((thread) => (
            <Grid item xs={12} key={thread.thread_id}>
              <Card>
                <CardContent
                  onClick={() => {
                    fetchThreadDetails(thread.thread_id);
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography variant="h6">{thread.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    by {thread.author_name} • {new Date(thread.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleLikeThread(thread.thread_id, 'threads'); }}>
                    {thread.user_liked ? <HeartIcon fontSize="small" sx={{ color: 'error.main' }}/> : <HeartBorderIcon fontSize="small" sx={{ color: 'error.main' }} />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {thread.like_count !== undefined ? thread.like_count : thread.likes}
                    </Typography>
                  </IconButton>
                  <IconButton>
                    <ChatIcon fontSize="small" />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {thread.comments_count}
                    </Typography>
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );

  const renderThreadDetailView = () => {
    console.log('[CommunityScreen] renderThreadDetailView - current comments state:', comments);
    console.log('[CommunityScreen] renderThreadDetailView - comments.length:', comments.length);

    if (loading && !selectedThreadData) {
        return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
    }
    if (!selectedThreadData) {
      return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="error">{error || 'Thread not found or failed to load.'}</Typography>
          <Button sx={{mt: 2}} startIcon={<ArrowBackIcon />} onClick={() => setView(selectedTopic ? 'threads' : 'topics')}>
            Back
          </Button>
        </Box>
      );
    }

    const { title, content, author_name: thread_author_name, created_at, like_count, user_liked, author_id: thread_author_id, thread_id } = selectedThreadData;

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: {xs: 2, md:3} }}>
          <IconButton onClick={() => setView('threads')} sx={{ mr: 1 }} aria-label="back to threads list">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontSize: {xs: '1.5rem', md: '2rem'} }}>
            {title}
          </Typography>
          {currentUser && currentUser.user_id !== thread_author_id && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ReportProblemIcon />}
              onClick={() => handleOpenReportDialog('thread', thread_id)}
              sx={{ textTransform: 'none', ml: 1 }}
            >
              Report Thread
            </Button>
          )}
        </Box>

        <Paper elevation={1} sx={{ p: {xs: 2, md: 3}, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar sx={{ mr: 1.5, bgcolor: 'primary.main', color: 'white' }}>{thread_author_name ? thread_author_name.charAt(0).toUpperCase() : 'U'}</Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{thread_author_name || 'Anonymous'}</Typography>
              <Typography variant="caption" color="text.secondary">
                Posted {created_at ? formatDistanceToNow(parseISO(created_at), { addSuffix: true }) : 'some time ago'}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }}/>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', mb: 2, lineHeight: 1.7, wordBreak: 'break-word' }}>
            {content}
          </Typography>
          <Divider sx={{ my: 2 }}/>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button 
              variant={user_liked ? 'contained' : 'outlined'}              startIcon={user_liked ? <HeartIcon sx={{ color: 'error.main' }}/> : <HeartBorderIcon sx={{ color: 'error.main' }} />}
              onClick={() => handleLikeThread(thread_id, 'threadDetail')}
              sx={{textTransform: 'none', color: 'error.main'}}
            >
              {like_count} Like{like_count !== 1 ? 's' : ''}
            </Button>
             <Typography variant="body2" color="text.secondary">
              {comments.length} Comment{comments.length !== 1 ? 's' : ''} 
            </Typography>
          </Box>
        </Paper>

        {/* Comments Section */}
        <Typography variant="h5" sx={{ mb: 2, fontSize: {xs: '1.25rem', md: '1.5rem'} }}>Comments ({comments.length})</Typography>
        {comments.length > 0 ? comments.map((comment) => {
          const commentAuthorName = comment.author_name || comment.username || 'Anonymous';

          return (
            <Paper key={comment.comment_id} elevation={0} sx={{ border: '1px solid #e0e0e0', p: 2, mb: 2, ml: comment.parent_comment_id ? {xs:2, md:4} : 0, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Avatar sx={{ mr: 1.5, width: 36, height: 36, fontSize: '1rem', bgcolor: 'secondary.main', color: 'white' }}>
                  {commentAuthorName.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{commentAuthorName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {comment.created_at ? formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true }) : ''}
                    {comment.updated_at && comment.updated_at !== comment.created_at && 
                      <Typography component="span" variant="caption" sx={{fontStyle: 'italic'}}> (edited)</Typography>}
                  </Typography>
                </Box>
                {currentUser && comment.user_id !== currentUser.user_id && (
                  <IconButton
                    size="small"
                    aria-label="report comment"
                    onClick={() => handleOpenReportDialog('comment', comment.comment_id)}
                    color="error"
                    title="Report this comment"
                  >
                    <ReportProblemIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', mb: 1, pl: {xs: 0, sm: '52px'}, wordBreak: 'break-word' }}>
                  {comment.content}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pl: {xs: 0, sm: '52px'} }}>
                <Button 
                  size="small"                  startIcon={comment.user_liked ? <HeartIcon fontSize="small" sx={{ color: 'error.main' }}/> : <HeartBorderIcon fontSize="small" sx={{ color: 'error.main' }} />}
                  onClick={() => handleLikeComment(comment.comment_id)}
                  sx={{ mr: 1, textTransform: 'none', color: 'error.main' }}
                  disabled={!currentUser}
                >
                  {comment.like_count || 0}
                </Button>
                <Button 
                  size="small"
                  startIcon={<ReplyIcon fontSize="small"/>}
                  onClick={() => {
                    setReplyTo({ comment_id: comment.comment_id, author_name: commentAuthorName });
                    setNewComment(`@${commentAuthorName} `);
                  }}
                  sx={{textTransform: 'none'}}
                  disabled={!currentUser}
                >
                  Reply
                </Button>
              </Box>
            </Paper>
          );
        }) : (
          <Typography sx={{textAlign: 'center', color: 'text.secondary', my:3}}>No comments yet. Be the first to comment!</Typography>
        )}
        <div ref={commentsEndRef} />

        {/* New Comment Form - sticky */}
        <Paper elevation={3} sx={{ p: {xs:1.5, md:2}, mt: 3, mb:2, position: 'sticky', bottom: 16, background: 'white', zIndex: 1000 }}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
            <Typography variant="subtitle1">
              {replyTo ? `Replying to ${replyTo.author_name}` : 'Leave a Comment'}
            </Typography>
            {replyTo && 
              <IconButton size="small" onClick={() => { setReplyTo(null); setNewComment('');}} aria-label="cancel reply">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            placeholder="Write your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={handleSubmitComment} 
            disabled={submittingComment || !newComment.trim()}
            fullWidth
          >
            {submittingComment ? <CircularProgress size={24} color="inherit"/> : 'Post Comment'}
          </Button>
        </Paper>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog} fullWidth maxWidth="sm">
          <DialogTitle>Report {itemToReport?.type === 'thread' ? 'Thread' : 'Comment'}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{mb:2}}>
              Please provide a reason for reporting this content. Your report will be reviewed by administrators.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="reportReason"
              label="Reason for reporting"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{px:3, pb:2}}>
            <Button onClick={handleCloseReportDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmitReport} 
              variant="contained" 
              color="error" 
              disabled={submittingComment || !reportReason.trim()}
            >
              {submittingComment ? <CircularProgress size={24} color="inherit" /> : 'Submit Report'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  const renderNewThreadForm = () => {
    if (!selectedTopic) {
        return (
            <Box sx={{textAlign: 'center', mt: 4}}>
                <Typography color="error">No topic selected to create a post in.</Typography>
                <Button sx={{mt:2}} startIcon={<ArrowBackIcon />} onClick={() => setView('topics')}>
                    Go to Topics
                </Button>
            </Box>
        );
    }
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: {xs:2, md:3} }}>
                <IconButton onClick={() => setView('threads')} sx={{ mr: 1 }} aria-label="back to threads in current topic">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" component="h1">
                    Create New Post in "{selectedTopicName || 'Selected Topic'}"
                </Typography>
            </Box>
            <Paper sx={{p: {xs:2, md:3}, borderRadius: 2}} elevation={1}>
                <TextField
                    label="Thread Title"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    placeholder="Enter a clear and concise title for your post"
                    required
                />
                <TextField
                    label="Your Content"
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    fullWidth
                    multiline
                    rows={10}
                    variant="outlined"
                    sx={{ mb: 2 }}
                    placeholder="Share your thoughts, ask questions, or start a discussion...\nPlease follow community guidelines."
                    required
                />
                 {/* Optional: Display Community Guidelines Link/Button */}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateNewThread}
                    disabled={loading || !newThreadTitle.trim() || !newThreadContent.trim()}
                    fullWidth
                    size="large"
                    sx={{mt:1}}
                >
                    {loading ? <CircularProgress size={24} color="inherit"/> : 'Publish Thread'}
                </Button>
            </Paper>
        </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {loading && view !== 'threadDetail' && view !== 'threads' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && view === 'topics' && renderTopicList()}
      {view === 'threads' && renderThreads()}
      {view === 'threadDetail' && renderThreadDetailView()}
      {view === 'newThread' && renderNewThreadForm()}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default CommunityScreen;
