import React, { useMemo, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  useTheme,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowForwardIcon,
  Lock as LockIcon,
  PlayArrow as PlayIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';



import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesData } from '../data/courses';
import './LearningPathPage.css';


const LearningPathPage = () => {
  const { courseId } = useParams();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateQuizScore } = useAuth();

  // Try to get course from state, or from coursesData using the URL param if state is lost on refresh
  const course = location.state?.course || coursesData.find(c => c.id === courseId);



  const [activeSectionIndex, setActiveSectionIndex] = useState(() => {
    if (location.state?.quizResult && course?.sections) {
      const { lessonId } = location.state.quizResult;
      const sectionIdx = course.sections.findIndex(s =>
        s.lessons.some(l => l.id === lessonId)
      );
      return sectionIdx !== -1 ? sectionIdx : 0;
    }
    return 0;
  });


  const domainKey = course ? (course.id) : 'unknown';

  const scores = useMemo(() => {
    return user?.quizScores || {};
  }, [user]);

  const sections = useMemo(() => {
    if (!course || !course.sections) return [];

    return course.sections.map((section, sIndex) => {
      const lessons = section.lessons;
      const completedLessons = lessons.filter(l => (scores[l.id] || 0) >= 70);
      const isComplete = completedLessons.length === lessons.length;

      let isUnlocked = sIndex === 0;
      if (sIndex > 0) {
        const prevSection = course.sections[sIndex - 1];
        const prevSectionLessons = prevSection.lessons;
        const prevSectionCompleted = prevSectionLessons.filter(l => (scores[l.id] || 0) >= 70);
        isUnlocked = prevSectionCompleted.length === prevSectionLessons.length;
      }

      return {
        ...section,
        isComplete,
        isUnlocked,
        progress: (completedLessons.length / lessons.length) * 100
      };
    });
  }, [course, scores]);

  const activeSection = sections[activeSectionIndex];

  const lessons = useMemo(() => {
    return activeSection?.lessons || [];
  }, [activeSection]);

  // Effect to sync back from QuizPage if it passed results in state
  useEffect(() => {
    if (location.state?.quizResult) {
      const { lessonId, percentage } = location.state.quizResult;
      updateQuizScore(lessonId, percentage);
    }
  }, [location.state, updateQuizScore]);


  const nodes = useMemo(() => {
    return lessons.map((lesson, index) => {
      const score = scores[lesson.id] || 0;
      const isPassed = score >= 70;

      let isPreviousPassed = index === 0;
      if (index > 0) {
        const prevLesson = lessons[index - 1];
        isPreviousPassed = (scores[prevLesson.id] || 0) >= 70;
      }

      let status = 'upcoming';
      if (isPassed) status = 'completed';
      else if (isPreviousPassed) status = 'active';

      // Distribute nodes visually
      const x = index % 2 === 0 ? 50 : 150;
      const y = 80 + index * 150;

      return {
        ...lesson,
        status,
        score,
        pos: { x, y },
        icon: <SchoolIcon />
      };
    });
  }, [lessons, scores]);


  const generatePath = () => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].pos.x} ${nodes[0].pos.y}`;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1].pos;
      const curr = nodes[i].pos;
      const cp1y = prev.y + (curr.y - prev.y) * 0.5;
      const cp2y = prev.y + (curr.y - prev.y) * 0.5;
      d += ` C ${prev.x} ${cp1y}, ${curr.x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const handleNodeClick = (node) => {
    if (node.status === 'upcoming') return;
    navigate(`/quiz/${domainKey}/${node.id}`, { state: { course } });
  };

  if (!course) {
    return (
      <Box className="path-page-empty">
        <Typography variant="h5">No course selected</Typography>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </Box>
    );
  }

  const nextActiveNode = nodes.find(n => n.status === 'active') || nodes[nodes.length - 1];

  return (
    <Box className="path-page">
      <Container maxWidth="md">
        <Box className="path-header">
          <Typography variant="h2" className="path-title">
            {course.title} Path
          </Typography>
          <div className="path-subtitle">
            Score at least 70% to pass each lesson and unlock the next section.
          </div>
        </Box>

        <Box className="path-sections-tabs glass-panel" sx={{ mb: 4, borderRadius: 3 }}>
          <Tabs
            value={activeSectionIndex}
            onChange={(e, val) => setActiveSectionIndex(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {sections.map((section, idx) => (
              <Tab
                key={section.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {section.title}
                    {!section.isUnlocked && <LockIcon sx={{ fontSize: 16 }} />}
                  </Box>
                }
                disabled={!section.isUnlocked}
              />
            ))}
          </Tabs>
        </Box>

        {!activeSection?.isUnlocked && (
          <Alert severity="warning" sx={{ mb: 4, borderRadius: 3 }}>
            Complete the previous section to unlock this path.
          </Alert>
        )}


        <Box className="path-visual-shell glass-panel-strong">
          <Box className="path-visual" style={{ height: `${nodes.length * 150 + 100}px` }}>
            <svg
              width="200"
              height={nodes.length * 150 + 100}
              className="path-svg"
              viewBox={`0 0 200 ${nodes.length * 150 + 100}`}
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <path
                d={generatePath()}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="15 15"
              />
            </svg>

            {nodes.map((node, index) => (
              <Box
                key={node.id}
                className="path-node-shell"
                style={{
                  left: `${node.pos.x}px`,
                  top: `${node.pos.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleNodeClick(node)}
              >
                <Box className="path-node-wrapper">
                  {node.status === 'active' && (
                    <Box className="path-node-pulse" />
                  )}

                  <Box className={`path-node path-node-${node.status}`}>
                    {node.status === 'completed' ? (
                      <CheckCircleIcon sx={{ fontSize: 32 }} />
                    ) : node.status === 'upcoming' ? (
                      <LockIcon sx={{ fontSize: 24 }} />
                    ) : (
                      <PlayIcon sx={{ fontSize: 32 }} />
                    )}
                  </Box>

                  <Paper
                    className={`path-node-card ${index % 2 === 0 ? 'is-right' : 'is-left'} ${node.status === 'upcoming' ? 'is-upcoming' : ''}`}
                    elevation={0}
                  >
                    <Typography variant="h6" className="path-node-title">
                      {node.title}
                    </Typography>
                    <Box className="path-node-meta">
                      <Box className={`path-node-meta-dot status-${node.status}`} />
                      <Typography variant="caption" className="path-node-status">
                        {node.score > 0 ? `Score: ${node.score}%` : node.status}
                      </Typography>

                    </Box>
                  </Paper>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className="path-footer glass-panel">
          <Box className="path-footer-content">
            <Typography variant="h4" className="path-footer-title">
              {activeSection?.isComplete ? "Section Completed!" : "Ready for the next challenge?"}
            </Typography>
            <div variant="body1" className="path-footer-copy">
              {activeSection?.isComplete
                ? `You've mastered all lessons in ${activeSection.title}.`
                : `Progress in this section: ${Math.round(activeSection?.progress || 0)}%`}
            </div>
            {!activeSection?.isComplete && (
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                className="path-footer-button"
                onClick={() => handleNodeClick(nextActiveNode)}
              >
                {nextActiveNode?.status === 'active' ? `Start ${nextActiveNode.title}` : "Continue Learning"}
              </Button>
            )}
            {activeSection?.isComplete && activeSectionIndex < sections.length - 1 && (
              <Button
                variant="contained"
                size="large"
                endIcon={<ChevronRightIcon />}
                className="path-footer-button"
                onClick={() => setActiveSectionIndex(prev => prev + 1)}
              >
                Next Section
              </Button>
            )}
          </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default LearningPathPage;
