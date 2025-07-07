import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Custom header component
import CustomHeader from './components/CustomHeader';

// Import all pages
import HomeScreen from './pages/HomeScreen';
import LoginScreen from './pages/LoginScreen';
import SignupScreen from './pages/SignupScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import JournalScreen from './pages/JournalScreen';
import JournalDetailScreen from './pages/JournalDetailScreen';
import NewJournalScreen from './pages/NewJournalScreen';
import MoodTrackerScreen from './pages/MoodTrackerScreen';
import NewMoodScreen from './pages/NewMoodScreen';
import CommunityPage from './pages/CommunityPage';
import AdminPanelPage from './pages/AdminPanelPage';
import TherapyScreen from './pages/TherapyScreen';
import SupportResourcesScreen from './pages/SupportResourcesScreen';
import ProfileScreen from './pages/ProfileScreen';
import RemindersScreen from './pages/RemindersScreen';
import MindfulnessRemindersScreen from './pages/MindfulnessRemindersScreen';
import WaterRemindersScreen from './pages/WaterRemindersScreen';
import MusicTherapyScreen from './pages/MusicTherapyScreen';
import GuidedMeditationScreen from './pages/GuidedMeditationScreen';
import SedonaMethodScreen from './pages/SedonaMethodScreen';
import EmergencySupportScreen from './pages/EmergencySupportScreen';

// Setup for Web Notifications API
const setupNotifications = () => {
  if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        console.log(`Notification permission ${permission}`);
      });
    }
  }
};

// Setup for Web Audio API
const setupAudio = () => {
  // Web audio context setup would go here if needed for background audio
  // This is a simpler equivalent of the expo-av Audio setup
  document.addEventListener('visibilitychange', () => {
    // Handle audio behavior when app goes to background/foreground
    // We can implement specific behavior here if needed
  });
};

// Layout component that includes the custom header
const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  // Get page title based on path
  const getPageTitle = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length === 0 && currentPath === '/') return 'Welcome'; // Should not happen if / is outside Layout
    if (pathSegments.length === 0) return 'Home'; // Default for /home or similar if logic hits here
    
    const path = pathSegments[0];
    const formatted = path.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return formatted;
  };

  useEffect(() => {
    const title = getPageTitle();
    document.title = `${title} | WISP`;
  }, [currentPath]); // Re-run when path changes
  
  // Check if we should show the back button
  const showBack = currentPath !== '/' && currentPath !== '/home';
  
  return (
    <>
      <CustomHeader 
        title={getPageTitle()} 
        navigation={{ goBack: () => navigate(-1) }}
        showBack={showBack}
      />
      <Outlet />
    </>
  );
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6200ee',
    },
    background: {
      default: '#FFF3EB',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Montserrat',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: ['Poppins', 'sans-serif'].join(','),
      fontWeight: 700,
    },
    h2: {
      fontFamily: ['Poppins', 'sans-serif'].join(','),
      fontWeight: 600,
    },
    h3: {
      fontFamily: ['Poppins', 'sans-serif'].join(','),
      fontWeight: 600,
    },
    h4: {
      fontFamily: ['Poppins', 'sans-serif'].join(','),
      fontWeight: 500,
    },
    h5: {
      fontFamily: ['Poppins', 'sans-serif'].join(','),
      fontWeight: 500,
    },
    h6: {
      fontFamily: ['Poppins', 'sans-serif'].join(','),
      fontWeight: 500,
    },
    body1: {
      fontFamily: ['Montserrat', 'sans-serif'].join(','),
    },
    button: {
      fontFamily: ['Montserrat', 'sans-serif'].join(','),
      textTransform: 'none'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
        },
      },
      defaultProps: {
        elevation: 3,
      },
    },
    MuiCard: {
      defaultProps: {
      },
    },
  }
});

function App() {
  // Request notification permissions and setup audio on mount
  useEffect(() => {
    setupNotifications();
    setupAudio();
  }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
        {/* Auth Routes - No Header */}
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        
        {/* Routes with Header */}
        <Route element={<Layout />}>
          {/* Main App Routes */}
          <Route path="/home" element={<HomeScreen />} />
          
          {/* Journal Routes */}
          <Route path="/journal" element={<JournalScreen />} />
          <Route path="/journal/:entryId" element={<JournalDetailScreen />} />
          <Route path="/new-journal" element={<NewJournalScreen />} />
          
          {/* Mood Tracker Routes */}
          <Route path="/mood-tracker" element={<MoodTrackerScreen />} />
          <Route path="/new-mood" element={<NewMoodScreen />} />
          
          {/* Community Routes - Updated to new CommunityPage */}
          <Route path="/community" element={<CommunityPage />}>
            <Route index element={<CommunityPage />} />
            <Route path="topics/:topicId" element={<CommunityPage />} />
            <Route path="threads/:threadId" element={<CommunityPage />} />
          </Route>
          
          {/* Support Routes */}
          <Route path="/therapy" element={<TherapyScreen />} />
          <Route path="/support-resources" element={<SupportResourcesScreen />} />
          <Route path="/emergency-support" element={<EmergencySupportScreen />} />
          
          {/* Wellness Tools Routes */}
          <Route path="/music-therapy" element={<MusicTherapyScreen />} />
          <Route path="/guided-meditation" element={<GuidedMeditationScreen />} />
          <Route path="/sedona-method" element={<SedonaMethodScreen />} />
          
          {/* Settings Routes */}
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/reminders" element={<RemindersScreen />} />
          <Route path="/mindfulness-reminders" element={<MindfulnessRemindersScreen />} />
          <Route path="/water-reminders" element={<WaterRemindersScreen />} />

          {/* Admin Route */}
          <Route path="/admin" element={<AdminPanelPage />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
