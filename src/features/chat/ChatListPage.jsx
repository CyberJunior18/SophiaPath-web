import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Chat.css';

const ChatListPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Get all users from localStorage to simulate a list of people to chat with
  const allUsers = useMemo(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    // Filter out current user and apply search
    return users
      .filter(u => u.id !== user?.id)
      .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [user, searchQuery]);

  const handleUserClick = (targetUser) => {
    navigate(`/chat/${targetUser.id}`, { state: { targetUser } });
  };

  // Helper to get last message preview (simulated/persisted)
  const getLastMessage = (otherId) => {
    const chatId = [user.id, otherId].sort().join('_');
    const messages = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
    if (messages.length === 0) return "Start a conversation...";
    const last = messages[messages.length - 1];
    return last.senderId === user.id ? `You: ${last.text}` : last.text;
  };

  return (
    <Box className="chat-list-container">
      <Paper className="chat-list-card glass-panel-strong">
        <Box className="chat-list-header-new">
          
          <Box className="chat-search-wrapper">
            <TextField
              fullWidth
              placeholder="Search learners..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
            />
          </Box>
        </Box>

        <List className="chat-list">
          {allUsers.length > 0 ? (
            allUsers.map((otherUser) => (
              <ListItemButton 
                key={otherUser.id} 
                onClick={() => handleUserClick(otherUser)}
                className="chat-list-item-new"
              >
                <ListItemAvatar>
                  <Badge 
                    overlap="circular" 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    className="status-badge"
                  >
                    <Avatar 
                      src={otherUser.avatar || `https://i.pravatar.cc/150?u=${otherUser.id}`} 
                      className="chat-avatar"
                    />
                  </Badge>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Box className="chat-item-header">
                      <Typography className="chat-item-name">{otherUser.name}</Typography>
                      <Typography variant="caption" className="chat-item-time">Active</Typography>
                    </Box>
                  } 
                  secondary={getLastMessage(otherUser.id)} 
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ 
                    className: 'chat-item-preview',
                    noWrap: true 
                  }}
                />
              </ListItemButton>
            ))
          ) : (
            <Box className="chat-empty-state">
              <ForumIcon sx={{ fontSize: 64, opacity: 0.1, mb: 2 }} />
              <Typography variant="h6">No conversations yet</Typography>
              <Typography variant="body2">Find a peer and start sharing knowledge!</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default ChatListPage;
