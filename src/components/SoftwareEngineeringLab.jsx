import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  useTheme,
  Typography,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import html2canvas from 'html2canvas';

// Default Templates for the Diagrams
const TEMPLATES = {
  er: `ENTITY Student
ATTRIBUTES
student_id : int PRIMARY KEY
name : string
email : string

ENTITY Course
ATTRIBUTES
course_id : int PRIMARY KEY
title : string
credits : int

ENTITY Instructor
ATTRIBUTES
instructor_id : int PRIMARY KEY
name : string
department : string

ENTITY Enrollment
ATTRIBUTES
student_id : int FOREIGN KEY
course_id : int FOREIGN KEY
semester : string
grade : string

RELATIONSHIP Student MANY TO Enrollment ONE
RELATIONSHIP Course MANY TO Enrollment ONE

RELATIONSHIP Instructor ONE TO Course MANY`,
  usecase: `SYSTEM SophiaPath

ACTOR Guest
ACTOR Student
ACTOR Instructor
ACTOR Admin

USE CASE Register
USE CASE Login
USE CASE View Courses
USE CASE Enroll in Course
USE CASE Complete Lesson
USE CASE Manage Users

Student -> Register
Student -> Login
Student -> View Courses
Student -> Enroll in Course
Student -> Complete Lesson

Guest -> Register
Guest -> View Courses

Instructor -> Manage Courses

Admin -> Manage Users

Complete Lesson EXTENDS View Courses
Enroll in Course INCLUDES Login`,
  sequence: `SEQUENCE User Login and Course Enrollment

PARTICIPANT Student
PARTICIPANT Web App
PARTICIPANT Authentication Service
PARTICIPANT Database
PARTICIPANT Notification Service

Student sends "Open Login Page" to Web App.

Web App displays Login Form to Student.

Student sends "Email & Password" to Web App.

Web App sends "Validate Credentials" to Authentication Service.

Authentication Service requests User Record from Database.

Database returns User Record.

IF credentials are valid THEN

    Authentication Service generates Access Token.

    Authentication Service returns Success to Web App.

    Web App stores Session.

    Web App displays Dashboard to Student.

    Student sends "Enroll in Cybersecurity Course" to Web App.

    Web App requests Course Details from Database.

    Database returns Course Information.

    IF seats are available THEN

        Web App requests Enrollment from Database.

        Database creates Enrollment.

        Database returns Enrollment Success.

        Web App sends Confirmation to Notification Service.

        Notification Service sends Email Confirmation to Student.

        Web App displays "Enrollment Successful".

    ELSE

        Web App displays "Course is Full".

    END

ELSE

    Authentication Service returns Authentication Failed.

    Web App displays Invalid Credentials.

END`,
  gantt: `GANTT SophiaPath Development

PROJECT SophiaPath

TASK Project Planning
START 2026-07-01
END 2026-07-05

TASK UI Design
START 2026-07-03
END 2026-07-12
DEPENDS ON Project Planning

TASK Backend Development
START 2026-07-06
END 2026-07-25
DEPENDS ON Project Planning

TASK Frontend Development
START 2026-07-08
END 2026-07-28
DEPENDS ON UI Design

TASK Database Design
START 2026-07-06
END 2026-07-10

TASK Authentication
START 2026-07-12
END 2026-07-18
DEPENDS ON Backend Development
DEPENDS ON Database Design

TASK ER Diagram Generator
START 2026-07-15
END 2026-07-22
DEPENDS ON Frontend Development
DEPENDS ON Backend Development

TASK Testing
START 2026-07-26
END 2026-08-03
DEPENDS ON Authentication
DEPENDS ON ER Diagram Generator

TASK Deployment
START 2026-08-04
END 2026-08-05
DEPENDS ON Testing

MILESTONE Version 1.0
DATE 2026-08-05`
};

export const SoftwareEngineeringLab = ({ open, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { themeMode } = useContext(ThemeContext);

  // Core Editor & Panel states
  const [activeTab, setActiveTab] = useState(0);
  const [code, setCode] = useState(TEMPLATES.er);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Split-pane slider state
  const [splitPercent, setSplitPercent] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zooming and Panning states
  const [zoomScale, setZoomScale] = useState(1.0);
  const [draggingNode, setDraggingNode] = useState(null);

  // Preview Dialog states matching Java UML playground
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(themeMode || 'dark');
  const [previewZoomScale, setPreviewZoomScale] = useState(1.0);

  useEffect(() => {
    if (themeMode) {
      setActiveTheme(themeMode);
    }
  }, [themeMode]);

  // Separate layout states per diagram type to prevent overlap/loss
  const [allNodePositions, setAllNodePositions] = useState({
    er: {},
    usecase: {}
  });

  const tabsMeta = [
    { key: 'er', label: 'ER Diagram', title: 'Entity-Relationship Editor' },
    { key: 'usecase', label: 'Use Case Diagram', title: 'Use Case Modeler' },
    { key: 'sequence', label: 'Sequence Diagram', title: 'Sequence Flow Modeler' },
    { key: 'gantt', label: 'Gantt Chart', title: 'Scrum Gantt Scheduler' }
  ];

  const activeTabKey = tabsMeta[activeTab].key;
  const activeTabTitle = tabsMeta[activeTab].title;

  // Refs for tracking interactive mouse states
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const canvasContainerRef = useRef(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef(null);
  const isDraggingSplitRef = useRef(false);

  // Refs for Preview Dialog panning
  const isPanningPreviewRef = useRef(false);
  const panStartPreviewRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const previewCanvasContainerRef = useRef(null);
  const previewZoomAnchorRef = useRef(null);

  const nodePositions = allNodePositions[activeTabKey] || {};
  const setNodePositions = (updater) => {
    setAllNodePositions(prev => {
      const current = prev[activeTabKey] || {};
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        [activeTabKey]: next
      };
    });
  };

  const handleTabChange = (event) => {
    const newValue = event.target.value;
    setActiveTab(newValue);
    const nextKey = tabsMeta[newValue].key;
    setCode(TEMPLATES[nextKey]);
    setZoomScale(1.0);
    setError(null);
    if (canvasContainerRef.current) {
      canvasContainerRef.current.scrollLeft = 0;
      canvasContainerRef.current.scrollTop = 0;
    }
  };

  // 1. Initial position generator for nodes
  useEffect(() => {
    setNodePositions(prev => {
      const next = { ...prev };
      let updated = false;

      if (activeTabKey === 'er') {
        const { entities } = parseER(code);
        entities.forEach((entity, idx) => {
          if (!next[entity.name]) {
            next[entity.name] = {
              x: (idx % 3) * 320 + 80,
              y: Math.floor(idx / 3) * 260 + 80
            };
            updated = true;
          }
        });
      } else if (activeTabKey === 'usecase') {
        const { actors, usecases } = parseUseCase(code);
        actors.forEach((act, idx) => {
          if (!next[act.id]) {
            next[act.id] = { x: 100, y: idx * 180 + 150 };
            updated = true;
          }
        });
        usecases.forEach((uc, idx) => {
          if (!next[uc.id]) {
            next[uc.id] = { x: 420, y: idx * 110 + 100 };
            updated = true;
          }
        });
      }

      return updated ? next : prev;
    });
  }, [code, activeTabKey]);

  // 2. Zoom Scroll Anchor centering
  useEffect(() => {
    if (zoomAnchorRef.current && canvasContainerRef.current) {
      const { x_virtual, y_virtual, mx, my } = zoomAnchorRef.current;
      canvasContainerRef.current.scrollLeft = x_virtual * zoomScale - mx;
      canvasContainerRef.current.scrollTop = y_virtual * zoomScale - my;
      zoomAnchorRef.current = null;
    }
  }, [zoomScale]);

  useEffect(() => {
    if (previewZoomAnchorRef.current && previewCanvasContainerRef.current) {
      const { x_virtual, y_virtual, mx, my } = previewZoomAnchorRef.current;
      previewCanvasContainerRef.current.scrollLeft = x_virtual * previewZoomScale - mx;
      previewCanvasContainerRef.current.scrollTop = y_virtual * previewZoomScale - my;
      previewZoomAnchorRef.current = null;
    }
  }, [previewZoomScale]);

  // 3. Wheel listener for zooming main canvas
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const x_virtual = (container.scrollLeft + mx) / zoomScale;
      const y_virtual = (container.scrollTop + my) / zoomScale;
      zoomAnchorRef.current = { x_virtual, y_virtual, mx, my };

      const step = 0.05;
      setZoomScale(prev => Math.max(0.2, Math.min(2.0, prev + (e.deltaY < 0 ? step : -step))));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [canvasContainerRef.current, zoomScale]);

  // Wheel listener for zooming preview canvas
  useEffect(() => {
    const container = previewCanvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const x_virtual = (container.scrollLeft + mx) / previewZoomScale;
      const y_virtual = (container.scrollTop + my) / previewZoomScale;
      previewZoomAnchorRef.current = { x_virtual, y_virtual, mx, my };

      const step = 0.05;
      setPreviewZoomScale(prev => Math.max(0.2, Math.min(2.0, prev + (e.deltaY < 0 ? step : -step))));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [previewCanvasContainerRef.current, previewZoomScale]);

  // 4. Global window listeners for drag partition resizing and canvas panning
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSplitRef.current) {
        const container = document.getElementById('se-split-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const offset = e.clientX - rect.left;
          const newPercent = Math.max(25, Math.min(75, (offset / rect.width) * 100));
          setSplitPercent(newPercent);
        }
      } else if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        if (canvasContainerRef.current) {
          canvasContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
          canvasContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
        }
      } else if (isPanningPreviewRef.current) {
        const dx = e.clientX - panStartPreviewRef.current.x;
        const dy = e.clientY - panStartPreviewRef.current.y;
        if (previewCanvasContainerRef.current) {
          previewCanvasContainerRef.current.scrollLeft = panStartPreviewRef.current.scrollLeft - dx;
          previewCanvasContainerRef.current.scrollTop = panStartPreviewRef.current.scrollTop - dy;
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSplitRef.current) {
        isDraggingSplitRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (isPanningRef.current) {
        isPanningRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (isPanningPreviewRef.current) {
        isPanningPreviewRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 5. Throttled Node card dragging using requestAnimationFrame
  useEffect(() => {
    if (!draggingNode) return;

    let animationFrameId = null;

    const handleMouseMove = (e) => {
      if (animationFrameId) return;

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        const newX = Math.max(0, e.clientX / zoomScale - dragStartOffset.current.x);
        const yOffsetVal = e.clientY / zoomScale - dragStartOffset.current.y;
        const newY = Math.max(0, yOffsetVal);

        setNodePositions(prev => {
          const current = prev[draggingNode];
          if (current && Math.abs(current.x - newX) < 0.5 && Math.abs(current.y - newY) < 0.5) {
            return prev;
          }
          return {
            ...prev,
            [draggingNode]: { x: newX, y: newY }
          };
        });
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setDraggingNode(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [draggingNode, zoomScale, activeTabKey]);

  // Escape key to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Calculate canvas dimensions dynamically to expand scroll boundaries
  const getCanvasDimensions = () => {
    let maxX = 1600;
    let maxY = 1200;

    if (activeTabKey === 'er') {
      const { entities } = parseER(code);
      entities.forEach(ent => {
        const pos = nodePositions[ent.name];
        if (pos) {
          if (pos.x + 350 + 200 > maxX) maxX = pos.x + 350 + 200;
          if (pos.y + 300 + 200 > maxY) maxY = pos.y + 300 + 200;
        }
      });
    } else if (activeTabKey === 'usecase') {
      const { actors, usecases } = parseUseCase(code);
      actors.forEach(act => {
        const pos = nodePositions[act.id];
        if (pos) {
          if (pos.x + 200 + 200 > maxX) maxX = pos.x + 200 + 200;
          if (pos.y + 150 + 200 > maxY) maxY = pos.y + 150 + 200;
        }
      });
      usecases.forEach(uc => {
        const pos = nodePositions[uc.id];
        if (pos) {
          if (pos.x + 250 + 200 > maxX) maxX = pos.x + 250 + 200;
          if (pos.y + 150 + 200 > maxY) maxY = pos.y + 150 + 200;
        }
      });
    } else if (activeTabKey === 'sequence') {
      const { participants, messages } = parseSequence(code);
      maxX = Math.max(1200, participants.length * 220 + 200);
      maxY = Math.max(800, messages.length * 52 + 180);
    } else if (activeTabKey === 'gantt') {
      maxX = 1200;
      maxY = 800;
    }

    return { width: maxX, height: maxY };
  };

  const canvasDim = getCanvasDimensions();

  // Canvas background drag panning triggers
  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('.se-node-card') || e.target.closest('button') || e.target.closest('.MuiSelect-select')) {
      return;
    }
    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasContainerRef.current ? canvasContainerRef.current.scrollLeft : 0,
      scrollTop: canvasContainerRef.current ? canvasContainerRef.current.scrollTop : 0
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePreviewCanvasMouseDown = (e) => {
    if (e.target.closest('.se-node-card') || e.target.closest('button') || e.target.closest('.MuiSelect-select')) {
      return;
    }
    e.preventDefault();
    isPanningPreviewRef.current = true;
    panStartPreviewRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: previewCanvasContainerRef.current ? previewCanvasContainerRef.current.scrollLeft : 0,
      scrollTop: previewCanvasContainerRef.current ? previewCanvasContainerRef.current.scrollTop : 0
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const getDiagramBounds = (tabKey, diagramCode) => {
    let minX = 0;
    let minY = 0;
    let maxX = 1200;
    let maxY = 800;
    let hasCoords = false;

    if (tabKey === 'er') {
      const { entities } = parseER(diagramCode);
      let xs = [];
      let ys = [];
      entities.forEach((ent, idx) => {
        const pos = nodePositions[ent.name] || { x: (idx % 3) * 320 + 80, y: Math.floor(idx / 3) * 260 + 80 };
        xs.push(pos.x);
        xs.push(pos.x + 250); // entity card width
        ys.push(pos.y);
        ys.push(pos.y + 180); // estimated height
      });
      if (xs.length > 0) {
        minX = Math.min(...xs);
        maxX = Math.max(...xs);
        minY = Math.min(...ys);
        maxY = Math.max(...ys);
        hasCoords = true;
      }
    } 
    else if (tabKey === 'usecase') {
      const { actors, usecases } = parseUseCase(diagramCode);
      let xs = [];
      let ys = [];
      
      actors.forEach((act, idx) => {
        const pos = nodePositions[act.id] || { x: 100, y: idx * 180 + 150 };
        xs.push(pos.x);
        xs.push(pos.x + 120);
        ys.push(pos.y);
        ys.push(pos.y + 120);
      });

      usecases.forEach((uc, idx) => {
        const pos = nodePositions[uc.id] || { x: 420, y: idx * 110 + 100 };
        xs.push(pos.x);
        xs.push(pos.x + 180);
        ys.push(pos.y);
        ys.push(pos.y + 80);
      });

      if (xs.length > 0) {
        minX = Math.min(...xs);
        maxX = Math.max(...xs);
        minY = Math.min(...ys);
        maxY = Math.max(...ys);
        hasCoords = true;
      }
    }
    else if (tabKey === 'sequence') {
      const { participants, messages } = parseSequence(diagramCode);
      if (participants.length > 0) {
        minX = 50;
        maxX = (participants.length - 1) * 260 + 250;
        minY = 30;
        maxY = messages.length * 52 + 180;
        hasCoords = true;
      }
    }
    else if (tabKey === 'gantt') {
      const { sections, tasks } = parseGantt(diagramCode);
      if (tasks.length > 0) {
        const dayWidth = 480 / 31;
        const rowHeight = 48;
        let xs = [20];
        let ys = [30];

        sections.forEach((section, secIdx) => {
          const sectionTasks = tasks.filter(t => t.section === section);
          const sectionYStart = secIdx * 450 + 60;
          
          sectionTasks.forEach((task, taskIdx) => {
            const y = sectionYStart + taskIdx * rowHeight;
            const width = Math.max(12, task.duration * dayWidth);
            
            let x = 240;
            if (task.startDateStr) {
              const tDate = new Date(task.startDateStr);
              if (!isNaN(tDate.getTime())) {
                const m = tDate.getMonth();
                const d = tDate.getDate();
                if (m === 6) {
                  x = 240 + (d - 1) * dayWidth;
                } else if (m === 7) {
                  x = 720 + (d - 1) * dayWidth;
                }
              }
            }

            xs.push(x + width + 80);
            ys.push(y + rowHeight + 20);
          });
        });

        minX = 10;
        maxX = Math.max(...xs);
        minY = 10;
        maxY = Math.max(...ys);
        hasCoords = true;
      }
    }

    if (hasCoords) {
      const padding = 30;
      return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(1200, (maxX - minX) + (padding * 2)),
        height: Math.min(800, (maxY - minY) + (padding * 2))
      };
    }

    return { x: 0, y: 0, width: 1200, height: 800 };
  };

  const handleDownloadPreviewPng = async () => {
    try {
      const element = document.getElementById('se-preview-capture-content');
      if (!element) return;
      
      // Temporarily reset scroll position of the preview canvas container to avoid html2canvas cutoff bugs
      const scrollLeft = previewCanvasContainerRef.current ? previewCanvasContainerRef.current.scrollLeft : 0;
      const scrollTop = previewCanvasContainerRef.current ? previewCanvasContainerRef.current.scrollTop : 0;
      if (previewCanvasContainerRef.current) {
        previewCanvasContainerRef.current.scrollLeft = 0;
        previewCanvasContainerRef.current.scrollTop = 0;
      }

      await new Promise(r => setTimeout(r, 60));

      const bounds = getDiagramBounds(activeTabKey, code);

      const fullCanvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById('se-preview-capture-content');
          const inner = clonedDoc.getElementById('se-preview-canvas-inner');
          if (wrapper && inner) {
            wrapper.style.width = '1400px';
            wrapper.style.height = '1100px';
            inner.style.transform = 'none';
          }
        }
      });
      
      // Restore scroll positions
      if (previewCanvasContainerRef.current) {
        previewCanvasContainerRef.current.scrollLeft = scrollLeft;
        previewCanvasContainerRef.current.scrollTop = scrollTop;
      }

      // Perform dynamic in-memory canvas cropping to avoid DOM offset bugs
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = bounds.width * 2;
      cropCanvas.height = bounds.height * 2;
      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          fullCanvas,
          bounds.x * 2,
          bounds.y * 2,
          bounds.width * 2,
          bounds.height * 2,
          0,
          0,
          bounds.width * 2,
          bounds.height * 2
        );
      }

      const link = document.createElement('a');
      link.download = `${activeTabKey}_diagram.png`;
      link.href = cropCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture PNG:', err);
    }
  };

  const handleDownloadPng = async () => {
    try {
      const element = document.getElementById('se-main-capture-content');
      if (!element) return;
      
      // Temporarily reset scroll position of the canvas container to avoid html2canvas cutoff bugs
      const scrollLeft = canvasContainerRef.current ? canvasContainerRef.current.scrollLeft : 0;
      const scrollTop = canvasContainerRef.current ? canvasContainerRef.current.scrollTop : 0;
      if (canvasContainerRef.current) {
        canvasContainerRef.current.scrollLeft = 0;
        canvasContainerRef.current.scrollTop = 0;
      }

      await new Promise(r => setTimeout(r, 60));

      const bounds = getDiagramBounds(activeTabKey, code);

      const fullCanvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById('se-main-capture-content');
          const inner = clonedDoc.getElementById('se-main-canvas-inner');
          if (wrapper && inner) {
            wrapper.style.width = '1400px';
            wrapper.style.height = '1100px';
            inner.style.transform = 'none';
          }
        }
      });
      
      // Restore scroll positions
      if (canvasContainerRef.current) {
        canvasContainerRef.current.scrollLeft = scrollLeft;
        canvasContainerRef.current.scrollTop = scrollTop;
      }

      // Perform dynamic in-memory canvas cropping to avoid DOM offset bugs
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = bounds.width * 2;
      cropCanvas.height = bounds.height * 2;
      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          fullCanvas,
          bounds.x * 2,
          bounds.y * 2,
          bounds.width * 2,
          bounds.height * 2,
          0,
          0,
          bounds.width * 2,
          bounds.height * 2
        );
      }

      const link = document.createElement('a');
      link.download = `${activeTabKey}_diagram.png`;
      link.href = cropCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture PNG:', err);
    }
  };

  // Custom Local Parsers
  function parseER(text) {
    const entities = [];
    const relationships = [];
    const lines = text.split('\n');
    let currentEntity = null;
    let inAttributes = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%%')) return;

      const entityMatch = trimmed.match(/^ENTITY\s+([A-Za-z0-9_-]+)/i);
      if (entityMatch) {
        currentEntity = { name: entityMatch[1], fields: [] };
        entities.push(currentEntity);
        inAttributes = false;
        return;
      }

      if (trimmed.toUpperCase() === 'ATTRIBUTES') {
        inAttributes = true;
        return;
      }

      const relMatch = trimmed.match(/^RELATIONSHIP\s+([A-Za-z0-9_-]+)\s+(ONE|MANY)\s+TO\s+([A-Za-z0-9_-]+)\s+(ONE|MANY)/i);
      if (relMatch) {
        inAttributes = false;
        currentEntity = null;
        relationships.push({
          source: relMatch[1],
          sourceCard: relMatch[2].toUpperCase(),
          target: relMatch[3],
          targetCard: relMatch[4].toUpperCase(),
          label: ''
        });
        return;
      }

      if (currentEntity && inAttributes) {
        const attrMatch = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*([A-Za-z0-9_-]+)(?:\s+(PRIMARY KEY|FOREIGN KEY))?/i);
        if (attrMatch) {
          currentEntity.fields.push({
            name: attrMatch[1],
            type: attrMatch[2],
            key: attrMatch[3] ? (attrMatch[3].toUpperCase() === 'PRIMARY KEY' ? 'PK' : 'FK') : ''
          });
        }
      }
    });

    return { entities, relationships };
  }

  function parseUseCase(text) {
    const actors = [];
    const usecases = [];
    const links = [];
    let systemName = 'System Boundary';
    const lines = text.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%%')) return;

      const systemMatch = trimmed.match(/^SYSTEM\s+(.+)$/i);
      if (systemMatch) {
        systemName = systemMatch[1];
        return;
      }

      const actorMatch = trimmed.match(/^ACTOR\s+([A-Za-z0-9_\-\s]+)$/i);
      if (actorMatch) {
        const id = actorMatch[1].trim().replace(/\s+/g, '_');
        actors.push({ id, label: actorMatch[1].trim() });
        return;
      }

      const ucMatch = trimmed.match(/^USE\s+CASE\s+([A-Za-z0-9_\-\s]+)$/i);
      if (ucMatch) {
        const id = ucMatch[1].trim().replace(/\s+/g, '_');
        usecases.push({ id, label: ucMatch[1].trim() });
        return;
      }

      const assocMatch = trimmed.match(/^([A-Za-z0-9_\-\s]+)\s*->\s*([A-Za-z0-9_\-\s]+)$/i);
      if (assocMatch) {
        const src = assocMatch[1].trim();
        const tgt = assocMatch[2].trim();
        const srcId = src.replace(/\s+/g, '_');
        const tgtId = tgt.replace(/\s+/g, '_');

        if (!actors.find(a => a.id === srcId) && !usecases.find(u => u.id === srcId)) {
          usecases.push({ id: srcId, label: src });
        }
        if (!actors.find(a => a.id === tgtId) && !usecases.find(u => u.id === tgtId)) {
          usecases.push({ id: tgtId, label: tgt });
        }

        links.push({ source: srcId, target: tgtId, label: '' });
        return;
      }

      const extendMatch = trimmed.match(/^([A-Za-z0-9_\-\s]+)\s+(EXTENDS|INCLUDES)\s+([A-Za-z0-9_\-\s]+)$/i);
      if (extendMatch) {
        const src = extendMatch[1].trim();
        const tgt = extendMatch[3].trim();
        const srcId = src.replace(/\s+/g, '_');
        const tgtId = tgt.replace(/\s+/g, '_');

        if (!actors.find(a => a.id === srcId) && !usecases.find(u => u.id === srcId)) {
          usecases.push({ id: srcId, label: src });
        }
        if (!actors.find(a => a.id === tgtId) && !usecases.find(u => u.id === tgtId)) {
          usecases.push({ id: tgtId, label: tgt });
        }

        links.push({ source: srcId, target: tgtId, label: extendMatch[2].toUpperCase() });
        return;
      }
    });

    return { systemName, actors, usecases, links };
  }

  function parseSequence(text) {
    const participants = [];
    const messages = [];
    let title = 'Sequence Diagram';
    const lines = text.split('\n');
    const callStack = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%%')) return;

      const titleMatch = trimmed.match(/^SEQUENCE\s+(.+)$/i);
      if (titleMatch) {
        title = titleMatch[1];
        return;
      }

      const partMatch = trimmed.match(/^PARTICIPANT\s+(.+)$/i);
      if (partMatch) {
        const name = partMatch[1].trim();
        const id = name.replace(/\s+/g, '_');
        participants.push({ id, label: name });
        return;
      }

      const ifMatch = trimmed.match(/^IF\s+(.+)\s+THEN/i);
      if (ifMatch) {
        messages.push({
          type: 'control',
          label: `IF: ${ifMatch[1].trim()}`
        });
        return;
      }

      if (trimmed.toUpperCase() === 'ELSE') {
        messages.push({
          type: 'control',
          label: 'ELSE'
        });
        return;
      }

      if (trimmed.toUpperCase() === 'END') {
        messages.push({
          type: 'control',
          label: 'END'
        });
        return;
      }

      // Sends/Requests
      const sendMatch = trimmed.match(/^([A-Za-z0-9_\-\s]+)\s+(sends|requests)\s+(.+?)\s+(?:to|from)\s+([A-Za-z0-9_\-\s]+)\.?$/i);
      if (sendMatch) {
        const src = sendMatch[1].trim();
        const srcId = src.replace(/\s+/g, '_');
        const action = sendMatch[2].toLowerCase();
        let label = sendMatch[3].trim();
        if (label.startsWith('"') && label.endsWith('"')) {
          label = label.substring(1, label.length - 1);
        }
        const dest = sendMatch[4].trim();
        const destId = dest.replace(/\s+/g, '_');

        if (!participants.find(p => p.id === srcId)) participants.push({ id: srcId, label: src });
        if (!participants.find(p => p.id === destId)) participants.push({ id: destId, label: dest });

        messages.push({
          type: action === 'requests' ? 'request' : 'message',
          source: srcId,
          target: destId,
          label: label
        });

        callStack.push({ caller: srcId, callee: destId });
        return;
      }

      // Returns
      const returnMatch = trimmed.match(/^([A-Za-z0-9_\-\s]+)\s+returns\s+(.+?)\.?$/i);
      if (returnMatch) {
        const src = returnMatch[1].trim();
        const srcId = src.replace(/\s+/g, '_');
        let rawLabel = returnMatch[2].trim();
        
        let label = rawLabel;
        let destId = '';

        const toMatch = rawLabel.match(/(.+?)\s+to\s+([A-Za-z0-9_\-\s]+)$/i);
        if (toMatch) {
          label = toMatch[1].trim();
          destId = toMatch[2].trim().replace(/\s+/g, '_');
        } else {
          const lastCallIdx = [...callStack].reverse().findIndex(c => c.callee === srcId);
          if (lastCallIdx !== -1) {
            const actualIdx = callStack.length - 1 - lastCallIdx;
            destId = callStack[actualIdx].caller;
            callStack.splice(actualIdx, 1);
          } else {
            destId = participants[0]?.id || srcId;
          }
        }

        if (label.startsWith('"') && label.endsWith('"')) {
          label = label.substring(1, label.length - 1);
        }

        if (!participants.find(p => p.id === srcId)) participants.push({ id: srcId, label: src });
        if (!participants.find(p => p.id === destId)) participants.push({ id: destId, label: destId.replace(/_/g, ' ') });

        messages.push({
          type: 'return',
          source: srcId,
          target: destId,
          label: label
        });
        return;
      }

      // Displays
      const displayMatch = trimmed.match(/^([A-Za-z0-9_\-\s]+)\s+displays\s+(.+?)\.?$/i);
      if (displayMatch) {
        const src = displayMatch[1].trim();
        const srcId = src.replace(/\s+/g, '_');
        let rawLabel = displayMatch[2].trim();

        let label = rawLabel;
        let destId = '';

        const toMatch = rawLabel.match(/(.+?)\s+to\s+([A-Za-z0-9_\-\s]+)$/i);
        if (toMatch) {
          label = toMatch[1].trim();
          destId = toMatch[2].trim().replace(/\s+/g, '_');
        } else {
          destId = participants[0]?.id || srcId;
        }

        if (label.startsWith('"') && label.endsWith('"')) {
          label = label.substring(1, label.length - 1);
        }

        if (!participants.find(p => p.id === srcId)) participants.push({ id: srcId, label: src });
        if (!participants.find(p => p.id === destId)) participants.push({ id: destId, label: destId.replace(/_/g, ' ') });

        messages.push({
          type: 'display',
          source: srcId,
          target: destId,
          label: label
        });
        return;
      }
    });

    return { title, participants, messages };
  }

  function parseGantt(text) {
    const sections = [];
    const tasks = [];
    let currentSection = 'SophiaPath';
    const lines = text.split('\n');

    const isCustomFormat = text.includes('TASK') || text.includes('PROJECT') || text.includes('START');

    if (isCustomFormat) {
      let currentTask = null;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const projMatch = trimmed.match(/^PROJECT\s+(.+)$/i);
        if (projMatch) {
          currentSection = projMatch[1].trim();
          if (!sections.includes(currentSection)) {
            sections.push(currentSection);
          }
          return;
        }

        const taskMatch = trimmed.match(/^TASK\s+(.+)$/i);
        if (taskMatch) {
          if (currentTask) {
            tasks.push(currentTask);
          }
          currentTask = {
            name: taskMatch[1].trim(),
            section: currentSection,
            status: '',
            startDateStr: '',
            endDateStr: '',
            duration: 5,
            dependencies: []
          };
          return;
        }

        const milestoneMatch = trimmed.match(/^MILESTONE\s+(.+)$/i);
        if (milestoneMatch) {
          if (currentTask) {
            tasks.push(currentTask);
          }
          currentTask = {
            name: milestoneMatch[1].trim(),
            section: currentSection,
            status: 'done',
            startDateStr: '',
            endDateStr: '',
            duration: 0,
            dependencies: []
          };
          return;
        }

        const startMatch = trimmed.match(/^START\s+(.+)$/i);
        if (startMatch && currentTask) {
          currentTask.startDateStr = startMatch[1].trim();
          return;
        }

        const endMatch = trimmed.match(/^END\s+(.+)$/i);
        if (endMatch && currentTask) {
          currentTask.endDateStr = endMatch[1].trim();
          return;
        }

        const dateMatch = trimmed.match(/^DATE\s+(.+)$/i);
        if (dateMatch && currentTask) {
          currentTask.startDateStr = dateMatch[1].trim();
          currentTask.endDateStr = dateMatch[1].trim();
          currentTask.duration = 0;
          return;
        }

        const depMatch = trimmed.match(/^DEPENDS ON\s+(.+)$/i);
        if (depMatch && currentTask) {
          currentTask.dependencies.push(depMatch[1].trim());
          currentTask.status = 'active';
          return;
        }
      });

      if (currentTask) {
        tasks.push(currentTask);
      }

      tasks.forEach(t => {
        if (t.startDateStr && t.endDateStr && t.duration !== 0) {
          const sDate = new Date(t.startDateStr);
          const eDate = new Date(t.endDateStr);
          if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
            t.duration = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }
      });

    } else {
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('gantt') || trimmed.startsWith('title') || trimmed.startsWith('dateFormat') || trimmed.startsWith('axisFormat')) return;

        const secMatch = trimmed.match(/^section\s+(.+)$/);
        if (secMatch) {
          currentSection = secMatch[1];
          sections.push(currentSection);
          return;
        }

        const taskMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
        if (taskMatch) {
          const name = taskMatch[1].trim();
          const parts = taskMatch[2].split(',').map(p => p.trim());
          let status = '';
          let start = '';
          let duration = 5;

          parts.forEach(part => {
            if (part === 'active' || part === 'done' || part === 'crit') {
              status = part;
            } else if (part.endsWith('d')) {
              duration = parseInt(part) || 5;
            } else {
              start = part;
            }
          });

          tasks.push({
            name,
            section: currentSection,
            status,
            duration
          });
        }
      });
    }

    if (sections.length === 0) sections.push(currentSection);
    return { sections, tasks };
  }

  // Bezier routing math helpers matching Java UML playground
  // Bezier routing math helpers matching Java UML playground
  const getBestConnectionPoints = (p1, p2, w1 = 250, h1 = 200, w2 = 250, h2 = 200, allRelations = [], currentRelation = null) => {
    const anchorsA = [
      { x: p1.x + w1 / 2, y: p1.y, side: 'top' },
      { x: p1.x + w1 / 2, y: p1.y + h1, side: 'bottom' },
      { x: p1.x, y: p1.y + h1 / 2, side: 'left' },
      { x: p1.x + w1, y: p1.y + h1 / 2, side: 'right' }
    ];

    const anchorsB = [
      { x: p2.x + w2 / 2, y: p2.y, side: 'top' },
      { x: p2.x + w2 / 2, y: p2.y + h2, side: 'bottom' },
      { x: p2.x, y: p2.y + h2 / 2, side: 'left' },
      { x: p2.x + w2, y: p2.y + h2 / 2, side: 'right' }
    ];

    let minDist = Infinity;
    let bestA = anchorsA[0];
    let bestB = anchorsB[0];

    for (const a of anchorsA) {
      for (const b of anchorsB) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          bestA = a;
          bestB = b;
        }
      }
    }

    const currentRelId = currentRelation ? `${currentRelation.source}_${currentRelation.target}` : '';

    // Distribute connections if multiple share same target side (B)
    if (allRelations && allRelations.length > 0 && currentRelation) {
      const bRelations = allRelations.filter(r => r.source === currentRelation.target || r.target === currentRelation.target);
      const sameSideConnections = [];

      bRelations.forEach(r => {
        const srcPos = nodePositions[r.source];
        const tgtPos = nodePositions[r.target];
        if (srcPos && tgtPos) {
          let rw1 = 250, rh1 = 160, rw2 = 250, rh2 = 160;
          if (activeTabKey === 'usecase') {
            const { actors } = parseUseCase(code);
            const isSrcActor = actors.some(a => a.id === r.source);
            const isTgtActor = actors.some(a => a.id === r.target);
            rw1 = isSrcActor ? 60 : 200; rh1 = isSrcActor ? 90 : 50;
            rw2 = isTgtActor ? 60 : 200; rh2 = isTgtActor ? 90 : 50;
          } else if (activeTabKey === 'er') {
            const { entities } = parseER(code);
            const getEH = (name) => {
              const ent = entities.find(e => e.name === name);
              return 38 + 12 + (ent?.fields?.length || 0) * 28 + 8;
            };
            rh1 = getEH(r.source);
            rh2 = getEH(r.target);
          }

          const rAnchorsA = [
            { x: srcPos.x + rw1 / 2, y: srcPos.y, side: 'top' },
            { x: srcPos.x + rw1 / 2, y: srcPos.y + rh1, side: 'bottom' },
            { x: srcPos.x, y: srcPos.y + rh1 / 2, side: 'left' },
            { x: srcPos.x + rw1, y: srcPos.y + rh1 / 2, side: 'right' }
          ];
          const rAnchorsB = [
            { x: tgtPos.x + rw2 / 2, y: tgtPos.y, side: 'top' },
            { x: tgtPos.x + rw2 / 2, y: tgtPos.y + rh2, side: 'bottom' },
            { x: tgtPos.x, y: tgtPos.y + rh2 / 2, side: 'left' },
            { x: tgtPos.x + rw2, y: tgtPos.y + rh2 / 2, side: 'right' }
          ];

          let rMinDist = Infinity;
          let rBestA = rAnchorsA[0];
          let rBestB = rAnchorsB[0];
          for (const ra of rAnchorsA) {
            for (const rb of rAnchorsB) {
              const rdx = ra.x - rb.x;
              const rdy = ra.y - rb.y;
              const rdist = rdx * rdx + rdy * rdy;
              if (rdist < rMinDist) {
                rMinDist = rdist;
                rBestA = ra;
                rBestB = rb;
              }
            }
          }

          const isTarget = r.target === currentRelation.target;
          const attachedSide = isTarget ? rBestB.side : rBestA.side;

          if (attachedSide === bestB.side) {
            const neighborTitle = isTarget ? r.source : r.target;
            const posNeighbor = nodePositions[neighborTitle] || { x: 0, y: 0 };
            sameSideConnections.push({
              relId: `${r.source}_${r.target}`,
              centerX: posNeighbor.x,
              centerY: posNeighbor.y
            });
          }
        }
      });

      if (bestB.side === 'top' || bestB.side === 'bottom') {
        sameSideConnections.sort((a, b) => a.centerX - b.centerX);
      } else {
        sameSideConnections.sort((a, b) => a.centerY - b.centerY);
      }

      const connIdx = sameSideConnections.findIndex(item => item.relId === currentRelId);
      const totalCount = sameSideConnections.length;

      if (totalCount > 1 && connIdx !== -1) {
        const factor = (connIdx + 0.5) / totalCount;
        if (bestB.side === 'top' || bestB.side === 'bottom') {
          bestB = {
            ...bestB,
            x: p2.x + w2 * factor
          };
        } else {
          bestB = {
            ...bestB,
            y: p2.y + h2 * factor
          };
        }
      }
    }

    // Distribute connections if multiple share same source side (A)
    if (allRelations && allRelations.length > 0 && currentRelation) {
      const aRelations = allRelations.filter(r => r.source === currentRelation.source || r.target === currentRelation.source);
      const sameSideConnectionsA = [];

      aRelations.forEach(r => {
        const srcPos = nodePositions[r.source];
        const tgtPos = nodePositions[r.target];
        if (srcPos && tgtPos) {
          let rw1 = 250, rh1 = 160, rw2 = 250, rh2 = 160;
          if (activeTabKey === 'usecase') {
            const { actors } = parseUseCase(code);
            const isSrcActor = actors.some(a => a.id === r.source);
            const isTgtActor = actors.some(a => a.id === r.target);
            rw1 = isSrcActor ? 60 : 200; rh1 = isSrcActor ? 90 : 50;
            rw2 = isTgtActor ? 60 : 200; rh2 = isTgtActor ? 90 : 50;
          } else if (activeTabKey === 'er') {
            const { entities } = parseER(code);
            const getEH = (name) => {
              const ent = entities.find(e => e.name === name);
              return 38 + 12 + (ent?.fields?.length || 0) * 28 + 8;
            };
            rh1 = getEH(r.source);
            rh2 = getEH(r.target);
          }

          const rAnchorsA = [
            { x: srcPos.x + rw1 / 2, y: srcPos.y, side: 'top' },
            { x: srcPos.x + rw1 / 2, y: srcPos.y + rh1, side: 'bottom' },
            { x: srcPos.x, y: srcPos.y + rh1 / 2, side: 'left' },
            { x: srcPos.x + rw1, y: srcPos.y + rh1 / 2, side: 'right' }
          ];
          const rAnchorsB = [
            { x: tgtPos.x + rw2 / 2, y: tgtPos.y, side: 'top' },
            { x: tgtPos.x + rw2 / 2, y: tgtPos.y + rh2, side: 'bottom' },
            { x: tgtPos.x, y: tgtPos.y + rh2 / 2, side: 'left' },
            { x: tgtPos.x + rw2, y: tgtPos.y + rh2 / 2, side: 'right' }
          ];

          let rMinDist = Infinity;
          let rBestA = rAnchorsA[0];
          let rBestB = rAnchorsB[0];
          for (const ra of rAnchorsA) {
            for (const rb of rAnchorsB) {
              const rdx = ra.x - rb.x;
              const rdy = ra.y - rb.y;
              const rdist = rdx * rdx + rdy * rdy;
              if (rdist < rMinDist) {
                rMinDist = rdist;
                rBestA = ra;
                rBestB = rb;
              }
            }
          }

          const isSource = r.source === currentRelation.source;
          const attachedSide = isSource ? rBestA.side : rBestB.side;

          if (attachedSide === bestA.side) {
            const neighborTitle = isSource ? r.target : r.source;
            const posNeighbor = nodePositions[neighborTitle] || { x: 0, y: 0 };
            sameSideConnectionsA.push({
              relId: `${r.source}_${r.target}`,
              centerX: posNeighbor.x,
              centerY: posNeighbor.y
            });
          }
        }
      });

      if (bestA.side === 'top' || bestA.side === 'bottom') {
        sameSideConnectionsA.sort((a, b) => a.centerX - b.centerX);
      } else {
        sameSideConnectionsA.sort((a, b) => a.centerY - b.centerY);
      }

      const connIdxA = sameSideConnectionsA.findIndex(item => item.relId === currentRelId);
      const totalCountA = sameSideConnectionsA.length;

      if (totalCountA > 1 && connIdxA !== -1) {
        const factor = (connIdxA + 0.5) / totalCountA;
        if (bestA.side === 'top' || bestA.side === 'bottom') {
          bestA = {
            ...bestA,
            x: p1.x + w1 * factor
          };
        } else {
          bestA = {
            ...bestA,
            y: p1.y + h1 * factor
          };
        }
      }
    }

    return { start: bestA, end: bestB };
  };

  const getBezierPath = (start, end) => {
    const dx = Math.abs(start.x - end.x);
    const dy = Math.abs(start.y - end.y);
    const offset = Math.min(100, Math.max(30, (dx + dy) * 0.2));

    let cp1 = { x: start.x, y: start.y };
    let cp2 = { x: end.x, y: end.y };

    if (start.side === 'right') cp1.x += offset;
    else if (start.side === 'left') cp1.x -= offset;
    else if (start.side === 'top') cp1.y -= offset;
    else if (start.side === 'bottom') cp1.y += offset;

    if (end.side === 'right') cp2.x += offset;
    else if (end.side === 'left') cp2.x -= offset;
    else if (end.side === 'top') cp2.y -= offset;
    else if (end.side === 'bottom') cp2.y += offset;

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  };

  // Render ER Diagram relationships
  const renderERDiagram = () => {
    const { entities, relationships } = parseER(code);

    const getEntityHeight = (name) => {
      const ent = entities.find(e => e.name === name);
      const fieldsCount = ent?.fields?.length || 0;
      return 38 + 12 + fieldsCount * 28 + 8;
    };

    return (
      <>
        {relationships.map((rel, idx) => {
          const start = nodePositions[rel.source];
          const end = nodePositions[rel.target];
          if (!start || !end) return null;

          const h1 = getEntityHeight(rel.source);
          const h2 = getEntityHeight(rel.target);
          const pts = getBestConnectionPoints(start, end, 250, h1, 250, h2, relationships, rel);
          const path = getBezierPath(pts.start, pts.end);

          const markerStart = rel.sourceCard === 'MANY' ? 'url(#crow-foot-many)' : 'url(#crow-foot-one)';
          const markerEnd = rel.targetCard === 'MANY' ? 'url(#crow-foot-many)' : 'url(#crow-foot-one)';

          return (
            <g key={idx}>
              <path
                d={path}
                stroke="var(--primary-main)"
                strokeWidth="2"
                fill="none"
                opacity="0.8"
                markerStart={markerStart}
                markerEnd={markerEnd}
              />
              <circle cx={(pts.start.x + pts.end.x) / 2} cy={(pts.start.y + pts.end.y) / 2} r="14" fill="#1e1e38" stroke="rgba(255,255,255,0.1)" />
              <text
                x={(pts.start.x + pts.end.x) / 2}
                y={(pts.start.y + pts.end.y) / 2 + 4}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                {rel.sourceCard === 'MANY' ? 'M' : '1'}:{rel.targetCard === 'MANY' ? 'N' : '1'}
              </text>
            </g>
          );
        })}
      </>
    );
  };

  // Render Use Case Diagram relationships
  const renderUseCaseDiagram = () => {
    const { systemName, actors, usecases, links } = parseUseCase(code);

    return (
      <>
        {/* System Boundary Box */}
        <rect
          x="260"
          y="30"
          width="360"
          height={Math.max(540, usecases.length * 110 + 40)}
          fill="rgba(255, 255, 255, 0.02)"
          stroke="rgba(61, 92, 255, 0.2)"
          strokeWidth="2"
          rx="16"
        />
        <text x="440" y="55" fill="rgba(255,255,255,0.4)" fontSize="13" fontWeight="bold" textAnchor="middle">
          {systemName.toUpperCase()}
        </text>

        {/* Draw Connection Links */}
        {links.map((link, idx) => {
          const start = nodePositions[link.source];
          const end = nodePositions[link.target];
          if (!start || !end) return null;

          const isExtendInclude = link.label === 'EXTENDS' || link.label === 'INCLUDES';
          
          const isSourceActor = actors.some(a => a.id === link.source);
          const isTargetActor = actors.some(a => a.id === link.target);

          const w1 = isSourceActor ? 60 : 200;
          const h1 = isSourceActor ? 90 : 50;
          const w2 = isTargetActor ? 60 : 200;
          const h2 = isTargetActor ? 90 : 50;

          const pts = getBestConnectionPoints(start, end, w1, h1, w2, h2, links, link);
          const x1 = pts.start.x;
          const y1 = pts.start.y;
          const x2 = pts.end.x;
          const y2 = pts.end.y;

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isExtendInclude ? '#00FFCC' : 'var(--primary-main)'}
                strokeWidth="1.5"
                strokeDasharray={isExtendInclude ? '5,5' : '0'}
                markerEnd={isExtendInclude ? 'url(#usecase-arrow)' : 'none'}
              />
              {link.label && (
                <g>
                  <rect
                    x={(x1 + x2) / 2 - 38}
                    y={(y1 + y2) / 2 - 14}
                    width="76"
                    height="18"
                    rx="4"
                    fill="var(--background-default)"
                    stroke="var(--divider)"
                    strokeWidth="1"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 1}
                    fill="#00FFCC"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {`<<${link.label.toLowerCase()}>>`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </>
    );
  };

  // Render Sequence Diagram
  const renderSequenceDiagram = () => {
    const { title, participants, messages } = parseSequence(code);
    const lifelines = {};
    
    participants.forEach((part, idx) => {
      lifelines[part.id] = idx * 260 + 160;
    });

    // Calculate canvas size bounds dynamically
    const diagWidth = Math.max(1200, participants.length * 260 + 200);
    const diagHeight = Math.max(800, messages.length * 52 + 180);

    return (
      <svg width={diagWidth} height={diagHeight} style={{ background: 'transparent' }}>
        {/* Title */}
        <text x="30" y="30" fill="var(--primary-main)" fontSize="16" fontWeight="bold">
          🎬 {title}
        </text>

        {/* Draw Vertical Lifelines */}
        {participants.map((part, idx) => {
          const x = lifelines[part.id];
          return (
            <g key={idx}>
              <line x1={x} y1="80" x2={x} y2={diagHeight - 60} stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6,6" />
              {/* Participant Box Top */}
              <rect x={x - 90} y="50" width="180" height="46" rx="8" fill="var(--background-paper)" stroke="var(--primary-main)" strokeWidth="2" />
              <text x={x} y="77" fill="var(--text-primary)" fontSize="15" fontWeight="bold" textAnchor="middle">{part.label}</text>
              {/* Participant Box Bottom */}
              <rect x={x - 90} y={diagHeight - 50} width="180" height="46" rx="8" fill="var(--background-paper)" stroke="var(--primary-main)" strokeWidth="2" />
              <text x={x} y={diagHeight - 23} fill="var(--text-primary)" fontSize="15" fontWeight="bold" textAnchor="middle">{part.label}</text>
            </g>
          );
        })}

        {/* Draw Messages and Control Blocks */}
        {messages.map((msg, idx) => {
          const y = idx * 52 + 120;

          if (msg.type === 'control') {
            const startX = 50;
            const endX = participants.length * 260 + 50;
            return (
              <g key={idx}>
                <line
                  x1={startX}
                  y1={y}
                  x2={endX}
                  y2={y}
                  stroke="rgba(0,255,204,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <rect
                  x={startX + 20}
                  y={y - 12}
                  width="270"
                  height="24"
                  rx="6"
                  fill="var(--background-default)"
                  stroke="rgba(0,255,204,0.5)"
                  strokeWidth="1"
                />
                <text
                  x={startX + 32}
                  y={y + 5}
                  fill="#00FFCC"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {msg.label}
                </text>
              </g>
            );
          }

          const x1 = lifelines[msg.source];
          const x2 = lifelines[msg.target];
          if (!x1 || !x2) return null;

          const isResponseOrDisplay = msg.type === 'return' || msg.type === 'display';

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={isResponseOrDisplay ? '#00FFCC' : 'var(--text-primary)'}
                strokeWidth="1.5"
                strokeDasharray={isResponseOrDisplay ? '4,4' : '0'}
              />
              {x2 > x1 ? (
                <polygon points={`${x2},${y} ${x2-8},${y-4} ${x2-8},${y+4}`} fill={isResponseOrDisplay ? '#00FFCC' : 'var(--text-primary)'} />
              ) : (
                <polygon points={`${x2},${y} ${x2+8},${y-4} ${x2+8},${y+4}`} fill={isResponseOrDisplay ? '#00FFCC' : 'var(--text-primary)'} />
              )}
              <text
                x={(x1 + x2) / 2}
                y={y - 8}
                fill={isResponseOrDisplay ? '#00FFCC' : 'var(--text-primary)'}
                fontSize="14"
                fontWeight="600"
                textAnchor="middle"
              >
                {msg.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Render Gantt Chart
  const renderGanttChart = () => {
    const { sections, tasks } = parseGantt(code);
    const rowHeight = 48;

    const dayWidth = 480 / 31;
    const monthDividerX = 720;

    const getWeekLabel = (monthZeroIndexed, weekIdx) => {
      const dayOfStart = weekIdx * 7 + 1;
      return `${monthZeroIndexed + 1}/${dayOfStart}`;
    };

    // Precalculate positions
    sections.forEach((section, secIdx) => {
      const sectionTasks = tasks.filter(t => t.section === section);
      const sectionYStart = secIdx * 450 + 60; // Shifted up after removing header banner
      
      sectionTasks.forEach((task, taskIdx) => {
        task.y = sectionYStart + taskIdx * rowHeight;
        task.width = Math.max(12, task.duration * dayWidth);
        
        let x = 240;
        if (task.startDateStr) {
          const tDate = new Date(task.startDateStr);
          if (!isNaN(tDate.getTime())) {
            const m = tDate.getMonth(); // 6 = July, 7 = August
            const d = tDate.getDate();
            if (m === 6) {
              x = 240 + (d - 1) * dayWidth;
            } else if (m === 7) {
              x = 720 + (d - 1) * dayWidth;
            }
          }
        }
        task.x = x;
      });
    });

    return (
      <svg width="1200" height="800" style={{ background: 'transparent' }}>
        {/* Month Labels at the top */}
        <text x="480" y="15" fill="var(--text-primary)" fontSize="13" fontWeight="bold" textAnchor="middle">
          July 2026
        </text>
        <text x="960" y="15" fill="var(--text-primary)" fontSize="13" fontWeight="bold" textAnchor="middle">
          August 2026
        </text>

        {/* Weekly Date Headers */}
        {/* July Weeks */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const x = 240 + idx * 120 + 60;
          return (
            <text key={`july_w_${idx}`} x={x} y="35" textAnchor="middle" fontSize="11" fontWeight="bold">
              <tspan fill="var(--text-primary)">W{idx+1}</tspan>
              <tspan fill="var(--primary-main)" dx="4">({getWeekLabel(6, idx)})</tspan>
            </text>
          );
        })}
        {/* August Weeks */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const x = 720 + idx * 120 + 60;
          return (
            <text key={`aug_w_${idx}`} x={x} y="35" textAnchor="middle" fontSize="11" fontWeight="bold">
              <tspan fill="var(--text-primary)">W{idx+5}</tspan>
              <tspan fill="var(--primary-main)" dx="4">({getWeekLabel(7, idx)})</tspan>
            </text>
          );
        })}

        {/* Horizontal Divider separating calendar headers from diagram area */}
        <line x1="15" y1="45" x2="1185" y2="45" stroke="var(--divider)" strokeOpacity="0.8" strokeWidth="1.5" />

        {/* Vertical divider lines for start and end of months */}
        {/* Start of July */}
        <line x1="240" y1="45" x2="240" y2="760" stroke="var(--divider)" strokeOpacity="0.6" strokeWidth="1.5" />
        {/* Transition of July/August */}
        <line x1="720" y1="45" x2="720" y2="760" stroke="var(--divider)" strokeOpacity="0.6" strokeWidth="1.5" />
        {/* End of August */}
        <line x1="1200" y1="45" x2="1200" y2="760" stroke="var(--divider)" strokeOpacity="0.6" strokeWidth="1.5" />

        {/* Vertical dotted week division guidelines */}
        {/* July Week Lines */}
        <line x1="360" y1="45" x2="360" y2="760" stroke="var(--divider)" strokeOpacity="0.35" strokeDasharray="2,4" />
        <line x1="480" y1="45" x2="480" y2="760" stroke="var(--divider)" strokeOpacity="0.35" strokeDasharray="2,4" />
        <line x1="600" y1="45" x2="600" y2="760" stroke="var(--divider)" strokeOpacity="0.35" strokeDasharray="2,4" />
        {/* August Week Lines */}
        <line x1="840" y1="45" x2="840" y2="760" stroke="var(--divider)" strokeOpacity="0.35" strokeDasharray="2,4" />
        <line x1="960" y1="45" x2="960" y2="760" stroke="var(--divider)" strokeOpacity="0.35" strokeDasharray="2,4" />
        <line x1="1080" y1="45" x2="1080" y2="760" stroke="var(--divider)" strokeOpacity="0.35" strokeDasharray="2,4" />

        {/* Horizontal guide dotted lines under each task row separator */}
        {tasks.map((task, idx) => (
          <line
            key={`guide_${idx}`}
            x1="15"
            y1={task.y + 36}
            x2="1185"
            y2={task.y + 36}
            stroke="var(--text-secondary)"
            strokeOpacity="0.55"
            strokeDasharray="3,3"
            strokeWidth="1.2"
          />
        ))}
        {/* Bottom Horizontal Divider to close the grid frame horizontally */}
        <line x1="15" y1="760" x2="1185" y2="760" stroke="var(--divider)" strokeOpacity="0.6" strokeWidth="1.5" />        {/* 4. Orthogonal Stepped Dependency Connectors (routed to never cross task bars) */}
        {tasks.map((task, idx) => {
          if (!task.dependencies || task.dependencies.length === 0) return null;
          return task.dependencies.map((depName, depIdx) => {
            const depTask = tasks.find(pt => pt.name === depName);
            if (!depTask || depTask.x === undefined || depTask.y === undefined) return null;

            const xStart = depTask.x + depTask.width;
            const yStart = depTask.y + 10;
            const xEnd = task.x;
            const yEnd = task.y + 10;

            // Route connection lines in the empty horizontal gap between rows to avoid cutting task bars
            const yGap = depTask.y + 26; // bottom gap of the 20px bar in 48px rowHeight
            const xBranch = xEnd - 10;   // vertical drop runs 10px to the left of destination start

            const arrowTipX = xEnd;
            const arrowBaseX = xEnd - 8;

            return (
              <g key={`${idx}_${depIdx}`}>
                {/* Stepped Orthogonal Line (exit bar -> go to gap -> horizontal to branch -> vertical down -> enter destination) */}
                <path
                  d={`M ${xStart} ${yStart} H ${xStart + 6} V ${yGap} H ${xBranch} V ${yEnd} H ${arrowBaseX}`}
                  fill="none"
                  stroke="var(--primary-main)"
                  strokeWidth="2.2"
                />
                {/* Manual Arrowhead pointing right */}
                <polygon
                  points={`${arrowTipX},${yEnd} ${arrowBaseX},${yEnd-4.5} ${arrowBaseX},${yEnd+4.5}`}
                  fill="var(--primary-main)"
                />
              </g>
            );
          });
        })}

        {/* 5. Render Sections and Tasks */}
        {sections.map((section, secIdx) => {
          const sectionTasks = tasks.filter(t => t.section === section);

          return (
            <g key={secIdx}>
              {sectionTasks.map((task, taskIdx) => {
                const y = task.y;
                const width = task.width;
                const x = task.x;

                // Alternate between solid blue and orange bars matching the reference image
                let barColor = taskIdx % 2 === 0 ? '#0D6EFD' : '#FFA726';
                let strokeColor = taskIdx % 2 === 0 ? '#0B5ED7' : '#FB8C00';
                
                if (task.duration === 0) {
                  // Milestone
                  barColor = 'rgba(239,83,80,0.2)';
                  strokeColor = '#EF5350';
                } else if (task.status === 'done') {
                  barColor = 'rgba(255,255,255,0.04)';
                  strokeColor = 'rgba(255,255,255,0.3)';
                }

                return (
                  <g key={taskIdx}>
                    {/* Task Name Label (Left sidebar area) */}
                    <text x="25" y={y + 14} fill="var(--text-primary)" fontSize="11" fontWeight="600">
                      {task.name}
                    </text>
                    
                    {/* Gantt Bar */}
                    {task.duration === 0 ? (
                      // Milestone Diamond shape
                      <polygon
                        points={`${x},${y+10} ${x+10},${y} ${x+20},${y+10} ${x+10},${y+20}`}
                        fill={barColor}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                      />
                    ) : (
                      // Task rectangular bar
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height="20"
                        rx="6"
                        fill={barColor}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Duration Text */}
                    <text x={x + (task.duration === 0 ? 32 : width + 22)} y={y + 13} fill="var(--text-secondary)" fontSize="10" fontWeight="bold">
                      {task.duration === 0 ? 'Milestone' : `${task.duration}d`}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderContent = () => {
    return (
      <Box id="se-split-container" style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, width: '100%', alignItems: 'stretch', position: 'relative', minHeight: 0 }}>
        
        {/* Left Pane: Code Editor */}
        <Box style={{
          width: isFullscreen ? '0%' : `${splitPercent}%`,
          opacity: isFullscreen ? 0 : 1,
          pointerEvents: isFullscreen ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Paper
            elevation={0}
            style={{
              padding: '16px 24px',
              borderRadius: 0,
              borderBottomLeftRadius: '24px',
              background: activeTabKey === 'gantt' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SOURCE CODE ({activeTabTitle})
            </Typography>
            <Box style={{ 
              flexGrow: 1, 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: activeTabKey === 'gantt' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)', 
              background: activeTabKey === 'gantt' ? 'transparent' : '#1e1e1e', 
              height: 'calc(100% - 30px)',
              position: 'relative'
            }}>
              {activeTabKey === 'gantt' && (
                <style>{`
                  .monaco-editor, 
                  .monaco-editor .margin, 
                  .monaco-editor-background, 
                  .monaco-editor .inputarea.ime-input {
                    background-color: transparent !important;
                  }
                `}</style>
              )}
              <Editor
                height="100%"
                language="markdown"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  lineHeight: 19,
                  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
                }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Dynamic Split Divider Bar */}
        <Box
          onMouseDown={(e) => {
            e.preventDefault();
            isDraggingSplitRef.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
          style={{
            width: isFullscreen ? '0px' : '8px',
            cursor: isFullscreen ? 'default' : 'col-resize',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            marginLeft: isFullscreen ? '0px' : '-4px',
            marginRight: isFullscreen ? '0px' : '-4px'
          }}
          sx={{
            '&:hover, &:active': {
              backgroundColor: 'var(--primary-main)'
            },
            '&::after': {
              content: '""',
              width: isFullscreen ? '0px' : '2px',
              height: '40px',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              borderRadius: '1px'
            }
          }}
        />

        {/* Right Pane: Visualizer Canvas */}
        <Box style={{
          width: isFullscreen ? '100%' : `${100 - splitPercent}%`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Paper
            elevation={0}
            style={{
              padding: '16px 24px',
              borderRadius: 0,
              borderBottomRightRadius: '24px',
              background: activeTabKey === 'gantt' ? 'rgba(10, 10, 20, 0.05)' : 'rgba(10, 10, 20, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                VISUAL DIAGRAM PREVIEW
              </Typography>
              
              <Box style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.05)', zIndex: 5, alignItems: 'center' }}>
                <Select
                  value={activeTheme}
                  onChange={(e) => setActiveTheme(e.target.value)}
                  variant="standard"
                  disableUnderline
                  sx={{
                    fontSize: '0.75rem',
                    color: '#fff',
                    marginRight: '8px',
                    marginLeft: '8px',
                    '& .MuiSelect-select': { padding: '4px 0px' }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        background: 'rgba(30, 30, 56, 0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="sepia">Sepia</MenuItem>
                  <MenuItem value="lava">Lava</MenuItem>
                  <MenuItem value="ocean">Ocean</MenuItem>
                  <MenuItem value="forest">Forest</MenuItem>
                  <MenuItem value="amber">Amber</MenuItem>
                  <MenuItem value="dracula">Dracula</MenuItem>
                  <MenuItem value="amethyst">Amethyst</MenuItem>
                  <MenuItem value="nordic">Nordic</MenuItem>
                  <MenuItem value="mint">Mint</MenuItem>
                  <MenuItem value="lavender">Lavender</MenuItem>
                  <MenuItem value="peach">Peach</MenuItem>
                  <MenuItem value="rose">Rose</MenuItem>
                  <MenuItem value="clay">Clay</MenuItem>
                  <MenuItem value="kitty">Kitty</MenuItem>
                  <MenuItem value="midnight">Midnight</MenuItem>
                </Select>
                <Tooltip title="Fullscreen Visual Preview">
                  <IconButton size="small" onClick={() => setIsPreviewOpen(true)} style={{ color: 'var(--primary-main)' }}>
                    <PreviewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom In">
                  <IconButton size="small" onClick={() => setZoomScale(prev => Math.min(2.0, prev + 0.1))} style={{ color: '#fff' }}>
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <IconButton size="small" onClick={() => setZoomScale(prev => Math.max(0.2, prev - 0.1))} style={{ color: '#fff' }}>
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset View">
                  <IconButton size="small" onClick={() => { setZoomScale(1.0); if (canvasContainerRef.current) { canvasContainerRef.current.scrollLeft = 0; canvasContainerRef.current.scrollTop = 0; } }} style={{ color: '#fff' }}>
                    <ResetIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}>
                  <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)} style={{ color: '#fff' }}>
                    {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Scrollable Container Box */}
            <Box 
              ref={canvasContainerRef}
              id="canvas-interactive-area"
              onMouseDown={handleCanvasMouseDown}
              data-theme={activeTheme}
              style={{ 
                flexGrow: 1, 
                background: (activeTabKey === 'sequence' || activeTabKey === 'gantt')
                  ? 'var(--background-default)' 
                  : 'var(--background-default) linear-gradient(var(--divider) 1px, transparent 1px), linear-gradient(90deg, var(--divider) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                borderRadius: '12px', 
                border: '1.5px solid var(--divider)', 
                position: 'relative', 
                overflow: 'auto',
                height: 'calc(100% - 30px)',
                cursor: isPanningRef.current ? 'grabbing' : 'grab',
                userSelect: 'none',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.15)'
              }}
            >
              {/* Virtual Scroll Boundaries Wrapper */}
              <Box 
                id="se-main-capture-content"
                style={{
                  width: `${(canvasDim.width + 200) * zoomScale}px`,
                  height: `${(canvasDim.height + 300) * zoomScale}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  pointerEvents: 'none'
                }}
              >
                {/* Virtual Canvas scaled as a single unit */}
                <Box 
                  id="se-main-canvas-inner"
                  style={{
                    width: `${canvasDim.width}px`,
                    height: `${canvasDim.height}px`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    backgroundImage: activeTabKey === 'sequence' 
                      ? 'none' 
                      : 'linear-gradient(var(--divider) 1px, transparent 1px), linear-gradient(90deg, var(--divider) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    backgroundColor: 'var(--background-default)',
                    pointerEvents: 'auto'
                  }}
                >
                  <div
                    id="mermaid-preview-target"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative'
                    }}
                  >
                    {/* SVG Connector Lines Overlay */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}>
                      <defs>
                        {/* ER Crow-foot connection marker ends */}
                        <marker id="crow-foot-many" viewBox="0 0 20 20" refX="20" refY="10" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                          <path d="M 0 4 L 20 10 L 0 16 M 10 0 L 10 20" fill="none" stroke="var(--primary-main)" strokeWidth="2" />
                        </marker>
                        <marker id="crow-foot-one" viewBox="0 0 20 20" refX="20" refY="10" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                          <line x1="8" y1="2" x2="8" y2="18" stroke="var(--primary-main)" strokeWidth="2" />
                          <line x1="14" y1="2" x2="14" y2="18" stroke="var(--primary-main)" strokeWidth="2" />
                        </marker>
                        <marker id="usecase-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 10 5 L 0 9" fill="none" stroke="var(--primary-main)" strokeWidth="1.5" />
                        </marker>
                      </defs>

                      {activeTabKey === 'er' && renderERDiagram()}
                      {activeTabKey === 'usecase' && renderUseCaseDiagram()}
                    </svg>

                    {/* Sequence and Gantt have internal SVG wrapper structures */}
                    {activeTabKey === 'sequence' && renderSequenceDiagram()}
                    {activeTabKey === 'gantt' && renderGanttChart()}

                    {/* DRAGGABLE NODE CARDS OVERLAY (HTML sibings for ER and Use Case) */}
                    {activeTabKey === 'er' && parseER(code).entities.map((entity, idx) => {
                      const coord = nodePositions[entity.name] || { x: (idx % 3) * 320 + 80, y: Math.floor(idx / 3) * 260 + 80 };
                      return (
                        <div
                          key={idx}
                          className="se-node-card er-entity-card"
                          style={{
                            position: 'absolute',
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            width: '250px',
                            background: 'var(--background-paper)',
                            border: '2px solid var(--primary-main)',
                            borderRadius: '12px',
                            color: 'var(--text-primary)',
                            fontFamily: 'Outfit, sans-serif',
                            boxShadow: draggingNode === entity.name ? '0 12px 30px rgba(0,0,0,0.35)' : '0 4px 15px rgba(0,0,0,0.15)',
                            zIndex: draggingNode === entity.name ? 10 : 3
                          }}
                        >
                          <div
                            onMouseDown={(e) => {
                              if (e.target.closest('button')) return;
                              setDraggingNode(entity.name);
                              dragStartOffset.current = {
                                x: e.clientX / zoomScale - coord.x,
                                y: e.clientY / zoomScale - coord.y
                              };
                            }}
                            style={{
                              background: 'linear-gradient(90deg, var(--primary-main), var(--primary-light))',
                              padding: '8px 12px',
                              fontWeight: '800',
                              fontSize: '0.95rem',
                              letterSpacing: '0.5px',
                              color: '#fff',
                              borderBottom: '1px solid var(--divider)',
                              cursor: draggingNode === entity.name ? 'grabbing' : 'grab',
                              borderTopLeftRadius: '10px',
                              borderTopRightRadius: '10px',
                              userSelect: 'none'
                            }}
                          >
                            🔑 {entity.name}
                          </div>
                          <div style={{ padding: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                            {entity.fields.map((f, fIdx) => (
                              <div key={fIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid var(--divider)' }}>
                                <span>
                                  <span style={{ color: 'var(--primary-main)', marginRight: '6px' }}>{f.type}</span>
                                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                                </span>
                                {f.key && <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.75rem' }}>{f.key}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {activeTabKey === 'usecase' && parseUseCase(code).actors.map((actor, idx) => {
                      const coord = nodePositions[actor.id] || { x: 100, y: idx * 180 + 150 };
                      return (
                        <div
                          key={idx}
                          className="se-node-card usecase-actor-card"
                          onMouseDown={(e) => {
                            if (e.target.closest('button')) return;
                            setDraggingNode(actor.id);
                            dragStartOffset.current = {
                              x: e.clientX / zoomScale - coord.x,
                              y: e.clientY / zoomScale - coord.y
                            };
                          }}
                          style={{
                            position: 'absolute',
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            cursor: draggingNode === actor.id ? 'grabbing' : 'grab',
                            zIndex: draggingNode === actor.id ? 10 : 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            userSelect: 'none'
                          }}
                        >
                          <svg width="60" height="90" viewBox="-30 -40 60 90" style={{ overflow: 'visible' }}>
                            <circle cx="0" cy="-30" r="12" fill="var(--background-paper)" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="0" y1="-18" x2="0" y2="15" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="-20" y1="-8" x2="20" y2="-8" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="0" y1="15" x2="-15" y2="40" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="0" y1="15" x2="15" y2="40" stroke="var(--primary-main)" strokeWidth="3" />
                          </svg>
                          <Typography variant="caption" style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {actor.label}
                          </Typography>
                        </div>
                      );
                    })}

                    {activeTabKey === 'usecase' && parseUseCase(code).usecases.map((uc, idx) => {
                      const coord = nodePositions[uc.id] || { x: 420, y: idx * 110 + 100 };
                      return (
                        <div
                          key={idx}
                          className="se-node-card usecase-bubble-card"
                          onMouseDown={(e) => {
                            if (e.target.closest('button')) return;
                            setDraggingNode(uc.id);
                            dragStartOffset.current = {
                              x: e.clientX / zoomScale - coord.x,
                              y: e.clientY / zoomScale - coord.y
                            };
                          }}
                          style={{
                            position: 'absolute',
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            width: '200px',
                            height: '50px',
                            borderRadius: '25px',
                            border: '2px solid var(--primary-main)',
                            background: 'var(--background-paper)',
                            color: 'var(--text-primary)',
                            boxShadow: draggingNode === uc.id ? '0 12px 30px rgba(0,0,0,0.35)' : '0 4px 15px rgba(0,0,0,0.15)',
                            zIndex: draggingNode === uc.id ? 10 : 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: draggingNode === uc.id ? 'grabbing' : 'grab',
                            padding: '0 10px',
                            textAlign: 'center',
                            userSelect: 'none'
                          }}
                        >
                          <Typography variant="body2" style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {uc.label}
                          </Typography>
                        </div>
                      );
                    })}
                  </div>
                </Box>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  style={{ 
                    position: 'absolute', 
                    bottom: '16px', 
                    left: '16px', 
                    right: '16px', 
                    borderRadius: '12px',
                    background: 'rgba(211, 47, 47, 0.9)',
                    color: '#fff',
                    backdropFilter: 'blur(5px)',
                    zIndex: 20
                  }}
                >
                  {error}
                </Alert>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  if (onClose) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
        PaperProps={{
          elevation: 0,
          style: {
            borderRadius: '24px',
            background: 'var(--background-paper)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--divider)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            height: '92vh',
            maxHeight: '92vh',
            width: '95vw',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '12px' }}>
          <Box>
            <Typography variant="h6" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: 'var(--primary-main)' }}>
              Software Engineering Lab
            </Typography>
            <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
              Model database structures, user interfaces interactions, operational logic, and timelines.
            </Typography>
          </Box>
          
          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Diagram Type:
            </Typography>
            <FormControl size="small" style={{ minWidth: '200px' }}>
              <Select
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  height: '34px',
                  fontSize: '0.85rem',
                  fieldset: { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'var(--primary-main) !important' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--primary-main) !important' },
                  '& .MuiSelect-select': { padding: '6px 12px' }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      background: 'rgba(30, 30, 56, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff'
                    }
                  }
                }}
              >
                {tabsMeta.map((tab, idx) => (
                  <MenuItem key={tab.key} value={idx} style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {tab.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CopyIcon />}
              onClick={handleCopyCode}
              style={{
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '8px',
                textTransform: 'none',
                height: '34px',
                fontSize: '0.8rem'
              }}
            >
              {isCopied ? 'Copied!' : 'Copy Code'}
            </Button>
             <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPng}
              disabled={!!error}
              style={{
                borderRadius: '8px',
                textTransform: 'none',
                height: '34px',
                fontSize: '0.8rem'
              }}
            >
              Download PNG
            </Button>
            <IconButton onClick={onClose} style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent style={{ padding: '0px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {renderContent()}
        </DialogContent>

        {/* Fullscreen Visual Preview Dialog matching UML playground */}
        <Dialog
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          fullScreen
          PaperProps={{
            elevation: 0,
            'data-theme': activeTheme,
            style: {
              background: 'var(--background-default)',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--divider)', flexWrap: 'wrap', gap: '12px' }}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PreviewIcon style={{ color: 'var(--primary-main)' }} />
              <Typography variant="h6" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: 'var(--text-primary)' }}>
                Visual Diagram Preview
              </Typography>
            </Box>
            <Box style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>
                Choose Theme:
              </Typography>
              <Select
                value={activeTheme}
                onChange={(e) => setActiveTheme(e.target.value)}
                variant="outlined"
                size="small"
                style={{
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  background: 'var(--background-paper)',
                  minWidth: '160px',
                  height: '40px',
                  border: '1px solid var(--divider)'
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      background: 'rgba(30, 30, 56, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff'
                    }
                  }
                }}
              >
                <MenuItem value="light">Default Light</MenuItem>
                <MenuItem value="dark">Default Dark</MenuItem>
                <MenuItem value="sepia">Warm Sepia</MenuItem>
                <MenuItem value="lava">Volcanic Lava</MenuItem>
                <MenuItem value="ocean">Deep Ocean</MenuItem>
                <MenuItem value="forest">Emerald Forest</MenuItem>
                <MenuItem value="amber">Solarized Amber</MenuItem>
                <MenuItem value="dracula">Dracula Vampire</MenuItem>
                <MenuItem value="amethyst">Royal Amethyst</MenuItem>
                <MenuItem value="nordic">Nordic Ice</MenuItem>
                <MenuItem value="mint">Frosted Mint</MenuItem>
                <MenuItem value="lavender">Soft Lavender</MenuItem>
                <MenuItem value="peach">Peach Cream</MenuItem>
                <MenuItem value="rose">Rose Gold</MenuItem>
                <MenuItem value="clay">Clay Slate</MenuItem>
                <MenuItem value="kitty">Hello Kitty</MenuItem>
                <MenuItem value="midnight">Midnight Shimmer</MenuItem>
              </Select>

              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPreviewPng} style={{ borderRadius: '12px', fontWeight: 800, height: '40px', textTransform: 'none' }}>
                Download PNG
              </Button>
              <Button variant="contained" color="primary" onClick={() => setIsPreviewOpen(false)} style={{ borderRadius: '12px', fontWeight: 800, height: '40px', textTransform: 'none' }}>
                Close Preview
              </Button>
            </Box>
          </DialogTitle>

          <DialogContent style={{ padding: 0, overflow: 'hidden', position: 'relative', height: '100%', width: '100%' }}>
            {/* Scrollable Preview Canvas Container */}
            <Box
              ref={previewCanvasContainerRef}
              id="uml-preview-canvas-container"
              onMouseDown={handlePreviewCanvasMouseDown}
              style={{
                background: 'var(--background-default)',
                height: '100%',
                width: '100%',
                position: 'relative',
                overflow: 'auto',
                cursor: isPanningPreviewRef.current ? 'grabbing' : 'grab'
              }}
            >
              {/* Virtual Scroll Boundaries Wrapper for capturing PNG */}
              <Box 
                id="se-preview-capture-content"
                style={{
                  width: `${(canvasDim.width + 200) * previewZoomScale}px`,
                  height: `${(canvasDim.height + 300) * previewZoomScale}px`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Virtual Canvas scaled as a single unit */}
                <Box
                  id="se-preview-canvas-inner"
                  style={{
                    width: `${canvasDim.width}px`,
                    height: `${canvasDim.height}px`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `scale(${previewZoomScale})`,
                    transformOrigin: 'top left',
                    backgroundImage: (activeTabKey === 'sequence' || activeTabKey === 'gantt') 
                      ? 'none' 
                      : 'linear-gradient(var(--divider) 1px, transparent 1px), linear-gradient(90deg, var(--divider) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    backgroundColor: 'var(--background-default)'
                  }}
                >
                  <div
                    id="mermaid-preview-target"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative'
                    }}
                  >
                    {/* SVG Connector Lines Overlay */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}>
                      <defs>
                        {/* ER Crow-foot connection marker ends */}
                        <marker id="crow-foot-many" viewBox="0 0 20 20" refX="20" refY="10" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                          <path d="M 0 4 L 20 10 L 0 16 M 10 0 L 10 20" fill="none" stroke="var(--primary-main)" strokeWidth="2" />
                        </marker>
                        <marker id="crow-foot-one" viewBox="0 0 20 20" refX="20" refY="10" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                          <line x1="8" y1="2" x2="8" y2="18" stroke="var(--primary-main)" strokeWidth="2" />
                          <line x1="14" y1="2" x2="14" y2="18" stroke="var(--primary-main)" strokeWidth="2" />
                        </marker>
                        <marker id="usecase-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 10 5 L 0 9" fill="none" stroke="var(--primary-main)" strokeWidth="1.5" />
                        </marker>
                      </defs>

                      {activeTabKey === 'er' && renderERDiagram()}
                      {activeTabKey === 'usecase' && renderUseCaseDiagram()}
                    </svg>

                    {/* Sequence and Gantt have internal SVG wrapper structures */}
                    {activeTabKey === 'sequence' && renderSequenceDiagram()}
                    {activeTabKey === 'gantt' && renderGanttChart()}

                    {/* DRAGGABLE NODE CARDS OVERLAY (HTML sibings for ER and Use Case) */}
                    {activeTabKey === 'er' && parseER(code).entities.map((entity, idx) => {
                      const coord = nodePositions[entity.name] || { x: (idx % 3) * 320 + 80, y: Math.floor(idx / 3) * 260 + 80 };
                      return (
                        <div
                          key={idx}
                          className="se-node-card er-entity-card"
                          style={{
                            position: 'absolute',
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            width: '250px',
                            background: 'var(--background-paper)',
                            border: '2px solid var(--primary-main)',
                            borderRadius: '12px',
                            color: 'var(--text-primary)',
                            fontFamily: 'Outfit, sans-serif',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                          }}
                        >
                          <div
                            style={{
                              background: 'linear-gradient(90deg, var(--primary-main), var(--primary-light))',
                              padding: '8px 12px',
                              fontWeight: '800',
                              fontSize: '0.95rem',
                              letterSpacing: '0.5px',
                              color: '#fff',
                              borderBottom: '1px solid var(--divider)',
                              borderTopLeftRadius: '10px',
                              borderTopRightRadius: '10px',
                              userSelect: 'none'
                            }}
                          >
                            🔑 {entity.name}
                          </div>
                          <div style={{ padding: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                            {entity.fields.map((f, fIdx) => (
                              <div key={fIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid var(--divider)' }}>
                                <span>
                                  <span style={{ color: 'var(--primary-main)', marginRight: '6px' }}>{f.type}</span>
                                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                                </span>
                                {f.key && <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.75rem' }}>{f.key}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {activeTabKey === 'usecase' && parseUseCase(code).actors.map((actor, idx) => {
                      const coord = nodePositions[actor.id] || { x: 100, y: idx * 180 + 150 };
                      return (
                        <div
                          key={idx}
                          className="se-node-card usecase-actor-card"
                          style={{
                            position: 'absolute',
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            userSelect: 'none'
                          }}
                        >
                          <svg width="60" height="90" viewBox="-30 -40 60 90" style={{ overflow: 'visible' }}>
                            <circle cx="0" cy="-30" r="12" fill="var(--background-paper)" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="0" y1="-18" x2="0" y2="15" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="-20" y1="-8" x2="20" y2="-8" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="0" y1="15" x2="-15" y2="40" stroke="var(--primary-main)" strokeWidth="3" />
                            <line x1="0" y1="15" x2="15" y2="40" stroke="var(--primary-main)" strokeWidth="3" />
                          </svg>
                          <Typography variant="caption" style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {actor.label}
                          </Typography>
                        </div>
                      );
                    })}

                    {activeTabKey === 'usecase' && parseUseCase(code).usecases.map((uc, idx) => {
                      const coord = nodePositions[uc.id] || { x: 420, y: idx * 110 + 100 };
                      return (
                        <div
                          key={idx}
                          className="se-node-card usecase-bubble-card"
                          style={{
                            position: 'absolute',
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            width: '200px',
                            height: '50px',
                            borderRadius: '25px',
                            border: '2px solid var(--primary-main)',
                            background: 'var(--background-paper)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 10px',
                            textAlign: 'center',
                            userSelect: 'none'
                          }}
                        >
                          <Typography variant="body2" style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {uc.label}
                          </Typography>
                        </div>
                      );
                    })}
                  </div>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Dialog>
    );
  }

  return (
    <Box style={{ width: '100%', height: '100vh', background: '#111122', boxSizing: 'border-box' }}>
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', alignItems: 'stretch' }}>
        <Paper square style={{ padding: '16px', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" style={{ fontWeight: 900, color: 'var(--primary-main)' }}>
            Software Engineering Lab (Standalone View)
          </Typography>
        </Paper>
        <Box style={{ flexGrow: 1, position: 'relative' }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};
