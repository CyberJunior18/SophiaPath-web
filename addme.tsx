import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Terminal, Database, 
  Code, Globe, KeyRound, ArrowRight, UserX, 
  FileTerminal, Activity, Lock
} from 'lucide-react';

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('xss');
  const [isSecure, setIsSecure] = useState(false);

  // Custom Alert Modal State (to avoid browser alert blockages)
  const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: 'info' });

  const showAlert = (message, type = 'danger') => {
    setAlertConfig({ show: true, message, type });
  };

  const closeAlert = () => {
    setAlertConfig({ show: false, message: '', type: 'info' });
  };

  const tabs = [
    { id: 'xss', name: 'XSS', icon: <Code size={18} /> },
    { id: 'sqli', name: 'SQL Injection', icon: <Database size={18} /> },
    { id: 'cmd', name: 'Command Injection', icon: <Terminal size={18} /> },
    { id: 'csrf', name: 'CSRF', icon: <Globe size={18} /> },
    { id: 'auth', name: 'Broken Auth', icon: <KeyRound size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-6 p-2 text-white font-bold text-xl">
          <Activity className="text-blue-400" />
          <span>SecLab</span>
        </div>
        
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsSecure(false); // Reset to vulnerable on tab change
              closeAlert();
            }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Bar with Security Toggle */}
        <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {tabs.find(t => t.id === activeTab)?.name} Laboratory
          </h2>
          
          <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-full border border-slate-700 shadow-inner">
            <button
              onClick={() => setIsSecure(false)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-bold ${
                !isSecure ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldAlert size={16} /> Vulnerable
            </button>
            <button
              onClick={() => setIsSecure(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-bold ${
                isSecure ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldCheck size={16} /> Secure
            </button>
          </div>
        </div>

        {/* Dynamic Lab Content */}
        <div className="p-6 max-w-5xl mx-auto w-full flex-1">
          {activeTab === 'xss' && <XSSLab isSecure={isSecure} showAlert={showAlert} />}
          {activeTab === 'sqli' && <SQLiLab isSecure={isSecure} />}
          {activeTab === 'cmd' && <CommandInjectionLab isSecure={isSecure} />}
          {activeTab === 'csrf' && <CSRFLab isSecure={isSecure} showAlert={showAlert} />}
          {activeTab === 'auth' && <BrokenAuthLab isSecure={isSecure} />}
        </div>
      </div>

      {/* Custom Alert Modal */}
      {alertConfig.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm p-4">
          <div className={`bg-slate-800 p-6 rounded-xl border max-w-sm w-full shadow-2xl transform transition-all ${
            alertConfig.type === 'danger' ? 'border-red-500/50' : 'border-blue-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {alertConfig.type === 'danger' ? (
                <ShieldAlert className="text-red-400 w-8 h-8" />
              ) : (
                <Activity className="text-blue-400 w-8 h-8" />
              )}
              <h3 className="text-xl font-bold text-white">Browser Execution</h3>
            </div>
            <p className="text-slate-300 mb-6 font-mono bg-slate-900 p-3 rounded-lg border border-slate-700 break-words">
              {alertConfig.message}
            </p>
            <button 
              onClick={closeAlert}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// 1. Cross-Site Scripting (XSS) Lab
// ---------------------------------------------------------
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
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-300">1. Target Application</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <p className="text-sm text-slate-400 mb-4">Search our forums for topics. Your search query will be displayed back to you.</p>
            
            <form onSubmit={handleSimulate} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors">
                Search
              </button>
            </form>

            <div className="flex gap-2">
              <button onClick={() => setInput('React Tutorials')} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Normal Input</button>
              <button onClick={() => setInput("<script>alert('You are hacked!')</script>")} className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-800 px-2 py-1 rounded transition-colors">
                Malicious Payload
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-300">2. Simulated Browser View</h3>
          <div className="bg-white border-2 border-slate-600 rounded-lg h-full min-h-[200px] flex flex-col overflow-hidden text-slate-800 relative">
            <div className="bg-slate-200 border-b border-slate-300 p-2 flex items-center gap-2 text-xs">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="bg-white px-2 py-0.5 rounded flex-1 text-slate-500 border border-slate-300">
                http://vulnerable-site.com/search?q={encodeURIComponent(submittedText.substring(0,20))}...
              </div>
            </div>
            <div className="p-4 flex-1">
              <h1 className="text-2xl font-bold mb-4">Search Results</h1>
              {submittedText ? (
                <p>
                  You searched for: {' '}
                  {isSecure ? (
                    // Secure mode: React automatically escapes variables, but we simulate it visually
                    <span className="bg-yellow-100 px-1 font-mono text-sm text-slate-600 border border-yellow-300 rounded">
                      {submittedText}
                    </span>
                  ) : (
                    // Vulnerable mode: We use dangerouslySetInnerHTML to simulate the vulnerability
                    <span 
                      className="font-bold text-red-600"
                      dangerouslySetInnerHTML={{ __html: submittedText.replace(/<script>.*<\/script>/gi, '<span class="italic text-red-500 border border-red-500 bg-red-50 p-1">[Invisible Script Tag Executed]</span>') }} 
                    />
                  )}
                </p>
              ) : (
                <p className="text-slate-500 italic">Enter a search query...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p className="mb-2"><strong>Fix: Context-Aware Output Encoding.</strong> Before displaying untrusted data, the application converts special characters into their safe HTML entities (e.g., <code>&lt;</code> becomes <code>&amp;lt;</code>). The browser treats it as text, not code.</p>
            <pre className="text-xs"><code>{`// PHP Example
$safeInput = htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8');
echo "You searched for: " . $safeInput;

// React Example (Safe by default)
<div>You searched for: {query}</div>`}</code></pre>
          </div>
        ) : (
          <div>
            <p className="mb-2"><strong>Flaw: Missing Output Sanitization.</strong> The application takes user input and injects it directly into the HTML structure. When a user inputs a <code>&lt;script&gt;</code> tag, the victim's browser executes it as part of the page.</p>
            <pre className="text-xs"><code>{`// VULNERABLE PHP
echo "You searched for: " . $_GET['q'];

// VULNERABLE React
<div dangerouslySetInnerHTML={{ __html: query }} />`}</code></pre>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// ---------------------------------------------------------
// 2. SQL Injection (SQLi) Lab
// ---------------------------------------------------------
function SQLiLab({ isSecure }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username && !password) return;

    if (!isSecure) {
      // Vulnerable logic: Checks if the manipulated string results in a true condition
      const manipulatedQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
      if (manipulatedQuery.includes("' OR '1'='1") || manipulatedQuery.includes("' OR 1=1--")) {
         setResult({ success: true, message: "Welcome back, Administrator (Bypass Successful!)" });
      } else if (username === 'admin' && password === 'password123') {
         setResult({ success: true, message: "Welcome back, Admin" });
      } else {
         setResult({ success: false, message: "Invalid credentials" });
      }
    } else {
      // Secure logic: strict matching
      if (username === 'admin' && password === 'password123') {
        setResult({ success: true, message: "Welcome back, Admin" });
      } else {
        setResult({ success: false, message: "Invalid credentials" });
      }
    }
  };

  return (
    <LabLayout title="SQL Injection (Authentication Bypass)" isSecure={isSecure}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-300">1. Login Portal</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 font-mono text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 font-mono text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mt-2 font-medium transition-colors">
                Login
              </button>
            </form>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
              <button onClick={() => {setUsername('admin'); setPassword('password123');}} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Normal User</button>
              <button onClick={() => {setUsername("admin' OR '1'='1"); setPassword("");}} className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-800 px-2 py-1 rounded transition-colors">
                SQLi Payload
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-300">2. Database Engine</h3>
          <div className="bg-[#1e1e1e] border-2 border-slate-700 rounded-lg h-full min-h-[250px] p-4 flex flex-col font-mono text-sm">
            <div className="text-slate-400 mb-2">Executed Query:</div>
            
            {isSecure ? (
              <div className="bg-black p-3 rounded border border-slate-800 mb-4 text-green-400 overflow-x-auto whitespace-pre-wrap">
                SELECT * FROM users <br/>
                WHERE username = <span className="text-yellow-400">$1</span> <br/>
                AND password = <span className="text-yellow-400">$2</span><br/><br/>
                <span className="text-slate-500">
                  Parameters binding:<br/>
                  $1 = "{username}"<br/>
                  $2 = "{password}"
                </span>
              </div>
            ) : (
              <div className="bg-black p-3 rounded border border-slate-800 mb-4 text-blue-400 overflow-x-auto whitespace-pre-wrap">
                SELECT * FROM users <br/>
                WHERE username = '<span className={username.includes("' OR") ? "text-red-400 font-bold" : "text-yellow-400"}>{username}</span>' <br/>
                AND password = '<span className="text-yellow-400">{password}</span>'
              </div>
            )}

            <div className="text-slate-400 mb-2 mt-auto">Result:</div>
            {result ? (
              <div className={`p-3 rounded font-bold ${result.success ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                {result.message}
              </div>
            ) : (
              <div className="p-3 bg-slate-800/50 text-slate-500 rounded border border-slate-800 italic">
                Waiting for execution...
              </div>
            )}
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p className="mb-2"><strong>Fix: Parameterized Queries (Prepared Statements).</strong> The database engine treats the user input purely as data, not as executable code. Even if the input contains SQL commands like <code>' OR '1'='1</code>, it searches for a user literally named that, neutralizing the attack.</p>
            <pre className="text-xs"><code>{`// Secure Node.js/Postgres Example
const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
const values = [username, password];
await db.query(query, values);`}</code></pre>
          </div>
        ) : (
          <div>
            <p className="mb-2"><strong>Flaw: String Concatenation.</strong> User input is pasted directly into the database query. An attacker can use quote characters (<code>'</code>) to break out of the intended string and inject new SQL logic, such as appending <code>OR '1'='1'</code>, which always evaluates to true, bypassing the password check entirely.</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// ---------------------------------------------------------
// 3. Command Injection Lab
// ---------------------------------------------------------
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
        // Secure: strict regex validation for IP
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (ipRegex.test(ip)) {
          setOutput(`PING ${ip} (${ip}) 56(84) bytes of data.\n64 bytes from ${ip}: icmp_seq=1 ttl=117 time=14.2 ms\n64 bytes from ${ip}: icmp_seq=2 ttl=117 time=14.5 ms`);
        } else {
          setOutput(`Error: Invalid IP address format. Allowed characters: numbers and dots only.`);
        }
      } else {
        // Vulnerable: Blind execution
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
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-300">1. Admin Diagnostic Tool</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <p className="text-sm text-slate-400 mb-4">Enter an IP address to check network connectivity using the system <code>ping</code> utility.</p>
            
            <form onSubmit={handlePing} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 8.8.8.8"
                className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 font-mono text-sm focus:border-blue-500 focus:outline-none"
              />
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50">
                {loading ? 'Pinging...' : 'Ping'}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setIp('8.8.8.8')} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Normal IP</button>
              <button onClick={() => setIp('8.8.8.8; cat /etc/passwd')} className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-800 px-2 py-1 rounded transition-colors">
                Inject Linux Command (;)
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-300">2. Server Terminal</h3>
          <div className="bg-black border-2 border-slate-700 rounded-lg h-full min-h-[250px] p-4 flex flex-col font-mono text-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 bg-slate-800 flex items-center px-3 border-b border-slate-700">
              <FileTerminal size={12} className="text-slate-400 mr-2" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">bash</span>
            </div>
            <div className="mt-4 text-green-400 opacity-50 mb-2">
              $ ping -c 2 {isSecure && ip ? <span className="text-yellow-300">{ip.replace(/[^0-9.]/g, '')}</span> : <span className={ip.includes(';') ? 'text-red-400' : 'text-yellow-300'}>{ip}</span>}
            </div>
            <div className={`flex-1 whitespace-pre-wrap overflow-y-auto ${output.includes('root:x:') && !isSecure ? 'text-red-400' : 'text-slate-300'}`}>
              {loading ? <span className="animate-pulse">Executing command...</span> : output}
            </div>
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p className="mb-2"><strong>Fix: Input Validation and API Usage.</strong> The server validates the input using a strict Regex to ensure it only contains an IP address. Even better, secure applications avoid calling OS shells entirely, relying on built-in language libraries instead of <code>exec()</code>.</p>
            <pre className="text-xs"><code>{`// PHP Secure Example
if (filter_var($ip, FILTER_VALIDATE_IP)) {
    // Only execute if perfectly matches an IP
    system("ping -c 2 " . escapeshellarg($ip));
} else {
    echo "Invalid IP";
}`}</code></pre>
          </div>
        ) : (
          <div>
            <p className="mb-2"><strong>Flaw: Unsafe OS Calls.</strong> The application passes user input directly to a system shell command (like <code>exec("ping " + ip)</code>). Attackers use shell metacharacters like <code>;</code>, <code>|</code>, or <code>&&</code> to terminate the first command and append their own malicious system commands (e.g., reading sensitive files).</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// ---------------------------------------------------------
// 4. Cross-Site Request Forgery (CSRF) Lab
// ---------------------------------------------------------
function CSRFLab({ isSecure, showAlert }) {
  const [balance, setBalance] = useState(5000);
  const [history, setHistory] = useState([]);

  // Mock checking cookies/auth
  const handleMaliciousClick = () => {
    if (isSecure) {
      // Secure: requires the specific anti-CSRF token from the DOM which the attacker doesn't have
      showAlert("Attack Blocked! Missing or invalid Anti-CSRF token in the request payload.", "info");
    } else {
      // Vulnerable: The browser automatically attaches session cookies to the request.
      // Since there is no secondary check, the server assumes the user intended to do this.
      if (balance >= 1000) {
        setBalance(prev => prev - 1000);
        setHistory(prev => [{to: 'Attacker_Wallet', amount: 1000, date: new Date().toLocaleTimeString()}, ...prev]);
        showAlert("Uh oh! 1000 was silently transferred from your account while you were browsing the other site.", "danger");
      } else {
        showAlert("Insufficient funds to steal.", "info");
      }
    }
  };

  const handleLegitTransfer = (e) => {
    e.preventDefault();
    if (balance >= 100) {
      setBalance(prev => prev - 100);
      setHistory(prev => [{to: 'Utility_Bill', amount: 100, date: new Date().toLocaleTimeString()}, ...prev]);
    }
  };

  return (
    <LabLayout title="Cross-Site Request Forgery (CSRF)" isSecure={isSecure}>
      <p className="text-slate-400 mb-6 text-sm">Context: You are currently logged into your bank in Tab 1. You open a malicious link sent via email in Tab 2.</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* The Bank (Victim Site) */}
        <div>
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden shadow-lg h-full">
            <div className="bg-blue-900/30 border-b border-slate-700 p-2 flex items-center gap-2">
               <Globe className="text-blue-400" size={16} />
               <span className="text-sm font-bold text-slate-200">my-bank.com (Tab 1)</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-6 bg-slate-900 p-3 rounded border border-slate-700">
                <span className="text-slate-400">Current Balance:</span>
                <span className="text-2xl font-bold text-emerald-400">${balance}</span>
              </div>

              <form onSubmit={handleLegitTransfer} className="mb-4">
                {isSecure && <div className="text-[10px] text-slate-500 mb-2 font-mono bg-slate-900 p-1 border border-slate-700 inline-block rounded">Hidden input: csrf_token="a8f93j..."</div>}
                <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors">
                  Pay Utility Bill ($100)
                </button>
              </form>

              <div className="mt-4">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block">Recent Transfers</span>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {history.length === 0 && <span className="text-sm text-slate-500">No recent activity.</span>}
                  {history.map((tx, i) => (
                    <div key={i} className="flex justify-between text-sm bg-slate-900 p-2 rounded border border-slate-700">
                      <span className={tx.to === 'Attacker_Wallet' ? 'text-red-400' : 'text-slate-300'}>To: {tx.to}</span>
                      <span className="font-bold text-slate-400">${tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Attacker Site */}
        <div>
          <div className="bg-slate-800 border-2 border-red-900/50 rounded-lg overflow-hidden shadow-lg h-full">
            <div className="bg-red-900/20 border-b border-red-900/50 p-2 flex items-center gap-2">
               <Globe className="text-red-400" size={16} />
               <span className="text-sm font-bold text-slate-200">free-gifts-online.net (Tab 2)</span>
            </div>
            <div className="p-5 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
              <h2 className="text-2xl font-bold text-white mb-2">🎉 You Won a Prize! 🎉</h2>
              <p className="text-slate-400 mb-6 text-sm">Click the button below to claim your free gift card!</p>
              
              <button 
                onClick={handleMaliciousClick}
                className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 animate-pulse"
              >
                CLAIM PRIZE NOW
              </button>

              <div className="mt-8 text-left w-full bg-slate-900 p-3 rounded border border-slate-700 font-mono text-[10px] text-slate-500">
                // Hidden Attacker HTML:<br/>
                &lt;form action="http://my-bank.com/transfer" method="POST"&gt;<br/>
                &nbsp;&nbsp;&lt;input type="hidden" name="to" value="Attacker"&gt;<br/>
                &nbsp;&nbsp;&lt;input type="hidden" name="amount" value="1000"&gt;<br/>
                &lt;/form&gt;
              </div>
            </div>
          </div>
        </div>

      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p className="mb-2"><strong>Fix: Anti-CSRF Tokens.</strong> The server generates a unique, unpredictable token when the bank page loads. The browser must submit this token with the transfer request. The attacker site cannot read this token (due to the Same-Origin Policy) and thus cannot forge a valid request.</p>
          </div>
        ) : (
          <div>
            <p className="mb-2"><strong>Flaw: Unpredictable Requests Trusted.</strong> Browsers automatically include session cookies with requests sent to a domain, even if the request originated from a *different* domain. The bank relies entirely on the cookie for authentication and assumes the user intended to make the transfer triggered by the attacker's hidden form.</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// ---------------------------------------------------------
// 5. Broken Authentication / IDOR Lab
// ---------------------------------------------------------
function BrokenAuthLab({ isSecure }) {
  const [profileId, setProfileId] = useState('1');
  const [currentUser] = useState('1'); // The currently logged-in user's true ID

  const profiles = {
    '1': { name: 'Alice (You)', role: 'Standard User', email: 'alice@example.com', sensitive: 'Credit Card: **** 1234' },
    '2': { name: 'Bob', role: 'Standard User', email: 'bob@example.com', sensitive: 'Credit Card: **** 5678' },
    '3': { name: 'Administrator', role: 'Super Admin', email: 'admin@system.local', sensitive: 'Server API Key: xyz_9999_abc' },
  };

  const getProfileDisplay = () => {
    if (!profiles[profileId]) return <div className="text-slate-500 mt-10 text-center">User not found</div>;

    // Secure check: only allow if requesting own profile
    if (isSecure && profileId !== currentUser) {
      return (
        <div className="flex flex-col items-center justify-center mt-10 p-6 bg-red-900/20 border border-red-900 rounded-lg">
          <Lock className="text-red-500 w-12 h-12 mb-3" />
          <h2 className="text-xl font-bold text-red-400">403 Forbidden</h2>
          <p className="text-slate-400 text-center text-sm mt-2">
            Access Denied. You do not have permission to view other users' private profiles.
          </p>
        </div>
      );
    }

    // Vulnerable (or authorized) view
    const p = profiles[profileId];
    return (
      <div className={`mt-4 p-5 rounded-lg border ${profileId === '3' ? 'bg-red-900/10 border-red-900/50' : 'bg-slate-900 border-slate-700'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
            <UserX size={32} className="text-slate-400" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${profileId === '3' ? 'text-red-400' : 'text-white'}`}>{p.name}</h2>
            <span className="text-sm bg-slate-800 px-2 py-1 rounded text-slate-400">{p.role}</span>
          </div>
        </div>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex border-b border-slate-800 pb-2">
             <span className="text-slate-500 w-24">Email:</span>
             <span className="text-slate-300">{p.email}</span>
          </div>
          <div className="flex">
             <span className="text-slate-500 w-24">Private:</span>
             <span className={profileId !== currentUser && !isSecure ? 'text-red-400 font-bold bg-red-900/30 px-1 rounded' : 'text-slate-300'}>
               {p.sensitive}
             </span>
          </div>
        </div>
        {profileId !== currentUser && !isSecure && (
          <div className="mt-6 bg-red-900/40 text-red-300 p-2 rounded text-xs text-center border border-red-800 animate-pulse">
            VULNERABILITY EXPLOITED: Viewing unauthorized data
          </div>
        )}
      </div>
    );
  };

  return (
    <LabLayout title="Broken Access Control (IDOR)" isSecure={isSecure}>
      <div className="max-w-2xl mx-auto">
        
        {/* Browser URL Bar Simulator */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden shadow-lg mb-6">
          <div className="bg-slate-900 border-b border-slate-700 p-3 flex flex-col md:flex-row md:items-center gap-3">
             <span className="text-slate-400 text-sm font-bold whitespace-nowrap">Browser URL:</span>
             <div className="flex-1 flex bg-slate-800 border border-slate-600 rounded overflow-hidden">
                <span className="bg-slate-700 text-slate-400 px-2 py-1 text-sm border-r border-slate-600">https://app.com/profile?id=</span>
                <input 
                  type="number" 
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="bg-slate-800 text-emerald-400 font-bold px-2 py-1 w-full focus:outline-none focus:bg-slate-700"
                />
             </div>
          </div>
          
          <div className="p-3 bg-slate-800/50 flex gap-2 border-b border-slate-700">
             <span className="text-xs text-slate-500 flex items-center mr-2">Quick Links:</span>
             <button onClick={() => setProfileId('1')} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors">My Profile (ID: 1)</button>
             <button onClick={() => setProfileId('2')} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors">Bob's Profile (ID: 2)</button>
             <button onClick={() => setProfileId('3')} className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-800 px-3 py-1 rounded transition-colors">Admin Profile (ID: 3)</button>
          </div>

          <div className="p-6 min-h-[300px]">
             {getProfileDisplay()}
          </div>
        </div>
      </div>

      <ExplanationBox isSecure={isSecure}>
        {isSecure ? (
          <div>
            <p className="mb-2"><strong>Fix: Server-Side Authorization Checks.</strong> Never trust the client-provided ID. The server must check the session to see who is logged in, and explicitly verify if that user has the rights to view the requested resource ID before serving the data.</p>
            <pre className="text-xs"><code>{`// Secure Logic
const requestedId = req.query.id;
const loggedInUser = req.session.userId;

if (requestedId !== loggedInUser && !user.isAdmin) {
    return res.status(403).send("Forbidden");
}
return db.getProfile(requestedId);`}</code></pre>
          </div>
        ) : (
          <div>
            <p className="mb-2"><strong>Flaw: Insecure Direct Object Reference (IDOR).</strong> The application fetches database records based entirely on the <code>id</code> parameter in the URL. It checks *if* you are logged in, but fails to check *who* you are allowed to look at. An attacker simply changes the number to steal other users' data.</p>
          </div>
        )}
      </ExplanationBox>
    </LabLayout>
  );
}

// ---------------------------------------------------------
// Shared UI Components
// ---------------------------------------------------------
function LabLayout({ title, isSecure, children }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-black text-white mb-2">{title}</h1>
        <p className="text-slate-400">
          State: {isSecure ? (
            <span className="text-emerald-400 font-bold bg-emerald-900/30 px-2 py-0.5 rounded">Secure & Patched</span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/30 px-2 py-0.5 rounded">Vulnerable to Attack</span>
          )}
        </p>
      </div>
      
      <div className="mb-8">
        {children}
      </div>
    </div>
  );
}

function ExplanationBox({ isSecure, children }) {
  return (
    <div className={`mt-8 border-l-4 p-4 rounded-r-lg ${isSecure ? 'border-emerald-500 bg-emerald-900/10' : 'border-red-500 bg-red-900/10'}`}>
      <h4 className={`font-bold flex items-center gap-2 mb-2 ${isSecure ? 'text-emerald-400' : 'text-red-400'}`}>
        {isSecure ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        {isSecure ? "How the Fix Works" : "Understanding the Vulnerability"}
      </h4>
      <div className="text-sm text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}