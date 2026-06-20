import React, { useMemo, useState } from 'react';
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


import { useNavigate, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './NavigationPage.css';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';


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

const NavigationPage = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDarkMode } = useAppTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isStickyFooterPage = location.pathname.startsWith('/quiz/') || location.pathname.startsWith('/learning/');

  const userName = user?.name || 'Learner';


  const navigationItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardRoundedIcon /> },
    { label: 'Chapter Challenge', path: '/challenge', icon: <AutoAwesomeIcon /> },
    { label: 'Achievements', path: '/achievements', icon: <EmojiEventsIcon /> },
    { label: 'HTML Editor', path: '/editor', icon: <CodeIcon /> },
    { label: 'Chats', path: '/chats', icon: <ChatIcon /> },
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
      className="nav-shell-sidebar"
      variants={containerVariants}
    >
      <motion.div className="nav-brand" variants={itemVariants}>
        <div className="nav-brand-mark">
          <AutoAwesomeIcon fontSize="small" />
        </div>
        <div>
          <Typography className="nav-brand-title">SophiaPath</Typography>
        </div>
      </motion.div>

      <motion.div className="nav-profile-card" variants={itemVariants}>
        <Avatar
          src="https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg"
          sx={{ width: 56, height: 56 }}
        />
        <div className="nav-profile-copy">
          <Typography className="nav-profile-name">{userName}</Typography>
        </div>
      </motion.div>

      <List className="nav-menu-list">
        {navigationItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <motion.div key={item.path} variants={itemVariants}>
              <ListItemButton
                selected={active}
                className={`nav-menu-item ${active ? 'is-active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon className="nav-menu-icon">{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </motion.div>
          );
        })}
      </List>
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

  const currentTitle = pageTitles[location.pathname] || 'SophiaPath';
  const currentDescription = pageDescriptions[location.pathname] || 'Your space for structured learning and growth.';

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
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.08 }
            }
          }}
          className="nav-desktop-rail"
        >
          {shellNav}
        </motion.aside>
      )}
      {isMobile && renderDrawer()}

      <main className="nav-main">
        <header className="nav-topbar glass-panel">
          <div className="nav-topbar-copy">
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} className="nav-menu-trigger">
                <MenuIcon />
              </IconButton>
            )}
            {!isMobile && (
              <IconButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="nav-collapse-trigger" title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
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
              src="https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg"
              sx={{ width: 48, height: 48 }}
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </header>

        <section className="nav-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedPage><LearningPage /></AnimatedPage>} />
              <Route path="/challenge" element={<AnimatedPage><ChallengePage /></AnimatedPage>} />
              <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
              <Route path="/achievements" element={<AnimatedPage><AchievementsPage /></AnimatedPage>} />
              <Route path="/chats" element={<AnimatedPage><ChatListPage /></AnimatedPage>} />


              <Route path="/chat/:userId" element={<AnimatedPage><ChatPage /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />

              <Route path="/course/:courseId" element={<AnimatedPage><CourseDetailPage /></AnimatedPage>} />
              <Route path="/learning-path/:courseId" element={<AnimatedPage><LearningPathPage /></AnimatedPage>} />

              <Route path="/quiz/:courseDomain/:lessonId" element={<AnimatedPage><QuizPage /></AnimatedPage>} />
              <Route path="/learning/:courseId/:sectionId/:lessonId" element={<AnimatedPage><LearningContentPage /></AnimatedPage>} />
              <Route path="/philosophy-lab" element={<AnimatedPage><PhilosophyLabPage /></AnimatedPage>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </section>
      </main>
    </Box>
  );
};


export default NavigationPage;
