import React, { useState } from 'react';
import './challenges.css';

export default function SqliChallenge() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setStatusCode(null);

    try {
      const res = await fetch('/challenges/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      setStatusCode(res.status);

      // Parse the body regardless of status code so we can always show the raw response
      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: 'Non-JSON response from server' };
      }

      setResponse(data);
    } catch (err) {
      setStatusCode(0);
      setResponse({ error: 'Network error — is the backend running?' });
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = statusCode >= 200 && statusCode < 300;

  return (
    <div className="challenge-sandbox">
      {/* Header */}
      <div className="challenge-header sqli-theme">
        <div className="challenge-badge sqli-badge">SQLi</div>
        <div className="challenge-header-text">
          <h1 className="challenge-title">SQL Injection Challenge</h1>
          <p className="challenge-subtitle">
            Bypass the admin login form using a classic SQL injection payload.
          </p>
        </div>
      </div>

      {/* Mission Brief */}
      <div className="challenge-brief">
        <div className="brief-icon">🎯</div>
        <div className="brief-content">
          <h3>Mission Brief</h3>
          <p>
            The backend builds its SQL query via <strong>string concatenation</strong> — no parameterized queries.
            Your goal is to craft a username or password that manipulates the query logic and logs you in as
            the <strong>admin</strong> without knowing the real password.
          </p>
          <div className="hint-box">
            <span className="hint-label">Hint:</span>
            Username: <code className="inline-code">admin' --</code> &nbsp;|&nbsp;
            Password: <code className="inline-code">anything</code>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="challenge-card">
        <div className="card-header">
          <div className="card-icon">🔐</div>
          <h2 className="card-title">Admin Portal Login</h2>
          <div className="system-badge">INTERNAL SYSTEM</div>
        </div>

        <form onSubmit={handleLogin} className="challenge-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username-input">Username</label>
            <input
              id="username-input"
              type="text"
              className="challenge-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="text"
              className="challenge-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              autoComplete="off"
            />
            <span className="input-note">* Password shown in plaintext for demonstration purposes</span>
          </div>

          <button
            type="submit"
            className="challenge-btn sqli-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-dots">Authenticating<span>...</span></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Raw JSON Response */}
        {response !== null && (
          <div className="result-area">
            <div className="result-header">
              <span className="result-label">Raw Server Response:</span>
              <span className={`status-badge ${isSuccess ? 'status-ok' : 'status-err'}`}>
                HTTP {statusCode} {isSuccess ? '✓ Auth Bypassed!' : '✗ Rejected'}
              </span>
            </div>
            <pre className={`response-pre ${isSuccess ? 'response-success' : 'response-fail'}`}>
              {JSON.stringify(response, null, 2)}
            </pre>
            {isSuccess && (
              <div className="exploit-success-banner">
                🎉 SQL Injection Successful! You authenticated without knowing the password.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vulnerable Query Display */}
      <div className="challenge-card query-card">
        <div className="card-header">
          <div className="card-icon">💾</div>
          <h2 className="card-title">Backend SQL Query (Live Preview)</h2>
        </div>
        <div className="sql-query-box">
          <span className="sql-kw">SELECT</span> * <span className="sql-kw">FROM</span>{' '}
          security_challenges.challenge_users<br />
          <span className="sql-kw">WHERE</span> username = '
          <span className="sql-vuln">{username || 'your_input'}</span>'<br />
          <span className="sql-kw">AND</span> password = '
          <span className="sql-vuln">{password || 'your_input'}</span>'
        </div>
        <p className="query-note">
          ⚠️ This is the <strong>actual query</strong> executed on the backend. Injecting <code>admin' --</code>
          as the username closes the string early and comments out the password check.
        </p>
      </div>

      {/* Footer */}
      <div className="challenge-footer">
        <div className="backend-info">
          <span className="backend-badge post-badge">POST</span>
          <code>/challenges/login</code>
          <span className="backend-payload">{'{ username, password }'}</span>
        </div>
      </div>
    </div>
  );
}
