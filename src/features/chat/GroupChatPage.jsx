import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  InfoOutlined as InfoIcon,
  PersonAddOutlined as AddPersonIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import './Chat.css';

const GroupChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Modals state
  const [openInfo, setOpenInfo] = useState(false);
  const [openAddMembers, setOpenAddMembers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Load group details and users
  const loadGroupDetails = async () => {
    const data = await socialStore.getGroupById(groupId);
    if (data) {
      setGroup(data);
      setMessages(data.messages || []);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
      // Setup polling interval to emulate real-time updates
      const interval = setInterval(loadGroupDetails, 3000);
      return () => clearInterval(interval);
    }
  }, [groupId]);

  // Load all users to be able to add members
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('/users', { headers });
        if (res.ok) {
          const list = await res.json();
          // Exclude current members
          if (group) {
            const filtered = list.filter(u => !group.members.some(m => Number(m.id) === Number(u.id)));
            setAllUsers(filtered);
          } else {
            setAllUsers(list.filter(u => u.id !== user.id));
          }
        }
      } catch (err) {
        console.error('Failed to fetch learners:', err);
      }
    };
    if (openAddMembers || openInfo) {
      fetchUsers();
    }
  }, [openAddMembers, openInfo, group]);

  // Scroll to bottom when messages list size changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !group) return;

    const senderName = user.fullname || user.name || user.username || "You";
    const senderAvatar = user.avatar || "";

    const msg = await socialStore.sendGroupMessage(
      groupId,
      user.id,
      senderName,
      senderAvatar,
      inputText
    );

    if (msg) {
      setMessages(prev => [...prev, msg]);
      setInputText('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedNewMembers.length === 0) return;
    
    await socialStore.addGroupMembers(groupId, selectedNewMembers);
    setSelectedNewMembers([]);
    setOpenAddMembers(false);
    loadGroupDetails();
  };

  if (!group) {
    return (
      <Box className="chat-page-container">
        <Paper className="chat-window glass-panel-strong">
          <Box className="chat-empty-state">
            <Typography variant="body1">Loading Group Chat...</Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  const initials = group.name.substring(0, 2).toUpperCase();

  return (
    <Box className="chat-page-container">
      <Paper className="chat-window glass-panel-strong" sx={{ position: 'relative' }}>
        
        {/* Header */}
        <Box className="chat-header">
          <IconButton onClick={() => navigate('/chats')} className="chat-back-btn">
            <ArrowBackIcon />
          </IconButton>
          
          <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', flexGrow: 1 }}
            onClick={() => setOpenInfo(true)}
          >
            <Avatar 
              src={group.avatar} 
              className="chat-header-avatar"
              sx={{ bgcolor: 'primary.light', color: 'white', fontWeight: 'bold', borderRadius: 4 }}
            >
              {!group.avatar && initials}
            </Avatar>
            <Box>
              <Typography variant="h6" className="chat-header-name">{group.name}</Typography>
              <Typography variant="caption" className="chat-header-status">
                {group.members.length} members • View Info
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={() => setOpenInfo(true)} sx={{ color: 'var(--text-primary)' }}>
            <InfoIcon />
          </IconButton>
        </Box>

        {/* Message Feed */}
        <Box 
          className="chat-messages"
          ref={scrollContainerRef}
          sx={{ position: 'relative', px: 3, py: 2 }}
        >
          {messages.map((msg) => {
            const isMe = Number(msg.senderId) === Number(user.id);
            const senderInitials = msg.senderName.charAt(0).toUpperCase();
            
            return (
              <Box 
                key={msg.id} 
                className={`message-bubble-wrapper ${isMe ? 'is-me' : 'is-other'}`}
                sx={{ mb: 2 }}
              >
                {!isMe && (
                  <Avatar 
                    src={msg.senderAvatar} 
                    sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}
                  >
                    {!msg.senderAvatar && senderInitials}
                  </Avatar>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  {!isMe && (
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 0.25, ml: 1, fontSize: '0.75rem' }}>
                      {msg.senderName}
                    </Typography>
                  )}
                  <Paper className={`message-bubble ${isMe ? 'me' : 'other'}`} sx={{ mt: 0 }}>
                    <Typography variant="body1">{msg.text}</Typography>
                    <Typography variant="caption" className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Text Composer */}
        <Box component="form" onSubmit={handleSendMessage} className="chat-input-area">
          <TextField
            fullWidth
            placeholder="Message group..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            variant="outlined"
            size="small"
            className="chat-input-field"
            InputProps={{
              sx: { borderRadius: 4, pr: 0.5 }
            }}
          />
          <IconButton 
            type="submit" 
            className="chat-send-btn animate-fade-in"
            disabled={!inputText.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* GROUP INFO DIALOG */}
      <Dialog 
        open={openInfo} 
        onClose={() => setOpenInfo(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Group Information</span>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<AddPersonIcon />}
            onClick={() => setOpenAddMembers(true)}
            sx={{ textTransform: 'none', borderRadius: 3 }}
          >
            Add
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Avatar 
                src={group.avatar} 
                sx={{ width: 72, height: 72, fontSize: '2rem', bgcolor: 'primary.light', borderRadius: 4 }}
              >
                {initials}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{group.name}</Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {group.description || "No description provided."}
              </Typography>
            </Box>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Group Members ({group.members.length})
            </Typography>

            <List sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {group.members.map((memberId) => {
                const isUserMe = memberId === user.id;
                const memberAvatar = localStorage.getItem(`avatar_${memberId}`) || '';
                
                // Render list item
                return (
                  <ListItem key={memberId} sx={{ px: 0, py: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar src={memberAvatar} sx={{ width: 32, height: 32, fontSize: '0.85rem' }} />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={isUserMe ? "You" : `User #${memberId}`} 
                      secondary={isUserMe ? "Group Creator/Member" : "Learner"}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInfo(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ADD MEMBERS DIALOG */}
      <Dialog 
        open={openAddMembers} 
        onClose={() => setOpenAddMembers(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Add Members</DialogTitle>
        <DialogContent dividers>
          {allUsers.length > 0 ? (
            <FormGroup sx={{ maxHeight: 250, overflowY: 'auto' }}>
              {allUsers.map((learner) => (
                <FormControlLabel
                  key={learner.id}
                  control={
                    <Checkbox 
                      checked={selectedNewMembers.includes(learner.id)} 
                      onChange={() => {
                        setSelectedNewMembers(prev => 
                          prev.includes(learner.id) 
                            ? prev.filter(id => id !== learner.id) 
                            : [...prev, learner.id]
                        );
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={localStorage.getItem(`avatar_${learner.id}`) || learner.avatar} 
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                      >
                        {(learner.fullname || learner.name || learner.username).charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">
                        {learner.fullname || learner.name || learner.username}
                      </Typography>
                    </Box>
                  }
                  sx={{ py: 0.5 }}
                />
              ))}
            </FormGroup>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              All available learners are already members of this group.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddMembers(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button 
            onClick={handleAddMembersSubmit} 
            variant="contained" 
            disabled={selectedNewMembers.length === 0}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Add Selected
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupChatPage;
