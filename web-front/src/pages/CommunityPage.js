import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  Alert,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as HeartIcon,
  FavoriteBorder as HeartBorderIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon, // Using outline for consistency
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Forum as ForumIcon, // For main page title
  ReportProblem as ReportProblemIcon, // For reporting
  Refresh as RefreshIcon // For refresh buttons
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config'; // Assuming your API base URL is configured here
import { formatDistanceToNow, parseISO } from 'date-fns';

const CommunityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId, threadId } = useParams();

  // View management
  const [view, setView] = useState('topicsList');
  
  // URL sync effect
  useEffect(() => {
    if (threadId) {
      setView('threadDetail');
      setCurrentThread({ thread_id: threadId });
    } else if (topicId) {
      setView('threadsList');
      setCurrentTopic({ topic_id: topicId });
    } else {
      setView('topicsList');
    }
  }, [threadId, topicId]);

  // Custom setView function that updates URL
  const handleViewChange = (newView, data = null) => {
    switch (newView) {
      case 'threadDetail':
        if (data?.thread_id) {
          navigate(`/community/threads/${data.thread_id}`);
        }
        break;
      case 'threadsList':
        if (data?.topic_id) {
          navigate(`/community/topics/${data.topic_id}`);
        }
        break;
      case 'topicsList':
      default:
        navigate('/community');
        break;
    }
    setView(newView);
  };

  // Data states
  const [topics, setTopics] = useState([]);
  const [threads, setThreads] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null); // { topic_id, name, description }
  const [currentThread, setCurrentThread] = useState(null); // Full thread object with comments
  const [comments, setComments] = useState([]); // Specifically for currentThread's comments

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Can be a string or an error object
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [userIsBanned, setUserIsBanned] = useState(false); // New state for ban status

  // Form states
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [replyToComment, setReplyToComment] = useState(null); // { comment_id, author_name }
  const [submitting, setSubmitting] = useState(false); // For form submissions

  // Comment actions menu
  const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState(null);
  const [activeCommentForMenu, setActiveCommentForMenu] = useState(null);
  const [editCommentDialogOpen, setEditCommentDialogOpen] = useState(false);
  const [editCommentText, setEditCommentText] = useState('');
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);

  // Report Dialog State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [itemToReport, setItemToReport] = useState(null); // { type: 'thread'/'comment', id: item_id }

  const commentsEndRef = useRef(null);

  // --- Authorization & User --- 
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userDataString = localStorage.getItem('userData');
    if (!token || !userDataString) {
      navigate('/login');
      return;
    }
    try {
      const parsedUserData = JSON.parse(userDataString);
      setCurrentUser(parsedUserData);
      if (parsedUserData.is_banned === true) {
        setUserIsBanned(true);
        // Optionally navigate away and show snackbar, or just show the Alert below
        // setSnackbar({ open: true, message: 'Access to community restricted. Your account is banned.', severity: 'error' });
        // navigate('/home'); 
        // For now, we will rely on the Alert message rendered below.
      } else {
        setUserIsBanned(false);
      }
    } catch (e) {
      console.error("Failed to parse user data:", e);
      navigate('/login'); // Corrupted user data, force re-login
    }
  }, [navigate]);

  // --- API Service Functions --- (Basic stubs, will be expanded)

  const fetchTopicsAPI = useCallback(async () => {
    if (!currentUser) return; // Ensure user is loaded before fetching
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('userToken');
      const topicsResponse = await axios.get(`${API_URL}/community/topics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let fetchedTopics = topicsResponse.data;
      if (!Array.isArray(fetchedTopics)) {
        console.error("Topics response is not an array:", fetchedTopics);
        throw new Error('Invalid data format for topics.');
      }

      // Attempt to fetch thread counts
      try {
        const countsResponse = await axios.get(`${API_URL}/community/topic-thread-counts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (countsResponse.data && Array.isArray(countsResponse.data)) {
          const countsMap = countsResponse.data.reduce((map, item) => {
            map[item.topic_id] = item.thread_count;
            return map;
          }, {});
          fetchedTopics = fetchedTopics.map(topic => ({
            ...topic,
            thread_count: countsMap[topic.topic_id] !== undefined ? countsMap[topic.topic_id] : 'N/A',
          }));
        }
      } catch (countError) {
        console.warn('Failed to fetch topic thread counts:', countError);
        fetchedTopics = fetchedTopics.map(topic => ({ ...topic, thread_count: 'N/A' }));
        // Non-critical, so don't set main error, maybe a snackbar if desired
      }
      setTopics(fetchedTopics);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err.response?.data?.message || 'Failed to load topics. Please try again.');
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to load topics.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate]); // Added navigate to dependencies

  const fetchThreadsByTopicAPI = useCallback(async (topicId) => {
    if (!currentUser || !topicId) return;
    setLoading(true);
    setError(null);
    setThreads([]); // Clear previous threads
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/community/topics/${topicId}/threads`, {
        headers: { Authorization: `Bearer ${token}` },
        // params: { page: 1, limit: 20 } // Basic pagination params if needed later
      });
      if (response.data && Array.isArray(response.data)) {
        setThreads(response.data);
      } else {
        console.error("Threads response is not an array:", response.data);
        throw new Error('Invalid data format for threads.');
      }
    } catch (err) {
      console.error(`Error fetching threads for topic ${topicId}:`, err);
      const errMsg = err.response?.data?.message || 'Failed to load threads for this topic.';
      setError(errMsg);
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  const fetchThreadDetailsAPI = useCallback(async (threadId) => {
    if (!currentUser || !threadId) return;
    setLoading(true);
    setError(null);
    setCurrentThread(null); // Clear previous detailed thread
    setComments([]); // Clear previous comments
    try {
      const token = localStorage.getItem('userToken');
      
      // Fetch main thread data
      const threadResponse = await axios.get(`${API_URL}/community/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!threadResponse.data) {
        throw new Error('Thread not found or invalid data format.');
      }
      setCurrentThread(threadResponse.data); // Includes author_name, like_count, user_liked etc. from the fixed query
      
      // Fetch comments for the thread
      const commentsResponse = await axios.get(`${API_URL}/community/threads/${threadId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
      });

      // --- START DEBUG LOGS ---
      console.log(`--- Comments for Thread ID: ${threadId} ---`);
      console.log('Full Comments API Response:', commentsResponse); 
      if (commentsResponse.data) {
          console.log('commentsResponse.data:', JSON.stringify(commentsResponse.data, null, 2));
          console.log('Is commentsResponse.data an array?', Array.isArray(commentsResponse.data));
      }
      // --- END DEBUG LOGS ---

      if (commentsResponse.data && Array.isArray(commentsResponse.data)) {
          const sortedComments = commentsResponse.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          setComments(sortedComments);
      } else {
          console.warn(`Comments response for thread ${threadId} is not an array or data is missing:`, commentsResponse.data);
          setComments([]); 
      }

    } catch (err) {
      console.error(`Error fetching details for thread ${threadId}:`, err);
      const errMsg = err.response?.data?.message || 'Failed to load thread details.';
      setError(errMsg);
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
      // Optional: redirect back to threads list if detail fetch fails critically
      // setView('threadsList'); 
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  // --- Action Handlers --- 

  const handleLikeThread = useCallback(async (threadId) => {
    if (!currentThread || !currentUser) return;
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }

    const originalThreadData = JSON.parse(JSON.stringify(currentThread));
    // Optimistic update
    setCurrentThread(prev => prev ? ({ 
        ...prev, 
        like_count: prev.user_liked ? prev.like_count - 1 : prev.like_count + 1,
        user_liked: !prev.user_liked 
    }) : null);

    try {
      await axios.post(`${API_URL}/community/threads/${threadId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error liking thread:', err);
      setSnackbar({ open: true, message: 'Failed to update like status.', severity: 'error' });
      setCurrentThread(originalThreadData); // Revert
    }
  }, [currentUser, currentThread, navigate]);

  const handleLikeComment = useCallback(async (commentId) => {
    if (!currentUser) return;
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }
    
    const originalComments = JSON.parse(JSON.stringify(comments));
    // Optimistic update
    setComments(prevComments => prevComments.map(c =>
      c.comment_id === commentId
        ? { ...c, 
            like_count: c.user_liked ? c.like_count - 1 : c.like_count + 1,
            user_liked: !c.user_liked 
          }
        : c
    ));

    try {
      await axios.post(`${API_URL}/community/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error liking comment:', err);
      setSnackbar({ open: true, message: 'Failed to like comment.', severity: 'error' });
      setComments(originalComments); // Revert
    }
  }, [currentUser, comments, navigate]);

  const handleSubmitComment = useCallback(async () => {
    if (!newCommentContent.trim() || !currentThread?.thread_id || !currentUser) return;
    setSubmitting(true);
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); setSubmitting(false); return; }

    try {
      const payload = {
        content: newCommentContent.trim(),
        parent_comment_id: replyToComment ? replyToComment.comment_id : null
      };
      const response = await axios.post(
        `${API_URL}/community/threads/${currentThread.thread_id}/comments`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newCommentData = response.data; 
      // Add user info to new comment for immediate display if API doesn't return it fully populated
      const populatedComment = { 
        ...newCommentData, 
        username: currentUser.username, // Use current user's name
        like_count: 0, 
        user_liked: false
      };
      setComments(prevComments => [...prevComments, populatedComment].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      setCurrentThread(prev => prev ? ({...prev, comments_count: (prev.comments_count || 0) + 1}) : null); 
      setNewCommentContent('');
      setReplyToComment(null);
      setSnackbar({ open: true, message: 'Comment posted!', severity: 'success' });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    } catch (err) {
      console.error('Error posting comment:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to post comment', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, currentThread, newCommentContent, replyToComment, navigate]);

  // Comment Menu Handlers
  const handleCommentMenuOpen = (event, comment) => {
    event.stopPropagation();
    setCommentMenuAnchorEl(event.currentTarget);
    setActiveCommentForMenu(comment);
  };
  const handleCommentMenuClose = () => {
    setCommentMenuAnchorEl(null); 
    // Don't clear activeCommentForMenu here, needed for dialogs
  };

  // Edit Comment Handlers
  const handleEditCommentOpen = () => {
    if (!activeCommentForMenu) return;
    setEditCommentText(activeCommentForMenu.content);
    setEditCommentDialogOpen(true);
    handleCommentMenuClose();
  };
  const handleEditCommentClose = () => {
    setEditCommentDialogOpen(false);
    setActiveCommentForMenu(null); // Clear after dialog closes
    setEditCommentText('');
  };
  const submitEditComment = useCallback(async () => {
    if (!editCommentText.trim() || !activeCommentForMenu || !currentUser) return;
    setSubmitting(true); // Use general submitting flag or a specific one
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); setSubmitting(false); return; }
    try {
      const response = await axios.put(`${API_URL}/community/comments/${activeCommentForMenu.comment_id}`,
        { content: editCommentText.trim() }, // Sending only content, backend might handle reason if needed
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedComment = response.data; 
      setComments(prevComments => prevComments.map(c =>
        c.comment_id === activeCommentForMenu.comment_id
          ? { ...c, content: updatedComment.content, updated_at: updatedComment.updated_at } 
          : c
      ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      setSnackbar({ open: true, message: 'Comment updated!', severity: 'success' });
      handleEditCommentClose();
    } catch (err) {
      console.error('Error updating comment:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update comment', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, activeCommentForMenu, editCommentText, navigate]);

  // Delete Comment Handlers
  const handleDeleteCommentOpen = () => {
    if (!activeCommentForMenu) return;
    setDeleteCommentDialogOpen(true);
    handleCommentMenuClose();
  };
  const handleDeleteCommentClose = () => {
    setDeleteCommentDialogOpen(false);
    setActiveCommentForMenu(null); // Clear after dialog closes
  };
  const submitDeleteComment = useCallback(async () => {
    if (!activeCommentForMenu || !currentUser) return;
    setSubmitting(true);
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); setSubmitting(false); return; }
    try {
      await axios.delete(`${API_URL}/community/comments/${activeCommentForMenu.comment_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
       setComments(prevComments => prevComments.filter(c => c.comment_id !== activeCommentForMenu.comment_id));
       setCurrentThread(prev => prev ? ({...prev, comments_count: Math.max(0, (prev.comments_count || 0) - 1)}) : null);
      setSnackbar({ open: true, message: 'Comment deleted!', severity: 'success' });
      handleDeleteCommentClose();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete comment', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, activeCommentForMenu, navigate]);

  // --- Report Handlers ---
  const handleOpenReportDialog = (type, id) => {
    setItemToReport({ type, id });
    setReportDialogOpen(true);
    setReportReason(''); // Clear previous reason
  };

  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
    setItemToReport(null);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!itemToReport || !reportReason.trim() || !currentUser) return;
    setSubmitting(true);
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); setSubmitting(false); return; }

    const payload = {
      reason: reportReason.trim(),
      thread_id: itemToReport.type === 'thread' ? itemToReport.id : null,
      comment_id: itemToReport.type === 'comment' ? itemToReport.id : null,
    };

    try {
      // Assuming your report endpoint is POST /api/community/reports
      await axios.post(`${API_URL}/community/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: 'Report submitted successfully. Thank you.', severity: 'success' });
      handleCloseReportDialog();
    } catch (err) {
      console.error('Error submitting report:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to submit report.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Main Effect for View-Based Data Fetching ---
  useEffect(() => {
    if (!currentUser) return; 
    
    setError(null); // Clear any previous errors when the view changes

    if (view === 'topicsList') {
      fetchTopicsAPI();
      setCurrentTopic(null);
      setThreads([]);
      setCurrentThread(null);
    } else if (view === 'threadsList' && currentTopic?.topic_id) {
      fetchThreadsByTopicAPI(currentTopic.topic_id);
      setCurrentThread(null); // Clear any previously viewed thread
    } else if (view === 'threadDetail' && currentThread?.thread_id) {
      // Now call the function to fetch full details
      fetchThreadDetailsAPI(currentThread.thread_id);
    } else if (view === 'newThreadForm') {
      setNewThreadTitle('');
      setNewThreadContent('');
    }
    // Added fetchThreadDetailsAPI to dependencies
  }, [view, currentUser, currentTopic, currentThread?.thread_id, fetchTopicsAPI, fetchThreadsByTopicAPI, fetchThreadDetailsAPI, handleLikeThread, handleLikeComment, handleSubmitComment, submitEditComment, submitDeleteComment, navigate]); 

  // --- Snackbar Handler ---
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // --- Render Functions ---
  const renderTopicsList = () => {
    if (loading && topics.length === 0) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
    }
    if (!loading && topics.length === 0 && !error) {
      return <Typography sx={{textAlign: 'center', my: 5, color: 'text.secondary'}}>No topics available at the moment.</Typography>;
    }

    return (
      <Grid container spacing={1.25}>
        {topics.map(topic => (
          <Grid item xs={12} sm={6} key={topic.topic_id}>
            <Card sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              minHeight: 200,
              transition: 'box-shadow 0.3s', 
              '&:hover': { boxShadow: 6 }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom noWrap={false}>
                  {topic.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  minHeight: '60px',
                }}>
                  {topic.description || 'No description provided.'}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', p:2, borderTop: '1px solid #eee' }}>
                <Chip label={`Threads: ${topic.thread_count === 'N/A' ? 'N/A' : topic.thread_count}`} size="small" />
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => {
                    setCurrentTopic(topic);
                    handleViewChange('threadsList', topic);
                  }}
                >
                  View Threads
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderThreadsList = () => {
    if (loading && threads.length === 0) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
    }
    if (!loading && threads.length === 0 && !error && currentTopic) {
      return (
        <Box sx={{textAlign: 'center', my:5}}>
          <Typography variant="h5" gutterBottom>No Threads Yet in "{currentTopic.name}"</Typography>
          <Typography color="text.secondary" paragraph>
            Be the first to start a discussion in this topic!
          </Typography>
          <Button 
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleViewChange('newThreadForm')}
            sx={{mr: 2}}
          >
            Create New Post
          </Button>
          <Button variant="outlined" onClick={() => handleViewChange('topicsList')} startIcon={<ArrowBackIcon />}>
            Back to Topics
          </Button>
        </Box>
      );
    }
    // Error is handled by global snackbar and error display above view switcher

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <Button 
            onClick={() => handleViewChange('topicsList')} 
            startIcon={<ArrowBackIcon />} 
            sx={{mb: {xs:1, sm:0}}} // Margin bottom on xs screens
          >
            Back to Topics
          </Button>
          <Typography variant="h4" component="h2" sx={{ textAlign: 'center', flexGrow: 1, my:1, fontSize: {xs: '1.6rem', md: '2.125rem'} }}>
            {currentTopic?.name || 'Threads'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            Refresh
            <IconButton 
              onClick={() => fetchThreadsByTopicAPI(currentTopic?.topic_id)}
              disabled={loading || !currentUser}
              aria-label="refresh threads"
            >
              <RefreshIcon />
            </IconButton>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleViewChange('newThreadForm')} 
              sx={{mb: {xs:1, sm:0}}} // Margin bottom on xs screens
            >
              Create New Post
            </Button>
          </Box>
        </Box>

        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          {threads.map((thread, index) => {
            return (
              <React.Fragment key={thread.thread_id}>
                <ListItem 
                  alignItems="flex-start"
                  button 
                  onClick={() => {
                    setCurrentThread({ thread_id: thread.thread_id, title: thread.title }); 
                    setComments([]); 
                    handleViewChange('threadDetail', thread);
                  }}
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                    py: {xs: 1.5, md: 2} 
                  }}
                >
                  <ListItemText
                    primary={<Typography variant="h6" component="h3" sx={{fontWeight: 500, mb: 0.5}}>{thread.title}</Typography>}
                    secondaryTypographyProps={{component: 'div'}}
                    secondary={
                      <Box component="div" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                          By: {thread.author_name || 'Unknown User'} 
                          {' • '} 
                          {thread.created_at ? formatDistanceToNow(parseISO(thread.created_at), { addSuffix: true }) : 'Recently'}
                        </Typography>                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5}}>
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <HeartBorderIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'error.main' }} /> 
                            <Typography variant="caption">{thread.like_count || 0} Likes</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <ChatBubbleOutlineIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                            <Typography variant="caption">{thread.comments_count || 0} Comments</Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < threads.length - 1 && <Divider component="li" variant="inset" />}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    );
  }

  // NEW: Render Thread Detail View
  const renderThreadDetailView = () => {
    if (loading && !currentThread) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
    }
    if (!currentThread) {
      return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="error">{error || 'Thread data is unavailable.'}</Typography>
          <Button sx={{mt:2}} startIcon={<ArrowBackIcon />} onClick={() => handleViewChange(currentTopic ? 'threadsList' : 'topicsList')}>
            Back
          </Button>
        </Box>
      );
    }

    // Debug section for troubleshooting
    const debugInfo = (
      <Paper elevation={1} sx={{ p: 2, mb: 2, background: '#fffbe6', color: '#333', fontSize: '0.9rem' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>[Debug Info]</Typography>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
          currentUser: {JSON.stringify(currentUser, null, 2)}
          {'\n'}currentThread: {JSON.stringify(currentThread, null, 2)}
          {'\n'}comments.length: {comments.length}
          {'\n'}comments sample: {JSON.stringify(comments.slice(0,2), null, 2)}
        </pre>
      </Paper>
    );

    const { 
      title = 'Untitled Thread', 
      content = 'No content.', 
      author_name = 'Unknown Author',
      created_at, 
      like_count = 0, 
      user_liked = false, 
      comments_count = 0,
      user_id: author_id
    } = currentThread;

    // Debug logs
    console.log('Current User:', currentUser);
    console.log('Thread Author ID:', author_id);
    console.log('Should show report button:', currentUser && currentUser.user_id !== author_id);

    return (
      <Box>
        {debugInfo}
        {/* Header with Back Button and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: {xs: 2, md:3} }}>
          <IconButton onClick={() => handleViewChange('threadsList')} sx={{ mr: 1 }} aria-label="back to threads list">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontSize: {xs: '1.5rem', md: '2rem'}, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            Refresh
            <IconButton 
              onClick={() => fetchThreadDetailsAPI(currentThread?.thread_id)}
              disabled={loading || !currentUser}
              aria-label="refresh thread"
            >
              <RefreshIcon />
            </IconButton>
            {currentUser && currentUser.user_id !== author_id && (
              <Tooltip title="Report this thread">
                <IconButton 
                  aria-label="report thread" 
                  onClick={() => handleOpenReportDialog('thread', currentThread.thread_id)}
                  color="error"
                >
                  <ReportProblemIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Main Thread Content Paper */}
        <Paper elevation={3} sx={{ p: {xs:2, md:3}, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Posted by {author_name} • {new Date(created_at).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {content}
          </Typography>
        </Paper>

        {/* Comments Section */}
        <Typography variant="h5" sx={{ mb: 2, fontSize: {xs: '1.25rem', md: '1.5rem'} }}>Comments ({comments.length})</Typography>
        
        {comments.length > 0 ? comments.map((comment) => {
          const commentAuthorName = comment.username || 'Anonymous';
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
                {currentUser && comment.user_id === currentUser.user_id && (
                  <IconButton size="small" onClick={(e) => handleCommentMenuOpen(e, comment)} aria-label="actions for your comment">
                    <MoreVertIcon />
                  </IconButton>
                )}
                {currentUser && comment.user_id !== currentUser.user_id && (
                  <Tooltip title="Report comment">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenReportDialog('comment', comment.comment_id)}
                      color="error"
                    >
                      <ReportProblemIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', mb: 1, pl: {xs: 0, sm: '52px'}, wordBreak: 'break-word' }}>
                {comment.content}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', pl: {xs: 0, sm: '52px'} }}>                <Button 
                  size="small"
                  startIcon={comment.user_liked ? <HeartIcon sx={{ color: 'error.main' }} fontSize="small"/> : <HeartBorderIcon sx={{ color: 'error.main' }} fontSize="small"/>}
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
                    setReplyToComment({ comment_id: comment.comment_id, author_name: commentAuthorName });
                    setNewCommentContent(`@${commentAuthorName} `);
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

        {/* New Comment Form */}
        {currentUser && !userIsBanned && (
          <Paper elevation={3} sx={{ p: {xs:1.5, md:2}, mt: 3, mb:2, position: 'sticky', bottom: 16, background: 'white', zIndex: 1000 }}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
              <Typography variant="subtitle1">
                {replyToComment ? `Replying to ${replyToComment.author_name}` : 'Leave a Comment'}
              </Typography>
              {replyToComment && 
                <IconButton size="small" onClick={() => { setReplyToComment(null); setNewCommentContent('');}} aria-label="cancel reply">
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
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={handleSubmitComment} 
              disabled={submitting || !newCommentContent.trim()}
              fullWidth
            >
              {submitting ? <CircularProgress size={24} color="inherit"/> : 'Post Comment'}
            </Button>
          </Paper>
        )}
      </Box>
    );
  };

  // Placeholder for New Thread Form render function
  const renderNewThreadForm = () => {
    // ... To be implemented ...
    return <Typography>New Thread Form View (Not implemented yet)</Typography>;
  }

  // --- Main Component Render ---
  console.log('[CommunityPage Render] Current View:', view);
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper elevation={0} sx={{ p: {xs: 2, md:3}, mb: {xs:2, md:4}, backgroundColor: 'transparent' }}>
        <Box sx={{display: 'flex', alignItems: 'center', mb:2}}>
            <ForumIcon color="primary" sx={{fontSize: '2.5rem', mr: 1.5}}/>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1, fontSize: {xs: '1.8rem', md: '2.5rem'} }}>
              Community Hub
            </Typography>
        </Box>
        {/* Breadcrumbs or global actions could go here */}
      </Paper>

      {userIsBanned && (
        <Alert severity="error" sx={{mb:3}}>
          Your account has been banned from accessing the community. Please contact support for more information.
        </Alert>
      )}

      {/* Global loading indicator for initial load or critical transitions? Handled per view for now */}
      {/* {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>} */} 
      
      {error && !loading && !userIsBanned && (
        <Alert severity="error" sx={{mb:3}} onClose={() => setError(null)}>
          An error occurred: {typeof error === 'string' ? error : error.message || 'Please try again later.'}
        </Alert>
      )}

      {/* View-based rendering */}
      {currentUser && !userIsBanned && (
        <Box>
          {view === 'topicsList' && renderTopicsList()}
          {view === 'threadsList' && renderThreadsList()}
          {view === 'threadDetail' && renderThreadDetailView()}
          {view === 'newThreadForm' && <Typography>New Thread Form for {currentTopic?.name} (To be implemented)</Typography>}
        </Box>
      )}
      {!currentUser && !loading && !userIsBanned && (
          <Typography sx={{textAlign: 'center', my: 5}}>Please log in to access the community.</Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', boxShadow: 6 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Comment Action Menus and Dialogs */} 
      {activeCommentForMenu && (
        <React.Fragment>
          <Menu
            anchorEl={commentMenuAnchorEl}
            open={Boolean(commentMenuAnchorEl)}
            onClose={handleCommentMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top'}}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom'}}
          >
            <MenuItem onClick={handleEditCommentOpen}><EditIcon fontSize="small" sx={{mr:1}}/> Edit</MenuItem>
            <MenuItem onClick={handleDeleteCommentOpen} sx={{color: 'error.main'}}><DeleteIcon fontSize="small" sx={{mr:1}}/> Delete</MenuItem>
          </Menu>

          <Dialog open={editCommentDialogOpen} onClose={handleEditCommentClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Your comment"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
              />
            </DialogContent>
            <DialogActions sx={{px:3, pb:2}}>
              <Button onClick={handleEditCommentClose}>Cancel</Button>
              <Button onClick={submitEditComment} variant="contained" disabled={submitting || !editCommentText.trim()}>
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes' }
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteCommentDialogOpen} onClose={handleDeleteCommentClose}>
            <DialogTitle>Delete Comment?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this comment? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{pb:2, px:2}}>
              <Button onClick={handleDeleteCommentClose}>Cancel</Button>
              <Button onClick={submitDeleteComment} color="error" variant="contained" disabled={submitting}>
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Delete' }
              </Button>
            </DialogActions>
          </Dialog>
        </React.Fragment>
      )}

      {/* Report Dialog */}
      {itemToReport && (
        <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog} fullWidth maxWidth="sm">
          <DialogTitle>Report {itemToReport.type === 'thread' ? 'Thread' : 'Comment'}</DialogTitle>
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
              disabled={submitting || !reportReason.trim()}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Report'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default CommunityPage;

