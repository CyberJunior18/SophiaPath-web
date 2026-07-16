import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  Paper,
  TextField,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Switch,
  Checkbox,
  FormControlLabel,
  Card,
  Stack,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Radio,
  RadioGroup
} from '@mui/material';
import {
  People as PeopleIcon,
  MenuBook as BookIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  AssignmentTurnedIn as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  DragHandle as DragHandleIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Lock as LockIcon,
  Storage as DatabaseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { coursesData } from '../data/courses';
import { useAuth } from '../context/AuthContext';
import AiAuditorDashboard from '../components/course/AiAuditorDashboard';


// Available cyber lab values
const CYBER_LABS = [
  { value: 'ransomware', label: 'Ransomware Simulator' },
  { value: 'caesar', label: 'Caesar Cipher Explorer' },
  { value: 'vigenere', label: 'Vigenère Cipher Explorer' },
  { value: 'enigma', label: 'Enigma Machine Simulator' },
  { value: 'rsa', label: 'RSA Cryptosystem Visualizer' },
  { value: 'base64', label: 'Base64 Data Encoder' },
  { value: 'xor', label: 'XOR Bitwise Cipher' },
  { value: 'dos', label: 'Denial of Service Lab' },
  { value: 'ddos', label: 'Distributed Denial of Service' },
  { value: 'social', label: 'Social Engineering Phishing Lab' },
  { value: 'insider', label: 'Insider Threat Data Exfiltration' }
];

// Helper for authenticated requests in admin dashboard
const adminFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
};

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tab and Editing States initialized from LocalStorage to survive page refreshes
  const [adminTab, setAdminTab] = useState(() => {
    return localStorage.getItem('sophiapath_admin_tab') || 'courses';
  });
  
  const [courses, setCourses] = useState(coursesData);
  const [loadError, setLoadError] = useState(null);
  const [coursesProgress, setCoursesProgress] = useState({});
  
  // Navigation State inside Admin Page
  const [editingCourseDetails, setEditingCourseDetails] = useState(() => {
    const saved = localStorage.getItem('sophiapath_admin_editing_course');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }); // Course currently editing sections/lessons
  const [courseSubTab, setCourseSubTab] = useState(() => {
    return localStorage.getItem('sophiapath_admin_course_subtab') || 'syllabus';
  });
  const [editingLesson, setEditingLesson] = useState(() => {
    const saved = localStorage.getItem('sophiapath_admin_editing_lesson');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  const [activeSlideIndex, setActiveSlideIndex] = useState(() => {
    const saved = localStorage.getItem('sophiapath_admin_active_slide_index');
    return saved ? Number(saved) : 0;
  });
  
  const [draggedSlideIdx, setDraggedSlideIdx] = useState(null);
  const [dragOverSlideIdx, setDragOverSlideIdx] = useState(null);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState(null);
  
  // Role constants matching backend UserRole enum
  const ROLE_NAMES = { 0: 'Student', 1: 'Expert', 2: 'Moderator', 3: 'Admin' };
  const ROLE_COLORS = {
    0: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' },
    1: { bg: 'rgba(255,255,255,0.05)', color: 'var(--primary-main)' },
    2: { bg: 'rgba(255,255,255,0.05)', color: 'var(--primary-main)' },
    3: { bg: 'rgba(255,255,255,0.05)', color: 'var(--primary-main)' }
  };

  const getLessonFinishedCount = (lessonId) => {
    const progressList = coursesProgress[editingCourseDetails?.id] || [];
    return progressList.filter(record => {
      const gradeObj = record.grades?.find(g => Number(g.lessonId) === Number(lessonId));
      return gradeObj && (gradeObj.completed || (gradeObj.grade !== null && gradeObj.grade >= 70));
    }).length;
  };

  const getSectionFinishedCount = (section) => {
    const progressList = coursesProgress[editingCourseDetails?.id] || [];
    const lessonIds = (section.lessons || []).map(l => l.id);
    if (lessonIds.length === 0) return 0;
    return progressList.filter(record => {
      return lessonIds.every(lid => {
        const gradeObj = record.grades?.find(g => Number(g.lessonId) === Number(lid));
        return gradeObj && (gradeObj.completed || (gradeObj.grade !== null && gradeObj.grade >= 70));
      });
    }).length;
  };

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [sectionLessonSearch, setSectionLessonSearch] = useState({});
  const [sectionLessonCategory, setSectionLessonCategory] = useState({});
  const [sectionLessonChapter, setSectionLessonChapter] = useState({});

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedAppForView, setSelectedAppForView] = useState(null);

  const parseAppDetails = (app) => {
    try {
      if (app.reasons && (app.reasons.startsWith('{') || app.reasons.startsWith('['))) {
        const parsed = JSON.parse(app.reasons);
        return {
          isCustom: true,
          email: parsed.email,
          phone: parsed.phone,
          cvFileName: parsed.cvFileName,
          cvBase64: parsed.cvBase64,
          reasonsText: parsed.reasons
        };
      }
    } catch (e) {
      console.warn("Failed to parse app reasons:", e);
    }
    return {
      isCustom: false,
      reasonsText: app.reasons
    };
  };

  const [logs, setLogs] = useState([
    { id: 1, timestamp: '2026-07-04 14:32:00', event: 'ElevenLabs Socratic Voice generated for slide completion', level: 'info' },
    { id: 2, timestamp: '2026-07-04 12:15:12', event: 'New user registration: David Lee (david@outlook.com)', level: 'info' },
    { id: 3, timestamp: '2026-07-04 09:44:05', event: 'Socrates AI upgraded to model deepseek-v4-flash', level: 'system' },
    { id: 4, timestamp: '2026-07-03 23:20:45', event: 'Course registered: Mostafa Capstone enrolled in Cybersecurity', level: 'action' },
    { id: 5, timestamp: '2026-07-03 18:02:11', event: 'Failed login attempt for admin account from IP 198.162.1.42', level: 'warning' }
  ]);

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    publicRegistrations: true,
    strictSsl: true,
    socratesThinkingMode: 'Thinking (Reasoning)',
    defaultTtsVoice: 'Antoni'
  });

  // Course dialog form state (metadata only)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    id: null,
    title: '',
    description: '',
    about: '',
    imageUrl: 'https://sophiapath.edu/images/course.png',
    comingsoon: false
  });

  // Section dialog form state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    id: null,
    title: '',
    description: '',
    orderIndex: 0,
    isNew: true
  });

  // User dialog form state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    id: null,
    name: '',
    roleID: 0,
    assignedCourseIds: []
  });

  // Persist tab state
  useEffect(() => {
    localStorage.setItem('sophiapath_admin_tab', adminTab);
  }, [adminTab]);

  // Force Expert user to courses tab only
  useEffect(() => {
    if (Number(user?.roleID) === 1 && adminTab !== 'courses') {
      setAdminTab('courses');
    }
  }, [user, adminTab]);

  // Open editor directly if coming from Courses page edit action (Expert settings icon)
  useEffect(() => {
    if (location.state?.editCourse && courses.length > 0) {
      const match = courses.find(c => String(c.id) === String(location.state.editCourse.id));
      if (match) {
        setAdminTab('courses');
        setEditingCourseDetails(match);
        // Clear state to avoid reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, courses]);

  // Load real users from backend when Users tab is active
  useEffect(() => {
    if (adminTab === 'users') {
      setUsersLoading(true);
      fetch('/users')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const mapped = (data || []).map(u => {
            const finalRoleId = u.roleID ?? 0;
            const finalCourses = u.assignedCourseIds || [];
            return {
              id: u.id,
              name: u.fullname || u.username || 'Unknown',
              email: u.email,
              username: u.username,
              roleID: finalRoleId,
              roleName: ROLE_NAMES[finalRoleId] || 'Student',
              xp: u.xp ?? 0,
              level: u.level ?? 1,
              levelName: u.levelName ?? 'Beginner',
              assignedCourseIds: finalCourses
            };
          });
          setUsers(mapped);
        })
        .catch(err => console.error('Failed to load users:', err))
        .finally(() => setUsersLoading(false));
    }
    if (adminTab === 'applications') {
      setApplicationsLoading(true);
      adminFetch('/users/applications')
        .then(res => res.ok ? res.json() : [])
        .then(data => setApplications(data || []))
        .catch(err => console.error('Failed to load applications:', err))
        .finally(() => setApplicationsLoading(false));
    }
  }, [adminTab]);

  // Persist editing course details state (store the course ID and full object)
  useEffect(() => {
    if (editingCourseDetails) {
      localStorage.setItem('sophiapath_admin_editing_course_id', editingCourseDetails.id);
      localStorage.setItem('sophiapath_admin_editing_course', JSON.stringify(editingCourseDetails));
    }
  }, [editingCourseDetails]);

  // Persist active course sub-tab
  useEffect(() => {
    localStorage.setItem('sophiapath_admin_course_subtab', courseSubTab);
  }, [courseSubTab]);

  // Persist lesson editor state
  useEffect(() => {
    if (editingLesson) {
      localStorage.setItem('sophiapath_admin_editing_lesson', JSON.stringify(editingLesson));
    } else {
      localStorage.removeItem('sophiapath_admin_editing_lesson');
    }
  }, [editingLesson]);

  // Persist active slide index
  useEffect(() => {
    localStorage.setItem('sophiapath_admin_active_slide_index', activeSlideIndex);
  }, [activeSlideIndex]);

  const loadProgressForAllCourses = async (courseList) => {
    if (!courseList || courseList.length === 0) return;
    const progressMap = {};
    for (const course of courseList) {
      try {
        const res = await adminFetch(`/courses/${course.id}/students-progress`);
        if (res.ok) {
          progressMap[course.id] = await res.json();
        }
      } catch (err) {
        console.error(`Failed to load progress for course ${course.id}:`, err);
      }
    }
    setCoursesProgress(progressMap);
  };

  // Load all courses from database
  const loadCourses = async () => {
    try {
      const res = await adminFetch('/courses/export/all');
      if (res.ok) {
        const backendCourses = await res.json();
        setLoadError(null);
        if (backendCourses && backendCourses.length > 0) {
          const sorted = backendCourses.sort((a, b) => a.id - b.id);
          setCourses(sorted);
          await loadProgressForAllCourses(sorted);
          
          // Check if we need to restore editingCourseDetails from localStorage
          const savedCourseId = localStorage.getItem('sophiapath_admin_editing_course_id');
          if (savedCourseId) {
            const courseObj = sorted.find(c => String(c.id) === String(savedCourseId));
            if (courseObj) {
              setEditingCourseDetails(courseObj);
              return;
            }
          }

          // If Expert has no active course, auto-assign first assigned course
          if (Number(user?.roleID) === 1) {
            const expertCourses = user.assignedCourseIds ? user.assignedCourseIds.map(Number) : [];
            const firstCourse = sorted.find(c => expertCourses.includes(Number(c.id)));
            if (firstCourse) {
              setEditingCourseDetails(firstCourse);
            }
          }
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          setLoadError('Session Unauthorized: If you recently changed roles, please logout and log back in to refresh your admin credentials.');
        } else {
          setLoadError(`Failed to load courses from database (Status: ${res.status}).`);
        }
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      setLoadError('Failed to load courses: Network error or server offline.');
    }
  };

  useEffect(() => {
    loadCourses();
    fetch('/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(u => {
            const finalRoleId = u.roleID ?? 0;
            const finalCourses = u.assignedCourseIds || [];
            return {
              id: u.id,
              name: u.fullname || u.username || 'Unknown',
              username: u.username,
              email: u.email,
              roleID: finalRoleId,
              roleName: ROLE_NAMES[finalRoleId] || 'Student',
              xp: u.xp || 0,
              level: u.level || 1,
              assignedCourseIds: finalCourses
            };
          });
          setUsers(mapped);
        }
      })
      .catch(err => console.error('Failed to pre-load users:', err));
  }, [user]);

  useEffect(() => {
    if (courses && courses.length > 0) {
      loadProgressForAllCourses(courses);
    }
  }, [courses, user]);

  // Log database helpers
  const loadLogs = useCallback(async () => {
    try {
      const res = await adminFetch('/users/logs');
      if (res.ok) {
        const data = await res.json();
        // Convert timestamp to clean format
        const formatted = (data || []).map(item => ({
          ...item,
          timestamp: new Date(item.timestamp).toISOString().replace('T', ' ').substring(0, 19)
        }));
        setLogs(formatted);
      }
    } catch (err) {
      console.error("Failed to load security logs:", err);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (adminTab === 'logs') {
      loadLogs();
    }
  }, [adminTab, loadLogs]);

  // Log simple helper
  const addLog = async (event, level = 'info') => {
    setLogs(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      event,
      level
    }, ...prev]);

    try {
      await adminFetch('/users/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, level })
      });
    } catch (err) {
      console.error("Failed to save log to DB:", err);
    }
  };

  // Course CRUD handlers
  const handleOpenCourseCreate = () => {
    setCourseForm({
      id: null,
      title: '',
      description: '',
      about: '',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      comingsoon: false
    });
    setCourseDialogOpen(true);
  };

  const handleOpenCourseEditMetadata = (course) => {
    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description,
      about: course.about || '',
      imageUrl: course.imageUrl || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      comingsoon: course.comingsoon || false
    });
    setCourseDialogOpen(true);
  };

  const handleSaveCourseMetadata = async () => {
    if (!courseForm.title.trim() || !courseForm.description.trim()) return;

    try {
      if (courseForm.id === null) {
        // Create Course (requires unique integer ID)
        const nextId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
        const res = await adminFetch('/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: nextId,
            title: courseForm.title,
            description: courseForm.description,
            about: courseForm.about,
            imageUrl: courseForm.imageUrl,
            comingsoon: courseForm.comingsoon,
            sections: []
          })
        });
        if (res.ok) {
          addLog('Course created in Database: "' + courseForm.title + '"', 'action');
          await loadCourses();
        } else {
          alert('Failed to save course to database');
        }
      } else {
        // Update Course Metadata
        const res = await adminFetch('/courses/' + courseForm.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseForm)
        });
        
        // Always reflect in state
        setCourses(prev => prev.map(c => c.id === courseForm.id ? { ...c, ...courseForm } : c));
        addLog('Course metadata updated: "' + courseForm.title + '"', 'action');
      }
      setCourseDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (window.confirm('WARNING: Are you sure you want to permanently delete the course "' + courseTitle + '"? This will delete all its sections and lessons.')) {
      try {
        const res = await adminFetch('/courses/' + courseId, {
          method: 'DELETE'
        });
        if (res.ok) {
          addLog('Course deleted from Database: "' + courseTitle + '"', 'warning');
          setEditingCourseDetails(null);
          localStorage.removeItem('sophiapath_admin_editing_course_id');
          localStorage.removeItem('sophiapath_admin_editing_course');
          localStorage.removeItem('sophiapath_admin_course_subtab');
          await loadCourses();
        } else {
          // Fallback delete state
          setCourses(prev => prev.filter(c => c.id !== courseId));
          alert('Successfully deleted course locally.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Section CRUD Handlers
  const handleOpenSectionCreate = () => {
    setSectionForm({
      id: null,
      title: '',
      description: '',
      orderIndex: editingCourseDetails.sections?.length || 0,
      isNew: true
    });
    setSectionDialogOpen(true);
  };

  const handleOpenSectionEdit = (section) => {
    setSectionForm({
      id: section.id,
      title: section.title,
      description: section.description,
      orderIndex: section.orderIndex || 0,
      isNew: false
    });
    setSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) return;
    const courseId = editingCourseDetails.id;

    try {
      if (sectionForm.isNew) {
        const nextSecId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100);
        const res = await adminFetch('/courses/' + courseId + '/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: nextSecId,
            title: sectionForm.title,
            description: sectionForm.description || '',
            orderIndex: Number(sectionForm.orderIndex || 0),
            lessons: []
          })
        });
        if (res.ok) {
          addLog('Section "' + sectionForm.title + '" added to course id ' + courseId, 'action');
          await loadCourses();
        } else {
          alert('Failed to save section to database');
        }
      } else {
        const res = await adminFetch('/courses/' + courseId + '/sections/' + sectionForm.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sectionForm.title,
            description: sectionForm.description || '',
            orderIndex: Number(sectionForm.orderIndex || 0)
          })
        });
        if (res.ok) {
          addLog('Section "' + sectionForm.title + '" updated', 'action');
          await loadCourses();
        } else {
          alert('Failed to update section in database');
        }
      }
      setSectionDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSection = async (sectionId, sectionTitle) => {
    if (window.confirm('Are you sure you want to permanently delete the section "' + sectionTitle + '" and all its lessons?')) {
      const courseId = editingCourseDetails.id;
      try {
        const res = await adminFetch('/courses/' + courseId + '/sections/' + sectionId, {
          method: 'DELETE'
        });
        if (res.ok) {
          addLog('Section "' + sectionTitle + '" deleted from database', 'warning');
          await loadCourses();
        } else {
          alert('Failed to delete section from database');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Lesson CRUD Handlers
  const handleOpenLessonCreate = (sectionId) => {
    // Open WYSIWYG Mode in Create Mode
    setEditingLesson({
      courseId: editingCourseDetails.id,
      sectionId,
      lessonId: null,
      isNew: true,
      title: 'New Lesson',
      category: 'learning',
      chapterName: 'Chapter 1',
      orderIndex: 0,
      pages: [
        {
          pageId: 1,
          pageTitle: 'Introduction',
          orderIndex: 0,
          blocks: [
            { type: 'paragraph', text: 'Welcome to this new lesson. Start editing slide blocks here!' }
          ]
        }
      ]
    });
    setActiveSlideIndex(0);
  };

  const handleOpenLessonEdit = (sectionId, lesson) => {
    // Open WYSIWYG Mode in Edit Mode
    setEditingLesson({
      courseId: editingCourseDetails.id,
      sectionId,
      lessonId: lesson.id,
      isNew: false,
      title: lesson.title,
      category: lesson.category || 'learning',
      chapterName: lesson.chapterName || 'Chapter 1',
      orderIndex: lesson.orderIndex || 0,
      pages: (lesson.pages && lesson.pages.length > 0) ? lesson.pages : [
        {
          pageId: 1,
          pageTitle: 'Intro Slide',
          orderIndex: 0,
          blocks: [{ type: 'paragraph', text: 'Enter text here...' }]
        }
      ]
    });
    setActiveSlideIndex(0);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson.title.trim()) {
      alert('Lesson title is required!');
      return;
    }
    const { courseId, sectionId, lessonId, isNew, title, category, chapterName, orderIndex, pages } = editingLesson;

    try {
      if (isNew) {
        const res = await adminFetch('/courses/' + courseId + '/sections/' + sectionId + '/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            title,
            chapterName,
            orderIndex: Number(orderIndex || 0),
            pages
          })
        });
        if (res.ok) {
          addLog('Lesson "' + title + '" created successfully!', 'action');
          setEditingLesson(null);
          await loadCourses();
        } else {
          const errData = await res.json();
          alert('Failed to save lesson: ' + (errData.message || res.statusText));
        }
      } else {
        const res = await adminFetch('/courses/' + courseId + '/sections/' + sectionId + '/lessons/' + lessonId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            title,
            chapterName,
            orderIndex: Number(orderIndex || 0),
            pages
          })
        });
        if (res.ok) {
          addLog('Lesson "' + title + '" updated successfully!', 'action');
          setEditingLesson(null);
          await loadCourses();
        } else {
          alert('Failed to update lesson in database');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving lesson');
    }
  };

  const handleDeleteLesson = async (sectionId, lessonId, lessonTitle) => {
    if (window.confirm('Are you sure you want to permanently delete the lesson "' + lessonTitle + '"?')) {
      const courseId = editingCourseDetails.id;
      try {
        const res = await adminFetch('/courses/' + courseId + '/sections/' + sectionId + '/lessons/' + lessonId, {
          method: 'DELETE'
        });
        if (res.ok) {
          addLog('Lesson "' + lessonTitle + '" deleted from database', 'warning');
          await loadCourses();
        } else {
          alert('Failed to delete lesson from database');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Slide Outline Manipulation Handlers
  const handleAddSlide = () => {
    const nextId = editingLesson.pages.length > 0 ? Math.max(...editingLesson.pages.map(p => p.pageId || 0)) + 1 : 1;
    const newSlide = {
      pageId: nextId,
      pageTitle: 'New Slide',
      orderIndex: editingLesson.pages.length,
      blocks: [{ type: 'paragraph', text: 'Edit slide contents here...' }]
    };
    setEditingLesson(prev => {
      const newPages = [...prev.pages, newSlide];
      return { ...prev, pages: newPages };
    });
    setActiveSlideIndex(editingLesson.pages.length);
  };

  const handleDeleteSlide = (indexToDelete) => {
    if (editingLesson.pages.length <= 1) {
      alert('Cannot delete the last slide! A lesson must contain at least 1 slide.');
      return;
    }
    if (window.confirm('Delete slide index ' + (indexToDelete + 1) + '?')) {
      setEditingLesson(prev => {
        const newPages = prev.pages.filter((_, idx) => idx !== indexToDelete);
        return { ...prev, pages: newPages };
      });
      setActiveSlideIndex(prevIdx => {
        if (prevIdx >= editingLesson.pages.length - 1) {
          return editingLesson.pages.length - 2;
        }
        return prevIdx;
      });
    }
  };

  const handleMoveSlideUp = (idx) => {
    if (idx === 0) return;
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const temp = newPages[idx];
      newPages[idx] = newPages[idx - 1];
      newPages[idx - 1] = temp;
      return { ...prev, pages: newPages };
    });
    setActiveSlideIndex(idx - 1);
  };

  const handleMoveSlideDown = (idx) => {
    if (idx === editingLesson.pages.length - 1) return;
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const temp = newPages[idx];
      newPages[idx] = newPages[idx + 1];
      newPages[idx + 1] = temp;
      return { ...prev, pages: newPages };
    });
    setActiveSlideIndex(idx + 1);
  };

  // Block Content Handlers
  const handleUpdateBlock = (blockIdx, updatedFields) => {
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const activeSlide = { ...newPages[activeSlideIndex] };
      const newBlocks = [...activeSlide.blocks];
      newBlocks[blockIdx] = { ...newBlocks[blockIdx], ...updatedFields };
      activeSlide.blocks = newBlocks;
      newPages[activeSlideIndex] = activeSlide;
      return { ...prev, pages: newPages };
    });
  };

  const handleAddBlock = (blockType) => {
    let newBlock = { type: blockType };
    if (blockType === 'paragraph') {
      newBlock.text = 'New paragraph text block.';
    } else if (blockType === 'heading') {
      newBlock.text = 'Section Heading';
      newBlock.level = 2;
    } else if (blockType === 'bullet_list') {
      newBlock.items = [{ bold: '', text: 'List item 1' }];
    } else if (blockType === 'callout') {
      newBlock.text = 'Important notification alert callout...';
      newBlock.variant = 'info';
    } else if (blockType === 'table') {
      newBlock.headers = ['Header 1', 'Header 2'];
      newBlock.rows = [[{ text: 'row 1 cell 1' }, { text: 'row 1 cell 2' }]];
    } else if (blockType === 'mcq') {
      newBlock.question = 'What is the correct answer?';
      newBlock.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      newBlock.correctOptionIndex = 0;
    } else if (blockType === 'fill_code' || blockType === 'write_line') {
      newBlock.type = blockType;
      newBlock.language = 'javascript';
      newBlock.codeLines = [
        { type: 'code', content: 'const value = ' },
        { type: 'input', expectedAnswer: '42' },
        { type: 'code', content: ';' }
      ];
    } else if (blockType === 'find_error') {
      newBlock.code = 'function sum(a,b) {\n  retur a + b;\n}';
      newBlock.errorLine = 2;
      newBlock.expectedFix = 'return a + b;';
    } else if (blockType === 'code_challenge') {
      newBlock.problemDescription = 'Write a function sum(a, b) that returns their sum.';
      newBlock.initialCode = 'function sum(a, b) {\n  // Write code\n}';
      newBlock.language = 'javascript';
      newBlock.testcases = [{ input: '2, 3', expectedOutput: '5' }];
    } else if (blockType === 'Cyber') {
      newBlock.value = 'ransomware';
    }

    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const activeSlide = { ...newPages[activeSlideIndex] };
      activeSlide.blocks = [...(activeSlide.blocks || []), newBlock];
      newPages[activeSlideIndex] = activeSlide;
      return { ...prev, pages: newPages };
    });
  };

  const handleDeleteBlock = (blockIdx) => {
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const activeSlide = { ...newPages[activeSlideIndex] };
      activeSlide.blocks = activeSlide.blocks.filter((_, idx) => idx !== blockIdx);
      newPages[activeSlideIndex] = activeSlide;
      return { ...prev, pages: newPages };
    });
  };

  const handleMoveBlockUp = (blockIdx) => {
    if (blockIdx === 0) return;
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const activeSlide = { ...newPages[activeSlideIndex] };
      const newBlocks = [...activeSlide.blocks];
      const temp = newBlocks[blockIdx];
      newBlocks[blockIdx] = newBlocks[blockIdx - 1];
      newBlocks[blockIdx - 1] = temp;
      activeSlide.blocks = newBlocks;
      newPages[activeSlideIndex] = activeSlide;
      return { ...prev, pages: newPages };
    });
  };

  const handleMoveBlockDown = (blockIdx) => {
    const activeSlide = editingLesson.pages[activeSlideIndex];
    if (blockIdx === activeSlide.blocks.length - 1) return;
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const activeSlide = { ...newPages[activeSlideIndex] };
      const newBlocks = [...activeSlide.blocks];
      const temp = newBlocks[blockIdx];
      newBlocks[blockIdx] = newBlocks[blockIdx + 1];
      newBlocks[blockIdx + 1] = temp;
      activeSlide.blocks = newBlocks;
      newPages[activeSlideIndex] = activeSlide;
      return { ...prev, pages: newPages };
    });
  };

  const handleReorderSlides = (dragIndex, hoverIndex) => {
    if (dragIndex === hoverIndex) return;
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const draggedPage = newPages[dragIndex];
      newPages.splice(dragIndex, 1);
      newPages.splice(hoverIndex, 0, draggedPage);
      const updatedPages = newPages.map((page, i) => ({ ...page, orderIndex: i }));
      return { ...prev, pages: updatedPages };
    });
    setActiveSlideIndex(hoverIndex);
  };

  const handleReorderBlocks = (dragIndex, hoverIndex) => {
    if (dragIndex === hoverIndex) return;
    setEditingLesson(prev => {
      const newPages = [...prev.pages];
      const activeSlide = { ...newPages[activeSlideIndex] };
      const newBlocks = [...activeSlide.blocks];
      const draggedBlock = newBlocks[dragIndex];
      newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, draggedBlock);
      activeSlide.blocks = newBlocks;
      newPages[activeSlideIndex] = activeSlide;
      return { ...prev, pages: newPages };
    });
  };

  // User edit handlers
  const handleOpenUserEdit = (u) => {
    setUserForm({
      id: u.id,
      name: u.name,
      roleID: u.roleID,
      assignedCourseIds: u.assignedCourseIds || []
    });
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      // 1. Save role update to backend database
      const roleRes = await adminFetch(`/users/${userForm.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleID: Number(userForm.roleID) })
      });
      if (!roleRes.ok) {
        const err = await roleRes.json();
        console.error('Role update error:', err);
        alert('Failed to update user role in database: ' + (err.message || roleRes.statusText));
        return;
      }

      // 2. If Expert, save course assignments to backend database
      if (Number(userForm.roleID) === 1) {
        const res = await adminFetch(`/users/${userForm.id}/assign-courses`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseIds: userForm.assignedCourseIds.map(Number) })
        });
        if (!res.ok) {
          const err = await res.json();
          console.warn('Assign courses warning:', err);
        }
      }

      // Update local state to reflect changes instantly in the admin view
      setUsers(prev => prev.map(u => u.id === userForm.id ? { 
        ...u, 
        roleID: Number(userForm.roleID), 
        roleName: ROLE_NAMES[userForm.roleID] || 'Student',
        assignedCourseIds: userForm.assignedCourseIds
      } : u));

      addLog(`User ${userForm.name} became a ${ROLE_NAMES[userForm.roleID] || 'Student'}`, 'action');
      setUserDialogOpen(false);
    } catch (err) {
      console.error('Failed to update user roles/courses:', err);
      alert('An error occurred while saving user edits.');
    }
  };

  const handleApplicationStatus = async (appId, status, applicantName) => {
    try {
      const res = await adminFetch(`/users/applications/${appId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== appId));
        addLog(`Application ${status === 'accepted' ? 'approved' : 'removed'} for ${applicantName}`, status === 'accepted' ? 'action' : 'warning');
      } else {
        const err = await res.json();
        alert('Failed to update application: ' + (err.message || res.statusText));
      }
    } catch (err) {
      console.error('handleApplicationStatus error:', err);
      alert('Network error updating application status');
    }
  };

  // Conditional WYSIWYG Mode rendering
  if (editingLesson) {
    const activeSlide = editingLesson.pages[activeSlideIndex] || { pageTitle: 'Untitled Slide', blocks: [] };

    return (
      <Box style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#080c14', minHeight: '90vh', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px'}}>
        
        {/* Top Header Bar */}
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <IconButton 
              onClick={() => {
                if (window.confirm('Discard unsaved lesson changes?')) {
                  setEditingLesson(null);
                }
              }} 
              style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {editingLesson.isNew ? 'Create New Lesson' : 'Edit Lesson: ' + editingLesson.title}
                <Chip label="WYSIWYG STUDIO" size="small" style={{ background: 'var(--hero-gradient)', color: 'var(--text-primary)', fontWeight: 900, fontSize: '0.62rem', border: 'none' }} />
              </Typography>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 650 }}>
                Interactive split-screen designer with live visual mockup rendering
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="outlined"
              onClick={() => {
                if (window.confirm('Discard unsaved lesson changes?')) {
                  setEditingLesson(null);
                }
              }}
              style={{ textTransform: 'none', fontWeight: 800, borderRadius: '10px', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.12)', padding: '8px 20px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveLesson}
              style={{ background: 'var(--hero-gradient)', textTransform: 'none', fontWeight: 800, borderRadius: '10px', color: 'var(--text-primary)', padding: '8px 24px'}}
            >
              Save Lesson Deck
            </Button>
          </Box>
        </Box>

        {/* Global Lesson Config Bar */}
        <Paper className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20, 20, 30, 0.4)', borderRadius: '16px' }}>
          <TextField
            label="Lesson Title"
            value={editingLesson.title}
            onChange={(e) => setEditingLesson(prev => ({ ...prev, title: e.target.value }))}
            size="small"
            style={{ flex: 2, minWidth: '220px' }}
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)', fontWeight: 700 } }}
            InputProps={{ style: { color: 'var(--text-primary)', fontWeight: 800 } }}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
          />
          <TextField
            label="Chapter Segment"
            value={editingLesson.chapterName}
            onChange={(e) => setEditingLesson(prev => ({ ...prev, chapterName: e.target.value }))}
            size="small"
            style={{ flex: 1, minWidth: '130px' }}
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)', fontWeight: 700 } }}
            InputProps={{ style: { color: 'var(--text-primary)', fontWeight: 800 } }}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
          />
          <Select
            value={editingLesson.category}
            onChange={(e) => setEditingLesson(prev => ({ ...prev, category: e.target.value }))}
            size="small"
            style={{ minWidth: '150px' }}
            sx={{ color: 'var(--text-primary)', fontWeight: 800, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
          >
            <MenuItem value="learning">Category: Learning</MenuItem>
            <MenuItem value="exercise">Category: Exercise</MenuItem>
          </Select>
          <TextField
            label="Index"
            type="number"
            value={editingLesson.orderIndex}
            onChange={(e) => setEditingLesson(prev => ({ ...prev, orderIndex: Number(e.target.value) }))}
            size="small"
            style={{ width: '80px' }}
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
            InputProps={{ style: { color: 'var(--text-primary)', fontWeight: 800 } }}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
          />
        </Paper>

        {/* Split Screen Design Canvas */}
        <Grid container spacing={3} style={{ flex: 1 }}>
          
          {/* LEFT PANEL: Student Mockup Slide Preview (Centered design elements) */}
          <Grid item xs={12} lg={7}>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
              <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <VerifiedIcon style={{ fontSize: '1.1rem', color: 'var(--primary-main)' }} />
                Real-Time Student View Simulator
              </Typography>
              
              <Paper 
                style={{
                  flex: 1,
                  padding: '40px',
                  background: 'radial-gradient(circle at top left, rgba(20, 24, 40, 0.95), rgba(10, 12, 18, 0.98))',
                  border: '1px solid rgba(28, 176, 246, 0.25)',
                  borderRadius: '20px',
                  minHeight: '600px',
                  position: 'sticky',
                  top: '24px',
                  
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  overflowY: 'auto'
                }}
              >
                {/* Simulated Header */}
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  <Box>
                    <Typography style={{ color: 'var(--primary-main)', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {editingLesson.chapterName} • Slide {activeSlideIndex + 1} of {editingLesson.pages.length}
                    </Typography>
                    <Typography variant="h4" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif', marginTop: '4px' }}>
                      {activeSlide.pageTitle || 'Untitled Slide'}
                    </Typography>
                  </Box>
                  <Chip 
                    label={editingLesson.category.toUpperCase()} 
                    size="small" 
                    style={{ background: 'rgba(28,176,246,0.1)', color: 'var(--primary-main)', border: '1px solid rgba(28,176,246,0.3)', fontWeight: 800, fontSize: '0.65rem' }} 
                  />
                </Box>

                {/* Simulated Page Content Blocks Rendering (Centered content layout) */}
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: '650px', margin: '0 auto', padding: '20px 0' }}>
                  {(!activeSlide.blocks || activeSlide.blocks.length === 0) ? (
                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', minHeight: '300px' }}>
                      <DatabaseIcon style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.05)' }} />
                      <Typography style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        This slide is currently empty. Use the Inspector on the right to add block components.
                      </Typography>
                    </Box>
                  ) : (
                    activeSlide.blocks.map((block, idx) => {
                      switch (block.type) {
                        case 'heading': {
                          const level = block.level || 1;
                          const fontSize = level === 1 ? '1.8rem' : level === 2 ? '1.4rem' : '1.15rem';
                          return (
                            <Box key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
                              <Typography 
                                style={{ 
                                  color: 'var(--text-primary)', 
                                  fontWeight: 900, 
                                  fontSize, 
                                  fontFamily: '"Outfit", sans-serif'
                                }}
                              >
                                {block.text || 'Section Heading'}
                              </Typography>
                              <Box style={{ width: '40px', height: '4px', background: 'var(--primary-main)', borderRadius: '2px' }} />
                            </Box>
                          );
                        }
                        
                        case 'paragraph':
                          return (
                            <Typography key={idx} variant="body1" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.96rem', textAlign: 'center' }}>
                              {block.text || 'Paragraph body content...'}
                            </Typography>
                          );

                        case 'bullet_list':
                          return (
                            <Box key={idx} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                              <ul style={{ paddingLeft: '0', listStyleType: 'none', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', margin: '0 auto' }}>
                                {(block.items || []).map((item, bulletIdx) => {
                                  const itemText = typeof item === 'object' ? (item.text || '') : item;
                                  const itemBold = typeof item === 'object' ? (item.bold || '') : '';
                                  return (
                                    <li key={bulletIdx} style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                      <span style={{ color: 'var(--primary-main)', fontWeight: 900 }}>•</span>
                                      <Box>
                                        {itemBold && <strong style={{ color: 'var(--primary-main)', fontWeight: 800, marginRight: '4px' }}>{itemBold}</strong>}
                                        {itemText}
                                      </Box>
                                    </li>
                                  );
                                })}
                              </ul>
                            </Box>
                          );

                        case 'callout': {
                          const colorMap = {
                            info: { border: '#1CB0F6', bg: 'rgba(28, 176, 246, 0.08)', icon: <InfoIcon style={{ color: '#1CB0F6' }} /> },
                            warning: { border: '#ff9800', bg: 'rgba(255, 152, 0, 0.08)', icon: <WarningIcon style={{ color: '#ff9800' }} /> },
                            success: { border: '#4caf50', bg: 'rgba(76, 175, 80, 0.08)', icon: <SuccessIcon style={{ color: '#4caf50' }} /> },
                            error: { border: '#f44336', bg: 'rgba(244, 67, 54, 0.08)', icon: <ErrorIcon style={{ color: '#f44336' }} /> }
                          };
                          const conf = colorMap[block.variant || 'info'] || colorMap.info;
                          return (
                            <Box 
                              key={idx} 
                              style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                padding: '16px', 
                                background: conf.bg, 
                                borderLeft: '4px solid ' + conf.border, 
                                borderRadius: '0 8px 8px 0',
                                alignItems: 'center',
                                textAlign: 'left',
                                width: '100%'
                              }}
                            >
                              {conf.icon}
                              <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontSize: '0.88rem' }}>
                                {block.text || 'Callout information box details...'}
                              </Typography>
                            </Box>
                          );
                        }

                        case 'table':
                          return (
                            <TableContainer key={idx} style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', width: '100%' }}>
                              <Table size="small">
                                <TableHead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                  <TableRow>
                                    {(block.headers || []).map((h, hIdx) => (
                                      <TableCell key={hIdx} style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                        {h}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(block.rows || []).map((row, rowIdx) => (
                                    <TableRow key={rowIdx} style={{ background: rowIdx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                                      {row.map((cell, cellIdx) => {
                                        const cellText = typeof cell === 'object' ? (cell.text || cell.bold || '') : cell;
                                        const isBold = typeof cell === 'object' && cell.bold !== undefined;
                                        return (
                                          <TableCell key={cellIdx} style={{ color: 'var(--text-primary)', fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: isBold ? 800 : 400, textAlign: 'center' }}>
                                            {cellText}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );

                        case 'mcq':
                          return (
                            <Paper key={idx} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', width: '100%', textAlign: 'center' }}>
                              <Typography style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.05rem', marginBottom: '16px', fontFamily: '"Outfit", sans-serif' }}>
                                Q: {block.question || 'Multiple Choice Question'}
                              </Typography>
                              <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(block.options || []).map((opt, optIdx) => {
                                  const isCorrect = block.correctOptionIndex === optIdx;
                                  return (
                                    <Box 
                                      key={optIdx} 
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        padding: '12px 16px', 
                                        borderRadius: '10px', 
                                        border: isCorrect ? '1px solid #4caf50' : '1px solid rgba(255,255,255,0.06)', 
                                        background: isCorrect ? 'rgba(76, 175, 80, 0.08)' : 'rgba(0,0,0,0.1)',
                                        position: 'relative'
                                      }}
                                    >
                                      <Typography style={{ fontSize: '0.88rem', color: isCorrect ? '#4caf50' : 'rgba(255,255,255,0.7)', fontWeight: isCorrect ? 800 : 500 }}>
                                        {optIdx + 1}. {opt}
                                      </Typography>
                                      {isCorrect && <SuccessIcon style={{ fontSize: '1.1rem', color: '#4caf50', position: 'absolute', right: '16px' }} />}
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Paper>
                          );

                        case 'fill_code':
                        case 'write_line':
                          return (
                            <Box key={idx} style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', fontFamily: 'monospace', width: '100%' }}>
                              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Interactive Console ({block.language || 'javascript'})
                              </Typography>
                              <Box style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.88rem' }}>
                                {(block.codeLines || []).map((line, lIdx) => {
                                  if (line.type === 'code') {
                                    return <span key={lIdx} style={{ color: 'var(--text-primary)', whiteSpace: 'pre' }}>{line.content}</span>;
                                  } else {
                                    return (
                                      <span 
                                        key={lIdx} 
                                        style={{ 
                                          background: 'rgba(255, 152, 0, 0.15)', 
                                          color: '#ff9800', 
                                          borderBottom: '2px solid #ff9800', 
                                          padding: '2px 8px', 
                                          fontWeight: 800,
                                          borderRadius: '4px',
                                          fontSize: '0.8rem'
                                        }}
                                      >
                                        [ {line.expectedAnswer || 'blank'} ]
                                      </span>
                                    );
                                  }
                                })}
                              </Box>
                            </Box>
                          );

                        case 'find_error':
                        case 'code_challenge':
                          return (
                            <Box key={idx} style={{ background: '#090d16', border: '1px solid rgba(28, 176, 246, 0.2)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', textAlign: 'left' }}>
                              <Box style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CodeIcon style={{ color: 'var(--primary-main)', fontSize: '1rem' }} />
                                <Typography style={{ color: 'var(--primary-main)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                  Challenge Workspace ({block.language || 'javascript'})
                                </Typography>
                              </Box>
                              {block.type === 'find_error' ? (
                                <Box style={{ width: '100%' }}>
                                  <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '8px' }}>Find the Syntax Error:</Typography>
                                  <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', color: '#e5e9f0', fontSize: '0.8rem', overflowX: 'auto' }}>
                                    <code>{block.code}</code>
                                  </pre>
                                  <Typography style={{ color: '#ff9800', fontSize: '0.78rem', marginTop: '6px', fontWeight: 800 }}>Error Line: {block.errorLine} • Fix: {block.expectedFix}</Typography>
                                </Box>
                              ) : (
                                <Box style={{ width: '100%' }}>
                                  <Typography style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', marginBottom: '8px', lineHeight: 1.4 }}>
                                    {block.problemDescription}
                                  </Typography>
                                  <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', color: '#a3be8c', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                                    <code>{block.initialCode}</code>
                                  </pre>
                                  <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '8px', fontWeight: 800 }}>
                                    Testcases: {(block.testcases || []).length} mapped
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );

                        case 'Cyber':
                          return (
                            <Paper 
                              key={idx} 
                              className="glass-panel" 
                              style={{ 
                                padding: '24px', 
                                border: '1px solid rgba(28, 176, 246, 0.3)', 
                                borderRadius: '16px', 
                                background: 'linear-gradient(135deg, rgba(28, 176, 246, 0.05) 0%, rgba(0,0,0,0.3) 100%)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '20px',
                                width: '100%'
                              }}
                            >
                              <Avatar style={{ background: 'rgba(28, 176, 246, 0.15)', color: '#1CB0F6', width: '56px', height: '56px' }}>
                                <LockIcon style={{ fontSize: '1.8rem' }} />
                              </Avatar>
                              <Box style={{ textAlign: 'left' }}>
                                <Typography style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.05rem', fontFamily: '"Outfit", sans-serif' }}>
                                  {(CYBER_LABS.find(l => l.value === block.value) || { label: 'Interactive Security Lab' }).label}
                                </Typography>
                                <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '2px', fontWeight: 700 }}>
                                  Embedded SecLab Sandbox Component ({block.value})
                                </Typography>
                              </Box>
                              <Chip 
                                label="ACTIVE LAB" 
                                size="small" 
                                style={{ background: '#4caf50', color: 'var(--text-primary)', fontWeight: 900, fontSize: '0.6rem', marginLeft: 'auto' }} 
                              />
                            </Paper>
                          );

                        default:
                          return null;
                      }
                    })
                  )}
                </Box>

                {/* Simulated Footer / Slide visual switcher navigation */}
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: 'auto' }}>
                  <Button
                    size="small"
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                    style={{ textTransform: 'none', color: activeSlideIndex === 0 ? 'rgba(255,255,255,0.2)' : 'var(--primary-main)', fontWeight: 800 }}
                  >
                    ← Prev Slide
                  </Button>
                  <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 700 }}>
                    Slide {activeSlideIndex + 1} of {editingLesson.pages.length}
                  </Typography>
                  <Button
                    size="small"
                    disabled={activeSlideIndex === editingLesson.pages.length - 1}
                    onClick={() => setActiveSlideIndex(prev => Math.min(editingLesson.pages.length - 1, prev + 1))}
                    style={{ textTransform: 'none', color: activeSlideIndex === editingLesson.pages.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--primary-main)', fontWeight: 800 }}
                  >
                    Next Slide →
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Grid>
          
          {/* RIGHT PANEL: Slide Deck Outline + Interactive Block Properties Inspector */}
          <Grid item xs={12} lg={5} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Outline horizontal scroll navigator with switchable items and delete icons */}
            <Paper className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'var(--surface-glass)', borderRadius: '16px' }}>
              <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Slides Deck Outline</Typography>
              <Box style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                {editingLesson.pages.map((slide, idx) => {
                  const isBeingDragged = draggedSlideIdx === idx;
                  const isDragOver = dragOverSlideIdx === idx;
                  const isActive = activeSlideIndex === idx;

                  return (
                    <Box
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedSlideIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', idx.toString());
                      }}
                      onDragEnd={() => {
                        setDraggedSlideIdx(null);
                        setDragOverSlideIdx(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedSlideIdx !== idx) {
                          setDragOverSlideIdx(idx);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverSlideIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleReorderSlides(draggedSlideIdx, idx);
                        setDraggedSlideIdx(null);
                        setDragOverSlideIdx(null);
                      }}
                      style={{
                        flexShrink: 0,
                        width: '120px',
                        height: '85px',
                        borderRadius: '10px',
                        cursor: 'grab',
                        opacity: isBeingDragged ? 0.3 : 1,
                        background: isDragOver 
                          ? 'rgba(28, 176, 246, 0.15)' 
                          : (isActive ? 'rgba(28, 176, 246, 0.15)' : 'rgba(0,0,0,0.3)'),
                        border: isDragOver
                          ? '2px dashed var(--primary-main)'
                          : (isActive ? '2px solid var(--primary-main)' : '1px solid rgba(255,255,255,0.08)'),
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'all 0.2s',
                        transform: isDragOver ? 'scale(1.05) translateY(-2px)' : 'none',
                        
                        zIndex: isDragOver ? 10 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !isDragOver) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !isDragOver) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                        }
                      }}
                    >
                      {/* Delete Icon absolute positioned on top right */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent switching to the slide
                          handleDeleteSlide(idx);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          color: 'rgba(255,255,255,0.4)',
                          padding: '2px',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4d'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                      >
                        <DeleteIcon style={{ fontSize: '0.85rem' }} />
                      </IconButton>

                      <Typography style={{ color: isActive ? 'var(--primary-main)' : 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '0.62rem' }}>SLIDE {idx+1}</Typography>
                      <Typography noWrap style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 800, maxWidth: '80%' }}>{slide.pageTitle || slide.title || 'Untitled'}</Typography>
                      
                      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', fontWeight: 700 }}>{(slide.blocks || []).length} blocks</Typography>
                        <DragHandleIcon style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', cursor: 'grab' }} />
                      </Box>
                    </Box>
                  );
                })}
                
                <Box
                  onClick={handleAddSlide}
                  style={{
                    flexShrink: 0,
                    width: '120px',
                    height: '85px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-main)'; e.currentTarget.style.color = 'var(--primary-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <AddIcon style={{ fontSize: '1.2rem' }} />
                  <Typography style={{ fontSize: '0.62rem', fontWeight: 800, marginTop: '4px' }}>Add Slide</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Blocks inspector property panels */}
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Active Slide Inspector</Typography>
              
              {(!activeSlide.blocks || activeSlide.blocks.length === 0) ? (
                <Paper className="glass-panel" style={{ padding: '30px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
                  <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>No blocks on this slide yet. Append a layout block below!</Typography>
                </Paper>
              ) : (
                activeSlide.blocks.map((block, blockIdx) => {
                  
                  // Setup custom gradient borders based on block type
                  const typeColors = {
                    heading: 'linear-gradient(to bottom, #1cb0f6, #007bb5)',
                    paragraph: 'linear-gradient(to bottom, #9c27b0, #673ab7)',
                    bullet_list: 'linear-gradient(to bottom, #009688, #00796b)',
                    callout: 'linear-gradient(to bottom, #ff9800, #f57c00)',
                    table: 'linear-gradient(to bottom, #4caf50, #388e3c)',
                    mcq: 'linear-gradient(to bottom, #e040fb, #9c27b0)',
                    fill_code: 'linear-gradient(to bottom, #f44336, #d32f2f)',
                    write_line: 'linear-gradient(to bottom, #f44336, #d32f2f)',
                    find_error: 'linear-gradient(to bottom, #ff5722, #e64a19)',
                    code_challenge: 'linear-gradient(to bottom, #607d8b, #455a64)',
                    Cyber: 'linear-gradient(to bottom, #ffd700, #ffa500)'
                  };
                  const borderGradient = typeColors[block.type] || 'linear-gradient(to bottom, #fff, #888)';

                  const isBlockDragged = draggedBlockIdx === blockIdx;
                  const isBlockDragOver = dragOverBlockIdx === blockIdx;

                  return (
                      <Paper
                        key={blockIdx}
                        draggable={true}
                        onDragStart={(e) => {
                          const targetTag = e.target.tagName.toLowerCase();
                          if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || e.target.closest('button')) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedBlockIdx(blockIdx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', blockIdx.toString());
                        }}
                        onDragEnd={() => {
                          setDraggedBlockIdx(null);
                          setDragOverBlockIdx(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedBlockIdx !== blockIdx) {
                            setDragOverBlockIdx(blockIdx);
                          }
                        }}
                        onDragLeave={() => {
                          setDragOverBlockIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleReorderBlocks(draggedBlockIdx, blockIdx);
                          setDraggedBlockIdx(null);
                          setDragOverBlockIdx(null);
                        }}
                        style={{
                          background: isBlockDragOver 
                            ? 'rgba(28, 176, 246, 0.08)' 
                            : 'rgba(20, 20, 30, 0.55)',
                          border: isBlockDragOver
                            ? '2px dashed var(--primary-main)'
                            : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          gap: '16px',
                          position: 'relative',
                          opacity: isBlockDragged ? 0.25 : 1,
                          transform: isBlockDragOver ? 'translateY(-4px)' : 'none',
                          transition: 'all 0.2s',
                          cursor: 'grab',
                          zIndex: isBlockDragOver ? 10 : 1
                        }}
                      >
                      {/* Left Gradient Strip */}
                      <Box style={{ width: '4px', background: borderGradient, borderRadius: '4px', alignSelf: 'stretch' }} />

                      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Header toolbar */}
                        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={block.type.toUpperCase()}
                            size="small"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-primary)',
                              fontWeight: 900,
                              fontSize: '0.62rem',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          />
                          <Box style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <DragHandleIcon style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)', cursor: 'grab' }} />
                            <IconButton size="small" onClick={() => handleDeleteBlock(blockIdx)} style={{ color: '#f44336', padding: '2px' }}>
                              <DeleteIcon style={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </Box>
                        {block.type === 'paragraph' && (
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Paragraph Text"
                            placeholder="Enter paragraph text..."
                            value={block.text || ''}
                            onChange={(e) => handleUpdateBlock(blockIdx, { text: e.target.value })}
                            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' } }}
                            InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.88rem' } }}
                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                          />
                        )}

                        {block.type === 'heading' && (
                          <Box style={{ display: 'flex', gap: '10px' }}>
                            <TextField
                              fullWidth
                              label="Heading Text"
                              value={block.text || ''}
                              onChange={(e) => handleUpdateBlock(blockIdx, { text: e.target.value })}
                              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' } }}
                              InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.88rem' } }}
                              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            />
                            <Select
                              value={block.level || 1}
                              onChange={(e) => handleUpdateBlock(blockIdx, { level: Number(e.target.value) })}
                              size="small"
                              sx={{ color: 'var(--text-primary)', fontWeight: 800, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            >
                              <MenuItem value={1}>H1</MenuItem>
                              <MenuItem value={2}>H2</MenuItem>
                              <MenuItem value={3}>H3</MenuItem>
                            </Select>
                          </Box>
                        )}

                        {block.type === 'bullet_list' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(block.items || []).map((item, itemIdx) => {
                              const itemText = typeof item === 'object' ? (item.text || '') : item;
                              const itemBold = typeof item === 'object' ? (item.bold || '') : '';
                              return (
                                <Box key={itemIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <TextField
                                    size="small"
                                    placeholder="Bold tag..."
                                    value={itemBold}
                                    onChange={(e) => {
                                      const newItems = [...block.items];
                                      if (typeof newItems[itemIdx] !== 'object') {
                                        newItems[itemIdx] = { bold: e.target.value, text: itemText };
                                      } else {
                                        newItems[itemIdx] = { ...newItems[itemIdx], bold: e.target.value };
                                      }
                                      handleUpdateBlock(blockIdx, { items: newItems });
                                    }}
                                    style={{ width: '100px' }}
                                    InputProps={{ style: { color: 'var(--primary-main)', fontWeight: 800, fontSize: '0.8rem' } }}
                                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                                  />
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Content..."
                                    value={itemText}
                                    onChange={(e) => {
                                      const newItems = [...block.items];
                                      if (typeof newItems[itemIdx] !== 'object') {
                                        newItems[itemIdx] = { bold: itemBold, text: e.target.value };
                                      } else {
                                        newItems[itemIdx] = { ...newItems[itemIdx], text: e.target.value };
                                      }
                                      handleUpdateBlock(blockIdx, { items: newItems });
                                    }}
                                    InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.8rem' } }}
                                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                                  />
                                  <IconButton size="small" onClick={() => {
                                    const newItems = block.items.filter((_, idx) => idx !== itemIdx);
                                    handleUpdateBlock(blockIdx, { items: newItems });
                                  }} style={{ color: '#f44336' }}>
                                    <DeleteIcon style={{ fontSize: '0.85rem' }} />
                                  </IconButton>
                                </Box>
                              );
                            })}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const newItems = [...(block.items || []), { bold: '', text: 'New list item' }];
                                handleUpdateBlock(blockIdx, { items: newItems });
                              }}
                              style={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', borderColor: 'var(--divider)', color: 'rgba(255,255,255,0.5)' }}
                            >
                              Add Bullet item
                            </Button>
                          </Box>
                        )}

                        {block.type === 'callout' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Select
                              size="small"
                              value={block.variant || 'info'}
                              onChange={(e) => handleUpdateBlock(blockIdx, { variant: e.target.value })}
                              sx={{ width: '130px', color: 'var(--text-primary)', fontWeight: 800, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            >
                              <MenuItem value="info">Info</MenuItem>
                              <MenuItem value="warning">Warning</MenuItem>
                              <MenuItem value="success">Success</MenuItem>
                              <MenuItem value="error">Error</MenuItem>
                            </Select>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              placeholder="Callout text details..."
                              value={block.text || ''}
                              onChange={(e) => handleUpdateBlock(blockIdx, { text: e.target.value })}
                              InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.85rem' } }}
                              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            />
                          </Box>
                        )}

                        {block.type === 'table' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Headers (comma separated)"
                              value={(block.headers || []).join(', ')}
                              onChange={(e) => {
                                const newHeaders = e.target.value.split(',').map(s => s.trim());
                                handleUpdateBlock(blockIdx, { headers: newHeaders });
                              }}
                              InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.8rem' } }}
                              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            />
                            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>Table Rows Grid Data</Typography>
                            {(block.rows || []).map((row, rIdx) => (
                              <Box key={rIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <Typography style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', width: '24px' }}>R{rIdx+1}</Typography>
                                {row.map((cell, cIdx) => {
                                  const cellText = typeof cell === 'object' ? (cell.text || cell.bold || '') : cell;
                                  return (
                                    <TextField
                                      key={cIdx}
                                      size="small"
                                      value={cellText}
                                      onChange={(e) => {
                                        const newRows = [...block.rows];
                                        const newRow = [...newRows[rIdx]];
                                        newRow[cIdx] = typeof cell === 'object' ? { ...cell, text: e.target.value } : e.target.value;
                                        newRows[rIdx] = newRow;
                                        handleUpdateBlock(blockIdx, { rows: newRows });
                                      }}
                                      InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.78rem' } }}
                                      sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.05)' } }}
                                    />
                                  );
                                })}
                                <IconButton size="small" onClick={() => {
                                  const newRows = block.rows.filter((_, idx) => idx !== rIdx);
                                  handleUpdateBlock(blockIdx, { rows: newRows });
                                }} style={{ color: '#f44336' }}>
                                  <DeleteIcon style={{ fontSize: '0.85rem' }} />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const colsCount = block.headers?.length || 2;
                                const newRow = Array(colsCount).fill('').map(() => ({ text: '' }));
                                const newRows = [...(block.rows || []), newRow];
                                handleUpdateBlock(blockIdx, { rows: newRows });
                              }}
                              style={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', borderColor: 'var(--divider)', color: 'rgba(255,255,255,0.5)' }}
                            >
                              + Add Row
                            </Button>
                          </Box>
                        )}

                        {block.type === 'mcq' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="MCQ Question / Prompt"
                              value={block.question || ''}
                              onChange={(e) => handleUpdateBlock(blockIdx, { question: e.target.value })}
                              InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.82rem' } }}
                              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            />
                            <RadioGroup
                              value={block.correctOptionIndex}
                              onChange={(e) => handleUpdateBlock(blockIdx, { correctOptionIndex: Number(e.target.value) })}
                            >
                              {(block.options || []).map((option, optIdx) => (
                                <Box key={optIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <Radio value={optIdx} size="small" style={{ color: 'var(--primary-main)' }} />
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={'Choice Option ' + (optIdx + 1)}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...block.options];
                                      newOptions[optIdx] = e.target.value;
                                      handleUpdateBlock(blockIdx, { options: newOptions });
                                    }}
                                    InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.8rem' } }}
                                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                                  />
                                </Box>
                              ))}
                            </RadioGroup>
                          </Box>
                        )}

                        {(block.type === 'fill_code' || block.type === 'write_line') && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Box style={{ display: 'flex', gap: '10px' }}>
                              <Select
                                size="small"
                                value={block.type}
                                onChange={(e) => handleUpdateBlock(blockIdx, { type: e.target.value })}
                                sx={{ color: 'var(--text-primary)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                              >
                                <MenuItem value="fill_code">Fill the Code</MenuItem>
                                <MenuItem value="write_line">Write the Line</MenuItem>
                              </Select>
                              <TextField
                                size="small"
                                label="Language"
                                value={block.language || 'javascript'}
                                onChange={(e) => handleUpdateBlock(blockIdx, { language: e.target.value })}
                                InputProps={{ style: { color: '#fff' } }}
                                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                              />
                            </Box>

                            <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(block.codeLines || []).map((line, lineIdx) => (
                                <Box key={lineIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <Select
                                    size="small"
                                    value={line.type}
                                    onChange={(e) => {
                                      const newLines = [...block.codeLines];
                                      newLines[lineIdx] = { 
                                        type: e.target.value,
                                        ...(e.target.value === 'code' ? { content: '' } : { expectedAnswer: '' })
                                      };
                                      handleUpdateBlock(blockIdx, { codeLines: newLines });
                                    }}
                                    sx={{ minWidth: '90px', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                                  >
                                    <MenuItem value="code">Code</MenuItem>
                                    <MenuItem value="input">Blank</MenuItem>
                                  </Select>

                                  {line.type === 'code' ? (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      placeholder="code content..."
                                      value={line.content || ''}
                                      onChange={(e) => {
                                        const newLines = [...block.codeLines];
                                        newLines[lineIdx] = { ...newLines[lineIdx], content: e.target.value };
                                        handleUpdateBlock(blockIdx, { codeLines: newLines });
                                      }}
                                      InputProps={{ style: { color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.78rem' } }}
                                      sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.05)' } }}
                                    />
                                  ) : (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      placeholder="answer..."
                                      value={line.expectedAnswer || ''}
                                      onChange={(e) => {
                                        const newLines = [...block.codeLines];
                                        newLines[lineIdx] = { ...newLines[lineIdx], expectedAnswer: e.target.value };
                                        handleUpdateBlock(blockIdx, { codeLines: newLines });
                                      }}
                                      InputProps={{ style: { color: 'var(--primary-main)', fontWeight: 800, fontSize: '0.78rem' } }}
                                      sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.05)' } }}
                                    />
                                  )}

                                  <IconButton size="small" onClick={() => {
                                    const newLines = block.codeLines.filter((_, idx) => idx !== lineIdx);
                                    handleUpdateBlock(blockIdx, { codeLines: newLines });
                                  }} style={{ color: '#f44336' }}>
                                    <DeleteIcon style={{ fontSize: '0.85rem' }} />
                                  </IconButton>
                                </Box>
                              ))}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  const newLines = [...(block.codeLines || []), { type: 'code', content: '' }];
                                  handleUpdateBlock(blockIdx, { codeLines: newLines });
                                }}
                                style={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: '6px', fontSize: '0.7rem', borderColor: 'var(--divider)', color: 'rgba(255,255,255,0.4)' }}
                              >
                                + Add Line
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {block.type === 'find_error' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Code snippet with error"
                              value={block.code || ''}
                              onChange={(e) => handleUpdateBlock(blockIdx, { code: e.target.value })}
                              InputProps={{ style: { color: '#a3be8c', fontFamily: 'monospace', fontSize: '0.82rem' } }}
                              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            />
                            <Box style={{ display: 'flex', gap: '10px' }}>
                              <TextField
                                label="Line Number"
                                type="number"
                                size="small"
                                value={block.errorLine || 1}
                                onChange={(e) => handleUpdateBlock(blockIdx, { errorLine: Number(e.target.value) })}
                                InputProps={{ style: { color: '#fff' } }}
                                style={{ width: '100px' }}
                              />
                              <TextField
                                fullWidth
                                label="Expected Fix statement"
                                size="small"
                                value={block.expectedFix || ''}
                                onChange={(e) => handleUpdateBlock(blockIdx, { expectedFix: e.target.value })}
                                InputProps={{ style: { color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem' } }}
                              />
                            </Box>
                          </Box>
                        )}

                        {block.type === 'code_challenge' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="Problem Statement"
                              value={block.problemDescription || ''}
                              onChange={(e) => handleUpdateBlock(blockIdx, { problemDescription: e.target.value })}
                              InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.82rem' } }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Initial Code Template"
                              value={block.initialCode || ''}
                              onChange={(e) => handleUpdateBlock(blockIdx, { initialCode: e.target.value })}
                              InputProps={{ style: { color: '#a3be8c', fontFamily: 'monospace', fontSize: '0.8rem' } }}
                            />
                            <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(block.testcases || []).map((tc, tcIdx) => (
                                <Box key={tcIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <TextField
                                    size="small"
                                    placeholder="Input (e.g. 2, 3)"
                                    value={tc.input || ''}
                                    onChange={(e) => {
                                      const newTcs = [...block.testcases];
                                      newTcs[tcIdx].input = e.target.value;
                                      handleUpdateBlock(blockIdx, { testcases: newTcs });
                                    }}
                                    InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.78rem' } }}
                                  />
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Output (e.g. 5)"
                                    value={tc.expectedOutput || ''}
                                    onChange={(e) => {
                                      const newTcs = [...block.testcases];
                                      newTcs[tcIdx].expectedOutput = e.target.value;
                                      handleUpdateBlock(blockIdx, { testcases: newTcs });
                                    }}
                                    InputProps={{ style: { color: 'var(--text-primary)', fontSize: '0.78rem' } }}
                                  />
                                  <IconButton size="small" onClick={() => {
                                    const newTcs = block.testcases.filter((_, idx) => idx !== tcIdx);
                                    handleUpdateBlock(blockIdx, { testcases: newTcs });
                                  }} style={{ color: '#f44336' }}>
                                    <DeleteIcon style={{ fontSize: '0.85rem' }} />
                                  </IconButton>
                                </Box>
                              ))}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  const newTcs = [...(block.testcases || []), { input: '', expectedOutput: '' }];
                                  handleUpdateBlock(blockIdx, { testcases: newTcs });
                                }}
                                style={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: '6px', fontSize: '0.7rem', borderColor: 'var(--divider)', color: 'rgba(255,255,255,0.4)' }}
                              >
                                + Add Testcase
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {block.type === 'Cyber' && (
                          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>Choose Cybersecurity Lab Sandbox Block</Typography>
                            <Select
                              fullWidth
                              value={block.value}
                              onChange={(e) => handleUpdateBlock(blockIdx, { value: e.target.value })}
                              sx={{ color: 'var(--text-primary)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' } }}
                            >
                              {CYBER_LABS.map(lab => (
                                <MenuItem key={lab.value} value={lab.value}>{lab.label}</MenuItem>
                              ))}
                            </Select>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Box>

            {/* Layout Block Appender Drawer/Box */}
            <Paper className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(28, 176, 246, 0.25)', background: 'rgba(20, 20, 30, 0.6)', borderRadius: '16px' }}>
              <Typography variant="subtitle2" style={{ fontWeight: 900, color: 'var(--primary-main)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AddIcon />
                Append Slide Layout Block
              </Typography>
              <Grid container spacing={1}>
                {[
                  { type: 'paragraph', label: 'Paragraph' },
                  { type: 'heading', label: 'Heading' },
                  { type: 'bullet_list', label: 'Bullet List' },
                  { type: 'callout', label: 'Callout Box' },
                  { type: 'table', label: 'Grid Table' },
                  { type: 'mcq', label: 'MCQ Quiz' },
                  { type: 'fill_code', label: 'Coding Blank' },
                  { type: 'find_error', label: 'Find Error' },
                  { type: 'code_challenge', label: 'Challenge' },
                  { type: 'Cyber', label: 'Cyber Lab' }
                ].map(item => (
                  <Grid item xs={6} key={item.type}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddBlock(item.type)}
                      style={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--divider)',
                        background: 'rgba(255,255,255,0.01)',
                        fontWeight: 750,
                        fontSize: '0.75rem',
                        justifyContent: 'flex-start',
                        padding: '8px 12px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-main)'; e.currentTarget.style.background = 'rgba(28,176,246,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                    >
                      + {item.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Conditional Syllabus Builder Mode rendering
  if (editingCourseDetails) {
    const sections = editingCourseDetails.sections || [];

    return (
      <Box style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
        {/* Header */}
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {Number(user?.roleID) !== 1 && (
              <IconButton 
                onClick={() => {
                  setEditingCourseDetails(null);
                  localStorage.removeItem('sophiapath_admin_editing_course_id');
                  localStorage.removeItem('sophiapath_admin_editing_course');
                  localStorage.removeItem('sophiapath_admin_course_subtab');
                }} 
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant="h5" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>
                 {Number(user?.roleID) === 1 
                   ? `${editingCourseDetails.title}` 
                   : `Syllabus Editor: ${editingCourseDetails.title}`
                 }
               </Typography>
              <Typography variant="body2" style={{ color: 'var(--text-secondary)' }}>
                {Number(user?.roleID) === 1 
                  ? 'As an assigned Course Expert, you can manage the syllabus sections, lessons, and content for this course.'
                  : editingCourseDetails.description
                }
              </Typography>
            </Box>
          </Box>
          {courseSubTab === 'syllabus' && (
            <Box sx={{ display: 'flex', gap: '12px' }}>
              <Button
                variant="outlined"
                onClick={handleOpenSectionCreate}
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: '8px',
                  color: 'var(--primary-main)',
                  borderColor: 'var(--primary-main)',
                  opacity: 0.85,
                  '&:hover': {
                    borderColor: 'var(--primary-main)',
                    opacity: 1
                  }
                }}
              >
                Add Section
              </Button>
              {Number(user?.roleID) !== 1 && (
                <Button
                  variant="contained"
                  onClick={() => handleOpenCourseEditMetadata(editingCourseDetails)}
                  startIcon={<SettingsIcon />}
                  style={{
                    background: 'var(--hero-gradient)',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                >
                  Edit Course Metadata
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Course Sub-tabs */}
        <Paper className="glass-panel" style={{ padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)', display: 'inline-flex', alignSelf: 'flex-start' }}>
          <Tabs
            value={courseSubTab}
            onChange={(e, val) => setCourseSubTab(val)}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: 'var(--primary-main)' },
              '& .MuiTab-root': {
                color: 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderRadius: '6px',
                marginRight: '6px',
                minWidth: 'auto',
                padding: '6px 16px',
                '&.Mui-selected': { color: 'var(--primary-main)' }
              }
            }}
          >
            <Tab value="syllabus" label="Syllabus Builder" />
            <Tab value="auditor" label="AI Content Auditor" />
          </Tabs>
        </Paper>

        {courseSubTab === 'syllabus' ? (
          <>
            {/* Sections List */}
            {sections.length === 0 ? (
              <Paper className="learning-empty-state glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px', background: 'var(--surface-glass)', border: '1px solid var(--divider)' }}>
                <Typography variant="h6" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>No Sections Found</Typography>
                <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Create a section first to start structuring chapters and interactive lessons.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenSectionCreate} style={{ background: 'var(--hero-gradient)', borderRadius: '8px', textTransform: 'none', fontWeight: 800 }}>
                  Create Your First Section
                </Button>
              </Paper>
            ) : (
              <Box style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {sections.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((sec) => (
                  <Card key={sec.id || sec.title} className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)', overflow: 'visible' }}>
                    <CardContent style={{ padding: '24px' }}>
                      {/* Section Title and Controls */}
                      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <Box style={{ maxWidth: '75%' }}>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <Typography variant="h6" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{sec.title}</Typography>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700 }}>
                              ({(() => {
                                const finishedCount = getSectionFinishedCount(sec);
                                return `${finishedCount} ${finishedCount === 1 ? 'completion' : 'completions'}`;
                              })()})
                            </span>
                          </Box>
                          <Typography variant="body2" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sec.description}</Typography>
                        </Box>
                        <Box style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenLessonCreate(sec.id)}
                            sx={{
                              textTransform: 'none',
                              borderRadius: '8px',
                              fontWeight: 800,
                              color: 'var(--primary-main)',
                              borderColor: 'var(--primary-main)',
                              opacity: 0.85,
                              '&:hover': {
                                borderColor: 'var(--primary-main)',
                                opacity: 1
                              }
                            }}
                          >
                            Add Lesson
                          </Button>
                          <IconButton size="small" onClick={() => handleOpenSectionEdit(sec)} style={{ color: 'var(--primary-main)' }}>
                            <EditIcon style={{ fontSize: '1.2rem' }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteSection(sec.id, sec.title)} style={{ color: '#f44336' }}>
                            <DeleteIcon style={{ fontSize: '1.2rem' }} />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Section Lessons Table */}
                      {(!sec.lessons || sec.lessons.length === 0) ? (
                        <Typography style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem', paddingLeft: '8px' }}>
                          No lessons added to this section yet.
                        </Typography>
                      ) : (() => {
                        const searchVal = sectionLessonSearch[sec.id] || '';
                        const catVal = sectionLessonCategory[sec.id] || 'all';
                        const chapVal = sectionLessonChapter[sec.id] || 'all';

                        // Unique chapter names in this section
                        const uniqueChapters = Array.from(new Set(
                          (sec.lessons || [])
                            .map(les => les.chapterName)
                            .filter(Boolean)
                        ));

                        const filteredLessons = (sec.lessons || [])
                          .filter(les => {
                            if (searchVal) {
                              const q = searchVal.toLowerCase().trim();
                              // Only search lesson title
                              if (!les.title.toLowerCase().includes(q)) return false;
                            }
                            if (catVal !== 'all') {
                              if (les.category !== catVal) return false;
                            }
                            if (chapVal !== 'all') {
                              if (les.chapterName !== chapVal) return false;
                            }
                            return true;
                          })
                          .sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));

                        return (
                          <>
                            {/* Filter Bar */}
                            <Box style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                              <TextField
                                placeholder="Search lessons..."
                                value={searchVal}
                                onChange={(e) => setSectionLessonSearch(prev => ({ ...prev, [sec.id]: e.target.value }))}
                                size="small"
                                InputProps={{
                                  startAdornment: (
                                    <SearchIcon style={{ color: 'var(--text-secondary)', marginRight: '6px', fontSize: '1rem' }} />
                                  ),
                                }}
                                sx={{
                                  width: '200px',
                                  '& .MuiOutlinedInput-root': {
                                    color: 'var(--text-primary)',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                    fontSize: '0.82rem',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.06)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-main)' },
                                  }
                                }}
                              />
                              <Select
                                value={catVal}
                                onChange={(e) => setSectionLessonCategory(prev => ({ ...prev, [sec.id]: e.target.value }))}
                                size="small"
                                sx={{
                                  width: '140px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.82rem',
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.06)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-main)' }
                                }}
                              >
                                <MenuItem value="all" style={{ fontSize: '0.82rem' }}>All Categories</MenuItem>
                                <MenuItem value="lecture" style={{ fontSize: '0.82rem' }}>Lecture</MenuItem>
                                <MenuItem value="exercise" style={{ fontSize: '0.82rem' }}>Exercise</MenuItem>
                              </Select>
                              <Select
                                value={chapVal}
                                onChange={(e) => setSectionLessonChapter(prev => ({ ...prev, [sec.id]: e.target.value }))}
                                size="small"
                                displayEmpty
                                sx={{
                                  width: '180px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.82rem',
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.06)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-main)' }
                                }}
                              >
                                <MenuItem value="all" style={{ fontSize: '0.82rem' }}>All Chapters</MenuItem>
                                {uniqueChapters.map((chapName) => (
                                  <MenuItem key={chapName} value={chapName} style={{ fontSize: '0.82rem' }}>
                                    {chapName}
                                  </MenuItem>
                                ))}
                              </Select>
                            </Box>

                            <TableContainer style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap' }}>Lesson Title</TableCell>
                                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap' }}>Chapter</TableCell>
                                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap' }}>Category</TableCell>
                                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap' }}>Slides</TableCell>
                                    <TableCell align="right" style={{ color: 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap' }}>Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {filteredLessons.map((les) => (
                                    <TableRow key={les.id || les.title} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <TableCell style={{ color: 'var(--text-primary)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                        {les.title}
                                        <span style={{ 
                                          color: 'var(--primary-main)', 
                                          fontSize: '0.74rem', 
                                          fontWeight: 700, 
                                          marginLeft: '12px',
                                          background: 'rgba(var(--primary-main-rgb), 0.08)',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          border: '1px solid rgba(var(--primary-main-rgb), 0.1)',
                                          display: 'inline-block',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {(() => {
                                            const finishedCount = getLessonFinishedCount(les.id);
                                            return `${finishedCount} ${finishedCount === 1 ? 'completion' : 'completions'}`;
                                          })()}
                                        </span>
                                      </TableCell>
                                      <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{les.chapterName}</TableCell>
                                      <TableCell style={{ whiteSpace: 'nowrap' }}>
                                        {les.category === 'exercise' ? (
                                          <Chip
                                            label="Exercise"
                                            size="small"
                                            style={{
                                              background: 'rgba(var(--primary-main-rgb), 0.12)',
                                              color: 'var(--primary-main)',
                                              fontWeight: 800,
                                              fontSize: '0.72rem',
                                              borderRadius: '6px',
                                              border: '1px solid rgba(var(--primary-main-rgb), 0.15)'
                                            }}
                                          />
                                        ) : (
                                          <Chip
                                            label="Lecture"
                                            size="small"
                                            style={{
                                              background: 'rgba(255, 255, 255, 0.04)',
                                              color: 'var(--text-secondary)',
                                              fontWeight: 700,
                                              fontSize: '0.72rem',
                                              borderRadius: '6px',
                                              border: '1px solid var(--divider)'
                                            }}
                                          />
                                        )}
                                      </TableCell>
                                      <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{(les.pages || []).length} pages</TableCell>
                                      <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                                        <IconButton size="small" onClick={() => handleOpenLessonEdit(sec.id, les)} style={{ color: 'var(--primary-main)' }} title="Edit Lesson">
                                          <EditIcon style={{ fontSize: '1.05rem' }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteLesson(sec.id, les.id, les.title)} style={{ color: '#f44336' }} title="Delete Lesson">
                                          <DeleteIcon style={{ fontSize: '1.05rem' }} />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {filteredLessons.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '16px' }}>
                                        No lessons match current filters.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        ) : (
          <AiAuditorDashboard 
            courseId={editingCourseDetails.id} 
            courseTitle={editingCourseDetails.title} 
            sections={editingCourseDetails.sections || []} 
          />
        )}

        {/* Section Modal Dialog */}
        <Dialog 
          open={sectionDialogOpen} 
          onClose={() => setSectionDialogOpen(false)}
          PaperProps={{
            style: {
              background: 'var(--background-paper)',
              border: '1px solid var(--divider)',
              borderRadius: '24px',
              color: 'var(--text-primary)',
              padding: '16px'}
          }}
        >
          <DialogTitle style={{ fontWeight: 800, paddingBottom: '4px' }}>
            {sectionForm.isNew ? 'Create New Section' : 'Edit Section Details'}
          </DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '16px', minWidth: '360px' }}>
            <TextField
              fullWidth
              label="Section Title"
              value={sectionForm.title}
              onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Section Description"
              value={sectionForm.description}
              onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
            />
            <TextField
              fullWidth
              type="number"
              label="Order Index"
              value={sectionForm.orderIndex}
              onChange={(e) => setSectionForm(prev => ({ ...prev, orderIndex: Number(e.target.value) }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
            />
          </DialogContent>
          <DialogActions style={{ padding: '16px 24px' }}>
            <Button onClick={() => setSectionDialogOpen(false)} style={{ color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 800 }}>Cancel</Button>
            <Button onClick={handleSaveSection} variant="contained" style={{ background: 'var(--hero-gradient)', textTransform: 'none', fontWeight: 800, borderRadius: '8px', color: '#fff' }}>Save Section</Button>
          </DialogActions>
        </Dialog>

        {/* Course Metadata Modal Dialog */}
        <Dialog 
          open={courseDialogOpen} 
          onClose={() => setCourseDialogOpen(false)}
          PaperProps={{
            style: {
              background: 'var(--background-paper)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--divider)',
              borderRadius: '24px',
              color: 'var(--text-primary)',
              padding: '16px'}
          }}
        >
          <DialogTitle style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '1.25rem', paddingBottom: '8px' }}>
            <SettingsIcon style={{ color: 'var(--primary-main)' }} />
            Edit Course Settings
          </DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', minWidth: '420px' }}>
            <TextField
              fullWidth
              label="Course Title"
              value={courseForm.title}
              onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  color: 'var(--text-primary)',
                  '& fieldset': {
                    borderColor: 'var(--divider)',
                    transition: 'all 0.2s ease-in-out'},
                  '&:hover fieldset': {
                    borderColor: 'var(--text-secondary)'},
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-main)',
                    borderWidth: '1.5px'}},
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: 'var(--primary-main)'}
                }
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Short Description"
              value={courseForm.description}
              onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  color: 'var(--text-primary)',
                  '& fieldset': {
                    borderColor: 'var(--divider)',
                    transition: 'all 0.2s ease-in-out'},
                  '&:hover fieldset': {
                    borderColor: 'var(--text-secondary)'},
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-main)',
                    borderWidth: '1.5px'}},
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: 'var(--primary-main)'}
                }
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Detailed About Description"
              value={courseForm.about}
              onChange={(e) => setCourseForm(prev => ({ ...prev, about: e.target.value }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  color: 'var(--text-primary)',
                  '& fieldset': {
                    borderColor: 'var(--divider)',
                    transition: 'all 0.2s ease-in-out'},
                  '&:hover fieldset': {
                    borderColor: 'var(--text-secondary)'},
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-main)',
                    borderWidth: '1.5px'}},
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: 'var(--primary-main)'}
                }
              }}
            />
            <TextField
              fullWidth
              label="Image URL"
              value={courseForm.imageUrl}
              onChange={(e) => setCourseForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
              InputProps={{ style: { color: 'var(--text-primary)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  color: 'var(--text-primary)',
                  '& fieldset': {
                    borderColor: 'var(--divider)',
                    transition: 'all 0.2s ease-in-out'},
                  '&:hover fieldset': {
                    borderColor: 'var(--text-secondary)'},
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-main)',
                    borderWidth: '1.5px'}},
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: 'var(--primary-main)'}
                }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={courseForm.comingsoon}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, comingsoon: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'var(--primary-main)'},
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'var(--primary-main)'}
                  }}
                />
              }
              label={
                <Typography style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Coming Soon Status
                </Typography>
              }
            />
          </DialogContent>
          <DialogActions style={{ padding: '16px 24px', gap: '12px' }}>
            <Button 
              onClick={() => setCourseDialogOpen(false)} 
              style={{ 
                color: 'var(--text-primary)', 
                textTransform: 'none', 
                fontWeight: 800, 
                fontFamily: '"Outfit", sans-serif',
                borderRadius: '12px',
                padding: '8px 16px',
                border: '1px solid var(--divider)'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCourseMetadata} 
              variant="contained" 
              style={{ 
                background: 'var(--hero-gradient)', 
                textTransform: 'none', 
                fontWeight: 800, 
                borderRadius: '12px', 
                color: 'var(--text-primary)',
                fontFamily: '"Outfit", sans-serif',
                padding: '8px 18px'}}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const visibleCourses = (user?.roleID === 1
    ? courses.filter(c => user.assignedCourseIds?.map(Number).includes(Number(c.id)))
    : courses
  ).filter(c => {
    if (!courseSearchQuery) return true;
    const query = courseSearchQuery.trim();
    const matchPhraseFromWordStart = (text, q) => {
      if (!q) return true;
      if (!text) return false;
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('\\b' + escaped, 'i');
      return regex.test(text);
    };
    return matchPhraseFromWordStart(c.title, query) || 
           matchPhraseFromWordStart(c.description, query) || 
           String(c.id).startsWith(query);
  });

  const getDashboardStats = () => {
    let totalEnrollments = 0;
    let totalLessonsCount = 0;
    let completedLessonsCount = 0;

    courses.forEach(course => {
      const progressList = coursesProgress[course.id] || [];
      totalEnrollments += progressList.length;

      const courseLessonsCount = (course.sections || []).reduce((sum, s) => sum + (s.lessons || []).length, 0);

      progressList.forEach(record => {
        totalLessonsCount += courseLessonsCount;
        const completed = (record.grades || []).filter(g => g.completed || (g.grade !== null && g.grade >= 70)).length;
        completedLessonsCount += completed;
      });
    });

    const completionRate = totalLessonsCount > 0 
      ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
      : 0;

    const totalSections = courses.reduce((sum, c) => sum + (c.sections || []).length, 0);
    const totalLessons = courses.reduce((sum, c) => sum + (c.sections || []).reduce((sAcc, s) => sAcc + (s.lessons || []).length, 0), 0);

    return {
      totalEnrollments,
      completionRate,
      totalSections,
      totalLessons
    };
  };

  const stats = getDashboardStats();

  // Otherwise, render core Admin Control Panel (Tab switcher: Manage Courses list, Manage Users list, Audit logs)
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
      {loadError && (
        <Paper 
          className="glass-panel" 
          style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255, 152, 0, 0.25)', 
            background: 'rgba(255, 152, 0, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: '#ff9800'
          }}
        >
          <WarningIcon />
          <Typography variant="body2" style={{ fontWeight: 800 }}>
            {loadError}
          </Typography>
        </Paper>
      )}

      {/* Admin Stats Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar style={{ background: 'rgba(var(--primary-main-rgb), 0.15)', color: 'var(--primary-main)' }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>TOTAL STUDENT ENROLLMENTS</Typography>
                <Typography variant="h5" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>{stats.totalEnrollments}</Typography>
                <Typography variant="caption" style={{ color: 'var(--primary-main)', fontWeight: 800 }}>{stats.completionRate}% avg completion rate</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar style={{ background: 'rgba(var(--primary-main-rgb), 0.15)', color: 'var(--primary-main)' }}>
                <BookIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>PUBLISHED COURSES</Typography>
                <Typography variant="h5" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>{visibleCourses.length}</Typography>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Active learning tracks</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar style={{ background: 'rgba(var(--primary-main-rgb), 0.15)', color: 'var(--primary-main)' }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>TOTAL REGISTERED USERS</Typography>
                <Typography variant="h5" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>{users.length}</Typography>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Active student & staff accounts</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar style={{ background: 'rgba(var(--primary-main-rgb), 0.15)', color: 'var(--primary-main)' }}>
                <DatabaseIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>TOTAL CURRICULUM ITEMS</Typography>
                <Typography variant="h5" style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: '"Outfit", sans-serif' }}>{stats.totalLessons} Lessons</Typography>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>{stats.totalSections} Sections in database</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sub-tab selection bar */}
      <Paper className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
        <Tabs
          value={adminTab}
          onChange={(e, val) => {
            if (user?.roleID === 1 && val !== 'courses') return;
            setAdminTab(val);
          }}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: 'var(--primary-main)' },
            '& .MuiTab-root': {
              color: 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.8rem',
              textTransform: 'none',
              borderRadius: '6px',
              marginRight: '6px',
              '&.Mui-selected': { color: 'var(--primary-main)' }
            }
          }}
        >
          <Tab value="courses" label="Syllabus Editor" />
          {user?.roleID !== 1 && <Tab value="users" label="User Access Control" />}
          {user?.roleID !== 1 && <Tab value="applications" label="Role Applications" />}
          {user?.roleID !== 1 && <Tab value="logs" label="Security Logs" />}
        </Tabs>
      </Paper>

      {/* Sub-tab views */}
      {adminTab === 'courses' && (
        <Paper className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <Box>
              <Typography variant="h6" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Courses Directory</Typography>
              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>Configure courses, sections, lessons, and custom slide components</Typography>
            </Box>
            <Box style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search courses..."
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <SearchIcon style={{ color: 'var(--text-secondary)', marginRight: '8px', fontSize: '1.15rem' }} />
                  ),
                }}
                sx={{
                  width: '240px',
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-main)' },
                  }
                }}
              />
              {user?.roleID !== 1 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCourseCreate}
                  style={{
                    background: 'var(--hero-gradient)',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                >
                  Create Course
                </Button>
              )}
            </Box>
          </Box>

          <TableContainer style={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Title</TableCell>
                  <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>ID</TableCell>
                  <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Syllabus Structure</TableCell>
                  <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Registrations</TableCell>
                  <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="right" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleCourses.map((course) => (
                  <TableRow key={course.id || course.title} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <TableCell style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{course.title}</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{course.id}</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {(() => {
                        const secCount = (course.sections || []).length;
                        return (
                          <span
                            style={{
                              color: 'var(--primary-main)',
                              fontWeight: 800,
                              marginRight: '6px'
                            }}
                          >
                            {secCount} {secCount === 1 ? 'Section' : 'Sections'}
                          </span>
                        );
                      })()}
                      {(() => {
                        const lesCount = (course.sections || []).reduce((acc, s) => acc + (s.lessons || []).length, 0);
                        return `${lesCount} ${lesCount === 1 ? 'Lesson' : 'Lessons'}`;
                      })()}
                    </TableCell>
                    <TableCell style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                      {(() => {
                        const regCount = (coursesProgress[course.id] || coursesProgress[Number(course.id)] || coursesProgress[String(course.id)])?.length || 0;
                        return `${regCount} ${regCount === 1 ? 'registration' : 'registrations'}`;
                      })()}
                    </TableCell>
                    <TableCell>
                      {course.comingsoon ? (
                        <span style={{ color: '#ff9800', fontWeight: 800 }}>Coming Soon</span>
                      ) : (
                        <span style={{ color: 'var(--primary-main)', fontWeight: 800 }}>Published</span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setEditingCourseDetails(course)}
                        startIcon={<EditIcon />}
                        style={{
                          textTransform: 'none',
                          fontWeight: 800,
                          borderRadius: '8px',
                          color: 'var(--primary-main)',
                          borderColor: 'var(--primary-main)',
                          marginRight: '8px'
                        }}
                      >
                        Edit Syllabus
                      </Button>
                      {user?.roleID !== 1 && (
                        <>
                          <IconButton onClick={() => handleOpenCourseEditMetadata(course)} style={{ color: 'var(--text-secondary)' }}>
                            <SettingsIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteCourse(course.id, course.title)} style={{ color: '#f44336' }}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {adminTab === 'users' && (
        <Paper className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
          <Box style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <Box>
              <Typography variant="h6" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>User Access Directory</Typography>
              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>Live users from backend. Roles: Student, Expert, Moderator, Admin.</Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setUsersLoading(true);
                fetch('/users')
                  .then(res => res.ok ? res.json() : [])
                  .then(data => {
                    setUsers((data || []).map(u => {
                      const finalRoleId = u.roleID ?? 0;
                      const finalCourses = u.assignedCourseIds || [];
                      return {
                        id: u.id,
                        name: u.fullname || u.username || 'Unknown',
                        email: u.email,
                        username: u.username,
                        roleID: finalRoleId,
                        roleName: ROLE_NAMES[finalRoleId] || 'Student',
                        xp: u.xp ?? 0,
                        level: u.level ?? 1,
                        levelName: u.levelName ?? 'Beginner',
                        assignedCourseIds: finalCourses
                      };
                    }));
                  })
                  .catch(console.error)
                  .finally(() => setUsersLoading(false));
              }}
              style={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', color: 'var(--primary-main)', borderColor: 'rgba(28,176,246,0.3)' }}
            >
              {usersLoading ? 'Refreshing…' : '↻ Refresh'}
            </Button>
          </Box>

          {/* Search bar with start-of-word username filter */}
          <Box style={{ marginBottom: '20px', maxWidth: '360px' }}>
            <TextField
              fullWidth
              placeholder="Search by username..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchIcon style={{ color: 'var(--text-secondary)', marginRight: '8px', fontSize: '1.15rem' }} />
                ),
                style: { color: 'var(--text-primary)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--primary-main)' }
                }
              }}
            />
          </Box>

          {usersLoading && users.length === 0 ? (
            <Typography style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>Loading users from backend…</Typography>
          ) : (
            <TableContainer style={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Name</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Username</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Email</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Role</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>XP / Level</TableCell>
                    <TableCell align="right" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .filter(u => {
                      if (u.roleID === 3) return false; // Exclude Admin users from lists/search results
                      if (!userSearchQuery) return true;
                      const query = userSearchQuery.trim();
                      const matchPhraseFromWordStart = (text, q) => {
                        if (!q) return true;
                        if (!text) return false;
                        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp('\\b' + escaped, 'i');
                        return regex.test(text);
                      };
                      return matchPhraseFromWordStart(u.username, query) || 
                             matchPhraseFromWordStart(u.name, query) || 
                             matchPhraseFromWordStart(u.email, query);
                    })
                    .sort((a, b) => b.roleID - a.roleID) // Sort users by role descending
                    .map((u) => {
                      const roleStyle = ROLE_COLORS[u.roleID] || ROLE_COLORS[0];
                      return (
                        <TableRow key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <TableCell style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{u.name}</TableCell>
                          <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>@{u.username}</TableCell>
                          <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{u.email}</TableCell>
                          <TableCell>
                            <span style={{ color: roleStyle.color, fontWeight: 800 }}>
                              {u.roleName}
                            </span>
                          </TableCell>
                          <TableCell style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{u.xp} XP · Lv.{u.level}</TableCell>
                          <TableCell align="right">
                             <IconButton onClick={() => handleOpenUserEdit(u)} style={{ color: 'var(--primary-main)' }} title="Edit user">
                               <EditIcon />
                             </IconButton>
                           </TableCell>
                        </TableRow>
                      );
                    })}
                  {users.length === 0 && !usersLoading && (
                    <TableRow>
                      <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '32px' }}>No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {adminTab === 'applications' && (
        <Paper className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
          <Box style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <Box>
              <Typography variant="h6" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Role Applications</Typography>
              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>Review requests from users applying to become Expert or Moderator</Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setApplicationsLoading(true);
                adminFetch('/users/applications')
                  .then(res => res.ok ? res.json() : [])
                  .then(data => setApplications(data || []))
                  .catch(console.error)
                  .finally(() => setApplicationsLoading(false));
              }}
              style={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', color: 'var(--primary-main)', borderColor: 'rgba(28,176,246,0.3)' }}
            >
              {applicationsLoading ? 'Loading…' : '↻ Refresh'}
            </Button>
          </Box>

          {applicationsLoading && applications.length === 0 ? (
            <Typography style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>Loading applications…</Typography>
          ) : applications.length === 0 ? (
            <Typography style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>No role applications found</Typography>
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {applications.map((app) => {
                const reqRoleStyle = ROLE_COLORS[app.requestedRole] || ROLE_COLORS[1];
                const statusColor = app.status === 'accepted' ? 'var(--primary-main)' : app.status === 'rejected' ? 'var(--text-secondary)' : '#ff9800';
                const statusBg = app.status === 'accepted' ? 'rgba(61,92,255,0.12)' : app.status === 'rejected' ? 'rgba(255,255,255,0.05)' : 'rgba(255,152,0,0.12)';
                const isPending = !app.status || app.status === 'pending';
                const applicantName = app.user?.fullname || app.user?.username || 'Unknown User';
                const appTitle = app.requestedRole === 1 ? 'Expert Position Application' : 'Moderator Position Application';
                return (
                  <Card key={app.id} className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'visible' }}>
                    <CardContent style={{ padding: '20px 24px' }}>
                      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <Avatar 
                            src={app.user?.avatar}
                            style={{ background: 'rgba(28,176,246,0.15)', color: '#1CB0F6', width: 40, height: 40, fontWeight: 900 }}
                          >
                            {!app.user?.avatar && applicantName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '1rem' }}>
                              {applicantName}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                              {appTitle} · Application #{app.id}
                            </Typography>
                          </Box>
                          <span style={{ color: reqRoleStyle.color, fontWeight: 800, fontSize: '0.85rem' }}>
                            Requesting: {ROLE_NAMES[app.requestedRole] || 'Expert'}
                          </span>
                          {app.courseId && (() => {
                            const targetC = courses.find(c => Number(c.id) === Number(app.courseId));
                            const courseName = targetC ? targetC.title : `Course #${app.courseId}`;
                            return (
                              <span style={{ color: 'var(--primary-main)', fontWeight: 800, fontSize: '0.85rem' }}>
                                Target Course: {courseName}
                              </span>
                            );
                          })()}
                        </Box>
                        <span style={{ color: statusColor, fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {app.status || 'pending'}
                        </span>
                      </Box>

                      {app.description && (
                        <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '10px', fontStyle: 'italic' }}>
                          "{app.description}"
                        </Typography>
                      )}
                      {app.reasons && (() => {
                        const parsed = parseAppDetails(app);
                        return (
                          <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                            <strong>Reasons:</strong> {parsed.reasonsText || 'No reasons provided.'}
                          </Typography>
                        );
                      })()}

                      {isPending && (
                        <Box style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => setSelectedAppForView(app)}
                            style={{ background: 'var(--primary-main)', color: '#fff', textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                          >
                            View Info
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleApplicationStatus(app.id, 'rejected', applicantName)}
                            style={{ color: '#f44336', borderColor: 'rgba(244,67,54,0.3)', textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                          >
                            Remove Application
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Paper>
      )}

      {/* View Application Info Dialog */}
      {selectedAppForView && (() => {
        const details = parseAppDetails(selectedAppForView);
        const reqRoleStyle = ROLE_COLORS[selectedAppForView.requestedRole] || ROLE_COLORS[1];
        
        return (
          <Dialog
            open={!!selectedAppForView}
            onClose={() => setSelectedAppForView(null)}
            PaperProps={{
              style: {
                background: 'var(--background-paper)',
                color: 'var(--text-primary)',
                border: '1px solid var(--divider)',
                borderRadius: '16px',
                padding: '12px'
              }
            }}
          >
            <DialogTitle style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif' }}>
              Application Details
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} style={{ marginTop: '12px' }}>
                <Box style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Avatar 
                    src={selectedAppForView.user?.avatar}
                    style={{ background: 'rgba(28,176,246,0.15)', color: '#1CB0F6', width: 48, height: 48, fontWeight: 900 }}
                  >
                    {!selectedAppForView.user?.avatar && (selectedAppForView.user?.fullname || selectedAppForView.user?.username || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      {selectedAppForView.user?.fullname || 'Unknown User'}
                    </Typography>
                    <Typography variant="body2" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                      @{selectedAppForView.user?.username} · {selectedAppForView.user?.email}
                    </Typography>
                  </Box>
                </Box>

                <Box style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', background: 'var(--action-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--divider)' }}>
                  <Box>
                    <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>USER LEVEL</Typography>
                    <Typography style={{ fontWeight: 800 }}>Lv.{selectedAppForView.user?.level || 1} ({selectedAppForView.user?.levelName || 'Beginner'})</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>EXPERIENCE POINTS</Typography>
                    <Typography style={{ fontWeight: 800 }}>{(selectedAppForView.user?.xp || 0).toLocaleString()} XP</Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>REQUESTED ROLE</Typography>
                  <Box style={{ marginTop: '4px' }}>
                    <span style={{ color: reqRoleStyle.color, fontWeight: 800, fontSize: '0.9rem' }}>
                      {ROLE_NAMES[selectedAppForView.requestedRole] || 'Expert'}
                    </span>
                  </Box>
                </Box>

                {selectedAppForView.courseId && (() => {
                  const targetC = courses.find(c => Number(c.id) === Number(selectedAppForView.courseId));
                  const courseName = targetC ? targetC.title : `Course #${selectedAppForView.courseId}`;
                  return (
                    <Box>
                      <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>TARGET COURSE</Typography>
                      <Typography style={{ fontWeight: 800 }}>{courseName}</Typography>
                    </Box>
                  );
                })()}

                <Box>
                  <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>CONTACT EMAIL</Typography>
                  <Typography style={{ fontWeight: 800 }}>{details.email || selectedAppForView.email}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>CONTACT PHONE</Typography>
                  <Typography style={{ fontWeight: 800 }}>{details.phone || selectedAppForView.phone || 'Not provided'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>CV ATTACHMENT</Typography>
                  <Box style={{ marginTop: '4px' }}>
                    {(details.cvBase64 || selectedAppForView.cvBase64) ? (
                      <a
                        href={details.cvBase64 || selectedAppForView.cvBase64}
                        download={details.cvFileName || selectedAppForView.cvFileName}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#1CB0F6',
                          textDecoration: 'none',
                          fontWeight: 800,
                          background: 'rgba(28, 176, 246, 0.1)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(28, 176, 246, 0.2)'
                        }}
                      >
                        📥 Download CV ({details.cvFileName || selectedAppForView.cvFileName})
                      </a>
                    ) : (
                      <Typography style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>No file attached</Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>REASONS / MOTIVATION</Typography>
                  <Typography style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                    {details.reasonsText || selectedAppForView.reasons || 'No motivation details provided.'}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions style={{ gap: '8px', padding: '16px' }}>
              <Button
                variant="contained"
                onClick={() => {
                  handleApplicationStatus(selectedAppForView.id, 'rejected', selectedAppForView.user?.fullname || selectedAppForView.user?.username || 'Unknown User');
                  setSelectedAppForView(null);
                }}
                style={{ background: '#f44336', color: '#fff', textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
              >
                Remove Application
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedAppForView(null)}
                style={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', color: 'var(--text-primary)', borderColor: 'var(--divider)' }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

      {adminTab === 'logs' && (
        <Paper className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-glass)' }}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <Box>
              <Typography variant="h6" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Security Audit Trail</Typography>
              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>Live platform security, audit trail, and API events logs</Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setLogs([])}
              style={{ textTransform: 'none', borderRadius: '8px', color: 'var(--text-secondary)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Clear Logs
            </Button>
          </Box>

          <Box style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '16px', fontFamily: 'monospace', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.length === 0 ? (
              <Typography style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Logs are empty</Typography>
            ) : (
              logs.map((log) => {
                const colorMap = {
                  info: '#1CB0F6',
                  action: '#4caf50',
                  warning: '#ff9800',
                  system: '#e040fb'
                };
                return (
                  <Box key={log.id} style={{ display: 'flex', gap: '12px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>[{log.timestamp}]</span>
                    <span style={{ color: colorMap[log.level] || 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase' }}>{log.level}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{log.event}</span>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>
      )}

     
      {/* Course Creation Modal Dialog */}
      <Dialog 
        open={courseDialogOpen} 
        onClose={() => setCourseDialogOpen(false)}
        PaperProps={{
          style: {
            background: 'var(--background-paper)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--divider)',
            borderRadius: '24px',
            color: 'var(--text-primary)',
            padding: '16px'}
        }}
      >
        <DialogTitle style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '1.25rem', paddingBottom: '8px' }}>
          <SettingsIcon style={{ color: 'var(--primary-main)' }} />
          {courseForm.id === null ? 'Create New Course' : 'Edit Course Settings'}
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', minWidth: '420px' }}>
          <TextField
            fullWidth
            label="Course Title"
            value={courseForm.title}
            onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
            InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
            InputProps={{ style: { color: 'var(--text-primary)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                color: 'var(--text-primary)',
                '& fieldset': {
                  borderColor: 'var(--divider)',
                  transition: 'all 0.2s ease-in-out'},
                '&:hover fieldset': {
                  borderColor: 'var(--text-secondary)'},
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary-main)',
                  borderWidth: '1.5px'}},
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: 'var(--primary-main)'}
              }
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Short Description"
            value={courseForm.description}
            onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
            InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
            InputProps={{ style: { color: 'var(--text-primary)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                color: 'var(--text-primary)',
                '& fieldset': {
                  borderColor: 'var(--divider)',
                  transition: 'all 0.2s ease-in-out'},
                '&:hover fieldset': {
                  borderColor: 'var(--text-secondary)'},
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary-main)',
                  borderWidth: '1.5px'}},
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: 'var(--primary-main)'}
              }
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Detailed Syllabus / About"
            value={courseForm.about}
            onChange={(e) => setCourseForm(prev => ({ ...prev, about: e.target.value }))}
            InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
            InputProps={{ style: { color: 'var(--text-primary)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                color: 'var(--text-primary)',
                '& fieldset': {
                  borderColor: 'var(--divider)',
                  transition: 'all 0.2s ease-in-out'},
                '&:hover fieldset': {
                  borderColor: 'var(--text-secondary)'},
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary-main)',
                  borderWidth: '1.5px'}},
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: 'var(--primary-main)'}
              }
            }}
          />
          <TextField
            fullWidth
            label="Image URL"
            value={courseForm.imageUrl}
            onChange={(e) => setCourseForm(prev => ({ ...prev, imageUrl: e.target.value }))}
            InputLabelProps={{ style: { color: 'var(--text-secondary)' } }}
            InputProps={{ style: { color: 'var(--text-primary)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                color: 'var(--text-primary)',
                '& fieldset': {
                  borderColor: 'var(--divider)',
                  transition: 'all 0.2s ease-in-out'},
                '&:hover fieldset': {
                  borderColor: 'var(--text-secondary)'},
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary-main)',
                  borderWidth: '1.5px'}},
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: 'var(--primary-main)'}
              }
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={courseForm.comingsoon}
                onChange={(e) => setCourseForm(prev => ({ ...prev, comingsoon: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'var(--primary-main)'},
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--primary-main)'}
                }}
              />
            }
            label={
              <Typography style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Queue as Coming Soon
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', gap: '12px' }}>
          <Button 
            onClick={() => setCourseDialogOpen(false)} 
            style={{ 
              color: 'var(--text-primary)', 
              textTransform: 'none', 
              fontWeight: 800, 
              fontFamily: '"Outfit", sans-serif',
              borderRadius: '12px',
              padding: '8px 16px',
              border: '1px solid var(--divider)'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCourseMetadata} 
            variant="contained" 
            style={{ 
              background: 'var(--hero-gradient)', 
              textTransform: 'none', 
              fontWeight: 800, 
              borderRadius: '12px', 
              color: 'var(--text-primary)',
              fontFamily: '"Outfit", sans-serif',
              padding: '8px 18px'}}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* User edit dialog */}
      <Dialog 
        open={userDialogOpen} 
        onClose={() => setUserDialogOpen(false)}
        PaperProps={{
          style: {
            background: 'var(--background-paper)',
            border: '1px solid var(--divider)',
            borderRadius: '24px',
            color: 'var(--text-primary)',
            padding: '16px'}
        }}
      >
        <DialogTitle style={{ fontWeight: 800, paddingBottom: '4px' }}>Edit User Role</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '16px', minWidth: '320px' }}>
          <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)' }}>User: {userForm.name}</Typography>
          <Box>
            <Typography variant="caption" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>Assign New Role</Typography>
            <Select
              fullWidth
              value={userForm.roleID}
              onChange={(e) => setUserForm(prev => ({ ...prev, roleID: e.target.value }))}
              sx={{ color: 'var(--text-primary)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
            >
              <MenuItem value={0}>Student — Default learner</MenuItem>
              <MenuItem value={1}>Expert — Course instructor</MenuItem>
              <MenuItem value={2}>Moderator — Community mod</MenuItem>
              <MenuItem value={3}>Admin — Full access</MenuItem>
            </Select>
          </Box>

          {userForm.roleID === 1 && (
            <Box style={{ marginTop: '16px' }}>
              <Typography variant="caption" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>Assign Expertise Course Field</Typography>
              <Box style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {courses.map(c => {
                  const isChecked = userForm.assignedCourseIds?.map(Number).includes(Number(c.id));
                  return (
                    <FormControlLabel
                      key={c.id}
                      control={
                        <Radio
                          checked={isChecked}
                          onChange={(e) => {
                            const cid = Number(c.id);
                            setUserForm(prev => ({
                              ...prev,
                              assignedCourseIds: e.target.checked ? [cid] : []
                            }));
                          }}
                          sx={{
                            color: 'rgba(255,255,255,0.3)',
                            '&.Mui-checked': { color: 'var(--primary-main)' }
                          }}
                        />
                      }
                      label={
                        <Typography style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 650 }}>
                          {c.title} (ID: {c.id})
                        </Typography>
                      }
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setUserDialogOpen(false)} style={{ color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 800 }}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" style={{ background: 'var(--hero-gradient)', textTransform: 'none', fontWeight: 800, borderRadius: '8px', color: '#fff' }}>Update Access</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboardPage;
