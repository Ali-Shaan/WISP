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

const SignupScreen = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    document.title = 'Sign Up | WISP';
  }, []);

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    if (!username || !email || !password) {
      setError('Username, email, and password are required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('userToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      
      setLoading(false);
      navigate('/profile', { state: { user } });
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(message);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#FFF3EB' }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <img src={logo} alt="WISP Logo" style={{ width: 350, height: 200, marginBottom: 20 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
              Create Account
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Username"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            variant="outlined"
            inputProps={{ autoCapitalize: 'none' }}
          />
          
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
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            label="Confirm Password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            type={showConfirmPassword ? 'text' : 'password'}
            error={password !== confirmPassword && confirmPassword !== ''}
            helperText={password !== confirmPassword && confirmPassword !== '' ? 'Passwords do not match' : ''}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleSignup}
            disabled={loading}
            sx={{ mt: 3, py: 1.5 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign Up'
            )}
          </Button>
          
          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/login')}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Already have an account? Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

// Styles are applied directly using Material UI's sx prop

export default SignupScreen;