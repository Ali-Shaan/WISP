import React, { useState, useEffect } from 'react';
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
  DialogContentText, 
  DialogActions,
  Chip,
  Grid,
  Paper,
  Link
} from '@mui/material';
import { Phone, Language, Warning, People } from '@mui/icons-material';
import CommunityScreen from './CommunityScreen';

const SupportResourcesScreen = () => {
  const navigate = useNavigate();
  const [showCommunity, setShowCommunity] = useState(false);
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '',
    message: '',
    actions: []
  });

  // Resources from PostgreSQL schema
  const resources = [
    {
      resource_id: 1,
      category: 'Hotlines',
      title: 'Umang Pakistan',
      description: 'Provides anonymous emotional support via trained volunteers in Pakistan.',
      contact_info: '0311-7786264',
      link: 'https://www.instagram.com/umangpakistan'
    },
    {
      resource_id: 2,
      category: 'Therapy',
      title: 'Therapy Works',
      description: 'One of the oldest psychotherapy centers in Pakistan offering counseling and clinical psychology services.',
      contact_info: '+92-21-35870748',
      link: 'https://therapyworks.com.pk'
    },
    {
      resource_id: 3,
      category: 'Crisis Center',
      title: 'Rozan Helpline',
      description: 'Offers psychosocial support, especially for women and children, including trauma counseling.',
      contact_info: '0304-1111744',
      link: 'https://rozan.org'
    },
    {
      resource_id: 4,
      category: 'Therapy',
      title: 'Taskeen Health Initiative',
      description: 'Non-profit mental health initiative offering counseling services and awareness programs.',
      contact_info: 'info@taskeen.org',
      link: 'https://taskeen.org'
    },
    {
      resource_id: 5,
      category: 'Hotlines',
      title: 'PAHCHAAN (Child Abuse & Mental Health)',
      description: 'Provides mental health services with a focus on children and trauma survivors.',
      contact_info: '042-35913944',
      link: 'https://pahchaan.org.pk'
    },
    {
      resource_id: 6,
      category: 'Therapy',
      title: 'Mind Organization',
      description: 'Mental health NGO offering therapy, workshops, and awareness campaigns.',
      contact_info: 'contact@mind.org.pk',
      link: 'https://mind.org.pk'
    },
    {
      resource_id: 7,
      category: 'Crisis Center',
      title: 'Befrienders Karachi',
      description: 'Offers a confidential helpline for people struggling with emotional distress.',
      contact_info: '021-34971882',
      link: 'http://www.befrienderskarachi.org'
    }
  ];

  // Emergency resources (always available)
  const emergencyResources = [
    {
      title: 'Emergency Services',
      description: 'For immediate life-threatening emergencies',
      contact_info: '1122',
      isEmergency: true
    },
    {
      title: 'Police Helpline',
      description: 'For immediate police assistance',
      contact_info: '15',
      isEmergency: true
    },
    {
      title: 'Ambulance Service',
      description: 'For medical emergencies',
      contact_info: '1122',
      isEmergency: true
    }
  ];

  const handleEmergencyPress = () => {
    setAlertDialog({
      open: true,
      title: 'Emergency Support',
      message: 'What type of help do you need?',
      actions: [
        {
          text: 'Call Emergency Services (1122)',
          onClick: () => handlePress('1122'),
        },
        {
          text: 'Call Police Helpline (15)',
          onClick: () => handlePress('15'),
        },
        {
          text: 'Contact Personal Emergency Contact',
          onClick: async () => {
            try {
              const userData = localStorage.getItem('userData');
              if (userData) {
                const { emergency_contact_name, emergency_contact_phone } = JSON.parse(userData);
                if (emergency_contact_phone) {
                  handlePress(emergency_contact_phone);
                } else {
                  setAlertDialog({
                    open: true,
                    title: 'No Emergency Contact',
                    message: 'You have not set up an emergency contact. Would you like to add one now?',
                    actions: [
                      {
                        text: 'Add Contact',
                        onClick: () => navigate('/profile'),
                      },
                      {
                        text: 'Cancel',
                        color: 'secondary'
                      },
                    ]
                  });
                }
              } else {
                setAlertDialog({
                  open: true,
                  title: 'Not Logged In',
                  message: 'You need to be logged in to use this feature',
                  actions: [
                    {
                      text: 'Login',
                      onClick: () => navigate('/login'),
                    },
                    {
                      text: 'Cancel',
                      color: 'secondary'
                    },
                  ]
                });
              }
            } catch (error) {
              console.error('Error retrieving emergency contact:', error);
            }
          },
        },
      ]
    });
  };

  const handlePress = async (urlOrPhone) => {
    let url = urlOrPhone;
    // Basic check if it looks like a phone number to add tel:
    if (/^[\d\s\-+()]+$/.test(urlOrPhone)) {
      url = `tel:${urlOrPhone.replace(/\s+/g, '')}`;
    } 
    // Basic check if it looks like an email to add mailto:
    else if (urlOrPhone.includes('@') && !urlOrPhone.startsWith('mailto:')) {
      url = `mailto:${urlOrPhone}`;
    }
    // Assume website link, ensure it has http(s)://
    else if (!urlOrPhone.startsWith('http://') && !urlOrPhone.startsWith('https://')) {
      url = `https://${urlOrPhone}`;
    }

    const supported = await window.open(url, '_blank');
    if (!supported) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: `Don't know how to open this: ${url}`,
        actions: [
          {
            text: 'OK',
            color: 'primary'
          },
        ]
      });
    }
  };

  const handleCloseAlert = () => {
    setAlertDialog({
      open: false,
      title: '',
      message: '',
      actions: []
    });
  };

  if (showCommunity) {
    return <CommunityScreen />;
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', pt: 3, pb: 1 }}>
          Support Resources
        </Typography>
        
        <Button
          variant="contained"
          onClick={() => setShowCommunity(true)}
          sx={{ mb: 3, display: 'block', mx: 'auto' }}
          color="primary"
          startIcon={<People />}
        >
          Connect with Community
        </Button>

        {/* Emergency Support Section */}
        <Box sx={{ mb: 3, px: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#DC3545', mb: 1 }}>
            Emergency Support
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#495057', mb: 2 }}>
            If you're experiencing a crisis or need immediate help
          </Typography>
          
          <Button
            variant="contained"
            onClick={handleEmergencyPress}
            startIcon={<Warning />}
            sx={{ 
              bgcolor: '#DC3545', 
              '&:hover': { bgcolor: '#BB2D3B' }, 
              py: 1.5, 
              mb: 2,
              width: '100%',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            EMERGENCY HELP
          </Button>

          {emergencyResources.map((resource, index) => (
            <Card key={index} sx={{ 
              mb: 1.5, 
              boxShadow: 2, 
              borderRadius: 2, 
              borderLeft: 4, 
              borderColor: '#DC3545' 
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#DC3545' }}>
                  {resource.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#495057', mb: 1.5 }}>
                  {resource.description}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handlePress(resource.contact_info)}
                  sx={{ bgcolor: '#DC3545', '&:hover': { bgcolor: '#BB2D3B' } }}
                >
                  Call {resource.contact_info}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Support Resources Section */}
        <Typography variant="h5" sx={{ fontWeight: 'bold', px: 2, mt: 3, mb: 1 }}>
          Support Resources
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#495057', px: 2, mb: 2 }}>
          Mental health services and resources available in Pakistan
        </Typography>

        {resources.map((resource) => (
          <Card key={resource.resource_id} sx={{ mx: 2, mb: 1.5, boxShadow: 1, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">{resource.title}</Typography>
                <Chip label={resource.category} sx={{ bgcolor: '#E9ECEF', color: '#6C757D' }} size="small" />
              </Box>
              
              {resource.description && 
                <Typography variant="body2" sx={{ color: '#495057', mb: 1.5, lineHeight: 1.5 }}>
                  {resource.description}
                </Typography>
              }
              
              <Box sx={{ mt: 1 }}>
                {resource.contact_info && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handlePress(resource.contact_info)}
                      sx={{ mr: 1 }}
                    >
                      <Phone fontSize="small" />
                    </IconButton>
                    <Link 
                      component="button"
                      variant="body2"
                      onClick={() => handlePress(resource.contact_info)}
                      underline="hover"
                    >
                      {resource.contact_info}
                    </Link>
                  </Box>
                )}
                
                {resource.link && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handlePress(resource.link)}
                      sx={{ mr: 1 }}
                    >
                      <Language fontSize="small" />
                    </IconButton>
                    <Link 
                      component="button"
                      variant="body2"
                      onClick={() => handlePress(resource.link)}
                      underline="hover"
                    >
                      Visit Website
                    </Link>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Container>
      
      {/* Show Community Screen */}
      {showCommunity && <CommunityScreen />}
      
      {/* Alert Dialog */}
      <Dialog
        open={alertDialog.open}
        onClose={handleCloseAlert}
      >
        <DialogTitle>{alertDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {alertDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {alertDialog.actions.map((action, index) => (
            <Button 
              key={index} 
              onClick={() => {
                handleCloseAlert();
                if (action.onClick) action.onClick();
              }}
              color={action.color || 'primary'}
            >
              {action.text}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportResourcesScreen;