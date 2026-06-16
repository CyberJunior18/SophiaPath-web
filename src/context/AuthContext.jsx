import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user courses and grades from backend
  const fetchUserProgress = async (token) => {
    try {
      // 1. Fetch registered courses
      const regRes = await fetch('/courses/me/registrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!regRes.ok) return { registeredCourses: [], quizScores: {} };

      const registrations = await regRes.json();
      const registeredCourses = registrations.map(r => r.course.title);

      // 2. Fetch grades for each registration
      const quizScores = {};
      for (const reg of registrations) {
        try {
          const gradesRes = await fetch(`/courses/me/courses/${reg.course.id}/grades`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (gradesRes.ok) {
            const grades = await gradesRes.json();
            grades.forEach(g => {
              if (g.done || g.grade !== null) {
                // Map to frontend lessonId score structure
                quizScores[g.lessonId] = g.grade !== null ? Number(g.grade) : 100;
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch grades for course ${reg.course.id}:`, err);
        }
      }

      return { registeredCourses, quizScores };
    } catch (err) {
      console.error('Failed to fetch user progress:', err);
      return { registeredCourses: [], quizScores: {} };
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await fetch('/users/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            const progress = await fetchUserProgress(savedToken);

            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.fullname,
              username: userData.username,
              age: userData.age,
              gender: userData.gender,
              tag: userData.tag,
              joinedDate: userData.dateTime,
              avatar: localStorage.getItem(`avatar_${userData.id}`) || 'https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg',
              achievements: [],
              streak: 0,
              ...progress
            });
          } else {
            // Token expired or invalid
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Init auth error:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      let email = identifier;

      // Handle username-to-email conversion
      if (identifier && !identifier.includes('@')) {
        try {
          const usersRes = await fetch('/users');
          if (usersRes.ok) {
            const usersList = await usersRes.json();
            const foundUser = usersList.find(
              (u) => u.username && u.username.toLowerCase() === identifier.toLowerCase()
            );
            if (foundUser && foundUser.email) {
              email = foundUser.email;
            }
          }
        } catch (e) {
          console.error('Username resolution error:', e);
        }
      }

      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.message || 'Invalid username/email or password' };
      }

      const { accessToken } = await res.json();
      localStorage.setItem('token', accessToken);

      // Fetch user profile info
      const meRes = await fetch('/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (meRes.ok) {
        const userData = await meRes.json();
        const progress = await fetchUserProgress(accessToken);

        // Migrate pending registration avatar if exists
        const pendingAvatar = localStorage.getItem(`pending_avatar_${userData.email}`);
        if (pendingAvatar) {
          localStorage.setItem(`avatar_${userData.id}`, pendingAvatar);
          localStorage.removeItem(`pending_avatar_${userData.email}`);
        }

        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.fullname,
          username: userData.username,
          age: userData.age,
          gender: userData.gender,
          tag: userData.tag,
          joinedDate: userData.dateTime,
          avatar: localStorage.getItem(`avatar_${userData.id}`) || 'https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg',
          achievements: [],
          streak: 0,
          ...progress
        });
        return { success: true };
      }
      return { success: false, message: 'Failed to retrieve profile data' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Network error or backend offline' };
    }
  };

  const register = async (userData) => {
    try {
      const email = userData.email;
      const password = userData.password;
      const fullname = userData.fullname || userData.name || "Learner";
      
      const username = userData.username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const validUsername = username.length >= 4 ? username : (username + "1234").slice(0, 4);

      const payload = {
        email,
        password,
        username: validUsername,
        fullname,
        tag: userData.tag || "Learner",
        gender: userData.gender || "Rather Not Say",
        age: userData.age ? Number(userData.age) : 20
      };

      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.message || 'Registration failed' };
      }

      if (userData.avatar) {
        localStorage.setItem(`pending_avatar_${email}`, userData.avatar);
      }

      // Auto-login after registration
      return await login(email, password);
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, message: 'Network error or backend offline' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const deleteAccount = () => {
    // Delete account locally & clean token
    logout();
  };

  const updateQuizScore = async (lessonId, score) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/courses/me/lessons/${lessonId}/grade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grade: Number(score) })
      });

      if (res.ok) {
        setUser(prev => {
          const currentScores = prev.quizScores || {};
          const previousHighScore = currentScores[lessonId] || 0;
          if (score > previousHighScore) {
            return {
              ...prev,
              quizScores: {
                ...currentScores,
                [lessonId]: score
              }
            };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('updateQuizScore error:', err);
    }
  };

  const registerCourse = async (courseTitle) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 1. Fetch courses to match the title
      const coursesRes = await fetch('/courses');
      if (!coursesRes.ok) return;

      const coursesList = await coursesRes.json();
      const course = coursesList.find(c => c.title.toLowerCase() === courseTitle.toLowerCase());

      if (course) {
        // 2. Call register API
        const regRes = await fetch(`/courses/me/register/${course.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (regRes.ok) {
          setUser(prev => ({
            ...prev,
            registeredCourses: [...(prev.registeredCourses || []), courseTitle]
          }));
        }
      }
    } catch (err) {
      console.error('registerCourse error:', err);
    }
  };
  
  const unregisterCourse = async (courseTitle) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 1. Fetch courses to match the title
      const coursesRes = await fetch('/courses');
      if (!coursesRes.ok) return;

      const coursesList = await coursesRes.json();
      const course = coursesList.find(c => c.title.toLowerCase() === courseTitle.toLowerCase());

      if (course) {
        // 2. Call unregister API
        const regRes = await fetch(`/courses/me/register/${course.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (regRes.ok) {
          setUser(prev => ({
            ...prev,
            registeredCourses: (prev.registeredCourses || []).filter(
              title => title.toLowerCase() !== courseTitle.toLowerCase()
            )
          }));
        }
      }
    } catch (err) {
      console.error('unregisterCourse error:', err);
    }
  };

  const updateProfile = async (profileData) => {
    if (!user) return { success: false, message: 'Not logged in' };
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'No token' };

    try {
      const payload = {};
      if (profileData.name !== undefined) payload.fullname = profileData.name;
      if (profileData.username !== undefined) payload.username = profileData.username;
      if (profileData.tag !== undefined) payload.tag = profileData.tag;
      if (profileData.gender !== undefined) payload.gender = profileData.gender;
      if (profileData.age !== undefined) payload.age = Number(profileData.age);

      const res = await fetch('/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.message || 'Update failed' };
      }

      const updatedUser = await res.json();
      
      if (profileData.avatar) {
        localStorage.setItem(`avatar_${user.id}`, profileData.avatar);
      }

      setUser(prev => ({
        ...prev,
        name: updatedUser.fullname,
        username: updatedUser.username,
        tag: updatedUser.tag,
        gender: updatedUser.gender,
        age: updatedUser.age,
        avatar: profileData.avatar || prev.avatar
      }));

      return { success: true };
    } catch (err) {
      console.error('updateProfile error:', err);
      return { success: false, message: 'Network error or backend offline' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, updateQuizScore, registerCourse, unregisterCourse, updateProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
