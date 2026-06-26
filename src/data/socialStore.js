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

const initLocalCommunities = () => {
  if (!localStorage.getItem('sophia_communities')) {
    const initialCommunities = [
      {
        id: 1,
        name: 'Computer Science',
        description: 'The general hub for computer science topics, software engineering theory, and computer systems.',
        icon: '💻',
        bannerColor: 'linear-gradient(135deg, #3D5CFF 0%, #7C8DFF 100%)',
        membersCount: 142,
        members: []
      },
      {
        id: 2,
        name: 'Cybersecurity Labs',
        description: 'Discussing network defense, security labs, web exploit scripts, cryptography, and server hardening.',
        icon: '🛡️',
        bannerColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        membersCount: 88,
        members: []
      },
      {
        id: 3,
        name: 'Philosophy & Logic',
        description: 'Debate logical fallacies, critical thinking paradigms, and argumentative analysis techniques.',
        icon: '🏛️',
        bannerColor: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        membersCount: 54,
        members: []
      }
    ];
    localStorage.setItem('sophia_communities', JSON.stringify(initialCommunities));
  }

  if (!localStorage.getItem('sophia_rooms')) {
    const initialRooms = [
      { id: 1, communityId: 1, name: 'general-cs', description: 'General discussions, CS concepts, and software engineering questions.' },
      { id: 2, communityId: 1, name: 'java-oop-design', description: 'Discuss object-oriented design patterns, UML structures, and Java interfaces.' },
      { id: 3, communityId: 1, name: 'web-technologies', description: 'Everything about HTML5, CSS3, DOM trees, and Javascript rendering cycles.' },
      { id: 4, communityId: 2, name: 'xss-csrf-help', description: 'Stuck on a cross-site scripting or csrf token challenge? Discuss tips here.' },
      { id: 5, communityId: 2, name: 'cryptography-math', description: 'Explore Enigma machines, Caesar cipher formulas, and RSA encryption algorithms.' },
      { id: 6, communityId: 3, name: 'logical-fallacies', description: 'Spot strawmans, ad-hominems, slippery slopes, and match arguments.' }
    ];
    localStorage.setItem('sophia_rooms', JSON.stringify(initialRooms));
  }

  if (!localStorage.getItem('sophia_questions')) {
    const initialQuestions = [
      {
        id: 1,
        roomId: 2,
        title: 'Why is composition preferred over inheritance in Java OOP design?',
        content: 'I am studying for the Java OOP module and keep reading that composition is more flexible than class inheritance. Can someone explain this in detail? When should I strictly use inheritance over composition, or is it always better to compose? An example with UML would be awesome.',
        authorId: 2,
        authorName: 'Alice Johnson',
        authorAvatar: '',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        upvotes: 2,
        upvotedUsers: [3, 4],
        downvotedUsers: [],
        commentsCount: 0
      },
      {
        id: 2,
        roomId: 2,
        title: 'Abstract class vs Interface in Java 8 and beyond',
        content: 'With default methods in interfaces, does Java 8 blur the line between abstract classes and interfaces? When should we choose one over the other now? Since we can write method bodies in both, what is the primary architectural difference?',
        authorId: 3,
        authorName: 'Bob Smith',
        authorAvatar: '',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        upvotes: 1,
        upvotedUsers: [2],
        downvotedUsers: [],
        commentsCount: 0
      },
      {
        id: 3,
        roomId: 4,
        title: 'Stuck on XSS lab filter bypass',
        content: 'I\'m trying to bypass a simple HTML input filter that sanitizes the word `<script>`. I tried uppercase `<SCRIPT>` and it seems to work, but is there a better way to trigger alert() without using `<script>` tags at all? Maybe image onerror handlers?',
        authorId: 4,
        authorName: 'Charlie Brown',
        authorAvatar: '',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        upvotes: 1,
        upvotedUsers: [1],
        downvotedUsers: [],
        commentsCount: 0
      }
    ];
    localStorage.setItem('sophia_questions', JSON.stringify(initialQuestions));
  }

  if (!localStorage.getItem('sophia_comments')) {
    localStorage.setItem('sophia_comments', JSON.stringify([]));
  }

  if (!localStorage.getItem('sophia_replies')) {
    localStorage.setItem('sophia_replies', JSON.stringify([]));
  }
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

  makeGroupAdmin: async (groupId, userId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/make-admin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: Number(userId)
        })
      });
      if (!res.ok) throw new Error('Failed to make group admin');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  removeGroupAdmin: async (groupId, userId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/remove-admin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: Number(userId)
        })
      });
      if (!res.ok) throw new Error('Failed to remove group admin');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  removeGroupMember: async (groupId, userId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/remove-member`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: Number(userId)
        })
      });
      if (!res.ok) throw new Error('Failed to remove group member');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- COMMUNITIES ---
  getCommunities: async () => {
    initLocalCommunities();
    const userId = getUserId();
    const list = JSON.parse(localStorage.getItem('sophia_communities') || '[]');
    const rooms = JSON.parse(localStorage.getItem('sophia_rooms') || '[]');
    return list.map(c => ({
      ...c,
      rooms: rooms.filter(r => r.communityId === c.id),
      isJoined: c.members?.includes(userId)
    }));
  },

  getCommunityById: async (communityId) => {
    initLocalCommunities();
    const userId = getUserId();
    const list = JSON.parse(localStorage.getItem('sophia_communities') || '[]');
    const rooms = JSON.parse(localStorage.getItem('sophia_rooms') || '[]');
    const c = list.find(item => Number(item.id) === Number(communityId));
    if (!c) return null;
    return {
      ...c,
      rooms: rooms.filter(r => r.communityId === c.id),
      isJoined: c.members?.includes(userId)
    };
  },

  toggleJoinCommunity: async (communityId) => {
    initLocalCommunities();
    const userId = getUserId();
    if (!userId) return null;
    const list = JSON.parse(localStorage.getItem('sophia_communities') || '[]');
    const cIndex = list.findIndex(item => Number(item.id) === Number(communityId));
    if (cIndex === -1) return null;
    
    let c = list[cIndex];
    c.members = c.members || [];
    const idx = c.members.indexOf(userId);
    if (idx === -1) {
      c.members.push(userId);
      c.membersCount = (c.membersCount || 0) + 1;
    } else {
      c.members.splice(idx, 1);
      c.membersCount = Math.max(0, (c.membersCount || 0) - 1);
    }
    list[cIndex] = c;
    localStorage.setItem('sophia_communities', JSON.stringify(list));
    return c;
  },

  createCommunity: async (name, description, icon) => {
    initLocalCommunities();
    const list = JSON.parse(localStorage.getItem('sophia_communities') || '[]');
    const nameExists = list.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
      alert("A community with this name already exists.");
      return null;
    }
    const newId = list.length > 0 ? Math.max(...list.map(item => item.id)) + 1 : 1;
    const gradients = [
      'linear-gradient(135deg, #3D5CFF 0%, #7C8DFF 100%)',
      'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
    ];
    const bannerColor = gradients[Math.floor(Math.random() * gradients.length)];
    const newC = {
      id: newId,
      name,
      description,
      icon,
      bannerColor,
      membersCount: 0,
      members: []
    };
    list.push(newC);
    localStorage.setItem('sophia_communities', JSON.stringify(list));
    
    // Auto-create general room
    const rooms = JSON.parse(localStorage.getItem('sophia_rooms') || '[]');
    const newRoomId = rooms.length > 0 ? Math.max(...rooms.map(r => r.id)) + 1 : 1;
    rooms.push({
      id: newRoomId,
      communityId: newId,
      name: 'general',
      description: `General discussion room for ${name}`
    });
    localStorage.setItem('sophia_rooms', JSON.stringify(rooms));
    
    return newC;
  },

  createRoom: async (communityId, name, description) => {
    initLocalCommunities();
    const rooms = JSON.parse(localStorage.getItem('sophia_rooms') || '[]');
    const newRoomId = rooms.length > 0 ? Math.max(...rooms.map(r => r.id)) + 1 : 1;
    const formattedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    const newRoom = {
      id: newRoomId,
      communityId: Number(communityId),
      name: formattedName,
      description
    };
    rooms.push(newRoom);
    localStorage.setItem('sophia_rooms', JSON.stringify(rooms));
    return newRoom;
  },

  // --- QUESTIONS (POSTS) ---
  getQuestions: async (roomId, sortBy = 'hot') => {
    initLocalCommunities();
    const userId = getUserId();
    const all = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const questions = all.filter(q => Number(q.roomId) === Number(roomId));
    
    const mapped = questions.map(q => ({
      ...q,
      userUpvoted: q.upvotedUsers?.includes(userId),
      userDownvoted: q.downvotedUsers?.includes(userId)
    }));

    if (sortBy === 'new') {
      return mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return mapped.sort((a, b) => {
      const diff = (b.upvotes || 0) - (a.upvotes || 0);
      if (diff !== 0) return diff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  },

  getQuestionById: async (questionId) => {
    initLocalCommunities();
    const userId = getUserId();
    const all = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const q = all.find(item => Number(item.id) === Number(questionId));
    if (!q) return null;
    return {
      ...q,
      userUpvoted: q.upvotedUsers?.includes(userId),
      userDownvoted: q.downvotedUsers?.includes(userId)
    };
  },

  createQuestion: async (roomId, title, content, author) => {
    initLocalCommunities();
    const rooms = JSON.parse(localStorage.getItem('sophia_rooms') || '[]');
    const room = rooms.find(r => Number(r.id) === Number(roomId));
    if (!room) return null;
    
    const communities = JSON.parse(localStorage.getItem('sophia_communities') || '[]');
    const community = communities.find(c => Number(c.id) === Number(room.communityId));
    if (!community) return null;
    
    const isMember = community.members?.includes(Number(author.id));
    if (!isMember) {
      alert("Only members of this community can post questions.");
      return null;
    }

    const all = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const newId = all.length > 0 ? Math.max(...all.map(item => item.id)) + 1 : 1;
    const newQ = {
      id: newId,
      roomId: Number(roomId),
      title,
      content,
      authorId: Number(author.id),
      authorName: author.name || author.fullname || author.username || 'learner',
      authorAvatar: author.avatar || '',
      timestamp: new Date().toISOString(),
      upvotes: 0,
      upvotedUsers: [],
      downvotedUsers: [],
      commentsCount: 0
    };
    all.push(newQ);
    localStorage.setItem('sophia_questions', JSON.stringify(all));
    return newQ;
  },

  upvoteQuestion: async (questionId, userId) => {
    initLocalCommunities();
    const uId = Number(userId);
    if (!uId) return null;
    const all = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const qIndex = all.findIndex(item => Number(item.id) === Number(questionId));
    if (qIndex === -1) return null;

    let q = all[qIndex];
    q.upvotedUsers = q.upvotedUsers || [];
    q.downvotedUsers = q.downvotedUsers || [];

    const upIdx = q.upvotedUsers.indexOf(uId);
    const downIdx = q.downvotedUsers.indexOf(uId);

    if (upIdx === -1) {
      q.upvotedUsers.push(uId);
      if (downIdx !== -1) {
        q.downvotedUsers.splice(downIdx, 1);
      }
    } else {
      q.upvotedUsers.splice(upIdx, 1);
    }
    q.upvotes = q.upvotedUsers.length - q.downvotedUsers.length;
    all[qIndex] = q;
    localStorage.setItem('sophia_questions', JSON.stringify(all));
    return q;
  },

  downvoteQuestion: async (questionId, userId) => {
    initLocalCommunities();
    const uId = Number(userId);
    if (!uId) return null;
    const all = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const qIndex = all.findIndex(item => Number(item.id) === Number(questionId));
    if (qIndex === -1) return null;

    let q = all[qIndex];
    q.upvotedUsers = q.upvotedUsers || [];
    q.downvotedUsers = q.downvotedUsers || [];

    const upIdx = q.upvotedUsers.indexOf(uId);
    const downIdx = q.downvotedUsers.indexOf(uId);

    if (downIdx === -1) {
      q.downvotedUsers.push(uId);
      if (upIdx !== -1) {
        q.upvotedUsers.splice(upIdx, 1);
      }
    } else {
      q.downvotedUsers.splice(downIdx, 1);
    }
    q.upvotes = q.upvotedUsers.length - q.downvotedUsers.length;
    all[qIndex] = q;
    localStorage.setItem('sophia_questions', JSON.stringify(all));
    return q;
  },

  // --- COMMENTS & REPLIES ---
  getComments: async (questionId) => {
    initLocalCommunities();
    const userId = getUserId();
    const allComments = JSON.parse(localStorage.getItem('sophia_comments') || '[]');
    const allReplies = JSON.parse(localStorage.getItem('sophia_replies') || '[]');
    
    const comments = allComments.filter(c => Number(c.questionId) === Number(questionId));
    
    const mapped = comments.map(c => {
      const replies = allReplies.filter(r => Number(r.commentId) === Number(c.id));
      return {
        ...c,
        userUpvoted: c.upvotedUsers?.includes(userId),
        userDownvoted: c.downvotedUsers?.includes(userId),
        replies: replies.map(r => ({
          ...r,
          userUpvoted: r.upvotedUsers?.includes(userId),
          userDownvoted: r.downvotedUsers?.includes(userId)
        })).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      };
    });

    // Sort by votes
    return mapped.sort((a, b) => {
      const diff = (b.upvotes || 0) - (a.upvotes || 0);
      if (diff !== 0) return diff;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  },

  addComment: async (questionId, content, author) => {
    initLocalCommunities();
    const allComments = JSON.parse(localStorage.getItem('sophia_comments') || '[]');
    const newId = allComments.length > 0 ? Math.max(...allComments.map(item => item.id)) + 1 : 1;
    const newC = {
      id: newId,
      questionId: Number(questionId),
      content,
      authorId: Number(author.id),
      authorName: author.name || author.fullname || author.username || 'learner',
      authorAvatar: author.avatar || '',
      timestamp: new Date().toISOString(),
      upvotes: 0,
      upvotedUsers: [],
      downvotedUsers: []
    };
    allComments.push(newC);
    localStorage.setItem('sophia_comments', JSON.stringify(allComments));

    // Increment commentsCount in question
    const questions = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const qIndex = questions.findIndex(item => Number(item.id) === Number(questionId));
    if (qIndex !== -1) {
      questions[qIndex].commentsCount = (questions[qIndex].commentsCount || 0) + 1;
      localStorage.setItem('sophia_questions', JSON.stringify(questions));
    }

    return newC;
  },

  addReply: async (questionId, commentId, content, author) => {
    initLocalCommunities();
    const allReplies = JSON.parse(localStorage.getItem('sophia_replies') || '[]');
    const newId = allReplies.length > 0 ? Math.max(...allReplies.map(item => item.id)) + 1 : 1;
    const newR = {
      id: newId,
      commentId: Number(commentId),
      content,
      authorId: Number(author.id),
      authorName: author.name || author.fullname || author.username || 'learner',
      authorAvatar: author.avatar || '',
      timestamp: new Date().toISOString(),
      upvotes: 0,
      upvotedUsers: [],
      downvotedUsers: []
    };
    allReplies.push(newR);
    localStorage.setItem('sophia_replies', JSON.stringify(allReplies));

    // Increment commentsCount in question
    const questions = JSON.parse(localStorage.getItem('sophia_questions') || '[]');
    const qIndex = questions.findIndex(item => Number(item.id) === Number(questionId));
    if (qIndex !== -1) {
      questions[qIndex].commentsCount = (questions[qIndex].commentsCount || 0) + 1;
      localStorage.setItem('sophia_questions', JSON.stringify(questions));
    }

    return newR;
  },

  upvoteComment: async (questionId, commentId, userId) => {
    initLocalCommunities();
    const uId = Number(userId);
    if (!uId) return null;
    const allComments = JSON.parse(localStorage.getItem('sophia_comments') || '[]');
    const cIndex = allComments.findIndex(item => Number(item.id) === Number(commentId));
    if (cIndex === -1) return null;

    let c = allComments[cIndex];
    c.upvotedUsers = c.upvotedUsers || [];
    c.downvotedUsers = c.downvotedUsers || [];

    const upIdx = c.upvotedUsers.indexOf(uId);
    const downIdx = c.downvotedUsers.indexOf(uId);

    if (upIdx === -1) {
      c.upvotedUsers.push(uId);
      if (downIdx !== -1) {
        c.downvotedUsers.splice(downIdx, 1);
      }
    } else {
      c.upvotedUsers.splice(upIdx, 1);
    }
    c.upvotes = c.upvotedUsers.length - c.downvotedUsers.length;
    allComments[cIndex] = c;
    localStorage.setItem('sophia_comments', JSON.stringify(allComments));
    return c;
  },

  downvoteComment: async (questionId, commentId, userId) => {
    initLocalCommunities();
    const uId = Number(userId);
    if (!uId) return null;
    const allComments = JSON.parse(localStorage.getItem('sophia_comments') || '[]');
    const cIndex = allComments.findIndex(item => Number(item.id) === Number(commentId));
    if (cIndex === -1) return null;

    let c = allComments[cIndex];
    c.upvotedUsers = c.upvotedUsers || [];
    c.downvotedUsers = c.downvotedUsers || [];

    const upIdx = c.upvotedUsers.indexOf(uId);
    const downIdx = c.downvotedUsers.indexOf(uId);

    if (downIdx === -1) {
      c.downvotedUsers.push(uId);
      if (upIdx !== -1) {
        c.upvotedUsers.splice(upIdx, 1);
      }
    } else {
      c.downvotedUsers.splice(downIdx, 1);
    }
    c.upvotes = c.upvotedUsers.length - c.downvotedUsers.length;
    allComments[cIndex] = c;
    localStorage.setItem('sophia_comments', JSON.stringify(allComments));
    return c;
  }
};
