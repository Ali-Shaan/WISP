import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Container, Box } from '@mui/material';
import logo from '../assets/wisplogo.png'; // adjust path if needed

const WelcomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Welcome | WISP';
  }, []);

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <img src={logo} alt="WISP Logo" style={{ width: 350, height: 200, marginBottom: 20 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome to WISP
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Your Wellness & Self-Improvement Partner
        </Typography>
      </Box>

      <Box>
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 2, py: 1 }}
          onClick={() => navigate('/login')}
        >
          Login
        </Button>
        <Button
          variant="outlined"
          fullWidth
          sx={{ py: 1 }}
          onClick={() => navigate('/signup')}
        >
          Create Account
        </Button>
      </Box>
    </Container>
  );
};

export default WelcomePage;