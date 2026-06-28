import React, { useMemo, useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Brightness6 as Brightness6Icon,
  DashboardRounded as DashboardRoundedIcon,
  EmojiEvents as EmojiEventsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  ChatBubbleOutline as ChatIcon,
  Code as CodeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';


import { AnimatePresence, motion } from 'framer-motion';
import LearningPage from '../pages/LearningPage';
import ProfilePage from '../features/profile/ProfilePage';
import AchievementsPage from '../features/achievements/AchievementsPage';
import SettingsPage from '../features/settings/SettingsPage';
import CourseDetailPage from './CourseDetailPage';
import LearningPathPage from './LearningPathPage';
import QuizPage from './QuizPage';
import LearningContentPage from './LearningContentPage';
import ChallengePage from './ChallengePage';
import PhilosophyLabPage from './PhilosophyLabPage';
import ChatListPage from '../features/chat/ChatListPage';
import ChatPage from '../features/chat/ChatPage';
import CodeEditorPage from '../features/editor/CodeEditorPage';
import CyberLabPage from './CyberLabPage';
import GroupChatPage from '../features/chat/GroupChatPage';
import CommunityListPage from '../features/community/CommunityListPage';
import CommunityDetailPage from '../features/community/CommunityDetailPage';
import QuestionDetailPage from '../features/community/QuestionDetailPage';


import { useNavigate, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { socialStore } from '../data/socialStore';
import './NavigationPage.css';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { coursesData } from '../data/courses';


const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="nav-page-motion"
  >
    {children}
  </motion.div>
);

const getRouteKey = (pathname) => {
  if (!pathname) return '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  if (segments[0] === 'communities') return 'communities';
  if (segments[0] === 'chat' || segments[0] === 'chats' || segments[0] === 'group') return 'chats';
  if (segments[0] === 'course' || segments[0] === 'learning-path' || segments[0] === 'learning') return 'learning';
  return segments[0];
};

const NavigationPage = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDarkMode } = useAppTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isStickyFooterPage = location.pathname.startsWith('/quiz/') || location.pathname.startsWith('/learning/');

  const userName = user?.name || 'Learner';


  const navigationItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardRoundedIcon /> },
    { label: 'Achievements', path: '/achievements', icon: <EmojiEventsIcon /> },
    { label: 'HTML Editor', path: '/editor', icon: <CodeIcon /> },
    { label: 'Chats', path: '/chats', icon: <ChatIcon /> },
    { label: 'Communities', path: '/communities', icon: <GroupsIcon /> },
    { label: 'Profile', path: '/profile', icon: <PersonIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];



  const pageTitles = {
    '/': 'Learning Dashboard',
    '/learning-path': 'Your Roadmap',
    '/challenge': 'Chapter Challenge',
    '/achievements': 'Your Achievements',
    '/editor': 'HTML Playground',
    '/chats': 'Messages',
    '/communities': 'Learning Communities',
    '/profile': 'Your Profile',
    '/settings': 'Settings',
  };



  const pageDescriptions = {
    '/': 'Explore courses, track progress, and launch your next module.',
    '/learning-path': 'See the full roadmap and unlock your next milestone.',
    '/challenge': 'Test your skills in interactive hacking and coding exercises.',
    '/achievements': 'Monitor trophies, streaks, and progression signals.',
    '/editor': 'Experiment with HTML, CSS, and JS in a live environment.',
    '/chats': 'Connect with other learners and share your insights.',
    '/communities': 'Join public rooms, share code snippets, and debate logic.',
    '/profile': 'Review your public learner profile and progress footprint.',
    '/settings': 'Tune the interface and account behavior to your workflow.',
  };



  const handleNavigation = (path) => {
    if (path === '/editor') {
      window.open('/editor', '_blank');
      setDrawerOpen(false);
      return;
    }
    navigate(path);
    setDrawerOpen(false);
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const containerVariants = {
    expanded: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.06
      }
    },
    collapsed: {
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    expanded: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        mass: 0.8
      }
    },
    collapsed: {
      opacity: 0,
      y: 60,
      scale: 0.9,
      filter: "blur(4px)",
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 28
      }
    }
  };

  const shellNav = (
    <motion.div 
      className={`nav-shell-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}
      variants={containerVariants}
    >
      {!isMobile && (
        <IconButton 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
          className="nav-sidebar-toggle-btn"
          size="small"
          sx={{
            position: 'absolute',
            right: sidebarCollapsed ? '1.5rem' : 0,
            top: '48px',
            transform: sidebarCollapsed ? 'translate(100%, -50%)' : 'translate(50%, -50%)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--divider)',
            background: 'var(--background-paper) !important',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 9999,
            transition: 'background 0.2s, color 0.2s, transform 0.4s ease, right 0.4s ease',
            '&:hover': {
              background: 'var(--primary-main) !important',
              color: '#fff !important'
            }
          }}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      )}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          height: '100%',
          overflow: sidebarCollapsed ? 'hidden' : 'visible',
          pointerEvents: sidebarCollapsed ? 'none' : 'auto'
        }}
      >
        <motion.div 
          className="nav-brand" 
          variants={itemVariants}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1rem'
          }}
        >
          <div className="nav-brand-mark">
            <AutoAwesomeIcon fontSize="small" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <Typography className="nav-brand-title">SophiaPath</Typography>
            </div>
          )}
        </motion.div>

        {!sidebarCollapsed ? (
          <motion.div className="nav-profile-card" variants={itemVariants}>
            <Avatar
              src={user?.avatar || "https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg"}
              sx={{ width: 56, height: 56 }}
            />
            <div className="nav-profile-copy">
              <Typography className="nav-profile-name">{userName}</Typography>
            </div>
          </motion.div>
        ) : (
          <motion.div className="nav-profile-card collapsed" variants={itemVariants} style={{ justifyContent: 'center', padding: '0.5rem' }}>
            <Avatar
              src={user?.avatar || "https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg"}
              sx={{ width: 40, height: 40 }}
            />
          </motion.div>
        )}

        <List className="nav-menu-list">
          {navigationItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <motion.div key={item.path} variants={itemVariants}>
                <ListItemButton
                  selected={active}
                  className={`nav-menu-item ${active ? 'is-active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    px: sidebarCollapsed ? 1 : 2,
                  }}
                >
                  <ListItemIcon 
                    className="nav-menu-icon"
                    sx={{ 
                      minWidth: sidebarCollapsed ? 0 : 42, 
                      display: 'flex', 
                      justifyContent: 'center',
                      color: active ? 'var(--primary-main)' : 'inherit'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && <ListItemText primary={item.label} />}
                </ListItemButton>
              </motion.div>
            );
          })}
        </List>
      </motion.div>
    </motion.div>
  );

  const renderDrawer = () => (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      className="nav-mobile-drawer"
    >
      <motion.div initial="expanded" animate="expanded" style={{ height: '100%' }}>
        {shellNav}
      </motion.div>
    </Drawer>
  );

  const getHeaderDetails = () => {
    const path = location.pathname;
    
    // Check exact matches
    if (pageTitles[path]) {
      return {
        title: pageTitles[path],
        description: pageDescriptions[path]
      };
    }
    
    // Check dynamic routes
    if (path.startsWith('/course/')) {
      const courseId = path.substring(8);
      const course = coursesData.find(c => 
        String(c.id) === String(courseId) ||
        c.title.toLowerCase().replace(/\s+/g, '-') === String(courseId).toLowerCase()
      );
      return {
        title: course ? course.title : 'Course Details',
        description: course ? course.description : 'Explore course content and details.'
      };
    }
    
    if (path.startsWith('/learning-path/')) {
      const courseId = path.substring(15);
      const course = coursesData.find(c => 
        String(c.id) === String(courseId) ||
        c.title.toLowerCase().replace(/\s+/g, '-') === String(courseId).toLowerCase()
      );
      return {
        title: course ? `${course.title} Roadmap` : 'Your Roadmap',
        description: course ? `Complete modules to progress in ${course.title}.` : 'See the full roadmap and unlock your next milestone.'
      };
    }
    
    if (path.startsWith('/learning/')) {
      // Format: /learning/:courseId/:sectionId/:lessonId
      const parts = path.split('/');
      const courseId = parts[2];
      const sectionId = parts[3];
      const lessonId = parts[4];
      const course = coursesData.find(c => 
        String(c.id) === String(courseId) ||
        c.title.toLowerCase().replace(/\s+/g, '-') === String(courseId).toLowerCase()
      );
      let title = 'Lesson Content';
      if (course) {
        const section = course.sections?.find(s => String(s.id) === String(sectionId));
        const lesson = section?.lessons?.find(l => String(l.id) === String(lessonId));
        if (lesson) {
          title = lesson.title;
        }
      }
      return {
        title: title,
        description: 'Read the materials, understand the key concepts, and take the quiz when ready.'
      };
    }
    
    if (path.startsWith('/quiz/')) {
      // Format: /quiz/:courseDomain/:lessonId
      const parts = path.split('/');
      const courseDomain = parts[2];
      const lessonId = parts[3];
      const course = coursesData.find(c => 
        c.domain?.toLowerCase() === courseDomain?.toLowerCase() ||
        c.title?.toLowerCase() === courseDomain?.toLowerCase()
      );
      let title = 'Quiz';
      if (course) {
        const lesson = course.sections?.flatMap(s => s.lessons || [])?.find(l => String(l.id) === String(lessonId));
        if (lesson) {
          title = `${lesson.title} - Quiz`;
        }
      }
      return {
        title: title,
        description: 'Test your knowledge on this topic and review any incorrect answers.'
      };
    }
    
    if (path.startsWith('/chat/')) {
      return {
        title: 'Messages',
        description: 'Connect with other learners and share your insights.'
      };
    }

    if (path.startsWith('/group/')) {
      return {
        title: 'Group Chat',
        description: 'Collaborate with your learning squad.'
      };
    }

    if (path.startsWith('/communities')) {
      return {
        title: 'Learning Communities',
        description: 'Join community channels, ask questions, and share knowledge.'
      };
    }

    if (path === '/philosophy-lab') {
      return {
        title: 'Fallacy Matcher',
        description: 'Test your critical thinking by matching arguments with logical fallacies.'
      };
    }

    if (path === '/cyber-lab') {
      return {
        title: 'Interactive Cyber Lab',
        description: 'Experiment with hands-on labs and security exercises.'
      };
    }
    
    return {
      title: 'SophiaPath',
      description: 'Your space for structured learning and growth.'
    };
  };

  const { title: currentTitle, description: currentDescription } = getHeaderDetails();

  const hideTopbar = 
    location.pathname.startsWith('/course') ||
    location.pathname.startsWith('/learning-path') ||
    location.pathname.startsWith('/learning') ||
    location.pathname.startsWith('/quiz') ||
    location.pathname.startsWith('/chat/') ||
    location.pathname.startsWith('/group/') ||
    location.pathname.startsWith('/communities/') ||
    location.pathname.startsWith('/philosophy-lab') ||
    location.pathname.startsWith('/cyber-lab') ||
    location.pathname.startsWith('/challenge');

  if (!user && !isAuthPage) {
    return <Navigate to="/login" />;
  }

  if (isAuthPage) {
    return (
      <Box className="auth-shell">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </Box>
    );
  }

  return (
    <Box className={`nav-shell ${isStickyFooterPage ? 'has-sticky-footer' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!isMobile && (
        <motion.aside
          animate={sidebarCollapsed ? "collapsed" : "expanded"}
          variants={{
            expanded: {
              width: 260,
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
            },
            collapsed: {
              width: 0,
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
            }
          }}
          className="nav-desktop-rail"
        >
          {shellNav}
        </motion.aside>
      )}
      {isMobile && renderDrawer()}

      <main className="nav-main">
        {!hideTopbar && (
          <header className="nav-topbar glass-panel">
          <div className="nav-topbar-copy">
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} className="nav-menu-trigger">
                <MenuIcon />
              </IconButton>
            )}
            <div>
              <Typography variant="h3" className="nav-topbar-title">{currentTitle}</Typography>
              <Typography variant="body1" className="nav-topbar-description">{currentDescription}</Typography>
            </div>
          </div>

          <div className="nav-topbar-actions">
            <Button
              variant="outlined"
              startIcon={<Brightness6Icon />}
              onClick={toggleTheme}
              className="nav-topbar-button"
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <IconButton onClick={handleLogout} className="nav-logout-btn" title="Logout">
              <LogoutIcon />
            </IconButton>
            <Avatar
              src={user?.avatar || "https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg"}
              sx={{ width: 48, height: 48 }}
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </header>
        )}

        <section className="nav-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={getRouteKey(location.pathname)}>
              <Route path="/" element={<AnimatedPage><LearningPage /></AnimatedPage>} />
              <Route path="/challenge" element={<AnimatedPage><ChallengePage /></AnimatedPage>} />
              <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
              <Route path="/achievements" element={<AnimatedPage><AchievementsPage /></AnimatedPage>} />
              <Route path="/chats" element={<AnimatedPage><ChatListPage /></AnimatedPage>} />


              <Route path="/chat/:userId" element={<AnimatedPage><ChatPage /></AnimatedPage>} />
              <Route path="/group/:groupId" element={<AnimatedPage><GroupChatPage /></AnimatedPage>} />
              <Route path="/communities" element={<AnimatedPage><CommunityListPage /></AnimatedPage>} />
              <Route path="/communities/:communityId" element={<AnimatedPage><CommunityDetailPage /></AnimatedPage>} />
              <Route path="/communities/:communityId/room/:roomId" element={<AnimatedPage><CommunityDetailPage /></AnimatedPage>} />
              <Route path="/communities/:communityId/room/:roomId/question/:questionId" element={<AnimatedPage><QuestionDetailPage /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />

              <Route path="/course/:courseId" element={<AnimatedPage><CourseDetailPage /></AnimatedPage>} />
              <Route path="/learning-path/:courseId" element={<AnimatedPage><LearningPathPage /></AnimatedPage>} />

              <Route path="/quiz/:courseDomain/:lessonId" element={<AnimatedPage><QuizPage /></AnimatedPage>} />
              <Route path="/learning/:courseId/:sectionId/:lessonId" element={<AnimatedPage><LearningContentPage /></AnimatedPage>} />
              <Route path="/philosophy-lab" element={<AnimatedPage><PhilosophyLabPage /></AnimatedPage>} />
              <Route path="/cyber-lab" element={<AnimatedPage><CyberLabPage /></AnimatedPage>} />
              <Route path="/communities/join-invite/:communityId" element={<AnimatedPage><JoinInviteHandler /></AnimatedPage>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </section>
      </main>
    </Box>
  );
};

const JoinInviteHandler = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const join = async () => {
      try {
        await socialStore.joinCommunityByInvite(communityId);
        navigate(`/communities/${communityId}`);
      } catch (e) {
        console.error(e);
        navigate('/communities');
      }
    };
    join();
  }, [communityId, navigate]);

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography>Joining community via invite link...</Typography>
    </Box>
  );
};


export default NavigationPage;
