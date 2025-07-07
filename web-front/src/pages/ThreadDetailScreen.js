import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  MoreVert,
  FavoriteBorder,
  Favorite,
  Reply,
  Delete,
  Edit,
  Close
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../config';

const ThreadDetailScreen = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);
  
  // For comment menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  
  // For edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  
  // For delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // For snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // For current user
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        setCurrentUser(null);
      }
    }
  }, []);

  const handleMenuOpen = (event, comment) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  const fetchThread = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/community/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThread(response.data);
      setError('');
      // Fetch comments separately
      const commentsResponse = await axios.get(`${API_URL}/community/threads/${threadId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(commentsResponse.data || []);
    } catch (err) {
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line
  }, [threadId]);

  const handleLikeThread = async () => {
    if (!thread) return;
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(`${API_URL}/community/threads/${threadId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setThread(prev => ({
        ...prev,
        like_count: prev.user_liked ? prev.like_count - 1 : prev.like_count + 1,
        user_liked: !prev.user_liked
      }));
    } catch (err) {
      console.error('Error liking thread:', err);
      setSnackbar({
        open: true,
        message: 'Failed to like thread',
        severity: 'error'
      });
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(`${API_URL}/community/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments(prevComments =>
        prevComments.map(comment =>
          comment.comment_id === commentId
            ? {
                ...comment,
                like_count: comment.user_liked ? comment.like_count - 1 : comment.like_count + 1,
                user_liked: !comment.user_liked
              }
            : comment
        )
      );
    } catch (err) {
      console.error('Error liking comment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to like comment',
        severity: 'error'
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const payload = {
        content: newComment.trim(),
        parent_id: replyTo ? replyTo.comment_id : null
      };

      const response = await axios.post(`${API_URL}/community/threads/${threadId}/comments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add the new comment to the list
      setComments([...comments, response.data]);
      setNewComment('');
      setReplyTo(null);
      
      // Scroll to the new comment
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      setSnackbar({
        open: true,
        message: 'Comment posted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error posting comment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to post comment',
        severity: 'error'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = () => {
    if (!selectedComment) return;
    
    setEditContent(selectedComment.content);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteComment = () => {
    if (!selectedComment) return;
    
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const submitEditComment = async () => {
    if (!editContent.trim() || !selectedComment) return;
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.put(`${API_URL}/community/comments/${selectedComment.comment_id}`, 
        { content: editContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the comment in the list
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.comment_id === selectedComment.comment_id
            ? { ...comment, content: editContent.trim(), edited: true }
            : comment
        )
      );
      
      setEditDialogOpen(false);
      setSelectedComment(null);
      
      setSnackbar({
        open: true,
        message: 'Comment updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating comment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update comment',
        severity: 'error'
      });
    }
  };

  const submitDeleteComment = async () => {
    if (!selectedComment) return;
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`${API_URL}/community/comments/${selectedComment.comment_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove the comment from the list
      setComments(prevComments =>
        prevComments.filter(comment => comment.comment_id !== selectedComment.comment_id)
      );
      
      setDeleteDialogOpen(false);
      setSelectedComment(null);
      
      setSnackbar({
        open: true,
        message: 'Comment deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete comment',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderComment = (comment) => {
    const isCurrentUser = comment.user_id === (thread?.user_id);
    
    return (
      <Card key={comment.comment_id} sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ width: 32, height: 32 }}>
                {comment.username?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box ml={1}>
                <Typography variant="body1" fontWeight="bold">
                  {comment.username}
                  {isCurrentUser && (
                    <Typography component="span" variant="body2" color="primary.main" ml={1}>
                      (Author)
                    </Typography>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  {comment.edited && (
                    <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                      (Edited)
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Box>
            
            {/* Only show menu for user's own comments */}
            {comment.is_own && (
              <IconButton size="small" onClick={(e) => handleMenuOpen(e, comment)}>
                <MoreVert fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </Typography>
          
          <Box display="flex" alignItems="center" mt={1}>
            <IconButton size="small" onClick={() => handleLikeComment(comment.comment_id)}>
              {comment.user_liked ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
            </IconButton>
            <Typography variant="body2" mr={2}>
              {comment.like_count} {comment.like_count === 1 ? 'like' : 'likes'}
            </Typography>
            
            <IconButton size="small" onClick={() => setReplyTo(comment)}>
              <Reply fontSize="small" />
            </IconButton>
            <Typography variant="body2">Reply</Typography>
          </Box>
          
          {/* Nested replies would go here */}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="outlined" onClick={fetchThread} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  if (!thread) {
    return (
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Box textAlign="center" py={4}>
          <Typography variant="h6" gutterBottom>
            Thread not found
          </Typography>
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  // Add report button for non-authors
  const showReportButton = currentUser && thread && currentUser.user_id !== thread.user_id;

  // Debug section for troubleshooting
  const debugInfo = (
    <Box sx={{ p: 2, mb: 2, background: '#fffbe6', color: '#333', fontSize: '0.9rem', border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>[Debug Info]</Typography>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
        currentUser: {JSON.stringify(currentUser, null, 2)}
        {'\n'}thread: {JSON.stringify(thread, null, 2)}
        {'\n'}comments.length: {comments.length}
        {'\n'}comments sample: {JSON.stringify(comments.slice(0,2), null, 2)}
      </pre>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 5 }}>
      {debugInfo}
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" ml={1}>Thread</Typography>
        {showReportButton && (
          <Button
            variant="outlined"
            color="error"
            sx={{ ml: 2 }}
            startIcon={<Delete />}
            onClick={() => alert('Report functionality coming soon!')}
          >
            Report
          </Button>
        )}
      </Box>
      
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ width: 40, height: 40 }}>
                {thread.username?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box ml={1}>
                <Typography variant="h6">{thread.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(thread.created_at), 'MMM d, yyyy h:mm a')}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom>{thread.title}</Typography>
          <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
            {thread.content}
          </Typography>
          
          <Box display="flex" alignItems="center">
            <IconButton onClick={handleLikeThread}>
              {thread.user_liked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="body2" mr={2}>
              {thread.like_count} {thread.like_count === 1 ? 'like' : 'likes'}
            </Typography>
            <Typography variant="body2">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>Comments</Typography>
      
      {comments.length === 0 ? (
        <Box textAlign="center" py={3}>
          <Typography variant="body1" color="text.secondary">
            No comments yet. Be the first to comment!
          </Typography>
        </Box>
      ) : (
        comments.map(renderComment)
      )}
      
      {/* Comment form */}
      <Box sx={{ mt: 3, mb: 2 }}>
        {replyTo && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Replying to <b>{replyTo.username}</b>
            </Typography>
            <IconButton size="small" onClick={() => setReplyTo(null)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder={replyTo ? "Write your reply..." : "Add a comment..."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submittingComment}
          variant="outlined"
          sx={{ mb: 1 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {replyTo && (
            <Button 
              onClick={() => setReplyTo(null)} 
              sx={{ mr: 1 }}
              disabled={submittingComment}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submittingComment}
          >
            {submittingComment ? 'Posting...' : replyTo ? 'Reply' : 'Post Comment'}
          </Button>
        </Box>
      </Box>

      {/* Reference for scrolling to bottom after comment */}
      <div ref={commentsEndRef} />
      
      {/* Comment menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditComment}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteComment}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Edit comment dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitEditComment} variant="contained" disabled={!editContent.trim()}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete comment dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this comment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitDeleteComment} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ThreadDetailScreen;