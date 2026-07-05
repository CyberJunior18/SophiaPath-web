import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ScienceIcon from '@mui/icons-material/Science';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CodeIcon from '@mui/icons-material/Code';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PaletteIcon from '@mui/icons-material/Palette';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ArrowOutward as ArrowOutwardIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { coursesData } from '../data/courses';
import './LearningPage.css';

const getCourseDomain = (title) => {
  const t = title.toLowerCase();
  if (t.includes('cyber') || t.includes('security') || t.includes('network')) {
    return 'Technology';
  }
  if (t.includes('computer') || t.includes('develop') || t.includes('ai') || t.includes('code') || t.includes('basics') || t.includes('programming') || t.includes('mobile')) {
    return 'Technology';
  }
  if (t.includes('physics') || t.includes('science') || t.includes('math') || t.includes('chem')) {
    return 'Science';
  }
  if (t.includes('philosophy') || t.includes('ethics') || t.includes('history') || t.includes('art') || t.includes('humanities')) {
    return 'Humanities';
  }
  if (t.includes('design') || t.includes('graphic') || t.includes('ui') || t.includes('ux') || t.includes('creative')) {
    return 'Design';
  }
  if (t.includes('business') || t.includes('marketing') || t.includes('management') || t.includes('finance')) {
    return 'Business';
  }
  return 'Technology';
};

const LearningPage = () => {
  const { user, registerCourse } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [courses, setCourses] = useState(coursesData);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch('/courses/export/all');
        if (res.ok) {
          const backendCourses = await res.json();
          if (backendCourses && backendCourses.length > 0) {
            const mapped = backendCourses.map(bc => ({
              id: bc.id,
              title: bc.title,
              description: bc.description || '',
              about: bc.about || '',
              imageUrl: bc.imageUrl || '',
              comingsoon: bc.comingsoon || false,
              domain: getCourseDomain(bc.title),
              sections: (bc.sections || []).map(sec => ({
                id: sec.id,
                title: sec.title,
                description: sec.description || '',
                lessons: (sec.lessons || []).map(les => ({
                  id: les.id,
                  category: les.category || 'learning',
                  chapterName: les.chapterName || '',
                  title: les.title || 'Untitled Lesson',
                  orderIndex: les.orderIndex || 0,
                }))
              }))
            }));
            setCourses(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load courses from backend export/all:', err);
      }
    };
    loadCourses();
  }, []);

  const categories = ['All', 'Technology', 'Science', 'Humanities', 'Design', 'Business'];

  const registeredCourseTitles = user?.registeredCourses || [];
  
  const courseProgress = useMemo(() => {
    const progress = {};
    if (!user || !user.quizScores) return progress;

    courses.forEach(course => {
      const lessonIds = course.sections.flatMap(s => s.lessons || []).map(l => l.id);
      const completedCount = lessonIds.filter(id => user.quizScores[id] !== undefined).length;
      progress[course.title] = completedCount;
    });
    return progress;
  }, [user, courses]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || course.domain === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const totalAvailableCourses = courses.length;

  const comingSoon = [
    'Artificial Intelligence',
    'Web Development',
    'Data Science',
    'Digital Marketing',
    'Graphic Design',
    'Business Management',
  ];

  const getCourseIcon = (courseTitle) => {
    const lowerTitle = courseTitle.toLowerCase();
    switch (lowerTitle) {
      case 'cybersecurity':
        return <SecurityIcon />;
      case 'mobile development':
        return <PhoneAndroidIcon />;
      case 'physics':
        return <ScienceIcon />;
      case 'philosophy':
        return <PsychologyIcon />;
      case 'artificial intelligence':
        return <SmartToyIcon />;
      case 'web development':
        return <CodeIcon />;
      case 'data science':
        return <AnalyticsIcon />;
      case 'digital marketing':
        return <TrendingUpIcon />;
      case 'graphic design':
        return <PaletteIcon />;
      case 'business management':
        return <BusinessIcon />;
      default:
        return <SchoolIcon />;
    }
  };

  const dashboardStats = useMemo(() => {
    const activeCourses = registeredCourseTitles.length;
    const totalLessonsCompleted = Object.values(courseProgress).reduce((sum, value) => sum + value, 0);
    const totalCoursesCompleted = Object.entries(courseProgress).filter(([title, count]) => {
      const course = courses.find(c => c.title === title);
      const totalLessons = course?.sections.flatMap(s => s.lessons || []).length || 0;
      return count > 0 && count === totalLessons;
    }).length;

    return [
      { label: 'Active Courses', value: String(activeCourses).padStart(2, '0') },
      { label: 'Lessons Cleared', value: String(totalLessonsCompleted).padStart(2, '0') },
      { label: 'Courses Completed', value: String(totalCoursesCompleted).padStart(2, '0') },
    ];
  }, [courseProgress, registeredCourseTitles, courses]);

  const isCourseRegistered = (courseTitle) => {
    return registeredCourseTitles.some(title => title.toLowerCase() === courseTitle.toLowerCase());
  };

  const getLessonsFinished = (courseTitle) => {
    return courseProgress[courseTitle] || 0;
  };

  const getTotalLessons = (courseTitle) => {
    const course = courses.find(c => c.title.toLowerCase() === courseTitle.toLowerCase());
    return course ? course.sections.flatMap(s => s.lessons || []).length : 0;
  };

  const handleCourseClick = (course) => {
    const freshCourse = courses.find(c => c.title.toLowerCase() === course.title.toLowerCase()) || course;
    const courseUrlSlug = course.title.toLowerCase().replace(/\s+/g, '-');

    if (isCourseRegistered(course.title)) {
      navigate(`/course/${courseUrlSlug}`, {
        state: { course: freshCourse }
      });
    } else {
      registerCourse(freshCourse.title);
      navigate(`/course/${courseUrlSlug}`, {
        state: { course: freshCourse }
      });
    }
  };

  return (
    <Box className="learning-page">
      <section className="learning-intro glass-panel-strong">
        <div className="learning-intro-copy">
          <Typography variant="h2" className="learning-intro-title">
            Your Personalized Learning Journey
          </Typography>
          <Typography variant="body1" className="learning-intro-text">
            Explore {totalAvailableCourses} various fields of study and master new skills with interactive lessons and structured paths.
          </Typography>

          <div className="learning-intro-search">
            <TextField
              fullWidth
              placeholder="Search courses or technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="learning-search-field"
              InputProps={{
                startAdornment: <SearchIcon className="learning-search-icon" />,
              }}
            />
          </div>

          <div className="learning-category-row">
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setActiveCategory(category)}
                className={`learning-category-chip ${activeCategory === category ? 'is-active' : ''}`}
              />
            ))}
          </div>

          <Box style={{ width: '100%', marginTop: '24px' }}>
            <Paper className="learning-stats-panel glass-panel" elevation={0} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'row', gap: '24px', justifyContent: 'space-around', alignItems: 'center', width: '100%', borderRadius: '24px' }}>
              {dashboardStats.map((stat) => (
                <Box key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                  <Typography style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--primary-main)', fontFamily: '"Outfit", sans-serif' }}>{stat.value}</Typography>
                  <Typography style={{ color: 'var(--text-secondary)', fontWeight: 750, fontSize: '0.78rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        </div>
      </section>

      <section className="learning-section">
        <div className="learning-section-head">
          <div>
            <Typography variant="h4" className="learning-section-title">
              Available Courses
            </Typography>
            <Typography variant="body1" className="learning-section-copy">
              Premium learning modules with immersive layouts, persistent progress, and desktop-first productivity flow.
            </Typography>
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="learning-course-grid">
            {filteredCourses.map((course) => {
              const isRegistered = isCourseRegistered(course.title);
              const lessonsFinished = getLessonsFinished(course.title);
              const totalLessons = getTotalLessons(course.title);
              const progress = totalLessons > 0 ? (lessonsFinished / totalLessons) * 100 : 0;

              return (
                <Paper
                  key={course.title}
                  className="learning-course-card glass-panel"
                  elevation={0}
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="learning-course-card-top">
                    <div className="learning-course-icon">
                      {getCourseIcon(course.title)}
                    </div>
                    <div className="cyber-badge">{course.domain}</div>
                  </div>

                  <Typography variant="h5" className="learning-course-title">
                    {course.title}
                  </Typography>
                  <Typography variant="body2" className="learning-course-description">
                    {course.description}
                  </Typography>

                  <div className="learning-course-tags">
                    <Chip label={`${totalLessons} lessons`} className="learning-course-tag" />
                    {isRegistered && <Chip label="Registered" className="learning-course-tag is-success" />}
                  </div>

                  <div className="learning-course-footer">
                    {isRegistered ? (
                      <div className="learning-course-progress">
                        <div className="learning-course-progress-head">
                          <span>Progress:</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          className="learning-course-progress-bar"
                        />
                      </div>
                    ) : (
                      <div className="learning-course-cta">
                        <span>Start learning</span>
                        <PlayArrowIcon fontSize="small" />
                      </div>
                    )}
                    <ArrowOutwardIcon className="learning-course-arrow" />
                  </div>
                </Paper>
              );
            })}
          </div>
        ) : (
          <Paper className="learning-empty-state glass-panel" elevation={0}>
            <Typography variant="h6">No courses found for "{searchQuery}"</Typography>
            <Typography variant="body2">
              Try another keyword or switch the active category filter.
            </Typography>
          </Paper>
        )}
      </section>

      <section className="learning-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '2rem' }}>
        <Box style={{ textAlign: 'center' }}>
          <Typography variant="h4" className="learning-section-title">
            Coming Soon Specializations
          </Typography>
          <Typography variant="body1" className="learning-section-copy">
            Upcoming specializations queued for the next release cycle
          </Typography>
        </Box>

        <Box style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', maxWidth: '800px' }}>
          {comingSoon.map((title) => (
            <Box key={title} style={{ display: 'flex' }}>
              <Chip
                icon={getCourseIcon(title)}
                label={title}
                style={{
                  background: 'var(--surface-glass)',
                  border: '1px solid var(--divider)',
                  padding: '8px 12px',
                  height: 'auto',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              />
            </Box>
          ))}
        </Box>
      </section>
    </Box>
  );
};

export default LearningPage;
