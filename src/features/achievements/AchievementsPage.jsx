import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  Trophy, 
  Lock, 
  GraduationCap, 
  Flame, 
  Zap, 
  Compass, 
  Award, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import './AchievementsPage.css';
import { useAuth } from '../../context/AuthContext';
import { achievementsData } from '../../data/achievements';

const iconMap = {
  'school': <GraduationCap className="icon-main" />,
  'emoji_events': <Trophy className="icon-main" />,
  'local_fire_department': <Flame className="icon-main" />,
  'bolt': <Zap className="icon-main" />,
  'explore': <Compass className="icon-main" />,
  'workspace_premium': <Award className="icon-main" />
};

const AchievementsPage = () => {
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
      ...ach.progress,
      currentValue,
      isUnlocked,
      unlockedAt: isUnlocked ? (ach.progress.unlockedAt || new Date()) : null
    };
  };

  const achievements = achievementsData.map(ach => {
    const progress = calculateAchievementProgress(ach);
    const isCompleted = progress.isUnlocked;
    const progressPercent = ach.progress.targetValue > 0 
      ? Math.min((progress.currentValue / ach.progress.targetValue) * 100, 100) 
      : 0;

    return {
      id: ach.id,
      title: ach.name,
      desc: ach.description,
      icon: iconMap[ach.iconReference] || <Trophy className="icon-main" />,
      status: isCompleted ? 'completed' : (progress.currentValue > 0 ? 'in_progress' : 'locked'),
      progress: progressPercent,
      currentValue: progress.currentValue,
      targetValue: ach.progress.targetValue,
      color: ach.associatedColor || '#3D5CFF',
      date: progress.unlockedAt 
        ? (typeof progress.unlockedAt === 'string' 
            ? progress.unlockedAt.split('T')[0] 
            : progress.unlockedAt.toISOString().split('T')[0]) 
        : null
    };
  });

  const unlockedCount = achievements.filter(a => a.status === 'completed').length;
  const overallPercentage = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <Box className="achievements-container">
      <Container maxWidth="lg">
        
        {/* Header - Centered & Professional */}
        <Box className="achievements-hero-section">
          <Box className="badge-glow-container">
            <Trophy className="hero-trophy-icon" />
          </Box>
          <Typography variant="h2" className="hero-title">
            Your <span className="highlight-text">Achievements</span>
          </Typography>
          <Typography variant="body1" className="hero-subtitle">
            Track your progress, unlock rewards, and master educational modules. Keep pushing to complete all achievements!
          </Typography>
        </Box>

        {/* Dashboard Progress Panel - Centered & Premium */}
        <Box className="overall-stats-panel-wrapper">
          <Paper className="overall-stats-panel">
            <Box className="stats-header">
              <Box className="circular-progress-glow">
                <Box className="circular-progress-text">
                  <Typography variant="h3" className="stats-percent">{overallPercentage}%</Typography>
                  <Typography variant="caption" className="stats-percent-label">COMPLETED</Typography>
                </Box>
              </Box>
              <Box className="stats-info">
                <Typography variant="h4" className="stats-headline">
                  Academy Mastery
                </Typography>
                <Typography variant="body2" className="stats-subheadline">
                  You have unlocked <strong>{unlockedCount}</strong> out of <strong>{achievements.length}</strong> available milestone awards.
                </Typography>
                <Box className="progress-bar-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={overallPercentage} 
                    className="stats-progress-bar"
                  />
                  <Box className="progress-bar-labels">
                    <span>0%</span>
                    <span>{unlockedCount} unlocked</span>
                    <span>100%</span>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Grid Title */}
        <Box className="grid-section-header">
          <Sparkles className="sparkle-icon" />
          <Typography variant="h5" className="grid-title">Milestones & Badge Collection</Typography>
        </Box>

        {/* Achievements Grid - Centered & Professional */}
        <Grid container spacing={3} className="achievements-grid-mui">
          {achievements.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper 
                className={`premium-achievement-card ${item.status}`}
                style={{ 
                  '--card-accent-color': item.color,
                  borderTop: `4px solid ${item.color}`
                }}
              >
                {/* Lock Overlay for Locked Items */}
                {item.status === 'locked' && (
                  <Box className="card-lock-overlay">
                    <Lock className="card-lock-icon" size={18} />
                    <span>Locked</span>
                  </Box>
                )}

                {/* Card Header with Glowing Icon */}
                <Box 
                  className={`card-icon-wrapper ${item.status}`}
                  style={{ 
                    backgroundColor: item.status === 'completed' ? `${item.color}15` : undefined,
                    border: `1px solid ${item.color}30`,
                    color: item.status === 'completed' ? item.color : undefined
                  }}
                >
                  {item.icon}
                </Box>

                {/* Card Text Content */}
                <Typography variant="h6" className="premium-card-title">
                  {item.title}
                </Typography>
                <Typography variant="body2" className="premium-card-desc">
                  {item.desc}
                </Typography>

                {/* Card Footer Status Indicator */}
                <Box className="premium-card-footer">
                  {item.status === 'completed' ? (
                    <Box className="achievement-unlocked-status">
                      <ShieldCheck size={16} className="unlocked-icon" />
                      <Typography variant="caption">
                        Unlocked on {item.date}
                      </Typography>
                    </Box>
                  ) : item.status === 'in_progress' ? (
                    <Box className="achievement-progress-status">
                      <Box className="progress-text-row">
                        <span>Progress</span>
                        <span>{item.currentValue} / {item.targetValue}</span>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={item.progress} 
                        className="card-progress-bar"
                        style={{ '--bar-accent-color': item.color }}
                      />
                    </Box>
                  ) : (
                    <Box className="achievement-locked-status">
                      <Lock size={14} className="locked-icon" />
                      <Typography variant="caption">
                        Requirement: {item.targetValue}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
};

export default AchievementsPage;