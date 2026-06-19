import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Grid,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  MenuBook as BookIcon,
  HelpOutline as HelpOutlineIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayIcon,
  AutoAwesome as AutoAwesomeIcon,
  Explore as ExploreIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import './LearningContentPage.css'; // Reuses existing glassmorphic page styles

// 1. Upgraded Socratic Dialogue Widget (Multi-Topic)
export const SocraticDialogueWidget = () => {
  const [topic, setTopic] = useState('justice');
  const [step, setStep] = useState('start');
  const [messages, setMessages] = useState([
    {
      sender: 'socrates',
      text: 'Greetings, seeker of truth. I am Socrates. Men call me wise, but I know only that I know nothing. Let us seek truth together. Select a topic to investigate.'
    }
  ]);

  const dialogTrees = {
    justice: {
      start: {
        socrates: 'Let us examine: What is justice?',
        options: [
          { text: "Justice is speaking the truth and paying one's debts.", next: 'pay_debts' },
          { text: 'Justice is doing good to friends and harm to enemies.', next: 'help_friends' },
          { text: 'Justice is the advantage of the stronger—what the rulers decree.', next: 'stronger_adv' }
        ]
      },
      pay_debts: {
        socrates: 'But tell me: if a friend, when in his right mind, deposits weapons with you, and then asks for them back when he has gone mad, is it just to return them?',
        options: [
          { text: 'Yes, a debt is a debt. We must return what we promised.', next: 'pay_debts_return' },
          { text: 'No, that would be harmful. We must modify our definition.', next: 'pay_debts_modify' }
        ]
      },
      pay_debts_return: {
        socrates: 'But returning weapons to a madman will surely lead to harm, and justice is not harmful. Therefore, justice cannot simply be paying debts. Let us try again.',
        options: [
          { text: 'Let me try another definition.', next: 'start' }
        ]
      },
      pay_debts_modify: {
        socrates: 'Excellent! You see that paying back is only just when it does no harm. So we should do good to our friends and avoid harming them. Is justice doing good to friends and harm to enemies?',
        options: [
          { text: 'Yes, that sounds like a proper definition.', next: 'help_friends' },
          { text: 'No, let us think of something else.', next: 'start' }
        ]
      },
      help_friends: {
        socrates: 'Let us examine this. If we harm a horse, do we make it better or worse in its horse-like qualities? Worse. And if we harm a human, do we make them better or worse in their human virtues?',
        options: [
          { text: 'We make them worse in human virtue (less just).', next: 'help_friends_unjust' },
          { text: 'Some wicked people deserve harm to keep others safe.', next: 'help_friends_deserve' }
        ]
      },
      help_friends_unjust: {
        socrates: 'Precisely! Harming a human makes them less just. But can a musician, by his music, make men unmusical? Or can a horse-trainer make men bad riders? No. Then can a just man, by his justice, make men unjust?',
        options: [
          { text: 'No, that is impossible. Justice cannot produce injustice.', next: 'help_friends_concede' }
        ]
      },
      help_friends_deserve: {
        socrates: 'punishing is not the same as harming in virtue. If we make a criminal worse, we commit injustice. Justice cannot work to produce injustice, just as heat cannot produce cold. Therefore, the just man must never harm anyone.',
        options: [
          { text: 'I agree, harming anyone cannot be part of justice.', next: 'help_friends_concede' }
        ]
      },
      help_friends_concede: {
        socrates: 'Then our definition fails again. Let us look at the other proposal: is justice the advantage of the stronger?',
        options: [
          { text: "Let's examine the advantage of the stronger.", next: 'stronger_adv' },
          { text: "Let's start over.", next: 'start' }
        ]
      },
      stronger_adv: {
        socrates: "Do rulers of states never make mistakes, or are they liable to make laws that are bad for themselves?",
        options: [
          { text: 'Rulers are human; they can make mistakes.', next: 'stronger_mistakes' },
          { text: 'A true ruler in the strict sense never errs.', next: 'stronger_infallible' }
        ]
      },
      stronger_mistakes: {
        socrates: 'If they make mistakes, they may command laws that are to their own disadvantage. In obeying these mistaken laws, are the subjects not doing what is to the *disadvantage* of the stronger?',
        options: [
          { text: 'Yes, that is a logical contradiction. I concede.', next: 'stronger_concede' }
        ]
      },
      stronger_infallible: {
        socrates: 'Does a physician, in the strict sense, practice medicine for his own advantage, or for the advantage of the patient? Does a captain govern for his own benefit, or for the crew?',
        options: [
          { text: 'For the advantage of the patient and the crew.', next: 'stronger_patient' }
        ]
      },
      stronger_patient: {
        socrates: 'Then every art governs and acts for the advantage of the weaker subject, not the stronger master. Thus, a true ruler rules for the advantage of the citizens, not himself!',
        options: [
          { text: 'That is correct. The argument holds.', next: 'stronger_concede' }
        ]
      },
      stronger_concede: {
        socrates: 'Then justice is not the advantage of the stronger. We have refuted these definitions, yet we still do not know what justice itself is.',
        options: [
          { text: 'We are in complete puzzlement (Aporia).', next: 'aporia' }
        ]
      },
      aporia: {
        socrates: 'Indeed! We have reached an aporia. But do not despair. Admitting your ignorance is the first step toward true wisdom.',
        options: [
          { text: 'Restart the dialogue.', next: 'start' }
        ]
      }
    },
    knowledge: {
      start: {
        socrates: 'Let us examine: What is knowledge?',
        options: [
          { text: 'Knowledge is simple perception (what we see and feel).', next: 'perception' },
          { text: 'Knowledge is True Belief.', next: 'true_belief' },
          { text: 'Knowledge is Justified True Belief (JTB).', next: 'jtb' }
        ]
      },
      perception: {
        socrates: 'If knowledge is perception, then does a dog see things and know them as well as a man? If a cold wind feels warm to you but cold to me, is the wind both warm and cold? If perception is truth, how can anyone ever be wrong?',
        options: [
          { text: 'Ah, truth must be more objective. Perception is not enough.', next: 'start' }
        ]
      },
      true_belief: {
        socrates: 'But imagine a clever lawyer who convinces a jury of a crime they did not witness. The jury believes it, and it happens to be true. Did they have knowledge, or were they just persuaded without eyewitness proof?',
        options: [
          { text: 'They only had belief, not true knowledge. We need justification.', next: 'start_jtb' }
        ]
      },
      start_jtb: {
        socrates: 'Exactly. So we must add justification! This brings us to the famous definition: Knowledge is Justified True Belief (JTB). Do you agree?',
        options: [
          { text: 'Yes, JTB is the perfect definition of knowledge.', next: 'jtb' }
        ]
      },
      jtb: {
        socrates: 'A solid account! But consider this (Gettier Case): A man believes there is a sheep in a field because he sees a dog that looks exactly like a sheep. Unbeknownst to him, there *is* a sheep hidden behind a hedge. He has belief, it is true, and he has justification (sensory image), yet is it truly knowledge, or merely epistemic luck?',
        options: [
          { text: 'That is epistemic luck. JTB is incomplete.', next: 'jtb_fail' }
        ]
      },
      jtb_fail: {
        socrates: 'Precisely! Justification can sometimes be based on false premises, leading to true beliefs by accident. We have reached another aporia. True knowledge remains elusive!',
        options: [
          { text: 'Restart the dialogue.', next: 'start' }
        ]
      }
    },
    virtue: {
      start: {
        socrates: 'Let us examine: What is virtue?',
        options: [
          { text: 'Virtue is the desire for honorable things and the power to attain them.', next: 'desire_power' },
          { text: 'Virtue is knowledge (and therefore, it can be taught).', next: 'virtue_knowledge' }
        ]
      },
      desire_power: {
        socrates: 'But do not all men desire what they think is good? If someone desires bad things thinking they are good, do they still desire good? And if one attains honorable things through theft or injustice, is that still virtue?',
        options: [
          { text: 'No. Attaining things must be done justly. So virtue is doing things justly.', next: 'justly' }
        ]
      },
      justly: {
        socrates: 'But is justice not a part of virtue? If you define virtue by saying it is doing things justly, are you not defining virtue by using a part of virtue itself? That is circular reasoning!',
        options: [
          { text: 'Indeed, that is circular. Let us try the other definition.', next: 'virtue_knowledge' }
        ]
      },
      virtue_knowledge: {
        socrates: 'If virtue is knowledge, then it must be teachable. But if it is teachable, where are its teachers? Have you ever seen a master of virtue who successfully taught his sons to be virtuous? Did Pericles make his sons virtuous?',
        options: [
          { text: 'No, they often failed. So virtue cannot be taught.', next: 'not_teachable' }
        ]
      },
      not_teachable: {
        socrates: 'If it cannot be taught, and it is not innate, then how do men become virtuous? Perhaps it is a divine gift, or we have yet to define what virtue itself is. We are in aporia!',
        options: [
          { text: 'Restart the dialogue.', next: 'start' }
        ]
      }
    }
  };

  const handleTopicChange = (newTopic) => {
    setTopic(newTopic);
    setStep('start');
    setMessages([
      {
        sender: 'socrates',
        text: newTopic === 'justice' 
          ? 'Let us examine: What is justice?'
          : newTopic === 'knowledge'
          ? 'Let us examine: What is knowledge?'
          : 'Let us examine: What is virtue?'
      }
    ]);
  };

  const handleOptionClick = (option) => {
    const newUserMsg = { sender: 'user', text: option.text };
    const nextStep = option.next;
    const nextNode = dialogTrees[topic][nextStep];
    
    setMessages(prev => [...prev, newUserMsg]);
    
    setTimeout(() => {
      const socratesText = nextStep === 'start' 
        ? (topic === 'justice' ? 'What is justice?' : topic === 'knowledge' ? 'What is knowledge?' : 'What is virtue?')
        : nextNode.socrates;
        
      setMessages(prev => [...prev, { sender: 'socrates', text: socratesText }]);
      setStep(nextStep);
    }, 600);
  };

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Box style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar style={{ background: 'var(--primary-main)', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>S</Avatar>
          <Box>
            <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Socratic Dialogue Simulator</Typography>
            <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>Dialogue on Philosophical Definitions</Typography>
          </Box>
        </Box>

        <Box style={{ display: 'flex', gap: '8px' }}>
          {['justice', 'knowledge', 'virtue'].map(t => (
            <Button
              key={t}
              size="small"
              variant={topic === t ? 'contained' : 'outlined'}
              onClick={() => handleTopicChange(t)}
              style={{
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.75rem',
                borderColor: topic === t ? 'none' : 'rgba(255,255,255,0.15)',
                backgroundColor: topic === t ? 'var(--primary-main)' : 'transparent',
                color: topic === t ? '#fff' : 'var(--text-primary)'
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Chat logs */}
      <Box style={{ minHeight: '220px', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', marginBottom: '16px' }}>
        {messages.map((msg, i) => (
          <Box key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <Box style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.86rem',
              lineHeight: 1.4,
              backgroundColor: msg.sender === 'user' ? 'rgba(28, 176, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: msg.sender === 'user' ? '1px solid rgba(28, 176, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
              color: 'var(--text-primary)'
            }}>
              <Typography variant="caption" style={{ display: 'block', fontWeight: 800, color: msg.sender === 'user' ? '#1CB0F6' : 'var(--primary-main)', marginBottom: '2px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                {msg.sender === 'user' ? 'You' : 'Socrates'}
              </Typography>
              {msg.text}
            </Box>
          </Box>
        ))}
      </Box>

      {/* User Options */}
      <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '2px' }}>Choose your response:</Typography>
        {dialogTrees[topic][step]?.options.map((opt, i) => (
          <Button
            key={i}
            variant="outlined"
            onClick={() => handleOptionClick(opt)}
            style={{
              textTransform: 'none',
              textAlign: 'left',
              justifyContent: 'flex-start',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              borderColor: 'rgba(255,255,255,0.12)',
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.01)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(28, 176, 246, 0.08)';
              e.currentTarget.style.borderColor = 'var(--primary-main)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            {opt.text}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

// 2. Upgraded Truth Table Widget (Dynamic propositional logic evaluator)
export const TruthTableWidget = () => {
  const formulas = [
    {
      id: 'implies',
      label: 'P → Q (Implication)',
      cols: ['P', 'Q', 'P → Q'],
      rows: [
        { p: 'T', q: 'T', correct: 'T', val: '?' },
        { p: 'T', q: 'F', correct: 'F', val: '?' },
        { p: 'F', q: 'T', correct: 'T', val: '?' },
        { p: 'F', q: 'F', correct: 'T', val: '?' }
      ],
      question: 'Under what condition is an implication false?',
      questionOptions: [
        { text: 'When both P and Q are False', isCorrect: false },
        { text: 'When the antecedent P is True and consequent Q is False', isCorrect: true },
        { text: 'When P is False and Q is True', isCorrect: false }
      ]
    },
    {
      id: 'conjunction',
      label: 'P ∧ ¬Q (Conjunction with Negation)',
      cols: ['P', 'Q', '¬Q', 'P ∧ ¬Q'],
      rows: [
        { p: 'T', q: 'T', notq: 'F', correct: 'F', val: '?' },
        { p: 'T', q: 'F', notq: 'T', correct: 'T', val: '?' },
        { p: 'F', q: 'T', notq: 'F', correct: 'F', val: '?' },
        { p: 'F', q: 'F', notq: 'T', correct: 'F', val: '?' }
      ],
      question: 'When is a conjunction P ∧ ¬Q true?',
      questionOptions: [
        { text: 'Only when P is True and Q is False', isCorrect: true },
        { text: 'Only when P is False and Q is True', isCorrect: false },
        { text: 'When either P is True or Q is False', isCorrect: false }
      ]
    },
    {
      id: 'modus_tollens',
      label: '(P → Q) ∧ ¬Q (Modus Tollens Premise)',
      cols: ['P', 'Q', 'P → Q', '¬Q', '(P → Q) ∧ ¬Q'],
      rows: [
        { p: 'T', q: 'T', implies: 'T', notq: 'F', correct: 'F', val: '?' },
        { p: 'T', q: 'F', implies: 'F', notq: 'T', correct: 'F', val: '?' },
        { p: 'F', q: 'T', implies: 'T', notq: 'F', correct: 'F', val: '?' },
        { p: 'F', q: 'F', implies: 'T', notq: 'T', correct: 'T', val: '?' }
      ],
      question: 'Modus Tollens says: If (P → Q) and ¬Q are true, then ¬P is true. Is it valid?',
      questionOptions: [
        { text: 'Yes, because in the only row where the premises are True, P is False (so ¬P is True)', isCorrect: true },
        { text: 'No, because there are rows where P is False but premises are False', isCorrect: false }
      ]
    }
  ];

  const [activeFormulaIdx, setActiveFormulaIdx] = useState(0);
  const formula = formulas[activeFormulaIdx];

  const [rows, setRows] = useState(formula.rows);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFormulaChange = (idx) => {
    setActiveFormulaIdx(idx);
    setRows(formulas[idx].rows);
    setSelectedOptionIdx(null);
    setChecked(false);
    setShowFeedback(false);
  };

  const toggleCell = (rowIdx) => {
    if (checked) return;
    setRows(prev => prev.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const current = row.val;
      let next = 'T';
      if (current === 'T') next = 'F';
      else if (current === 'F') next = '?';
      return { ...row, val: next };
    }));
  };

  const handleVerify = () => {
    let cellScore = 0;
    rows.forEach(r => {
      if (r.val === r.correct) cellScore++;
    });

    const isQuestionCorrect = formula.questionOptions[selectedOptionIdx]?.isCorrect === true;
    const totalCorrect = cellScore + (isQuestionCorrect ? 1 : 0);
    
    setScore(totalCorrect);
    setChecked(true);
    setShowFeedback(true);
  };

  const handleReset = () => {
    setRows(formula.rows.map(r => ({ ...r, val: '?' })));
    setSelectedOptionIdx(null);
    setChecked(false);
    setShowFeedback(false);
  };

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Box style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
        <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Formal Logic Truth Table Builder
        </Typography>

        <Box style={{ display: 'flex', gap: '8px' }}>
          {formulas.map((f, idx) => (
            <Button
              key={f.id}
              size="small"
              variant={activeFormulaIdx === idx ? 'contained' : 'outlined'}
              onClick={() => handleFormulaChange(idx)}
              style={{
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.72rem',
                borderColor: activeFormulaIdx === idx ? 'none' : 'rgba(255,255,255,0.15)',
                backgroundColor: activeFormulaIdx === idx ? 'var(--primary-main)' : 'transparent',
                color: activeFormulaIdx === idx ? '#fff' : 'var(--text-primary)'
              }}
            >
              {f.label.split(' ')[0]}
            </Button>
          ))}
        </Box>
      </Box>

      <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Configure the truth value of the formula by clicking the yellow <b>?</b> cells in the final column.
      </Typography>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.82rem', textAlign: 'center' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
            {formula.cols.map((col, i) => (
              <th key={i} style={{ padding: '8px', color: i === formula.cols.length - 1 ? 'var(--primary-main)' : 'var(--text-secondary)', fontWeight: 800 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isCorrect = checked && row.val === row.correct;
            return (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.p}</td>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.q}</td>
                {/* Implies support columns */}
                {row.notq !== undefined && <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{row.notq}</td>}
                {row.implies !== undefined && <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{row.implies}</td>}
                {/* Result column to build */}
                <td
                  onClick={() => toggleCell(idx)}
                  style={{
                    padding: '8px',
                    cursor: checked ? 'default' : 'pointer',
                    fontWeight: 'bold',
                    color: row.val === 'T' ? '#4CAF50' : row.val === 'F' ? '#FF5252' : '#FFC107',
                    backgroundColor: checked ? (isCorrect ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 82, 82, 0.08)') : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s'
                  }}
                >
                  {row.val}
                  {checked && (
                    <span style={{ fontSize: '0.68rem', display: 'block', color: isCorrect ? '#4CAF50' : '#FF5252' }}>
                      {isCorrect ? '✓ Ok' : `Expected: ${row.correct}`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Conceptual Question */}
      <Box style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="body2" style={{ fontWeight: 700, marginBottom: '10px' }}>
          {formula.question}
        </Typography>

        <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {formula.questionOptions.map((opt, i) => (
            <Button
              key={i}
              variant={selectedOptionIdx === i ? 'contained' : 'outlined'}
              disabled={checked}
              onClick={() => setSelectedOptionIdx(i)}
              style={{
                textTransform: 'none',
                justifyContent: 'flex-start',
                borderRadius: '8px',
                borderColor: selectedOptionIdx === i ? 'none' : 'rgba(255,255,255,0.12)',
                backgroundColor: selectedOptionIdx === i ? 'var(--primary-main)' : 'transparent',
                color: selectedOptionIdx === i ? '#fff' : 'var(--text-primary)',
                fontSize: '0.8rem',
                textAlign: 'left'
              }}
            >
              {opt.text}
            </Button>
          ))}
        </Box>

        {checked && (
          <Box style={{ marginTop: '12px', color: formula.questionOptions[selectedOptionIdx]?.isCorrect ? '#4CAF50' : '#FF5252', fontSize: '0.82rem', fontWeight: 700 }}>
            {formula.questionOptions[selectedOptionIdx]?.isCorrect 
              ? '✓ Correct reasoning!' 
              : `✗ Incorrect. The correct answer was: "${formula.questionOptions.find(o => o.isCorrect).text}"`}
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        {!checked ? (
          <Button
            variant="contained"
            onClick={handleVerify}
            disabled={rows.some(r => r.val === '?') || selectedOptionIdx === null}
            style={{
              background: 'var(--hero-gradient)',
              color: '#fff',
              fontWeight: 800,
              borderRadius: '10px',
              textTransform: 'none'
            }}
          >
            Verify Answers
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={handleReset}
            style={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'var(--text-primary)',
              fontWeight: 800,
              borderRadius: '10px',
              textTransform: 'none'
            }}
          >
            Reset Exercise
          </Button>
        )}
      </Box>

      {showFeedback && (
        <Box style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', border: '1.5px solid', borderColor: score === 5 ? '#4CAF50' : 'rgba(255,255,255,0.08)', backgroundColor: score === 5 ? 'rgba(76,175,80,0.05)' : 'rgba(255,255,255,0.02)' }}>
          <Typography variant="subtitle2" style={{ fontWeight: 800, color: score === 5 ? '#4CAF50' : 'var(--primary-main)', marginBottom: '4px' }}>
            Score Card: {score}/5
          </Typography>
          <Typography variant="body2" style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.8rem' }}>
            Completing truth tables allows us to evaluate arguments formally. A valid deductive argument is one where it is impossible for the premises to be true while the conclusion is false.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// 3. Fallacy Matcher Widget
export const FallacySorterWidget = () => {
  const cards = [
    {
      id: 1,
      arg: "We cannot trust Dr. Smith's study on healthy eating because he was recently seen eating a double cheeseburger.",
      fallacy: 'ad_hominem',
      fallacyName: 'Ad Hominem',
      explanation: "Attacks the person's character or actions rather than their argument."
    },
    {
      id: 2,
      arg: "If we allow the school to change the dress code, soon they will ban all self-expression, force us to wear matching jumpsuits, and turn the school into a prison camp.",
      fallacy: 'slippery_slope',
      fallacyName: 'Slippery Slope',
      explanation: "Claims that a relatively small first step will lead to a chain of negative events without proving the connection."
    },
    {
      id: 3,
      arg: "Either you support this war completely, or you hate our country and want our enemies to win.",
      fallacy: 'false_dilemma',
      fallacyName: 'False Dilemma',
      explanation: "Presents only two choices when many more alternatives exist."
    },
    {
      id: 4,
      arg: "My opponent says we should invest in renewable energy; clearly, they want to shut down all our power grids and throw us back into the dark ages!",
      fallacy: 'straw_man',
      fallacyName: 'Straw Man',
      explanation: "Misrepresents an opponent's argument to make it easier to attack."
    }
  ];

  const [selections, setSelections] = useState({ 1: '', 2: '', 3: '', 4: '' });
  const [checked, setChecked] = useState(false);

  const handleSelect = (id, value) => {
    if (checked) return;
    setSelections(prev => ({ ...prev, [id]: value }));
  };

  const handleCheck = () => {
    setChecked(true);
  };

  const handleReset = () => {
    setSelections({ 1: '', 2: '', 3: '', 4: '' });
    setChecked(false);
  };

  const fallacies = [
    { id: 'ad_hominem', name: 'Ad Hominem' },
    { id: 'straw_man', name: 'Straw Man' },
    { id: 'false_dilemma', name: 'False Dilemma' },
    { id: 'slippery_slope', name: 'Slippery Slope' }
  ];

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Logic Lab: Fallacy Matcher
      </Typography>

      <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
        Identify the informal fallacy committed in each of the arguments below by selecting the correct category from the dropdown menu.
      </Typography>

      <Box style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {cards.map(c => {
          const userVal = selections[c.id];
          const isCorrect = userVal === c.fallacy;
          
          return (
            <Box 
              key={c.id} 
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.02)', 
                border: checked 
                  ? (isCorrect ? '1.5px solid #4CAF50' : '1.5px solid #FF5252') 
                  : '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <Typography variant="body2" style={{ fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                "{c.arg}"
              </Typography>
              
              <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <select
                  disabled={checked}
                  value={userVal}
                  onChange={(e) => handleSelect(c.id, e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    minWidth: '150px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose Fallacy --</option>
                  {fallacies.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                {checked && (
                  <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="caption" style={{ fontWeight: 800, color: isCorrect ? '#4CAF50' : '#FF5252' }}>
                      {isCorrect ? '✓ Correct' : `✗ Expected: ${c.fallacyName}`}
                    </Typography>
                    <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', textAlign: 'right' }}>
                      {c.explanation}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box style={{ display: 'flex', gap: '10px' }}>
        {!checked ? (
          <Button
            variant="contained"
            onClick={handleCheck}
            disabled={Object.values(selections).some(v => v === '')}
            style={{
              background: 'var(--hero-gradient)',
              color: '#fff',
              fontWeight: 800,
              borderRadius: '10px',
              textTransform: 'none'
            }}
          >
            Check Fallacies
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={handleReset}
            style={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'var(--text-primary)',
              fontWeight: 800,
              borderRadius: '10px',
              textTransform: 'none'
            }}
          >
            Reset Quiz
          </Button>
        )}
      </Box>
    </Paper>
  );
};

// 4. Ship of Theseus Widget (Advanced Visual SVG)
export const ShipOfTheseusWidget = () => {
  const [planks, setPlanks] = useState(['wood', 'wood', 'wood', 'wood', 'wood']);
  const [replaceCount, setReplaceCount] = useState(0);
  const [identityResponses, setIdentityResponses] = useState([]);
  const [finalChoice, setFinalChoice] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [particles, setParticles] = useState([]);

  const plankPaths = [
    { d: "M 100,50 Q 200,53 300,50 L 295,62 Q 200,65 105,62 Z", label: "Deck Plank" },
    { d: "M 105,62 Q 200,65 295,62 L 290,74 Q 200,77 110,74 Z", label: "Upper Hull Plank" },
    { d: "M 110,74 Q 200,77 290,74 L 284,86 Q 200,89 116,86 Z", label: "Middle Hull Plank" },
    { d: "M 116,86 Q 200,89 284,86 L 277,98 Q 200,101 123,98 Z", label: "Lower Hull Plank" },
    { d: "M 123,98 Q 200,101 277,98 L 268,110 Q 200,113 132,110 Z", label: "Keel Plank" }
  ];

  const handlePlankClick = (index) => {
    if (planks[index] === 'steel') return;
    if (replaceCount > 0 && identityResponses.length < replaceCount) return; // Answer current question first

    setPlanks(prev => {
      const next = [...prev];
      next[index] = 'steel';
      return next;
    });

    // Spark particle effect centered at the plank
    const startX = 130 + index * 25 + Math.random() * 15;
    const startY = 60 + index * 10 + Math.random() * 5;
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random() + i,
      x: startX,
      y: startY,
      angle: (i * 2 * Math.PI) / 12 + Math.random() * 0.4 - 0.2,
      distance: 20 + Math.random() * 20
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 850);

    setReplaceCount(prev => prev + 1);
  };

  const handleResponse = (isStillTheseus) => {
    setIdentityResponses(prev => [...prev, { plankNum: replaceCount, response: isStillTheseus }]);
  };

  const handleReset = () => {
    setPlanks(['wood', 'wood', 'wood', 'wood', 'wood']);
    setReplaceCount(0);
    setIdentityResponses([]);
    setFinalChoice('');
    setShowAnalysis(false);
    setParticles([]);
  };

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Metaphysics Lab: The Ship of Theseus
      </Typography>

      <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
        Theseus returned from Crete in a ship. Over time, planks decayed and were replaced. 
        <b> Click on the wooden planks</b> below to replace them with polished steel. Reflect on its identity.
      </Typography>

      {replaceCount < 5 ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
          {/* SVG Greek Ship hull - uses theme compatible background & borders */}
          <svg viewBox="0 0 400 180" width="100%" height="180" style={{ background: 'rgba(128,128,128,0.08)', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.15)' }}>
            {/* Mast */}
            <line x1="200" y1="50" x2="200" y2="15" stroke="#795548" strokeWidth="5" strokeLinecap="round" />
            {/* Sail */}
            <path d="M 200,15 Q 240,20 200,45 Q 175,32 200,15" fill="rgba(245,245,245,0.95)" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.9" />
            
            {/* Planks */}
            {plankPaths.map((plank, idx) => {
              const material = planks[idx];
              const isInteractable = replaceCount === 0 || identityResponses.length >= replaceCount;
              return (
                <path
                  key={idx}
                  d={plank.d}
                  fill={material === 'wood' ? '#8d5a2b' : '#b0bec5'}
                  stroke={material === 'wood' ? '#5d4037' : '#78909c'}
                  strokeWidth="1.5"
                  style={{
                    cursor: material === 'wood' && isInteractable ? 'pointer' : 'default',
                    transition: 'fill 0.4s, filter 0.2s',
                    filter: material === 'wood' && isInteractable ? 'brightness(0.95)' : 'none'
                  }}
                  onClick={() => {
                    if (isInteractable) handlePlankClick(idx);
                  }}
                  onMouseEnter={(e) => {
                    if (material === 'wood' && isInteractable) {
                      e.currentTarget.style.filter = 'brightness(1.2) drop-shadow(0 0 4px #8d5a2b)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (material === 'wood' && isInteractable) {
                      e.currentTarget.style.filter = 'brightness(0.95)';
                    }
                  }}
                />
              );
            })}

            {/* Waves */}
            <path d="M 50,113 C 90,105 130,121 170,113 C 210,105 250,121 290,113 C 330,105 350,115 370,113" fill="none" stroke="#29b6f6" strokeWidth="3" opacity="0.65" strokeLinecap="round" />

            {/* Discarded planks pile */}
            {replaceCount >= 1 && (
              <g opacity="0.85">
                <text x="35" y="140" fill="var(--text-secondary)" fontSize="9" fontWeight="800">DISCARDED WOOD</text>
                {Array.from({ length: replaceCount }).map((_, idx) => {
                  const rotations = [12, -15, 6, 28, -8];
                  const yOffsets = [150, 155, 148, 158, 152];
                  return (
                    <rect
                      key={idx}
                      x="40"
                      y={yOffsets[idx]}
                      width="45"
                      height="5"
                      rx="1"
                      fill="#8d5a2b"
                      stroke="#5d4037"
                      strokeWidth="1"
                      transform={`rotate(${rotations[idx]}, ${40 + 22}, ${yOffsets[idx] + 2.5})`}
                    />
                  );
                })}
              </g>
            )}

            {/* Particles */}
            {particles.map(p => (
              <motion.circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={2.5}
                fill="#ffeb3b"
                initial={{ opacity: 1, scale: 1 }}
                animate={{
                  cx: p.x + Math.cos(p.angle) * p.distance,
                  cy: p.y + Math.sin(p.angle) * p.distance,
                  opacity: 0,
                  scale: 0.2
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
          </svg>

          <Typography variant="body2" style={{ color: 'var(--text-secondary)', margin: '10px 0' }}>
            Planks Replaced: <b>{replaceCount}/5</b>
          </Typography>

          {replaceCount > 0 && identityResponses.length < replaceCount && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginTop: '10px' }}>
              <Typography variant="body2" style={{ fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
                Question: With {replaceCount} steel plank(s) installed, is this still the <i>original</i> Ship of Theseus?
              </Typography>
              <Box style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleResponse(true)}
                  style={{ textTransform: 'none', borderRadius: '8px', fontWeight: 800, color: 'var(--text-primary)', borderColor: 'rgba(128,128,128,0.25)' }}
                >
                  Yes, it is
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleResponse(false)}
                  style={{ textTransform: 'none', borderRadius: '8px', fontWeight: 800, color: 'var(--text-primary)', borderColor: 'rgba(128,128,128,0.25)' }}
                >
                  No, it has changed
                </Button>
              </Box>
            </motion.div>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" style={{ color: '#4CAF50', fontWeight: 800, textAlign: 'center', marginBottom: '16px' }}>
            ✓ All planks replaced! We now have two ships to compare in the harbor.
          </Typography>

          {/* Side by side rendering */}
          <Grid container spacing={3} style={{ marginBottom: '20px' }}>
            <Grid item xs={12} sm={6}>
              <Box style={{ padding: '12px', background: 'rgba(128,128,128,0.04)', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.15)', textAlign: 'center' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Ship A (Steel Hull)</Typography>
                <svg viewBox="0 0 400 160" width="100%" height="110">
                  <line x1="200" y1="50" x2="200" y2="15" stroke="#795548" strokeWidth="4" />
                  <path d="M 200,15 Q 240,20 200,45 Q 175,32 200,15" fill="rgba(245,245,245,0.9)" stroke="var(--text-secondary)" />
                  {plankPaths.map((plank, idx) => (
                    <path key={idx} d={plank.d} fill="#b0bec5" stroke="#78909c" strokeWidth="1" />
                  ))}
                  <path d="M 50,113 C 90,105 130,121 170,113 C 210,105 250,121 290,113 C 330,105 350,115 370,113" fill="none" stroke="#29b6f6" strokeWidth="2.5" opacity="0.5" />
                </svg>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', display: 'block', mt: 1 }}>
                  The continuously repaired ship in the water. Continuous form and function.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box style={{ padding: '12px', background: 'rgba(128,128,128,0.04)', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.15)', textAlign: 'center' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Ship B (Reconstructed Wood)</Typography>
                <svg viewBox="0 0 400 160" width="100%" height="110">
                  <line x1="200" y1="50" x2="200" y2="15" stroke="#795548" strokeWidth="4" />
                  <path d="M 200,15 Q 240,20 200,45 Q 175,32 200,15" fill="rgba(245,245,245,0.9)" stroke="var(--text-secondary)" />
                  {plankPaths.map((plank, idx) => (
                    <path key={idx} d={plank.d} fill="#8d5a2b" stroke="#5d4037" strokeWidth="1" />
                  ))}
                  <path d="M 50,113 C 90,105 130,121 170,113 C 210,105 250,121 290,113 C 330,105 350,115 370,113" fill="none" stroke="#29b6f6" strokeWidth="2.5" opacity="0.5" />
                </svg>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', display: 'block', mt: 1 }}>
                  Built in the dry dock using all the discarded wooden planks. Original substance.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box style={{ border: '1px dashed rgba(128,128,128,0.25)', padding: '16px', borderRadius: '12px', marginBottom: '20px', background: 'rgba(128,128,128,0.02)' }}>
            <Typography variant="body2" style={{ fontWeight: 800, marginBottom: '12px', textAlign: 'center' }}>
              Which ship is the TRUE Ship of Theseus?
            </Typography>

            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button
                variant={finalChoice === 'ship_a' ? 'contained' : 'outlined'}
                onClick={() => { setFinalChoice('ship_a'); setShowAnalysis(true); }}
                style={{
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderRadius: '10px',
                  borderColor: finalChoice === 'ship_a' ? 'none' : 'rgba(128,128,128,0.25)',
                  backgroundColor: finalChoice === 'ship_a' ? 'var(--primary-main)' : 'transparent',
                  color: finalChoice === 'ship_a' ? '#fff' : 'var(--text-primary)'
                }}
              >
                Ship A (Continuity of Form and Spatio-Temporal path)
              </Button>
              <Button
                variant={finalChoice === 'ship_b' ? 'contained' : 'outlined'}
                onClick={() => { setFinalChoice('ship_b'); setShowAnalysis(true); }}
                style={{
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderRadius: '10px',
                  borderColor: finalChoice === 'ship_b' ? 'none' : 'rgba(128,128,128,0.25)',
                  backgroundColor: finalChoice === 'ship_b' ? 'var(--primary-main)' : 'transparent',
                  color: finalChoice === 'ship_b' ? '#fff' : 'var(--text-primary)'
                }}
              >
                Ship B (Continuity of Material Substance)
              </Button>
              <Button
                variant={finalChoice === 'both' ? 'contained' : 'outlined'}
                onClick={() => { setFinalChoice('both'); setShowAnalysis(true); }}
                style={{
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderRadius: '10px',
                  borderColor: finalChoice === 'both' ? 'none' : 'rgba(128,128,128,0.25)',
                  backgroundColor: finalChoice === 'both' ? 'var(--primary-main)' : 'transparent',
                  color: finalChoice === 'both' ? '#fff' : 'var(--text-primary)'
                }}
              >
                Both / Neither (Identity is an overlaying construct)
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {showAnalysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box style={{ padding: '16px', background: 'rgba(28, 176, 246, 0.05)', border: '1.5px solid var(--primary-main)', borderRadius: '12px', marginBottom: '16px' }}>
            <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '6px' }}>
              Philosophical Breakdown
            </Typography>
            <Typography variant="body2" style={{ color: 'var(--text-primary)', lineHeight: 1.5, fontSize: '0.82rem' }}>
              {finalChoice === 'ship_a' && "You favor Spatio-Temporal Continuity (Thomas Hobbes). Since Ship A continuously existed in the harbor as 'the ship' while undergoing repairs, its identity was preserved step-by-step. Form and function determine identity."}
              {finalChoice === 'ship_b' && "You favor Material Identity (Aristotle's Material Cause). Since Ship B is made of the actual wood planks that Theseus stood on, it holds the genuine material substance of the original. Substance determines identity."}
              {finalChoice === 'both' && "You hold a bundle theory or anti-realist view of identity. You see that 'Ship of Theseus' is a conceptual label we assign for convenience, not an absolute property of the matter itself. Both have distinct, valid logical claims."}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={handleReset}
            style={{
              borderColor: 'rgba(128,128,128,0.25)',
              color: 'var(--text-primary)',
              fontWeight: 800,
              borderRadius: '10px',
              textTransform: 'none'
            }}
          >
            Reset Simulator
          </Button>
        </motion.div>
      )}
    </Paper>
  );
};

// Helper Stick Figure component for Trolley Problem visualization (Fully theme compatible)
const StickFigure = ({ x, y, color = "var(--text-primary)", scale = 1, isDead = false }) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} style={{ transition: 'all 0.5s' }}>
      {/* Head */}
      <circle cx="0" cy="-24" r="5" fill="none" stroke={color} strokeWidth="2" />
      {/* Torso */}
      <line x1="0" y1="-19" x2="0" y2="-7" stroke={color} strokeWidth="2" />
      {/* Arms */}
      <line x1="-8" y1="-15" x2="8" y2="-15" stroke={color} strokeWidth="2" />
      {/* Legs */}
      <line x1="0" y1="-7" x2="-5" y2="5" stroke={color} strokeWidth="2" />
      <line x1="0" y1="-7" x2="5" y2="5" stroke={color} strokeWidth="2" />
      {/* Dead Mark */}
      {isDead && (
        <path d="M -6,-26 L 6,-10 M 6,-26 L -6,-10" stroke="#FF5252" strokeWidth="2.5" />
      )}
    </g>
  );
};

// 5. Upgraded Trolley Problem Widget (SVG Track & Animation System)
export const TrolleyProblemWidget = () => {
  const [currentScenario, setCurrentScenario] = useState(1);
  const [answers, setAnswers] = useState({ 1: null, 2: null, 3: null });
  const [profilingDone, setProfilingDone] = useState(false);
  const [animationState, setAnimationState] = useState('idle'); // 'idle' | 'running' | 'complete'
  const [decision, setDecision] = useState(null); // 'yes' | 'no'

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: The Switch',
      description: 'A runaway trolley is speeding down the tracks toward 5 workers who will be killed. You can pull a lever to divert it onto a side track where only 1 worker stands. Do you pull the lever, actively sacrificing 1 to save 5?',
      yesLabel: 'Yes (Pull Lever)',
      noLabel: 'No (Do Nothing)'
    },
    {
      id: 2,
      title: 'Scenario 2: The Footbridge',
      description: 'The trolley is speeding toward 5 workers. You are standing on a footbridge above the track next to a very large man. Pushing him off the bridge will block the trolley, killing him but saving the 5. Do you push the man?',
      yesLabel: 'Yes (Push Bystander)',
      noLabel: 'No (Do Nothing)'
    },
    {
      id: 3,
      title: 'Scenario 3: The Organ Transplant',
      description: 'A doctor has 5 patients dying of organ failure. A healthy traveler walks into the hospital for a checkup. The doctor can secretly kill the traveler, harvest their organs, and save the 5. Do you authorize this action?',
      yesLabel: 'Yes (Harvest Organs)',
      noLabel: 'No (Protect Patient)'
    }
  ];

  const handleChoice = (choice) => {
    setDecision(choice);
    setAnimationState('running');
    setAnswers(prev => ({ ...prev, [currentScenario]: choice }));

    setTimeout(() => {
      setAnimationState('complete');
    }, 2400);
  };

  const handleNext = () => {
    setAnimationState('idle');
    setDecision(null);
    if (currentScenario < 3) {
      setCurrentScenario(prev => prev + 1);
    } else {
      setProfilingDone(true);
    }
  };

  const calculateProfile = () => {
    let utilitarianCount = 0;
    if (answers[1] === 'yes') utilitarianCount++;
    if (answers[2] === 'yes') utilitarianCount++;
    if (answers[3] === 'yes') utilitarianCount++;

    const utilitarianPct = Math.round((utilitarianCount / 3) * 100);
    const deontologyPct = 100 - utilitarianPct;

    let profileTitle = '';
    let profileDesc = '';

    if (answers[1] === 'yes' && answers[2] === 'no' && answers[3] === 'no') {
      profileTitle = 'Pragmatic Deontologist (Most Common)';
      profileDesc = 'You favor utilitarian outcomes when harm is indirect (pulling a lever), but refuse to violate moral rules when it requires direct physical contact (pushing the man) or violates professional trust (surgeon). You follow the Doctrine of Double Effect: foreseen side-effects are permissible, but directly using a person as a means to an end is not.';
    } else if (answers[1] === 'yes' && answers[2] === 'yes' && answers[3] === 'yes') {
      profileTitle = 'Pure Utilitarian / Consequentialist';
      profileDesc = 'You believe that the moral worth of an action is determined solely by its consequences. Maximizing the number of survivors (5 vs 1) is always the right action, regardless of direct contact or professional rules. You agree with Jeremy Bentham: "Each to count for one, and none for more than one."';
    } else if (answers[1] === 'no' && answers[2] === 'no' && answers[3] === 'no') {
      profileTitle = 'Pure Deontologist / Kantian';
      profileDesc = 'You follow absolute moral duties. For you, actively causing the death of an innocent person is a moral violation that can never be justified by the consequences (saving others). You agree with Immanuel Kant: human beings must be treated as ends in themselves, never merely as a means to an end.';
    } else {
      profileTitle = 'Intuitive Pluralist';
      profileDesc = 'Your moral decisions are guided by a mix of duties and consequences depending on context. You evaluate active vs. passive harm dynamically, prioritizing absolute rights in some scenarios while allowing utilitarian compromises in others.';
    }

    return { utilitarianPct, deontologyPct, profileTitle, profileDesc };
  };

  const handleReset = () => {
    setCurrentScenario(1);
    setAnswers({ 1: null, 2: null, 3: null });
    setProfilingDone(false);
    setAnimationState('idle');
    setDecision(null);
  };

  // Dynamic values for keyframe animation of trolley
  const trolleyX = decision === 'yes' ? [50, 200, 360] : [50, 360];
  const trolleyY = decision === 'yes' ? [90, 90, 130] : [90, 90];

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Ethics Lab: Moral Framework Profiler
      </Typography>

      {!profilingDone ? (
        <Box>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--primary-main)' }}>
              Scenario {currentScenario} of 3
            </Typography>
            <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
              {currentScenario === 1 ? "SWITCH Y/N" : currentScenario === 2 ? "FOOTBRIDGE Y/N" : "SURGERY Y/N"}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(currentScenario / 3) * 100} 
            style={{ marginBottom: '20px', borderRadius: '4px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }} 
          />

          <Typography variant="subtitle1" style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
            {scenarios[currentScenario - 1].title}
          </Typography>
          <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            {scenarios[currentScenario - 1].description}
          </Typography>

          {/* SVG Visual Demonstration - Theme Responsive backgrounds & lines */}
          <Box style={{ width: '100%', height: '200px', backgroundColor: 'rgba(128,128,128,0.08)', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.15)', position: 'relative', overflow: 'hidden', marginBottom: '20px' }}>
            
            {/* Scenario 1: The Switch SVG */}
            {currentScenario === 1 && (
              <svg viewBox="0 0 450 180" width="100%" height="100%">
                {/* Main tracks */}
                <line x1="20" y1="100" x2="430" y2="100" stroke="var(--text-secondary)" strokeWidth="6" opacity="0.25" />
                <line x1="20" y1="100" x2="430" y2="100" stroke="#78909c" strokeWidth="4" strokeDasharray="3,6" />
                
                {/* Side track fork */}
                <path d="M 180,100 Q 260,100 320,140 L 430,140" fill="none" stroke="var(--text-secondary)" strokeWidth="6" opacity="0.25" />
                <path d="M 180,100 Q 260,100 320,140 L 430,140" fill="none" stroke="#78909c" strokeWidth="4" strokeDasharray="3,6" />

                {/* 5 Workers */}
                <StickFigure x={380} y={100} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={395} y={85} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={395} y={115} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={410} y={93} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={410} y={107} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />

                {/* 1 Worker */}
                <StickFigure x={380} y={140} color={animationState === 'complete' && decision === 'yes' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'yes'} scale={0.6} />

                {/* Switch lever */}
                <g transform="translate(180, 70)">
                  <circle cx="0" cy="10" r="4" fill="var(--text-primary)" opacity="0.8" />
                  <motion.line
                    x1="0" y1="10" x2={decision === 'yes' ? 12 : -12} y2="-5"
                    stroke={decision === null ? "var(--text-secondary)" : decision === 'yes' ? "#4CAF50" : "#ff5252"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    animate={animationState === 'running' ? { x2: decision === 'yes' ? 12 : -12, y2: -5 } : {}}
                  />
                  <text x="-15" y="-12" fill="var(--text-secondary)" fontSize="8" fontWeight="800">LEVER</text>
                </g>

                {/* Trolley */}
                <motion.g
                  initial={{ x: 30, y: 90 }}
                  animate={animationState === 'running' ? { x: trolleyX, y: trolleyY } : { x: 30, y: 90 }}
                  transition={{ duration: 2.0, ease: "easeInOut" }}
                >
                  <rect x="-16" y="-10" width="32" height="18" rx="2" fill="#D32F2F" stroke="#7f0000" strokeWidth="1" />
                  <circle cx="-10" cy="10" r="4" fill="#424242" />
                  <circle cx="10" cy="10" r="4" fill="#424242" />
                  <polygon points="12,-5 16,-5 16,5 12,5" fill="#ffeb3b" /> {/* Headlight */}
                </motion.g>
              </svg>
            )}

            {/* Scenario 2: The Footbridge SVG */}
            {currentScenario === 2 && (
              <svg viewBox="0 0 450 180" width="100%" height="100%">
                {/* Tracks */}
                <line x1="20" y1="140" x2="430" y2="140" stroke="var(--text-secondary)" strokeWidth="6" opacity="0.25" />
                <line x1="20" y1="140" x2="430" y2="140" stroke="#78909c" strokeWidth="4" strokeDasharray="3,6" />

                {/* Bridge */}
                <rect x="180" y="65" width="100" height="8" fill="#546e7a" />
                <line x1="180" y1="65" x2="180" y2="140" stroke="#546e7a" strokeWidth="4" />
                <line x1="280" y1="65" x2="280" y2="140" stroke="#546e7a" strokeWidth="4" />

                {/* Bystander & Player on Bridge */}
                {/* Large Bystander */}
                <motion.g
                  initial={{ x: 215, y: 65 }}
                  animate={animationState === 'running' && decision === 'yes' ? { y: [65, 65, 140], x: [215, 215, 215] } : { x: 215, y: 65 }}
                  transition={{ duration: 2.0, times: [0, 0.4, 0.75], ease: "easeInOut" }}
                >
                  <StickFigure x={0} y={0} color={animationState === 'complete' && decision === 'yes' ? '#ff5252' : '#2196F3'} isDead={animationState === 'complete' && decision === 'yes'} scale={1.1} />
                </motion.g>

                {/* Player */}
                <StickFigure x={255} y={65} color="#4CAF50" scale={0.8} />
                <text x="245" y="45" fill="#4CAF50" fontSize="8" fontWeight="800">YOU</text>

                {/* 5 Workers */}
                <StickFigure x={380} y={140} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={395} y={125} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={395} y={155} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={410} y={133} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />
                <StickFigure x={410} y={147} color={animationState === 'complete' && decision === 'no' ? '#ff5252' : 'var(--text-primary)'} isDead={animationState === 'complete' && decision === 'no'} scale={0.6} />

                {/* Trolley */}
                <motion.g
                  initial={{ x: 30, y: 130 }}
                  animate={animationState === 'running' ? { x: decision === 'yes' ? [30, 205] : [30, 360] } : { x: 30 }}
                  transition={{ duration: 2.0, ease: "easeInOut" }}
                >
                  <rect x="-16" y="-10" width="32" height="18" rx="2" fill="#D32F2F" stroke="#7f0000" strokeWidth="1" />
                  <circle cx="-10" cy="10" r="4" fill="#424242" />
                  <circle cx="10" cy="10" r="4" fill="#424242" />
                  <polygon points="12,-5 16,-5 16,5 12,5" fill="#ffeb3b" />
                </motion.g>
              </svg>
            )}

            {/* Scenario 3: Organ Transplant SVG */}
            {currentScenario === 3 && (
              <svg viewBox="0 0 450 180" width="100%" height="100%">
                {/* Ward division line */}
                <line x1="300" y1="20" x2="300" y2="160" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.2" />
                
                {/* 5 Patients Beds & Pulses */}
                {Array.from({ length: 5 }).map((_, idx) => {
                  const yVal = 30 + idx * 30;
                  const isSaved = animationState === 'complete' && decision === 'yes';
                  const isDead = animationState === 'complete' && decision === 'no';
                  return (
                    <g key={idx} transform={`translate(50, ${yVal})`}>
                      {/* Bed */}
                      <rect x="0" y="-8" width="40" height="16" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" opacity="0.35" />
                      <line x1="5" y1="0" x2="35" y2="0" stroke={isSaved ? '#4CAF50' : isDead ? 'var(--text-secondary)' : 'var(--text-primary)'} strokeWidth="3" />
                      {/* Heart Pulse */}
                      <motion.path
                        d="M 50,-5 L 53,-5 L 55,-10 L 57,5 L 59,-7 L 61,-5 L 70,-5"
                        fill="none"
                        stroke={isSaved ? '#4CAF50' : isDead ? 'var(--text-secondary)' : '#ff5252'}
                        strokeWidth="1.5"
                        animate={!isDead && !isSaved ? { strokeDashoffset: [0, 20] } : {}}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        strokeDasharray="5,15"
                      />
                    </g>
                  );
                })}

                {/* Surgeon */}
                <StickFigure x={200} y={90} color="#2196F3" scale={0.9} />
                <text x="180" y="65" fill="#2196F3" fontSize="8" fontWeight="800">SURGEON</text>

                {/* Healthy Traveler */}
                <motion.g
                  initial={{ x: 380, y: 90 }}
                  animate={
                    animationState === 'running' && decision === 'yes'
                      ? { x: [380, 200], y: [90, 130], rotate: [0, 90] }
                      : animationState === 'complete' && decision === 'yes'
                      ? { x: 200, y: 130, rotate: 90 }
                      : animationState === 'running' && decision === 'no'
                      ? { x: [380, 440], opacity: [1, 0] }
                      : animationState === 'complete' && decision === 'no'
                      ? { x: 440, opacity: 0 }
                      : { x: 380, y: 90 }
                  }
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                >
                  <StickFigure x={0} y={0} color={animationState === 'complete' && decision === 'yes' ? '#ff5252' : '#4CAF50'} isDead={animationState === 'complete' && decision === 'yes'} scale={0.9} />
                </motion.g>
                {animationState === 'idle' && (
                  <text x="350" y="65" fill="#4CAF50" fontSize="8" fontWeight="800">TRAVELER</text>
                )}

                {/* Healing beams shooting from center to beds */}
                {animationState === 'running' && decision === 'yes' && (
                  <g>
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const yVal = 30 + idx * 30;
                      return (
                        <motion.line
                          key={idx}
                          x1="200" y1="130" x2="120" y2={yVal}
                          stroke="#ffeb3b"
                          strokeWidth="2.5"
                          strokeDasharray="4,10"
                          animate={{ strokeDashoffset: [20, 0], opacity: [0, 1, 0] }}
                          transition={{ duration: 1.0, repeat: 2, ease: "easeOut" }}
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
            )}
          </Box>

          <Box style={{ display: 'flex', gap: '14px' }}>
            <Button
              variant="contained"
              disabled={animationState === 'running' || animationState === 'complete'}
              onClick={() => handleChoice('yes')}
              style={{
                flex: 1,
                background: 'var(--hero-gradient)',
                color: '#fff',
                fontWeight: 800,
                borderRadius: '10px',
                textTransform: 'none',
                padding: '12px'
              }}
            >
              {scenarios[currentScenario - 1].yesLabel}
            </Button>
            <Button
              variant="outlined"
              disabled={animationState === 'running' || animationState === 'complete'}
              onClick={() => handleChoice('no')}
              style={{
                flex: 1,
                borderColor: 'rgba(128,128,128,0.25)',
                color: 'var(--text-primary)',
                fontWeight: 800,
                borderRadius: '10px',
                textTransform: 'none',
                padding: '12px'
              }}
            >
              {scenarios[currentScenario - 1].noLabel}
            </Button>
          </Box>

          {animationState === 'complete' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', textAlign: 'center' }}>
              <Typography variant="body2" style={{ color: 'var(--primary-main)', fontWeight: 800, marginBottom: '10px' }}>
                Consequence Animated. Ready to proceed.
              </Typography>
              <Button
                variant="contained"
                onClick={handleNext}
                style={{
                  background: 'rgba(128,128,128,0.08)',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  borderRadius: '8px',
                  textTransform: 'none'
                }}
              >
                {currentScenario < 3 ? "Continue to Next Scenario" : "Show Ethical Profile"}
              </Button>
            </motion.div>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle1" style={{ fontWeight: 800, color: '#4CAF50', textAlign: 'center', marginBottom: '18px' }}>
            ✓ Ethical Profiling Complete!
          </Typography>

          {/* Scores Gauges */}
          <Grid container spacing={2} style={{ marginBottom: '20px' }}>
            <Grid item xs={6}>
              <Box style={{ padding: '16px', background: 'rgba(28, 176, 246, 0.08)', borderRadius: '12px', border: '1px solid rgba(28,176,246,0.2)', textAlign: 'center' }}>
                <Typography variant="caption" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 800 }}>Utilitarian Index</Typography>
                <Typography variant="h4" style={{ fontWeight: 900, color: 'var(--primary-main)' }}>
                  {calculateProfile().utilitarianPct}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box style={{ padding: '16px', background: 'rgba(255, 82, 82, 0.08)', borderRadius: '12px', border: '1px solid rgba(255,82,82,0.2)', textAlign: 'center' }}>
                <Typography variant="caption" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 800 }}>Deontology Index</Typography>
                <Typography variant="h4" style={{ fontWeight: 900, color: '#FF5252' }}>
                  {calculateProfile().deontologyPct}%
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Feedback */}
          <Box style={{ padding: '18px', background: 'rgba(128,128,128,0.02)', border: '1px dashed rgba(128,128,128,0.25)', borderRadius: '12px', marginBottom: '20px' }}>
            <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '8px' }}>
              Your Moral Profile: {calculateProfile().profileTitle}
            </Typography>
            <Typography variant="body2" style={{ color: 'var(--text-primary)', lineHeight: 1.5, fontSize: '0.82rem' }}>
              {calculateProfile().profileDesc}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={handleReset}
            style={{
              borderColor: 'rgba(128,128,128,0.25)',
              color: 'var(--text-primary)',
              fontWeight: 800,
              borderRadius: '10px',
              textTransform: 'none'
            }}
          >
            Retake Profiler
          </Button>
        </Box>
      )}
    </Paper>
  );
};

// 6. Plato's Cave Widget (Interactive Allegory of the Cave)
export const PlatosCaveWidget = () => {
  const [stage, setStage] = useState(0);
  const [userChoice, setUserChoice] = useState(null);

  const stages = [
    {
      title: "Stage 1: The Shadows (Sensory Perception)",
      description: "You are chained facing a blank cave wall. Behind you, a fire burns. Puppeteers carry figures of trees and animals along a raised wall, casting shadows. To you, these shadows are the absolute, sole reality.",
      insight: "Represents Eikasia (Imagination/Illusion). Here, we mistake sensory appearances and opinions for ultimate truth.",
      travelerX: 85,
      travelerY: 185,
      facing: 'left',
      chains: true
    },
    {
      title: "Stage 2: The Fire (Common Belief)",
      description: "Your chains are broken. You turn around and see the fire and the wooden puppets. The bright firelight hurts your eyes, and you realize the shadows were merely projections of these objects.",
      insight: "Represents Pistis (Belief/Conviction). You recognize physical objects as more real than shadows, but you are still inside the cave of sensory inputs.",
      travelerX: 160,
      travelerY: 185,
      facing: 'right',
      chains: false
    },
    {
      title: "Stage 3: The Ascent (Mathematical Reason)",
      description: "You are dragged out of the cave up a steep, rugged, and dark slope. The journey is painful. As you reach the exit, the brilliant sunlight is blinding, preventing you from looking at things directly.",
      insight: "Represents Dianoia (Thought/Reason). The transition from physical beliefs to abstract intellectual truth, requiring active effort.",
      travelerX: 340,
      travelerY: 145,
      facing: 'right',
      chains: false
    },
    {
      title: "Stage 4: The Sun (Understanding / The Good)",
      description: "Your eyes adjust. You see actual trees, rivers, and stars in their true form, rather than wooden puppets. Finally, you look at the Sun itself, realizing it is the source of all light, warmth, and existence.",
      insight: "Represents Noesis (Direct Intellect/Understanding). You contemplate the eternal Forms, culminating in the Form of the Good (represented by the Sun).",
      travelerX: 470,
      travelerY: 85,
      facing: 'right',
      chains: false
    }
  ];

  const currentStage = stages[stage];

  const handleNext = () => {
    if (stage < 3) {
      setStage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stage > 0) {
      setStage(prev => prev - 1);
      setUserChoice(null);
    }
  };

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Epistemology & Metaphysics: Plato's Cave Allegory
      </Typography>

      <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
        Plato's Allegory of the Cave describes the journey of the soul from the depths of sensory illusion to the height of intellectual truth and the Form of the Good.
      </Typography>

      {/* SVG Interactive Cave cross-section */}
      <Box style={{
        background: 'rgba(0, 0, 0, 0.15)',
        borderRadius: '12px',
        border: '1px solid rgba(128,128,128,0.2)',
        overflow: 'hidden',
        position: 'relative',
        height: '240px',
        marginBottom: '20px'
      }}>
        <svg viewBox="0 0 560 240" width="100%" height="100%">
          {/* Gradients */}
          <defs>
            <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff9800" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffde7" stopOpacity="1" />
              <stop offset="25%" stopColor="#ffeb3b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="caveWallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c2c2c" />
              <stop offset="100%" stopColor="#121212" />
            </linearGradient>
          </defs>

          {/* Cave Background & Structure */}
          {/* Cave Ceiling */}
          <path d="M 0,0 L 560,0 L 560,30 Q 420,100 320,60 T 0,50 Z" fill="var(--background-default)" opacity="0.8" />
          
          {/* Outside Sky and Ground */}
          <rect x="420" y="0" width="140" height="240" fill="rgba(3, 169, 244, 0.08)" />
          {/* Sun */}
          <circle cx="500" cy="50" r="28" fill="url(#sunGlow)" />
          <circle cx="500" cy="50" r="8" fill="#fff" />

          {/* Cave Ground Path */}
          <path
            d="M 0,200 L 200,200 L 200,160 L 210,160 L 210,200 L 280,200 L 420,100 L 560,100 L 560,240 L 0,240 Z"
            fill="rgba(128, 128, 128, 0.12)"
            stroke="var(--text-secondary)"
            strokeWidth="2"
            opacity="0.75"
          />

          {/* Shadows on the left wall (x=10) */}
          <g opacity={stage === 0 ? 0.8 : 0.15} style={{ transition: 'opacity 0.5s ease' }}>
            {/* Shadow of a bird */}
            <path d="M 15,100 C 10,95 5,102 12,105 C 5,108 10,115 18,110 C 18,105 18,95 15,100 Z" fill="#222" />
            {/* Shadow of a vase/urn */}
            <path d="M 12,130 L 20,130 L 22,145 L 10,145 Z" fill="#222" />
            <path d="M 8,115 L 24,115 L 24,120 L 8,120 Z" fill="#222" />
            <text x="30" y="125" fontSize="10" fill="var(--text-secondary)" opacity={stage === 0 ? 0.6 : 0}>"Reality"</text>
          </g>

          {/* Puppets held behind the wall */}
          <g opacity={stage >= 1 ? 0.9 : 0.3} style={{ transition: 'opacity 0.5s ease' }}>
            {/* Stick with bird puppet */}
            <line x1="190" y1="175" x2="190" y2="140" stroke="#795548" strokeWidth="2" />
            <path d="M 190,140 C 187,135 182,142 189,145 C 182,148 187,155 195,150 C 195,145 195,135 190,140 Z" fill="#a1887f" />
            {/* Stick with vase puppet */}
            <line x1="175" y1="180" x2="175" y2="150" stroke="#795548" strokeWidth="2" />
            <path d="M 172,150 L 178,150 L 180,160 L 170,160 Z" fill="#a1887f" />
          </g>

          {/* The Fire */}
          <g transform="translate(240, 175)">
            <circle cx="10" cy="15" r="25" fill="url(#fireGlow)" opacity={stage >= 1 ? 0.9 : 0.4} />
            <motion.path
              d="M 5,25 Q 10,5 15,25 Q 20,10 10,30 Z"
              fill="#ff5722"
              animate={{ scaleY: [1, 1.2, 0.9, 1.1, 1], y: [0, -2, 1, -1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
            <motion.path
              d="M 8,25 Q 10,12 12,25 Q 14,15 10,28 Z"
              fill="#ffeb3b"
              animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], y: [0, -3, 2, -1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            />
          </g>

          {/* Outside Tree (Realm of Forms) */}
          <g opacity={stage === 3 ? 1 : 0.2} style={{ transition: 'opacity 0.5s ease' }} transform="translate(430, 60)">
            <rect x="22" y="25" width="6" height="15" fill="#5d4037" />
            <circle cx="25" cy="18" r="14" fill="#4caf50" />
            <circle cx="17" cy="12" r="10" fill="#81c784" />
            <circle cx="33" cy="14" r="10" fill="#81c784" />
          </g>

          {/* The Chains */}
          {stage === 0 ? (
            <g stroke="#9e9e9e" strokeWidth="1.5" fill="none" opacity="0.7">
              <path d="M 85,185 C 75,185 70,195 60,195" />
              <circle cx="70" cy="190" r="3" />
              <circle cx="78" cy="188" r="3" />
            </g>
          ) : stage === 1 ? (
            <g stroke="#9e9e9e" strokeWidth="1.5" fill="none" opacity="0.4">
              <path d="M 60,198 Q 70,202 80,198" />
              <path d="M 95,198 Q 105,202 115,198" />
              <circle cx="70" cy="199" r="2.5" />
              <circle cx="105" cy="199" r="2.5" />
            </g>
          ) : null}

          {/* The Traveler (Prisoner) */}
          <motion.g
            animate={{
              x: currentStage.travelerX,
              y: currentStage.travelerY
            }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          >
            {/* Glow effect */}
            <circle cx="0" cy="0" r="12" fill={currentStage.chains ? "rgba(255, 152, 0, 0.2)" : "rgba(0, 230, 118, 0.3)"} />
            
            {/* Person Figure */}
            <circle cx="0" cy="-14" r="5" fill={currentStage.chains ? "#ffa726" : "#26a69a"} />
            <line x1="0" y1="-9" x2="0" y2="2" stroke={currentStage.chains ? "#ffa726" : "#26a69a"} strokeWidth="3" strokeLinecap="round" />
            {currentStage.facing === 'left' ? (
              <path d="M -6,-7 Q -2,-5 0,-7" stroke={currentStage.chains ? "#ffa726" : "#26a69a"} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : stage === 3 ? (
              <path d="M -6,-18 L 0,-9 L 6,-18" stroke="#26a69a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M -4,-5 Q 0,-3 4,-5" stroke={currentStage.chains ? "#ffa726" : "#26a69a"} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            <line x1="0" y1="2" x2="-4" y2="12" stroke={currentStage.chains ? "#ffa726" : "#26a69a"} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="2" x2="4" y2="12" stroke={currentStage.chains ? "#ffa726" : "#26a69a"} strokeWidth="2.5" strokeLinecap="round" />
          </motion.g>

          {/* Explanatory Text Overlays */}
          <text x="35" y="225" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">1. Shadow Wall</text>
          <text x="210" y="225" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">2. Fire & Puppets</text>
          <text x="320" y="225" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">3. The Ascent</text>
          <text x="460" y="225" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">4. The Sun</text>
        </svg>
      </Box>

      {/* Controls */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Button
          variant="outlined"
          onClick={handlePrev}
          disabled={stage === 0}
          style={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 800,
            borderColor: 'rgba(128,128,128,0.25)',
            color: stage === 0 ? 'var(--text-secondary)' : 'var(--text-primary)'
          }}
        >
          Previous Stage
        </Button>

        <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
          Stage {stage + 1} of 4
        </Typography>

        <Button
          variant="contained"
          onClick={handleNext}
          disabled={stage === 3}
          style={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 800,
            background: stage === 3 ? 'var(--text-secondary)' : 'linear-gradient(135deg, var(--primary-main), #1976d2)',
            color: '#fff'
          }}
        >
          {stage === 3 ? "Fully Enlightened" : "Next Stage"}
        </Button>
      </Box>

      {/* Narrative & Insight Card */}
      <Box style={{
        padding: '20px',
        background: 'rgba(128,128,128,0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(128,128,128,0.15)',
        marginBottom: '20px'
      }}>
        <Typography variant="subtitle1" style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {currentStage.title}
        </Typography>

        <Typography variant="body2" style={{ color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '14px' }}>
          {currentStage.description}
        </Typography>

        <Box style={{
          padding: '12px 16px',
          background: 'rgba(74, 144, 226, 0.08)',
          borderLeft: '4px solid var(--primary-main)',
          borderRadius: '4px'
        }}>
          <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--primary-main)', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
            Philosophical Significance
          </Typography>
          <Typography variant="body2" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontStyle: 'italic' }}>
            {currentStage.insight}
          </Typography>
        </Box>
      </Box>

      {/* Reflection Interactive */}
      {stage === 3 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Box style={{
            padding: '20px',
            background: 'rgba(0, 230, 118, 0.05)',
            border: '1.5px solid #26a69a',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <Typography variant="subtitle2" style={{ fontWeight: 800, color: '#26a69a', marginBottom: '8px' }}>
              👥 The Return: Plato's Tragic Conclusion
            </Typography>
            <Typography variant="body2" style={{ color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.4 }}>
              Plato asserts that the enlightened philosopher must return to the cave to lead others out. If you go back down and try to tell the chained prisoners that their shadows are illusions, how will they react?
            </Typography>

            <Grid container spacing={2}>
              {[
                { key: 'A', text: "They will be grateful and follow you out immediately." },
                { key: 'B', text: "They will think you are crazy, laugh at you, and kill you if you try to free them." },
                { key: 'C', text: "They will ignore you, preferring their familiar illusions." }
              ].map(opt => (
                <Grid item xs={12} key={opt.key}>
                  <Button
                    fullWidth
                    variant={userChoice === opt.key ? "contained" : "outlined"}
                    onClick={() => setUserChoice(opt.key)}
                    style={{
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontWeight: 800,
                      borderColor: userChoice === opt.key ? '#26a69a' : 'rgba(128,128,128,0.25)',
                      backgroundColor: userChoice === opt.key ? 'rgba(38, 166, 154, 0.15)' : 'transparent',
                      color: userChoice === opt.key ? '#26a69a' : 'var(--text-primary)'
                    }}
                  >
                    {opt.text}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {userChoice && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '16px' }}>
                <Divider style={{ margin: '12px 0', borderColor: 'rgba(38, 166, 154, 0.2)' }} />
                <Typography variant="body2" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {userChoice === 'B' ? (
                    <span>
                      <b>Correct (According to Plato).</b> In the dialogue, Socrates notes that the prisoners would ridicule the returning philosopher because his eyes are no longer adjusted to the dark. They would claim that ascending ruins one's eyesight, and if anyone tried to set them free, they would put him to death—a clear reference to the execution of Socrates.
                    </span>
                  ) : (
                    <span>
                      <b>Plato's view is darker:</b> He argued they would choose <b>B</b>. The prisoners do not want to be freed. Because they have known only shadows, they fear the light and would consider the philosopher ruined and mad. Plato used this to illustrate how society rejects true wisdom.
                    </span>
                  )}
                  <br /><br />
                  This leads to Plato's concept of the <b>Philosopher King</b>: only those who have seen the Sun (the Truth) are fit to rule, yet they must be compelled to rule because they would prefer to stay outside in the sunlight.
                </Typography>
              </motion.div>
            )}
          </Box>
        </motion.div>
      )}
    </Paper>
  );
};

// 7. Political Compass Widget (Politics Test - 4 Quadrants & Live Plotting)
export const PoliticalCompassWidget = () => {
  const [answers, setAnswers] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = [
    {
      id: 1,
      text: "The state must actively intervene in the economy to regulate corporations, protect labor rights, and redistribute wealth.",
      axis: 'economic',
      weight: -1 // Agree moves Left (-)
    },
    {
      id: 2,
      text: "For the sake of public safety, order, and national security, the government must have strong surveillance authority and restrict harmful speech.",
      axis: 'social',
      weight: 1 // Agree moves Authoritarian (+)
    },
    {
      id: 3,
      text: "Unregulated free-market capitalism, with flat or minimal taxation, is the most efficient and moral way to organize a society.",
      axis: 'economic',
      weight: 1 // Agree moves Right (+)
    },
    {
      id: 4,
      text: "Personal lifestyle liberties (such as drug choices, consensual relationships, and self-expression) should be absolute and completely free from government legislation.",
      axis: 'social',
      weight: -1 // Agree moves Libertarian (-)
    },
    {
      id: 5,
      text: "Vital services like healthcare, university education, and housing are human rights that must be funded by progressive taxes and guaranteed by the state.",
      axis: 'economic',
      weight: -1 // Agree moves Left (-)
    },
    {
      id: 6,
      text: "National sovereignty, strict control of borders, and the preservation of traditional cultural values must be prioritized over cosmopolitan globalism.",
      axis: 'social',
      weight: 1 // Agree moves Authoritarian (+)
    }
  ];

  const handleAnswer = (scoreValue) => {
    setAnswers(prev => ({ ...prev, [questions[currentIdx].id]: scoreValue }));
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setFinished(false);
    }
  };

  const handleReset = () => {
    setAnswers({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    setCurrentIdx(0);
    setFinished(false);
  };

  // Calculate coordinates dynamically based on answered questions
  const calculateCoordinates = () => {
    let xSum = 0;
    let ySum = 0;
    let xCount = 0;
    let yCount = 0;

    questions.forEach(q => {
      const val = answers[q.id];
      if (val !== null) {
        if (q.axis === 'economic') {
          xSum += val * q.weight;
          xCount++;
        } else {
          ySum += val * q.weight;
          yCount++;
        }
      }
    });

    // Scale to -10 to +10 range
    const x = xCount > 0 ? (xSum / (xCount * 2)) * 10 : 0;
    const y = yCount > 0 ? (ySum / (yCount * 2)) * 10 : 0;

    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const { x, y } = calculateCoordinates();

  const getAlignment = (x, y) => {
    if (Math.abs(x) <= 2.2 && Math.abs(y) <= 2.2) {
      return {
        title: "Social Liberalism / Center-Left Social Democracy",
        desc: "You prioritize individual rights and democratic processes, believing in a mixed economy where the market drives growth but regulations and safety nets prevent exploitation.",
        philosophers: "John Rawls, John Stuart Mill, John Maynard Keynes",
        color: "var(--primary-main)"
      };
    }
    if (x < -2.2 && y > 2.2) {
      return {
        title: "Democratic Socialism / Marxism",
        desc: "You favor progressive economic control, state-led welfare, and heavy regulations to achieve class equality. You support state authority in managing key sectors of life.",
        philosophers: "Karl Marx, Rosa Luxemburg, Clement Attlee",
        color: "#FF4B4B"
      };
    }
    if (x > 2.2 && y > 2.2) {
      return {
        title: "Authoritarian Capitalism / Classical Conservatism",
        desc: "You value national sovereignty, order, and traditional morals. Economically, you favor private ownership and capitalist structures, believing government should enforce social stability.",
        philosophers: "Thomas Hobbes, Edmund Burke, Alexander Hamilton",
        color: "#4B7BFF"
      };
    }
    if (x < -2.2 && y < -2.2) {
      return {
        title: "Libertarian Socialism / Anarcho-Syndicalism",
        desc: "You advocate for absolute personal liberty, social freedom, and community ownership. You reject corporate hierarchy and state coercion, favoring decentralized worker cooperatives.",
        philosophers: "Mikhail Bakunin, Peter Kropotkin, Noam Chomsky",
        color: "#4BFF7B"
      };
    }
    if (x > 2.2 && y < -2.2) {
      return {
        title: "Classical Liberalism / Minarchism / Libertarianism",
        desc: "You advocate for a 'night-watchman state' limited exclusively to protecting life, property, and freedom of contract. You believe in unfettered free markets and private solutions.",
        philosophers: "John Locke, Robert Nozick, Adam Smith, Friedrich Hayek",
        color: "#B44BFF"
      };
    }
    if (x < -2.2) {
      return {
        title: "Left-Wing Populism / Social Equality Focus",
        desc: "You prioritize social rights and wealth redistribution. You believe in checks against corporate capitalism and support collective labor representation.",
        philosophers: "Jean-Jacques Rousseau, Thomas Paine",
        color: "#FFA726"
      };
    }
    if (x > 2.2) {
      return {
        title: "Market Liberalism / Neoliberalism",
        desc: "You strongly advocate for privatization, deregulation, free trade, and fiscal conservatism. You trust market competition to allocate resources efficiently.",
        philosophers: "Milton Friedman, Ayn Rand",
        color: "#26C6DA"
      };
    }
    if (y > 2.2) {
      return {
        title: "Communitarianism / Traditionalism",
        desc: "You believe that communities, civil duties, and shared cultural values are paramount. You support state support for public ethics and social cohesion.",
        philosophers: "Plato, Aristotle, Alasdair MacIntyre",
        color: "#AB47BC"
      };
    }
    return {
      title: "Left-Libertarian / Georgism",
      desc: "You believe in broad personal liberties and land/resource sharing, seeking to balance individual ownership of wealth with social stewardship of natural resources.",
      philosophers: "Henry George, Pierre-Joseph Proudhon",
      color: "#26A69A"
    };
  };

  const alignment = getAlignment(x, y);

  return (
    <Paper className="glass-panel" style={{ padding: '24px', margin: '20px 0', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--primary-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Politics Lab: The Political Compass
      </Typography>

      <Typography variant="body2" style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
        Philosophers have long debated the proper balance between **state authority vs. individual liberty** (Social) and 
        **market capitalism vs. collective welfare** (Economic). Take the test to see your coordinates.
      </Typography>

      <Grid container spacing={3} alignItems="center">
        {/* Left Side: The 2D Compass Graph */}
        <Grid item xs={12} sm={5} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box style={{ position: 'relative', width: '250px', height: '250px', background: 'transparent', borderRadius: '8px', overflow: 'visible', padding: '10px' }}>
            <svg viewBox="0 0 240 240" width="100%" height="100%">
              {/* Quadrant Backgrounds */}
              {/* Top-Left: Auth-Left (Red) */}
              <rect x="10" y="10" width="110" height="110" fill="rgba(239, 83, 80, 0.12)" stroke="rgba(239, 83, 80, 0.3)" strokeWidth="0.75" />
              {/* Top-Right: Auth-Right (Blue) */}
              <rect x="120" y="10" width="110" height="110" fill="rgba(41, 182, 246, 0.12)" stroke="rgba(41, 182, 246, 0.3)" strokeWidth="0.75" />
              {/* Bottom-Left: Lib-Left (Green) */}
              <rect x="10" y="120" width="110" height="110" fill="rgba(102, 187, 106, 0.12)" stroke="rgba(102, 187, 106, 0.3)" strokeWidth="0.75" />
              {/* Bottom-Right: Lib-Right (Purple) */}
              <rect x="120" y="120" width="110" height="110" fill="rgba(171, 71, 188, 0.12)" stroke="rgba(171, 71, 188, 0.3)" strokeWidth="0.75" />

              {/* Sub-grid lines */}
              <line x1="65" y1="10" x2="65" y2="230" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="175" y1="10" x2="175" y2="230" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="10" y1="65" x2="230" y2="65" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="10" y1="175" x2="230" y2="175" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2,2" />

              {/* Major axes */}
              <line x1="120" y1="10" x2="120" y2="230" stroke="rgba(255,255,255,0.3)" strokeWidth="2.0" />
              <line x1="10" y1="120" x2="230" y2="120" stroke="rgba(255,255,255,0.3)" strokeWidth="2.0" />

              {/* Crosshair projections */}
              {(finished || currentIdx > 0) && (
                <g>
                  <line x1="120" y1={120 - (y / 10) * 110} x2={120 + (x / 10) * 110} y2={120 - (y / 10) * 110} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1={120 + (x / 10) * 110} y1="120" x2={120 + (x / 10) * 110} y2={120 - (y / 10) * 110} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
                </g>
              )}

              {/* Current Plotted Dot */}
              <motion.circle
                cx={120 + (x / 10) * 110}
                cy={120 - (y / 10) * 110}
                r="7"
                fill="#FF5252"
                stroke="#fff"
                strokeWidth="2"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.4 }}
                style={{ filter: 'drop-shadow(0 0 5px #ff5252)' }}
              />

              {/* Labels overlay inside SVG */}
              <text x="120" y="8" fill="var(--text-secondary)" fontSize="6.5" fontWeight="800" textAnchor="middle">AUTHORITARIAN</text>
              <text x="120" y="238" fill="var(--text-secondary)" fontSize="6.5" fontWeight="800" textAnchor="middle">LIBERTARIAN</text>
              <text x="8" y="123" fill="var(--text-secondary)" fontSize="6.5" fontWeight="800" textAnchor="start">LEFT</text>
              <text x="232" y="123" fill="var(--text-secondary)" fontSize="6.5" fontWeight="800" textAnchor="end">RIGHT</text>
            </svg>
          </Box>
          <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, mt: 1.5 }}>
            Coordinates: X = {x > 0 ? `+${x}` : x} (Econ) | Y = {y > 0 ? `+${y}` : y} (Social)
          </Typography>
        </Grid>

        {/* Right Side: The Questions / Results */}
        <Grid item xs={12} sm={7}>
          {!finished ? (
            <Box style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" style={{ color: 'var(--primary-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Statement {currentIdx + 1} of {questions.length}
                </Typography>
                <Typography variant="body2" style={{ fontWeight: 800, color: 'var(--text-primary)', mt: 0.5, mb: 2, lineHeight: 1.45 }}>
                  "{questions[currentIdx].text}"
                </Typography>
              </Box>

              <Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button size="small" variant="outlined" onClick={() => handleAnswer(2)} style={{ width: '100%', textTransform: 'none', borderRadius: '8px', color: '#4CAF50', borderColor: 'rgba(76,175,80,0.3)', fontWeight: 800, fontSize: '0.74rem' }}>
                      Strongly Agree
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button size="small" variant="outlined" onClick={() => handleAnswer(1)} style={{ width: '100%', textTransform: 'none', borderRadius: '8px', color: '#81C784', borderColor: 'rgba(129,199,132,0.3)', fontWeight: 800, fontSize: '0.74rem' }}>
                      Agree
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button size="small" variant="outlined" onClick={() => handleAnswer(-1)} style={{ width: '100%', textTransform: 'none', borderRadius: '8px', color: '#E57373', borderColor: 'rgba(229,115,115,0.3)', fontWeight: 800, fontSize: '0.74rem' }}>
                      Disagree
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button size="small" variant="outlined" onClick={() => handleAnswer(-2)} style={{ width: '100%', textTransform: 'none', borderRadius: '8px', color: '#FF5252', borderColor: 'rgba(255,82,82,0.3)', fontWeight: 800, fontSize: '0.74rem' }}>
                      Strongly Disagree
                    </Button>
                  </Grid>
                </Grid>

                {currentIdx > 0 && (
                  <Button size="small" onClick={handleBack} style={{ textTransform: 'none', color: 'var(--text-secondary)', mt: 1.5, display: 'block', margin: '10px auto 0 auto' }}>
                    ← Back to Previous Statement
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Box style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1.5px solid', borderColor: alignment.color, borderRadius: '12px', minHeight: '190px' }}>
                <Typography variant="caption" style={{ color: alignment.color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Political Philosophy Alignment
                </Typography>
                <Typography variant="subtitle1" style={{ fontWeight: 900, color: 'var(--text-primary)', mt: 0.5, mb: 1 }}>
                  {alignment.title}
                </Typography>
                <Typography variant="body2" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.45, mb: 1.5 }}>
                  {alignment.desc}
                </Typography>
                <Divider style={{ backgroundColor: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
                <Typography variant="caption" style={{ color: 'var(--text-primary)', fontWeight: 800, display: 'block' }}>
                  Associated Philosophers:
                </Typography>
                <Typography variant="caption" style={{ color: 'var(--primary-main)', fontWeight: 800 }}>
                  {alignment.philosophers}
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                onClick={handleReset}
                size="small"
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  borderRadius: '8px',
                  textTransform: 'none',
                  marginTop: '12px'
                }}
              >
                Retake Compass Test
              </Button>
            </motion.div>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

// Main Philosophy Lab Page
const PhilosophyLabPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const tabsData = [
    { label: 'Socratic Dialogue', icon: <SchoolIcon sx={{ fontSize: 18 }} />, component: <SocraticDialogueWidget /> },
    { label: 'Truth Table Builder', icon: <TimelineIcon sx={{ fontSize: 18 }} />, component: <TruthTableWidget /> },
    { label: 'Fallacy Matcher', icon: <HelpOutlineIcon sx={{ fontSize: 18 }} />, component: <FallacySorterWidget /> },
    { label: 'Ship of Theseus', icon: <BookIcon sx={{ fontSize: 18 }} />, component: <ShipOfTheseusWidget /> },
    { label: 'Trolley Problem', icon: <PlayIcon sx={{ fontSize: 18 }} />, component: <TrolleyProblemWidget /> },
    { label: "Plato's Cave", icon: <PsychologyIcon sx={{ fontSize: 18 }} />, component: <PlatosCaveWidget /> },
    { label: 'Political Compass', icon: <ExploreIcon sx={{ fontSize: 18 }} />, component: <PoliticalCompassWidget /> }
  ];

  return (
    <Box className="learning-content-page" style={{ minHeight: 'auto', padding: '24px 0', background: 'var(--background-default)' }}>
      <Container maxWidth="md">
        
        {/* Header */}
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            style={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 800,
              color: 'var(--text-primary)',
              borderColor: 'rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.01)',
              fontFamily: '"Outfit", sans-serif'
            }}
          >
            Back to Roadmap
          </Button>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AutoAwesomeIcon style={{ color: 'var(--primary-main)' }} />
            <Typography variant="h6" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: 'var(--text-primary)' }}>
              Interactive Philosophy Lab
            </Typography>
          </Box>
        </Box>

        {/* Tab Selection */}
        <Box className="path-sections-tabs glass-panel" sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {tabsData.map((tab, idx) => (
              <Tab
                key={idx}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'none', fontWeight: 800 }}>
                    {tab.icon}
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Widget Viewport */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {tabsData[activeTab].component}
          </motion.div>
        </AnimatePresence>

      </Container>
    </Box>
  );
};

export default PhilosophyLabPage;

