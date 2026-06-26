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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  Popover,
  InputAdornment,
  Switch,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  InfoOutlined as InfoIcon,
  PersonAddOutlined as AddPersonIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  AlternateEmail as EmailIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import ImageEditorModal from './ImageEditorModal';
import './Chat.css';

const GroupChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, blockUser, unblockUser } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Modals state
  const [openInfo, setOpenInfo] = useState(false);
  const [openAddMembers, setOpenAddMembers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  // Lightbox / Detail view states for group members
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [lightboxName, setLightboxName] = useState('');
  const [lightboxIsProfile, setLightboxIsProfile] = useState(false);

  const [selectedMemberInfo, setSelectedMemberInfo] = useState(null);
  const [openMemberInfo, setOpenMemberInfo] = useState(false);

  // Group Details Editing States
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');
  const [editOnlyAdminsCanEdit, setEditOnlyAdminsCanEdit] = useState(false);

  const groupAvatarInputRef = useRef(null);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const handleAvatarFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Group profile picture must be smaller than 2MB.');
      return;
    }

    setAvatarError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditGroupAvatar(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleAvatarFile(e.target.files[0]);
    }
  };

  const handleAvatarDragOver = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(true);
  };

  const handleAvatarDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const triggerAvatarFileInput = () => {
    if (groupAvatarInputRef.current) {
      groupAvatarInputRef.current.click();
    }
  };

  useEffect(() => {
    if (openInfo && group) {
      setEditGroupName(group.name || '');
      setEditGroupDescription(group.description || '');
      setEditGroupAvatar(group.avatar || '');
      setEditOnlyAdminsCanEdit(!!group.onlyAdminsCanEdit);
      setIsEditingGroup(false);
      setAvatarError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openInfo]);

  const handleSaveGroupDetails = async () => {
    if (!editGroupName.trim()) return;
    const updated = await socialStore.updateGroupDetails(groupId, user.id, {
      name: editGroupName,
      description: editGroupDescription,
      avatar: editGroupAvatar,
      onlyAdminsCanEdit: editOnlyAdminsCanEdit
    });
    if (updated) {
      setGroup(updated);
      setIsEditingGroup(false);
      loadGroupDetails();
    }
  };

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
      const finalMsg = `[IMAGE]:${editedBase64}`;
      const msg = await socialStore.sendGroupMessage(
        groupId,
        user.id,
        user.username || 'learner',
        user.avatar || '',
        finalMsg
      );

      if (msg) {
        setMessages(prev => [...prev, msg]);
        setEditorOpen(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    } catch (err) {
      console.error('Failed to send edited group image:', err);
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
  };



  // Member dropdown menu anchor state
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [menuTargetMember, setMenuTargetMember] = useState(null);

  const handleOpenMemberMenu = (event, member) => {
    event.stopPropagation();
    setMemberMenuAnchor(event.currentTarget);
    setMenuTargetMember(member);
  };

  const handleCloseMemberMenu = () => {
    setMemberMenuAnchor(null);
    setMenuTargetMember(null);
  };

  const handleToggleAdmin = async () => {
    if (!menuTargetMember || !group) return;
    const isTargetAdmin = group.adminIds?.includes(String(menuTargetMember.id));
    let updated;
    if (isTargetAdmin) {
      updated = await socialStore.removeGroupAdmin(groupId, menuTargetMember.id);
    } else {
      updated = await socialStore.makeGroupAdmin(groupId, menuTargetMember.id);
    }
    if (updated) {
      setGroup(updated);
    }
    handleCloseMemberMenu();
  };

  const sortedMembers = useMemo(() => {
    if (!group || !group.members || !user) return [];
    return [...group.members].sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      const myId = Number(user.id);
      const creatorId = Number(group.createdBy);

      // 1. "You" check
      if (aId === myId && bId !== myId) return -1;
      if (bId === myId && aId !== myId) return 1;

      // 2. Creator check
      if (aId === creatorId && bId !== creatorId) return -1;
      if (bId === creatorId && aId !== creatorId) return 1;

      // 3. Admin status check
      const aAdmin = group.adminIds?.includes(String(aId));
      const bAdmin = group.adminIds?.includes(String(bId));
      if (aAdmin && !bAdmin) return -1;
      if (!aAdmin && bAdmin) return 1;

      // 4. Alphabetical by name
      const aName = (a.fullname || a.name || a.username || '').toLowerCase();
      const bName = (b.fullname || b.name || b.username || '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [group?.members, group?.adminIds, group?.createdBy, user.id]);

  const handleRemoveMember = async () => {
    if (!menuTargetMember || !group) return;
    const updated = await socialStore.removeGroupMember(groupId, menuTargetMember.id);
    if (updated) {
      setGroup(updated);
    }
    handleCloseMemberMenu();
  };

  const handleViewMemberInfo = () => {
    if (!menuTargetMember) return;
    setSelectedMemberInfo(menuTargetMember);
    setOpenMemberInfo(true);
    handleCloseMemberMenu();
  };

  const handleViewMemberAvatar = () => {
    if (!menuTargetMember) return;
    const avatarUrl = localStorage.getItem(`avatar_${menuTargetMember.id}`) || menuTargetMember.avatar || '';
    setLightboxUrl(avatarUrl);
    setLightboxName(menuTargetMember.fullname || menuTargetMember.name || menuTargetMember.username || 'User');
    setLightboxIsProfile(true);
    setLightboxOpen(true);
    handleCloseMemberMenu();
  };

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
    if ((!inputText.trim() && !selectedImage) || !group) return;

    const senderName = user.fullname || user.name || user.username || "You";
    const senderAvatar = user.avatar || "";

    let finalMsg = inputText;
    if (selectedImage) {
      finalMsg = `[IMAGE]:${selectedImage}${inputText ? `|${inputText}` : ''}`;
    }

    const msg = await socialStore.sendGroupMessage(
      groupId,
      user.id,
      senderName,
      senderAvatar,
      finalMsg
    );

    if (msg) {
      setMessages(prev => [...prev, msg]);
      setInputText('');
      setSelectedImage(null);
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

  if (!user) {
    return (
      <Box className="chat-page-container">
        <Paper className="chat-window glass-panel-strong">
          <Box className="chat-empty-state">
            <Typography variant="body1">Loading authentication context...</Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

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

  const isCreator = group && Number(group.createdBy) === Number(user?.id);
  const isAdmin = group && (group.adminIds?.includes(String(user?.id)) || isCreator);
  const canEditGroupDetails = group && (!group.onlyAdminsCanEdit || isAdmin);
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
                    sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main', cursor: msg.senderAvatar ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (msg.senderAvatar) {
                        setLightboxUrl(msg.senderAvatar);
                        setLightboxName(msg.senderName);
                        setLightboxOpen(true);
                      }
                    }}
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
                  <Paper 
                    className={`message-bubble ${isMe ? 'me' : 'other'}`} 
                    sx={{ mt: 0, maxWidth: '100% !important', width: 'fit-content', wordBreak: 'break-word' }}
                  >
                    {msg.text?.startsWith('[IMAGE]:') ? (() => {
                      const parts = msg.text.substring(8).split('|');
                      const imageUrl = parts[0];
                      const caption = parts[1] || '';
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <img 
                            src={imageUrl} 
                            alt="group attachment"
                            style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: 8, cursor: 'pointer', objectFit: 'cover' }} 
                            onClick={() => {
                              setLightboxUrl(imageUrl);
                              setLightboxName(msg.senderName);
                              setLightboxIsProfile(false);
                              setLightboxOpen(true);
                            }}
                          />
                          {caption && (
                            <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                              {caption}
                            </Typography>
                          )}
                        </Box>
                      );
                    })() : (
                      <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </Typography>
                    )}
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
            placeholder={selectedImage ? "Add a caption..." : "Message group..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            variant="outlined"
            multiline
            maxRows={4}
            className="chat-input-field"
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
            onClick={handleSendMessage}
            className="chat-send-btn animate-fade-in"
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEditGroupDetails && !isEditingGroup && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setIsEditingGroup(true)}
                sx={{ textTransform: 'none', borderRadius: 3 }}
              >
                Edit
              </Button>
            )}
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<AddPersonIcon />}
              onClick={() => setOpenAddMembers(true)}
              sx={{ textTransform: 'none', borderRadius: 3 }}
            >
              Add
            </Button>
          </Box>
        </DialogTitle>
        {isEditingGroup ? (
          <>
            <DialogContent dividers>
              <Stack spacing={2} sx={{ py: 1 }}>
                <TextField
                  label="Group Name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 3 } }}
                />
                
                <TextField
                  label="Group Description"
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 3 } }}
                />

                  {/* Custom Avatar Upload Zone (matching ProfilePage) */}
                  <Box className="avatar-upload-section" sx={{ mb: 3 }}>
                    <input
                      type="file"
                      ref={groupAvatarInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    
                    <Box 
                      className={`avatar-dropzone ${isDraggingAvatar ? 'dragging' : ''}`}
                      onDragOver={handleAvatarDragOver}
                      onDragLeave={handleAvatarDragLeave}
                      onDrop={handleAvatarDrop}
                      onClick={triggerAvatarFileInput}
                    >
                      <Avatar
                        src={editGroupAvatar}
                        className="avatar-preview"
                        sx={{
                          width: '100%',
                          height: '100%',
                          fontSize: '2rem',
                          bgcolor: 'primary.light'
                        }}
                      >
                        {editGroupName ? editGroupName.charAt(0).toUpperCase() : 'G'}
                      </Avatar>
                      <Box className="avatar-hover-overlay">
                        <CameraIcon sx={{ fontSize: 32 }} />
                      </Box>
                    </Box>

                    {avatarError && (
                      <Alert severity="warning" className="avatar-error-alert" sx={{ mt: 1, py: 0, px: 2, borderRadius: 2 }}>
                        {avatarError}
                      </Alert>
                    )}
                  </Box>

                {isAdmin && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editOnlyAdminsCanEdit}
                        onChange={(e) => setEditOnlyAdminsCanEdit(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Only admins can modify group details"
                    sx={{ mt: 1 }}
                  />
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button 
                onClick={() => setIsEditingGroup(false)} 
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveGroupDetails} 
                variant="contained" 
                disabled={!editGroupName.trim()}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Save
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent dividers>
              <Stack spacing={2} sx={{ py: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    src={group.avatar} 
                    sx={{ width: 72, height: 72, fontSize: '2rem', bgcolor: 'primary.light', borderRadius: 4, cursor: group.avatar ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (group.avatar) {
                        setLightboxUrl(group.avatar);
                        setLightboxName(group.name);
                        setLightboxIsProfile(true);
                        setLightboxOpen(true);
                      }
                    }}
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

                <List sx={{ maxHeight: 250, overflowY: 'auto' }}>
                  {sortedMembers.map((member) => {
                    const memberId = Number(member.id);
                    const isUserMe = memberId === Number(user.id);
                    const memberAvatar = localStorage.getItem(`avatar_${memberId}`) || member.avatar || '';
                    const memberName = member.fullname || member.name || member.username || `User #${memberId}`;
                    const isCreator = Number(group.createdBy) === memberId;
                    const isTargetAdmin = group.adminIds?.includes(String(memberId)) || isCreator;
                    const roleLabel = isCreator ? "Group Creator" : (isTargetAdmin ? "Admin" : "Member");
                    
                    return (
                      <ListItem 
                        key={memberId} 
                        sx={{ px: 0, py: 0.5 }}
                        secondaryAction={
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleOpenMemberMenu(e, member)}
                            sx={{ color: 'var(--text-secondary)' }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={memberAvatar} 
                            sx={{ width: 32, height: 32, fontSize: '0.85rem', cursor: memberAvatar ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (memberAvatar) {
                                setLightboxUrl(memberAvatar);
                                setLightboxName(memberName);
                                setLightboxIsProfile(true);
                                setLightboxOpen(true);
                              }
                            }}
                          >
                            {!memberAvatar && memberName.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={isUserMe ? `${memberName} (You)` : memberName} 
                          secondary={roleLabel}
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
          </>
        )}
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
              {allUsers.map((learner) => {
                const isBlockedByLearner = learner.blockedUserIds?.includes(String(user.id));
                return (
                  <FormControlLabel
                    key={learner.id}
                    control={
                      <Checkbox 
                        checked={selectedNewMembers.includes(learner.id)} 
                        disabled={isBlockedByLearner}
                        onChange={() => {
                          if (isBlockedByLearner) return;
                          setSelectedNewMembers(prev => 
                            prev.includes(learner.id) 
                              ? prev.filter(id => id !== learner.id) 
                              : [...prev, learner.id]
                          );
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: isBlockedByLearner ? 0.5 : 1 }}>
                        <Avatar 
                          src={localStorage.getItem(`avatar_${learner.id}`) || learner.avatar} 
                          sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                        >
                          {(learner.fullname || learner.name || learner.username).charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {learner.fullname || learner.name || learner.username} {isBlockedByLearner && " (Unavailable)"}
                        </Typography>
                      </Box>
                    }
                    sx={{ py: 0.5 }}
                  />
                );
              })}
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

      {/* MEMBER ACTIONS CONTEXT MENU */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleCloseMemberMenu}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } }}
      >
        <MenuItem 
          onClick={handleToggleAdmin}
          disabled={
            !group || 
            !(group.adminIds?.includes(String(user.id)) || Number(group.createdBy) === Number(user.id)) ||
            (menuTargetMember && Number(group.createdBy) === Number(menuTargetMember.id)) ||
            (menuTargetMember && Number(menuTargetMember.id) === Number(user.id))
          }
          sx={{ fontSize: '0.9rem' }}
        >
          {menuTargetMember && group.adminIds?.includes(String(menuTargetMember.id)) ? "Remove Admin" : "Make Admin"}
        </MenuItem>
        
        <MenuItem 
          onClick={handleRemoveMember}
          disabled={
            !group || 
            !(group.adminIds?.includes(String(user.id)) || Number(group.createdBy) === Number(user.id)) ||
            (menuTargetMember && Number(group.createdBy) === Number(menuTargetMember.id)) ||
            (menuTargetMember && Number(menuTargetMember.id) === Number(user.id))
          }
          sx={{ fontSize: '0.9rem', color: 'error.main' }}
        >
          Remove Member
        </MenuItem>
        
        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={handleViewMemberInfo} sx={{ fontSize: '0.9rem' }}>
          View Info
        </MenuItem>
        
        <MenuItem onClick={handleViewMemberAvatar} sx={{ fontSize: '0.9rem' }}>
          View Profile Picture
        </MenuItem>
      </Menu>

      {/* MEMBER INFO DIALOG */}
      <Dialog 
        open={openMemberInfo} 
        onClose={() => setOpenMemberInfo(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pt: 3 }}>
          Learner Profile
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3 }}>
          <Avatar
            src={selectedMemberInfo ? (localStorage.getItem(`avatar_${selectedMemberInfo.id}`) || selectedMemberInfo.avatar || '') : ''}
            sx={{ 
              width: 90, 
              height: 90, 
              mb: 2, 
              bgcolor: 'primary.main', 
              fontSize: '2.2rem', 
              fontWeight: 'bold',
              cursor: selectedMemberInfo ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (selectedMemberInfo) {
                const url = localStorage.getItem(`avatar_${selectedMemberInfo.id}`) || selectedMemberInfo.avatar || '';
                setLightboxUrl(url);
                setLightboxName(selectedMemberInfo.fullname || selectedMemberInfo.name || selectedMemberInfo.username || 'User');
                setLightboxIsProfile(true);
                setLightboxOpen(true);
              }
            }}
          >
            {selectedMemberInfo && !(localStorage.getItem(`avatar_${selectedMemberInfo.id}`) || selectedMemberInfo.avatar) && 
              (selectedMemberInfo.fullname || selectedMemberInfo.name || selectedMemberInfo.username || 'U').charAt(0).toUpperCase()
            }
          </Avatar>
          
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {selectedMemberInfo?.fullname || selectedMemberInfo?.name || selectedMemberInfo?.username || 'User'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {selectedMemberInfo?.tag || 'Sophiapath Learner'}
          </Typography>

          <Divider sx={{ width: '100%', mb: 2.5 }} />

          <Stack spacing={2} sx={{ width: '100%', px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FingerprintIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Username</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  @{selectedMemberInfo?.username || 'learner'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Email Address</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedMemberInfo?.email || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Gender / Age</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedMemberInfo?.gender || 'Rather Not Say'} • {selectedMemberInfo?.age || 20} years old
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Joined</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedMemberInfo?.dateTime ? new Date(selectedMemberInfo.dateTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                </Typography>
              </Box>
            </Box>
          </Stack>
          {selectedMemberInfo && user.id !== Number(selectedMemberInfo.id) && (
            <Button
              variant="outlined"
              color={user.blockedUserIds?.includes(String(selectedMemberInfo.id)) ? "primary" : "error"}
              onClick={async () => {
                const isBlocked = user.blockedUserIds?.includes(String(selectedMemberInfo.id));
                if (isBlocked) {
                  await unblockUser(selectedMemberInfo.id);
                } else {
                  await blockUser(selectedMemberInfo.id);
                }
                setOpenMemberInfo(false);
              }}
              sx={{ mt: 3, borderRadius: 3, textTransform: 'none', width: '90%' }}
            >
              {user.blockedUserIds?.includes(String(selectedMemberInfo.id)) ? "Unblock User" : "Block User"}
            </Button>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setOpenMemberInfo(false)} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
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
          {lightboxName}'s Avatar
        </Typography>
        {lightboxUrl ? (
          <img 
            src={lightboxUrl} 
            alt={lightboxName} 
            style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'cover' }}
          />
        ) : (
          <Avatar sx={{ width: 200, height: 200, fontSize: '5rem', bgcolor: 'primary.main', fontWeight: 'bold', mb: 2 }}>
            {lightboxName.charAt(0).toUpperCase()}
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

export default GroupChatPage;
