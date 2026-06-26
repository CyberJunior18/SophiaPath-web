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
  Popover,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ImageEditorModal from './ImageEditorModal';
import './Chat.css';

const ChatPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, blockUser, unblockUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [openProfile, setOpenProfile] = useState(false);
  const [targetUserDetails, setTargetUserDetails] = useState(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  
  const hasInitialScrolled = useRef(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState('');
  const [editorShowSend, setEditorShowSend] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditorImageSrc(reader.result);
        setEditorShowSend(false);
        setEditorOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const sendEditedImage = async (editedBase64) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const finalMsg = `[IMAGE]:${editedBase64}`;
      const payload = {
        senderId: Number(user.id),
        recipientId: Number(userId),
        message: finalMsg,
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
        setEditorOpen(false);
        
        // Unarchive check
        const archivedList = JSON.parse(localStorage.getItem(`sophiapath_archived_chats_${user.id}`) || '[]');
        if (archivedList.includes(Number(userId)) || archivedList.includes(String(userId))) {
          const updated = archivedList.filter(id => Number(id) !== Number(userId));
          localStorage.setItem(`sophiapath_archived_chats_${user.id}`, JSON.stringify(updated));
        }

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    } catch (err) {
      console.error('Failed to send edited image:', err);
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
  };



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

          const deletedObj = JSON.parse(localStorage.getItem(`sophiapath_deleted_chats_${user.id}`) || '{}');
          const deleteTime = deletedObj[userId];
          const filtered = deleteTime
            ? mapped.filter(msg => new Date(msg.timestamp).getTime() > new Date(deleteTime).getTime())
            : mapped;

          setMessages(filtered);
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
    if (!inputText.trim() && !selectedImage) return;

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let finalMsg = inputText;
      if (selectedImage) {
        finalMsg = `[IMAGE]:${selectedImage}${inputText ? `|${inputText}` : ''}`;
      }

      const payload = {
        senderId: Number(user.id),
        recipientId: Number(userId),
        message: finalMsg,
        username: user.username || 'learner',
        avatar: user.avatar || ''
      };

      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const archivedList = JSON.parse(localStorage.getItem(`sophiapath_archived_chats_${user.id}`) || '[]');
        if (archivedList.includes(Number(userId)) || archivedList.includes(String(userId))) {
          const updated = archivedList.filter(id => Number(id) !== Number(userId));
          localStorage.setItem(`sophiapath_archived_chats_${user.id}`, JSON.stringify(updated));
        }

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
        setSelectedImage(null);
        
        // Smooth scroll to bottom immediately upon user message submittal
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const isUserOnline = (otherUser) => {
    if (!otherUser || !otherUser.lastActiveTime) return false;
    const diffMs = Date.now() - new Date(otherUser.lastActiveTime).getTime();
    return diffMs < 12000;
  };

  const isBlockedByTarget = targetUserDetails?.blockedUserIds?.includes(String(user?.id));
  const isBlockedByMe = user?.blockedUserIds?.includes(String(userId));
  const isOnline = targetUserDetails && isUserOnline(targetUserDetails);
  const badgeColor = (isBlockedByTarget || isBlockedByMe) ? "default" : (isOnline ? "success" : "default");
  
  let statusText = isOnline ? "Online" : "Offline";
  if (isBlockedByMe) statusText = "Blocked";
  else if (isBlockedByTarget) statusText = "You were blocked";

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
            <Badge 
              overlap="circular" 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color={badgeColor}
              className="status-badge"
            >
              <Avatar 
                src={resolvedAvatar} 
                className="chat-header-avatar"
                sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold', cursor: resolvedAvatar ? 'pointer' : 'default' }}
                onClick={(e) => {
                  if (resolvedAvatar) {
                    e.stopPropagation();
                    setLightboxUrl(resolvedAvatar);
                    setLightboxOpen(true);
                  }
                }}
              >
                {!resolvedAvatar && initials}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="h6" className="chat-header-name">{displayName}</Typography>
              <Typography variant="caption" className="chat-header-status">
                {statusText} • View Profile
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box 
          className="chat-messages"
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{ position: 'relative' }}
        >
          {messages.map((msg) => {
            const isImageMsg = msg.text?.startsWith('[IMAGE]:');
            let imageUrl = '';
            let caption = '';
            if (isImageMsg) {
              const parts = msg.text.substring(8).split('|');
              imageUrl = parts[0];
              caption = parts[1] || '';
            }

            return (
              <Box 
                key={msg.id} 
                className={`message-bubble-wrapper ${msg.senderId === user.id ? 'is-me' : 'is-other'}`}
              >
                <Paper className={`message-bubble ${msg.senderId === user.id ? 'me' : 'other'}`}>
                  {isImageMsg ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <img 
                        src={imageUrl} 
                        alt="chat attachment"
                        style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: 8, cursor: 'pointer', objectFit: 'cover' }} 
                        onClick={() => {
                          setLightboxUrl(imageUrl);
                          setLightboxOpen(true);
                        }}
                      />
                      {caption && <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{caption}</Typography>}
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</Typography>
                  )}
                  <Typography variant="caption" className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            );
          })}
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

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleImageSelect} 
        />

        {selectedImage && (
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'action.hover', borderTop: '1px solid divider' }}>
            <img src={selectedImage} alt="preview" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" color="text.secondary">Selected Image</Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => {
                setEditorImageSrc(selectedImage);
                setEditorShowSend(false);
                setEditorOpen(true);
              }}
              sx={{ mr: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setSelectedImage(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box className="chat-input-area">
          <TextField
            fullWidth
            placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
            variant="outlined"
            multiline
            maxRows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-text-field"
            InputProps={{
              sx: { borderRadius: 4, pl: 1 },
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton 
                    size="small" 
                    onClick={(e) => setEmojiAnchor(e.currentTarget)}
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    <EmojiIcon fontSize="small" />
                  </IconButton>

                  <IconButton 
                    size="small" 
                    onClick={() => fileInputRef.current.click()}
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    <AttachFileIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            className="chat-send-btn"
            disabled={!inputText.trim() && !selectedImage}
          >
            <SendIcon />
          </IconButton>
        </Box>

        <Popover
          open={Boolean(emojiAnchor)}
          anchorEl={emojiAnchor}
          onClose={() => setEmojiAnchor(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{ sx: { p: 1, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5, p: 0.5 }}>
            {['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '❤️', '🎉', '🔥', '🚀', '🤔', '👏', '🌟', '🙏', '💯', '✨'].map(emoji => (
              <IconButton 
                key={emoji} 
                size="small" 
                onClick={() => handleEmojiClick(emoji)}
                sx={{ fontSize: '1.25rem' }}
              >
                {emoji}
              </IconButton>
            ))}
          </Box>
        </Popover>


      </Paper>

      {/* Other User Profile Dialog */}
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 3 }}>
          Learner Profile
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3 }}>
          <Avatar
            src={localStorage.getItem(`avatar_${userId}`) || targetUserDetails?.avatar || ''}
            sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 'bold', cursor: (localStorage.getItem(`avatar_${userId}`) || targetUserDetails?.avatar) ? 'pointer' : 'default' }}
            onClick={() => {
              const url = localStorage.getItem(`avatar_${userId}`) || targetUserDetails?.avatar || '';
              if (url) {
                setLightboxUrl(url);
                setLightboxOpen(true);
              }
            }}
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
          {user.id !== Number(userId) && (
            <Button
              variant="outlined"
              color={user.blockedUserIds?.includes(String(userId)) ? "primary" : "error"}
              onClick={async () => {
                const isBlocked = user.blockedUserIds?.includes(String(userId));
                if (isBlocked) {
                  await unblockUser(userId);
                } else {
                  await blockUser(userId);
                }
                setOpenProfile(false);
              }}
              sx={{ mt: 3, borderRadius: 3, textTransform: 'none', width: '90%' }}
            >
              {user.blockedUserIds?.includes(String(userId)) ? "Unblock User" : "Block User"}
            </Button>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setOpenProfile(false)} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PROFILE PICTURE LIGHTBOX */}
      <Dialog 
        open={lightboxOpen} 
        onClose={() => setLightboxOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          {displayName}'s Avatar
        </Typography>
        {lightboxUrl ? (
          <img 
            src={lightboxUrl} 
            alt={displayName} 
            style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'cover' }}
          />
        ) : (
          <Avatar sx={{ width: 200, height: 200, fontSize: '5rem', bgcolor: 'primary.main', fontWeight: 'bold', mb: 2 }}>
            {initials}
          </Avatar>
        )}
        <Stack direction="row" spacing={2} sx={{ mt: 2.5, width: '100%', justifyContent: 'center' }}>
          <Button 
            onClick={() => setLightboxOpen(false)} 
            variant="outlined" 
            sx={{ px: 3, textTransform: 'none', borderRadius: 2 }}
          >
            Close
          </Button>
          {lightboxUrl && (
            <Button
              onClick={() => {
                setEditorImageSrc(lightboxUrl);
                setEditorShowSend(true);
                setEditorOpen(true);
                setLightboxOpen(false);
              }}
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              sx={{ px: 3, textTransform: 'none', borderRadius: 2 }}
            >
              Edit Image
            </Button>
          )}
        </Stack>
      </Dialog>

      <ImageEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        imageSrc={editorImageSrc}
        onSave={(editedBase64) => {
          setSelectedImage(editedBase64);
          setEditorOpen(false);
        }}
        showSendButton={editorShowSend}
        onSend={(editedBase64) => {
          sendEditedImage(editedBase64);
        }}
      />
    </Box>
  );
};

export default ChatPage;
