import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  LinearProgress,
  useTheme
} from '@mui/material';
import './AchievementsPage.css';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Speed as SpeedIcon,
  LibraryBooks as LibraryIcon,
  Share as ShareIcon,
  Quiz as QuizIcon,
  Timer as TimerIcon,
  School as SchoolIcon,
  DoneAll as DoneAllIcon,
  Explore as ExploreIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { achievementsData } from '../../data/achievements';



const iconMap = {
  'school': <SchoolIcon />,
  'emoji_events': <TrophyIcon />,
  'local_fire_department': <FireIcon />,
  'bolt': <BoltIcon />,
  'explore': <ExploreIcon />,
  'workspace_premium': <WorkspacePremiumIcon />
};

const AchievementsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const calculateAchievementProgress = (ach) => {
    if (!user) return ach.progress;

    let currentValue = 0;
    const completedLessons = Object.keys(user.quizScores || {});
    
    switch (ach.id) {
      case 'ach-1': // First Step
        currentValue = completedLessons.length >= 1 ? 1 : 0;
        break;
      case 'ach-2': // Perfect Score
        // Assuming high scores are stored as percentages or raw values.
        // For now, let's just check if any score exists.
        // In a real app, we'd compare score with question count.
        currentValue = Object.values(user.quizScores || {}).some(score => score > 0) ? 1 : 0;
        break;
      case 'ach-3': // Consistent Scholar
        currentValue = user.streak || 0;
        break;
      case 'ach-4': // Speed Learner
        currentValue = completedLessons.length; // Simplified
        break;
      case 'ach-5': // Polymath
        currentValue = 1; // Simplified
        break;
      case 'ach-6': // Domain Master
        currentValue = completedLessons.length >= 5 ? 1 : 0; // Simplified
        break;
      default:
        currentValue = 0;
    }

    const isUnlocked = currentValue >= ach.progress.targetValue;
    return {
      ...ach.progress,
      currentValue,
      isUnlocked,
      unlockedAt: isUnlocked ? (ach.progress.unlockedAt || new Date()) : null
    };
  };

  const achievements = achievementsData.map(ach => {
    const progress = calculateAchievementProgress(ach);
    const isCompleted = progress.isUnlocked;
    const progressPercent = ach.progress.targetValue > 0 ? Math.min((progress.currentValue / ach.progress.targetValue) * 100, 100) : 0;

    return {
      id: ach.id,
      title: ach.name,
      desc: ach.description,
      icon: iconMap[ach.iconReference] || <TrophyIcon />,
      status: isCompleted ? 'completed' : (progress.currentValue > 0 ? 'in_progress' : 'locked'),
      progress: progressPercent,
      date: progress.unlockedAt ? (typeof progress.unlockedAt === 'string' ? progress.unlockedAt.split('T')[0] : progress.unlockedAt.toISOString().split('T')[0]) : null
    };
  });

  const unlockedCount = achievements.filter(a => a.status === 'completed').length;


  return (
    <Box className="achievements-container">
      <Container maxWidth="lg">
        <Grid container spacing={4} className="stats-grid">
          <Grid item xs={12} md={4}>
            <Paper className="trophy-card">
              <TrophyIcon sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 900 }}>{unlockedCount} / {achievements.length}</Typography>
              <Typography variant="overline" sx={{ fontWeight: 700, opacity: 0.8 }}>Unlocked Trophies</Typography>

            </Paper>
          </Grid>
        </Grid>

        {/* Achievements Grid */}
        <Grid container spacing={3} className="achievements-grid">
          {achievements.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper
                className={`achievement-card ${item.status}`}
              >
                {item.status === 'locked' && (
                  <Box className="lock-icon">
                    <LockIcon fontSize="small" />
                  </Box>
                )}

                <Box className={`achievement-icon ${item.status}`}>
                  {React.cloneElement(item.icon, { sx: { fontSize: 32 } })}
                </Box>

                <Typography variant="h6" className="achievement-title">
                  {item.title}
                </Typography>
                <Typography variant="body2" className="achievement-desc">
                  {item.desc}
                </Typography>

                {item.status === 'completed' ? (
                  <Box className="unlocked-badge">
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Unlocked on {item.date}
                    </Typography>
                  </Box>
                ) : item.status === 'in_progress' ? (
                  <Box>
                    <Box className="progress-header">
                      <Typography variant="caption" className="progress-label">Progress</Typography>
                      <Typography variant="caption" className="progress-label">{Math.round(item.progress)}%</Typography>

                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.progress}
                      sx={{ height: 6, borderRadius: 3, width: '100%' }}
                    />
                  </Box>
                ) : (
                  <Typography variant="caption" className="locked-label">
                    Locked
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AchievementsPage;