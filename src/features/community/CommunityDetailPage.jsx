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
  Checkbox,
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  ListItem,
  Snackbar
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
  PhotoCamera as CameraIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import { COMMUNITY_CATEGORIES, CATEGORY_STYLES } from './CommunityListPage';
import './Community.css';
const formatMemberCount = (count) => {
  if (!count) return '0';
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
};

const encodeCommunityId = (id) => {
  const salted = (Number(id) * 31415926535) + 27182818284;
  const mainPart = salted.toString(36);
  let hash1 = 0;
  let hash2 = 0;
  const str = String(id) + "SophiaSecretSaltSuperLong123!";
  for (let i = 0; i < str.length; i++) {
    hash1 = (hash1 << 5) - hash1 + str.charCodeAt(i);
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + str.charCodeAt(i) * 17;
    hash2 |= 0;
  }
  const checksumPart1 = Math.abs(hash1).toString(36);
  const checksumPart2 = Math.abs(hash2).toString(36);
  return `${mainPart}-${checksumPart1}-${checksumPart2}`;
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
  const [showRoomSearch, setShowRoomSearch] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Custom Alert Modal state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showCustomAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  // Toast Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const showToast = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarOpen(true);
  };

  // Custom Confirmation Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState(null);

  const showConfirmDialog = (title, message, callback) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => callback);
    setConfirmOpen(true);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [hidePending, setHidePending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [communityMenuAnchor, setCommunityMenuAnchor] = useState(null);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [profileMember, setProfileMember] = useState(null);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');
  const [openSettings, setOpenSettings] = useState(false);
  const [maxMembers, setMaxMembers] = useState(1000);
  const [openEditCommunity, setOpenEditCommunity] = useState(false);
  const [editCommunityName, setEditCommunityName] = useState('');
  const [editCommunityDesc, setEditCommunityDesc] = useState('');
  const [communityPrivate, setCommunityPrivate] = useState(false);
  const [communityNSFW, setCommunityNSFW] = useState(false);
  const [communityRules, setCommunityRules] = useState([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [communityCategory, setCommunityCategory] = useState('Software Engineering');
  const [communityNsfwAgeLimit, setCommunityNsfwAgeLimit] = useState(18);

  // Dialogs & Creators
  const [openCreateRoom, setOpenCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');

  const [openAskQuestion, setOpenAskQuestion] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCode, setPostCode] = useState('');
  const [postLanguage, setPostLanguage] = useState('javascript');
  const [postImages, setPostImages] = useState([]);
  const [postLinks, setPostLinks] = useState([{ url: '', label: '' }]);

  // Poll states inside post creator
  const [showPollField, setShowPollField] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // NSFW age check states
  const [ageWarningOpen, setAgeWarningOpen] = useState(false);
  const [consentedNSFW, setConsentedNSFW] = useState(false);

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
    if (option === 'poll') setShowPollField(true);
    handleAddClose();
  };

  const loadCommunity = async () => {
    const data = await socialStore.getCommunityById(communityId);
    if (data) {
      if (data.isPrivate && !data.isJoined) {
        navigate('/communities');
        return;
      }
      setCommunity(data);
      // Track last visited
      try {
        const visits = JSON.parse(localStorage.getItem('sophiapath_community_visits') || '{}');
        visits[communityId] = Date.now();
        localStorage.setItem('sophiapath_community_visits', JSON.stringify(visits));
      } catch (e) {
        console.error(e);
      }
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
    let list = [...filteredQuestions];
    if (hidePending) {
      list = list.filter(q => q.approved);
    }
    // Sort so that pending posts (!approved) always sit at the top
    const sorted = list.sort((a, b) => {
      const aPend = !a.approved;
      const bPend = !b.approved;
      if (aPend && !bPend) return -1;
      if (!aPend && bPend) return 1;
      return 0;
    });
    return sorted.slice(0, visibleCount);
  }, [filteredQuestions, hidePending, visibleCount]);

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
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAskQuestionSubmit = async () => {
    if (!postTitle.trim() || !postContent.trim() || !activeRoomId) return;
    
    // Combine content and optional code/image/link attachments
    let fullContent = postContent;
    if (showCodeField && postCode.trim()) {
      fullContent += `\n\n\`\`\`${postLanguage}\n${postCode}\n\`\`\``;
    }
    if (showImageField && postImages.length > 0) {
      postImages.forEach(img => {
        if (img) fullContent += `\n\n![Image Attachment](${img})`;
      });
    }
    if (showLinkField) {
      const hasInvalidLink = postLinks.some(link => link.url.trim() !== '' && !link.url.trim().startsWith('https://'));
      if (hasInvalidLink) {
        alert("All external links must start with 'https://'!");
        return;
      }
      postLinks.forEach(link => {
        if (link.url.trim()) {
          const label = link.label.trim() || 'Link';
          fullContent += `\n\n[${label}](${link.url.trim()})`;
        }
      });
    }

    const qPoll = showPollField && pollQuestion.trim() ? pollQuestion.trim() : null;
    const oPoll = showPollField && pollQuestion.trim() ? pollOptions.filter(o => o.trim() !== '') : null;

    await socialStore.createQuestion(activeRoomId, postTitle, fullContent, user, qPoll, oPoll);
    
    // Reset all fields
    setPostTitle('');
    setPostContent('');
    setPostCode('');
    setPostLanguage('javascript');
    setPostImages([]);
    setPostLinks([{ url: '', label: '' }]);
    setShowCodeField(false);
    setShowImageField(false);
    setShowLinkField(false);
    setShowPollField(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setOpenAskQuestion(false);
    loadQuestions();
  };

  const handleOpenSettingsClick = () => {
    setMaxMembers(community?.maxMembers || 1000);
    setCommunityPrivate(community?.isPrivate || false);
    setCommunityNSFW(community?.isNSFW || false);
    setCommunityNsfwAgeLimit(community?.nsfwAgeLimit || 18);
    setCommunityRules(community?.rules || []);
    setCommunityCategory(community?.category || 'Software Engineering');
    setOpenSettings(true);
  };

  const handleSaveSettingsSubmit = async () => {
    const updated = await socialStore.updateCommunity(
      communityId,
      community.name,
      community.description,
      community.icon,
      communityPrivate,
      communityNSFW,
      communityRules,
      communityCategory,
      maxMembers,
      communityNsfwAgeLimit
    );
    if (updated) {
      setCommunity(prev => ({
        ...prev,
        ...updated
      }));
      setOpenSettings(false);
      loadCommunity();
    }
  };

  const handleDeleteCommunityClick = async () => {
    showConfirmDialog(
      "Delete Community?",
      "Are you sure you want to delete this community? This action is permanent and will delete all rooms, posts, comments, and replies.",
      async () => {
        const success = await socialStore.deleteCommunity(community.id);
        if (success) {
          navigate('/communities');
        }
      }
    );
  };

  const handleUpvote = async (e, questionId) => {
    e.stopPropagation(); // Avoid navigating to details
    if (!user) {
      navigate('/login');
      return;
    }
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
    if (!user) {
      navigate('/login');
      return;
    }
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

          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', px: 1, py: 0.3, borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {(CATEGORY_STYLES[community.category] || CATEGORY_STYLES['Software Engineering']).icon} {community.category || 'Software Engineering'}
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', px: 1, py: 0.3, borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {community.isPrivate ? '🔒 Private' : '🌐 Public'}
            </Box>
            {community.isNSFW && (
              <Box sx={{ bgcolor: '#ef4444', color: 'white', px: 1, py: 0.3, borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                ⚠️ {community.nsfwAgeLimit || 18}+ NSFW
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Rooms Listing header */}
        <Box sx={{ px: 2.5, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Rooms / Channels
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => {
                setShowRoomSearch(!showRoomSearch);
                setRoomSearchQuery('');
              }}
              color={showRoomSearch ? "primary" : "default"}
              sx={{ p: 0.5 }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Stack>
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

        {showRoomSearch && (
          <Box sx={{ px: 2.5, pt: 1, pb: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search rooms..."
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 1.5, fontSize: '0.85rem' }
              }}
            />
          </Box>
        )}

        {/* Scrollable list of Rooms */}
        <List className="community-rooms-list">
          {community.rooms
            ?.filter((room) => (room.name || '').toLowerCase().includes(roomSearchQuery.toLowerCase()))
            ?.map((room) => (
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

            {isMod && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hidePending}
                    onChange={(e) => setHidePending(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Hide Pending
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            )}

            <Button
              className="community-ask-btn"
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={(e) => {
                e.currentTarget.blur();
                setOpenAskQuestion(true);
              }}
              disabled={!community.isJoined}
              sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
            >
              Ask Post
            </Button>
          </Stack>
        </Box>

        {/* Post cards feed */}
        <Box className="community-feed-posts" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displayedQuestions.length > 0 ? (
            displayedQuestions.map((q) => {
              const hasUpvoted = q.userUpvoted;
              const hasDownvoted = q.userDownvoted;
              
              return (
                <Card 
                  key={q.id} 
                  className="post-card"
                  onClick={() => navigate(`/communities/${communityId}/room/${activeRoomId}/question/${q.id}`)}
                  sx={{ flexShrink: 0 }}
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
                        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await socialStore.approveQuestion(q.id);
                              loadQuestions();
                            }}
                            sx={{ borderRadius: 1.5, textTransform: 'none', py: 0.25, px: 1.5, fontSize: '0.72rem', fontWeight: 700 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={async (e) => {
                              e.stopPropagation();
                              showConfirmDialog(
                                "Reject Post?",
                                "Are you sure you want to reject and delete this pending post?",
                                async () => {
                                  await socialStore.deleteQuestion(q.id);
                                  loadQuestions();
                                }
                              );
                            }}
                            sx={{ borderRadius: 1.5, textTransform: 'none', py: 0.25, px: 1.5, fontSize: '0.72rem', fontWeight: 700 }}
                          >
                            Reject
                          </Button>
                        </Stack>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4, flexShrink: 0 }}>
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
          
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
              Add to post:
            </Typography>
            <Button
              size="small"
              variant={showCodeField ? "contained" : "outlined"}
              onClick={() => setShowCodeField(!showCodeField)}
              sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5, fontWeight: 700 }}
            >
              💻 Code
            </Button>
            <Button
              size="small"
              variant={showImageField ? "contained" : "outlined"}
              onClick={() => setShowImageField(!showImageField)}
              sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5, fontWeight: 700 }}
            >
              📷 Images
            </Button>
            <Button
              size="small"
              variant={showLinkField ? "contained" : "outlined"}
              onClick={() => setShowLinkField(!showLinkField)}
              sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5, fontWeight: 700 }}
            >
              🔗 Link
            </Button>
            <Button
              size="small"
              variant={showPollField ? "contained" : "outlined"}
              onClick={() => setShowPollField(!showPollField)}
              sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5, fontWeight: 700 }}
            >
              📊 Poll
            </Button>
          </Stack>

          {showCodeField && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--divider)', p: 2, borderRadius: 1.5, position: 'relative', mt: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => { setShowCodeField(false); setPostCode(''); }}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                ✕
              </IconButton>
              <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={postLanguage}
                  label="Language"
                  onChange={(e) => setPostLanguage(e.target.value)}
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                  <MenuItem value="cpp">C++</MenuItem>
                  <MenuItem value="html">HTML/CSS</MenuItem>
                  <MenuItem value="sql">SQL</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Code Snippet"
                placeholder="Paste code snippets here..."
                fullWidth
                multiline
                rows={3}
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
                InputProps={{
                  sx: { fontFamily: 'monospace', borderRadius: 1.5 }
                }}
                inputProps={{ maxLength: 1000 }}
              />
            </Box>
          )}

          {showImageField && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1, border: '1px dashed var(--divider)', p: 2, borderRadius: 1.5, position: 'relative' }}>
              <IconButton 
                size="small" 
                onClick={() => { setShowImageField(false); setPostImages([]); }}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                ✕
              </IconButton>
              
              <input
                type="file"
                multiple
                accept="image/*"
                id="post-image-file-input"
                style={{ display: 'none' }}
                onChange={handlePostImageUpload}
              />
              
              <Button
                variant="outlined"
                component="label"
                htmlFor="post-image-file-input"
                startIcon={<CameraIcon />}
                sx={{ textTransform: 'none', borderRadius: 2, mt: 2 }}
              >
                Upload Images
              </Button>

              {postImages.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {postImages.map((img, idx) => (
                    <Box key={idx} sx={{ position: 'relative', width: 60, height: 60 }}>
                      <img
                        src={img}
                        alt="preview"
                        style={{ width: '100%', height: '100%', borderRadius: 4, objectFit: 'cover', border: '1px solid var(--divider)' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 16,
                          height: 16,
                          fontSize: '0.6rem',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                      >
                        ✕
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {showLinkField && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--divider)', p: 2, borderRadius: 1.5, position: 'relative', mt: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => { setShowLinkField(false); setPostLinks([{ url: '', label: '' }]); }}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                ✕
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>External Links</Typography>
              
              {postLinks.map((link, idx) => {
                const urlInvalid = link.url.trim() !== '' && !link.url.trim().startsWith('https://');
                return (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5, border: '1px dashed var(--divider)', borderRadius: 1.5, position: 'relative' }}>
                    {postLinks.length > 1 && (
                      <IconButton 
                        size="small"
                        onClick={() => setPostLinks(prev => prev.filter((_, i) => i !== idx))}
                        sx={{ position: 'absolute', top: 4, right: 4, color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    <TextField
                      label={`Link #${idx + 1} URL`}
                      placeholder="https://example.com"
                      fullWidth
                      size="small"
                      value={link.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostLinks(prev => prev.map((item, i) => i === idx ? { ...item, url: val } : item));
                      }}
                      error={urlInvalid}
                      helperText={urlInvalid ? "Link must start with 'https://'" : ""}
                      InputProps={{ sx: { borderRadius: 1.5 } }}
                      inputProps={{ maxLength: 500 }}
                    />
                    <TextField
                      label={`Link #${idx + 1} Label`}
                      placeholder="Visit Website"
                      fullWidth
                      size="small"
                      value={link.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostLinks(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                      }}
                      InputProps={{ sx: { borderRadius: 1.5 } }}
                      inputProps={{ maxLength: 100 }}
                    />
                  </Box>
                );
              })}
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPostLinks(prev => [...prev, { url: '', label: '' }])}
                sx={{ alignSelf: 'flex-start', borderRadius: 1.5, textTransform: 'none' }}
              >
                + Add Another Link
              </Button>
            </Box>
          )}

          {showPollField && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, border: '1px solid var(--divider)', p: 2, borderRadius: 1.5, position: 'relative', mt: 1, maxHeight: 250, overflowY: 'auto' }}>
              <IconButton 
                size="small" 
                onClick={() => { setShowPollField(false); setPollQuestion(''); setPollOptions(['', '']); }}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                ✕
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2 }}>Interactive Poll</Typography>
              <TextField
                label="Poll Question"
                placeholder="Ask a question..."
                fullWidth
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                InputProps={{ sx: { borderRadius: 1.5 } }}
                inputProps={{ maxLength: 100 }}
              />
              {pollOptions.map((opt, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label={`Option ${index + 1}`}
                    placeholder={`Enter option ${index + 1}`}
                    fullWidth
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[index] = e.target.value;
                      setPollOptions(next);
                    }}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                    inputProps={{ maxLength: 50 }}
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== index))}
                    sx={{ border: '1px solid var(--divider)', borderRadius: 1.5, width: 40, height: 40 }}
                  >
                    ✕
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                onClick={() => setPollOptions([...pollOptions, ''])}
                sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
              >
                + Add Option
              </Button>
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
                  <Avatar src={localStorage.getItem(`avatar_${m.id}`) || m.avatar || ''} sx={{ width: 32, height: 32, fontSize: '0.85rem', mr: 1.5 }}>
                    {!(localStorage.getItem(`avatar_${m.id}`) || m.avatar) && (m.fullname?.charAt(0).toUpperCase() || m.username?.charAt(0).toUpperCase())}
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
            handleOpenSettingsClick();
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
        {community.isJoined ? (
          <MenuItem onClick={() => {
            setCommunityMenuAnchor(null);
            setOpenLeaveDialog(true);
          }} sx={{ color: 'error.main' }}>
            Leave Community
          </MenuItem>
        ) : (
          <MenuItem onClick={async () => {
            setCommunityMenuAnchor(null);
            if (!user) {
              navigate('/login');
              return;
            }
            try {
              await socialStore.toggleJoinCommunity(community.id);
              loadCommunity();
            } catch (err) {
              showCustomAlert("Action Failed", err.message);
            }
          }}>
            Join Community
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
        PaperProps={{ sx: { borderRadius: 1.5, minWidth: 160 } }}
      >
        <MenuItem onClick={() => {
          setMemberMenuAnchor(null);
          setProfileMember(selectedMember);
          setOpenProfileDialog(true);
        }}>
          View Profile
        </MenuItem>
        {isOwner && selectedMember && Number(selectedMember.id) !== Number(user?.id) && (
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
            {community.moderatorIds?.includes(String(selectedMember.id)) ? 'Demote to Member' : 'Promote to Moderator'}
          </MenuItem>
        )}
      </Menu>

      {/* COMMUNITY SETTINGS DIALOG */}
      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        maxWidth="sm"
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
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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

          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={communityCategory}
              label="Category"
              onChange={(e) => setCommunityCategory(e.target.value)}
              sx={{ borderRadius: 1.5 }}
              MenuProps={{
                PaperProps: {
                  elevation: 1,
                  sx: {
                    maxHeight: 300,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }
                }
              }}
            >
              {COMMUNITY_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack spacing={1}>
            <FormControlLabel
              control={<Switch checked={communityPrivate} onChange={(e) => setCommunityPrivate(e.target.checked)} />}
              label="Private Community (Requires invite link to join)"
            />
            <FormControlLabel
              control={<Switch checked={communityNSFW} onChange={(e) => setCommunityNSFW(e.target.checked)} />}
              label="NSFW Content Warning"
            />
            {communityNSFW && (
              <TextField
                label="NSFW Age Limit"
                type="number"
                fullWidth
                size="small"
                value={communityNsfwAgeLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= 100) {
                    setCommunityNsfwAgeLimit(val);
                  } else if (e.target.value === '') {
                    setCommunityNsfwAgeLimit('');
                  }
                }}
                inputProps={{ min: 1, max: 100 }}
                InputProps={{ sx: { borderRadius: 1.5 } }}
                helperText="Enter a valid age limit between 1 and 100"
                sx={{ mt: 1 }}
              />
            )}
          </Stack>

          {communityPrivate && (
            <Box sx={{ border: '1px solid var(--divider)', p: 1.5, borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                Invite-Only Join Link:
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  readOnly
                  value={`${window.location.origin}/communities/join-invite/${encodeCommunityId(communityId)}`}
                  InputProps={{ sx: { borderRadius: 1.5, fontSize: '0.8rem', bgcolor: 'rgba(0,0,0,0.01)' } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/communities/join-invite/${encodeCommunityId(communityId)}`);
                    showToast("Invite link copied to clipboard!");
                  }}
                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                >
                  Copy
                </Button>
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Rules Management */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Community Rules & Guidelines
            </Typography>
            <List dense sx={{ border: communityRules.length > 0 ? '1px solid var(--divider)' : 'none', borderRadius: 1.5, mb: 1.5 }}>
              {communityRules.map((rule, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton size="small" color="error" onClick={() => setCommunityRules(prev => prev.filter((_, i) => i !== idx))}>
                      ✕
                    </IconButton>
                  }
                >
                  <ListItemText primary={`${idx + 1}. ${rule}`} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
            <Stack direction="row" spacing={1}>
              <TextField
                placeholder="Enter a new rule..."
                size="small"
                fullWidth
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                InputProps={{ sx: { borderRadius: 1.5 } }}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  if (newRuleText.trim()) {
                    setCommunityRules(prev => [...prev, newRuleText.trim()]);
                    setNewRuleText('');
                  }
                }}
                sx={{ textTransform: 'none', borderRadius: 1.5 }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={handleSaveSettingsSubmit}
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

      {/* NSFW Age Warning Block Dialog */}
      <Dialog
        open={!!community?.isNSFW && !community?.isJoined && !consentedNSFW}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', color: 'error.main' }}>
          ⚠️ {community?.nsfwAgeLimit || 18}+ Content Warning
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
            This community is flagged as NSFW (Not Safe For Work).
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You must be at least {community?.nsfwAgeLimit || 18} years old and consent to viewing sensitive/adult content to proceed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={() => setConsentedNSFW(true)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Confirm & Enter
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/communities')}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Go Back
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Theme Alert Dialog */}
      <Dialog 
        open={alertOpen} 
        onClose={() => setAlertOpen(false)}
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{alertTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {alertMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => setAlertOpen(false)}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Themed Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, maxWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {confirmMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1.5 }}>
          <Button 
            variant="outlined" 
            onClick={() => setConfirmOpen(false)}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              if (onConfirmCallback) onConfirmCallback();
              setConfirmOpen(false);
            }}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Community Dialog */}
      <Dialog
        open={openLeaveDialog}
        onClose={() => {
          setOpenLeaveDialog(false);
          setSelectedNewOwnerId('');
        }}
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Leave Community</DialogTitle>
        <DialogContent>
          {isOwner ? (
            (() => {
              const mods = (community?.members || []).filter(m => 
                community?.moderatorIds?.includes(String(m.id)) && Number(m.id) !== Number(user?.id)
              );
              
              if (mods.length === 0) {
                return (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      You are the owner of this community. You cannot leave without assigning another owner, and there are currently no moderators to promote to owner.
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: 'primary.main', fontWeight: 600 }}>
                      Please promote at least one member to Moderator first.
                    </Typography>
                  </Stack>
                );
              }
              
              return (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    As the owner, you must assign another owner from one of the moderators before you can leave.
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <InputLabel id="select-new-owner-label">Select New Owner</InputLabel>
                    <Select
                      labelId="select-new-owner-label"
                      value={selectedNewOwnerId}
                      label="Select New Owner"
                      onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {mods.map(mod => {
                        const name = mod.fullname || mod.name || mod.username || `User #${mod.id}`;
                        return (
                          <MenuItem key={mod.id} value={mod.id}>
                            {name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Stack>
              );
            })()
          ) : (
            <Typography sx={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to leave <strong>{community?.name}</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1.5 }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              setOpenLeaveDialog(false);
              setSelectedNewOwnerId('');
            }}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          {isOwner ? (
            (() => {
              const mods = (community?.members || []).filter(m => 
                community?.moderatorIds?.includes(String(m.id)) && Number(m.id) !== Number(user?.id)
              );
              
              if (mods.length === 0) {
                return (
                  <Button 
                    variant="contained" 
                    onClick={() => setOpenLeaveDialog(false)}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Okay
                  </Button>
                );
              }
              
              return (
                <Button 
                  variant="contained" 
                  color="error"
                  disabled={!selectedNewOwnerId}
                  onClick={async () => {
                    try {
                      // 1. Transfer ownership
                      const updatedComm = await socialStore.updateCommunity(
                        community.id,
                        community.name,
                        community.description,
                        community.icon,
                        community.isPrivate,
                        community.isNSFW,
                        community.rules,
                        community.category,
                        community.maxMembers,
                        community.nsfwAgeLimit,
                        Number(selectedNewOwnerId)
                      );
                      
                      if (updatedComm) {
                        // 2. Leave community
                        await socialStore.toggleJoinCommunity(community.id);
                        setOpenLeaveDialog(false);
                        setSelectedNewOwnerId('');
                        navigate('/communities');
                      } else {
                        showCustomAlert("Error", "Failed to transfer ownership.");
                      }
                    } catch (err) {
                      showCustomAlert("Error", err.message);
                    }
                  }}
                  fullWidth
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Transfer & Leave
                </Button>
              );
            })()
          ) : (
            <Button 
              variant="contained" 
              color="error"
              onClick={async () => {
                try {
                  await socialStore.toggleJoinCommunity(community.id);
                  setOpenLeaveDialog(false);
                  navigate('/communities');
                } catch (err) {
                  showCustomAlert("Action Failed", err.message);
                }
              }}
              fullWidth
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Leave
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Member Profile Dialog */}
      <Dialog 
        open={openProfileDialog} 
        onClose={() => {
          setOpenProfileDialog(false);
          setProfileMember(null);
        }} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 2, position: 'relative' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 3, pr: 7 }}>
          <IconButton
            onClick={() => {
              setOpenProfileDialog(false);
              setProfileMember(null);
            }}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Learner Profile
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3 }}>
          {(() => {
            if (!profileMember) return null;
            const avatarUrl = localStorage.getItem(`avatar_${profileMember.id}`) || profileMember.avatar || '';
            const initials = profileMember.fullname?.charAt(0).toUpperCase() || profileMember.username?.charAt(0).toUpperCase() || '?';
            
            const isMOwner = Number(community.ownerId) === Number(profileMember.id);
            const isMMod = community.moderatorIds?.includes(String(profileMember.id));
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
              <>
                <Avatar
                  src={avatarUrl}
                  sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 'bold' }}
                >
                  {!avatarUrl && initials}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {profileMember.fullname || profileMember.username}
                </Typography>
                
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', color: roleColor, backgroundColor: roleBg, marginBottom: '24px' }}>
                  {roleTag}
                </span>

                <Divider sx={{ width: '100%', mb: 3 }} />

                <Stack spacing={2} sx={{ width: '100%', px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FingerprintIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Username</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        @{profileMember.username || 'learner'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Gender / Age</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {profileMember.gender || 'Rather Not Say'} • {profileMember.age || 20} years old
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Joined Platform</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {profileMember.dateTime ? new Date(profileMember.dateTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CommunityDetailPage;
