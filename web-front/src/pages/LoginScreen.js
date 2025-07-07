import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/wisplogo.png';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Login | WISP';
  }, []);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store user data and token
      localStorage.setItem('userToken', token);
      localStorage.setItem('userData', JSON.stringify({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        bio: user.bio,
        preferred_mood_time: user.preferred_mood_time,
        water_goal_ml: user.water_goal_ml,
        mindfulness_reminder_time: user.mindfulness_reminder_time,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        profile_image: user.profile_image,
        role: user.role,
        is_admin: user.is_admin
      }));

      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#FFF3EB' }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <img src={logo} alt="WISP Logo" style={{ width: 350, height: 200, marginBottom: 20 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
              Welcome Back
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              type="email"
              inputProps={{ autoCapitalize: 'none' }}
            />
            
            <TextField
              label="Password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={loading}
              sx={{ mt: 3, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/signup')}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Don't have an account? Sign up
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

// Styles are applied directly using Material UI's sx prop

export default LoginScreen;