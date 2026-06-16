import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  LinearProgress,
  IconButton,
  Modal,
  Fade,
  Backdrop,
  TextField,
  Chip,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Check as CheckIcon,
  Terminal as TerminalIcon,
  HelpOutline as HelpOutlineIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coursesData } from '../data/courses';
import './QuizPage.css';

// Premium adaptive C++ code syntax highlighting (matching mobile app colors)
const highlightCppCode = (code, isDarkMode) => {
  if (!code) return '';
  
  const pattern = /(\/\/.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#(?:include|define|pragma|ifdef|endif)\b|\b(?:using|namespace|int|return|void|double|float|char|string|bool|if|else|for|while|class|struct|public|private|true|false|const|auto|long|short|switch|case|break|continue|new|delete|std|cout|cin|endl|main)\b|[{}()[\];,<>+\-*/=])/g;

  const keywords = new Set([
    'using', 'namespace', 'int', 'return', 'void', 'double', 'float', 'char', 'string',
    'bool', 'if', 'else', 'for', 'while', 'class', 'struct', 'public', 'private',
    'true', 'false', 'const', 'auto', 'long', 'short', 'switch', 'case', 'break',
    'continue', 'new', 'delete'
  ]);

  const libraryWords = new Set(['cout', 'cin', 'std', 'endl', 'main']);

  const parts = code.split(pattern);

  return parts.map((part, idx) => {
    if (part === undefined || part === null) return null;
    
    let color = isDarkMode ? '#D4D4D4' : '#333333';
    let fontWeight = '400';

    if (part.startsWith('//') || part.startsWith('/*')) {
      color = isDarkMode ? '#6A9955' : '#008000';
    } else if (part.startsWith('"') || part.startsWith("'")) {
      color = isDarkMode ? '#CE9178' : '#A31515';
    } else if (part.startsWith('#') || keywords.has(part)) {
      color = isDarkMode ? '#569CD6' : '#0000FF';
      fontWeight = '600';
    } else if (libraryWords.has(part)) {
      color = isDarkMode ? '#DCDCAA' : '#795E26';
    } else if (/^\d+(?:\.\d+)?$/.test(part)) {
      color = isDarkMode ? '#B5CEA8' : '#098658';
    }

    return (
      <span key={idx} style={{ color, fontWeight }}>
        {part}
      </span>
    );
  });
};

// Highly-efficient Client-Side C++ Compilation and Execution Simulator
const translateCppToJs = (cppCode, inputStr) => {
  // 1. Clean comments
  let code = cppCode
    .replace(/\/\/.*$/gm, "") 
    .replace(/\/\*[\s\S]*?\*\//g, ""); 

  // 2. Find int main()
  const mainBodyMatch = /int\s+main\s*\(\s*\)\s*\{([\s\S]*)\}/.exec(code);
  if (!mainBodyMatch) {
    throw new Error("Missing int main() structure.");
  }
  let body = mainBodyMatch[1].trim();

  // 3. Remove standard return statement
  body = body.replace(/\breturn\s+0\s*;/g, "");

  // 4. Set up helper variables and context in the generated JS
  let js = `
    const stdout = [];
    const inputTokens = ${JSON.stringify(inputStr.trim().split(/\s+/).filter(t => t.length > 0))};
    let inputPtr = 0;
    
    const nextInputToken = () => {
      if (inputPtr >= inputTokens.length) return "";
      return inputTokens[inputPtr++];
    };

    const readInput = () => {
      const token = nextInputToken();
      if (!token) return "";
      if (/^-?\\d+(\\.\\d+)?$/.test(token)) {
        return parseFloat(token);
      }
      return token;
    };
  `;

  // 5. Clean namespace prefixes
  body = body.replace(/std::cout/g, "cout").replace(/std::cin/g, "cin").replace(/std::endl/g, "endl");

  // 6. Translate C++ variable declarations
  const types = ['int', 'double', 'float', 'string', 'bool', 'char', 'auto'];
  types.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'g');
    body = body.replace(regex, 'let');
  });

  // 7. Translate cin >> var1 >> var2;
  const cinRegex = /cin\s*(>>\s*[a-zA-Z_][a-zA-Z0-9_]*\s*)+;/g;
  body = body.replace(cinRegex, (match) => {
    const vars = match.split('>>').slice(1).map(v => v.replace(/;$/, '').trim());
    return vars.map(v => `${v} = readInput();`).join(' ');
  });

  // 8. Translate cout << var1 << "string" << endl;
  const coutRegex = /cout\s*(<<\s*[^;]+)+;/g;
  body = body.replace(coutRegex, (match) => {
    const parts = match.split('<<').slice(1).map(p => p.replace(/;$/, '').trim());
    const pushes = parts.map(part => {
      if (part === 'endl' || part === '"\\n"' || part === "'\\n'") {
        return `stdout.push("\\n");`;
      }
      return `stdout.push(${part});`;
    });
    return pushes.join(' ');
  });

  // Append translated body
  js += "\n" + body;
  js += `\nreturn stdout.join("");`;

  return js;
};

const translateJavaToJs = (javaCode, inputStr) => {
  let code = javaCode
    .replace(/\/\/.*$/gm, "") 
    .replace(/\/\*[\s\S]*?\*\//g, ""); 

  code = code.replace(/import\s+[\w.]+;/g, "");
  code = code.replace(/\bextends\s+Exception\b/g, "extends Error");
  
  code = code.replace(/\b(public\s+|abstract\s+)*class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+[\w\s,]+)?/g, (match, modifiers, className, parentClass) => {
    let res = `class ${className}`;
    if (parentClass) {
      res += ` extends ${parentClass}`;
    }
    return res;
  });

  code = code.replace(/\bimplements\s+[\w\s,]+/g, "");

  const classRegex = /class\s+(\w+)/g;
  let match;
  const classNames = [];
  while ((match = classRegex.exec(code)) !== null) {
    classNames.push(match[1]);
  }

  classNames.forEach(className => {
    const constrRegex = new RegExp(`\\b(?:public|private|protected|internal)?\\s*${className}\\s*\\(([^)]*)\\)\\s*(?:throws\\s+[\\w\\s,]+)?\\s*\\{`, 'g');
    code = code.replace(constrRegex, 'constructor($1) {');
  });

  code = code.replace(/\b(public|private|protected|final|abstract|synchronized|transient|volatile)\b/g, "");

  const types = ['int', 'double', 'float', 'boolean', 'char', 'String', 'auto', 'Shape', 'Circle', 'Rectangle', 'Employee', 'Contractor', 'Appliance', 'WashingMachine', 'Refrigerator', 'Product', 'Payable', 'BankAccount', 'Scanner'];
  types.forEach(type => {
    const varDeclRegex = new RegExp(`\\b${type}(?:\\[\\])?\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\b`, 'g');
    code = code.replace(varDeclRegex, 'let $1');
  });

  types.concat(['void']).forEach(type => {
    const methodRegex = new RegExp(`\\b${type}(?:\\[\\])?\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(([^)]*)\\)\\s*(?:throws\\s+[\\w\\s,]+)?\\s*\\{`, 'g');
    code = code.replace(methodRegex, '$1($2) {');
  });

  code = code.replace(/\(([^)]*)\)/g, (match, paramStr) => {
    if (!paramStr.trim()) return "()";
    if (paramStr.includes('args') && (paramStr.includes('String') || paramStr.includes('[]'))) {
      return "(args)";
    }
    const params = paramStr.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      return parts[parts.length - 1];
    });
    return `(${params.join(', ')})`;
  });

  code = code.replace(/System\.out\.println\s*\(([^;]*)\)\s*;/g, 'stdout.push($1); stdout.push("\\n");');
  code = code.replace(/System\.out\.print\s*\(([^;]*)\)\s*;/g, 'stdout.push($1);');
  code = code.replace(/System\.out\.printf\s*\(([^;]*)\)\s*;/g, 'stdout.push(sprintf($1));');

  code = code.replace(/\be\.getMessage\(\)/g, "e.message");
  code = code.replace(/new\s+Scanner\s*\([^)]*\)/g, "null");
  code = code.replace(/\b[a-zA-Z0-9_]+\.(?:nextInt|nextDouble|next|nextLine)\(\)/g, "readInput()");

  const mainRegex = /main\s*\(([^)]*)\)\s*\{([\s\S]*)\}/;
  const mainMatch = mainRegex.exec(code);
  let mainBody = "";
  if (mainMatch) {
    mainBody = mainMatch[2].trim();
    code = code.replace(mainRegex, "");
  }

  let js = `
    const stdout = [];
    const inputTokens = ${JSON.stringify(inputStr.trim().split(/\s+/).filter(t => t.length > 0))};
    let inputPtr = 0;
    
    const nextInputToken = () => {
      if (inputPtr >= inputTokens.length) return "";
      return inputTokens[inputPtr++];
    };

    const readInput = () => {
      const token = nextInputToken();
      if (!token) return "";
      if (/^-?\\d+(\\.\\d+)?$/.test(token)) {
        return parseFloat(token);
      }
      return token;
    };

    const sprintf = (format, ...args) => {
      let str = format;
      args.forEach(arg => {
        if (str.includes("%.2f")) {
          str = str.replace("%.2f", Number(arg).toFixed(2));
        } else if (str.includes("%.1f")) {
          str = str.replace("%.1f", Number(arg).toFixed(1));
        } else if (str.includes("%s")) {
          str = str.replace("%s", String(arg));
        } else if (str.includes("%d")) {
          str = str.replace("%d", Math.round(Number(arg)));
        } else {
          str = str.replace(/%[a-zA-Z]/, String(arg));
        }
      });
      return str;
    };
  `;

  js += "\n" + code;
  js += `\n// Execute main\n(function() {\n${mainBody}\n})();`;
  js += `\nreturn stdout.join("");`;
  return js;
};

const simulateCodeExecution = (code, inputStr = "", language = "cpp") => {
  try {
    const isJava = language.toLowerCase() === 'java' || code.includes('class ') || code.includes('System.out');
    const jsCode = isJava ? translateJavaToJs(code, inputStr) : translateCppToJs(code, inputStr);
    const result = new Function(jsCode)();
    return {
      output: String(result),
      isError: false
    };
  } catch (err) {
    return {
      output: `Compilation / Execution Error: ${err.message}`,
      isError: true
    };
  }
};

const simulateCppExecution = (code, inputStr = "") => {
  const isJava = code.includes('class ') || code.includes('System.out') || code.includes('public static void main');
  const lang = isJava ? 'java' : 'cpp';
  return simulateCodeExecution(code, inputStr, lang);
};

const groupIntoVisualLines = (flatLines) => {
  if (!flatLines) return [];
  const rows = [];
  let index = 0;

  while (index < flatLines.length) {
    const current = flatLines[index];

    if (
      current.type === 'code' &&
      index + 1 < flatLines.length &&
      flatLines[index + 1].type === 'input'
    ) {
      const row = [current];
      index++;
      
      while (index < flatLines.length && flatLines[index].type === 'input') {
        row.push(flatLines[index]);
        index++;
      }
      
      if (index < flatLines.length) {
        const possibleContinuation = flatLines[index];
        if (
          possibleContinuation.type === 'code' &&
          possibleContinuation.content.startsWith(' ') &&
          possibleContinuation.content.trim().length > 0
        ) {
          row.push(possibleContinuation);
          index++;
        }
      }
      
      rows.push(row);
      continue;
    }

    rows.push([current]);
    index++;
  }

  return rows;
};

const getCompletedCode = (question, values = null) => {
  const visualLines = groupIntoVisualLines(question.codeTemplateLines);
  let inputIdx = 0;
  
  return visualLines.map(lineGroup => {
    return lineGroup.map(part => {
      if (part.type === 'input') {
        if (values === null) {
          return part.expectedAnswer || '';
        }
        const val = values[inputIdx] !== undefined ? values[inputIdx] : '';
        inputIdx++;
        return val;
      }
      return part.content || '';
    }).join('');
  }).join('\n');
};

const parseInlineCode = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return text;
  
  const parts = text.split(/(<code>[\s\S]*?<\/code>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<code>') && part.endsWith('</code>')) {
      const codeContent = part.substring(6, part.length - 7);
      return (
        <code key={index} className="slide-inline-code">
          {codeContent}
        </code>
      );
    }
    return part;
  });
};

const getIndentation = (visualLines, lineIdx) => {
  // Scan backwards to find the first line that starts with a code segment containing leading spaces
  for (let i = lineIdx - 1; i >= 0; i--) {
    const prevLine = visualLines[i];
    if (prevLine && prevLine.length > 0 && prevLine[0].type === 'code') {
      const content = prevLine[0].content || '';
      const match = content.match(/^(\s+)/);
      if (match) {
        return match[1];
      }
    }
  }
  
  // Scan forwards if no previous line had indentation
  for (let i = lineIdx + 1; i < visualLines.length; i++) {
    const nextLine = visualLines[i];
    if (nextLine && nextLine.length > 0 && nextLine[0].type === 'code') {
      const content = nextLine[0].content || '';
      const match = content.match(/^(\s+)/);
      if (match) {
        return match[1];
      }
    }
  }
  
  return '';
};

const QuizPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateQuizScore } = useAuth();

  const [course, setCourse] = useState(location.state?.course || null);
  const [courseLoading, setCourseLoading] = useState(!course);
  
  // Quiz and Question States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Coding interactive exercise specific states
  const [blankValues, setBlankValues] = useState({});
  const [focusedBlankIndex, setFocusedBlankIndex] = useState(0);
  const [blankStatuses, setBlankStatuses] = useState({});

  // C++ Code challenge specific states
  const [userCode, setUserCode] = useState('');
  const [consoleLogs, setConsoleLogs] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [codeRunCompleted, setCodeRunCompleted] = useState(false);
  const [allCasesPassed, setAllCasesPassed] = useState(false);

  // Dynamic database course loading
  useEffect(() => {
    if (course) return;

    const loadCourse = async () => {
      try {
        const res = await fetch('/courses/export/all');
        if (res.ok) {
          const list = await res.json();
          const matched = list.find(c =>
            c.sections?.some(s => s.lessons?.some(l => String(l.id) === String(lessonId)))
          );
          if (matched) {
            setCourse(matched);
            setCourseLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load course for quiz from database:', err);
      }
      
      const fallback = coursesData.find(c =>
        c.sections?.some(s => s.lessons?.some(l => String(l.id) === String(lessonId)))
      );
      setCourse(fallback);
      setCourseLoading(false);
    };

    loadCourse();
  }, [lessonId, course]);

  // Exact JavaScript implementation of the mobile app's MCQ/Exercise extractor
  const extractQuestions = (lessonData) => {
    if (!lessonData || !Array.isArray(lessonData.pages)) return [];
    const questions = [];

    const parseQuestionFromMap = (map, fallbackTitle = '') => {
      const type = (map.type || 'mcq').toLowerCase();
      
      if (type === 'fill_code' || type === 'fill_code_options' || type === 'write_line') {
        const codeTemplate = map.codeTemplate || {};
        const rawLines = codeTemplate.lines || [];
        const templateLines = rawLines.map(line => ({
          type: (line.type || 'code').toLowerCase(),
          content: line.content || '',
          width: line.width || 6,
          expectedAnswer: line.expectedAnswer || '',
          sameLine: !!line.sameLine
        }));

        if (templateLines.length === 0) return null;

        return {
          type,
          id: map.id || Math.random().toString(36).substring(2, 9),
          instruction: map.instruction || fallbackTitle || 'Complete the C++ program:',
          fileName: map.fileName || 'main.cpp',
          codeLanguage: codeTemplate.language || 'cpp',
          codeTemplateLines: templateLines,
          wordBank: map.wordBank || []
        };
      }

      if (type === 'code_challenge') {
        return {
          type,
          id: map.id || Math.random().toString(36).substring(2, 9),
          instruction: map.problem || 'Write a program to solve this challenge:',
          problem: map.problem || '',
          starterCode: map.starterCode || {},
          example: map.example || {},
          testCases: map.testCases || [],
          hiddenTestCases: map.hiddenTestCases || [],
          outputFormat: map.outputFormat || '',
          inputFormat: map.inputFormat || '',
          constraints: map.constraints || ''
        };
      }

      // Standard MCQ & Find Error Snip
      const codeSnippet = map.codeSnippet || {};
      const snippetLines = codeSnippet.lines || [];
      const questionText = map.question || map.instruction || fallbackTitle || 'Choose the correct answer:';
      
      const rawAnswers = map.options || map.answers || [];
      const answers = rawAnswers.map((ans, idx) => {
        const text = typeof ans === 'object' ? (ans.answer || ans.text || '') : String(ans);
        return {
          id: idx,
          text,
          isCorrect: false
        };
      });

      if (questionText.trim() === '' || answers.length === 0) return null;

      const correctAnswerIndex = map.correctAnswerIndex !== undefined
        ? Number(map.correctAnswerIndex)
        : (map.correctAnswer !== undefined ? Number(map.correctAnswer) : 0);

      answers.forEach((ans, idx) => {
        ans.isCorrect = (idx === correctAnswerIndex);
      });

      return {
        type,
        id: map.id || Math.random().toString(36).substring(2, 9),
        prompt: questionText,
        answers,
        correctAnswerIndex,
        codeSnippetLines: snippetLines,
        codeLanguage: codeSnippet.language || 'cpp',
        instruction: map.instruction || questionText
      };
    };

    lessonData.pages.forEach((page) => {
      const pageTitle = page.pageTitle || page.title || '';
      
      if (Array.isArray(page.blocks) && page.blocks.length > 0) {
        page.blocks.forEach((block) => {
          const question = parseQuestionFromMap(block, pageTitle);
          if (question) questions.push(question);
        });
      } else {
        const question = parseQuestionFromMap(page, pageTitle);
        if (question) questions.push(question);
      }
    });

    return questions;
  };

  // Load and shuffle questions
  useEffect(() => {
    if (!course) return;
    
    const lessons = course.sections.flatMap(s => s.lessons || []);
    const localLesson = lessons.find((l) => String(l.id) === String(lessonId));
    const section = course.sections.find(s => s.lessons?.some(l => String(l.id) === String(lessonId)));

    if (!section || !localLesson) return;

    const loadQuizQuestions = async () => {
      try {
        let dbId = course.id;
        if (isNaN(Number(dbId))) {
          const res = await fetch('/courses');
          if (res.ok) {
            const list = await res.json();
            const matched = list.find(c => c.title.toLowerCase() === course.title.toLowerCase());
            if (matched) dbId = matched.id;
          }
        }

        const lessonRes = await fetch(`/courses/${dbId}/sections/${section.id}/lessons/${lessonId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (lessonRes.ok) {
          const dbLesson = await lessonRes.json();
          const extracted = extractQuestions(dbLesson);
          if (extracted.length > 0) {
            setQuizQuestions(extracted);
            return;
          }
        }
        throw new Error('Fallback to local');
      } catch (err) {
        console.warn('Loading quiz questions from local mock fallback:', err);
        const extracted = extractQuestions({
          pages: localLesson.questions ? localLesson.questions.map(q => ({
            type: 'mcq',
            question: q.prompt,
            answers: q.answers.map(a => ({ answer: a.text })),
            correctAnswer: q.answers.findIndex(a => a.isCorrect)
          })) : []
        });
        setQuizQuestions(extracted);
      }
    };

    loadQuizQuestions();
  }, [course, lessonId]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0;

  // Initialize interactive variables when a new question loads
  useEffect(() => {
    if (!currentQuestion) return;

    // Reset blank inputs
    setBlankValues({});
    setFocusedBlankIndex(0);
    setBlankStatuses({});

    // Reset C++ Code challenge
    if (currentQuestion.type === 'code_challenge') {
      const codeLines = currentQuestion.starterCode?.lines || [
        '#include <iostream>',
        'using namespace std;',
        '',
        'int main() {',
        '    // Write your C++ code here',
        '    ',
        '    return 0;',
        '}'
      ];
      setUserCode(codeLines.join('\n'));
      setConsoleLogs('Click "Compile & Run" to execute test cases.');
      setCodeRunCompleted(false);
      setAllCasesPassed(false);
    }
  }, [currentQuestion, currentQuestionIndex]);

  // Clickable word bank chip event handler
  const handleWordBankClick = (word) => {
    if (isAnswered) return;
    
    // Fill the currently focused blank
    setBlankValues(prev => ({
      ...prev,
      [focusedBlankIndex]: word
    }));

    // Focus next empty input slot
    const blankCount = currentQuestion.codeTemplateLines?.filter(l => l.type === 'input').length || 0;
    let nextEmpty = -1;
    for (let i = 0; i < blankCount; i++) {
      if (i === focusedBlankIndex) continue;
      if (!blankValues[i] || blankValues[i].trim() === "") {
        nextEmpty = i;
        break;
      }
    }
    if (nextEmpty !== -1) {
      setFocusedBlankIndex(nextEmpty);
    }
  };

  const handleAnswerSelect = (answerId) => {
    if (isAnswered) return;
    setSelectedAnswerId(answerId);
    setIsAnswered(true);

    const answer = currentQuestion.answers.find(a => a.id === answerId);
    if (answer?.isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  // Checks fill-in-the-blank C++ code answers
  const handleCheckCodeAnswers = () => {
    if (isAnswered) return;

    const inputLines = currentQuestion.codeTemplateLines.filter(l => l.type === 'input');
    const statuses = {};
    let allCorrect = true;

    // 1. Reconstruct user and reference codes
    const userCode = getCompletedCode(currentQuestion, blankValues);
    const refCode = getCompletedCode(currentQuestion, null);

    // 2. Identify test cases
    const testCases = currentQuestion.testCases && currentQuestion.testCases.length > 0 
      ? currentQuestion.testCases 
      : [{ input: '', expectedOutput: '' }];

    let executionCheckPassed = false;
    let hasOutput = false;

    try {
      let allTestsPassed = true;
      let runAnyTest = false;

      testCases.forEach((tc) => {
        const userRes = simulateCppExecution(userCode, tc.input);
        
        let expectedOut = tc.expectedOutput;
        if (!expectedOut && tc.input === '') {
          // If no expected output is defined, compile and simulate the reference code to get the expected output
          const refRes = simulateCppExecution(refCode, tc.input);
          expectedOut = refRes.output;
        }

        if (userRes.isError) {
          allTestsPassed = false;
        } else {
          const userOutClean = userRes.output.trim().replace(/\r/g, "");
          const expectedOutClean = expectedOut.trim().replace(/\r/g, "");
          
          if (userOutClean || expectedOutClean) {
            hasOutput = true;
          }

          if (userOutClean !== expectedOutClean) {
            allTestsPassed = false;
          }
        }
        runAnyTest = true;
      });

      // If tests ran, they all passed, and there was actually output, then execution check is successful!
      if (runAnyTest && allTestsPassed && hasOutput) {
        executionCheckPassed = true;
      }
    } catch (e) {
      console.warn("Execution verification failed:", e);
    }

    if (executionCheckPassed) {
      // Mark all fields correct since the code ran and produced the exact expected output!
      inputLines.forEach((_, idx) => {
        statuses[idx] = true;
      });
      allCorrect = true;
    } else {
      // Fallback: Smart syntax-based matching for each blank
      const normalizeSyntax = (str) => {
        return str
          .replace(/\s+/g, '') // remove all whitespace
          .replace(/;+$/, ''); // remove trailing semicolons
      };

      inputLines.forEach((line, idx) => {
        const userVal = (blankValues[idx] || '').trim();
        const expectedVal = line.expectedAnswer.trim();
        
        const isCorrect = normalizeSyntax(userVal) === normalizeSyntax(expectedVal);
        statuses[idx] = isCorrect;
        if (!isCorrect) {
          allCorrect = false;
        }
      });
    }

    setBlankStatuses(statuses);
    setIsAnswered(true);

    if (allCorrect) {
      setScore(prev => prev + 1);
    }
  };

  // Compiles and runs C++ code challenge on the client-side C++ runner
  const handleRunCodeChallenge = () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setConsoleLogs('Compiling main.cpp...\nLinking variables...\nRunning test cases...');

    setTimeout(() => {
      const testCases = currentQuestion.testCases || [];
      const logs = [];
      let allPassed = true;

      testCases.forEach((tc, index) => {
        logs.push(`\n[Test Case ${index + 1}] Input: "${tc.input}"`);
        const runRes = simulateCppExecution(userCode, tc.input);

        if (runRes.isError) {
          logs.push(`Result: FAILED\n${runRes.output}`);
          allPassed = false;
        } else {
          const expected = tc.expectedOutput.trim().replace(/\r/g, "");
          const actual = runRes.output.trim().replace(/\r/g, "");
          logs.push(`Expected stdout:\n${expected}`);
          logs.push(`Actual stdout:\n${actual}`);

          if (expected === actual) {
            logs.push(`Result: PASSED ✅`);
          } else {
            logs.push(`Result: FAILED ❌ (Outputs do not match)`);
            allPassed = false;
          }
        }
      });

      setConsoleLogs(logs.join('\n'));
      setAllCasesPassed(allPassed);
      setCodeRunCompleted(true);
      setIsCompiling(false);
    }, 700);
  };

  const handleSubmitCodeChallenge = () => {
    if (!codeRunCompleted) return;
    setIsAnswered(true);
    if (allCasesPassed) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    const percentage = Math.round((score / quizQuestions.length) * 100);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerId(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      
      // Find all duplicate quiz lessons inside this course that share the same title
      let allLessons = [];
      try {
        if (course?.sections) {
          allLessons = course.sections.flatMap(s => s.lessons || []);
        } else {
          const fallback = coursesData.find(c =>
            c.sections?.some(s => s.lessons?.some(l => String(l.id) === String(lessonId)))
          );
          allLessons = fallback?.sections?.flatMap(s => s.lessons || []) || [];
        }
      } catch (_) {}

      const currentLesson = allLessons.find(l => String(l.id) === String(lessonId));
      const duplicates = currentLesson 
        ? allLessons.filter(l => (l.title || '').trim().toLowerCase() === (currentLesson.title || '').trim().toLowerCase())
        : [{ id: lessonId }];
      
      const idsToUpdate = duplicates.map(d => d.id);
      
      const token = localStorage.getItem('token');
      if (token) {
        Promise.all(idsToUpdate.map(async (lid) => {
          await fetch(`/courses/me/lessons/${lid}/grade`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ grade: percentage })
          });

          if (percentage >= 70) {
            await fetch(`/courses/me/lessons/${lid}/done`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          }
        })).catch(err => console.error('Failed to report dynamic duplicate scores to backend:', err));
      }
      
      idsToUpdate.forEach(lid => {
        updateQuizScore(lid, percentage);
      });
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (courseLoading || !currentQuestion) {
    return (
      <Box className="quiz-page-loader" style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="loading-spinner" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-main)', animation: 'spin 1s linear infinite' }} />
        <Typography variant="h6" style={{ color: 'var(--text-secondary)' }}>Preparing Quiz Content...</Typography>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    );
  }

  const percentage = Math.round((score / quizQuestions.length) * 100);

  // Interactive Code Blanks renderer helper
  const renderInteractiveCodeBlanks = (question) => {
    let inputIndex = 0;
    const visualLines = groupIntoVisualLines(question.codeTemplateLines);
    
    return (
      <Paper className="quiz-code-card-fill" elevation={0}>
        <div className="code-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CodeIcon fontSize="small" className="code-header-icon" />
            <span>{question.fileName}</span>
          </div>
          <span style={{ opacity: 0.5, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'sans-serif', fontWeight: 700 }}>
            {question.type?.replace('_', ' ')}
          </span>
        </div>
        <div className="code-card-body">
          <pre className="code-pre">
            {visualLines.map((lineGroup, lineIdx) => {
              return (
                <div key={lineIdx} className="code-line">
                  <span className="code-line-number">{lineIdx + 1}</span>
                  <span className="code-line-content">
                    {lineGroup[0]?.type === 'input' && (
                      <span className="code-line-indentation" style={{ userSelect: 'none' }}>
                        {getIndentation(visualLines, lineIdx)}
                      </span>
                    )}
                    {lineGroup.map((part, partIdx) => {
                      if (part.type === 'input') {
                        const idx = inputIndex;
                        const userVal = blankValues[idx] || '';
                        const isCorrect = blankStatuses[idx] === true;
                        const isFocus = focusedBlankIndex === idx;
                        inputIndex++;

                        let borderStyle = '1px solid rgba(255,255,255,0.15)';
                        let bg = 'rgba(255,255,255,0.05)';
                        if (isFocus) {
                          borderStyle = '1.5px solid var(--primary-main)';
                          bg = 'rgba(28,176,246,0.08)';
                        }
                        if (isAnswered) {
                          borderStyle = isCorrect ? '1.5px solid #4CAF50' : '1.5px solid #F44336';
                          bg = isCorrect ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)';
                        }

                        const expectedAns = part.expectedAnswer || '';
                        const isShort = expectedAns.trim().length <= 10 && !expectedAns.includes(' ') && !expectedAns.includes(';') && !part.multiline;

                        if (question.type === 'write_line' && !isShort) {
                          return (
                            <span key={partIdx} style={{ display: 'inline-block', margin: '4px 0', verticalAlign: 'top', width: '90%', maxWidth: '650px' }}>
                              <textarea
                                value={userVal}
                                disabled={isAnswered}
                                onFocus={() => setFocusedBlankIndex(idx)}
                                onChange={(e) => setBlankValues(prev => ({ ...prev, [idx]: e.target.value }))}
                                placeholder="// Write full statement(s) here..."
                                rows={part.multiline ? 3 : 2}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  fontSize: '0.88rem',
                                  fontFamily: '"Roboto Mono", monospace',
                                  color: '#fff',
                                  borderRadius: '8px',
                                  border: borderStyle,
                                  backgroundColor: bg,
                                  outline: 'none',
                                  resize: 'vertical',
                                  lineHeight: 1.5,
                                  transition: 'all 0.2s ease',
                                  display: 'block'
                                }}
                              />
                            </span>
                          );
                        }

                        return (
                          <span key={partIdx} style={{ display: 'inline-block', margin: '0 4px', verticalAlign: 'middle' }}>
                            <input
                              type="text"
                              value={userVal}
                              disabled={isAnswered}
                              onFocus={() => setFocusedBlankIndex(idx)}
                              onChange={(e) => setBlankValues(prev => ({ ...prev, [idx]: e.target.value }))}
                              style={{
                                width: `${Math.max(50, part.width * 11)}px`,
                                height: '28px',
                                padding: '2px 8px',
                                fontSize: '0.85rem',
                                fontFamily: '"Roboto Mono", monospace',
                                textAlign: 'center',
                                color: '#fff',
                                borderRadius: '6px',
                                border: borderStyle,
                                backgroundColor: bg,
                                outline: 'none',
                                transition: 'all 0.2s ease'
                              }}
                            />
                          </span>
                        );
                      }

                      const displayContent = (part.content === '' || part.content === '\n') ? '\u00A0' : part.content;
                      return (
                        <span key={partIdx}>
                          {highlightCppCode(displayContent, true)}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </Paper>
    );
  };

  return (
    <Box className="quiz-page">
      <header className="quiz-header glass-panel">
        <Container maxWidth="lg" className="quiz-header-content">
          <div className="quiz-header-left">
            <IconButton onClick={() => navigate(-1)} className="quiz-back-btn">
              <ArrowBackIcon />
            </IconButton>
            <div>
              <Typography variant="h6" className="quiz-lesson-title">
                {course?.sections.flatMap(s => s.lessons).find(l => String(l.id) === String(lessonId))?.title || 'Quiz'}
              </Typography>
              <Typography variant="caption" className="quiz-progress-text">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </Typography>
            </div>
          </div>

          <div className="quiz-header-right">
            <div className="quiz-score-badge">
              <TrophyIcon fontSize="small" />
              <Typography variant="body2">{score} / {quizQuestions.length}</Typography>
            </div>
          </div>
        </Container>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          className="quiz-progress-bar"
        />
      </header>

      <Container maxWidth={currentQuestion.type === 'code_challenge' ? "xl" : "md"} className="quiz-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={{ width: '100%' }}
          >
            {/* 1. CODE CHALLENGE SPLIT PANELS RENDERER */}
            {currentQuestion.type === 'code_challenge' ? (
              <Grid container spacing={3} style={{ marginTop: '1rem' }}>
                <Grid item xs={12} md={5}>
                  <Paper className="quiz-question-container glass-panel-strong challenge-pane" elevation={0} style={{ padding: '24px', minHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="overline" style={{ color: 'var(--primary-main)', fontWeight: 800, letterSpacing: '0.12em' }}>
                      C++ INTERACTIVE CHALLENGE
                    </Typography>
                    <Typography variant="h5" className="challenge-title" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', margin: '8px 0 16px' }}>
                      C++ Coding Practice
                    </Typography>
                    
                    <Box className="challenge-instructions" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
                      <Typography variant="subtitle1" style={{ fontWeight: 700, marginBottom: '6px' }}>Problem Description</Typography>
                      <Typography variant="body2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                        {parseInlineCode(currentQuestion.problem)}
                      </Typography>

                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div>
                          <Typography variant="caption" style={{ fontWeight: 800, display: 'block', color: 'var(--text-secondary)' }}>INPUT FORMAT</Typography>
                          <Typography variant="body2" style={{ fontSize: '0.85rem' }}>{currentQuestion.inputFormat || "Standard terminal stream."}</Typography>
                        </div>
                        <div>
                          <Typography variant="caption" style={{ fontWeight: 800, display: 'block', color: 'var(--text-secondary)' }}>OUTPUT FORMAT</Typography>
                          <Typography variant="body2" style={{ fontSize: '0.85rem' }}>{currentQuestion.outputFormat || "stdout match."}</Typography>
                        </div>
                      </div>

                      {currentQuestion.constraints && (
                        <div style={{ marginBottom: '16px' }}>
                          <Typography variant="caption" style={{ fontWeight: 800, display: 'block', color: 'var(--text-secondary)' }}>CONSTRAINTS</Typography>
                          <code style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            {currentQuestion.constraints}
                          </code>
                        </div>
                      )}

                      {currentQuestion.example && (
                        <Paper style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginTop: '16px' }} elevation={0}>
                          <Typography variant="subtitle2" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <HelpOutlineIcon fontSize="small" style={{ color: 'var(--primary-main)' }} /> Sample Example Case
                          </Typography>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                              <Typography variant="caption" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>SAMPLE INPUT</Typography>
                              <pre style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '6px', margin: '4px 0 0', fontSize: '0.8rem', fontFamily: 'monospace' }}>{currentQuestion.example.input}</pre>
                            </div>
                            <div>
                              <Typography variant="caption" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>SAMPLE OUTPUT</Typography>
                              <pre style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '6px', margin: '4px 0 0', fontSize: '0.8rem', fontFamily: 'monospace' }}>{currentQuestion.example.output}</pre>
                            </div>
                          </div>
                          {currentQuestion.example.explanation && (
                            <Typography variant="caption" style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              Explanation: {currentQuestion.example.explanation}
                            </Typography>
                          )}
                        </Paper>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* C++ IDE Editor Panel */}
                    <Paper className="quiz-code-editor-card" elevation={0} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', backgroundColor: 'var(--bg-card)', overflow: 'hidden' }}>
                      <div className="code-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CodeIcon fontSize="small" style={{ color: 'var(--primary-main)' }} />
                          <Typography variant="body2" style={{ fontFamily: 'monospace', fontWeight: 800 }}>main.cpp</Typography>
                        </div>
                        <Button 
                          variant="contained" 
                          size="small" 
                          startIcon={<PlayArrowIcon />} 
                          disabled={isCompiling}
                          onClick={handleRunCodeChallenge}
                          style={{ textTransform: 'none', backgroundColor: '#58CC02', color: '#fff', borderRadius: '8px' }}
                        >
                          Compile & Run
                        </Button>
                      </div>
                      <textarea
                        value={userCode}
                        disabled={isAnswered}
                        onChange={(e) => setUserCode(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '32vh',
                          padding: '16px',
                          fontSize: '0.9rem',
                          fontFamily: '"Roboto Mono", monospace',
                          color: '#e0e0e0',
                          backgroundColor: 'rgba(0,0,0,0.18)',
                          border: 'none',
                          outline: 'none',
                          resize: 'vertical',
                          lineHeight: 1.55
                        }}
                      />
                    </Paper>

                    {/* Compile Logs Console */}
                    <Paper className="quiz-console-panel" elevation={0} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', backgroundColor: '#121214', padding: '16px' }}>
                      <Typography variant="subtitle2" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <TerminalIcon fontSize="small" style={{ color: 'var(--primary-main)' }} /> EXECUTION CONSOLE
                      </Typography>
                      <pre style={{
                        maxHeight: '18vh',
                        overflowY: 'auto',
                        margin: 0,
                        padding: '6px',
                        fontSize: '0.82rem',
                        fontFamily: '"Roboto Mono", monospace',
                        color: allCasesPassed ? '#81C784' : '#e0e0e0',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {consoleLogs}
                      </pre>
                    </Paper>
                  </div>
                </Grid>
              </Grid>
            ) : (
              // 2. STANDARD MCQ / INTERACTIVE FILL BLANKS RENDERER
              <Paper className="quiz-question-container glass-panel" elevation={0}>
                {/* Visual syntax highlighting C++ cards for find_error / mcq with code */}
                {currentQuestion.codeSnippetLines && currentQuestion.codeSnippetLines.length > 0 && (
                  <Paper className="quiz-code-card" elevation={0} style={{ marginBottom: '20px' }}>
                    <div className="code-card-header">
                      <CodeIcon fontSize="small" className="code-header-icon" />
                      <span>{currentQuestion.fileName || 'snippet.cpp'}</span>
                    </div>
                    <div className="code-card-body">
                      <pre className="code-pre">
                        {currentQuestion.codeSnippetLines.map((line, idx) => (
                          <div key={idx} className="code-line">
                            <span className="code-line-number">{idx + 1}</span>
                            <span className="code-line-content">{highlightCppCode(line, true)}</span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  </Paper>
                )}

                <Typography variant="h5" className="quiz-question-prompt">
                  {parseInlineCode(currentQuestion.prompt || currentQuestion.instruction)}
                </Typography>

                {/* Render inline blanks for coding slots */}
                {(currentQuestion.type === 'fill_code' || currentQuestion.type === 'fill_code_options' || currentQuestion.type === 'write_line') && (
                  <div style={{ margin: '24px 0 16px' }}>
                    {renderInteractiveCodeBlanks(currentQuestion)}
                  </div>
                )}

                {/* Clickable interactive Word Bank below blanks */}
                {currentQuestion.type === 'fill_code_options' && currentQuestion.wordBank && currentQuestion.wordBank.length > 0 && (
                  <Box style={{ margin: '20px 0', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>
                      WORD BANK OPTIONS
                    </Typography>
                    <Box style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {currentQuestion.wordBank.map((word, wIdx) => {
                        const isUsed = Object.values(blankValues).includes(word);
                        return (
                          <Chip
                            key={wIdx}
                            label={word}
                            disabled={isAnswered}
                            onClick={() => handleWordBankClick(word)}
                            style={{
                              fontFamily: '"Roboto Mono", monospace',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              backgroundColor: isUsed ? 'rgba(255,255,255,0.05)' : 'rgba(28,176,246,0.12)',
                              color: isUsed ? 'rgba(255,255,255,0.25)' : '#1CB0F6',
                              border: isUsed ? '1px solid transparent' : '1px solid rgba(28,176,246,0.25)',
                              cursor: isAnswered ? 'default' : 'pointer',
                              transform: 'scale(1)',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Standard MCQ Answers Grid */}
                {currentQuestion.answers && currentQuestion.answers.length > 0 && (
                  <div className="quiz-answers-grid" style={{ marginTop: '24px' }}>
                    {currentQuestion.answers.map((answer) => {
                      const isSelected = selectedAnswerId === answer.id;
                      const isCorrect = answer.isCorrect;
                      
                      let stateClass = '';
                      if (isAnswered) {
                        if (isCorrect) stateClass = 'is-correct';
                        else if (isSelected && !isCorrect) stateClass = 'is-incorrect';
                      } else if (isSelected) {
                        stateClass = 'is-selected';
                      }

                      return (
                        <Button
                          key={answer.id}
                          onClick={() => handleAnswerSelect(answer.id)}
                          className={`quiz-answer-btn ${stateClass}`}
                          disabled={isAnswered && !isSelected && !isCorrect}
                        >
                          <span className="quiz-answer-text">{parseInlineCode(answer.text)}</span>
                          {isAnswered && isCorrect && <CheckCircleIcon className="quiz-feedback-icon" />}
                          {isAnswered && isSelected && !isCorrect && <CancelIcon className="quiz-feedback-icon" />}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </Paper>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="quiz-actions" style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '24px' }}>
          {/* Submit / Check Answer Button */}
          {!isAnswered && (currentQuestion.type === 'fill_code' || currentQuestion.type === 'fill_code_options' || currentQuestion.type === 'write_line') && (
            <Button
              variant="contained"
              size="large"
              onClick={handleCheckCodeAnswers}
              className="quiz-next-btn primary"
              style={{ padding: '10px 28px', borderRadius: '12px' }}
            >
              Check Answers
            </Button>
          )}

          {!isAnswered && currentQuestion.type === 'code_challenge' && (
            <Button
              variant="contained"
              size="large"
              disabled={!codeRunCompleted}
              onClick={handleSubmitCodeChallenge}
              className="quiz-next-btn primary"
              style={{ padding: '10px 28px', borderRadius: '12px' }}
            >
              Submit Solution
            </Button>
          )}

          {isAnswered && (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              className="quiz-next-btn"
              component={motion.button}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '10px 28px', borderRadius: '12px' }}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Button>
          )}
        </div>
      </Container>

      <Modal
        open={showResult}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showResult}>
          <Box className="quiz-result-modal">
            <Paper className="quiz-result-card glass-panel-strong" elevation={0}>
              <div className="quiz-result-header">
                <div className="quiz-result-icon-ring">
                  <TrophyIcon className="quiz-result-icon" />
                </div>
                <Typography variant="h3" className="quiz-result-title">
                  Quiz Completed!
                </Typography>
                <Typography variant="body1" className="quiz-result-subtitle">
                  {percentage >= 90 ? "Outstanding performance! You've mastered this lesson." : 
                   percentage >= 70 ? "Great job! You've passed this lesson." :
                   "Score at least 70% to pass this lesson. Keep practicing!"}
                </Typography>
              </div>

              <div className="quiz-result-stats">
                <div className="quiz-result-stat-item">
                  <Typography variant="h2">{percentage}%</Typography>
                  <Typography variant="caption">Final Score</Typography>
                </div>
                <div className="quiz-result-stat-divider" />
                <div className="quiz-result-stat-item">
                  <Typography variant="h2">{score}/{quizQuestions.length}</Typography>
                  <Typography variant="caption">Correct Answers</Typography>
                </div>
              </div>

              <div className="quiz-result-actions">
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={handleRestart}
                  className="quiz-result-btn"
                >
                  Try Again
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => navigate(`/learning-path/${course.id}`, { 
                    state: { 
                      course: location.state?.course || course,
                      quizResult: { lessonId, score, percentage }
                    } 
                  })}
                  className="quiz-result-btn primary"
                >
                  Continue Journey
                </Button>
              </div>
            </Paper>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default QuizPage;
