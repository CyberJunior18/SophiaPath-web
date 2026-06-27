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
  InputAdornment,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  ArrowUpward as UpvoteIcon,
  ArrowDownward as DownvoteIcon,
  Comment as CommentIcon,
  Search as SearchIcon,
  Subject as SubjectIcon,
  Code as CodeIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import './Community.css';

const formatMemberCount = (count) => {
  if (!count) return '0';
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
};

const CommunityDetailPage = () => {
  const { communityId, roomId: paramRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Filtering & Sorting
  const [sortBy, setSortBy] = useState('hot'); // 'new' or 'hot'
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [communityMenuAnchor, setCommunityMenuAnchor] = useState(null);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [maxMembers, setMaxMembers] = useState(100);
  const [openEditCommunity, setOpenEditCommunity] = useState(false);
  const [editCommunityName, setEditCommunityName] = useState('');
  const [editCommunityDesc, setEditCommunityDesc] = useState('');

  // Dialogs & Creators
  const [openCreateRoom, setOpenCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');

  const [openAskQuestion, setOpenAskQuestion] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCode, setPostCode] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postLink, setPostLink] = useState('');
  const [postLinkLabel, setPostLinkLabel] = useState('');

  // Visibility states for optional attachment fields
  const [showCodeField, setShowCodeField] = useState(false);
  const [showImageField, setShowImageField] = useState(false);
  const [showLinkField, setShowLinkField] = useState(false);

  // Attachment dropdown anchor state
  const [anchorEl, setAnchorEl] = useState(null);

  const handleAddClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAddClose = () => {
    setAnchorEl(null);
  };

  const handleOptionSelect = (option) => {
    if (option === 'code') setShowCodeField(true);
    if (option === 'image') setShowImageField(true);
    if (option === 'link') setShowLinkField(true);
    handleAddClose();
  };

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
    const qTerm = searchQuery.toLowerCase().trim();
    if (!qTerm) return questions;
    return questions.filter(q => {
      const titleWords = (q.title || '').toLowerCase().split(/\s+/);
      const contentWords = (q.content || '').toLowerCase().split(/\s+/);
      return titleWords.some(w => w.startsWith(qTerm)) || contentWords.some(w => w.startsWith(qTerm));
    });
  }, [questions, searchQuery]);

  const displayedQuestions = useMemo(() => {
    return filteredQuestions.slice(0, visibleCount);
  }, [filteredQuestions, visibleCount]);

  const sortedMembers = useMemo(() => {
    if (!community?.members) return [];
    
    // Filter members by search query
    const filtered = community.members.filter(m => {
      const q = memberSearchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = (m.fullname || m.username || '').toLowerCase();
      const nameWords = name.split(/\s+/);
      return nameWords.some(w => w.startsWith(q));
    });

    // Sort: Owner -> Moderators -> Members
    return [...filtered].sort((a, b) => {
      const isAOwner = Number(community.ownerId) === Number(a.id);
      const isBOwner = Number(community.ownerId) === Number(b.id);
      if (isAOwner && !isBOwner) return -1;
      if (!isAOwner && isBOwner) return 1;

      const isAMod = community.moderatorIds?.includes(String(a.id));
      const isBMod = community.moderatorIds?.includes(String(b.id));
      if (isAMod && !isBMod) return -1;
      if (!isAMod && isBMod) return 1;

      return 0;
    });
  }, [community?.members, community?.ownerId, community?.moderatorIds, memberSearchQuery]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeRoomId, sortBy, searchQuery]);

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

  const handlePostImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAskQuestionSubmit = async () => {
    if (!postTitle.trim() || !postContent.trim() || !activeRoomId) return;
    
    // Combine content and optional code/image/link attachments
    let fullContent = postContent;
    if (showCodeField && postCode.trim()) {
      fullContent += `\n\n\`\`\`java\n${postCode}\n\`\`\``;
    }
    if (showImageField && postImage) {
      fullContent += `\n\n![Image Attachment](${postImage})`;
    }
    if (showLinkField && postLink.trim()) {
      const label = postLinkLabel.trim() || 'Link';
      fullContent += `\n\n[${label}](${postLink.trim()})`;
    }

    await socialStore.createQuestion(activeRoomId, postTitle, fullContent, user);
    
    // Reset all fields
    setPostTitle('');
    setPostContent('');
    setPostCode('');
    setPostImage('');
    setPostLink('');
    setPostLinkLabel('');
    setShowCodeField(false);
    setShowImageField(false);
    setShowLinkField(false);
    setOpenAskQuestion(false);
    loadQuestions();
  };

  const handleDeleteCommunityClick = async () => {
    if (window.confirm("Are you sure you want to delete this community? This action is permanent and will delete all rooms, posts, comments, and replies.")) {
      const success = await socialStore.deleteCommunity(community.id);
      if (success) {
        navigate('/communities');
      }
    }
  };

  const handleUpvote = async (e, questionId) => {
    e.stopPropagation(); // Avoid navigating to details
    const updated = await socialStore.upvoteQuestion(questionId, user.id);
    if (updated) {
      setQuestions(prev => prev.map(q => q.id === questionId ? { 
        ...q, 
        ...updated, 
        userUpvoted: updated.upvotedUsers?.includes(Number(user.id)), 
        userDownvoted: updated.downvotedUsers?.includes(Number(user.id)) 
      } : q));
    }
  };

  const handleDownvote = async (e, questionId) => {
    e.stopPropagation(); // Avoid navigating to details
    const updated = await socialStore.downvoteQuestion(questionId, user.id);
    if (updated) {
      setQuestions(prev => prev.map(q => q.id === questionId ? { 
        ...q, 
        ...updated, 
        userUpvoted: updated.upvotedUsers?.includes(Number(user.id)), 
        userDownvoted: updated.downvotedUsers?.includes(Number(user.id)) 
      } : q));
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">Loading User Profile...</Typography>
      </Box>
    );
  }

  if (!community) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">Loading Community Details...</Typography>
      </Box>
    );
  }

  const activeRoom = community.rooms?.find(r => r.id === activeRoomId) || {};
  const isOwner = Number(community.ownerId) === Number(user?.id);
  const isMod = community.moderatorIds?.includes(String(user?.id)) || isOwner;

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

          <IconButton
            onClick={(e) => setCommunityMenuAnchor(e.currentTarget)}
            sx={{ 
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'white', 
              bgcolor: 'rgba(255,255,255,0.15)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              borderRadius: 1.5,
              p: 0.5
            }}
            size="small"
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
          
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="h3" sx={{ fontSize: '1.8rem', p: 0 }} className="community-sidebar-title">
              {community.icon} {community.name}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpenMembersDialog(true)}
              startIcon={<PeopleIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.72rem',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.1)',
                px: 1.25,
                py: 0.25,
                minWidth: 0,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              {formatMemberCount(community.members?.length || 0)}
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8rem', lineHeight: 1.4, mt: 1 }}>
            {community.description}
          </Typography>
        </Box>

        <Divider />

        {/* Rooms Listing header */}
        <Box sx={{ px: 2.5, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Rooms / Channels
          </Typography>
          {isMod && (
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => setOpenCreateRoom(true)}
              sx={{ border: '1.5px solid var(--divider)', borderRadius: 2 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
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
              disabled={!community.isJoined}
              sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
            >
              Ask Post
            </Button>
          </Stack>
        </Box>

        {/* Post cards feed */}
        <Box className="community-feed-posts">
          {displayedQuestions.length > 0 ? (
            displayedQuestions.map((q) => {
              const hasUpvoted = q.userUpvoted;
              const hasDownvoted = q.userDownvoted;
              
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
                      sx={{ color: hasUpvoted ? '#10b981' : 'var(--text-disabled)' }}
                    >
                      <UpvoteIcon fontSize="small" />
                    </IconButton>
                    <Typography className="vote-count">
                      {q.upvotes || 0}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleDownvote(e, q.id)}
                      className={`vote-button ${hasDownvoted ? 'downvoted' : ''}`}
                      sx={{ color: hasDownvoted ? '#ef4444' : 'var(--text-disabled)' }}
                    >
                      <DownvoteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Body Content */}
                  <Box className="post-card-body">
                    <Box className="post-meta">
                      <Avatar sx={{ width: 18, height: 18, fontSize: '0.65rem' }}>
                        {q.authorName?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <span className="post-author">{q.authorName}</span>
                      {(() => {
                        const isQOwner = Number(community.ownerId) === Number(q.authorId);
                        const isQMod = community.moderatorIds?.includes(String(q.authorId));
                        if (isQOwner) {
                          return (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>
                              Owner
                            </span>
                          );
                        } else if (isQMod) {
                          return (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3D5CFF', backgroundColor: 'rgba(61, 92, 255, 0.12)', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>
                              Moderator
                            </span>
                          );
                        }
                        return (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>
                            Member
                          </span>
                        );
                      })()}
                      <span>•</span>
                      <span>{new Date(q.timestamp).toLocaleDateString()}</span>
                      {!q.approved && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>
                          Pending Approval
                        </span>
                      )}
                    </Box>

                    <Typography variant="h6" className="post-title">
                      {q.title}
                    </Typography>

                    <Typography variant="body2" className="post-excerpt">
                      {q.content
                        .replace(/```[\s\S]*?```/g, "[Code Block]")
                        .replace(/!\[[^\]]*\]\([^)]*\)/g, "[Image]")
                        .replace(/\[[^\]]*\]\([^)]*\)/g, "[Link]")
                      }
                    </Typography>

                    <Box className="post-footer-actions" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box className="post-footer-action-item">
                        <CommentIcon sx={{ fontSize: 16 }} />
                        <span>{q.commentsCount || 0} comments</span>
                      </Box>
                      {isMod && !q.approved && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await socialStore.approveQuestion(q.id);
                            loadQuestions();
                          }}
                          sx={{ borderRadius: 2, textTransform: 'none', py: 0.25, fontSize: '0.72rem', fontWeight: 700 }}
                        >
                          Approve Post
                        </Button>
                      )}
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

          {filteredQuestions.length > visibleCount && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
              <Button 
                variant="outlined" 
                onClick={() => setVisibleCount(prev => prev + 10)}
                sx={{ textTransform: 'none', borderRadius: 3 }}
              >
                View More
              </Button>
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
        PaperProps={{ 
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6 
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenCreateRoom(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Create New Room
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Room Name"
            placeholder="e.g. java-exceptions"
            fullWidth
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Description"
            placeholder="Describe the discussion scope of this room"
            fullWidth
            multiline
            rows={2}
            value={roomDesc}
            onChange={(e) => setRoomDesc(e.target.value)}
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 200 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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
        PaperProps={{ 
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenAskQuestion(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Post a Question
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            placeholder="What is your question? Be specific."
            fullWidth
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            required
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 150 }}
          />
          <TextField
            label="Question Description"
            placeholder="Provide context, details of what you tried, and explanations."
            fullWidth
            multiline
            rows={4}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            required
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 2000 }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <IconButton
              color="primary"
              onClick={handleAddClick}
              sx={{ border: '1.5px solid var(--divider)', borderRadius: 1.5, width: 40, height: 40 }}
            >
              <AddIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleAddClose}
            >
              <MenuItem onClick={() => handleOptionSelect('code')}>Code Snippet</MenuItem>
              <MenuItem onClick={() => handleOptionSelect('image')}>Image</MenuItem>
              <MenuItem onClick={() => handleOptionSelect('link')}>External Link</MenuItem>
            </Menu>
          </Box>

          {showCodeField && (
            <Box sx={{ position: 'relative', mt: 1 }}>
              <TextField
                label="Code Snippet"
                placeholder="Paste code snippets here..."
                fullWidth
                multiline
                rows={3}
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
                InputProps={{
                  sx: { fontFamily: 'monospace', pr: 4, borderRadius: 1.5 }
                }}
                inputProps={{ maxLength: 1000 }}
              />
              <IconButton 
                size="small" 
                onClick={() => { setShowCodeField(false); setPostCode(''); }}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                ✕
              </IconButton>
            </Box>
          )}

          {showImageField && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, border: '1px dashed var(--divider)', p: 1.5, borderRadius: 1.5, position: 'relative' }}>
              <IconButton 
                size="small" 
                onClick={() => { setShowImageField(false); setPostImage(''); }}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                ✕
              </IconButton>
              
              <input
                type="file"
                accept="image/*"
                id="post-image-file-input"
                style={{ display: 'none' }}
                onChange={handlePostImageUpload}
              />
              
              {!postImage ? (
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor="post-image-file-input"
                  startIcon={<CameraIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2, mt: 1 }}
                >
                  Upload Image
                </Button>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <img 
                    src={postImage} 
                    alt="upload preview" 
                    style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--divider)' }} 
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Image Selected</Typography>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => setPostImage('')}
                      sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '0.75rem' }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {showLinkField && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--divider)', p: 2, borderRadius: 1.5, position: 'relative', mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>External Link</Typography>
              <TextField
                label="Link URL"
                placeholder="https://example.com"
                fullWidth
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                InputProps={{ sx: { borderRadius: 1.5 } }}
                inputProps={{ maxLength: 500 }}
              />
              <TextField
                label="Link Label (Optional)"
                placeholder="e.g. Documentation"
                fullWidth
                value={postLinkLabel}
                onChange={(e) => setPostLinkLabel(e.target.value)}
                InputProps={{ sx: { borderRadius: 1.5 } }}
                inputProps={{ maxLength: 100 }}
              />
              <IconButton 
                size="small" 
                onClick={() => { setShowLinkField(false); setPostLink(''); setPostLinkLabel(''); }}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                ✕
              </IconButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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

      {/* MEMBERS LIST DIALOG */}
      <Dialog
        open={openMembersDialog}
        onClose={() => setOpenMembersDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenMembersDialog(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Community Members
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            placeholder="Search members..."
            size="small"
            variant="outlined"
            value={memberSearchQuery}
            onChange={(e) => setMemberSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 1.5, height: 36, fontSize: '0.82rem', bgcolor: 'action.hover' }
            }}
            fullWidth
          />
          <List sx={{ maxHeight: 400, overflowY: 'auto', p: 0 }}>
            {sortedMembers.map((m) => {
              const isMOwner = Number(community.ownerId) === Number(m.id);
              const isMMod = community.moderatorIds?.includes(String(m.id));
              let roleTag = 'Member';
              let roleColor = 'var(--text-secondary)';
              let roleBg = 'rgba(0,0,0,0.05)';
              
              if (isMOwner) {
                roleTag = 'Owner';
                roleColor = '#F59E0B';
                roleBg = 'rgba(245, 158, 11, 0.15)';
              } else if (isMMod) {
                roleTag = 'Moderator';
                roleColor = '#3D5CFF';
                roleBg = 'rgba(61, 92, 255, 0.15)';
              }

              return (
                <Box 
                  key={m.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    py: 1, 
                    px: 1, 
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', mr: 1.5 }}>
                    {m.fullname?.charAt(0).toUpperCase() || m.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
                        {m.fullname || m.username}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', color: roleColor, backgroundColor: roleBg }}>
                          {roleTag}
                        </span>
                        {isOwner && !isMOwner && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberMenuAnchor(e.currentTarget);
                              setSelectedMember(m);
                            }}
                            sx={{ color: 'text.secondary', p: 0.5 }}
                          >
                            <MoreVertIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>

      {/* COMMUNITY MENU */}
      <Menu
        anchorEl={communityMenuAnchor}
        open={Boolean(communityMenuAnchor)}
        onClose={() => setCommunityMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{ sx: { borderRadius: 1, minWidth: 160 } }}
      >
        {isOwner && (
          <MenuItem onClick={() => {
            setCommunityMenuAnchor(null);
            setEditCommunityName(community.name);
            setEditCommunityDesc(community.description);
            setOpenEditCommunity(true);
          }}>
            Edit Community
          </MenuItem>
        )}
        {isOwner && (
          <MenuItem onClick={() => {
            setCommunityMenuAnchor(null);
            setOpenSettings(true);
          }}>
            Settings
          </MenuItem>
        )}
        {isOwner && (
          <MenuItem onClick={() => {
            setCommunityMenuAnchor(null);
            handleDeleteCommunityClick();
          }} sx={{ color: 'error.main' }}>
            Delete Community
          </MenuItem>
        )}
        {!isOwner && (
          <MenuItem onClick={async () => {
            setCommunityMenuAnchor(null);
            await socialStore.toggleJoinCommunity(community.id);
            loadCommunity();
          }}>
            {community.isJoined ? "Leave Community" : "Join Community"}
          </MenuItem>
        )}
      </Menu>

      {/* MEMBER ACTION MENU */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={() => {
          setMemberMenuAnchor(null);
          setSelectedMember(null);
        }}
        PaperProps={{ sx: { borderRadius: 1, minWidth: 160 } }}
      >
        {selectedMember && (
          <MenuItem onClick={async () => {
            setMemberMenuAnchor(null);
            const isMMod = community.moderatorIds?.includes(String(selectedMember.id));
            if (isMMod) {
              await socialStore.removeModerator(community.id, selectedMember.id);
            } else {
              await socialStore.addModerator(community.id, selectedMember.id);
            }
            setSelectedMember(null);
            loadCommunity();
          }}>
            {selectedMember && community.moderatorIds?.includes(String(selectedMember.id)) ? 'Demote to Member' : 'Promote to Moderator'}
          </MenuItem>
        )}
      </Menu>

      {/* COMMUNITY SETTINGS DIALOG */}
      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenSettings(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Community Settings
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Configure settings for {community.name}.
          </Typography>
          <TextField
            label="Maximum Members Limit"
            type="number"
            fullWidth
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            InputProps={{ sx: { borderRadius: 1.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenSettings(false)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT COMMUNITY DIALOG */}
      <Dialog
        open={openEditCommunity}
        onClose={() => setOpenEditCommunity(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenEditCommunity(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Edit Community Info
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Community Name"
            fullWidth
            value={editCommunityName}
            onChange={(e) => setEditCommunityName(e.target.value)}
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editCommunityDesc}
            onChange={(e) => setEditCommunityDesc(e.target.value)}
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 300 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={async () => {
              await socialStore.updateCommunity(community.id, editCommunityName, editCommunityDesc, community.icon);
              setOpenEditCommunity(false);
              loadCommunity();
            }}
            sx={{ textTransform: 'none', borderRadius: 2 }}
            disabled={!editCommunityName.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityDetailPage;
