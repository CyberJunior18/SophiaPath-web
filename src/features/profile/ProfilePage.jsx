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
  alpha
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
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [userData, setUserData] = useState({
    name: user?.name || 'Learner',
    email: user?.email || '',
    role: 'Aspiring Full-Stack Developer',
    location: 'New York, USA',
    bio: 'Passionate about building scalable web applications and learning new technologies. Currently mastering React and Node.js.',
    profileImage: 'https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg',
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
        completedCourses: Object.keys(user.quizScores || {}).length
      }));
    }
  }, [user]);


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
                <IconButton
                  className="profile-avatar-edit"
                  size="medium"
                  sx={{ boxShadow: 4 }}
                >
                  <EditIcon sx={{ color: 'white', fontSize: 22 }} />
                </IconButton>
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

              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<ShareIcon />}
                className="profile-share-button"
                sx={{ height: 56 }}
              >
                Share Profile
              </Button>
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