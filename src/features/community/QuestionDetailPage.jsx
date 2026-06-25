import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  Divider,
  Avatar,
  Stack,
  TextField,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowUpward as UpvoteIcon,
  ChatBubbleOutline as ReplyIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import './Community.css';

const QuestionDetailPage = () => {
  const { communityId, roomId, questionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [comments, setComments] = useState([]);
  
  // Comment composers
  const [newCommentText, setNewCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null); // id of comment we are replying to
  const [replyText, setReplyText] = useState('');

  const loadQuestionAndComments = async () => {
    const qData = await socialStore.getQuestionById(questionId);
    if (qData) {
      setQuestion(qData);
    }
    const cData = await socialStore.getComments(questionId);
    setComments(cData || []);
  };

  useEffect(() => {
    if (questionId) {
      loadQuestionAndComments();
    }
  }, [questionId]);

  const handlePostUpvote = async () => {
    if (!question) return;
    await socialStore.upvoteQuestion(questionId, user.id);
    loadQuestionAndComments();
  };

  const handleCommentUpvote = async (commentId) => {
    await socialStore.upvoteComment(questionId, commentId, user.id);
    loadQuestionAndComments();
  };

  const handlePostCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    await socialStore.addComment(questionId, newCommentText, user);
    setNewCommentText('');
    loadQuestionAndComments();
  };

  const handlePostReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    await socialStore.addReply(questionId, commentId, replyText, user);
    setReplyText('');
    setActiveReplyId(null);
    loadQuestionAndComments();
  };

  // Helper to parse content text and render code blocks
  const renderQuestionBody = (content) => {
    if (!content) return null;
    const parts = content.split(/(```[a-z]*\n[\s\S]*?\n```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        // slice off the beginning ```java and the ending ```
        const code = lines.slice(1, -1).join('\n');
        return (
          <pre key={i} className="post-code-block">
            <code>{code}</code>
          </pre>
        );
      }
      return (
        <Typography key={i} variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 1, color: 'var(--text-primary)' }}>
          {part}
        </Typography>
      );
    });
  };

  if (!question) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading Post Details...</Typography>
      </Box>
    );
  }

  const isPostUpvoted = question.upvotedUsers?.includes(Number(user.id));

  return (
    <Box className="question-detail-container">
      
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/communities/${communityId}/room/${roomId}`)}
        sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'var(--text-secondary)' }}
      >
        Back to #{roomId}
      </Button>

      {/* QUESTION DETAIL HEADER */}
      <Card className="question-detail-card">
        <Box className="question-detail-header-block">
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              {question.authorName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {question.authorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posted on {new Date(question.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
            {question.title}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              size="small"
              variant={isPostUpvoted ? "contained" : "outlined"}
              color={isPostUpvoted ? "success" : "inherit"}
              onClick={handlePostUpvote}
              startIcon={<UpvoteIcon />}
              sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
            >
              {question.upvotes || 0} Upvotes
            </Button>
          </Stack>
        </Box>

        {/* Content body */}
        <Box className="question-detail-content">
          {renderQuestionBody(question.content)}
        </Box>
      </Card>

      {/* COMMENTS LIST & COMPOSER */}
      <Paper className="comments-section-container">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Discussion ({question.commentsCount || 0})
        </Typography>

        {/* Write Top-level Comment */}
        <Box component="form" onSubmit={handlePostCommentSubmit} className="comment-input-wrapper">
          <TextField
            placeholder="What are your thoughts on this?"
            multiline
            rows={2}
            fullWidth
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            InputProps={{
              sx: { borderRadius: 3 }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!newCommentText.trim()}
            sx={{ alignSelf: 'flex-end', textTransform: 'none', borderRadius: 2 }}
          >
            Comment
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Comments Feed */}
        <Box className="comments-list">
          {comments.map((comment) => {
            const hasCommentUpvoted = comment.upvotedUsers?.includes(Number(user.id));
            
            return (
              <Box key={comment.id} className="comment-node animate-fade-in">
                
                {/* Comment author info */}
                <Box className="comment-header">
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                    {comment.authorName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography className="comment-author-name">
                    {comment.authorName}
                  </Typography>
                  <Typography className="comment-time">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Comment content */}
                <Typography className="comment-content">
                  {comment.content}
                </Typography>

                {/* Comment Actions */}
                <Box className="comment-actions">
                  <Button
                    size="small"
                    color={hasCommentUpvoted ? "success" : "inherit"}
                    onClick={() => handleCommentUpvote(comment.id)}
                    startIcon={<UpvoteIcon sx={{ fontSize: 14 }} />}
                    sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    {comment.upvotes || 0}
                  </Button>
                  
                  <Button
                    size="small"
                    startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      if (activeReplyId === comment.id) {
                        setActiveReplyId(null);
                      } else {
                        setActiveReplyId(comment.id);
                        setReplyText('');
                      }
                    }}
                    sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                  >
                    Reply
                  </Button>
                </Box>

                {/* Reply Composer Form */}
                {activeReplyId === comment.id && (
                  <Box 
                    component="form" 
                    onSubmit={(e) => handlePostReplySubmit(e, comment.id)}
                    className="reply-input-box animate-fade-in"
                  >
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        InputProps={{ sx: { borderRadius: 3 } }}
                      />
                      <Button 
                        type="submit" 
                        variant="contained" 
                        size="small"
                        disabled={!replyText.trim()}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Reply
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Nested Replies List */}
                {comment.replies && comment.replies.length > 0 && (
                  <Box className="comment-replies-list">
                    {comment.replies.map((reply) => (
                      <Box key={reply.id} className="reply-node animate-fade-in">
                        <Box className="comment-header">
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                            {reply.authorName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography className="comment-author-name" sx={{ fontSize: '0.85rem !important' }}>
                            {reply.authorName}
                          </Typography>
                          <Typography className="comment-time">
                            {new Date(reply.timestamp).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                          {reply.content}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default QuestionDetailPage;
