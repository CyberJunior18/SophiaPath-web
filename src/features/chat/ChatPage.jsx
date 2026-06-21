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
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Chat.css';

const ChatPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [openProfile, setOpenProfile] = useState(false);
  const [targetUserDetails, setTargetUserDetails] = useState(null);
  
  const hasInitialScrolled = useRef(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const targetUser = location.state?.targetUser || { id: userId, name: 'User' };
  const resolvedUser = targetUserDetails || targetUser;
  const resolvedAvatar = localStorage.getItem(`avatar_${userId}`) || resolvedUser.avatar || '';
  const displayName = resolvedUser.fullname || resolvedUser.name || resolvedUser.username || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  // Load target user profile details from backend
  useEffect(() => {
    const fetchTargetDetails = async () => {
      try {
        const res = await fetch('/users');
        if (res.ok) {
          const usersList = await res.json();
          const found = usersList.find(u => Number(u.id) === Number(userId));
          if (found) {
            setTargetUserDetails(found);
          }
        }
      } catch (err) {
        console.error('Failed to load target user details:', err);
      }
    };
    if (userId) {
      fetchTargetDetails();
    }
  }, [userId]);

  // Load messages from backend API
  useEffect(() => {
    const fetchChatMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const res = await fetch(`/api/chat/conversation/${user?.id}/${userId}`, { headers });
        if (res.ok) {
          const chatHistory = await res.json();
          // Map backend ChatMessage properties to frontend expectations
          const mapped = chatHistory.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            text: msg.message,
            timestamp: msg.timestamp
          }));
          setMessages(mapped);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    if (user?.id && userId) {
      fetchChatMessages();
      
      // Setup a basic polling interval for real-time emulation since we are on REST
      const interval = setInterval(fetchChatMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [user?.id, userId]);

  // Scroll to bottom only once on initial load
  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrolled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      hasInitialScrolled.current = true;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show arrow down button if user scrolled up by more than 150px
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottomBtn(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        senderId: Number(user.id),
        recipientId: Number(userId),
        message: inputText,
        username: user.username || 'learner',
        avatar: user.avatar || ''
      };

      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const responseData = await res.json();
        const msg = responseData.message;
        
        const newMessage = {
          id: msg.id,
          senderId: msg.senderId,
          text: msg.message,
          timestamp: msg.timestamp
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        
        // Smooth scroll to bottom immediately upon user message submittal
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <Box className="chat-page-container">
      <Paper className="chat-window glass-panel-strong" sx={{ position: 'relative' }}>
        <Box className="chat-header">
          <IconButton onClick={() => navigate(-1)} className="chat-back-btn">
            <ArrowBackIcon />
          </IconButton>
          
          <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
            onClick={() => setOpenProfile(true)}
          >
            <Avatar 
              src={resolvedAvatar} 
              className="chat-header-avatar"
              sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}
            >
              {!resolvedAvatar && initials}
            </Avatar>
            <Box>
              <Typography variant="h6" className="chat-header-name">{displayName}</Typography>
              <Typography variant="caption" className="chat-header-status">Online • View Profile</Typography>
            </Box>
          </Box>
        </Box>

        <Box 
          className="chat-messages"
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{ position: 'relative' }}
        >
          {messages.map((msg) => (
            <Box 
              key={msg.id} 
              className={`message-bubble-wrapper ${msg.senderId === user.id ? 'is-me' : 'is-other'}`}
            >
              <Paper className={`message-bubble ${msg.senderId === user.id ? 'me' : 'other'}`}>
                <Typography variant="body1">{msg.text}</Typography>
                <Typography variant="caption" className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {showScrollBottomBtn && (
          <IconButton
            onClick={scrollToBottom}
            sx={{
              position: 'absolute',
              bottom: 85,
              right: 24,
              backgroundColor: '#10b981',
              color: 'white',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              '&:hover': {
                backgroundColor: '#059669',
                transform: 'scale(1.15)',
                boxShadow: '0 6px 24px rgba(16, 185, 129, 0.6)'
              },
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        )}

        <Divider />

        <Box component="form" onSubmit={handleSendMessage} className="chat-input-area">
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-text-field"
            InputProps={{
              sx: { borderRadius: 4 }
            }}
          />
          <IconButton 
            color="primary" 
            type="submit" 
            className="chat-send-btn"
            disabled={!inputText.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Other User Profile Dialog */}
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 3 }}>
          Learner Profile
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3 }}>
          <Avatar
            src={localStorage.getItem(`avatar_${userId}`) || targetUserDetails?.avatar || ''}
            sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 'bold' }}
          >
            {!(localStorage.getItem(`avatar_${userId}`) || targetUserDetails?.avatar) && initials}
          </Avatar>
          
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {targetUserDetails?.fullname || displayName}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {targetUserDetails?.tag || 'Sophiapath Learner'}
          </Typography>

          <Divider sx={{ width: '100%', mb: 3 }} />

          <Stack spacing={2} sx={{ width: '100%', px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FingerprintIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Username</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  @{targetUserDetails?.username || targetUser.username || 'learner'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Gender / Age</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {targetUserDetails?.gender || 'Rather Not Say'} • {targetUserDetails?.age || 20} years old
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Joined</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {targetUserDetails?.dateTime ? new Date(targetUserDetails.dateTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setOpenProfile(false)} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;
