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
// Local date helper
const safeFormatDate = (timestamp, options = {}, fallback = '') => {
  if (!timestamp || timestamp === 'null' || timestamp === 'undefined') return fallback;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return fallback;
  if (Object.keys(options).length === 0) {
    return date.toLocaleDateString();
  }
  return date.toLocaleDateString(undefined, options);
};
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
        const res = await fetch('/courses');
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

    const getCourseDomain = (title) => {
      const t = title.toLowerCase();
      if (t.includes('cybersecurity') || t.includes('network') || t.includes('security')) return 'Technology';
      if (t.includes('physics') || t.includes('science') || t.includes('chemistry')) return 'Science';
      if (t.includes('philosophy') || t.includes('history') || t.includes('literature')) return 'Humanities';
      if (t.includes('marketing') || t.includes('business') || t.includes('management')) return 'Business';
      if (t.includes('design') || t.includes('graphic') || t.includes('art')) return 'Design';
      if (t.includes('mobile') || t.includes('web') || t.includes('app') || t.includes('code') || t.includes('development') || t.includes('ai') || t.includes('artificial')) return 'Technology';
      return 'Other';
    };

    const getRegisteredCoursesProgress = () => {
      if (!user || !user.registeredCourses) return [];
      return user.registeredCourses.map(courseTitle => {
        const courseTitleLower = courseTitle.toLowerCase();
        const loadedLessons = user.courseLessons?.[courseTitleLower] || [];
        const uniqueLessons = [];
        const seenTitles = new Set();
        loadedLessons.forEach(l => {
          const norm = (l.title || '').trim().toLowerCase();
          const isCheatsheet = norm.startsWith('cheatsheet:') || norm.startsWith('cheatsheet ') || norm === 'cheatsheet';
          if (norm && !isCheatsheet && !seenTitles.has(norm)) {
            seenTitles.add(norm);
            uniqueLessons.push(l);
          }
        });
        const completedLessons = uniqueLessons.filter(l => {
          const duplicates = loadedLessons.filter(dl => (dl.title || '').trim().toLowerCase() === (l.title || '').trim().toLowerCase());
          return duplicates.some(dl => dl.done || (dl.grade !== null && Number(dl.grade) >= 70));
        });
        return {
          title: courseTitle,
          completed: completedLessons.length,
          total: uniqueLessons.length,
          percent: uniqueLessons.length > 0 ? (completedLessons.length / uniqueLessons.length) * 100 : 0
        };
      });
    };

    const completedCoursesProgress = getRegisteredCoursesProgress();

    return achievementsData.map(ach => {
      let currentValue = 0;
      switch (ach.id) {
        // 📚 Course Progress
        case 'ach-course-1': // First Step
          currentValue = (user.registeredCourses || []).length >= 1 ? 1 : 0;
          break;
        case 'ach-course-2': // Getting Somewhere
          const has50Percent = completedCoursesProgress.some(p => p.percent >= 50);
          currentValue = has50Percent ? 50 : 0;
          break;
        case 'ach-course-3': // Finished What I Started
          const hasFinishedCourse = completedCoursesProgress.some(p => p.total > 0 && p.completed >= p.total);
          currentValue = hasFinishedCourse ? 1 : 0;
          break;
        case 'ach-course-4': // On a Roll
          currentValue = completedCoursesProgress.filter(p => p.total > 0 && p.completed >= p.total).length;
          break;

        // 🧪 Quiz & Performance
        case 'ach-quiz-1': // Tried My Best
          currentValue = Object.keys(user.quizScores || {}).length >= 1 ? 1 : 0;
          break;
        case 'ach-quiz-2': // Nailed It
          currentValue = Object.values(user.quizScores || {}).some(s => Number(s) >= 100) ? 1 : 0;
          break;
        case 'ach-quiz-3': // High Achiever
          currentValue = Object.values(user.quizScores || {}).filter(s => Number(s) >= 90).length;
          break;
        case 'ach-quiz-4': // Cover to Cover
          const hasFullyDone = completedCoursesProgress.some(p => p.total > 0 && p.completed >= p.total);
          currentValue = hasFullyDone ? 1 : 0;
          break;

        // 💬 Social & Community
        case 'ach-social-1': // Speak Up
          currentValue = user.commentsCreatedCount || 0;
          break;
        case 'ach-social-2': // Always Has Something to Say
          currentValue = user.commentsCreatedCount || 0;
          break;
        case 'ach-social-3': // Making an Impact
          currentValue = user.postsApprovedCount || 0;
          break;
        case 'ach-social-4': // Known Around Here
          currentValue = user.postsApprovedCount || 0;
          break;

        // ⚡ XP & Levels
        case 'ach-xp-1': // Getting Started
          currentValue = user.xp || 0;
          break;
        case 'ach-xp-2': // Making Moves
          currentValue = user.xp || 0;
          break;
        case 'ach-xp-3': // Moving Up
          currentValue = user.level || 1;
          break;
        case 'ach-xp-4': // At the Top
          currentValue = user.level || 1;
          break;

        // 🔥 Streaks
        case 'ach-streak-1': // Warming Up
          currentValue = user.streak || 0;
          break;
        case 'ach-streak-2': // In the Zone
          currentValue = user.streak || 0;
          break;
        case 'ach-streak-3': // Creature of Habit
          currentValue = user.streak || 0;
          break;

        // 🎭 Roles & Account Age
        case 'ach-role-1': // Day One
        case 'ach-role-2': // Been Here Forever
          const joinedDate = user.joinedDate ? new Date(user.joinedDate) : new Date();
          const diffDays = Math.floor((new Date() - joinedDate) / (1000 * 60 * 60 * 24));
          currentValue = diffDays >= 0 ? diffDays : 0;
          break;
        case 'ach-role-3': // Teacher's Got the Floor
          currentValue = Number(user.roleID) === 1 ? 1 : 0;
          break;

        // 🏠 Engagement & Misc
        case 'ach-eng-1': // Party Starter
          currentValue = user.groupsCreatedCount || 0;
          break;
        case 'ach-eng-2': // Always Hosting
          currentValue = user.groupsCreatedCount || 0;
          break;
        case 'ach-eng-3': // Bit of Everything
          const domains = new Set((user.registeredCourses || []).map(getCourseDomain));
          currentValue = domains.size;
          break;

        default:
          currentValue = 0;
      }

      const targetValue = ach.progress.targetValue;
      const isUnlocked = user.achievementIds?.includes(ach.id) || (currentValue >= targetValue);
      return {
        ...ach,
        isUnlocked,
        currentValue: isUnlocked ? targetValue : currentValue,
        targetValue
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
      <Container maxWidth="lg" className="profile-content">
        <Grid container spacing={4}>
          {/* Main Column: Profile, Stats, Achievements */}
          <Grid item xs={12} md={8}>
            <Stack spacing={4}>
              <Paper className="profile-card">
                {!isEditing ? (
                <>
                  <Box className="profile-avatar-container">
                    <Avatar
                      src={userData.profileImage}
                      sx={{ 
                        width: 180, 
                        height: 180, 
                        border: `8px solid ${theme.palette.background.paper}`}}
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
                          {safeFormatDate(user?.joinedDate, { year: 'numeric', month: 'long', day: 'numeric' }, 'Recently')}
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

            {/* Statistics Section */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Day streak', value: userData.streak || 0, icon: <StreakIcon fontSize="medium" />, color: 'orange' },
                  { label: 'Total XP', value: user?.xp || 0, icon: <BoltIcon fontSize="medium" />, color: 'yellow' },
                  { label: 'Current league', value: 'Ruby', icon: <TrophyIcon fontSize="medium" />, color: 'error' },
                  { label: 'Top 3 finishes', value: userData.achievements || 0, icon: <TrophyIcon fontSize="medium" />, color: 'warning' },
                ].map((stat, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{ 
                      p: 2.5, 
                      borderRadius: 4, 
                      border: '1px solid rgba(var(--divider-rgb), 0.5)',
                      bgcolor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: `var(--${stat.color}-500)` }
                    }}>
                      <Box sx={{ color: `var(--${stat.color}-500)`, display: 'flex' }}>
                        {stat.icon}
                      </Box>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{stat.value}</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Achievements Collection Card */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>
                  Achievements
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/achievements')}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  View All
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {resolvedAchievements.map(ach => (
                  <Grid item xs={6} sm={4} md={4} key={ach.id}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        textAlign: 'center', 
                        border: '1px solid var(--divider)', 
                        borderRadius: 3, 
                        bgcolor: 'transparent',
                        opacity: ach.isUnlocked ? 1 : 0.45,
                        height: '100%',
                        minHeight: '120px'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mb: 1.5,
                          flexShrink: 0,
                          bgcolor: ach.isUnlocked ? `color-mix(in srgb, ${ach.associatedColor} 15%, transparent)` : 'rgba(255,255,255,0.03)',
                          color: ach.isUnlocked ? ach.associatedColor : 'var(--text-disabled)',
                          border: `2px solid ${ach.isUnlocked ? ach.associatedColor : 'var(--divider)'}`
                        }}
                      >
                        {ach.iconReference === 'school' && <CourseIcon fontSize="medium" />}
                        {ach.iconReference === 'trending_up' && <PathIcon fontSize="medium" />}
                        {ach.iconReference === 'workspace_premium' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'military_tech' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'quiz' && <PathIcon fontSize="medium" />}
                        {ach.iconReference === 'emoji_events' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'verified' && <CheckIcon fontSize="medium" />}
                        {ach.iconReference === 'auto_stories' && <CourseIcon fontSize="medium" />}
                        {ach.iconReference === 'chat_bubble_outline' && <ShareIcon fontSize="medium" />}
                        {ach.iconReference === 'forum' && <ShareIcon fontSize="medium" />}
                        {ach.iconReference === 'thumb_up' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'stars' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'star_outline' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'star' && <TrophyIcon fontSize="medium" />}
                        {ach.iconReference === 'arrow_upward' && <ArrowForwardIcon fontSize="medium" />}
                        {ach.iconReference === 'local_fire_department' && <StreakIcon fontSize="medium" />}
                        {ach.iconReference === 'whatshot' && <StreakIcon fontSize="medium" />}
                        {ach.iconReference === 'flame_member' && <StreakIcon fontSize="medium" />}
                        {ach.iconReference === 'calendar_today' && <CalendarIcon fontSize="medium" />}
                        {ach.iconReference === 'history' && <CalendarIcon fontSize="medium" />}
                        {ach.iconReference === 'assignment_ind' && <PersonIcon fontSize="medium" />}
                        {ach.iconReference === 'group_add' && <PersonIcon fontSize="medium" />}
                        {ach.iconReference === 'groups' && <PersonIcon fontSize="medium" />}
                        {ach.iconReference === 'explore' && <PathIcon fontSize="medium" />}
                        {ach.iconReference === 'rocket' && <BoltIcon fontSize="medium" />}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.78rem', lineHeight: 1.2 }}>
                        {ach.name}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Grid>
        {/* Right Column: Sidebar */}
        <Grid item xs={12} md={4} className="content-column">
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

            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;