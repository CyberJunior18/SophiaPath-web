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
  Email as EmailIcon,
  Brush as BrushIcon
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './SettingsPage.css';


const SettingsPage = () => {
  const { themeMode, setThemeMode, customColors, updateCustomColors } = useTheme();
  const { user, deleteAccount } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [logoGradient, setLogoGradient] = useState(() => {
    return localStorage.getItem('sophiapath_logo_style') === 'gradient';
  });

  const handleLogoStyleChange = (e) => {
    const isGradient = e.target.checked;
    setLogoGradient(isGradient);
    localStorage.setItem('sophiapath_logo_style', isGradient ? 'gradient' : 'split');
    window.dispatchEvent(new Event('logo_style_changed'));
  };

  const themes = [
    { id: 'light', name: 'Default Light', bg: '#FCFDFF', border: '#E9EDF5', text: '#2D2D4D', dot: '#3D5CFF' },
    { id: 'dark', name: 'Default Dark', bg: '#161632', border: 'rgba(255,255,255,0.08)', text: '#FFFFFF', dot: '#3D5CFF' },
    { id: 'sepia', name: 'Warm Sepia', bg: '#FDF6E3', border: '#EFE6CE', text: '#5C3E21', dot: '#856404' },
    { id: 'lava', name: 'Volcanic Lava', bg: '#1c0a0a', border: 'rgba(255,69,0,0.2)', text: '#ffc83b', dot: '#ff4500' },
    { id: 'ocean', name: 'Deep Ocean', bg: '#0f3057', border: 'rgba(0,188,212,0.2)', text: '#e0f7fa', dot: '#00bcd4' },
    { id: 'forest', name: 'Emerald Forest', bg: '#0c2617', border: 'rgba(16,185,129,0.2)', text: '#e2f3eb', dot: '#10b981' },
    { id: 'amber', name: 'Solarized Amber', bg: '#002b36', border: 'rgba(181,137,0,0.2)', text: '#fdf6e3', dot: '#b58900' },
    { id: 'dracula', name: 'Dracula Vampire', bg: '#1e1f29', border: 'rgba(255,121,198,0.2)', text: '#f8f8f2', dot: '#ff79c6' },
    { id: 'amethyst', name: 'Royal Amethyst', bg: '#29153a', border: 'rgba(212,175,55,0.2)', text: '#fae8ff', dot: '#d4af37' },
    { id: 'nordic', name: 'Nordic Ice', bg: '#3b4252', border: 'rgba(136,192,208,0.2)', text: '#eceff4', dot: '#88c0d0' },
    { id: 'mint', name: 'Frosted Mint', bg: '#f4fef9', border: '#00a86b33', text: '#0f3d2a', dot: '#00a86b' },
    { id: 'lavender', name: 'Soft Lavender', bg: '#fdfaff', border: '#7c3aed33', text: '#2e1065', dot: '#7c3aed' },
    { id: 'peach', name: 'Peach Cream', bg: '#fffefc', border: '#ea580c33', text: '#431407', dot: '#ea580c' },
    { id: 'rose', name: 'Rose Gold', bg: '#fffafb', border: '#db277733', text: '#500724', dot: '#db2777' },
    { id: 'clay', name: 'Clay Slate', bg: '#fafafa', border: '#4b556333', text: '#111827', dot: '#4b5563' },
    { id: 'kitty', name: 'Hello Kitty', bg: '#ffebf0', border: '#ff6b8b33', text: '#4a1525', dot: '#ff6b8b' },
    { id: 'midnight', name: 'Midnight Gold', bg: '#101726', border: '#fbc02d33', text: '#ffffff', dot: '#fbc02d' },
    {
      id: 'custom',
      name: 'Custom Theme',
      bg: customColors?.bgPaper || '#FFFFFF',
      border: 'rgba(0,0,0,0.12)',
      text: customColors?.textPrimary || '#2D2D4D',
      dot: customColors?.primaryMain || '#3D5CFF'
    },
  ];

  const defaultCustomColors = {
    primaryMain: '#3D5CFF',
    primaryDark: '#2E49D1',
    primaryLight: '#7C8DFF',
    bgDefault: '#F5F7FA',
    bgPaper: '#FFFFFF',
    bgPaperAlt: '#F0F4F8',
    textPrimary: '#2D2D4D',
    textSecondary: '#64748b',
    divider: '#3d5cff15',
    codeBg: '#f8f9fa'
  };

  const handleColorChange = (key, value) => {
    const updated = {
      ...defaultCustomColors,
      ...customColors,
      [key]: value
    };
    if (key === 'primaryMain') {
      updated.primaryDark = value;
      updated.primaryLight = value;
    }
    updateCustomColors(updated);
  };

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
                <ListItem className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '20px 24px' }}>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PaletteIcon className="settings-primary-icon" />
                    <ListItemText 
                      primary={<Typography className="settings-row-title">App Theme Preset</Typography>}
                      secondary="Customize the visual colors and appearance of the application"
                    />
                  </Box>
                  <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '8px', width: '100%' }}>
                    {themes.map((t) => (
                      <Box
                        key={t.id}
                        onClick={() => setThemeMode(t.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '16px 12px',
                          borderRadius: '16px',
                          background: t.bg,
                          border: themeMode === t.id ? `2px solid ${t.dot}` : '1.5px solid var(--divider)',
                          boxShadow: themeMode === t.id ? `0 0 16px ${t.dot}33` : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                          textAlign: 'center'
                        }}
                      >
                        <Box style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.dot, border: '2.5px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        <Typography style={{ fontSize: '0.8rem', fontWeight: 800, color: t.text }}>{t.name}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {themeMode === 'custom' && (
                    <Box style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', border: '1px solid var(--divider)', background: 'var(--background-default)', width: '100%' }}>
                      <Typography variant="subtitle2" style={{ fontWeight: 800, marginBottom: '16px', fontFamily: '"Outfit", sans-serif' }}>
                        Customize Theme Colors
                      </Typography>
                      <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Grid of Color Selectors */}
                        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                          
                          {/* Primary Color */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Primary Main Color</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.primaryMain || '#3D5CFF'}
                                onChange={(e) => handleColorChange('primaryMain', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.primaryMain || '#3D5CFF'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Page Background */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Page Background</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.bgDefault || '#F5F7FA'}
                                onChange={(e) => handleColorChange('bgDefault', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.bgDefault || '#F5F7FA'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Card Background */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Card Background</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.bgPaper || '#FFFFFF'}
                                onChange={(e) => handleColorChange('bgPaper', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.bgPaper || '#FFFFFF'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Nested Card Background */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Nested Card Background</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.bgPaperAlt || '#F0F4F8'}
                                onChange={(e) => handleColorChange('bgPaperAlt', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.bgPaperAlt || '#F0F4F8'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Text Color */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Text Color</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.textPrimary || '#2D2D4D'}
                                onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.textPrimary || '#2D2D4D'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Secondary Text Color */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Secondary Text Color</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.textSecondary || '#64748b'}
                                onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.textSecondary || '#64748b'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Border & Divider Color */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Border & Divider Color</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.divider || '#3d5cff15'}
                                onChange={(e) => handleColorChange('divider', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.divider || '#3d5cff15'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Code Editor Background */}
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ fontWeight: 800 }}>Code Editor Background</Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={customColors.codeBg || '#f8f9fa'}
                                onChange={(e) => handleColorChange('codeBg', e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                              />
                              <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {customColors.codeBg || '#f8f9fa'}
                              </Typography>
                            </Box>
                          </Box>

                        </Box>
                      </Box>
                    </Box>
                  )}
                </ListItem>
                <Divider />
                <ListItem className="settings-row">
                  <ListItemIcon className="settings-row-icon">
                    <BrushIcon className="settings-primary-icon" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography className="settings-row-title">Logo Smooth Gradient</Typography>}
                    secondary="Use a mixed blend gradient instead of a hard split-hue color logo"
                  />
                  <Switch checked={logoGradient} onChange={handleLogoStyleChange} color="primary" />
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
