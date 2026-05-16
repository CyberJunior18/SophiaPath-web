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

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email already exists' };
    }
    
    const newUser = { 
      ...userData, 
      id: Date.now().toString(),
      joinedDate: new Date().toISOString(),
      quizScores: {}, // { lessonId: score }
      registeredCourses: [], // [courseTitle]
      achievements: [],
      streak: 0
    };

    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    const { password, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const deleteAccount = () => {
    if (!user) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter(u => u.id !== user.id);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    logout();
  };

  const updateQuizScore = (lessonId, score) => {
    if (!user) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      const currentUser = users[userIndex];
      const currentScores = currentUser.quizScores || {};
      const previousHighScore = currentScores[lessonId] || 0;
      
      if (score > previousHighScore) {
        currentScores[lessonId] = score;
        currentUser.quizScores = currentScores;
        
        // Update user state and localStorage
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        
        const { password, ...userWithoutPassword } = currentUser;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      }
    }
  };

  const registerCourse = (courseTitle) => {
    if (!user) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      const currentUser = users[userIndex];
      const registered = currentUser.registeredCourses || [];
      
      if (!registered.includes(courseTitle)) {
        registered.push(courseTitle);
        currentUser.registeredCourses = registered;
        
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        
        const { password, ...userWithoutPassword } = currentUser;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, updateQuizScore, registerCourse, loading }}>

      {!loading && children}
    </AuthContext.Provider>
  );
};
