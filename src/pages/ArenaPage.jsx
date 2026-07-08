import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Container, Grid, LinearProgress, Chip, Avatar, Tooltip } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Bolt as BoltIcon,
  Shield as ShieldIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
  Leaderboard as LeaderboardIcon,
  SportsKabaddi as BattleIcon,
  WorkspacePremium as PremiumIcon,
  ArrowForward as ArrowIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FlashOn as FlashOnIcon,
  BarChart as BarChartIcon,
  Whatshot as WhatshotIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import './ArenaPage.css';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const LEADERBOARD = [
  { rank: 1, name: 'Aria Chen',      xp: 18420, wins: 142, avatar: 'A', streak: 23, badge: 'Grandmaster' },
  { rank: 2, name: 'Marcus Webb',    xp: 16830, wins: 128, avatar: 'M', streak: 17, badge: 'Diamond'     },
  { rank: 3, name: 'Leila Torres',   xp: 15910, wins: 119, avatar: 'L', streak: 14, badge: 'Diamond'     },
  { rank: 4, name: 'Yusuf Al-Amin',  xp: 13200, wins: 104, avatar: 'Y', streak: 9,  badge: 'Platinum'    },
  { rank: 5, name: 'Sofia Nakamura', xp: 11750, wins: 97,  avatar: 'S', streak: 7,  badge: 'Platinum'    },
  { rank: 6, name: 'Omar Haddad',    xp: 10300, wins: 88,  avatar: 'O', streak: 5,  badge: 'Gold'        },
  { rank: 7, name: 'Priya Sharma',   xp: 9880,  wins: 82,  avatar: 'P', streak: 4,  badge: 'Gold'        },
  { rank: 8, name: 'Lucas Mendes',   xp: 8450,  wins: 71,  avatar: 'L', streak: 3,  badge: 'Silver'      },
];

const LIVE_BATTLES = [
  { id: 1, p1: 'Aria Chen',      p2: 'Marcus Webb',   topic: 'Cybersecurity',      timeLeft: '02:14', p1Score: 7, p2Score: 5, spectators: 84  },
  { id: 2, p1: 'Leila Torres',   p2: 'Yusuf Al-Amin', topic: 'AI & Machine Lrng.', timeLeft: '04:38', p1Score: 4, p2Score: 6, spectators: 51  },
  { id: 3, p1: 'Sofia Nakamura', p2: 'Omar Haddad',   topic: 'Data Structures',    timeLeft: '01:02', p1Score: 9, p2Score: 9, spectators: 123 },
];

const TOURNAMENTS = [
  { id: 1, title: 'Cyber Masters Cup',     prize: '5,000 XP',  slots: 64, filled: 61, start: 'In 3h',   color: '#FF4C6A', icon: <ShieldIcon /> },
  { id: 2, title: 'Algorithm Olympiad',    prize: '3,500 XP',  slots: 32, filled: 28, start: 'In 11h',  color: '#3D5CFF', icon: <BoltIcon />   },
  { id: 3, title: 'Logic League Weekly',   prize: '2,000 XP',  slots: 128, filled: 94, start: 'Tomorrow',color: '#8B5CF6', icon: <StarIcon />  },
  { id: 4, title: 'Philosophy Gauntlet',   prize: '1,800 XP',  slots: 32, filled: 11, start: 'In 2d',   color: '#FF9F43', icon: <TrophyIcon /> },
];

const MATCH_HISTORY = [
  { opp: 'Marcus Webb',   topic: 'Networking',       result: 'win',  score: '8–4', xp: +180, ago: '12m ago'   },
  { opp: 'Priya Sharma',  topic: 'Binary Trees',     result: 'loss', score: '5–9', xp: -20,  ago: '1h ago'    },
  { opp: 'Lucas Mendes',  topic: 'OS Fundamentals',  result: 'win',  score: '10–6',xp: +220, ago: '3h ago'    },
  { opp: 'Omar Haddad',   topic: 'Web Security',     result: 'win',  score: '7–3', xp: +160, ago: 'Yesterday' },
  { opp: 'Leila Torres',  topic: 'AI Ethics',        result: 'loss', score: '4–8', xp: -20,  ago: '2d ago'    },
];

const MODES = [
  { id: 'quick',      label: 'Quick Duel',      icon: <BoltIcon />,     desc: '10 questions · 5 min',     color: '#3D5CFF' },
  { id: 'ranked',     label: 'Ranked Match',    icon: <TrophyIcon />,   desc: 'Earn/lose rank points',    color: '#FF4C6A' },
  { id: 'blitz',      label: 'Blitz Mode',      icon: <FlashOnIcon />,  desc: '5 questions · 90 seconds', color: '#FF9F43' },
  { id: 'marathon',   label: 'Marathon',        icon: <BarChartIcon />, desc: '30 questions · no timer',  color: '#8B5CF6' },
];

const BADGE_COLOR = {
  Grandmaster: '#FF9F43',
  Diamond:     '#3D5CFF',
  Platinum:    '#8B5CF6',
  Gold:        '#FFB547',
  Silver:      '#A0A0C0',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const PulsingDot = ({ color }) => (
  <span className="arena-pulse-dot" style={{ '--dot-color': color }} />
);

const StatPill = ({ icon, label, value, color }) => (
  <div className="arena-stat-pill" style={{ '--pill-color': color }}>
    <span className="arena-stat-pill-icon">{icon}</span>
    <div>
      <div className="arena-stat-pill-value">{value}</div>
      <div className="arena-stat-pill-label">{label}</div>
    </div>
  </div>
);

const LiveBattleCard = ({ battle }) => {
  const total = battle.p1Score + battle.p2Score || 1;
  const p1Pct = Math.round((battle.p1Score / total) * 100);
  return (
    <div className="arena-live-card">
      <div className="arena-live-card-header">
        <span className="arena-live-badge"><PulsingDot color="#FF4C6A" /> LIVE</span>
        <span className="arena-live-topic">{battle.topic}</span>
        <span className="arena-live-spectators"><PeopleIcon sx={{ fontSize: 14 }} /> {battle.spectators}</span>
      </div>
      <div className="arena-live-vs">
        <div className="arena-live-player">
          <Avatar className="arena-live-avatar arena-live-avatar--p1">{battle.p1[0]}</Avatar>
          <div>
            <div className="arena-live-name">{battle.p1}</div>
            <div className="arena-live-score">{battle.p1Score}</div>
          </div>
        </div>
        <div className="arena-live-center">
          <div className="arena-live-vs-label">VS</div>
          <div className="arena-live-timer"><TimerIcon sx={{ fontSize: 14 }} /> {battle.timeLeft}</div>
        </div>
        <div className="arena-live-player arena-live-player--right">
          <div className="arena-live-player-info--right">
            <div className="arena-live-name">{battle.p2}</div>
            <div className="arena-live-score">{battle.p2Score}</div>
          </div>
          <Avatar className="arena-live-avatar arena-live-avatar--p2">{battle.p2[0]}</Avatar>
        </div>
      </div>
      <div className="arena-live-progress-track">
        <div className="arena-live-progress-fill" style={{ width: `${p1Pct}%` }} />
      </div>
      <button className="arena-live-watch-btn">Watch Battle <ArrowIcon sx={{ fontSize: 14 }} /></button>
    </div>
  );
};

const TournamentCard = ({ t, idx }) => {
  const pct = Math.round((t.filled / t.slots) * 100);
  return (
    <div className="arena-tournament-card" style={{ '--t-color': t.color, animationDelay: `${idx * 0.07}s` }}>
      <div className="arena-tournament-accent" style={{ background: t.color }} />
      <div className="arena-tournament-icon-wrap" style={{ background: `${t.color}20` }}>
        <span style={{ color: t.color }}>{t.icon}</span>
      </div>
      <div className="arena-tournament-body">
        <div className="arena-tournament-title">{t.title}</div>
        <div className="arena-tournament-meta">
          <span className="arena-tournament-prize"><TrophyIcon sx={{ fontSize: 13 }} /> {t.prize}</span>
          <span className="arena-tournament-start"><TimerIcon sx={{ fontSize: 13 }} /> {t.start}</span>
        </div>
        <div className="arena-tournament-slots">
          <div className="arena-tournament-slots-bar">
            <div className="arena-tournament-slots-fill" style={{ width: `${pct}%`, background: t.color }} />
          </div>
          <span className="arena-tournament-slots-text">{t.filled}/{t.slots} slots</span>
        </div>
      </div>
      <button className="arena-tournament-join-btn" style={{ '--t-color': t.color }}>Join</button>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ArenaPage = () => {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState('quick');
  const [lbPeriod, setLbPeriod] = useState('weekly');
  const [searching, setSearching] = useState(false);
  const [searchDots, setSearchDots] = useState(0);
  const [activeTab, setActiveTab] = useState('live');
  const heroRef = useRef(null);

  // Animated searching dots
  useEffect(() => {
    if (!searching) return;
    const t = setInterval(() => setSearchDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, [searching]);

  // Parallax on hero
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      heroRef.current.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userStats = {
    rank: 12,
    xp: 7840,
    wins: 61,
    losses: 18,
    streak: 5,
    badge: 'Gold',
    winRate: Math.round((61 / (61 + 18)) * 100),
  };

  return (
    <div className="arena-root">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="arena-hero">
        <div className="arena-hero-bg" ref={heroRef} />
        <div className="arena-hero-grid" />
        <div className="arena-hero-content">
          <div className="arena-hero-badge">
            <WhatshotIcon sx={{ fontSize: 16 }} />
            <span>Battle Season 3 · Active Now</span>
          </div>
          <h1 className="arena-hero-title">
            Knowledge<br />
            <span className="arena-hero-title-accent">Arena</span>
          </h1>
          <p className="arena-hero-subtitle">
            Challenge real players. Climb the ranks. Prove your mastery.
          </p>
          <div className="arena-hero-stats">
            <StatPill icon={<PeopleIcon sx={{ fontSize: 18 }} />}  label="Online Now"  value="1,284"   color="#3DDC97" />
            <StatPill icon={<BattleIcon sx={{ fontSize: 18 }} />}  label="Live Battles" value="347"    color="#3D5CFF" />
            <StatPill icon={<TrophyIcon sx={{ fontSize: 18 }} />}  label="Tournaments"  value="4 Active" color="#FF9F43" />
          </div>
        </div>
        <div className="arena-hero-orbs">
          <div className="arena-orb arena-orb--1" />
          <div className="arena-orb arena-orb--2" />
          <div className="arena-orb arena-orb--3" />
        </div>
      </div>

      <Container maxWidth="xl" className="arena-container">
        {/* ── Your Arena Card ─────────────────────────────────────────────── */}
        <div className="arena-player-card">
          <div className="arena-player-card-bg" />
          <div className="arena-player-left">
            <div className="arena-player-avatar-wrap">
              <Avatar className="arena-player-avatar">{user?.username?.[0]?.toUpperCase() || 'Y'}</Avatar>
              <div className="arena-player-badge-bubble" style={{ background: BADGE_COLOR[userStats.badge] }}>
                {userStats.badge}
              </div>
            </div>
            <div className="arena-player-info">
              <div className="arena-player-name">{user?.username || 'You'}</div>
              <div className="arena-player-rank">Arena Rank #{userStats.rank}</div>
              <div className="arena-player-xp-row">
                <span className="arena-player-xp">{userStats.xp.toLocaleString()} XP</span>
                <span className="arena-player-streak">
                  <FireIcon sx={{ fontSize: 14, color: '#FF9F43' }} /> {userStats.streak} win streak
                </span>
              </div>
            </div>
          </div>
          <div className="arena-player-stats-row">
            {[
              { label: 'Wins',    value: userStats.wins     },
              { label: 'Losses',  value: userStats.losses   },
              { label: 'Win Rate',value: `${userStats.winRate}%` },
            ].map(s => (
              <div key={s.label} className="arena-player-stat">
                <div className="arena-player-stat-value">{s.value}</div>
                <div className="arena-player-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="arena-player-xp-progress">
            <div className="arena-player-xp-label">
              <span>Progress to Platinum</span>
              <span>{userStats.xp.toLocaleString()} / 10,000 XP</span>
            </div>
            <div className="arena-player-xp-track">
              <div className="arena-player-xp-fill" style={{ width: `${(userStats.xp / 10000) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* ── Battle Mode Selector + Find Match ──────────────────────────── */}
        <div className="arena-section-title">
          <BoltIcon /> Choose Your Mode
        </div>
        <div className="arena-modes-grid">
          {MODES.map(mode => (
            <div
              key={mode.id}
              className={`arena-mode-card${selectedMode === mode.id ? ' arena-mode-card--active' : ''}`}
              style={{ '--mode-color': mode.color }}
              onClick={() => setSelectedMode(mode.id)}
            >
              <div className="arena-mode-icon-wrap">{mode.icon}</div>
              <div className="arena-mode-label">{mode.label}</div>
              <div className="arena-mode-desc">{mode.desc}</div>
              {selectedMode === mode.id && <div className="arena-mode-selected-ring" />}
            </div>
          ))}
        </div>

        <div className="arena-find-match-row">
          <div className="arena-find-match-info">
            <span className="arena-find-match-mode">
              {MODES.find(m => m.id === selectedMode)?.label}
            </span>
            <span className="arena-find-match-desc">
              {MODES.find(m => m.id === selectedMode)?.desc}
            </span>
          </div>
          <button
            className={`arena-find-btn${searching ? ' arena-find-btn--searching' : ''}`}
            onClick={() => setSearching(s => !s)}
          >
            {searching ? (
              <>
                <span className="arena-find-btn-spinner" />
                Searching{'.'.repeat(searchDots)}
              </>
            ) : (
              <>
                <BattleIcon /> Find Match
              </>
            )}
          </button>
        </div>

        {/* ── Main Two-Column Layout ──────────────────────────────────────── */}
        <div className="arena-main-layout">
          {/* LEFT: Live Battles + Tournaments */}
          <div className="arena-main-left">
            {/* Tabs */}
            <div className="arena-tabs">
              {[
                { id: 'live',        label: 'Live Battles',  icon: <PulsingDot color="#FF4C6A" /> },
                { id: 'tournaments', label: 'Tournaments',   icon: <TrophyIcon sx={{ fontSize: 14 }} /> },
                { id: 'history',     label: 'Match History', icon: <BarChartIcon sx={{ fontSize: 14 }} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`arena-tab${activeTab === tab.id ? ' arena-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'live' && (
              <div className="arena-live-battles">
                {LIVE_BATTLES.map(b => <LiveBattleCard key={b.id} battle={b} />)}
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="arena-tournaments-list">
                {TOURNAMENTS.map((t, i) => <TournamentCard key={t.id} t={t} idx={i} />)}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="arena-history-list">
                {MATCH_HISTORY.map((m, i) => (
                  <div key={i} className={`arena-history-row arena-history-row--${m.result}`}>
                    <div className={`arena-history-result-badge arena-history-result-badge--${m.result}`}>
                      {m.result === 'win' ? <CheckIcon sx={{ fontSize: 14 }} /> : <CloseIcon sx={{ fontSize: 14 }} />}
                      {m.result.toUpperCase()}
                    </div>
                    <div className="arena-history-main">
                      <div className="arena-history-opp">vs <strong>{m.opp}</strong></div>
                      <div className="arena-history-topic">{m.topic}</div>
                    </div>
                    <div className="arena-history-score">{m.score}</div>
                    <div className={`arena-history-xp${m.xp > 0 ? ' arena-history-xp--pos' : ' arena-history-xp--neg'}`}>
                      {m.xp > 0 ? '+' : ''}{m.xp} XP
                    </div>
                    <div className="arena-history-ago">{m.ago}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Leaderboard */}
          <div className="arena-main-right">
            <div className="arena-lb-header">
              <div className="arena-section-title" style={{ marginBottom: 0 }}>
                <LeaderboardIcon /> Leaderboard
              </div>
              <div className="arena-lb-period-toggle">
                {['weekly', 'alltime'].map(p => (
                  <button
                    key={p}
                    className={`arena-lb-period-btn${lbPeriod === p ? ' arena-lb-period-btn--active' : ''}`}
                    onClick={() => setLbPeriod(p)}
                  >
                    {p === 'weekly' ? 'Weekly' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 3 podium */}
            <div className="arena-podium">
              {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((p, i) => {
                const heights  = ['160px', '200px', '140px'];
                const offsets  = ['20px', '0px', '30px'];
                const labels   = ['2nd', '1st', '3rd'];
                const podColors= ['#A8EDFF', '#FFD700', '#D0D0E0'];
                return (
                  <div key={p.rank} className="arena-podium-slot" style={{ marginTop: offsets[i] }}>
                    <div className="arena-podium-avatar-wrap">
                      <Avatar className="arena-podium-avatar" style={{ width: i === 1 ? 56 : 44, height: i === 1 ? 56 : 44 }}>
                        {p.avatar}
                      </Avatar>
                      {i === 1 && <PremiumIcon className="arena-podium-crown" />}
                    </div>
                    <div className="arena-podium-name">{p.name.split(' ')[0]}</div>
                    <div className="arena-podium-xp">{(p.xp / 1000).toFixed(1)}k</div>
                    <div
                      className="arena-podium-bar"
                      style={{ height: heights[i], background: `${podColors[i]}15`, borderColor: `${podColors[i]}44` }}
                    >
                      <div className="arena-podium-rank-label" style={{ color: podColors[i] }}>{labels[i]}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ranks 4–8 */}
            <div className="arena-lb-list">
              {LEADERBOARD.slice(3).map((p, i) => (
                <div key={p.rank} className="arena-lb-row" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="arena-lb-rank">#{p.rank}</div>
                  <Avatar className="arena-lb-avatar">{p.avatar}</Avatar>
                  <div className="arena-lb-info">
                    <div className="arena-lb-name">{p.name}</div>
                    <div className="arena-lb-badge-chip" style={{ background: BADGE_COLOR[p.badge] }}>
                      {p.badge}
                    </div>
                  </div>
                  <div className="arena-lb-right">
                    <div className="arena-lb-xp">{p.xp.toLocaleString()}</div>
                    <div className="arena-lb-wins">{p.wins}W</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Challenge a Friend Banner ─────────────────────────────────── */}
        <div className="arena-challenge-banner">
          <div className="arena-challenge-banner-bg" />
          <div className="arena-challenge-banner-content">
            <div className="arena-challenge-banner-icon"><BattleIcon /></div>
            <div>
              <div className="arena-challenge-banner-title">Challenge a Friend</div>
              <div className="arena-challenge-banner-sub">Send a direct battle invite — anytime, any topic</div>
            </div>
          </div>
          <button className="arena-challenge-banner-btn">
            Send Invite <ArrowIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </Container>
    </div>
  );
};

export default ArenaPage;
