import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomHeader = ({ title, navigation, showBack = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        // Check for isAdmin boolean flag OR if role string is 'admin'
        if (userData.isAdmin === true || userData.role === 'admin') { 
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Error parsing user data in header:", e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false); // Not logged in or no user data
    }
  }, []); // Re-check if user data in localStorage changes (though typically it changes on login/logout)

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    // Potentially clear other session-related localStorage items if any
    navigate('/login');
  };

  const isHomeScreen = location.pathname === '/' || location.pathname === '/home'; // Adjust if your HomeScreen route is different

  return (
    <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
      <Toolbar>
        {showBack && !isHomeScreen && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigation.goBack()}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {isAdmin && (
          <Button
            color="inherit"
            onClick={() => {
              console.log("Admin Panel button clicked, attempting to navigate to /admin");
              navigate('/admin');
            }}
            startIcon={<AdminPanelSettingsIcon />}
            sx={{ textTransform: 'none' }}
          >
            Admin Panel
          </Button>
        )}
        {isHomeScreen && (
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CustomHeader;
