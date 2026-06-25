// Frontend Store service making REST API calls to the NestJS backend.

const getUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return Number(payload.sub);
  } catch (e) {
    return null;
  }
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const socialStore = {
  // --- GROUPS ---
  getGroups: async (userId) => {
    try {
      const res = await fetch(`/api/groups/user/${userId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load groups');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getGroupById: async (groupId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load group details');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  createGroup: async (name, description, memberIds, creatorId, creatorName) => {
    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          description,
          memberIds: memberIds.map(Number),
          creatorId: Number(creatorId),
          creatorName
        })
      });
      if (!res.ok) throw new Error('Failed to create group');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  sendGroupMessage: async (groupId, senderId, senderName, senderAvatar, text) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/send-message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          senderId: Number(senderId),
          senderName,
          senderAvatar,
          text
        })
      });
      if (!res.ok) throw new Error('Failed to send group message');
      const data = await res.json();
      return data.message;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/add-members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          memberIds: memberIds.map(Number)
        })
      });
      if (!res.ok) throw new Error('Failed to add group members');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- COMMUNITIES ---
  getCommunities: async () => {
    try {
      const userId = getUserId();
      const res = await fetch('/api/communities', { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load communities');
      const data = await res.json();
      
      // Map join status using member list
      return data.map(c => ({
        ...c,
        isJoined: c.members?.some(m => Number(m.id) === Number(userId))
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getCommunityById: async (communityId) => {
    try {
      const res = await fetch(`/api/communities/${communityId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load community details');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  toggleJoinCommunity: async (communityId) => {
    try {
      const userId = getUserId();
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to toggle join community');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  createCommunity: async (name, description, icon) => {
    try {
      const res = await fetch('/api/communities/create', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, description, icon })
      });
      if (!res.ok) throw new Error('Failed to create community');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  createRoom: async (communityId, name, description) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/create-room`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, description })
      });
      if (!res.ok) throw new Error('Failed to create room');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- QUESTIONS (POSTS) ---
  getQuestions: async (roomId, sortBy = 'new') => {
    try {
      const userId = getUserId();
      const res = await fetch(`/api/communities/rooms/${roomId}/questions?sortBy=${sortBy}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      
      return data.map(q => ({
        ...q,
        userUpvoted: q.upvotedUsers?.includes(Number(userId))
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getQuestionById: async (questionId) => {
    try {
      const userId = getUserId();
      const res = await fetch(`/api/communities/questions/${questionId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load question details');
      const q = await res.json();
      
      return {
        ...q,
        userUpvoted: q.upvotedUsers?.includes(Number(userId))
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  createQuestion: async (roomId, title, content, author) => {
    try {
      const res = await fetch(`/api/communities/rooms/${roomId}/questions/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          content,
          authorId: Number(author.id),
          authorName: author.name || author.fullname || author.username || 'learner',
          authorAvatar: author.avatar || ''
        })
      });
      if (!res.ok) throw new Error('Failed to post question');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  upvoteQuestion: async (questionId, userId) => {
    try {
      const res = await fetch(`/api/communities/questions/${questionId}/upvote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: Number(userId) })
      });
      if (!res.ok) throw new Error('Failed to upvote question');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- COMMENTS & REPLIES ---
  getComments: async (questionId) => {
    try {
      const userId = getUserId();
      const res = await fetch(`/api/communities/questions/${questionId}/comments`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load comments');
      const comments = await res.json();

      return comments.map(c => ({
        ...c,
        userUpvoted: c.upvotedUsers?.includes(Number(userId)),
        replies: c.replies?.map(r => ({
          ...r,
          userUpvoted: r.upvotedUsers?.includes(Number(userId))
        }))
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  addComment: async (questionId, content, author) => {
    try {
      const res = await fetch(`/api/communities/questions/${questionId}/comments/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content,
          authorId: Number(author.id),
          authorName: author.name || author.fullname || author.username || 'learner',
          authorAvatar: author.avatar || ''
        })
      });
      if (!res.ok) throw new Error('Failed to post comment');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  addReply: async (questionId, commentId, content, author) => {
    try {
      const res = await fetch(`/api/communities/comments/${commentId}/replies/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content,
          authorId: Number(author.id),
          authorName: author.name || author.fullname || author.username || 'learner',
          authorAvatar: author.avatar || ''
        })
      });
      if (!res.ok) throw new Error('Failed to post reply');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  upvoteComment: async (questionId, commentId, userId) => {
    try {
      const res = await fetch(`/api/communities/comments/${commentId}/upvote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: Number(userId) })
      });
      if (!res.ok) throw new Error('Failed to upvote comment');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  }
};
