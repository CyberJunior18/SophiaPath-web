import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  LinearProgress,
  IconButton,
  Modal,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './QuizPage.css';


const QuizPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const { updateQuizScore } = useAuth();


  // Load and shuffle questions
  useEffect(() => {
    if (!course) return;
    
    const lessons = course.sections.flatMap(s => s.lessons);
    const lesson = lessons.find((l) => l.id === lessonId);

    if (lesson && lesson.questions) {
      const shuffledQuestions = lesson.questions.map((q) => {
        // Proper Fisher-Yates shuffle of the unified answers array
        const allAnswers = [...q.answers];
        for (let i = allAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
        }
        return { ...q, allAnswers };
      });
      setQuizQuestions(shuffledQuestions);
    } else {
      console.error('Lesson or questions not found');
    }
  }, [course, lessonId]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0;

  const handleAnswerSelect = (answerId) => {
    if (isAnswered) return;
    setSelectedAnswerId(answerId);
    setIsAnswered(true);

    const answer = currentQuestion.allAnswers.find(a => a.id === answerId);
    if (answer?.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerId(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      // Save the score when the quiz ends
      const percentage = Math.round((score / quizQuestions.length) * 100);
      updateQuizScore(lessonId, percentage);
    }
  };



  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (!currentQuestion) return null;

  const percentage = Math.round((score / quizQuestions.length) * 100);

  return (
    <Box className="quiz-page">
      <header className="quiz-header glass-panel">
        <Container maxWidth="lg" className="quiz-header-content">
          <div className="quiz-header-left">
            <IconButton onClick={() => navigate(-1)} className="quiz-back-btn">
              <ArrowBackIcon />
            </IconButton>
            <div>
              <Typography variant="h6" className="quiz-lesson-title">
                {course?.sections.flatMap(s => s.lessons).find(l => l.id === lessonId)?.title || 'Quiz'}
              </Typography>
              <Typography variant="caption" className="quiz-progress-text">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </Typography>
            </div>
          </div>

          <div className="quiz-header-right">
             <div className="quiz-score-badge">
               <TrophyIcon fontSize="small" />
               <Typography variant="body2">{score} Points</Typography>
             </div>
          </div>
        </Container>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          className="quiz-progress-bar"
        />
      </header>

      <Container maxWidth="md" className="quiz-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper className="quiz-question-container glass-panel" elevation={0}>
              <Typography variant="h5" className="quiz-question-prompt">
                {currentQuestion.prompt}
              </Typography>

              <div className="quiz-answers-grid">
                {currentQuestion.allAnswers.map((answer) => {
                  const isSelected = selectedAnswerId === answer.id;
                  const isCorrect = answer.isCorrect;
                  
                  let stateClass = '';
                  if (isAnswered) {
                    if (isCorrect) stateClass = 'is-correct';
                    else if (isSelected && !isCorrect) stateClass = 'is-incorrect';
                  } else if (isSelected) {
                    stateClass = 'is-selected';
                  }

                  return (
                    <Button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
                      className={`quiz-answer-btn ${stateClass}`}
                      disabled={isAnswered && !isSelected && !isCorrect}
                    >
                      <span className="quiz-answer-text">{answer.text}</span>
                      {isAnswered && isCorrect && <CheckCircleIcon className="quiz-feedback-icon" />}
                      {isAnswered && isSelected && !isCorrect && <CancelIcon className="quiz-feedback-icon" />}
                    </Button>
                  );
                })}
              </div>
            </Paper>
          </motion.div>
        </AnimatePresence>

        <div className="quiz-actions">
          {isAnswered && (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              className="quiz-next-btn"
              component={motion.button}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Button>
          )}
        </div>
      </Container>

      <Modal
        open={showResult}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showResult}>
          <Box className="quiz-result-modal">
            <Paper className="quiz-result-card glass-panel-strong" elevation={0}>
              <div className="quiz-result-header">
                <div className="quiz-result-icon-ring">
                  <TrophyIcon className="quiz-result-icon" />
                </div>
                <Typography variant="h3" className="quiz-result-title">
                  Quiz Completed!
                </Typography>
                <Typography variant="body1" className="quiz-result-subtitle">
                  {percentage >= 90 ? "Outstanding performance! You've mastered this lesson." : 
                   percentage >= 70 ? "Great job! You've passed this lesson." :
                   "Score at least 70% to pass this lesson. Keep practicing!"}
                </Typography>

              </div>

              <div className="quiz-result-stats">
                <div className="quiz-result-stat-item">
                  <Typography variant="h2">{percentage}%</Typography>
                  <Typography variant="caption">Final Score</Typography>
                </div>
                <div className="quiz-result-stat-divider" />
                <div className="quiz-result-stat-item">
                  <Typography variant="h2">{score}/{quizQuestions.length}</Typography>
                  <Typography variant="caption">Correct Answers</Typography>
                </div>
              </div>

              <div className="quiz-result-actions">
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={handleRestart}
                  className="quiz-result-btn"
                >
                  Try Again
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => navigate(`/learning-path/${course.id}`, { 
                    state: { 
                      course: location.state?.course || course,
                      quizResult: { lessonId, score, percentage }
                    } 
                  })}

                  className="quiz-result-btn primary"
                >
                  Continue Journey
                </Button>
              </div>
            </Paper>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default QuizPage;
