import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CourseDetailPage.css';
import {
  Typography,
  Container,
  Paper,
  Button,
  IconButton
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { coursesData } from '../data/courses';

import {
  ArrowBack as ArrowBackIcon,
  PlayCircleOutline as PlayIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  MenuBook as BookIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const course = location.state?.course || coursesData.find(c => 
    c.title.toLowerCase().replace(/\s+/g, '-') === courseId
  );


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

  const handleEnroll = () => {
    navigate(`/learning-path/${course.id}`, { state: { course } });
  };


  return (
    <div className="course-detail-container">
      <div className="course-detail-header">

        <Container maxWidth="lg" className="course-detail-header-content">
          <IconButton
            onClick={() => navigate(-1)}
            className="course-detail-back-button"
          >
            <ArrowBackIcon />
          </IconButton>

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
                <span>{course.totalLessons} Comprehensive Lessons</span>
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
                {course.sections.map((section, index) => {
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
                        {index === 0 ? (
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
                Ready to begin?
              </Typography>
              <div style={{ height: "10px" }}></div>
              <Typography className="course-sidebar-description">
                Join thousands of students and start your journey in <strong>{course.title}</strong> today.
              </Typography>
              <div style={{ height: "20px" }}></div>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleEnroll}
                className="course-enroll-button"
              >
                Enroll Now
              </Button>

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
