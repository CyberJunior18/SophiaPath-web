import React, { useEffect, useMemo, useState } from 'react';
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
  const [allUsers, setAllUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsersAndConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // 1. Fetch all users from the backend
        const usersRes = await fetch('/users', { headers });
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersList = await usersRes.json();

        // 2. Fetch all active conversations for the current user
        const convRes = await fetch(`/api/chat/user/${user.id}/conversations`, { headers });
        let conversations = [];
        if (convRes.ok) {
          conversations = await convRes.json();
        }

        const msgPreviews = {};
        conversations.forEach(c => {
          const otherId = c.userId1 === user.id ? c.userId2 : c.userId1;
          if (c.lastMessage) {
            msgPreviews[otherId] = c.lastMessage.senderId === user.id
              ? `You: ${c.lastMessage.message}`
              : c.lastMessage.message;
          }
        });

        // Exclude current user
        const filteredUsers = usersList.filter(u => u.id !== user.id);

        setAllUsers(filteredUsers);
        setLastMessages(msgPreviews);
      } catch (err) {
        console.error('Failed to load chat data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchUsersAndConversations();
    }
  }, [user]);

  const filteredUsersList = useMemo(() => {
    return allUsers.filter(u => {
      const displayName = (u.fullname || u.name || u.username || '').toLowerCase();
      return displayName.includes(searchQuery.toLowerCase());
    });
  }, [allUsers, searchQuery]);

  const handleUserClick = (targetUser) => {
    // Map backend user properties to the format expected by ChatPage
    const normalizedTarget = {
      id: targetUser.id,
      name: targetUser.fullname || targetUser.name || targetUser.username,
      avatar: localStorage.getItem(`avatar_${targetUser.id}`) || targetUser.avatar || '',
      username: targetUser.username
    };
    navigate(`/chat/${targetUser.id}`, { state: { targetUser: normalizedTarget } });
  };

  const getLastMessage = (otherId) => {
    return lastMessages[otherId] || "Start a conversation...";
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
          {loading ? (
            <Box className="chat-empty-state">
              <Typography variant="body2">Loading conversations...</Typography>
            </Box>
          ) : filteredUsersList.length > 0 ? (
            filteredUsersList.map((otherUser) => {
              const userAvatar = localStorage.getItem(`avatar_${otherUser.id}`) || otherUser.avatar || '';
              const displayName = otherUser.fullname || otherUser.name || otherUser.username || '?';
              const initials = displayName.charAt(0).toUpperCase();

              return (
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
                        src={userAvatar} 
                        className="chat-avatar"
                        sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}
                      >
                        {!userAvatar && initials}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Box className="chat-item-header">
                      <Typography className="chat-item-name">
                        {otherUser.fullname || otherUser.name || otherUser.username}
                      </Typography>
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
              );
            })
          ) : (
            <Box className="chat-empty-state">
              <ForumIcon sx={{ fontSize: 64, opacity: 0.1, mb: 2 }} />
              <Typography variant="h6">No learners found</Typography>
              <Typography variant="body2">Find a peer and start sharing knowledge!</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default ChatListPage;
