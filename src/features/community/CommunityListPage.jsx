import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  ExitToApp as ExitIcon,
  Login as LoginIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socialStore } from '../../data/socialStore';
import { useAuth } from '../../context/AuthContext';
import './Community.css';

const CommunityListPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState([]);
  
  // Tabs & Lists
  const [activeTab, setActiveTab] = useState(0); // 0 = My Communities, 1 = Discover, 2 = Saved Posts
  const [savedQuestions, setSavedQuestions] = useState([]);

  // Rules dialog states
  const [rulesCommunity, setRulesCommunity] = useState(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

  // NSFW age check states
  const [openAgeWarning, setOpenAgeWarning] = useState(false);
  const [nsfwCommunityToJoin, setNsfwCommunityToJoin] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💻');

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('💻');
  
  const navigate = useNavigate();

  const loadSavedPosts = async () => {
    const savedIds = JSON.parse(localStorage.getItem('saved_posts_list') || '[]');
    if (savedIds.length > 0) {
      const posts = await Promise.all(savedIds.map(id => socialStore.getQuestionById(id)));
      setSavedQuestions(posts.filter(Boolean));
    } else {
      setSavedQuestions([]);
    }
  };

  const loadCommunities = async () => {
    const list = await socialStore.getCommunities();
    setCommunities(list || []);
  };

  useEffect(() => {
    loadCommunities();
    loadSavedPosts();
  }, []);

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return communities;
    return communities.filter(c => {
      const nameWords = (c.name || '').toLowerCase().split(/\s+/);
      const descWords = (c.description || '').toLowerCase().split(/\s+/);
      return nameWords.some(w => w.startsWith(q)) || descWords.some(w => w.startsWith(q));
    });
  }, [communities, searchQuery]);

  const handleToggleJoin = async (e, community) => {
    e.stopPropagation();
    
    if (community.isJoined) {
      // Leave immediately
      await socialStore.toggleJoinCommunity(community.id);
      loadCommunities();
    } else {
      // Join process
      if (community.isNSFW && !user?.ageCheckedNSFW) { // simple check or prompt
        setNsfwCommunityToJoin(community);
        setOpenAgeWarning(true);
        return;
      }
      
      if (community.rules && community.rules.length > 0) {
        setRulesCommunity(community);
        setRulesAccepted(false);
        setRulesDialogOpen(true);
      } else {
        await socialStore.toggleJoinCommunity(community.id);
        loadCommunities();
      }
    }
  };

  const handleRulesJoinSubmit = async () => {
    if (!rulesCommunity || !rulesAccepted) return;
    await socialStore.toggleJoinCommunity(rulesCommunity.id);
    setRulesDialogOpen(false);
    setRulesCommunity(null);
    setRulesAccepted(false);
    loadCommunities();
  };

  const handleCreateSubmit = async () => {
    if (!name.trim()) return;
    const created = await socialStore.createCommunity(name, description, icon);
    if (created) {
      setName('');
      setDescription('');
      setIcon('💻');
      setOpenCreate(false);
      loadCommunities();
      navigate(`/communities/${created.id}`);
    }
  };

  const handleEditClick = (e, community) => {
    e.stopPropagation();
    setEditId(community.id);
    setEditName(community.name);
    setEditDescription(community.description || '');
    setEditIcon(community.icon || '💻');
    setOpenEdit(true);
  };

  const handleEditSubmit = async () => {
    if (!editName.trim()) return;
    const updated = await socialStore.updateCommunity(editId, editName, editDescription, editIcon);
    if (updated) {
      setOpenEdit(false);
      loadCommunities();
    }
  };

  const handleDeleteClick = async (e, communityId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this community? This action is permanent and will delete all rooms and posts.")) {
      const deleted = await socialStore.deleteCommunity(communityId);
      if (deleted) {
        loadCommunities();
      }
    }
  };

  const displayCommunities = useMemo(() => {
    if (activeTab === 0) {
      const joined = filteredCommunities.filter(c => c.isJoined);
      try {
        const visits = JSON.parse(localStorage.getItem('sophiapath_community_visits') || '{}');
        return joined.sort((a, b) => {
          const timeA = visits[a.id] || 0;
          const timeB = visits[b.id] || 0;
          return timeB - timeA;
        });
      } catch (e) {
        return joined;
      }
    } else if (activeTab === 1) {
      return filteredCommunities.filter(c => !c.isJoined);
    }
    return [];
  }, [filteredCommunities, activeTab]);

  return (
    <Box className="community-list-container">
      
      {/* Top Header Controls */}
      <Box className="community-list-header" sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Search communities..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3, bgcolor: 'background.paper' }
            }}
          />
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{
              borderRadius: 4,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(61, 92, 255, 0.25)',
              fontWeight: 600
            }}
          >
            Create Community
          </Button>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="My Communities" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label="Discover" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label="Saved Posts" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Main Content Area based on Tab */}
      {activeTab !== 2 ? (
        <Box className="community-grid">
          {displayCommunities.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
              <Typography color="text.secondary">
                {activeTab === 0 
                  ? "You haven't joined any communities yet. Switch to the Discover tab to find one!" 
                  : "No communities found."}
              </Typography>
            </Box>
          ) : (
            displayCommunities.map((c) => (
              <Box 
                key={c.id} 
                className="community-card"
                onClick={() => navigate(`/communities/${c.id}`)}
                sx={{ cursor: 'pointer', borderRadius: 2, position: 'relative' }}
              >
                {/* NSFW tag indicator */}
                {c.isNSFW && (
                  <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'error.main', color: 'white', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.65rem', fontWeight: 800, zIndex: 10 }}>
                    18+ NSFW
                  </Box>
                )}

                {/* Banner gradient */}
                <Box className="community-card-banner" sx={{ background: c.bannerColor }}>
                  <Box className="community-card-icon-wrapper">
                    {c.icon}
                  </Box>
                </Box>
                
                {/* Content info */}
                <Box className="community-card-content">
                  <Typography variant="h5" className="community-card-name">
                    {c.name}
                  </Typography>
                  <Typography variant="body2" className="community-card-desc">
                    {c.description}
                  </Typography>

                  {/* Footer info */}
                  <Box className="community-card-footer">
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'var(--text-secondary)' }}>
                      <PeopleIcon sx={{ fontSize: 18 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {c.membersCount} members
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {Number(c.ownerId) === Number(user?.id) && (
                        <>
                          <IconButton size="small" onClick={(e) => handleEditClick(e, c)} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={(e) => handleDeleteClick(e, c.id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      <Button
                        size="small"
                        variant={c.isJoined ? "outlined" : "contained"}
                        color={c.isJoined ? "error" : "primary"}
                        onClick={(e) => handleToggleJoin(e, c)}
                        startIcon={c.isJoined ? <ExitIcon /> : <LoginIcon />}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2
                        }}
                      >
                        {c.isJoined ? "Leave" : "Join"}
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      ) : (
        /* Saved Posts Tab View */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {savedQuestions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid var(--divider)' }}>
              <Typography color="text.secondary">You haven't saved any posts yet.</Typography>
            </Box>
          ) : (
            savedQuestions.map((post) => (
              <Card
                key={post.id}
                onClick={() => navigate(`/communities/${post.room?.communityId || 1}/room/${post.roomId}/question/${post.id}`)}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: '1px solid var(--divider)',
                  boxShadow: 'none',
                  position: 'relative',
                  '&:hover': {
                    borderColor: 'var(--primary-color)',
                    bgcolor: 'rgba(61,92,255,0.01)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    {post.title}
                  </Typography>
                  <BookmarkIcon sx={{ color: '#f59e0b' }} />
                </Stack>
                
                <Typography variant="body2" color="text.secondary" sx={{
                  mb: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {post.content?.replace(/!\[Image Attachment\]\(([^)]*)\)/g, '').replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1') || ''}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={post.authorAvatar} sx={{ width: 24, height: 24 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {post.authorName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Saved Post
                  </Typography>
                </Stack>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* Rules Acknowledgment Dialog */}
      <Dialog
        open={rulesDialogOpen}
        onClose={() => setRulesDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          📄 Community Rules
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please read and agree to follow the rules of <strong>{rulesCommunity?.name}</strong> before joining.
          </Typography>
          <List dense sx={{ border: '1px solid var(--divider)', borderRadius: 1.5, p: 1, mb: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            {rulesCommunity?.rules?.map((rule, idx) => (
              <ListItem key={idx} sx={{ py: 0.5 }}>
                <ListItemText primary={`${idx + 1}. ${rule}`} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
              </ListItem>
            ))}
          </List>
          <FormControlLabel
            control={
              <Checkbox
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>I agree to follow these rules</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            disabled={!rulesAccepted}
            onClick={handleRulesJoinSubmit}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Agree & Join
          </Button>
          <Button
            variant="outlined"
            onClick={() => setRulesDialogOpen(false)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Age Restriction warning dialog */}
      <Dialog
        open={openAgeWarning}
        onClose={() => setOpenAgeWarning(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', color: 'error.main' }}>
          ⚠️ 18+ NSFW Content Check
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            This community contains adult content. Please confirm you are at least 18 years old to join.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (nsfwCommunityToJoin) {
                if (nsfwCommunityToJoin.rules && nsfwCommunityToJoin.rules.length > 0) {
                  setRulesCommunity(nsfwCommunityToJoin);
                  setRulesAccepted(false);
                  setRulesDialogOpen(true);
                } else {
                  await socialStore.toggleJoinCommunity(nsfwCommunityToJoin.id);
                  loadCommunities();
                }
              }
              setOpenAgeWarning(false);
              setNsfwCommunityToJoin(null);
            }}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            I am 18+
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenAgeWarning(false);
              setNsfwCommunityToJoin(null);
            }}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Go Back
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE COMMUNITY DIALOG */}
      <Dialog 
        open={openCreate} 
        onClose={() => setOpenCreate(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenCreate(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Create Learning Community
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Community Name"
            placeholder="e.g. Software Architecture"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Description"
            placeholder="What is this community's learning focus?"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 300 }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">Select Community Icon:</Typography>
            {['💻', '🛡️', '🏛️', '🧪', '🧠', '⚙️'].map((emoji) => (
              <Button
                key={emoji}
                variant={icon === emoji ? "contained" : "outlined"}
                sx={{
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  fontSize: '1.2rem',
                  p: 0
                }}
                onClick={() => setIcon(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained" 
            disabled={!name.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT COMMUNITY DIALOG */}
      <Dialog 
        open={openEdit} 
        onClose={() => setOpenEdit(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, position: 'relative' },
          elevation: 6
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          <IconButton
            onClick={() => setOpenEdit(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Edit Learning Community
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Community Name"
            placeholder="e.g. Software Architecture"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Description"
            placeholder="What is this community's learning focus?"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            InputProps={{ sx: { borderRadius: 1.5 } }}
            inputProps={{ maxLength: 300 }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">Select Community Icon:</Typography>
            {['💻', '🛡️', '🏛️', '🧪', '🧠', '⚙️'].map((emoji) => (
              <Button
                key={emoji}
                variant={editIcon === emoji ? "contained" : "outlined"}
                sx={{
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  fontSize: '1.2rem',
                  p: 0
                }}
                onClick={() => setEditIcon(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            disabled={!editName.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityListPage;
