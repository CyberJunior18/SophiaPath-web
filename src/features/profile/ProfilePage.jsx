import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Tooltip
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
  Fingerprint as FingerprintIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { achievementsData } from '../../data/achievements';
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
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch('/courses/export/all');
        if (res.ok) {
          const list = await res.json();
          setCourses(list);
        }
      } catch (err) {
        console.error('Failed to load courses on profile page:', err);
      }
    };
    loadCourses();
  }, []);

  const resolvedAchievements = useState ? React.useMemo(() => {
    if (!user) return [];
    const completedLessons = Object.keys(user.quizScores || {});
    
    return achievementsData.map(ach => {
      let currentValue = 0;
      switch (ach.id) {
        case 'ach-1': // First Step
          currentValue = completedLessons.length >= 1 ? 1 : 0;
          break;
        case 'ach-2': // Perfect Score
          currentValue = Object.values(user.quizScores || {}).some(score => score >= 100) ? 1 : 0;
          break;
        case 'ach-3': // Consistent Scholar
          currentValue = user.streak || 0;
          break;
        case 'ach-4': // Speed Learner
          currentValue = completedLessons.length;
          break;
        case 'ach-5': // Polymath
          currentValue = completedLessons.length >= 3 ? 3 : completedLessons.length;
          break;
        case 'ach-6': // Domain Master
          currentValue = completedLessons.length >= 6 ? 1 : 0;
          break;
        default:
          currentValue = 0;
      }
      
      const isUnlocked = currentValue >= ach.progress.targetValue;
      return {
        ...ach,
        isUnlocked,
        currentValue,
        targetValue: ach.progress.targetValue
      };
    });
  }, [user]) : [];

  const registeredCoursesProgress = useState ? React.useMemo(() => {
    if (!user || !user.registeredCourses || courses.length === 0) return [];
    
    return user.registeredCourses.map(title => {
      const course = courses.find(c => c.title.toLowerCase() === title.toLowerCase());
      if (!course) return { title, progress: 0, totalLessons: 0, completedLessons: 0 };
      
      const lessons = course.sections.flatMap(s => s.lessons || []);
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter(l => user.quizScores && user.quizScores[l.id] !== undefined).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        progress: progressPercent,
        totalLessons,
        completedLessons,
        course
      };
    });
  }, [user, courses]) : [];

  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    tag: user?.tag || '',
    gender: user?.gender || 'Rather Not Say',
    age: user?.age || '',
    avatar: user?.avatar || AVATAR_OPTIONS[0]
  });

  const [isCustomAvatar, setIsCustomAvatar] = useState(
    user?.avatar ? !AVATAR_OPTIONS.includes(user.avatar) : false
  );
  const [isDragging, setIsDragging] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [userData, setUserData] = useState({
    name: user?.name || 'Learner',
    email: user?.email || '',
    role: user?.tag || 'Aspiring Full-Stack Developer',
    location: 'New York, USA',
    bio: 'Passionate about building scalable web applications and learning new technologies. Currently mastering React and Node.js.',
    profileImage: user?.avatar || AVATAR_OPTIONS[0],
    progress: 65,
    streak: user?.streak || 0,
    completedCourses: Object.keys(user?.quizScores || {}).length,
    achievements: 0
  });

  useEffect(() => {
    if (user) {
      setUserData(prev => ({ 
        ...prev, 
        name: user.name,
        role: user.tag || 'Aspiring Full-Stack Developer',
        profileImage: user.avatar || AVATAR_OPTIONS[0],
        completedCourses: Object.keys(user.quizScores || {}).length,
        streak: user.streak || 0,
        achievements: resolvedAchievements.filter(a => a.isUnlocked).length
      }));
      setEditForm({
        name: user.name || '',
        username: user.username || '',
        tag: user.tag || '',
        gender: user.gender || 'Rather Not Say',
        age: user.age || '',
        avatar: user.avatar || AVATAR_OPTIONS[0]
      });
      setIsCustomAvatar(user.avatar ? !AVATAR_OPTIONS.includes(user.avatar) : false);
    }
  }, [user, resolvedAchievements]);

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Profile picture must be smaller than 2MB.');
      return;
    }

    setAvatarError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditForm(prev => ({ ...prev, avatar: e.target.result }));
      setIsCustomAvatar(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveAvatar = () => {
    setEditForm(prev => ({ ...prev, avatar: AVATAR_OPTIONS[0] }));
    setIsCustomAvatar(false);
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
    { label: 'Streak', value: userData.streak || 0, icon: <StreakIcon />, color: theme.palette.warning.main },
    { label: 'XP', value: user?.xp || 0, icon: <StreakIcon />, color: theme.palette.info.main },
    { label: 'Trophies', value: userData.achievements || 0, icon: <TrophyIcon />, color: theme.palette.secondary.main },
    { label: 'Path', value: `${user?.levelName || 'Beginner'} (Lvl ${user?.level || 1})`, icon: <PathIcon />, color: theme.palette.success.main },
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

                  {/* Custom Avatar Upload Zone (matching RegisterPage) */}
                  <Box className="avatar-upload-section" sx={{ mb: 3 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    
                    <Box 
                      className={`avatar-dropzone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                    >
                      <Avatar
                        src={editForm.avatar}
                        className="avatar-preview"
                        sx={{
                          width: '100%',
                          height: '100%'
                        }}
                      />
                      <Box className="avatar-hover-overlay">
                        <CameraIcon sx={{ fontSize: 32 }} />
                      </Box>
                    </Box>

                    {avatarError && (
                      <Alert severity="warning" className="avatar-error-alert" sx={{ mt: 1, py: 0, px: 2, borderRadius: 2 }}>
                        {avatarError}
                      </Alert>
                    )}
                  </Box>

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

                  <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
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
                { label: 'Streak', value: userData.streak || 0, icon: <StreakIcon />, color: 'orange', bg: 'orange' },
                { label: 'XP', value: user?.xp || 0, icon: <StreakIcon />, color: 'blue', bg: 'blue' },
                { label: 'Trophies', value: userData.achievements || 0, icon: <TrophyIcon />, color: 'yellow', bg: 'yellow' },
                { label: 'Path', value: `${user?.levelName || 'Beginner'} (Lvl ${user?.level || 1})`, icon: <PathIcon />, color: 'purple', bg: 'purple' },
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
          </Grid>          {/* Right Column: Content */}
          <Grid item xs={12} lg={8} className="content-column">
            <Stack spacing={4}>
              {/* Registered Courses Card */}
              <Paper 
                sx={{ 
                  p: 4,
                  borderRadius: 4,
                  border: '1px solid var(--divider)',
                  bgcolor: 'var(--surface-glass)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>
                  Registered Courses
                </Typography>
                
                {registeredCoursesProgress.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: 'var(--text-secondary)', fontStyle: 'italic', mb: 2 }}>
                      You haven't registered in any courses yet.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/')}
                      sx={{ background: 'var(--hero-gradient)', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                    >
                      Browse Courses
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={3}>
                    {registeredCoursesProgress.map(courseProg => (
                      <Box 
                        key={courseProg.title} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 3, 
                          bgcolor: 'var(--background-default)', 
                          border: '1px solid var(--divider)',
                          transition: 'transform 0.2s, border-color 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: 'var(--primary-main)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                              {courseProg.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5, fontSize: '0.85rem' }}>
                              {courseProg.description}
                            </Typography>
                          </Box>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => {
                              const slug = courseProg.title.toLowerCase().replace(/\s+/g, '-');
                              navigate(`/course/${slug}`, { state: { course: courseProg.course } });
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                          >
                            Resume
                          </Button>
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontSize: '0.85rem' }}>
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              Lessons: {courseProg.completedLessons} / {courseProg.totalLessons} completed
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--primary-main)', fontSize: '0.8rem' }}>
                              {courseProg.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={courseProg.progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4, 
                              bgcolor: 'var(--divider)',
                              '& .MuiLinearProgress-bar': {
                                background: 'var(--hero-gradient)',
                                borderRadius: 4
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>

              {/* Achievements Collection Card */}
              <Paper 
                sx={{ 
                  p: 4,
                  borderRadius: 4,
                  border: '1px solid var(--divider)',
                  bgcolor: 'var(--surface-glass)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>
                    Badges & Milestones
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/achievements')}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    View All
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  {resolvedAchievements.map(ach => {
                    const progressPercent = ach.targetValue > 0 ? Math.min(Math.round((ach.currentValue / ach.targetValue) * 100), 100) : 0;
                    return (
                      <Grid item xs={12} sm={6} key={ach.id}>
                        <Box 
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 3, 
                            bgcolor: 'var(--background-default)', 
                            border: '1px solid var(--divider)',
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            opacity: ach.isUnlocked ? 1 : 0.6,
                            position: 'relative'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 56, 
                              height: 56, 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0,
                              bgcolor: ach.isUnlocked ? `${ach.associatedColor}15` : 'rgba(0,0,0,0.05)',
                              color: ach.isUnlocked ? ach.associatedColor : 'var(--text-disabled)',
                              border: `2px solid ${ach.isUnlocked ? ach.associatedColor : 'var(--divider)'}`
                            }}
                          >
                            {ach.iconReference === 'school' && <CourseIcon />}
                            {ach.iconReference === 'emoji_events' && <TrophyIcon />}
                            {ach.iconReference === 'local_fire_department' && <StreakIcon />}
                            {ach.iconReference === 'bolt' && <BoltIcon />}
                            {ach.iconReference === 'explore' && <PathIcon />}
                            {ach.iconReference === 'workspace_premium' && <TrophyIcon />}
                          </Box>
                          
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-primary)', noWrap: true }}>
                              {ach.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 1, minHeight: '32px' }}>
                              {ach.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={progressPercent}
                                sx={{ 
                                  height: 4, 
                                  borderRadius: 2, 
                                  flex: 1,
                                  bgcolor: 'var(--divider)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: ach.isUnlocked ? ach.associatedColor : 'var(--text-disabled)'
                                  }
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 750, color: 'var(--text-secondary)' }}>
                                {ach.currentValue}/{ach.targetValue}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;