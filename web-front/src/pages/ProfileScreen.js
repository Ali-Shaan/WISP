import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LockOutlined as LockIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

// Helper function to format Date to HH:MM:SS
const formatTimeToHHMMSS = (date) => {
  if (!(date instanceof Date)) return null; // Handle cases where date might not be a Date object
  try {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Error formatting time:", e, date);
    return null; // Return null if formatting fails
  }
};

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [preferredMoodTime, setPreferredMoodTime] = useState(new Date());
  const [hydrationGoal, setHydrationGoal] = useState('2000'); // Default 2L
  const [mindfulnessReminderTime, setMindfulnessReminderTime] = useState(new Date());
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  // Journal Password State
  const [journalPasswordStatus, setJournalPasswordStatus] = useState('checking'); // 'checking', 'set', 'not_set'
  const [currentJournalPassword, setCurrentJournalPassword] = useState(''); // For verification before remove/change
  const [newJournalPassword, setNewJournalPassword] = useState('');
  const [confirmJournalPassword, setConfirmJournalPassword] = useState('');
  const [journalPasswordSaving, setJournalPasswordSaving] = useState(false);
  const [journalPasswordError, setJournalPasswordError] = useState('');

  // Wrap loadUserData in useCallback
  const loadUserData = useCallback(async () => {
    console.log("[ProfileScreen] loadUserData triggered."); // Add log
    setLoading(true); // Show loading indicator when reloading
    setError(''); // Clear previous errors
    try {
      const userDataString = localStorage.getItem('userData');
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log("[ProfileScreen] Profile image in userData:", 
          userData.profile_image ? `Found (${userData.profile_image.substring(0, 30)}...)` : 'Not found');
        
        // --- DEBUG: Log Parsed Data ---
        console.log("[ProfileScreen] Parsed userData. Keys:", Object.keys(userData));
        console.log("[ProfileScreen] Parsed profile_image length:", userData.profile_image?.length);
        // --- END DEBUG ---
        
        setUser(userData); // Set the base user object
        // --- Set form fields from loaded data ---
        setUsername(userData.username || '');
        setFullName(userData.full_name || '');
        setEmail(userData.email || '');
        setGender(userData.gender || '');
        setBio(userData.bio || '');
        setEmergencyContactName(userData.emergency_contact_name || '');
        setEmergencyContactPhone(userData.emergency_contact_phone || '');

        // Handle profile image
        if (userData.profile_image) {
          setProfileImage(userData.profile_image);
        }
        
        // Handle date of birth - convert string to Date object
        if (userData.date_of_birth) {
          setDateOfBirth(new Date(userData.date_of_birth));
        }

        // Handle preferred mood tracking time
        if (userData.preferred_mood_time) {
          try {
            const [hours, minutes, seconds] = userData.preferred_mood_time.split(':').map(Number);
            const moodTime = new Date();
            moodTime.setHours(hours, minutes, seconds);
            setPreferredMoodTime(moodTime);
          } catch (e) {
            console.error("Error parsing preferred_mood_time:", e);
            // Use default time if parsing fails
            const defaultTime = new Date();
            defaultTime.setHours(20, 0, 0); // 8:00 PM
            setPreferredMoodTime(defaultTime);
          }
        }

        // Handle mindfulness reminder time
        if (userData.mindfulness_reminder_time) {
          try {
            const [hours, minutes, seconds] = userData.mindfulness_reminder_time.split(':').map(Number);
            const mindfulnessTime = new Date();
            mindfulnessTime.setHours(hours, minutes, seconds);
            setMindfulnessReminderTime(mindfulnessTime);
          } catch (e) {
            console.error("Error parsing mindfulness_reminder_time:", e);
            // Use default time if parsing fails
            const defaultTime = new Date();
            defaultTime.setHours(8, 0, 0); // 8:00 AM
            setMindfulnessReminderTime(defaultTime);
          }
        }

        // Handle hydration goal
        if (userData.hydration_goal_ml) {
          setHydrationGoal(userData.hydration_goal_ml.toString());
        }

      } else {
        // No user data found, redirect to login
        navigate('/login');
        return;
      }

      // After user data is loaded, check journal password status
      await checkJournalPasswordStatus();
    } catch (e) {
      console.error("Error loading user data:", e);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleUpdate = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Prepare data for update
      const updatedData = {
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        email: email.trim() || null,
        gender: gender || null,
        bio: bio.trim() || null,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
        preferred_mood_time: formatTimeToHHMMSS(preferredMoodTime),
        water_goal_ml: parseInt(hydrationGoal, 10) || 2000,
        mindfulness_reminder_time: formatTimeToHHMMSS(mindfulnessReminderTime),
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        profile_image: profileImage
      };

      // Send update request
      const response = await axios.put(
        `${API_URL}/users/me`,
        updatedData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local storage with new data
      localStorage.setItem('userData', JSON.stringify(response.data));
      setUser(response.data);
      setIsEditing(false);

      // Show success message
      setError('Profile updated successfully!');
      setTimeout(() => setError(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all local storage items
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      
      // Navigate to login screen
      navigate('/login');
    } catch (error) {
      console.error("Error during logout:", error);
      setError('Failed to logout. Please try again.');
    }
  };

  const pickImage = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target.result;
          setProfileImage(base64Image);
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // ---- Journal Password Functions ----
  const checkJournalPasswordStatus = async () => {
    setJournalPasswordStatus('checking');
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');
      
      // Try to verify with a dummy password to see if journal password is set
      await axios.post(
        `${API_URL}/users/me/journal-password/verify`, 
        { password: `dummy_check_${Date.now()}` }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // If verify succeeds without 401, password is not set
      setJournalPasswordStatus('not_set');
    } catch (err) {
      if (err.response?.status === 401) {
        // 401 means password is set but invalid
        setJournalPasswordStatus('set');
      } else if (err.response?.status === 400 && 
                err.response?.data?.message === 'Journal password is not set.') {
        // Explicit message that password is not set
        setJournalPasswordStatus('not_set');
      } else {
        console.error("Error checking journal password status:", err);
        setJournalPasswordStatus('not_set'); // Default to not set on error
      }
    }
  };

  const handleSetJournalPassword = async () => {
    // Validate passwords match
    if (newJournalPassword !== confirmJournalPassword) {
      setJournalPasswordError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (newJournalPassword.length < 6) {
      setJournalPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setJournalPasswordSaving(true);
    setJournalPasswordError('');
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');

      // Use PUT for setting/updating password
      await axios.put(
        `${API_URL}/users/me/journal-password`,
        { 
          password: newJournalPassword,
          ...(journalPasswordStatus === 'set' ? { current_password: currentJournalPassword } : {})
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset form fields
      setCurrentJournalPassword('');
      setNewJournalPassword('');
      setConfirmJournalPassword('');
      
      // Update status
      setJournalPasswordStatus('set');
      setJournalPasswordError('Password set successfully');
      setTimeout(() => setJournalPasswordError(''), 3000); // Clear after 3 seconds
    } catch (err) {
      console.error("Error setting journal password:", err);
      if (err.response?.status === 401) {
        setJournalPasswordError('Current password is incorrect');
      } else {
        setJournalPasswordError(err.response?.data?.message || 'Failed to set password');
      }
    } finally {
      setJournalPasswordSaving(false);
    }
  };

  const handleRemoveJournalPassword = async () => {
    if (!currentJournalPassword) {
      setJournalPasswordError('Current password is required');
      return;
    }
    
    setJournalPasswordSaving(true);
    setJournalPasswordError('');
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');
      
      await axios.post(
        `${API_URL}/users/me/journal-password/remove`,
        { current_password: currentJournalPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset form fields
      setCurrentJournalPassword('');
      setNewJournalPassword('');
      setConfirmJournalPassword('');
      
      // Update status
      setJournalPasswordStatus('not_set');
      setJournalPasswordError('Password removed successfully');
      setTimeout(() => setJournalPasswordError(''), 3000); // Clear after 3 seconds
    } catch (err) {
      console.error("Error removing journal password:", err);
      setJournalPasswordError(err.response?.data?.message || 'Failed to remove password');
    } finally {
      setJournalPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        {error && (
          <Alert 
            severity={error.includes('successfully') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Profile
            </Typography>
            {!isEditing ? (
              <Button 
                variant="contained" 
                startIcon={<EditIcon />} 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<CancelIcon />} 
                  onClick={() => {
                    setIsEditing(false);
                    loadUserData(); // Reset form data
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />} 
                  onClick={handleUpdate}
                  disabled={saving}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar 
              src={profileImage} 
              alt={fullName || username}
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            {isEditing && (
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={pickImage}
                size="small"
              >
                Change Photo
              </Button>
            )}
          </Box>          <Box component="form" sx={{ '& .MuiTextField-root, & .MuiFormControl-root': { mb: 2, width: '100%' } }}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              disabled={!isEditing}
            />
            
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              disabled={!isEditing}
            />
            
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={!isEditing}
              type="email"
            />
            
            <DatePicker
              label="Date of Birth"
              value={dateOfBirth}
              onChange={(date) => setDateOfBirth(date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                label="Gender"
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="prefer_not_to_say">Prefer Not to Say</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              fullWidth
              multiline
              rows={4}
              disabled={!isEditing}
            />
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Reminder Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Preferred Mood Tracking Time"
                value={preferredMoodTime}
                onChange={(time) => setPreferredMoodTime(time)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 3 }} />}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hydration Goal (ml)"
                value={hydrationGoal}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setHydrationGoal(value);
                }}
                fullWidth
                disabled={!isEditing}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                }}
                sx={{ mb: 3 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Mindfulness Reminder Time"
                value={mindfulnessReminderTime}
                onChange={(time) => setMindfulnessReminderTime(time)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Emergency Contact
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Emergency Contact Name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                fullWidth
                disabled={!isEditing}
                sx={{ mb: 3 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Emergency Contact Phone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                fullWidth
                disabled={!isEditing}
                sx={{ mb: 3 }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon sx={{ mr: 1 }} />
            <Typography variant="h5">
              Journal Password
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {journalPasswordStatus === 'checking' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Box>
              <Typography sx={{ mb: 2 }}>
                {journalPasswordStatus === 'set' 
                  ? 'Your journal entries are currently password protected.' 
                  : 'Set a password to protect sensitive journal entries.'}
              </Typography>
              
              {journalPasswordError && (
                <Alert 
                  severity={journalPasswordError.includes('successfully') ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  {journalPasswordError}
                </Alert>
              )}
              
              {journalPasswordStatus === 'set' && (
                <TextField
                  label="Current Journal Password"
                  value={currentJournalPassword}
                  onChange={(e) => setCurrentJournalPassword(e.target.value)}
                  fullWidth
                  type="password"
                  variant="outlined"
                  placeholder="Enter current password to change/remove"
                  disabled={journalPasswordSaving}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                label="New Journal Password"
                value={newJournalPassword}
                onChange={(e) => setNewJournalPassword(e.target.value)}
                fullWidth
                type="password"
                variant="outlined"
                placeholder={journalPasswordStatus === 'set' ? "Enter new password (optional)" : "Enter password (min 6 chars)"}
                disabled={journalPasswordSaving}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Confirm New Journal Password"
                value={confirmJournalPassword}
                onChange={(e) => setConfirmJournalPassword(e.target.value)}
                fullWidth
                type="password"
                variant="outlined"
                placeholder="Confirm new password"
                disabled={journalPasswordSaving}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handleSetJournalPassword}
                  disabled={journalPasswordSaving || !newJournalPassword || !confirmJournalPassword || (journalPasswordStatus === 'set' && !currentJournalPassword)}
                  startIcon={journalPasswordSaving && !!newJournalPassword ? <CircularProgress size={20} /> : <LockIcon />}
                  fullWidth
                >
                  {journalPasswordStatus === 'set' ? 'Update Password' : 'Set Password'}
                </Button>
                {journalPasswordStatus === 'set' && (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleRemoveJournalPassword}
                    disabled={journalPasswordSaving || !currentJournalPassword}
                    startIcon={journalPasswordSaving && !newJournalPassword ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    Remove Password
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>

        <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />}
            fullWidth
            size="large"
          >
            Logout
          </Button>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ProfileScreen;
