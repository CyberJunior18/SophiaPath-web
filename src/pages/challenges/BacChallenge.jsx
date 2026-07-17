import React, { useState } from 'react';
import './challenges.css';

export default function BacChallenge() {
  const [downloadStatus, setDownloadStatus] = useState(null);

  const handleDownload = () => {
    setDownloadStatus('downloading');
    // Use window.location.href so the URL is clearly visible to the user
    // and they can manually change the file ID in the address bar
    window.location.href = '/challenges/files/1';
    setTimeout(() => setDownloadStatus('done'), 1200);
  };

  return (
    <div className="challenge-sandbox">
      {/* Header */}
      <div className="challenge-header bac-theme">
        <div className="challenge-badge bac-badge">BAC</div>
        <div className="challenge-header-text">
          <h1 className="challenge-title">Broken Access Control Challenge</h1>
          <p className="challenge-subtitle">
            You are a standard employee. Discover what happens when you change the file ID in the URL.
          </p>
        </div>
      </div>

      {/* Mission Brief */}
      <div className="challenge-brief">
        <div className="brief-icon">🎯</div>
        <div className="brief-content">
          <h3>Mission Brief</h3>
          <p>
            As a standard employee, you have been given access to <strong>File #1</strong> (Public Guide).
            The server exposes files at <code>/challenges/files/:id</code> but performs
            <strong> no authorization check</strong> on the ID.
          </p>
          <p>
            Your mission: figure out if a confidential file exists at <strong>File #2</strong> and
            download it — without any legitimate access.
          </p>
          <div className="hint-box">
            <span className="hint-label">Hint:</span>
            Watch the URL when you click Download, then manually change <code>/1</code> to <code>/2</code>.
          </div>
        </div>
      </div>

      {/* Employee Dashboard */}
      <div className="challenge-card">
        <div className="card-header">
          <div className="card-icon">👤</div>
          <h2 className="card-title">Employee File Portal</h2>
          <div className="system-badge bac-system-badge">INTRANET</div>
        </div>

        {/* User Identity Strip */}
        <div className="user-identity-strip">
          <div className="user-avatar">E</div>
          <div className="user-info">
            <div className="user-name">employee@sophiapath.com</div>
            <div className="user-role-tag">Standard Employee · Read-Only Access</div>
          </div>
          <div className="access-indicator">
            <span className="access-dot"></span>
            Authenticated
          </div>
        </div>

        {/* File List */}
        <div className="file-list">
          <div className="file-list-header">Your Authorized Files</div>

          {/* File 1 — publicly authorized */}
          <div className="file-row accessible">
            <div className="file-icon-col">
              <div className="file-icon pdf-icon">PDF</div>
            </div>
            <div className="file-details">
              <div className="file-name">Public_Guide.pdf</div>
              <div className="file-meta">
                <span className="file-id-tag">ID: 1</span>
                <span className="file-access-tag accessible-tag">🟢 Accessible</span>
              </div>
              <div className="file-desc">
                Contains non-confidential onboarding information for all employees.
              </div>
            </div>
            <div className="file-action-col">
              <a
                href="/challenges/files/1"
                className="download-btn"
                id="download-file-1"
                onClick={(e) => {
                  e.preventDefault();
                  handleDownload();
                }}
              >
                ⬇ Download
              </a>
            </div>
          </div>

          {/* Hint Row — shows the URL pattern without giving away the button */}
          <div className="url-pattern-hint">
            <code className="url-pattern">
              GET /challenges/files/<span className="url-id-highlight">1</span>
            </code>
            <span className="url-hint-label">← The download URL pattern</span>
          </div>
        </div>
      </div>

      {/* Download Status */}
      {downloadStatus && (
        <div className="result-area">
          <div className="result-header">
            <span className="result-label">Download Activity:</span>
          </div>
          <div className="download-log">
            <div className="log-line">
              <span className="log-time">{new Date().toLocaleTimeString()}</span>
              <span className="log-method get-method">GET</span>
              <span className="log-url">/challenges/files/1</span>
              <span className="log-status ok-status">200 OK</span>
            </div>
            <div className="log-note">
              💡 Notice the URL above? The only difference between your file and the confidential one is the number at the end.
              The server trusts you to only request <code>/1</code> — but it doesn't enforce that restriction.
            </div>
          </div>
        </div>
      )}

      {/* Challenge Goal Card */}
      <div className="challenge-card goal-card">
        <div className="card-header">
          <div className="card-icon">🗂️</div>
          <h2 className="card-title">Known File Registry (Partial)</h2>
        </div>
        <table className="file-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Filename</th>
              <th>Classification</th>
              <th>Your Access</th>
            </tr>
          </thead>
          <tbody>
            <tr className="row-ok">
              <td><code>1</code></td>
              <td>Public_Guide.pdf</td>
              <td><span className="classification public">PUBLIC</span></td>
              <td>✅ Authorized</td>
            </tr>
            <tr className="row-secret">
              <td><code>?</code></td>
              <td><span className="redacted">█████████████</span></td>
              <td><span className="classification confidential">CONFIDENTIAL</span></td>
              <td>🔒 Restricted</td>
            </tr>
          </tbody>
        </table>
        <p className="table-note">
          Can you figure out the ID of the confidential file and access it directly?
        </p>
      </div>

      {/* Footer */}
      <div className="challenge-footer">
        <div className="footer-vuln-explain">
          <h4>Why This is Vulnerable</h4>
          <p>
            The <code>/challenges/files/:id</code> endpoint fetches whichever file ID is provided in the URL.
            Because there is <strong>no server-side authorization check</strong> (no "does this user own file ID X?"),
            any user who guesses or iterates over IDs can access any file — including confidential ones.
            This is known as an <strong>Insecure Direct Object Reference (IDOR)</strong>.
          </p>
        </div>
        <div className="backend-info">
          <span className="backend-badge">GET</span>
          <code>/challenges/files/:id</code>
        </div>
      </div>
    </div>
  );
}
