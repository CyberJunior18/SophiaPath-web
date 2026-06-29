import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  Divider,
  Avatar,
  Stack,
  TextField,
  Paper,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowUpward as UpvoteIcon,
  ArrowDownward as DownvoteIcon,
  ChatBubbleOutline as CommentBubbleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  PhotoCamera as CameraIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialStore } from '../../data/socialStore';
import './Community.css';

const RenderReplyNode = ({ 
  reply, 
  depth, 
  user, 
  activeReplyId, 
  setActiveReplyId, 
  replyText, 
  setReplyText, 
  handlePostReplySubmit, 
  getAuthorRoleTag,
  editingReplyId,
  setEditingReplyId,
  editingReplyText,
  setEditingReplyText,
  handleSaveReply,
  handleDeleteReply,
  onFocusSubthread,
  isMod,
  isJoinedMember,
  collapsedReplyIds,
  toggleReplyCollapse
}) => {
  if (!reply) return null;
  const isReplyAuthor = Number(reply.authorId) === Number(user?.id);
  const isEditing = editingReplyId === reply.id;
  const isCollapsed = collapsedReplyIds?.has(reply.id);

  return (
    <Box sx={{ pl: 2, borderLeft: '2px solid var(--divider)', mt: 1.5 }}>
      {/* Reply Author & Meta */}
      <Box className="comment-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => toggleReplyCollapse(reply.id)}
            sx={{ p: 0.25, mr: 0.5, color: 'text.secondary' }}
          >
            {isCollapsed ? <KeyboardArrowRightIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>

          <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
            {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <Typography className="comment-author-name" sx={{ fontSize: '0.85rem !important', fontWeight: 600 }}>
            {reply.authorName}
          </Typography>
          {(() => {
            const role = getAuthorRoleTag(reply.authorId);
            if (!role) return null;
            return (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: role.color, backgroundColor: role.bg, padding: '2px 6px', borderRadius: 4 }}>
                {role.label}
              </span>
            );
          })()}
          <Typography className="comment-time">
            {new Date(reply.timestamp).toLocaleString()}
          </Typography>
        </Box>

        {/* Edit/Delete actions */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!(reply.authorName === 'Deleted' || reply.content === 'Deleted by moderator') && (
            <>
              {isReplyAuthor && !isEditing && (
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setEditingReplyId(reply.id);
                    setEditingReplyText(reply?.content || '');
                  }}
                  sx={{ p: 0.5 }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
              {(isReplyAuthor || isMod) && (
                <IconButton 
                  size="small" 
                  onClick={() => handleDeleteReply(reply.id)}
                  color="error"
                  sx={{ p: 0.5 }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Box>

      {!isCollapsed && (
        <>
          {/* Reply Content */}
          {isEditing ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={1}
                value={editingReplyText}
                onChange={(e) => setEditingReplyText(e.target.value)}
                InputProps={{ sx: { borderRadius: 2 } }}
                inputProps={{ maxLength: 1000 }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" variant="contained" onClick={() => handleSaveReply(reply.id)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Save
                </Button>
                <Button size="small" variant="outlined" onClick={() => setEditingReplyId(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'var(--text-primary)', mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {reply?.content}
            </Typography>
          )}

          {/* Reply actions */}
          {!isEditing && isJoinedMember && (
            <Box className="comment-actions" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Button
                size="small"
                startIcon={<ReplyIcon sx={{ fontSize: 12 }} />}
                onClick={() => {
                  if (activeReplyId === reply.id) {
                    setActiveReplyId(null);
                  } else {
                    setActiveReplyId(reply.id);
                    setReplyText('');
                  }
                }}
                sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: '0.72rem', color: 'var(--text-secondary)' }}
              >
                Reply
              </Button>
            </Box>
          )}

          {/* Reply Input Box */}
          {activeReplyId === reply.id && (
            <Box className="reply-input-box animate-fade-in" sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`Reply to ${reply.authorName}...`}
                  multiline
                  minRows={1}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  InputProps={{ sx: { borderRadius: 1.5 } }}
                  inputProps={{ maxLength: 1000 }}
                />
                <Button 
                  onClick={(e) => handlePostReplySubmit(e, reply.commentId, reply.id)}
                  variant="contained" 
                  size="small"
                  disabled={!replyText.trim()}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Reply
                </Button>
              </Stack>
            </Box>
          )}

          {/* Recursion / Children or Focused Subthread link */}
          {reply.children && reply.children.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {depth >= 3 ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onFocusSubthread(reply)}
                  sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.7rem', py: 0.25 }}
                >
                  View nested thread ({reply.children.length} replies)
                </Button>
              ) : (
                reply.children.map(child => (
                  <RenderReplyNode 
                    key={child.id} 
                    reply={child} 
                    depth={depth + 1} 
                    user={user} 
                    activeReplyId={activeReplyId} 
                    setActiveReplyId={setActiveReplyId} 
                    replyText={replyText} 
                    setReplyText={setReplyText} 
                    handlePostReplySubmit={handlePostReplySubmit} 
                    getAuthorRoleTag={getAuthorRoleTag}
                    editingReplyId={editingReplyId}
                    setEditingReplyId={setEditingReplyId}
                    editingReplyText={editingReplyText}
                    setEditingReplyText={setEditingReplyText}
                    handleSaveReply={handleSaveReply}
                    handleDeleteReply={handleDeleteReply}
                    onFocusSubthread={onFocusSubthread}
                    isMod={isMod}
                    isJoinedMember={isJoinedMember}
                    collapsedReplyIds={collapsedReplyIds}
                    toggleReplyCollapse={toggleReplyCollapse}
                  />
                ))
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

const parseMarkdownContent = (content) => {
  let text = content || '';
  let code = '';
  let lang = 'javascript';
  let images = [];
  let link = '';
  let linkLabel = '';

  // 1. Extract code block
  const codeMatch = text.match(/```([a-z]*)\n([\s\S]*?)\n```/);
  if (codeMatch) {
    lang = codeMatch[1] || 'javascript';
    code = codeMatch[2] || '';
    text = text.replace(/```[a-z]*\n[\s\S]*?\n```/g, '');
  }

  // 2. Extract image attachments
  const imgRegex = /!\[Image Attachment\]\(([^)]*)\)/g;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(text)) !== null) {
    if (imgMatch[1]) images.push(imgMatch[1]);
  }
  text = text.replace(/!\[Image Attachment\]\(([^)]*)\)/g, '');

  // 3. Extract link attachment
  const linkMatch = text.match(/(?!^!)\[([^\]]*)\]\(([^)]*)\)/);
  if (linkMatch) {
    linkLabel = linkMatch[1] || '';
    link = linkMatch[2] || '';
    text = text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '');
  }

  text = text.trim();
  return { text, code, lang, images, link, linkLabel };
};

const QuestionDetailPage = () => {
  const { communityId, roomId, questionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [comments, setComments] = useState([]);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);
  const [community, setCommunity] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Post Edit states
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostCode, setEditPostCode] = useState('');
  const [editPostLanguage, setEditPostLanguage] = useState('javascript');
  const [editPostImages, setEditPostImages] = useState([]);
  const [editPostLink, setEditPostLink] = useState('');
  const [editPostLinkLabel, setEditPostLinkLabel] = useState('');
  const [showEditCode, setShowEditCode] = useState(false);
  const [showEditImages, setShowEditImages] = useState(false);
  const [showEditLink, setShowEditLink] = useState(false);
  // Bookmark & Sharing states
  const [isSaved, setIsSaved] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTargetsChats, setShareTargetsChats] = useState([]);
  const [shareTargetsGroups, setShareTargetsGroups] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  // Comment Edit states
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Reply Edit states
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState('');

  // Comment Sorting & Filtering
  const [commentsSortBy, setCommentsSortBy] = useState('top'); // 'top' or 'newest'
  const [hideOwnComments, setHideOwnComments] = useState(false);

  // Sub-thread Focus
  const [focusedReply, setFocusedReply] = useState(null);

  // Custom Confirmation Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState(null);

  const showConfirmDialog = (title, message, callback) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => callback);
    setConfirmOpen(true);
  };

  // Collapse States
  const [collapsedCommentIds, setCollapsedCommentIds] = useState(new Set());
  const [collapsedReplyIds, setCollapsedReplyIds] = useState(new Set());

  const toggleCommentCollapse = (commentId) => {
    setCollapsedCommentIds(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const toggleReplyCollapse = (replyId) => {
    setCollapsedReplyIds(prev => {
      const next = new Set(prev);
      if (next.has(replyId)) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      return next;
    });
  };
  
  // Comment composers
  const [newCommentText, setNewCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null); // id of comment we are replying to
  const [replyText, setReplyText] = useState('');

  const isOwner = community && Number(community.ownerId) === Number(user?.id);
  const isMod = community && (community.moderatorIds?.includes(String(user?.id)) || isOwner);
  const isJoinedMember = community && (community.isJoined || isOwner);

  const getAuthorRoleTag = (authorId) => {
    if (!community) return null;
    const isMIOwner = Number(community.ownerId) === Number(authorId);
    const isMIMod = community.moderatorIds?.includes(String(authorId));
    if (isMIOwner) return { label: 'Owner', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    if (isMIMod) return { label: 'Moderator', color: '#3D5CFF', bg: 'rgba(61, 92, 255, 0.12)' };
    const isMIMember = community.members?.some(m => Number(m.id) === Number(authorId));
    if (isMIMember) return { label: 'Member', color: 'var(--text-secondary)', bg: 'rgba(0,0,0,0.05)' };
    return null;
  };

  const commentsWithReplyTrees = useMemo(() => {
    const buildTree = (flatReplies) => {
      if (!Array.isArray(flatReplies)) return [];
      
      // Filter out own replies if hideOwnComments is checked
      let processedReplies = flatReplies;
      if (hideOwnComments) {
        processedReplies = processedReplies.filter(r => r && Number(r.authorId) !== Number(user?.id));
      }

      const replyMap = {};
      const roots = [];
      processedReplies.forEach(reply => {
        if (reply && reply.id) {
          replyMap[reply.id] = { ...reply, children: [] };
        }
      });
      processedReplies.forEach(reply => {
        if (!reply || !reply.id) return;
        const mapped = replyMap[reply.id];
        if (reply.parentReplyId) {
          const parent = replyMap[reply.parentReplyId];
          if (parent) {
            parent.children.push(mapped);
          } else {
            roots.push(mapped);
          }
        } else {
          roots.push(mapped);
        }
      });

      const sortFn = (a, b) => {
        if (commentsSortBy === 'top') {
          const voteDiff = (b.upvotes || 0) - (a.upvotes || 0);
          if (voteDiff !== 0) return voteDiff;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      };

      const sortAndPartitionList = (nodes) => {
        const ownNodes = nodes.filter(n => Number(n.authorId) === Number(user?.id));
        const otherNodes = nodes.filter(n => Number(n.authorId) !== Number(user?.id));
        ownNodes.sort(sortFn);
        otherNodes.sort(sortFn);
        return [...ownNodes, ...otherNodes];
      };

      const sortTree = (nodes) => {
        nodes.forEach(n => {
          if (n && n.children) {
            n.children = sortAndPartitionList(n.children);
            sortTree(n.children);
          }
        });
      };

      sortTree(roots);
      return sortAndPartitionList(roots);
    };

    if (!Array.isArray(comments)) return [];

    return comments.filter(Boolean).map(comment => ({
      ...comment,
      replyTree: buildTree(comment.replies || [])
    }));
  }, [comments, commentsSortBy, hideOwnComments, user?.id]);

  const sortedComments = useMemo(() => {
    let list = commentsWithReplyTrees;
    
    // Hide own comments if option checked
    if (hideOwnComments) {
      list = list.filter(c => Number(c.authorId) !== Number(user?.id));
    }

    const ownComments = list.filter(c => Number(c.authorId) === Number(user?.id));
    const otherComments = list.filter(c => Number(c.authorId) !== Number(user?.id));

    const sortFn = (a, b) => {
      if (commentsSortBy === 'top') {
        const voteDiff = (b.upvotes || 0) - (a.upvotes || 0);
        if (voteDiff !== 0) return voteDiff;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    };

    ownComments.sort(sortFn);
    otherComments.sort(sortFn);

    return [...ownComments, ...otherComments];
  }, [commentsWithReplyTrees, commentsSortBy, hideOwnComments, user?.id]);

  const displayedComments = sortedComments.slice(0, visibleCommentsCount);

  const loadQuestionAndComments = async () => {
    try {
      const qData = await socialStore.getQuestionById(questionId);
      if (qData) {
        setQuestion(qData);
        setNotFound(false);
        const cId = qData.room?.communityId || communityId;
        if (cId) {
          const cData = await socialStore.getCommunityById(cId);
          if (cData) setCommunity(cData);
        }
      } else {
        setQuestion(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Failed to load question:', err);
      setQuestion(null);
      setNotFound(true);
    }
    try {
      const cData = await socialStore.getComments(questionId);
      setComments(cData || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    }
  };

  useEffect(() => {
    if (questionId) {
      loadQuestionAndComments();
      setVisibleCommentsCount(10);
      const saved = JSON.parse(localStorage.getItem('saved_posts_list') || '[]').includes(Number(questionId));
      setIsSaved(saved);
    }
  }, [questionId]);

  const handleToggleSavePost = () => {
    let list = JSON.parse(localStorage.getItem('saved_posts_list') || '[]');
    const idNum = Number(questionId);
    if (list.includes(idNum)) {
      list = list.filter(id => id !== idNum);
      setIsSaved(false);
    } else {
      list.push(idNum);
      setIsSaved(true);
    }
    localStorage.setItem('saved_posts_list', JSON.stringify(list));
  };

  const handleOpenShareDialog = async () => {
    setShareDialogOpen(true);
    const chats = await socialStore.getUserConversations();
    const groups = await socialStore.getGroups(user?.id);
    setShareTargetsChats(chats || []);
    setShareTargetsGroups(groups || []);
  };

  const handleShareToChat = async (partner) => {
    const msgText = `[SHARED_POST]:${questionId}|${question?.title}`;
    await socialStore.sendDirectMessage(
      user?.id,
      partner.id,
      msgText,
      user?.name || user?.fullname || user?.username,
      user?.avatar || ''
    );
    alert(`Successfully shared to ${partner.name || partner.fullname || partner.username}!`);
    setShareDialogOpen(false);
  };

  const handleShareToGroup = async (group) => {
    const msgText = `[SHARED_POST]:${questionId}|${question?.title}`;
    await socialStore.sendGroupMessage(
      group.id,
      user?.id,
      user?.name || user?.fullname || user?.username,
      user?.avatar || '',
      msgText
    );
    alert(`Successfully shared to ${group.name}!`);
    setShareDialogOpen(false);
  };

  const handleShareLinkExternal = () => {
    const postUrl = window.location.href;
    navigator.clipboard.writeText(postUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePollVote = async (optionIndex) => {
    if (!question) return;
    const updated = await socialStore.votePostPoll(questionId, optionIndex);
    if (updated) {
      setQuestion(prev => ({
        ...prev,
        pollVotes: updated.pollVotes
      }));
    }
  };

  const handlePostUpvote = async () => {
    if (!question) return;
    const updated = await socialStore.upvoteQuestion(questionId, user.id);
    if (updated) {
      setQuestion(prev => ({
        ...prev,
        ...updated,
        userUpvoted: updated.upvotedUsers?.includes(Number(user.id)),
        userDownvoted: updated.downvotedUsers?.includes(Number(user.id))
      }));
    }
  };

  const handlePostDownvote = async () => {
    if (!question) return;
    const updated = await socialStore.downvoteQuestion(questionId, user.id);
    if (updated) {
      setQuestion(prev => ({
        ...prev,
        ...updated,
        userUpvoted: updated.upvotedUsers?.includes(Number(user.id)),
        userDownvoted: updated.downvotedUsers?.includes(Number(user.id))
      }));
    }
  };

  const handleCommentUpvote = async (commentId) => {
    const updated = await socialStore.upvoteComment(questionId, commentId, user.id);
    if (updated) {
      setComments(prev => prev.map(c => c.id === commentId ? {
        ...c,
        ...updated,
        userUpvoted: updated.upvotedUsers?.includes(Number(user.id)),
        userDownvoted: updated.downvotedUsers?.includes(Number(user.id))
      } : c));
    }
  };

  const handleCommentDownvote = async (commentId) => {
    const updated = await socialStore.downvoteComment(questionId, commentId, user.id);
    if (updated) {
      setComments(prev => prev.map(c => c.id === commentId ? {
        ...c,
        ...updated,
        userUpvoted: updated.upvotedUsers?.includes(Number(user.id)),
        userDownvoted: updated.downvotedUsers?.includes(Number(user.id))
      } : c));
    }
  };

  const handlePostCommentSubmit = async (e) => {
    e?.preventDefault();
    if (!newCommentText.trim()) return;

    await socialStore.addComment(questionId, newCommentText, user);
    setNewCommentText('');
    loadQuestionAndComments();
  };

  const handlePostReplySubmit = async (e, commentId, parentReplyId) => {
    e?.preventDefault();
    if (!replyText.trim()) return;

    await socialStore.addReply(questionId, commentId, replyText, user, parentReplyId);
    setReplyText('');
    setActiveReplyId(null);
    loadQuestionAndComments();
  };

  const handleEditPostImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPostImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStartEditPost = () => {
    const parsed = parseMarkdownContent(question?.content || '');
    setEditPostTitle(question?.title || '');
    setEditPostContent(parsed.text);
    setEditPostCode(parsed.code);
    setEditPostLanguage(parsed.lang);
    setEditPostImages(parsed.images || []);
    setEditPostLink(parsed.link);
    setEditPostLinkLabel(parsed.linkLabel);
    setShowEditCode(!!parsed.code);
    setShowEditImages((parsed.images || []).length > 0);
    setShowEditLink(!!parsed.link);
    setIsEditingPost(true);
  };

  const handleSavePost = async () => {
    if (!editPostTitle.trim() || !editPostContent.trim()) return;
    
    let fullContent = editPostContent;
    if (showEditCode && editPostCode.trim()) {
      fullContent += `\n\n\`\`\`${editPostLanguage}\n${editPostCode}\n\`\`\``;
    }
    if (showEditImages && editPostImages.length > 0) {
      editPostImages.forEach(img => {
        if (img) fullContent += `\n\n![Image Attachment](${img})`;
      });
    }
    if (showEditLink && editPostLink.trim()) {
      const label = editPostLinkLabel.trim() || 'Link';
      fullContent += `\n\n[${label}](${editPostLink.trim()})`;
    }

    const updated = await socialStore.updateQuestion(
      questionId, 
      editPostTitle, 
      fullContent,
      question?.pollQuestion || null,
      question?.pollOptions || null
    );
    if (updated) {
      setQuestion(prev => ({ ...prev, title: editPostTitle, content: fullContent }));
      setIsEditingPost(false);
      loadQuestionAndComments();
    }
  };

  const handleDeletePost = async () => {
    showConfirmDialog(
      "Delete Post?",
      "Are you sure you want to delete this post?",
      async () => {
        const success = await socialStore.deleteQuestion(questionId);
        if (success) {
          navigate(`/communities/${communityId}/room/${roomId}`);
        }
      }
    );
  };

  const handleSaveComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    const updated = await socialStore.updateComment(commentId, editingCommentText);
    if (updated) {
      setEditingCommentId(null);
      loadQuestionAndComments();
    }
  };

  const handleDeleteComment = async (commentId) => {
    showConfirmDialog(
      "Delete Comment?",
      "Are you sure you want to delete this comment?",
      async () => {
        const success = await socialStore.deleteComment(commentId);
        if (success) {
          loadQuestionAndComments();
        }
      }
    );
  };

  const handleSaveReply = async (replyId) => {
    if (!editingReplyText.trim()) return;
    const updated = await socialStore.updateReply(replyId, editingReplyText);
    if (updated) {
      setEditingReplyId(null);
      loadQuestionAndComments();
    }
  };

  const handleDeleteReply = async (replyId) => {
    showConfirmDialog(
      "Delete Reply?",
      "Are you sure you want to delete this reply?",
      async () => {
        const success = await socialStore.deleteReply(replyId);
        if (success) {
          loadQuestionAndComments();
        }
      }
    );
  };

  const highlightCode = (code) => {
    if (!code) return '';
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const tokenSpecs = [
      { type: 'comment', regex: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/ },
      { type: 'string', regex: /("(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*')/ },
      { type: 'number', regex: /\b(\d+(?:\.\d+)?)\b/ },
      { type: 'keyword', regex: /\b(class|interface|public|private|protected|static|final|void|int|double|float|long|boolean|char|byte|short|if|else|for|while|do|switch|case|default|break|continue|return|new|import|package|try|catch|finally|throw|throws|const|let|var|function|def|from|as|class|self|this|super|null|true|false)\b/ },
      { type: 'annotation', regex: /(@\w+)/ },
      { type: 'type', regex: /\b([A-Z]\w*)\b/ }
    ];

    const combinedRegex = new RegExp(
      tokenSpecs.map(spec => `(${spec.regex.source})`).join('|'),
      'g'
    );

    html = html.replace(combinedRegex, (match, ...args) => {
      for (let i = 0; i < tokenSpecs.length; i++) {
        if (args[i * 2] !== undefined) {
          const type = tokenSpecs[i].type;
          return `<span class="code-token-${type}">${match}</span>`;
        }
      }
      return match;
    });

    return html;
  };

  const renderRichText = (text) => {
    if (!text) return null;
    const regex = /(!?\[[^\]]*\]\([^)]*\))/g;
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1] || 'Attachment';
        const src = imgMatch[2];
        return (
          <Box key={index} sx={{ my: 2, display: 'inline-block', maxWidth: '100%' }}>
            <img 
              src={src} 
              alt={alt} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px', 
                borderRadius: '8px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid var(--divider)',
                display: 'block'
              }} 
            />
          </Box>
        );
      }
      
      const linkMatch = part.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
      if (linkMatch) {
        const label = linkMatch[1] || 'Link';
        const url = linkMatch[2];
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--primary-color, #3D5CFF)',
              fontWeight: 600,
              textDecoration: 'underline',
              margin: '0 4px',
              display: 'inline-block'
            }}
          >
            {label}
          </a>
        );
      }
      
      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part}
        </span>
      );
    });
  };

  // Helper to parse content text and render code blocks
  const renderQuestionBody = (content) => {
    if (!content) return null;
    const parts = content.split(/(```[a-z]*\n[\s\S]*?\n```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        // slice off the beginning ```java and the ending ```
        const code = lines.slice(1, -1).join('\n');
        const highlighted = highlightCode(code);
        return (
          <pre key={i} className="post-code-block">
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        );
      }
      return (
        <Typography key={i} variant="body1" sx={{ mb: 1, color: 'var(--text-primary)', display: 'block' }}>
          {renderRichText(part)}
        </Typography>
      );
    });
  };

  const renderPostPoll = () => {
    if (!question?.pollQuestion) return null;

    let opts = [];
    if (question.pollOptions) {
      if (Array.isArray(question.pollOptions)) {
        opts = question.pollOptions;
      } else if (typeof question.pollOptions === 'string') {
        try {
          if (question.pollOptions.startsWith('[')) {
            opts = JSON.parse(question.pollOptions);
          } else {
            opts = question.pollOptions.split(',');
          }
        } catch (e) {
          opts = question.pollOptions.split(',');
        }
      }
    }
    if (opts.length === 0) return null;

    let votes = {};
    if (question.pollVotes) {
      try {
        votes = typeof question.pollVotes === 'string' ? JSON.parse(question.pollVotes) : question.pollVotes;
      } catch (e) {
        votes = {};
      }
    }

    const totalVotes = Object.keys(votes || {}).length;
    const userVoteVal = votes[user?.id] !== undefined ? votes[user?.id] : votes[String(user?.id)];
    const hasVoted = userVoteVal !== undefined;

    return (
      <Box sx={{ mt: 3, p: 2.5, borderRadius: 2.5, border: '1px solid var(--divider)', bgcolor: 'rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
          📊 {question.pollQuestion}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {opts.map((opt, idx) => {
            const optVotes = Object.values(votes || {}).filter(v => Number(v) === idx).length;
            const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
            const isUserChoice = hasVoted && Number(userVoteVal) === idx;

            return (
              <Box
                key={idx}
                onClick={() => handlePollVote(idx)}
                sx={{
                  position: 'relative',
                  borderRadius: 1.5,
                  border: `2px solid ${isUserChoice ? 'var(--primary-color)' : 'var(--divider)'}`,
                  p: 1.5,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  bgcolor: isUserChoice ? 'rgba(61,92,255,0.06)' : 'rgba(0,0,0,0.01)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                  transition: 'all 0.2s ease'
                }}
              >
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${percent}%`,
                    backgroundColor: isUserChoice ? 'rgba(61,92,255,0.22)' : 'rgba(61,92,255,0.1)',
                    zIndex: 0,
                    transition: 'width 0.4s ease-out'
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: isUserChoice ? 700 : 500, color: 'var(--text-primary)' }}>
                    {opt} {isUserChoice && ' ✓'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {optVotes} vote{optVotes !== 1 && 's'} ({percent}%)
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', alignSelf: 'flex-end' }}>
          Total votes: {totalVotes}
        </Typography>
      </Box>
    );
  };

  const renderShareDialog = () => {
    return (
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800, pr: 5 }}>
          Share Post
          <IconButton
            onClick={() => setShareDialogOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'var(--text-secondary)' }}
          >
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'var(--text-primary)' }}>
            Share internally
          </Typography>
          
          <List sx={{ pt: 0, maxHeight: 220, overflowY: 'auto' }}>
            {shareTargetsChats.length === 0 && shareTargetsGroups.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
                No direct chats or groups found to share with.
              </Typography>
            )}
            
            {shareTargetsChats.map((partner) => (
              <ListItem key={partner.id} disablePadding>
                <ListItemButton onClick={() => handleShareToChat(partner)} sx={{ borderRadius: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={partner.avatar} sx={{ width: 32, height: 32 }} />
                  </ListItemAvatar>
                  <ListItemText primary={partner.name || partner.fullname || partner.username || 'user'} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}

            {shareTargetsGroups.map((group) => (
              <ListItem key={group.id} disablePadding>
                <ListItemButton onClick={() => handleShareToGroup(group)} sx={{ borderRadius: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--primary-color)' }}>
                      {group.name?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={group.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'var(--text-primary)' }}>
            Share externally
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleShareLinkExternal}
            sx={{ textTransform: 'none', borderRadius: 2, py: 1 }}
          >
            {copiedLink ? '✓ Copied link to clipboard!' : 'Copy Post Link'}
          </Button>
        </DialogContent>
      </Dialog>
    );
  };

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading User Profile...</Typography>
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', p: 4, textAlign: 'center', gap: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Post Deleted or Unavailable
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, lineHeight: 1.6 }}>
          We are truly sorry, but this post was probably deleted by a community moderator or owner.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(`/communities/${communityId || 1}`)}
          sx={{ borderRadius: 2.5, textTransform: 'none', px: 4, py: 1.25, fontWeight: 700, boxShadow: '0 4px 14px rgba(61, 92, 255, 0.2)' }}
        >
          Back to Community
        </Button>
      </Box>
    );
  }

  if (!question) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading Post Details...</Typography>
      </Box>
    );
  }

  const isPostUpvoted = question.upvotedUsers?.includes(Number(user?.id));

  return (
    <Box className="question-detail-container">
      
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/communities/${communityId}/room/${roomId}`)}
        sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'var(--text-secondary)' }}
      >
        Back
      </Button>

      {/* QUESTION DETAIL HEADER */}
      <Card className="question-detail-card">
        <Box className="question-detail-header-block" sx={{ pb: 0 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, width: '100%' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              {question.authorName?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {question.authorName}
                </Typography>
                {(() => {
                  const role = getAuthorRoleTag(question.authorId);
                  if (!role) return null;
                  return (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: role.color, backgroundColor: role.bg, padding: '2px 6px', borderRadius: 4 }}>
                      {role.label}
                    </span>
                  );
                })()}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Posted on {new Date(question.timestamp).toLocaleString()}
              </Typography>
            </Box>
            
            {/* Edit / Delete Buttons for the Question itself */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {Number(question.authorId) === Number(user?.id) && !isEditingPost && (
                <IconButton size="small" onClick={handleStartEditPost} color="primary" sx={{ border: '1px solid var(--divider)', borderRadius: 2 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {(Number(question.authorId) === Number(user?.id) || isMod) && (
                <IconButton size="small" onClick={handleDeletePost} color="error" sx={{ border: '1px solid var(--divider)', borderRadius: 2 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Stack>
        </Box>

        {isEditingPost ? (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Post</Typography>
            
            <TextField
              label="Post Title"
              fullWidth
              value={editPostTitle}
              onChange={(e) => setEditPostTitle(e.target.value)}
              InputProps={{ sx: { borderRadius: 1.5 } }}
              inputProps={{ maxLength: 150 }}
            />
            
            <TextField
              label="Post Description"
              fullWidth
              multiline
              rows={4}
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              InputProps={{ sx: { borderRadius: 1.5 } }}
              inputProps={{ maxLength: 2000 }}
            />

            {/* Code Attachment Section */}
            <FormControlLabel
              control={<Switch checked={showEditCode} onChange={(e) => setShowEditCode(e.target.checked)} />}
              label="Include Code Snippet"
            />
            {showEditCode && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--divider)', p: 2, borderRadius: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={editPostLanguage}
                    label="Language"
                    onChange={(e) => setEditPostLanguage(e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="javascript">JavaScript</MenuItem>
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                    <MenuItem value="cpp">C++</MenuItem>
                    <MenuItem value="html">HTML/CSS</MenuItem>
                    <MenuItem value="sql">SQL</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Code Snippet"
                  fullWidth
                  multiline
                  rows={4}
                  value={editPostCode}
                  onChange={(e) => setEditPostCode(e.target.value)}
                  InputProps={{ sx: { fontFamily: 'monospace', borderRadius: 1.5 } }}
                  inputProps={{ maxLength: 1000 }}
                />
              </Box>
            )}

            {/* Images Attachment Section */}
            <FormControlLabel
              control={<Switch checked={showEditImages} onChange={(e) => setShowEditImages(e.target.checked)} />}
              label="Attach Images"
            />
            {showEditImages && (
              <Box sx={{ border: '1px dashed var(--divider)', p: 2, borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="edit-post-images-picker"
                  style={{ display: 'none' }}
                  onChange={handleEditPostImageUpload}
                />
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor="edit-post-images-picker"
                  startIcon={<CameraIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Upload Images
                </Button>
                
                {editPostImages.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {editPostImages.map((img, idx) => (
                      <Box key={idx} sx={{ position: 'relative', width: 60, height: 60 }}>
                        <img
                          src={img}
                          alt="preview"
                          style={{ width: '100%', height: '100%', borderRadius: 4, objectFit: 'cover', border: '1px solid var(--divider)' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setEditPostImages(prev => prev.filter((_, i) => i !== idx))}
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            bgcolor: 'error.main',
                            color: 'white',
                            width: 16,
                            height: 16,
                            fontSize: '0.6rem',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Link Attachment Section */}
            <FormControlLabel
              control={<Switch checked={showEditLink} onChange={(e) => setShowEditLink(e.target.checked)} />}
              label="Attach External Link"
            />
            {showEditLink && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--divider)', p: 2, borderRadius: 1.5 }}>
                <TextField
                  label="Link URL"
                  placeholder="https://example.com"
                  fullWidth
                  value={editPostLink}
                  onChange={(e) => setEditPostLink(e.target.value)}
                  InputProps={{ sx: { borderRadius: 1.5 } }}
                  inputProps={{ maxLength: 500 }}
                />
                <TextField
                  label="Link Label"
                  placeholder="Visit Website"
                  fullWidth
                  value={editPostLinkLabel}
                  onChange={(e) => setEditPostLinkLabel(e.target.value)}
                  InputProps={{ sx: { borderRadius: 1.5 } }}
                  inputProps={{ maxLength: 100 }}
                />
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button variant="contained" onClick={handleSavePost} sx={{ textTransform: 'none', borderRadius: 2 }}>
                Save Changes
              </Button>
              <Button variant="outlined" onClick={() => setIsEditingPost(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                Cancel
              </Button>
            </Stack>
          </Box>
        ) : (
          <>
            <Box className="question-detail-header-block" sx={{ pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0 }}>
                {question.title}
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {/* Vote counter */}
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ border: '1px solid var(--divider)', borderRadius: 4, px: 1.5, py: 0.5, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <IconButton
                    size="small"
                    onClick={handlePostUpvote}
                    sx={{ color: question.userUpvoted ? '#10b981' : 'var(--text-disabled)' }}
                  >
                    <UpvoteIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ fontWeight: 700, px: 0.5, fontSize: '0.9rem' }}>
                    {question.upvotes || 0}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handlePostDownvote}
                    sx={{ color: question.userDownvoted ? '#ef4444' : 'var(--text-disabled)' }}
                  >
                    <DownvoteIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {/* Bookmark/Save button */}
                <IconButton onClick={handleToggleSavePost} size="small" sx={{ border: '1px solid var(--divider)', borderRadius: 2, color: isSaved ? '#f59e0b' : 'var(--text-secondary)' }}>
                  {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </IconButton>

                {/* Share Button */}
                <IconButton onClick={handleOpenShareDialog} size="small" sx={{ border: '1px solid var(--divider)', borderRadius: 2, color: 'var(--text-secondary)' }}>
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {/* Content body */}
            <Box className="question-detail-content">
              {renderQuestionBody(question?.content)}
            </Box>

            {/* Poll Component */}
            {renderPostPoll()}

            {/* Share Dialog */}
            {renderShareDialog()}
          </>
        )}
      </Card>

      {/* COMMENTS LIST & COMPOSER */}
      <Paper className="comments-section-container">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Discussion ({question.commentsCount || 0})
        </Typography>

        {/* Write Top-level Comment */}
        {isJoinedMember ? (
          <Box className="comment-input-wrapper">
            <TextField
              placeholder="What are your thoughts on this?"
              multiline
              rows={2}
              fullWidth
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
              inputProps={{ maxLength: 1000 }}
            />
            <Button
              onClick={handlePostCommentSubmit}
              variant="contained"
              disabled={!newCommentText.trim()}
              sx={{ alignSelf: 'flex-end', textTransform: 'none', borderRadius: 2 }}
            >
              Comment
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2, border: '1px dashed var(--divider)', borderRadius: 3, bgcolor: 'action.hover', textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Only members who have joined this community can post comments or replies. Join the community to participate!
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Sorting & Filter controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Sort by:
            </Typography>
            <Button
              size="small"
              variant={commentsSortBy === 'top' ? 'contained' : 'outlined'}
              onClick={() => setCommentsSortBy('top')}
              sx={{ textTransform: 'none', borderRadius: 2, px: 2 }}
            >
              Top
            </Button>
            <Button
              size="small"
              variant={commentsSortBy === 'newest' ? 'contained' : 'outlined'}
              onClick={() => setCommentsSortBy('newest')}
              sx={{ textTransform: 'none', borderRadius: 2, px: 2 }}
            >
              Newest
            </Button>
          </Stack>
          
          <FormControlLabel
            control={
              <Switch
                checked={hideOwnComments}
                onChange={(e) => setHideOwnComments(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Hide my comments
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        {/* Comments Feed */}
        <Box className="comments-list">
          {focusedReply ? (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Viewing single thread focused on reply by {focusedReply.authorName}
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => setFocusedReply(null)}
                  sx={{ textTransform: 'none', ml: 'auto', fontWeight: 600 }}
                >
                  View Full Discussion
                </Button>
              </Box>
              <Box sx={{ border: '1px solid var(--divider)', borderRadius: 3, p: 2, bgcolor: 'background.paper' }}>
                <Box className="comment-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {focusedReply.authorName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography className="comment-author-name" sx={{ fontWeight: 600 }}>
                      {focusedReply.authorName}
                    </Typography>
                    {(() => {
                      const role = getAuthorRoleTag(focusedReply.authorId);
                      if (!role) return null;
                      return (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: role.color, backgroundColor: role.bg, padding: '2px 6px', borderRadius: 4 }}>
                          {role.label}
                        </span>
                      );
                    })()}
                    <Typography className="comment-time">
                      {new Date(focusedReply.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ mt: 1, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {focusedReply?.content}
                </Typography>
                
                {isJoinedMember && (
                  <>
                    <Box className="comment-actions" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ReplyIcon sx={{ fontSize: 12 }} />}
                        onClick={() => {
                          if (activeReplyId === focusedReply.id) {
                            setActiveReplyId(null);
                          } else {
                            setActiveReplyId(focusedReply.id);
                            setReplyText('');
                          }
                        }}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                      >
                        Reply
                      </Button>
                    </Box>

                    {activeReplyId === focusedReply.id && (
                      <Box className="reply-input-box animate-fade-in" sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder={`Reply to ${focusedReply.authorName}...`}
                            multiline
                            minRows={1}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            InputProps={{ sx: { borderRadius: 1.5 } }}
                            inputProps={{ maxLength: 1000 }}
                          />
                          <Button 
                            onClick={(e) => handlePostReplySubmit(e, focusedReply.commentId, focusedReply.id)}
                            variant="contained" 
                            size="small"
                            disabled={!replyText.trim()}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Reply
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </>
                )}

                {/* Render recursive children */}
                {focusedReply.children && focusedReply.children.map(child => (
                  <RenderReplyNode
                    key={child.id}
                    reply={child}
                    depth={0}
                    user={user}
                    activeReplyId={activeReplyId}
                    setActiveReplyId={setActiveReplyId}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    handlePostReplySubmit={handlePostReplySubmit}
                    getAuthorRoleTag={getAuthorRoleTag}
                    editingReplyId={editingReplyId}
                    setEditingReplyId={setEditingReplyId}
                    editingReplyText={editingReplyText}
                    setEditingReplyText={setEditingReplyText}
                    handleSaveReply={handleSaveReply}
                    handleDeleteReply={handleDeleteReply}
                    onFocusSubthread={(node) => setFocusedReply(node)}
                    isMod={isMod}
                    isJoinedMember={isJoinedMember}
                    collapsedReplyIds={collapsedReplyIds}
                    toggleReplyCollapse={toggleReplyCollapse}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            displayedComments.map((comment) => {
              if (!comment) return null;
              const isCommentAuthor = Number(comment.authorId) === Number(user?.id);
              const isCommentEditing = editingCommentId === comment.id;
              const isCollapsed = collapsedCommentIds.has(comment.id);

              return (
                <Box key={comment.id} className="comment-node animate-fade-in">
                  
                  {/* Comment author info */}
                  <Box className="comment-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleCommentCollapse(comment.id)}
                        sx={{ p: 0.25, mr: 0.5, color: 'text.secondary' }}
                      >
                        {isCollapsed ? <KeyboardArrowRightIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                      </IconButton>

                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                        {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography className="comment-author-name" sx={{ fontWeight: 600 }}>
                        {comment.authorName}
                      </Typography>
                      {(() => {
                        const role = getAuthorRoleTag(comment.authorId);
                        if (!role) return null;
                        return (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: role.color, backgroundColor: role.bg, padding: '2px 6px', borderRadius: 4 }}>
                            {role.label}
                          </span>
                        );
                      })()}
                      <Typography className="comment-time">
                        {new Date(comment.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
 
                    {/* Edit/Delete actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {!(comment.authorName === 'Deleted' || comment.content === 'Deleted by moderator') && (
                        <>
                          {isCommentAuthor && !isCommentEditing && (
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment?.content || '');
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                          {(isCommentAuthor || isMod) && (
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteComment(comment.id)}
                              color="error"
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
 
                  {!isCollapsed && (
                    <>
                      {/* Comment content */}
                      {isCommentEditing ? (
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            multiline
                            minRows={1}
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            InputProps={{ sx: { borderRadius: 2 } }}
                            inputProps={{ maxLength: 1000 }}
                          />
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" variant="contained" onClick={() => handleSaveComment(comment.id)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                              Save
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => setEditingCommentId(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                              Cancel
                            </Button>
                          </Stack>
                        </Box>
                      ) : (
                        <Typography className="comment-content" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                          {comment?.content}
                        </Typography>
                      )}
 
                      {/* Comment Actions */}
                      {!isCommentEditing && (
                        <Box className="comment-actions" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleCommentUpvote(comment.id)}
                            sx={{ color: comment.userUpvoted ? '#10b981' : 'var(--text-disabled)', p: 0.5 }}
                          >
                            <UpvoteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {comment.upvotes || 0}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCommentDownvote(comment.id)}
                            sx={{ color: comment.userDownvoted ? '#ef4444' : 'var(--text-disabled)', p: 0.5 }}
                          >
                            <DownvoteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          
                          {isJoinedMember && (
                            <Button
                              size="small"
                              startIcon={<ReplyIcon sx={{ fontSize: 12 }} />}
                              onClick={() => {
                                if (activeReplyId === comment.id) {
                                  setActiveReplyId(null);
                                } else {
                                  setActiveReplyId(comment.id);
                                  setReplyText('');
                                }
                              }}
                              sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                            >
                              Reply
                            </Button>
                          )}
                        </Box>
                      )}
 
                      {/* Reply Composer Form */}
                      {activeReplyId === comment.id && (
                        <Box className="reply-input-box animate-fade-in" sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={1}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Write a reply..."
                              multiline
                              minRows={1}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              InputProps={{ sx: { borderRadius: 1.5 } }}
                              inputProps={{ maxLength: 1000 }}
                            />
                            <Button 
                              onClick={(e) => handlePostReplySubmit(e, comment.id)}
                              variant="contained" 
                              size="small"
                              disabled={!replyText.trim()}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Reply
                            </Button>
                          </Stack>
                        </Box>
                      )}
 
                      {/* Recursive Nested Replies List */}
                      {comment.replyTree && comment.replyTree.length > 0 && (
                        <Box className="comment-replies-list" sx={{ mt: 1 }}>
                          {comment.replyTree.map((reply) => (
                            <RenderReplyNode
                              key={reply.id}
                              reply={reply}
                              depth={1}
                              user={user}
                              activeReplyId={activeReplyId}
                              setActiveReplyId={setActiveReplyId}
                              replyText={replyText}
                              setReplyText={setReplyText}
                              handlePostReplySubmit={handlePostReplySubmit}
                              getAuthorRoleTag={getAuthorRoleTag}
                              editingReplyId={editingReplyId}
                              setEditingReplyId={setEditingReplyId}
                              editingReplyText={editingReplyText}
                              setEditingReplyText={setEditingReplyText}
                              handleSaveReply={handleSaveReply}
                              handleDeleteReply={handleDeleteReply}
                              onFocusSubthread={(node) => setFocusedReply(node)}
                              isMod={isMod}
                              isJoinedMember={isJoinedMember}
                              collapsedReplyIds={collapsedReplyIds}
                              toggleReplyCollapse={toggleReplyCollapse}
                            />
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {comments.length > visibleCommentsCount && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="outlined" 
              onClick={() => setVisibleCommentsCount(prev => prev + 10)}
              sx={{ textTransform: 'none', borderRadius: 3 }}
            >
              View More Comments
            </Button>
          </Box>
        )}
      </Paper>

      {/* Themed Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, maxWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {confirmMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1.5 }}>
          <Button 
            variant="outlined" 
            onClick={() => setConfirmOpen(false)}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              if (onConfirmCallback) onConfirmCallback();
              setConfirmOpen(false);
            }}
            fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionDetailPage;
