import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Badge,
  Menu,
  MenuItem,
  Snackbar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText
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
  Edit as EditIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  PushPin as PushPinIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ForwardToInbox as ForwardIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
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
  const [lightboxIsProfile, setLightboxIsProfile] = useState(false);
  
  const hasInitialScrolled = useRef(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState('');
  const [editorShowSend, setEditorShowSend] = useState(false);
  const [pendingImagesQueue, setPendingImagesQueue] = useState([]);

  // New Chat States
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [openPinnedDialog, setOpenPinnedDialog] = useState(false);
  
  // Context Menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuMessage, setMenuMessage] = useState(null);

  const [headerMenuAnchor, setHeaderMenuAnchor] = useState(null);
  const [openClearConfirm, setOpenClearConfirm] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);

  const initialMessageIds = useRef(new Set());

  const displayedMessages = useMemo(() => {
    const clearTime = localStorage.getItem(`sophiapath_clear_time_${user?.id}_${userId}`);
    const filtered = clearTime
      ? messages.filter(m => new Date(m.timestamp).getTime() > new Date(clearTime).getTime())
      : messages;

    if (filtered.length > 0 && initialMessageIds.current.size === 0) {
      filtered.forEach(m => initialMessageIds.current.add(String(m.id)));
    }
    return filtered;
  }, [messages, userId, user?.id, clearTrigger]);

  const [sessionLastSeenId, setSessionLastSeenId] = useState(null);
  const [sessionLastSeen, setSessionLastSeen] = useState(null);

  useEffect(() => {
    initialMessageIds.current = new Set();
  }, [userId]);

  useEffect(() => {
    if (!userId || !user?.id) return;
    const lastId = localStorage.getItem(`sophiapath_last_seen_id_${user.id}_${userId}`);
    const stored = localStorage.getItem(`sophiapath_last_seen_${user.id}_${userId}`);
    setSessionLastSeenId(lastId);
    setSessionLastSeen(stored || new Date().toISOString());
  }, [userId, user?.id]);

  useEffect(() => {
    if (userId && user?.id && displayedMessages.length > 0) {
      const lastMsg = displayedMessages[displayedMessages.length - 1];
      if (lastMsg) {
        localStorage.setItem(`sophiapath_last_seen_id_${user.id}_${userId}`, String(lastMsg.id));
        localStorage.setItem(`sophiapath_last_seen_${user.id}_${userId}`, new Date().toISOString());
      }
    }
  }, [userId, user?.id, displayedMessages]);
  
  // Dialog / Reply / Snackbar states
  const [openForwardDialog, setOpenForwardDialog] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const sendBase64ImageMessage = async (editedBase64) => {
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
          timestamp: msg.timestamp,
          delivered: msg.delivered,
          read: msg.read,
          pinned: msg.pinned,
          deleted: msg.deleted,
          replyToId: msg.replyToId,
          replyToMessage: msg.replyToMessage,
          replyToUsername: msg.replyToUsername,
          forwarded: msg.forwarded
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Unarchive check
        const archivedList = JSON.parse(localStorage.getItem(`sophiapath_archived_chats_${user.id}`) || '[]');
        if (archivedList.includes(Number(userId)) || archivedList.includes(String(userId))) {
          const updated = archivedList.filter(id => Number(id) !== Number(userId));
          localStorage.setItem(`sophiapath_archived_chats_${user.id}`, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to send image:', err);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(dataUrls => {
      setPendingImagesQueue(dataUrls);
      setEditorOpen(true);
    });
    e.target.value = '';
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
          setAllUsers(usersList);
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
            timestamp: msg.timestamp,
            delivered: msg.delivered,
            read: msg.read,
            pinned: msg.pinned,
            deleted: msg.deleted,
            replyToId: msg.replyToId,
            replyToMessage: msg.replyToMessage,
            replyToUsername: msg.replyToUsername,
            forwarded: msg.forwarded
          }));

          const deletedObj = JSON.parse(localStorage.getItem(`sophiapath_deleted_chats_${user.id}`) || '{}');
          const deleteTime = deletedObj[userId];
          const filtered = deleteTime
            ? mapped.filter(msg => new Date(msg.timestamp).getTime() > new Date(deleteTime).getTime())
            : mapped;

          setMessages(filtered);
        }

        // Fetch other user's typing status
        const typingRes = await fetch(`/api/chat/typing/${user?.id}/${userId}`, { headers });
        if (typingRes.ok) {
          const typingData = await typingRes.json();
          setIsOtherUserTyping(typingData.typing);
        }
      } catch (err) {
        console.error('Failed to load chat history or typing status:', err);
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
    if (displayedMessages.length > 0 && !hasInitialScrolled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      hasInitialScrolled.current = true;
    }
  }, [displayedMessages]);

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

  // Typing Emitters
  const typingTimeoutRef = useRef(null);
  const lastTypingStatusRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const sendTypingStatus = async (typing) => {
    if (!user?.id || !userId) return;
    if (lastTypingStatusRef.current === typing) return;
    lastTypingStatusRef.current = typing;

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: Number(user.id),
          recipientId: Number(userId),
          username: user.username || 'learner',
          typing
        })
      });
    } catch (err) {
      console.error('Failed to update typing status:', err);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 3000);
  };

  // Scroll and highlight
  const handleScrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightMessageId(msgId);
      setTimeout(() => {
        setHighlightMessageId(null);
      }, 2000);
    }
  };

  // Auto scroll to message from query parameter on load
  const queryParams = new URLSearchParams(location.search);
  const searchMessageId = queryParams.get('messageId');

  useEffect(() => {
    if (displayedMessages.length > 0 && searchMessageId) {
      const timeout = setTimeout(() => {
        handleScrollToMessage(searchMessageId);
        navigate(location.pathname, { replace: true });
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [displayedMessages.length, searchMessageId]);

  // Context Menu Actions
  const handleMessageBubbleClick = (event, msg) => {
    if (msg.deleted) return;
    setMenuAnchor(event.currentTarget);
    setMenuMessage(msg);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuMessage(null);
  };

  const handleCopyMessage = () => {
    if (menuMessage) {
      const cleanText = menuMessage.text.startsWith('[IMAGE]:') 
        ? menuMessage.text.split('|')[1] || '' 
        : menuMessage.text;
      navigator.clipboard.writeText(cleanText);
      setSnackbarMessage("Copied to clipboard!");
      setOpenSnackbar(true);
    }
    handleCloseMenu();
  };

  const handlePinToggle = async () => {
    if (menuMessage) {
      const newPinState = !menuMessage.pinned;
      const success = await socialStore.pinMessage(menuMessage.id, newPinState);
      if (success) {
        setMessages(prev => prev.map(m => m.id === menuMessage.id ? { ...m, pinned: newPinState } : m));
        setSnackbarMessage(newPinState ? "Message pinned!" : "Message unpinned!");
        setOpenSnackbar(true);
      }
    }
    handleCloseMenu();
  };

  const handleDeleteMessage = async () => {
    if (menuMessage && Number(menuMessage.senderId) === Number(user?.id)) {
      const success = await socialStore.deleteMessage(menuMessage.id, user.id);
      if (success) {
        setMessages(prev => prev.map(m => m.id === menuMessage.id ? { ...m, deleted: true, text: 'This message was deleted' } : m));
        setSnackbarMessage("Message deleted!");
        setOpenSnackbar(true);
      }
    }
    handleCloseMenu();
  };

  const handleForwardClick = () => {
    setOpenForwardDialog(true);
    setMenuAnchor(null);
  };

  const handleForwardMessage = async (recipient) => {
    if (!menuMessage) return;
    const cleanText = menuMessage.text;
    const senderName = user.fullname || user.name || user.username || "You";

    const res = await socialStore.sendDirectMessage(
      user.id,
      recipient.id,
      cleanText,
      senderName,
      user.avatar || '',
      null,
      null,
      null,
      true
    );

    if (res && res.success) {
      setSnackbarMessage(`Forwarded to ${recipient.fullname || recipient.username}`);
      setOpenSnackbar(true);
    }
    setOpenForwardDialog(false);
    setMenuMessage(null);
  };

  const handleReplyClick = () => {
    setReplyingMessage(menuMessage);
    handleCloseMenu();
  };

  const handleStarToggle = () => {
    if (!menuMessage) return;
    let list = JSON.parse(localStorage.getItem('starred_messages_list') || '[]');
    const isStarred = list.some(m => String(m.id) === String(menuMessage.id));
    if (isStarred) {
      list = list.filter(m => String(m.id) !== String(menuMessage.id));
      setSnackbarMessage("Message unstarred!");
    } else {
      const isImg = menuMessage.text?.startsWith('[IMAGE]:');
      const textToStore = isImg ? '[IMAGE]:' : menuMessage.text;
      list.push({
        id: menuMessage.id,
        chatPartnerId: userId,
        type: 'direct',
        text: textToStore,
        senderName: Number(menuMessage.senderId) === Number(user?.id) ? 'You' : (targetUserDetails?.fullname || targetUserDetails?.name || targetUserDetails?.username || 'user'),
        senderAvatar: Number(menuMessage.senderId) === Number(user?.id) ? user.avatar : targetUserDetails?.avatar,
        timestamp: menuMessage.timestamp
      });
      setSnackbarMessage("Message starred!");
    }
    
    // Clean existing entries with heavy image strings to free up storage space
    const cleaned = list.map(m => {
      if (m.text && m.text.startsWith('[IMAGE]:') && m.text.length > 500) {
        return { ...m, text: '[IMAGE]:' };
      }
      return m;
    });

    try {
      localStorage.setItem('starred_messages_list', JSON.stringify(cleaned));
    } catch (err) {
      console.warn("Storage quota exceeded, pruning avatar cache and starred list...", err);
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('avatar_')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem('starred_messages_list', JSON.stringify(cleaned));
      } catch (retryErr) {
        try {
          localStorage.setItem('starred_messages_list', JSON.stringify(cleaned.slice(-10)));
        } catch (e) {
          localStorage.removeItem('starred_messages_list');
        }
      }
    }
    setOpenSnackbar(true);
    handleCloseMenu();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    try {
      let finalMsg = inputText;
      if (selectedImage) {
        finalMsg = `[IMAGE]:${selectedImage}${inputText ? `|${inputText}` : ''}`;
      }

      const responseData = await socialStore.sendDirectMessage(
        user.id,
        userId,
        finalMsg,
        user.username || 'learner',
        user.avatar || '',
        replyingMessage ? replyingMessage.id : null,
        replyingMessage ? (replyingMessage.text.startsWith('[IMAGE]:') ? '📷 Photo' : replyingMessage.text) : null,
        replyingMessage ? (replyingMessage.senderId === user.id ? 'You' : resolvedUser.username) : null,
        false
      );

      if (responseData && responseData.success) {
        const archivedList = JSON.parse(localStorage.getItem(`sophiapath_archived_chats_${user.id}`) || '[]');
        if (archivedList.includes(Number(userId)) || archivedList.includes(String(userId))) {
          const updated = archivedList.filter(id => Number(id) !== Number(userId));
          localStorage.setItem(`sophiapath_archived_chats_${user.id}`, JSON.stringify(updated));
        }

        const msg = responseData.message;
        
        const newMessage = {
          id: msg.id,
          senderId: msg.senderId,
          text: msg.message,
          timestamp: msg.timestamp,
          delivered: msg.delivered,
          read: msg.read,
          pinned: msg.pinned,
          deleted: msg.deleted,
          replyToId: msg.replyToId,
          replyToMessage: msg.replyToMessage,
          replyToUsername: msg.replyToUsername,
          forwarded: msg.forwarded
        };

        setMessages(prev => [...prev, newMessage]);
        setSessionLastSeenId(null);
        setSessionLastSeen(new Date().toISOString());
        setInputText('');
        setSelectedImage(null);
        setReplyingMessage(null);

        // Turn off typing immediately
        sendTypingStatus(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
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

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">Loading chat context...</Typography>
      </Box>
    );
  }

  return (
    <Box className="chat-page-container">
      <Paper className="chat-window glass-panel-strong" sx={{ position: 'relative' }}>
        <Box className="chat-header">
          <IconButton onClick={() => navigate('/chats?tab=dms')} className="chat-back-btn">
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
                    setLightboxIsProfile(true);
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

          <IconButton 
            onClick={(e) => setHeaderMenuAnchor(e.currentTarget)} 
            sx={{ color: 'var(--text-primary)', ml: 'auto' }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Pinned Messages Banner */}
        {displayedMessages.filter(m => m.pinned && !m.deleted).length > 0 && (
          <Box sx={{ 
            bgcolor: 'background.paper', 
            borderBottom: '1px solid var(--divider)', 
            p: 1, 
            px: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            zIndex: 10
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              📌 Pinned Messages ({displayedMessages.filter(m => m.pinned && !m.deleted).length})
            </Typography>
            <Button 
              size="small" 
              onClick={() => setOpenPinnedDialog(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              View Pinned
            </Button>
          </Box>
        )}

        <Box 
          className="chat-messages"
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{ position: 'relative' }}
        >
          {(() => {
            let renderedUnseenBar = false;
            const lastSeenIndex = sessionLastSeenId
              ? displayedMessages.findIndex(m => String(m.id) === String(sessionLastSeenId))
              : -1;

            return displayedMessages.map((msg, msgIdx) => {
              const isImageMsg = msg.text?.startsWith('[IMAGE]:') && !msg.deleted;
              let imageUrl = '';
              let caption = '';
              if (isImageMsg) {
                const parts = msg.text.substring(8).split('|');
                imageUrl = parts[0];
                caption = parts[1] || '';
              }

              const isMe = Number(msg.senderId) === Number(user.id);
              
              const isAfterLastSeen = lastSeenIndex !== -1
                ? msgIdx > lastSeenIndex
                : sessionLastSeen
                  ? new Date(msg.timestamp).getTime() > new Date(sessionLastSeen).getTime()
                  : false;

              const isUnseen = !isMe && isAfterLastSeen && initialMessageIds.current.has(String(msg.id));
              const showUnseenBar = isUnseen && !renderedUnseenBar;
              if (showUnseenBar) {
                renderedUnseenBar = true;
              }

              return (
                <React.Fragment key={msg.id}>
                  {showUnseenBar && (
                    <Box 
                      className="unseen-messages-bar" 
                      sx={{ 
                        width: '100%', 
                        py: 1, 
                        my: 2, 
                        bgcolor: 'rgba(61,92,255,0.08)', 
                        borderTop: '1px solid rgba(61,92,255,0.15)', 
                        borderBottom: '1px solid rgba(61,92,255,0.15)', 
                        color: 'var(--primary-color)',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.05em',
                        borderRadius: 1,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(61,92,255,0.03)'
                      }}
                    >
                      Unseen Messages
                    </Box>
                  )}
                  <Box 
                    id={`msg-${msg.id}`}
                    className={`message-bubble-wrapper ${isMe ? 'is-me' : 'is-other'}`}
                    sx={{ gap: 1.5, mb: 1, alignItems: 'flex-end' }}
                  >
                    {!isMe && (
                      <Avatar 
                        src={resolvedAvatar} 
                        sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main', cursor: resolvedAvatar ? 'pointer' : 'default', mb: 0.5 }}
                        onClick={() => {
                          if (resolvedAvatar) {
                            setLightboxUrl(resolvedAvatar);
                            setLightboxName(displayName);
                            setLightboxOpen(true);
                          }
                        }}
                      >
                        {!resolvedAvatar && initials}
                      </Avatar>
                    )}
                    <Paper 
                      className={`message-bubble ${isMe ? 'me' : 'other'} ${msg.id === highlightMessageId ? 'pulse-highlight' : ''}`}
                      onClick={(e) => handleMessageBubbleClick(e, msg)}
                      sx={{
                        transition: 'all 0.5s ease',
                        cursor: msg.deleted ? 'default' : 'pointer',
                        position: 'relative',
                        border: msg.id === highlightMessageId ? '1.5px solid #FFD54F' : 'none',
                        boxShadow: msg.id === highlightMessageId ? '0 0 12px rgba(255, 213, 79, 0.6)' : undefined,
                        backgroundColor: msg.id === highlightMessageId 
                          ? '#FFF9C4 !important' 
                          : undefined
                      }}
                    >
                      {msg.forwarded && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5, 
                            fontStyle: 'italic', 
                            color: isMe ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                            mb: 0.5
                          }}
                        >
                          <ForwardIcon sx={{ fontSize: 12 }} /> Forwarded
                        </Typography>
                      )}

                      {msg.replyToId && (
                        <Box 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScrollToMessage(msg.replyToId);
                          }}
                          sx={{ 
                            borderLeft: `3px solid ${isMe ? '#fff' : 'var(--primary-color)'}`,
                            pl: 1, 
                            mb: 1, 
                            cursor: 'pointer',
                            bgcolor: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
                            borderRadius: '0 4px 4px 0',
                            p: 0.75
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: isMe ? '#fff' : 'primary.main' }}>
                            {msg.replyToUsername}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isMe ? 'rgba(255,255,255,0.8)' : 'text.secondary', display: 'block' }} noWrap>
                            {msg.replyToMessage}
                          </Typography>
                        </Box>
                      )}

                      {msg.deleted ? (
                        <Typography variant="body1" sx={{ fontStyle: 'italic', color: isMe ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                          This message was deleted
                        </Typography>
                      ) : isImageMsg ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <img 
                            src={imageUrl} 
                            alt="chat attachment"
                            style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: 8, cursor: 'pointer', objectFit: 'cover' }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxUrl(imageUrl);
                              setLightboxIsProfile(false);
                              setLightboxOpen(true);
                            }}
                          />
                          {caption && <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{caption}</Typography>}
                        </Box>
                      ) : (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, gap: 0.5 }}>
                        {msg.pinned && (
                          <PushPinIcon sx={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : 'text.secondary', transform: 'rotate(45deg)' }} />
                        )}
                        <Typography variant="caption" className="message-time" sx={{ m: 0 }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        {isMe && !msg.deleted && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {msg.read ? (
                              <DoneAllIcon sx={{ fontSize: 13, color: '#FFD54F' }} />
                            ) : msg.delivered ? (
                              <DoneAllIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
                            ) : (
                              <DoneIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </React.Fragment>
              );
            });
          })()}
          <div ref={messagesEndRef} />
        </Box>

        {showScrollBottomBtn && (
          <IconButton
            onClick={scrollToBottom}
            sx={{
              position: 'absolute',
              bottom: 85,
              right: 24,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.main',
                transform: 'scale(1.15)',
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
          multiple
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleImageSelect} 
        />

        {selectedImage && (
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'action.hover', borderTop: '1px solid var(--divider)' }}>
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

        {replyingMessage && (
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'action.hover', borderTop: '1px solid var(--divider)', borderBottom: '1px solid var(--divider)' }}>
            <Box sx={{ borderLeft: '3px solid var(--primary-color)', pl: 1, flexGrow: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'block' }}>
                Replying to {replyingMessage.senderId === user.id ? 'You' : resolvedUser.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: '300px' }}>
                {replyingMessage.text.startsWith('[IMAGE]:') ? '📷 Photo' : replyingMessage.text}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyingMessage(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {isOtherUserTyping && (
          <Box sx={{ px: 2.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', borderTop: '1px solid var(--divider)' }}>
            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {resolvedUser.fullname || resolvedUser.username} is typing
            </Typography>
            <Box className="typing-dots" sx={{ display: 'flex', gap: 0.35 }}>
              <span className="dot" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', display: 'inline-block' }}></span>
              <span className="dot" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', display: 'inline-block' }}></span>
              <span className="dot" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', display: 'inline-block' }}></span>
            </Box>
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
            onChange={handleInputChange}
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
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, position: 'relative' } }}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 3, pr: 7 }}>
          <IconButton
            onClick={() => setOpenProfile(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
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
                setLightboxIsProfile(true);
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
          {lightboxUrl && !lightboxIsProfile && (
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
        onClose={() => { setEditorOpen(false); setPendingImagesQueue([]); }}
        images={pendingImagesQueue}
        imageSrc={editorImageSrc}
        onSend={(editedImages) => {
          editedImages.forEach(img => {
            sendBase64ImageMessage(img);
          });
          setEditorOpen(false);
          setPendingImagesQueue([]);
        }}
      />

      {/* Context Menu on Message Bubbles */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <MenuItem onClick={handleReplyClick}>
          <ReplyIcon sx={{ mr: 1, fontSize: 20 }} /> Reply
        </MenuItem>
        <MenuItem onClick={handleStarToggle}>
          <StarIcon sx={{ mr: 1, fontSize: 20, color: '#f59e0b' }} /> {
            JSON.parse(localStorage.getItem('starred_messages_list') || '[]').some(m => String(m.id) === String(menuMessage?.id)) 
              ? "Unstar Message" 
              : "Star Message"
          }
        </MenuItem>
        <MenuItem onClick={handleCopyMessage}>
          <CopyIcon sx={{ mr: 1, fontSize: 20 }} /> Copy
        </MenuItem>
        <MenuItem onClick={handlePinToggle}>
          <PushPinIcon sx={{ mr: 1, fontSize: 20, transform: 'rotate(45deg)' }} /> {menuMessage?.pinned ? "Unpin" : "Pin"}
        </MenuItem>
        <MenuItem onClick={handleForwardClick}>
          <ForwardIcon sx={{ mr: 1, fontSize: 20 }} /> Forward
        </MenuItem>
        {Number(menuMessage?.senderId) === Number(user?.id) && (
          <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1, fontSize: 20 }} /> Delete
          </MenuItem>
        )}
      </Menu>

      {/* Pinned Messages List Dialog */}
      <Dialog open={openPinnedDialog} onClose={() => setOpenPinnedDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, position: 'relative' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', pr: 7 }}>
          <IconButton
            onClick={() => setOpenPinnedDialog(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Pinned Messages
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {messages.filter(m => m.pinned && !m.deleted).length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              No pinned messages
            </Box>
          ) : (
            <List>
              {messages.filter(m => m.pinned && !m.deleted).map(msg => {
                const isImg = msg.text.startsWith('[IMAGE]:');
                const cleanText = isImg ? '📷 Photo' : msg.text;
                const senderName = msg.senderId === user.id ? 'You' : resolvedUser.username;
                return (
                  <ListItemButton 
                    key={msg.id}
                    onClick={() => {
                      setOpenPinnedDialog(false);
                      handleScrollToMessage(msg.id);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: msg.senderId === user.id ? 'primary.main' : 'secondary.main', width: 32, height: 32, fontSize: '0.85rem' }}>
                        {senderName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={cleanText}
                      secondary={`${senderName} • ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true, sx: { fontWeight: 500 } }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Forward Message Dialog */}
      <Dialog open={openForwardDialog} onClose={() => setOpenForwardDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, position: 'relative' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', pr: 7 }}>
          <IconButton
            onClick={() => setOpenForwardDialog(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          Forward Message
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List>
            {allUsers
              .filter(u => u.id !== user?.id && !user?.blockedUserIds?.includes(String(u.id)) && !u.blockedUserIds?.includes(String(user?.id)))
              .map(target => {
                const uAvatar = localStorage.getItem(`avatar_${target.id}`) || target.avatar || '';
                const uName = target.fullname || target.name || target.username || '?';
                return (
                  <ListItemButton 
                    key={target.id}
                    onClick={() => handleForwardMessage(target)}
                  >
                    <ListItemAvatar>
                      <Avatar src={uAvatar} sx={{ width: 36, height: 36 }}>
                        {!uAvatar && uName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={uName} 
                      secondary={`@${target.username}`}
                      primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 600 } }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                );
              })}
          </List>
        </DialogContent>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Header More Options Menu */}
      <Menu
        anchorEl={headerMenuAnchor}
        open={Boolean(headerMenuAnchor)}
        onClose={() => setHeaderMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
      >
        <MenuItem onClick={() => {
          setHeaderMenuAnchor(null);
          setOpenClearConfirm(true);
        }} sx={{ fontSize: '0.85rem' }}>
          Clear Chat History
        </MenuItem>
      </Menu>

      {/* Clear Chat Confirmation Dialog */}
      <Dialog
        open={openClearConfirm}
        onClose={() => setOpenClearConfirm(false)}
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, maxWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Clear chat history?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Are you sure you want to clear your chat history with this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1.5 }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpenClearConfirm(false)}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              localStorage.setItem(`sophiapath_clear_time_${user.id}_${userId}`, new Date().toISOString());
              setClearTrigger(prev => prev + 1);
              setOpenClearConfirm(false);
            }}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;
