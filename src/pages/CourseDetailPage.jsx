import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './CourseDetailPage.css';
import {
  Typography,
  Container,
  Paper,
  Button,
  IconButton
} from '@mui/material';
import { coursesData } from '../data/courses';
import { useAuth } from '../context/AuthContext';

import {
  ArrowBack as ArrowBackIcon,
  PlayCircleOutline as PlayIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  MenuBook as BookIcon,
  EmojiEvents as TrophyIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, registerCourse, unregisterCourse } = useAuth();
  
  const [course, setCourse] = useState(location.state?.course || null);
  const [loading, setLoading] = useState(!course);

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const res = await fetch('/courses/export/all');
        if (res.ok) {
          const list = await res.json();
          const mappedList = list.map(bc => ({
            id: bc.id,
            title: bc.title,
            description: bc.description || '',
            about: bc.about || '',
            imageUrl: bc.imageUrl || '',
            comingsoon: bc.comingsoon || false,
            sections: (bc.sections || []).map(sec => {
              const uniqueLessons = [];
              const seenTitles = new Set();
              (sec.lessons || []).forEach(les => {
                const norm = (les.title || '').trim().toLowerCase();
                if (norm && !seenTitles.has(norm)) {
                  seenTitles.add(norm);
                  uniqueLessons.push({
                    id: les.id,
                    category: les.category || 'learning',
                    chapterName: les.chapterName || '',
                    title: les.title || 'Untitled Lesson',
                    orderIndex: les.orderIndex || 0,
                  });
                }
              });

              return {
                id: sec.id,
                title: sec.title,
                description: sec.description || '',
                lessons: uniqueLessons
              };
            })
          }));

          const matched = mappedList.find(c => 
            String(c.id) === String(courseId) ||
            c.title.toLowerCase().replace(/\s+/g, '-') === String(courseId).toLowerCase()
          );
          if (matched) {
            setCourse(matched);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load course details from database:', err);
      }

      // Fallback to local data
      const fallback = coursesData.find(c => 
        c.title.toLowerCase().replace(/\s+/g, '-') === courseId ||
        String(c.id) === String(courseId)
      );
      setCourse(fallback);
      setLoading(false);
    };

    loadCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="course-not-found" style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-main)', animation: 'spin 1s linear infinite' }} />
        <Typography variant="h6" style={{ color: 'var(--text-secondary)' }}>Loading Course Curriculum...</Typography>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-not-found">
        <Typography variant="h5" className="course-not-found-title">Course not found</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          className="course-not-found-button"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const isRegistered = user?.registeredCourses?.some(
    title => title.toLowerCase() === course.title.toLowerCase()
  );

  const handleEnroll = async () => {
    if (!isRegistered) {
      await registerCourse(course.title);
    }
    navigate(`/learning-path/${course.id}`, { state: { course } });
  };

  const handleUnregister = async () => {
    if (window.confirm(`Are you sure you want to unenroll from ${course.title}? Your progress will be reset.`)) {
      await unregisterCourse(course.title);
    }
  };

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <Container maxWidth="lg" className="course-detail-header-content">
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton
              onClick={() => navigate(-1)}
              className="course-detail-back-button"
            >
              <ArrowBackIcon />
            </IconButton>
            
            {isRegistered && (
              <IconButton
                onClick={handleUnregister}
                style={{ color: 'var(--danger-main)', marginLeft: 'auto' }}
                title="Unenroll from course"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </div>

          <div className="course-detail-copy">
            <Typography variant="overline" className="course-detail-kicker">
              EXPLORE COURSE
            </Typography>
            <Typography variant="h2" className="course-detail-title">
              {course.title}
            </Typography>
            <Typography variant="h6" className="course-detail-subtitle">
              {course.description}
            </Typography>
            <br></br>
            <div className="course-detail-meta">
              <div className="course-detail-meta-item">
                <TimeIcon fontSize="small" />
                <span>12 Hours Content</span>
              </div>
              <div className="course-detail-meta-item">
                <BookIcon fontSize="small" />
                <span>{course.totalLessons || course.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) || 6} Comprehensive Lessons</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content: Just Descriptions and Sections */}
      <Container maxWidth="lg" className="course-detail-content">
        <div className="course-detail-grid">
          <div className="course-detail-main-stack">
            {/* About Section */}
            <Paper className="course-card about-card">
              <Typography variant="h4" className="course-card-header">
                About this course
              </Typography>
              <br></br>
              <Typography className="course-about-text">
                {course.about}
              </Typography>
            </Paper>

            {/* Curriculum Section */}
            <Paper className="course-card">
              <Typography variant="h4" className="course-card-header">
                <div className="course-card-icon">
                  <BookIcon fontSize="large" />
                </div>
                Course Curriculum
              </Typography>
              <br></br>
              <div className="course-section-list">
                {course.sections?.map((section, index) => {
                  const lessonCount = section.lessons?.length || 0;

                  return (
                    <div
                      key={section.id}
                      className="course-section-item"
                    >
                      <div className="course-section-number">
                        {index + 1}
                      </div>
                      <div className="course-section-content">
                        <Typography className="course-section-title">
                          {section.title}
                        </Typography>
                        <div className="course-section-meta">
                          <span className="course-section-meta-item">
                            <TimeIcon sx={{ fontSize: 16 }} />
                            {10 + index * 5} min
                          </span>
                          <span className="course-section-divider"></span>
                          <span className="course-section-meta-label">{lessonCount} Lessons</span>
                        </div>
                      </div>
                      <div className="course-section-action">
                        {index === 0 || isRegistered ? (
                          <div className="course-section-play-icon">
                            <PlayIcon />
                          </div>
                        ) : (
                          <div className="course-section-lock-icon">
                            <LockIcon fontSize="small" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Paper>
          </div>

          {/* Action Sidebar */}
          <div>
            <Paper className="course-sidebar">
              <div className="course-sidebar-decoration"></div>

              <Typography variant="h5" className="course-sidebar-title">
                {isRegistered ? "Ready to resume?" : "Ready to begin?"}
              </Typography>
              <div style={{ height: "10px" }}></div>
              <Typography className="course-sidebar-description">
                {isRegistered 
                  ? `Pick up right where you left off and complete your mastery of ${course.title}.`
                  : `Join thousands of students and start your journey in ${course.title} today.`
                }
              </Typography>
              <div style={{ height: "20px" }}></div>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleEnroll}
                className="course-enroll-button"
              >
                {isRegistered ? "Continue Learning" : "Register Now"}
              </Button>

              {isRegistered && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Button
                    size="small"
                    style={{ color: 'var(--danger-main)', textTransform: 'none' }}
                    onClick={handleUnregister}
                  >
                    Unenroll from Course
                  </Button>
                </div>
              )}

              <div className="course-perks">
                {[
                  "Full lifetime access",
                  "Certificate of completion",
                  "24/7 Support community",
                  "Downloadable resources"
                ].map((perk) => (
                  <div key={perk} className="course-perk-item">
                    <div className="course-perk-icon">
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'var(--success-main)' }} />
                    </div>
                    <span className="course-perk-text">{perk}</span>
                  </div>
                ))}
              </div>
            </Paper>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CourseDetailPage;
