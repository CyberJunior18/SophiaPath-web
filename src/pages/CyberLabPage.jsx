import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Terminal, Database,
  Code, Globe, KeyRound, Activity, Lock, UserX, FileTerminal
} from 'lucide-react';
import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import ChallengePage from './ChallengePage';
import DenialOfServiceLab from './DenialOfServiceLab';
import DistributedDenialOfServiceLab from './DistributedDenialOfServiceLab';
import CaesarCipherExplorer from './CaesarCipherExplorer';
import EnigmaMachine from './EnigmaMachine';
import VigenereCipherExplorer from './VigenereCipherExplorer';
import RSAVisualizer from './RSAVisualizer';
import Base64Visualizer from './Base64Visualizer';
import XORVisualizer from './XORVisualizer';
import './CyberLabPage.css';

// Explanation box
function ExplanationBox({ isSecure, children }) {
  return (
    <div className={`cyber-explanation-box mt-8 border-l-4 p-4 rounded-r-lg ${isSecure ? 'border-emerald-500 bg-emerald-950/20' : 'border-red-500 bg-red-950/20'}`} style={{ borderLeft: '4px solid', padding: '16px', borderRadius: '0 12px 12px 0', marginTop: '24px', textAlign: 'left' }}>
      <h4 className="font-bold flex items-center gap-2 mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '8px', color: isSecure ? '#3DDC97' : '#FF647C' }}>
        {isSecure ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        {isSecure ? "How the Fix Works" : "Understanding the Vulnerability"}
      </h4>
      <div className="text-sm text-slate-300 leading-relaxed" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// Lab layout wrapper
function LabLayout({ title, isSecure, children }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ textAlign: 'left' }}>
      <div className="mb-6 border-b border-slate-700 pb-4" style={{ borderBottom: '1px solid var(--divider)', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 className="text-3xl font-black mb-2" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{title}</h1>
        <p className="text-slate-400" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          State: {isSecure ? (
            <span className="text-emerald-400 font-bold bg-emerald-900/30 px-2 py-0.5 rounded" style={{ color: '#3DDC97', background: 'rgba(61, 220, 151, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>Secure & Patched</span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/30 px-2 py-0.5 rounded" style={{ color: '#FF647C', background: 'rgba(255, 100, 124, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>Vulnerable to Attack</span>
          )}
        </p>
      </div>

      <div className="mb-8">
        {children}
      </div>
    </div>
  );
}

// 1. Cross-Site Scripting (XSS) Lab
function XSSLab({ isSecure, showAlert }) {
  const [input, setInput] = useState('');
  const [submittedText, setSubmittedText] = useState('');

  const handleSimulate = (e) => {
    e.preventDefault();
    setSubmittedText(input);

    // Simulate browser parsing script tags
    if (!isSecure && input.toLowerCase().includes('<script>')) {
      // Extract the content inside alert('') for the simulation
      const match = input.match(/alert\(['"]([^'"]+)['"]\)/);
      const alertMsg = match ? match[1] : "XSS Payload Executed!";
      setTimeout(() => showAlert(alertMsg, 'danger'), 300);
    }
  };

  return (
    <LabLayout title="Reflected Cross-Site Scripting (XSS)" isSecure={isSecure}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div>
          <h3 className="text-lg font-bold mb-2" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Target Application</h3>
          <div className="cyber-lab-card">
            <p className="text-sm text-slate-400 mb-4" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Search our forums for topics. Your search query will be displayed back to you.</p>

            <form onSubmit={handleSimulate} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search..."
                className="cyber-lab-input"
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button type="submit" className="cyber-lab-button">
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setInput('React Tutorials')} className="cyber-lab-tab-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid var(--divider)', background: 'var(--background-default)', color: 'var(--text-primary)', borderRadius: '8px' }}>Normal Input</button>
              <button onClick={() => setInput("<script>alert('You are hacked!')</script>")} className="cyber-lab-tab-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid #FF647C', background: 'rgba(255,100,124,0.1)', color: '#FF647C', borderRadius: '8px' }}>
                Malicious Payload
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Simulated Browser View</h3>
          <div className="cyber-browser-mock">
            <div className="cyber-browser-header">
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
              </div>
              <div className="cyber-browser-url">
                http://vulnerable-site.com/search?q={encodeURIComponent(submittedText.substring(0, 30))}...
              </div>
            </div>
            <div className="cyber-browser-body">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Search Results</h2>
              {submittedText ? (
                <p style={{ color: '#334155', fontSize: '0.95rem' }}>
                  You searched for: {' '}
                  {isSecure ? (
                    <span style={{ backgroundColor: '#fef08a', padding: '2px 6px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#1e293b', border: '1px solid #eab308', borderRadius: '4px' }}>
                      {submittedText}
                    </span>
                  ) : (
                    <span
                      style={{ fontWeight: 'bold', color: '#dc2626' }}
                      dangerouslySetInnerHTML={{ __html: submittedText.replace(/<script>.*<\/script>/gi, '<span style="font-style: italic; color: #dc2626; border: 1px solid #fca5a5; background-color: #fee2e2; padding: 4px; border-radius: 4px;">[Invisible Script Tag Executed]</span>') }}
                    />
                  )}
                </p>
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>Enter a search query...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p style={{ marginBottom: '8px' }}><strong>Fix: Context-Aware Output Encoding.</strong> Before displaying untrusted data, the application converts special characters into their safe HTML entities (e.g., <code>&lt;</code> becomes <code>&amp;lt;</code>). The browser treats it as text, not code.</p>
            <pre className="cyber-lab-terminal" style={{ fontSize: '0.75rem', minHeight: 'auto', background: '#0e111d' }}><code>{`// PHP Example
$safeInput = htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8');
echo "You searched for: " . $safeInput;

// React Example (Safe by default)
<div>You searched for: {query}</div>`}</code></pre>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '8px' }}><strong>Flaw: Missing Output Sanitization.</strong> The application takes user input and injects it directly into the HTML structure. When a user inputs a <code>&lt;script&gt;</code> tag, the victim's browser executes it as part of the page.</p>
            <pre className="cyber-lab-terminal" style={{ fontSize: '0.75rem', minHeight: 'auto', background: '#0e111d' }}><code>{`// VULNERABLE PHP
echo "You searched for: " . $_GET['q'];

// VULNERABLE React
<div dangerouslySetInnerHTML={{ __html: query }} />`}</code></pre>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// 2. SQL Injection (SQLi) Lab
function SQLiLab({ isSecure }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username && !password) return;

    if (!isSecure) {
      const manipulatedQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
      if (manipulatedQuery.includes("' OR '1'='1") || manipulatedQuery.includes("' OR 1=1--")) {
        setResult({ success: true, message: "Welcome back, Administrator (Bypass Successful!)" });
      } else if (username === 'admin' && password === 'password123') {
        setResult({ success: true, message: "Welcome back, Admin" });
      } else {
        setResult({ success: false, message: "Invalid credentials" });
      }
    } else {
      if (username === 'admin' && password === 'password123') {
        setResult({ success: true, message: "Welcome back, Admin" });
      } else {
        setResult({ success: false, message: "Invalid credentials" });
      }
    }
  };

  return (
    <LabLayout title="SQL Injection (Authentication Bypass)" isSecure={isSecure}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div>
          <h3 className="text-lg font-bold mb-2" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Login Portal</h3>
          <div className="cyber-lab-card">
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="cyber-lab-input"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-lab-input"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <button type="submit" className="cyber-lab-button" style={{ marginTop: '8px' }}>
                Login
              </button>
            </form>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--divider)' }}>
              <button onClick={() => { setUsername('admin'); setPassword('password123'); }} className="cyber-lab-tab-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid var(--divider)', background: 'var(--background-default)', color: 'var(--text-primary)', borderRadius: '8px' }}>Normal User</button>
              <button onClick={() => { setUsername("admin' OR '1'='1"); setPassword(""); }} className="cyber-lab-tab-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid #FF647C', background: 'rgba(255,100,124,0.1)', color: '#FF647C', borderRadius: '8px' }}>
                SQLi Payload
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Database Engine</h3>
          <div className="cyber-lab-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left' }}>Executed Query:</div>

            {isSecure ? (
              <div className="cyber-lab-terminal" style={{ color: '#38bdf8', marginBottom: '16px' }}>
                SELECT * FROM users <br />
                WHERE username = <span style={{ color: '#f59e0b' }}>$1</span> <br />
                AND password = <span style={{ color: '#f59e0b' }}>$2</span><br /><br />
                <span style={{ color: 'var(--text-disabled)' }}>
                  Parameters binding:<br />
                  $1 = "{username}"<br />
                  $2 = "{password}"
                </span>
              </div>
            ) : (
              <div className="cyber-lab-terminal" style={{ color: '#818cf8', marginBottom: '16px' }}>
                SELECT * FROM users <br />
                WHERE username = '<span style={{ color: username.includes("' OR") ? '#f87171' : '#f59e0b', fontWeight: username.includes("' OR") ? 'bold' : 'normal' }}>{username}</span>' <br />
                AND password = '<span style={{ color: '#f59e0b' }}>{password}</span>'
              </div>
            )}

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left', marginTop: 'auto' }}>Result:</div>
            {result ? (
              <div className={`p-3 rounded font-bold`} style={{ padding: '12px', borderRadius: '8px', fontWeight: 800, border: '1px solid', color: result.success ? '#FF647C' : 'var(--text-primary)', backgroundColor: result.success ? 'rgba(255, 100, 124, 0.15)' : 'var(--background-default)', borderColor: result.success ? '#FF647C' : 'var(--divider)' }}>
                {result.message}
              </div>
            ) : (
              <div style={{ padding: '12px', background: 'var(--background-default)', border: '1px solid var(--divider)', color: 'var(--text-disabled)', borderRadius: '8px', fontStyle: 'italic', textAlign: 'center' }}>
                Waiting for execution...
              </div>
            )}
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p style={{ marginBottom: '8px' }}><strong>Fix: Parameterized Queries (Prepared Statements).</strong> The database engine treats the user input purely as data, not as executable code. Even if the input contains SQL commands like <code>' OR '1'='1</code>, it searches for a user literally named that, neutralizing the attack.</p>
            <pre className="cyber-lab-terminal" style={{ fontSize: '0.75rem', minHeight: 'auto', background: '#0e111d' }}><code>{`// Secure Node.js/Postgres Example
const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
const values = [username, password];
await db.query(query, values);`}</code></pre>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '8px' }}><strong>Flaw: String Concatenation.</strong> User input is pasted directly into the database query. An attacker can use quote characters (<code>'</code>) to break out of the intended string and inject new SQL logic, such as appending <code>OR '1'='1'</code>, which always evaluates to true, bypassing the password check entirely.</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// 3. Command Injection Lab
function CommandInjectionLab({ isSecure }) {
  const [ip, setIp] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePing = (e) => {
    e.preventDefault();
    if (!ip) return;
    setLoading(true);
    setOutput('');

    setTimeout(() => {
      setLoading(false);
      if (isSecure) {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (ipRegex.test(ip)) {
          setOutput(`PING ${ip} (${ip}) 56(84) bytes of data.\n64 bytes from ${ip}: icmp_seq=1 ttl=117 time=14.2 ms\n64 bytes from ${ip}: icmp_seq=2 ttl=117 time=14.5 ms`);
        } else {
          setOutput(`Error: Invalid IP address format. Allowed characters: numbers and dots only.`);
        }
      } else {
        let simulatedOutput = `PING ${ip.split(';')[0]} 56(84) bytes of data.\n64 bytes from ${ip.split(';')[0]}: icmp_seq=1 ttl=117 time=14.2 ms\n`;
        if (ip.includes('cat /etc/passwd')) {
          simulatedOutput += `\nroot:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nadmin:x:1000:1000::/home/admin:/bin/bash`;
        } else if (ip.includes('ls')) {
          simulatedOutput += `\nindex.php\nconfig.php\nutils.php`;
        }
        setOutput(simulatedOutput);
      }
    }, 600);
  };

  return (
    <LabLayout title="OS Command Injection" isSecure={isSecure}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div>
          <h3 className="text-lg font-bold mb-2" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Admin Diagnostic Tool</h3>
          <div className="cyber-lab-card">
            <p className="text-sm text-slate-400 mb-4" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Enter an IP address to check network connectivity using the system <code>ping</code> utility.</p>

            <form onSubmit={handlePing} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 8.8.8.8"
                className="cyber-lab-input"
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button type="submit" disabled={loading} className="cyber-lab-button" style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Pinging...' : 'Ping'}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setIp('8.8.8.8')} className="cyber-lab-tab-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid var(--divider)', background: 'var(--background-default)', color: 'var(--text-primary)', borderRadius: '8px' }}>Normal IP</button>
              <button onClick={() => setIp('8.8.8.8; cat /etc/passwd')} className="cyber-lab-tab-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid #FF647C', background: 'rgba(255,100,124,0.1)', color: '#FF647C', borderRadius: '8px' }}>
                Inject Linux Command (;)
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Server Terminal</h3>
          <div className="cyber-lab-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)' }}>
              <FileTerminal size={14} style={{ color: 'var(--text-secondary)' }} />
              <Typography style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>bash console</Typography>
            </div>
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="cyber-lab-terminal" style={{ flex: 1, color: output.includes('root:x:') && !isSecure ? '#ef4444' : '#00ff66' }}>
                <div style={{ color: 'var(--text-disabled)', marginBottom: '8px' }}>
                  $ ping -c 2 {isSecure && ip ? <span>{ip.replace(/[^0-9.]/g, '')}</span> : <span style={{ color: ip.includes(';') ? '#ef4444' : '#eab308' }}>{ip}</span>}
                </div>
                {loading ? <span className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Executing command...</span> : output}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p style={{ marginBottom: '8px' }}><strong>Fix: Input Validation and API Usage.</strong> The server validates the input using a strict Regex to ensure it only contains an IP address. Even better, secure applications avoid calling OS shells entirely, relying on built-in language libraries instead of <code>exec()</code>.</p>
            <pre className="cyber-lab-terminal" style={{ fontSize: '0.75rem', minHeight: 'auto', background: '#0e111d' }}><code>{`// PHP Secure Example
if (filter_var($ip, FILTER_VALIDATE_IP)) {
    // Only execute if perfectly matches an IP
    system("ping -c 2 " . escapeshellarg($ip));
} else {
    echo "Invalid IP";
}`}</code></pre>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '8px' }}><strong>Flaw: Unsafe OS Calls.</strong> The application passes user input directly to a system shell command (like <code>exec("ping " + ip)</code>). Attackers use shell metacharacters like <code>;</code>, <code>|</code>, or <code>&&</code> to terminate the first command and append their own malicious system commands (e.g., reading sensitive files).</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// 4. Cross-Site Request Forgery (CSRF) Lab
function CSRFLab({ isSecure, showAlert }) {
  const [balance, setBalance] = useState(5000);
  const [history, setHistory] = useState([]);

  const handleMaliciousClick = () => {
    if (isSecure) {
      showAlert("Attack Blocked! Missing or invalid Anti-CSRF token in the request payload.", "info");
    } else {
      if (balance >= 1000) {
        setBalance(prev => prev - 1000);
        setHistory(prev => [{ to: 'Attacker_Wallet', amount: 1000, date: new Date().toLocaleTimeString() }, ...prev]);
        showAlert("Uh oh! $1000 was silently transferred from your account while you were browsing the other site.", "danger");
      } else {
        showAlert("Insufficient funds to steal.", "info");
      }
    }
  };

  const handleLegitTransfer = (e) => {
    e.preventDefault();
    if (balance >= 100) {
      setBalance(prev => prev - 100);
      setHistory(prev => [{ to: 'Utility_Bill', amount: 100, date: new Date().toLocaleTimeString() }, ...prev]);
    }
  };

  return (
    <LabLayout title="Cross-Site Request Forgery (CSRF)" isSecure={isSecure}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>Context: You are currently logged into your bank in Tab 1. You open a malicious link sent via email in Tab 2.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* The Bank (Victim Site) */}
        <div>
          <div className="cyber-browser-mock" style={{ minHeight: '340px' }}>
            <div className="cyber-browser-header" style={{ backgroundColor: '#1e3a8a20', color: '#1e3a8a' }}>
              <Globe size={14} style={{ color: '#3b82f6' }} />
              <span style={{ fontWeight: 'bold' }}>my-bank.com (Tab 1)</span>
            </div>
            <div className="cyber-browser-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Current Balance:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>${balance}</span>
              </div>

              <form onSubmit={handleLegitTransfer}>
                {isSecure && <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', background: '#f1f5f9', padding: '4px', border: '1px solid #cbd5e1', marginBottom: '8px', display: 'inline-block', borderRadius: '4px' }}>Hidden input: csrf_token="a8f93j..."</div>}
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Pay Utility Bill ($100)
                </button>
              </form>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Recent Transfers</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {history.length === 0 && <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No recent activity.</span>}
                  {history.map((tx, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <span style={{ color: tx.to === 'Attacker_Wallet' ? '#ef4444' : '#475569', fontWeight: 600 }}>To: {tx.to}</span>
                      <span style={{ fontWeight: 800, color: '#475569' }}>-${tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Attacker Site */}
        <div>
          <div className="cyber-browser-mock" style={{ minHeight: '340px', borderColor: '#fca5a5' }}>
            <div className="cyber-browser-header" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              <Globe size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontWeight: 'bold' }}>free-gifts-online.net (Tab 2)</span>
            </div>
            <div className="cyber-browser-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '260px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 950, color: '#991b1b', marginBottom: '8px' }}>🎉 You Won a Prize! 🎉</h2>
              <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>Click the button below to claim your free gift card!</p>

              <button
                onClick={handleMaliciousClick}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 900,
                  padding: '12px 28px',
                  borderRadius: '999px',
                  boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                CLAIM PRIZE NOW
              </button>

              <div style={{ marginTop: '24px', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '9px', fontFamily: 'monospace', color: '#64748b', textAlign: 'left' }}>
                // Hidden Attacker HTML:<br />
                &lt;form action="http://my-bank.com/transfer" method="POST"&gt;<br />
                &nbsp;&nbsp;&lt;input type="hidden" name="to" value="Attacker"&gt;<br />
                &nbsp;&nbsp;&lt;input type="hidden" name="amount" value="1000"&gt;<br />
                &lt;/form&gt;
              </div>
            </div>
          </div>
        </div>

      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p><strong>Fix: Anti-CSRF Tokens.</strong> The server generates a unique, unpredictable token when the bank page loads. The browser must submit this token with the transfer request. The attacker site cannot read this token (due to the Same-Origin Policy) and thus cannot forge a valid request.</p>
          </div>
        ) : (
          <div>
            <p><strong>Flaw: Unpredictable Requests Trusted.</strong> Browsers automatically include session cookies with requests sent to a domain, even if the request originated from a *different* domain. The bank relies entirely on the cookie for authentication and assumes the user intended to make the transfer triggered by the attacker's hidden form.</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// 5. Broken Authentication / IDOR Lab
function BrokenAuthLab({ isSecure }) {
  const [profileId, setProfileId] = useState('1');
  const [currentUser] = useState('1');

  const profiles = {
    '1': { name: 'Alice (You)', role: 'Standard User', email: 'alice@example.com', sensitive: 'Credit Card: **** 1234' },
    '2': { name: 'Bob', role: 'Standard User', email: 'bob@example.com', sensitive: 'Credit Card: **** 5678' },
    '3': { name: 'Administrator', role: 'Super Admin', email: 'admin@system.local', sensitive: 'Server API Key: xyz_9999_abc' },
  };

  const getProfileDisplay = () => {
    if (!profiles[profileId]) return <div style={{ color: 'var(--text-disabled)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>User not found</div>;

    if (isSecure && profileId !== currentUser) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'rgba(255, 100, 124, 0.08)', border: '1.5px solid #FF647C', borderRadius: '12px', marginTop: '20px' }}>
          <Lock style={{ color: '#FF647C', width: '48px', height: '48px', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FF647C', margin: '0 0 4px 0' }}>403 Forbidden</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
            Access Denied. You do not have permission to view other users' private profiles.
          </p>
        </div>
      );
    }

    const p = profiles[profileId];
    return (
      <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', border: '1.5px solid var(--divider)', background: profileId === '3' ? 'rgba(255,100,124,0.06)' : 'var(--background-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--divider)', display: 'grid', placeItems: 'center' }}>
            <UserX size={28} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: profileId === '3' ? '#FF647C' : 'var(--text-primary)', margin: 0 }}>{p.name}</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.15)', color: 'var(--text-secondary)', display: 'inline-block', marginTop: '4px' }}>{p.role}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-disabled)', width: '80px' }}>Email:</span>
            <span style={{ color: 'var(--text-primary)' }}>{p.email}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ color: 'var(--text-disabled)', width: '80px' }}>Private:</span>
            <span style={{ color: profileId !== currentUser && !isSecure ? '#FF647C' : 'var(--text-primary)', fontWeight: profileId !== currentUser && !isSecure ? 'bold' : 'normal' }}>
              {p.sensitive}
            </span>
          </div>
        </div>
        {profileId !== currentUser && !isSecure && (
          <div style={{ marginTop: '20px', backgroundColor: 'rgba(255,100,124,0.15)', border: '1px solid #FF647C', color: '#FF647C', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center' }}>
            VULNERABILITY EXPLOITED: Viewing unauthorized data
          </div>
        )}
      </div>
    );
  };

  return (
    <LabLayout title="Broken Access Control (IDOR)" isSecure={isSecure}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="cyber-browser-mock" style={{ minHeight: '380px', backgroundColor: 'var(--background-paper)', border: '1px solid var(--divider)' }}>
          <div className="cyber-browser-header" style={{ background: 'var(--background-default)', color: 'var(--text-primary)', borderBottom: '1px solid var(--divider)' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Browser URL:</span>
            <div style={{ display: 'flex', background: 'var(--background-default)', border: '1px solid var(--divider)', borderRadius: '6px', overflow: 'hidden', flex: 1 }}>
                <span style={{ background: 'rgba(0,0,0,0.15)', color: 'var(--text-secondary)', padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>https://app.com/profile?id=</span>
                <input 
                  type="number" 
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3DDC97',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: 'rgba(0,0,0,0.06)', borderBottom: '1px solid var(--divider)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-disabled)', display: 'flex', alignItems: 'center' }}>Quick Links:</span>
            <button onClick={() => setProfileId('1')} className="cyber-lab-tab-btn" style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--background-default)', border: '1px solid var(--divider)', color: 'var(--text-primary)', borderRadius: '6px' }}>My Profile (1)</button>
            <button onClick={() => setProfileId('2')} className="cyber-lab-tab-btn" style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--background-default)', border: '1px solid var(--divider)', color: 'var(--text-primary)', borderRadius: '6px' }}>Bob's Profile (2)</button>
            <button onClick={() => setProfileId('3')} className="cyber-lab-tab-btn" style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(255,100,124,0.1)', border: '1px solid #FF647C', color: '#FF647C', borderRadius: '6px' }}>Admin Profile (3)</button>
          </div>

          <div style={{ padding: '24px' }}>
            {getProfileDisplay()}
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p><strong>Fix: Server-Side Authorization Checks.</strong> Never trust the client-provided ID. The server must check the session to see who is logged in, and explicitly verify if that user has the rights to view the requested resource ID before serving the data.</p>
            <pre className="cyber-lab-terminal" style={{ fontSize: '0.75rem', minHeight: 'auto', background: '#0e111d' }}><code>{`// Secure Logic
const requestedId = req.query.id;
const loggedInUser = req.session.userId;

if (requestedId !== loggedInUser && !user.isAdmin) {
    return res.status(403).send("Forbidden");
}
return db.getProfile(requestedId);`}</code></pre>
          </div>
        ) : (
          <div>
            <p><strong>Flaw: Insecure Direct Object Reference (IDOR).</strong> The application fetches database records based entirely on the <code>id</code> parameter in the URL. It checks *if* you are logged in, but fails to check *who* you are allowed to look at. An attacker simply changes the number to steal other users' data.</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// Main App Component
export default function CyberLabPage() {
  const [activeTab, setActiveTab] = useState('xss');
  const [isSecure, setIsSecure] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: 'info' });

  const showAlert = (message, type = 'danger') => {
    setAlertConfig({ show: true, message, type });
  };

  const closeAlert = () => {
    setAlertConfig({ show: false, message: '', type: 'info' });
  };

  const tabs = [
    { id: 'xss', name: 'XSS Lab', icon: <Code size={16} /> },
    { id: 'sqli', name: 'SQL Injection', icon: <Database size={16} /> },
    { id: 'cmd', name: 'Command Injection', icon: <Terminal size={16} /> },
    { id: 'csrf', name: 'CSRF Lab', icon: <Globe size={16} /> },
    { id: 'auth', name: 'IDOR Auth Lab', icon: <KeyRound size={16} /> },
    { id: 'dos', name: 'DoS Lab', icon: <Activity size={16} /> },
    { id: 'ddos', name: 'DDoS Lab', icon: <Activity size={16} /> },
    { id: 'caesar', name: 'Caesar Cipher', icon: <Lock size={16} /> },
    { id: 'vigenere', name: 'Vigenère Cipher', icon: <Lock size={16} /> },
    { id: 'enigma', name: 'Enigma Machine', icon: <Lock size={16} /> },
    { id: 'rsa', name: 'RSA Visualizer', icon: <Lock size={16} /> },
    { id: 'base64', name: 'Base64 Visualizer', icon: <Activity size={16} /> },
    { id: 'xor', name: 'XOR Cipher', icon: <Activity size={16} /> },
    { id: 'challenge', name: 'Google XSS Challenge', icon: <Activity size={16} /> }
  ];

  return (
    <div className="cyber-lab-container">
      {/* Sidebar Navigation */}
      <div className="cyber-lab-sidebar">
        <div className="cyber-lab-sidebar-header">
          <Activity size={20} />
          <span>Cyber SecLab</span>
        </div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsSecure(false); // Reset to vulnerable on tab change
              closeAlert();
            }}
            className={`cyber-lab-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="cyber-lab-content-area">
        {/* Top Bar with Security Toggle (disabled on challenge tab) */}
        <div className="cyber-lab-topbar">
          <h2 className="cyber-lab-title">
            {tabs.find(t => t.id === activeTab)?.name} Console
          </h2>

          {['xss', 'sqli', 'cmd', 'csrf', 'auth'].includes(activeTab) && (
            <div className="cyber-lab-security-toggle">
              <button
                onClick={() => setIsSecure(false)}
                className={`cyber-lab-toggle-btn vuln ${!isSecure ? 'active' : ''}`}
              >
                <ShieldAlert size={14} /> Vulnerable
              </button>
              <button
                onClick={() => setIsSecure(true)}
                className={`cyber-lab-toggle-btn secure ${isSecure ? 'active' : ''}`}
              >
                <ShieldCheck size={14} /> Secure
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Lab Content */}
        <div className="cyber-lab-body">
          {activeTab === 'xss' && <XSSLab isSecure={isSecure} showAlert={showAlert} />}
          {activeTab === 'sqli' && <SQLiLab isSecure={isSecure} />}
          {activeTab === 'cmd' && <CommandInjectionLab isSecure={isSecure} />}
          {activeTab === 'csrf' && <CSRFLab isSecure={isSecure} showAlert={showAlert} />}
          {activeTab === 'auth' && <BrokenAuthLab isSecure={isSecure} />}
          {activeTab === 'dos' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><DenialOfServiceLab /></div>}
          {activeTab === 'ddos' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><DistributedDenialOfServiceLab /></div>}
          {activeTab === 'caesar' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><CaesarCipherExplorer /></div>}
          {activeTab === 'vigenere' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><VigenereCipherExplorer /></div>}
          {activeTab === 'enigma' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><EnigmaMachine /></div>}
          {activeTab === 'rsa' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><RSAVisualizer /></div>}
          {activeTab === 'base64' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><Base64Visualizer /></div>}
          {activeTab === 'xor' && <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}><XORVisualizer /></div>}
          {activeTab === 'challenge' && <ChallengePage />}
        </div>
      </div>

      {/* Custom Alert Modal */}
      {alertConfig.show && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '16px' }}>
          <Paper style={{ backgroundColor: 'var(--background-paper)', padding: '24px', borderRadius: '16px', border: alertConfig.type === 'danger' ? '1.5px solid #FF647C' : '1.5px solid var(--primary-main)', maxWidth: '360px', width: '100%', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              {alertConfig.type === 'danger' ? (
                <ShieldAlert style={{ color: '#FF647C', width: '32px', height: '32px' }} />
              ) : (
                <Activity style={{ color: 'var(--primary-main)', width: '32px', height: '32px' }} />
              )}
              <Typography variant="h6" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Browser Pop-up</Typography>
            </div>
            <p style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--divider)', color: 'var(--text-primary)', wordBreak: 'break-all', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center' }}>
              {alertConfig.message}
            </p>
            <Button
              fullWidth
              variant="contained"
              onClick={closeAlert}
              style={{ background: 'var(--hero-gradient)', color: '#fff', fontWeight: 800, borderRadius: '8px', height: '40px' }}
            >
              Close Alert
            </Button>
          </Paper>
        </div>
      )}
    </div>
  );
}
