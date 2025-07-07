import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  LinearProgress,
  ButtonGroup,
  Paper,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';

const SedonaMethodScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState('');
  const [allowEmotion, setAllowEmotion] = useState(null);
  const [letGo, setLetGo] = useState(null);
  const [wouldLetGo, setWouldLetGo] = useState(null);
  const [when, setWhen] = useState(null);
  const [reflection, setReflection] = useState('');
  const [showReflection, setShowReflection] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    setShowReflection(true);
  };

  const handleRestart = () => {
    setStep(1);
    setEmotion('');
    setAllowEmotion(null);
    setLetGo(null);
    setWouldLetGo(null);
    setWhen(null);
    setReflection('');
    setShowReflection(false);
  };

  const handleFinish = () => {
    navigate(-1);
  };

  const renderStep1 = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" align="center" gutterBottom>
          Step 1: Identify the Emotion
        </Typography>
        <Typography variant="body1" paragraph align="center">
          What are you feeling right now?
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Enter your emotion (e.g., anger, fear, sadness)"
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          variant="outlined"
          margin="normal"
        />
        
        <Typography variant="body1" paragraph align="center" sx={{ mt: 2 }}>
          Can you allow yourself to fully feel this emotion?
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
          <Button 
            variant={allowEmotion === true ? "contained" : "outlined"} 
            onClick={() => setAllowEmotion(true)}
            sx={{ minWidth: 100 }}
          >
            Yes
          </Button>
          <Button 
            variant={allowEmotion === false ? "contained" : "outlined"} 
            onClick={() => setAllowEmotion(false)}
            sx={{ minWidth: 100 }}
          >
            No
          </Button>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={handleNext}
          fullWidth
          disabled={!emotion || allowEmotion === null}
          sx={{ mt: 2 }}
        >
          Next
        </Button>
      </Box>
    );
  };

  const renderStep2 = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" align="center" gutterBottom>
          Step 2: The Sedona Questions
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              Could you let this feeling go?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <Button 
                variant={letGo === true ? "contained" : "outlined"} 
                onClick={() => setLetGo(true)}
                sx={{ minWidth: 100 }}
              >
                Yes
              </Button>
              <Button 
                variant={letGo === false ? "contained" : "outlined"} 
                onClick={() => setLetGo(false)}
                sx={{ minWidth: 100 }}
              >
                No
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              Would you let it go?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <Button 
                variant={wouldLetGo === true ? "contained" : "outlined"} 
                onClick={() => setWouldLetGo(true)}
                sx={{ minWidth: 100 }}
              >
                Yes
              </Button>
              <Button 
                variant={wouldLetGo === false ? "contained" : "outlined"} 
                onClick={() => setWouldLetGo(false)}
                sx={{ minWidth: 100 }}
              >
                No
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              When would you let it go?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <Button 
                variant={when === 'now' ? "contained" : "outlined"} 
                onClick={() => setWhen('now')}
                sx={{ minWidth: 100 }}
              >
                Now
              </Button>
              <Button 
                variant={when === 'soon' ? "contained" : "outlined"} 
                onClick={() => setWhen('soon')}
                sx={{ minWidth: 100 }}
              >
                Soon
              </Button>
              <Button 
                variant={when === 'later' ? "contained" : "outlined"} 
                onClick={() => setWhen('later')}
                sx={{ minWidth: 100 }}
              >
                Later
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" onClick={handleBack}>
            Back
          </Button>
          <Button 
            variant="contained" 
            onClick={handleComplete}
            disabled={letGo === null || wouldLetGo === null || when === null}
          >
            Complete
          </Button>
        </Box>
      </Box>
    );
  };

  const renderReflection = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" align="center" gutterBottom>
          Reflection
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f9ff' }}>
          <Typography variant="body1" paragraph>
            You identified feeling <strong>{emotion}</strong>.
          </Typography>
          <Typography variant="body1" paragraph>
            You {allowEmotion ? 'allowed' : 'did not allow'} yourself to fully feel it.
          </Typography>
          <Typography variant="body1" paragraph>
            You {letGo ? 'could' : 'could not'} let it go.
          </Typography>
          <Typography variant="body1" paragraph>
            You {wouldLetGo ? 'would' : 'would not'} let it go.
          </Typography>
          <Typography variant="body1" paragraph>
            You would let it go {when}.
          </Typography>
        </Paper>
        
        <Typography variant="h6" gutterBottom>
          Your Reflection Notes:
        </Typography>
        
        <TextField
          fullWidth
          placeholder="How do you feel now? What insights did you gain?"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          variant="outlined"
          multiline
          rows={6}
          margin="normal"
        />
        
        <Paper sx={{ p: 3, mt: 3, mb: 3, bgcolor: '#f8f8f8' }}>
          <Typography variant="h6" align="center" gutterBottom>
            Affirmations
          </Typography>
          <Typography variant="body1" paragraph align="center" sx={{ fontStyle: 'italic' }}>
            "I release all negative emotions with ease and grace."
          </Typography>
          <Typography variant="body1" paragraph align="center" sx={{ fontStyle: 'italic' }}>
            "I am free from emotional burdens and open to peace."
          </Typography>
          <Typography variant="body1" paragraph align="center" sx={{ fontStyle: 'italic' }}>
            "I choose to let go of what no longer serves me."
          </Typography>
          <Typography variant="body1" paragraph align="center" sx={{ fontStyle: 'italic' }}>
            "I am calm, centered, and emotionally balanced."
          </Typography>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleRestart}
            startIcon={<RestartAltIcon />}
          >
            Start Over
          </Button>
          <Button 
            variant="contained" 
            onClick={handleFinish}
          >
            Finish
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        py: 2
      }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Typography variant="h6" component="h1">
          Sedona Method
        </Typography>
        <Box sx={{ width: 64 }} /> {/* placeholder for spacing */}
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={(step / totalSteps) * 100} 
        sx={{ height: 4, mb: 3 }} 
      />
      
      <Paper elevation={3} sx={{ mb: 4 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {showReflection && renderReflection()}
      </Paper>
    </Container>
  );
};

export default SedonaMethodScreen;
