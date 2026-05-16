import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
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

  const targetUser = location.state?.targetUser || { id: userId, name: 'User' };

  // Load messages from localStorage
  useEffect(() => {
    const chatId = [user.id, userId].sort().join('_');
    const savedMessages = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
    setMessages(savedMessages);
  }, [user.id, userId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      senderId: user.id,
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');

    const chatId = [user.id, userId].sort().join('_');
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages));
  };

  return (
    <Box className="chat-page-container">
      <Paper className="chat-window glass-panel-strong">
        <Box className="chat-header">
          <IconButton onClick={() => navigate(-1)} className="chat-back-btn">
            <ArrowBackIcon />
          </IconButton>
          <Avatar 
            src={targetUser.avatar || `https://i.pravatar.cc/150?u=${targetUser.id}`} 
            className="chat-header-avatar"
          />
          <Box>
            <Typography variant="h6" className="chat-header-name">{targetUser.name}</Typography>
            <Typography variant="caption" className="chat-header-status">Online</Typography>
          </Box>
        </Box>

        <Box className="chat-messages">
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
    </Box>
  );
};

export default ChatPage;
