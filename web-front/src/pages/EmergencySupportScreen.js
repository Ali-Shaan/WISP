import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  Alert,
  AlertTitle,
  Stack
} from '@mui/material';
import {
  SupportAgent as SupportAgentIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  PhoneEnabled as PhoneEnabledIcon,
  Warning as WarningIcon,
  AccountCircle as AccountCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const EmergencySupportScreen = () => {
  const navigate = useNavigate();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const loadEmergencyContact = useCallback(async () => {
    console.log("[EmergencySupportScreen] Loading emergency contact data.");
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setEmergencyName(userData.emergency_contact_name || '');
        setEmergencyPhone(userData.emergency_contact_phone || '');
        console.log("[EmergencySupportScreen] Loaded EC: ", userData.emergency_contact_name);
      } else {
        setEmergencyName('');
        setEmergencyPhone('');
      }
    } catch (err) {
      console.error('[EmergencySupportScreen] Error loading emergency contact:', err);
      setEmergencyName('');
      setEmergencyPhone('');
    }
  }, []);

  useEffect(() => {
    loadEmergencyContact();
    // In React Router, we would use the location instead of navigation focus events
    return () => {
      // Cleanup if needed
    };
  }, [loadEmergencyContact]);

  const handleEmergencyCall = async (phone) => {
    if (!phone) {
      alert('No phone number provided.');
      return;
    }
    try {
      window.location.href = `tel:${phone}`;
    } catch (err) {
      alert('Could not initiate phone call');
    }
  };

  const handleEmergencyText = (textLineNumber) => {
    if (window.confirm(`Text HOME to ${textLineNumber} to connect with a crisis counselor. Would you like to open your messaging app?`)) {
      window.location.href = `sms:${textLineNumber}`;
    }
  };

  const handleEmergencyButton = () => {
    setShowEmergencyModal(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            bgcolor: '#FFFFFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SupportAgentIcon sx={{ fontSize: 48, color: '#C82333', mr: 2 }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ color: '#C82333', fontWeight: 'bold' }}>
                Emergency Support
              </Typography>
              <Typography variant="body1" sx={{ color: '#DC3545' }}>
                If you are in immediate danger or crisis, please use the options below.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={handleEmergencyButton}
            startIcon={<PhoneIcon />}
            sx={{ 
              py: 1.5, 
              px: 3, 
              mt: 2, 
              bgcolor: '#DC3545', 
              '&:hover': { bgcolor: '#C82333' },
              fontSize: '1.1rem',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            Show Immediate Help Options
          </Button>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 , bgcolor: '#FFFFFF'}}>
              <AlertTitle>Crisis Resources</AlertTitle>
              This page contains resources for immediate help during a mental health crisis.
              If you or someone you know is in immediate danger, please call emergency services.
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Support Options
              </Typography>
              <Typography variant="body1" paragraph>
                • 988 Suicide & Crisis Lifeline: Call or text 988
              </Typography>
              <Typography variant="body1" paragraph>
                • Crisis Text Line: Text HOME to 741741
              </Typography>
              <Typography variant="body1" paragraph>
                • Emergency Services: Call 911 (US) for immediate danger
              </Typography>
              {emergencyName && emergencyPhone && (
                <Typography variant="body1" paragraph>
                  • Your Emergency Contact: {emergencyName} at {emergencyPhone}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f8d7da', color: '#721c24' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Immediate Help
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setShowEmergencyModal(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2, mb: 3, textAlign: 'center' }}>
            Connect with support 24/7. Choose an option:
          </Typography>
          
          <Stack spacing={2}>
            {emergencyName && emergencyPhone && (
              <Button
                variant="contained"
                onClick={() => handleEmergencyCall(emergencyPhone)}
                startIcon={<AccountCircleIcon />}
                sx={{ py: 1.5, bgcolor: '#17A2B8', '&:hover': { bgcolor: '#138496' } }}
              >
                Call {emergencyName} (Your Contact)
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={() => handleEmergencyCall('988')}
              startIcon={<PhoneEnabledIcon />}
              sx={{ py: 1.5, bgcolor: '#28a745', '&:hover': { bgcolor: '#218838' } }}
            >
              Call Crisis Lifeline (988)
            </Button>
            
            <Button
              variant="contained"
              onClick={() => handleEmergencyText('741741')}
              startIcon={<MessageIcon />}
              sx={{ py: 1.5, bgcolor: '#007bff', '&:hover': { bgcolor: '#0069d9' } }}
            >
              Text Crisis Line (741741)
            </Button>
            
            <Button
              variant="contained"
              onClick={() => handleEmergencyCall('911')}
              startIcon={<WarningIcon />}
              sx={{ py: 1.5, bgcolor: '#C82333', '&:hover': { bgcolor: '#b21f2d' } }}
            >
              Call 911 (Immediate Danger)
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setShowEmergencyModal(false)}
            sx={{ borderColor: '#6c757d', color: '#6c757d' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmergencySupportScreen;
