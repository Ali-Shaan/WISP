import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Tabs,
  Tab,
  AppBar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton as MuiIconButton,
  Chip,
  Alert as MuiAlert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  PeopleAlt as PeopleAltIcon,
  Assessment as AssessmentIcon,
  ReportProblem as ReportProblemIcon,
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  NotInterested as NotInterestedIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';
import { formatDistanceToNow, parseISO } from 'date-fns';

const AdminPanelPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');

  // Register ChartJS components
  ChartJS.register(ArcElement, Tooltip, Legend);

  // State for confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [openBanDialog, setOpenBanDialog] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banAction, setBanAction] = useState(null); // 'ban' or 'unban'

  const [usersList, setUsersList] = useState([]);
  const [moodSummaryData, setMoodSummaryData] = useState(null);
  const [reportedItems, setReportedItems] = useState([]);

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setCurrentUser(userData);
        if (!(userData.isAdmin === true || userData.role === 'admin')) {
          console.warn("User is not an admin (checked in AdminPanelPage EFFECT). Redirecting...");
          navigate('/home');
        } else {
          console.log("User IS admin (checked in AdminPanelPage EFFECT). currentUser state is being set with:", userData);
        }
      } catch (e) {
        console.error("Error parsing userData in AdminPanelPage or user is not admin:", e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const fetchUsersAPI = useCallback(async () => {
    if (!currentUser) return;
    setTabLoading(true);
    setError(null);
    setUsersList([]);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/users/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setUsersList(response.data);
      } else {
        console.warn("Users list response is not an array:", response.data);
        setUsersList([]);
        setSnackbar({ open: true, message: 'Received invalid user data format.', severity: 'warning' });
      }
    } catch (err) {
      console.error("Error fetching users list:", err);
      const errMsg = err.response?.data?.message || 'Failed to load users.';
      setError(errMsg);
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setTabLoading(false);
    }
  }, [currentUser]);

  const fetchMoodSummaryAPI = useCallback(async () => {
    if (!currentUser) return;
    setTabLoading(true);
    setError(null);
    setMoodSummaryData(null);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/moods/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMoodSummaryData(response.data);
    } catch (err) {
      console.error("Error fetching mood summary:", err);
      const errMsg = err.response?.data?.message || 'Failed to load mood summary.';
      setError(errMsg);
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setTabLoading(false);
    }
  }, [currentUser]);

  const fetchReportedContentAPI = useCallback(async () => {
    if (!currentUser) return;
    console.log('[AdminPanelPage] Fetching reported content...');
    setTabLoading(true);
    setError(null);
    setReportedItems([]);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/community/reports?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[AdminPanelPage] Reported content API response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setReportedItems(response.data);
      } else {
        console.warn("[AdminPanelPage] Reported content response is not an array:", response.data);
        setReportedItems([]);
      }
    } catch (err) {
      console.error("[AdminPanelPage] Error fetching reported content:", err);
      const errMsg = err.response?.data?.message || 'Failed to load reported content.';
      setError(errMsg);
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setTabLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || loading) return;

    setError(null);

    if (selectedTab === 0) {
      console.log("Admin Panel: Switched to User Management tab, fetching users...");
      fetchUsersAPI();
    } else if (selectedTab === 1) {
      console.log("Admin Panel: Switched to Mood Summary tab, fetching summary...");
      fetchMoodSummaryAPI();
    } else if (selectedTab === 2) {
      console.log("Admin Panel: Switched to Reported Content tab, fetching...");
      fetchReportedContentAPI();
    }
  }, [selectedTab, currentUser, loading, fetchUsersAPI, fetchMoodSummaryAPI, fetchReportedContentAPI]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // --- Delete User Handlers ---
  const handleClickOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setTabLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`${API_URL}/users/${userToDelete.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsersList(prevUsers => prevUsers.filter(u => u.user_id !== userToDelete.user_id));
      setSnackbar({ open: true, message: `User ${userToDelete.username} deleted successfully.`, severity: 'success' });
    } catch (err) {
      console.error("Error deleting user:", err);
      const errMsg = err.response?.data?.message || 'Failed to delete user.';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setTabLoading(false);
      handleCloseDeleteDialog();
    }
  };

  // --- Ban/Unban User Handlers ---
  const handleClickOpenBanDialog = (user, action) => {
    setUserToBan(user);
    setBanAction(action); // 'ban' or 'unban'
    setOpenBanDialog(true);
  };

  const handleCloseBanDialog = () => {
    setOpenBanDialog(false);
    setUserToBan(null);
    setBanAction(null);
  };

  const handleToggleBanUser = async () => {
    if (!userToBan || !banAction) return;
    const newBanStatus = banAction === 'ban';
    setTabLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.put(`${API_URL}/users/${userToBan.user_id}/ban-status`, 
        { is_banned: newBanStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsersList(prevUsers => 
        prevUsers.map(u => u.user_id === userToBan.user_id ? { ...u, is_banned: newBanStatus } : u)
      );
      setSnackbar({ open: true, message: response.data.message || `User ${newBanStatus ? 'banned' : 'unbanned'} successfully.`, severity: 'success' });
    } catch (err) {
      console.error("Error toggling ban status:", err);
      const errMsg = err.response?.data?.message || 'Failed to update ban status.';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setTabLoading(false);
      handleCloseBanDialog();
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      const token = localStorage.getItem('userToken');
      const userId = localStorage.getItem('userId');
      await axios.delete(`${API_URL}/community/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Thread deleted successfully', severity: 'success' });
      // Refresh the reported items list
      fetchReportedContentAPI();
    } catch (err) {
      console.error('Error deleting thread:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete thread', severity: 'error' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`${API_URL}/community/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Comment deleted successfully', severity: 'success' });
      // Refresh the reported items list
      fetchReportedContentAPI();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete comment', severity: 'error' });
    }
  };

  const handleResolveReport = async (reportId, action) => {
    console.log(`[AdminPanelPage] handleResolveReport called with reportId: ${reportId}, action: ${action}`);
    try {
      const token = localStorage.getItem('userToken');
      await axios.patch(`${API_URL}/community/reports/${reportId}`, {
        status: action === 'delete' ? 'resolved' : 'rejected'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: `Report ${action === 'delete' ? 'resolved' : 'rejected'} successfully`, severity: 'success' });
      // Refresh the reported items list
      console.log('[AdminPanelPage] Report resolved/rejected, now fetching updated list...');
      fetchReportedContentAPI();
    } catch (err) {
      console.error('[AdminPanelPage] Error resolving report:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to resolve report', severity: 'error' });
    }
  };

  const renderUsersList = () => {
    const filteredUsers = usersList.filter(user => 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Paper elevation={2} sx={{ p: {xs:1, md:2}, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
          <Typography variant="h6">User Management ({filteredUsers.length})</Typography>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 250 }}
          />
        </Box>
        
        {tabLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {error && !tabLoading && <MuiAlert severity="error" sx={{m:2}}>{error}</MuiAlert>}
        {!tabLoading && !error && filteredUsers.length === 0 && (
          <Typography color="text.secondary" sx={{p:2, textAlign:'center'}}>No users found.</Typography>
        )}
        {!tabLoading && !error && filteredUsers.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id || user.id}>
                    <TableCell>{user.user_id || user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role === 'admin' ? 'Admin' : (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A')}
                        size="small" 
                        color={user.role === 'admin' ? 'secondary' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? 
                        <Chip label="Banned" size="small" color="error" variant="outlined"/> : 
                        <Chip label="Active" size="small" color="success" variant="outlined"/>
                      }
                    </TableCell>
                    <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                       
                        <MuiIconButton size="small" title="Delete User" onClick={() => handleClickOpenDeleteDialog(user)}>
                          <DeleteIcon color="error" />
                        </MuiIconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    );
  };

  const renderMoodSummary = () => {
    const chartData = moodSummaryData?.mood_counts ? {
      labels: Object.keys(moodSummaryData.mood_counts).map(mood => mood.charAt(0).toUpperCase() + mood.slice(1)),
      datasets: [{
        data: Object.values(moodSummaryData.mood_counts),
        backgroundColor: [
          '#FF6384', // Red for negative moods
          '#36A2EB', // Blue for calm
          '#FFCE56', // Yellow for happy
          '#4BC0C0', // Turquoise for content
          '#9966FF', // Purple for other moods
          '#FF9F40', // Orange
          '#A8B3C5', // Grey
        ],
        borderWidth: 1
      }]
    } : null;

    return (
      <Paper elevation={2} sx={{ p: {xs:1, md:2}, mt: 2 }}>
        <Typography variant="h6" gutterBottom sx={{px:1, pt:1}}>Overall Mood Summary</Typography>
        {tabLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {error && !tabLoading && <MuiAlert severity="error" sx={{m:2}}>{error}</MuiAlert>}
        {!tabLoading && !error && !moodSummaryData && (
          <Typography color="text.secondary" sx={{p:2, textAlign:'center'}}>No mood summary data available or yet to load.</Typography>
        )}
        {!tabLoading && !error && moodSummaryData && (
          <Box sx={{p:2}}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1"><b>Total Entries:</b></Typography>
                <Typography gutterBottom>{moodSummaryData.total_entries !== undefined ? moodSummaryData.total_entries : 'N/A'}</Typography>
                
                <Typography variant="subtitle1"><b>Average Mood Score:</b></Typography>
                <Typography gutterBottom>{moodSummaryData.average_mood_score !== undefined ? parseFloat(moodSummaryData.average_mood_score).toFixed(2) : 'N/A'}</Typography>
                
                <Typography variant="subtitle1"><b>Mood Distribution:</b></Typography>
                {moodSummaryData.mood_counts && typeof moodSummaryData.mood_counts === 'object' ? (
                  Object.entries(moodSummaryData.mood_counts).map(([mood, count]) => (
                    <Typography key={mood} gutterBottom>{`${mood.charAt(0).toUpperCase() + mood.slice(1)}: ${count}`}</Typography>
                  ))
                ) : (
                  <Typography>N/A</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {chartData && <Pie data={chartData} options={{ maintainAspectRatio: false }} />}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    );
  };

  const renderReportedContent = () => {
    if (tabLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
    }
    if (error) {
      return <MuiAlert severity="error" sx={{m:2}}>{error}</MuiAlert>;
    }
    if (reportedItems.length === 0) {
      return (
        <Paper elevation={2} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No Pending Reports</Typography>
          <Typography color="text.secondary">There is no content currently awaiting review.</Typography>
        </Paper>
      );
    }

    return (
      <Paper elevation={2} sx={{ p: {xs:1, md:2}, mt: 2 }}>
        <Typography variant="h6" gutterBottom sx={{px:1, pt:1}}>Pending Reported Content ({reportedItems.length})</Typography>
        <List dense>
          {reportedItems.map((item) => (
            <React.Fragment key={item.report_id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={`Report ID: ${item.report_id} - ${item.thread_id ? 'Thread' : (item.comment_id ? 'Comment' : 'Unknown')}`}
                  secondaryTypographyProps={{component: 'div'}}
                  secondary={
                    <Box component="div">
                      <Typography variant="body2" color="text.primary">Reason: {item.reason}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reported by: {item.reporter_username || 'Unknown'} on {new Date(item.created_at).toLocaleString()}
                      </Typography>
                      {item.thread_id && (
                        <>
                          <Typography variant="caption" display="block">
                            Thread Title: {item.thread_title || 'N/A'} (ID: {item.thread_id})
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteThread(item.thread_id)}
                              sx={{ mr: 1 }}
                            >
                              Delete Thread
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleResolveReport(item.report_id, 'reject')}
                            >
                              Ignore Report
                            </Button>
                          </Box>
                        </>
                      )}
                      {item.comment_id && (
                        <>
                          <Typography variant="caption" display="block">
                            Comment: {item.comment_content ? (item.comment_content.substring(0,100) + (item.comment_content.length > 100 ? '...' : '')) : 'N/A'}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteComment(item.comment_id)}
                              sx={{ mr: 1 }}
                            >
                              Delete Comment
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleResolveReport(item.report_id, 'reject')}
                            >
                              Ignore Report
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

  if (loading) {
    console.log("AdminPanelPage: Render phase - loading is true.");
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }
  
  console.log("AdminPanelPage: Render phase - loading is false. currentUser:", currentUser);

  if (!currentUser) {
    console.warn("AdminPanelPage: Render phase - currentUser is null/undefined after loading. Displaying Access Denied.");
    return (
        <Container maxWidth="sm">
            <Paper sx={{p:3, mt:5, textAlign: 'center'}}>
                <Typography variant="h5" color="error">Access Denied</Typography>
                <Typography sx={{mt:1}}>Could not verify user permissions.</Typography>
                <Button variant="contained" onClick={() => navigate('/home')} sx={{mt:2}}>Go to Home</Button>
            </Paper>
        </Container>
    );
  }

  if (!(currentUser.isAdmin === true || currentUser.role === 'admin')) {
      console.warn("AdminPanelPage: Render phase - currentUser IS NOT ADMIN. Displaying Access Denied. currentUser data:", currentUser);
      return (
          <Container maxWidth="sm">
              <Paper sx={{p:3, mt:5, textAlign: 'center'}}>
                  <Typography variant="h5" color="error">Access Denied</Typography>
                  <Typography sx={{mt:1}}>You do not have permission to view this page.</Typography>
                  <Button variant="contained" onClick={() => navigate('/home')} sx={{mt:2}}>Go to Home</Button>
              </Paper>
          </Container>
      );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper elevation={0} sx={{ p: {xs:1, md:2}, mb: {xs:2, md:3}, backgroundColor: 'transparent' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: {xs: 2, sm: 0} }}>
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: {xs: '2rem', md: '2.5rem'}, mr: 1.5 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: {xs: '1.8rem', md: '2.2rem'} }}>
              Admin Panel
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/home')}
          >
            Back to App
          </Button>
        </Box>
      </Paper>

      <AppBar position="static" color="default" elevation={1} sx={{borderRadius: 1}}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="Admin panel sections"
        >
          <Tab label="User Management" icon={<PeopleAltIcon />} iconPosition="start" id="admin-tab-0" aria-controls="admin-tabpanel-0" />
          <Tab label="Mood Summary" icon={<AssessmentIcon />} iconPosition="start" id="admin-tab-1" aria-controls="admin-tabpanel-1" />
          <Tab label="Reported Content" icon={<ReportProblemIcon />} iconPosition="start" id="admin-tab-2" aria-controls="admin-tabpanel-2" />
        </Tabs>
      </AppBar>

      <Box mt={3}>
        {selectedTab === 0 && renderUsersList()}
        {selectedTab === 1 && renderMoodSummary()}
        {selectedTab === 2 && renderReportedContent()}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Ban/Unban Confirmation Dialog */}
      <Dialog open={openBanDialog} onClose={handleCloseBanDialog}>
        <DialogTitle>{banAction === 'ban' ? 'Confirm Ban User' : 'Confirm Unban User'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {banAction} the user "{userToBan?.username}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBanDialog}>Cancel</Button>
          <Button onClick={handleToggleBanUser} color={banAction === 'ban' ? 'warning' : 'success'}>
            {banAction === 'ban' ? 'Ban User' : 'Unban User'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default AdminPanelPage;