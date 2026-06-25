import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Card,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Tab,
  Tabs,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  ArrowUpward as UpvoteIcon,
  Comment as CommentIcon,
  Search as SearchIcon,
  Subject as SubjectIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import './Community.css';

const CommunityDetailPage = () => {
  const { communityId, roomId: paramRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Filtering & Sorting
  const [sortBy, setSortBy] = useState('new'); // 'new' or 'hot'
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs & Creators
  const [openCreateRoom, setOpenCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');

  const [openAskQuestion, setOpenAskQuestion] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCode, setPostCode] = useState('');

  // 1. Load community details
  const loadCommunity = async () => {
    const data = await socialStore.getCommunityById(communityId);
    if (data) {
      setCommunity(data);
      // If a roomId is in params, use it; otherwise default to first room
      if (paramRoomId) {
        setActiveRoomId(Number(paramRoomId));
      } else if (data.rooms && data.rooms.length > 0) {
        setActiveRoomId(data.rooms[0].id);
      }
    }
  };

  useEffect(() => {
    if (communityId) {
      loadCommunity();
    }
  }, [communityId, paramRoomId]);

  // 2. Load questions/posts when active room or sort changes
  const loadQuestions = async () => {
    if (activeRoomId) {
      const feed = await socialStore.getQuestions(activeRoomId, sortBy);
      setQuestions(feed);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [activeRoomId, sortBy]);

  // Filtered questions based on search query
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [questions, searchQuery]);

  const handleRoomSelect = (roomId) => {
    setActiveRoomId(roomId);
    setSearchQuery('');
    navigate(`/communities/${communityId}/room/${roomId}`);
  };

  const handleCreateRoomSubmit = async () => {
    if (!roomName.trim() || !community) return;
    const newRoom = await socialStore.createRoom(communityId, roomName, roomDesc);
    if (newRoom) {
      setRoomName('');
      setRoomDesc('');
      setOpenCreateRoom(false);
      
      // Reload community and switch to the new room
      await loadCommunity();
      handleRoomSelect(newRoom.id);
    }
  };

  const handleAskQuestionSubmit = async () => {
    if (!postTitle.trim() || !postContent.trim() || !activeRoomId) return;
    
    // Combine content and code block if any
    let fullContent = postContent;
    if (postCode.trim()) {
      fullContent += `\n\n\`\`\`java\n${postCode}\n\`\`\``;
    }

    await socialStore.createQuestion(activeRoomId, postTitle, fullContent, user);
    
    setPostTitle('');
    setPostContent('');
    setPostCode('');
    setOpenAskQuestion(false);
    loadQuestions();
  };

  const handleUpvote = async (e, questionId) => {
    e.stopPropagation(); // Avoid navigating to details
    await socialStore.upvoteQuestion(questionId, user.id);
    loadQuestions();
  };

  if (!community) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">Loading Community Details...</Typography>
      </Box>
    );
  }

  const activeRoom = community.rooms?.find(r => r.id === activeRoomId) || {};

  return (
    <Box className="community-detail-container">
      
      {/* LEFT SIDEBAR: Rooms & Details */}
      <Box className="community-sidebar">
        
        {/* Banner with Community Info */}
        <Box 
          className="community-sidebar-header" 
          sx={{ background: community.bannerColor }}
        >
          <IconButton 
            onClick={() => navigate('/communities')}
            sx={{ color: 'white', alignSelf: 'flex-start', mb: 1, p: 0.5, bgcolor: 'rgba(0,0,0,0.15)' }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h3" sx={{ fontSize: '1.8rem', p: 0 }} className="community-sidebar-title">
              {community.icon} {community.name}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8rem', lineHeight: 1.4 }}>
            {community.description}
          </Typography>
        </Box>

        <Divider />

        {/* Rooms Listing header */}
        <Box sx={{ px: 2.5, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Rooms / Channels
          </Typography>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => setOpenCreateRoom(true)}
            sx={{ border: '1.5px solid var(--divider)', borderRadius: 2 }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable list of Rooms */}
        <List className="community-rooms-list">
          {community.rooms?.map((room) => (
            <ListItemButton
              key={room.id}
              selected={room.id === activeRoomId}
              onClick={() => handleRoomSelect(room.id)}
              className={`community-room-item ${room.id === activeRoomId ? 'is-active' : ''}`}
            >
              <ListItemText 
                primary={`# ${room.name}`} 
                secondary={room.description}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ 
                  variant: 'caption', 
                  sx: { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' } 
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* RIGHT SIDEBAR: Questions Feed */}
      <Box className="community-feed">
        
        {/* Room Header Controls */}
        <Box className="community-feed-header">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              # {activeRoom.name || "room"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeRoom.description || "Discuss concepts in this channel."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {/* Search Posts */}
            <TextField
              placeholder="Search posts..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, bgcolor: 'background.paper', width: 180 }
              }}
            />

            {/* Sorting Tab */}
            <Tabs 
              value={sortBy === 'new' ? 0 : 1}
              onChange={(e, val) => setSortBy(val === 0 ? 'new' : 'hot')}
              sx={{ minHeight: 36, height: 36 }}
            >
              <Tab label="New" sx={{ minHeight: 36, py: 0, textTransform: 'none' }} />
              <Tab label="Popular" sx={{ minHeight: 36, py: 0, textTransform: 'none' }} />
            </Tabs>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenAskQuestion(true)}
              sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
            >
              Ask Post
            </Button>
          </Stack>
        </Box>

        {/* Post cards feed */}
        <Box className="community-feed-posts">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q) => {
              const hasUpvoted = q.upvotedUsers?.includes(Number(user.id));
              
              return (
                <Card 
                  key={q.id} 
                  className="post-card"
                  onClick={() => navigate(`/communities/${communityId}/room/${activeRoomId}/question/${q.id}`)}
                >
                  {/* Upvote side column */}
                  <Box className="post-votes-sidebar">
                    <IconButton 
                      size="small"
                      onClick={(e) => handleUpvote(e, q.id)}
                      className={`vote-button ${hasUpvoted ? 'upvoted' : ''}`}
                    >
                      <UpvoteIcon fontSize="small" />
                    </IconButton>
                    <Typography className="vote-count">
                      {q.upvotes || 0}
                    </Typography>
                  </Box>

                  {/* Body Content */}
                  <Box className="post-card-body">
                    <Box className="post-meta">
                      <Avatar sx={{ width: 18, height: 18, fontSize: '0.65rem' }}>
                        {q.authorName.charAt(0).toUpperCase()}
                      </Avatar>
                      <span className="post-author">{q.authorName}</span>
                      <span>•</span>
                      <span>{new Date(q.timestamp).toLocaleDateString()}</span>
                    </Box>

                    <Typography variant="h6" className="post-title">
                      {q.title}
                    </Typography>

                    <Typography variant="body2" className="post-excerpt">
                      {q.content.replace(/```[\s\S]*?```/g, "[Code Block]")}
                    </Typography>

                    <Box className="post-footer-actions">
                      <Box className="post-footer-action-item">
                        <CommentIcon sx={{ fontSize: 16 }} />
                        <span>{q.commentsCount || 0} comments</span>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              );
            })
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, opacity: 0.6 }}>
              <SubjectIcon sx={{ fontSize: 64, mb: 1 }} />
              <Typography variant="h6">No posts found</Typography>
              <Typography variant="body2">Be the first to start a conversation in this room!</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* CREATE ROOM DIALOG */}
      <Dialog
        open={openCreateRoom}
        onClose={() => setOpenCreateRoom(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Room</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Room Name"
            placeholder="e.g. java-exceptions"
            fullWidth
            size="small"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <TextField
            label="Description"
            placeholder="Describe the discussion scope of this room"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={roomDesc}
            onChange={(e) => setRoomDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreateRoom(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoomSubmit} 
            variant="contained" 
            disabled={!roomName.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ASK QUESTION (CREATE POST) DIALOG */}
      <Dialog
        open={openAskQuestion}
        onClose={() => setOpenAskQuestion(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Post a Question</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            placeholder="What is your question? Be specific."
            fullWidth
            size="small"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            required
          />
          <TextField
            label="Question Description"
            placeholder="Provide context, details of what you tried, and explanations."
            fullWidth
            multiline
            rows={4}
            size="small"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            required
          />
          
          <TextField
            label="Code Snippet (Optional)"
            placeholder="Paste code snippets here..."
            fullWidth
            multiline
            rows={3}
            size="small"
            value={postCode}
            onChange={(e) => setPostCode(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <CodeIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { fontFamily: 'monospace' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAskQuestion(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAskQuestionSubmit} 
            variant="contained" 
            disabled={!postTitle.trim() || !postContent.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Post Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityDetailPage;
