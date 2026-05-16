import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Switch, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider,
  Button,
  Avatar
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  CloudUpload as CloudIcon,
  Delete as DeleteIcon,
  ChevronRight as ChevronRightIcon,
  VpnKey as VpnKeyIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './SettingsPage.css';


const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, deleteAccount } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is permanent.')) {
      deleteAccount();
    }
  };


  return (
    <Box className="settings-page">
      <Container maxWidth="md">
        <Box className="settings-header">
          <Typography variant="h3" className="settings-title">
            Settings
          </Typography>
          <Typography variant="body1" className="settings-subtitle">
            Manage your account preferences and app settings.
          </Typography>
        </Box>

        <Box className="settings-sections">
          <section>
            <Typography variant="overline" className="settings-section-label">
              Account
            </Typography>
            <Paper className="settings-card glass-panel" elevation={0}>
              <List disablePadding>
                <ListItem className="settings-row interactive">
                  <ListItemIcon className="settings-row-icon">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <EmailIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Email Address</Typography>}
                    secondary={user?.email || 'N/A'}
                  />
                  <ChevronRightIcon className="settings-chevron" />

                </ListItem>
                <Divider />
                <ListItem className="settings-row interactive">
                  <ListItemIcon className="settings-row-icon">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <VpnKeyIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Password</Typography>}
                    secondary="Last changed 3 months ago"
                  />
                  <ChevronRightIcon className="settings-chevron" />
                </ListItem>
              </List>
            </Paper>
          </section>

          <section>
            <Typography variant="overline" className="settings-section-label">
              Preferences
            </Typography>
            <Paper className="settings-card glass-panel" elevation={0}>
              <List disablePadding>
                <ListItem className="settings-row">
                  <ListItemIcon className="settings-row-icon">
                    <PaletteIcon className="settings-primary-icon" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Dark Mode</Typography>}
                    secondary="Adjust the app's visual appearance"
                  />
                  <Switch checked={isDarkMode} onChange={toggleTheme} color="primary" />
                </ListItem>
                <Divider />
                <ListItem className="settings-row">
                  <ListItemIcon className="settings-row-icon">
                    <NotificationsIcon className="settings-primary-icon" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Push Notifications</Typography>}
                    secondary="Get alerts about your learning progress"
                  />
                  <Switch checked={notifications} onChange={(e) => setNotifications(e.target.checked)} color="primary" />
                </ListItem>
                <Divider />
                <ListItem className="settings-row">
                  <ListItemIcon className="settings-row-icon">
                    <EmailIcon className="settings-primary-icon" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Email Marketing</Typography>}
                    secondary="Receive news and special offers"
                  />
                  <Switch checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)} color="primary" />
                </ListItem>
              </List>
            </Paper>
          </section>

          <section>
            <Typography variant="overline" className="settings-section-label">
              Data & Privacy
            </Typography>
            <Paper className="settings-card glass-panel" elevation={0}>
              <List disablePadding>
                <ListItem className="settings-row interactive">
                  <ListItemIcon className="settings-row-icon">
                    <CloudIcon className="settings-primary-icon" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Export Learning Data</Typography>}
                    secondary="Download a copy of your progress"
                  />
                  <Button variant="outlined" size="small" className="settings-action-button">Export</Button>
                </ListItem>
                <Divider />
                <ListItem 
                  className="settings-row interactive settings-danger-row"
                  onClick={handleDeleteAccount}
                >
                  <ListItemIcon className="settings-row-icon">
                    <DeleteIcon className="settings-danger-icon" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title settings-danger-text">Delete Account</Typography>}
                    secondary="Permanently remove your account and data"
                  />
                </ListItem>

              </List>
            </Paper>
          </section>
        </Box>

        <Box className="settings-footer">
          <Typography variant="caption" className="settings-footer-copy">
            SophiaPath Web v1.0.0 • Built with ❤️ for Learners
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SettingsPage;
