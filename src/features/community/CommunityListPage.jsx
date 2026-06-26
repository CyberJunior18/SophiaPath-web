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
  CardActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  ExitToApp as ExitIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socialStore } from '../../data/socialStore';
import './Community.css';

const CommunityListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💻');
  
  const navigate = useNavigate();

  const loadCommunities = async () => {
    const list = await socialStore.getCommunities();
    setCommunities(list);
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const filteredCommunities = useMemo(() => {
    return communities.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      // Redirect to the newly created community
      navigate(`/communities/${created.id}`);
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
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create Learning Community</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Community Name"
            placeholder="e.g. Software Architecture"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            InputProps={{ sx: { borderRadius: 3 } }}
          />
          <TextField
            label="Description"
            placeholder="What is this community's learning focus?"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            InputProps={{ sx: { borderRadius: 3 } }}
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
          <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
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
    </Box>
  );
};

export default CommunityListPage;
