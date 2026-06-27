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
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  ExitToApp as ExitIcon,
  Login as LoginIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socialStore } from '../../data/socialStore';
import { useAuth } from '../../context/AuthContext';
import './Community.css';

const CommunityListPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState([]);
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

  const loadCommunities = async () => {
    const list = await socialStore.getCommunities();
    setCommunities(list);
  };

  useEffect(() => {
    loadCommunities();
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

  const handleToggleJoin = async (e, communityId) => {
    e.stopPropagation(); // Prevent card click navigation
    await socialStore.toggleJoinCommunity(communityId);
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

  return (
    <Box className="community-list-container">
      
      {/* Top Header Controls */}
      <Box className="community-list-header">
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

      {/* Grid of Community Cards */}
      <Box className="community-grid">
        {filteredCommunities.map((c) => (
          <Box 
            key={c.id} 
            className="community-card"
            onClick={() => navigate(`/communities/${c.id}`)}
            sx={{ cursor: 'pointer' }}
          >
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
                    onClick={(e) => handleToggleJoin(e, c.id)}
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
        ))}
      </Box>

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
