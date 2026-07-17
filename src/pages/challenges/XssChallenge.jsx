import React, { useState } from 'react';
import './challenges.css';

export default function XssChallenge() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/challenges/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="challenge-sandbox">
      {/* Header */}
      <div className="challenge-header xss-theme">
        <div className="challenge-badge">XSS</div>
        <div className="challenge-header-text">
          <h1 className="challenge-title">Reflected XSS Challenge</h1>
          <p className="challenge-subtitle">
            Inject a malicious payload into the search field and watch it execute in the browser.
          </p>
        </div>
      </div>

      {/* Mission Brief */}
      <div className="challenge-brief">
        <div className="brief-icon">🎯</div>
        <div className="brief-content">
          <h3>Mission Brief</h3>
          <p>
            This search feature reflects your query back into the page <strong>without sanitization</strong>.
            Your goal is to craft a payload that executes JavaScript in the browser.
          </p>
          <div className="hint-box">
            <span className="hint-label">Hint:</span>
            Try{' '}
            <code className="inline-code">&lt;img src=x onerror=alert('XSS')&gt;</code>
            {' '}or{' '}
            <code className="inline-code">&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="challenge-card">
        <div className="card-header">
          <div className="card-icon">🔍</div>
          <h2 className="card-title">SophiaPath Course Search</h2>
        </div>

        <form onSubmit={handleSearch} className="challenge-form">
          <div className="input-group">
            <label className="input-label" htmlFor="search-input">Search Query</label>
            <input
              id="search-input"
              type="text"
              className="challenge-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for courses..."
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="challenge-btn xss-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-dots">Searching<span>...</span></span>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Result Area — THIS IS THE VULNERABLE PART */}
        {result !== null && (
          <div className="result-area">
            <div className="result-header">
              <span className="result-label">Server Response:</span>
              <span className="vuln-badge">⚠ dangerouslySetInnerHTML active</span>
            </div>
            <div className="result-body">
              <div className="result-meta">
                <span className="meta-label">Search results for:</span>
                {/* ——— INTENTIONALLY VULNERABLE ——— */}
                <span
                  className="reflected-query"
                  dangerouslySetInnerHTML={{ __html: result.query }}
                />
              </div>
              <div className="result-count">
                {result.results?.length === 0
                  ? 'No courses found matching your query.'
                  : `${result.results.length} result(s) found.`}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      {/* Footer explanation */}
      <div className="challenge-footer">
        <div className="footer-vuln-explain">
          <h4>Why This is Vulnerable</h4>
          <p>
            The backend endpoint at <code>/challenges/search?q=</code> returns the raw query string
            directly in its JSON response. The frontend then injects it into the DOM using
            <code> dangerouslySetInnerHTML</code>, bypassing React's default XSS protections.
            Any HTML or JavaScript tags in the query will be parsed and executed by the browser.
          </p>
        </div>
        <div className="backend-info">
          <span className="backend-badge">GET</span>
          <code>/challenges/search?q={'{your_payload}'}</code>
        </div>
      </div>
    </div>
  );
}
