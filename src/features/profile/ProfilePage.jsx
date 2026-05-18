import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Grid,
  IconButton,
  LinearProgress,
  useTheme,
  Container,
  Button,
  Chip,
  Stack,
  alpha,
  TextField,
  Alert,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  EmojiEvents as TrophyIcon,
  Timeline as PathIcon,
  School as CourseIcon,
  LocalFireDepartment as StreakIcon,
  Share as ShareIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const AVATAR_OPTIONS = [
  'https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
];

const ProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    tag: user?.tag || '',
    gender: user?.gender || 'Rather Not Say',
    age: user?.age || '',
    avatar: user?.avatar || AVATAR_OPTIONS[0]
  });

  const [userData, setUserData] = useState({
    name: user?.name || 'Learner',
    email: user?.email || '',
    role: user?.tag || 'Aspiring Full-Stack Developer',
    location: 'New York, USA',
    bio: 'Passionate about building scalable web applications and learning new technologies. Currently mastering React and Node.js.',
    profileImage: user?.avatar || AVATAR_OPTIONS[0],
    progress: 65,
    streak: 12,
    completedCourses: Object.keys(user?.quizScores || {}).length,
    achievements: 8
  });

  useEffect(() => {
    if (user) {
      setUserData(prev => ({ 
        ...prev, 
        name: user.name,
        role: user.tag || 'Aspiring Full-Stack Developer',
        profileImage: user.avatar || AVATAR_OPTIONS[0],
        completedCourses: Object.keys(user.quizScores || {}).length
      }));
      setEditForm({
        name: user.name || '',
        username: user.username || '',
        tag: user.tag || '',
        gender: user.gender || 'Rather Not Say',
        age: user.age || '',
        avatar: user.avatar || AVATAR_OPTIONS[0]
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);

    if (!editForm.name.trim()) {
      setSaveError('Name cannot be empty');
      setSaving(false);
      return;
    }

    if (!editForm.username.trim() || editForm.username.length < 4) {
      setSaveError('Username must be at least 4 characters');
      setSaving(false);
      return;
    }

    if (editForm.age && (isNaN(editForm.age) || Number(editForm.age) <= 0)) {
      setSaveError('Age must be a valid positive number');
      setSaving(false);
      return;
    }

    const res = await updateProfile(editForm);
    if (res.success) {
      setIsEditing(false);
    } else {
      setSaveError(res.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const stats = [
    { label: 'Streak', value: userData.streak, icon: <StreakIcon />, color: theme.palette.warning.main },
    { label: 'Courses', value: userData.completedCourses, icon: <CourseIcon />, color: theme.palette.info.main },
    { label: 'Trophies', value: userData.achievements, icon: <TrophyIcon />, color: theme.palette.secondary.main },
    { label: 'Path', value: 'Level 4', icon: <PathIcon />, color: theme.palette.success.main },
  ];

  const upcomingTasks = [
    { title: 'Advanced React Patterns', desc: 'Hooks, HOCs, and Performance Optimization', time: '45 mins', icon: <CourseIcon /> },
    { title: 'Database Design 101', desc: 'ER Diagrams and Normalization', time: '1.2 hrs', icon: <PathIcon /> },
  ];

  return (
    <Box className="profile-container">
      {/* Dynamic Hero Header */}
      <Box className="profile-hero">
        <Box className="profile-hero-decoration-1" />
        <Box className="profile-hero-decoration-2" />
      </Box>

      <Container maxWidth="lg" className="profile-content">
        <Grid container spacing={6}>
          {/* Left Column: Profile Info */}
          <Grid item xs={12} lg={4}>
            <Paper className="profile-card">
              {!isEditing ? (
                <>
                  <Box className="profile-avatar-container">
                    <Avatar
                      src={userData.profileImage}
                      sx={{ 
                        width: 180, 
                        height: 180, 
                        border: `8px solid ${theme.palette.background.paper}`,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                      }}
                    />
                  </Box>

                  <Typography variant="h4" className="profile-name">
                    {userData.name}
                  </Typography>
                  <Typography variant="body1" className="profile-role">
                    {userData.role}
                  </Typography>

                  <Box className="profile-social">
                    <IconButton className="profile-social-button">
                      <GitHubIcon fontSize="medium" />
                    </IconButton>
                    <IconButton className="profile-social-button">
                      <LinkedInIcon fontSize="medium" />
                    </IconButton>
                    <IconButton className="profile-social-button">
                      <TwitterIcon fontSize="medium" />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" className="profile-bio">
                    "{userData.bio}"
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  {/* Backend Meta Details */}
                  <Stack spacing={2} sx={{ mb: 4, px: 2, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FingerprintIcon sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Username</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>@{user?.username || 'learner'}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PersonIcon sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Gender / Age</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user?.gender || 'Rather Not Say'} • {user?.age || 20} years old
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Joined</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    className="profile-share-button"
                    sx={{ height: 50, mb: 2, borderRadius: 3 }}
                  >
                    Edit Profile
                  </Button>
                </>
              ) : (
                <Box component="form" onSubmit={handleSave} sx={{ p: 2, textAlign: 'left' }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, textAlign: 'center' }}>
                    Edit Profile Info
                  </Typography>

                  {saveError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                      {saveError}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Full Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    margin="normal"
                    required
                  />

                  <TextField
                    fullWidth
                    label="Username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    margin="normal"
                    required
                  />

                  <TextField
                    fullWidth
                    label="Tag / Professional Role"
                    value={editForm.tag}
                    onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                    margin="normal"
                  />

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ min: 1 }}
                    />

                    <TextField
                      fullWidth
                      select
                      label="Gender"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      margin="normal"
                      SelectProps={{ native: true }}
                      required
                    >
                      <option value="Rather Not Say">Rather Not Say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </TextField>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Select Profile Picture
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'center' }}>
                    {AVATAR_OPTIONS.map((url, idx) => (
                      <Avatar
                        key={idx}
                        src={url}
                        onClick={() => setEditForm({ ...editForm, avatar: url })}
                        sx={{
                          width: 50,
                          height: 50,
                          cursor: 'pointer',
                          border: editForm.avatar === url ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                          transform: editForm.avatar === url ? 'scale(1.1)' : 'none',
                          transition: 'all 0.2s',
                          '&:hover': { transform: 'scale(1.15)' }
                        }}
                      />
                    ))}
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={saving}
                      sx={{ height: 50, borderRadius: 3 }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setIsEditing(false);
                        setSaveError('');
                        if (user) {
                          setEditForm({
                            name: user.name || '',
                            username: user.username || '',
                            tag: user.tag || '',
                            gender: user.gender || 'Rather Not Say',
                            age: user.age || '',
                            avatar: user.avatar || AVATAR_OPTIONS[0]
                          });
                        }
                      }}
                      sx={{ height: 50, borderRadius: 3 }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Quick Stats Grid */}
            <Box className="stats-grid">
              {[
                { label: 'Streak', value: userData.streak, icon: <StreakIcon />, color: 'orange', bg: 'orange' },
                { label: 'Courses', value: userData.completedCourses, icon: <CourseIcon />, color: 'blue', bg: 'blue' },
                { label: 'Trophies', value: userData.achievements, icon: <TrophyIcon />, color: 'yellow', bg: 'yellow' },
                { label: 'Path', value: 'Level 4', icon: <PathIcon />, color: 'purple', bg: 'purple' },
              ].map((stat, idx) => (
                <Paper key={idx} className="stat-card">
                  <Box className="stat-icon" sx={{ 
                    backgroundColor: `rgba(var(--${stat.color}-500-rgb), 0.1)`,
                    color: `var(--${stat.color}-500)`
                  }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h5" className="stat-value">{stat.value}</Typography>
                  <Typography variant="caption" className="stat-label">{stat.label}</Typography>
                </Paper>
              ))}
            </Box>
          </Grid>

          {/* Right Column: Content */}
          <Grid item xs={12} lg={8} className="content-column">

              <Paper 
                sx={{ 
                  p: 4,
                  borderRadius: 4,
                  boxShadow: 6,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover .MuiSvgIcon-root': { transform: 'scale(1.2)' }
                }}
                onClick={() => navigate('/achievements')}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Recent Achievements
                  </Typography>
                  <TrophyIcon sx={{ 
                    color: theme.palette.warning.main,
                    transition: 'transform 0.2s'
                  }} />
                </Box>
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Box 
                      key={i}
                      sx={{ 
                        flexShrink: 0,
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${alpha(theme.palette.divider, 0.5)}`,
                        '&:hover': { border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}` }
                      }}
                    >
                      <TrophyIcon sx={{ color: alpha(theme.palette.primary.main, 0.3) }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;