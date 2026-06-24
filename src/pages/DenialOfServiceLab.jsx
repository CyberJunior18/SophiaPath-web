import React, { useState, useEffect, useRef } from 'react';
import './DenialOfServiceLab.css';

export default function DenialOfServiceLab() {
  // --- Simulation State ---
  const [requestLevel, setRequestLevel] = useState(20);
  const [firewallEnabled, setFirewallEnabled] = useState(false);
  const [requests, setRequests] = useState([]);
  
  const reqIdCounter = useRef(0);

  // --- Constants and Thresholds ---
  const THRESHOLD = 70;
  const isOverloaded = requestLevel > THRESHOLD;
  
  // Determine current state
  let status = 'normal';
  if (isOverloaded && !firewallEnabled) status = 'crashing';
  if (isOverloaded && firewallEnabled) status = 'protected';

  // --- Layout coordinates ---
  const serverX = 380;
  const serverY = 250;
  const serverRadius = 45;
  const shieldRadius = 80;

  // Fixed clients: 1 Attacker, 2 Normal Users
  const clients = [
    { id: 'user1', type: 'normal', cx: 80, cy: 100 },
    { id: 'attacker', type: 'attacker', cx: 80, cy: 250 },
    { id: 'user2', type: 'normal', cx: 80, cy: 400 },
  ];

  // Helper to calculate impact point on a circle
  const getTarget = (cx, cy, targetRadius) => {
    const angle = Math.atan2(serverY - cy, serverX - cx);
    return {
      tx: serverX - targetRadius * Math.cos(angle),
      ty: serverY - targetRadius * Math.sin(angle),
    };
  };

  // --- Spawn Attacker Requests ---
  useEffect(() => {
    // Attack speed scales heavily with the slider (from 600ms down to 15ms)
    const spawnSpeed = Math.max(15, 600 - (requestLevel * 5.85)); 
    
    const interval = setInterval(() => {
      const client = clients.find(c => c.id === 'attacker');
      
      // If firewall is ON, the attacker hits the shield. Otherwise, hits the server directly.
      const targetR = status === 'protected' ? shieldRadius + 15 : serverRadius + 4;
      const { tx, ty } = getTarget(client.cx, client.cy, targetR);
      
      const id = reqIdCounter.current++;
      const newReq = { id, cx: client.cx, cy: client.cy, tx, ty, type: 'attacker' };
      
      setRequests(prev => {
        const next = [...prev, newReq];
        return next.length > 100 ? next.slice(next.length - 100) : next;
      });
      
      setTimeout(() => setRequests(prev => prev.filter(r => r.id !== id)), 800);
    }, spawnSpeed);
    
    return () => clearInterval(interval);
  }, [requestLevel, status]);

  // --- Spawn Normal User Requests ---
  useEffect(() => {
    // Normal users send requests at a steady, slow pace
    const interval = setInterval(() => {
      const normalClients = clients.filter(c => c.type === 'normal');
      const client = normalClients[Math.floor(Math.random() * normalClients.length)];
      
      // Normal users always bypass the IP block and target the server
      const { tx, ty } = getTarget(client.cx, client.cy, serverRadius + 4);
      
      const id = reqIdCounter.current++;
      const newReq = { id, cx: client.cx, cy: client.cy, tx, ty, type: 'normal' };
      
      setRequests(prev => {
        const next = [...prev, newReq];
        return next.length > 100 ? next.slice(next.length - 100) : next;
      });
      
      setTimeout(() => setRequests(prev => prev.filter(r => r.id !== id)), 800);
    }, 800); 
    
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    if (status === 'normal') {
      return (
        <div className="dos-status-container">
          <p className="dos-status-title dos-status-normal">Server handling traffic</p>
          <p className="dos-status-subtitle">Attacker volume is low, all requests processed successfully.</p>
        </div>
      );
    }
    if (status === 'crashing') {
      return (
        <div className="dos-status-container">
          <p className="dos-status-title dos-status-crashing">Server Crashing!</p>
          <p className="dos-status-subtitle">Single source flooding resources. Legitimate users are locked out.</p>
        </div>
      );
    }
    if (status === 'protected') {
      return (
        <div className="dos-status-container">
          <p className="dos-status-title dos-status-protected">IP Block Active</p>
          <p className="dos-status-subtitle">Firewall is dropping traffic from the attacker's IP. Normal users unaffected.</p>
        </div>
      );
    }
  };

  return (
    <div className="dos-wrapper">
      <div className="dos-header">
        <div>
          <h1 className="dos-title">
            Single-Source DoS
          </h1>
          <p className="dos-subtitle">Denial of Service Simulation & Mitigation</p>
        </div>
      </div>

      <div className="dos-card">
          
          <div className="dos-svg-container">
            <svg viewBox="0 0 550 440" className="dos-svg">
              <defs>
                <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--text-disabled)" opacity="0.6" />
                </marker>
                <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--danger-main)" opacity="0.6" />
                </marker>
              </defs>

              {/* Connecting Lines */}
              {clients.map((client) => {
                const targetR = (client.type === 'attacker' && status === 'protected') ? shieldRadius + 15 : serverRadius + 4;
                const { tx, ty } = getTarget(client.cx, client.cy, targetR);
                const isAttacker = client.type === 'attacker';

                return (
                  <line 
                    key={`line-${client.id}`}
                    x1={client.cx} y1={client.cy} x2={tx} y2={ty} 
                    stroke={isAttacker ? "var(--danger-main)" : "var(--text-disabled)"} 
                    strokeWidth="2" 
                    strokeDasharray={isAttacker ? "none" : "6 4"}
                    markerEnd={isAttacker ? "url(#arrow-red)" : "url(#arrow-blue)"}
                    style={{ transition: 'all 0.3s ease-out', opacity: 0.6 }}
                  />
                );
              })}

              {/* IP Block Shield (Active during protected status) */}
              <g style={{ transition: 'all 0.5s', opacity: status === 'protected' ? 1 : 0, transform: status === 'protected' ? 'scale(1)' : 'scale(0.95)', transformOrigin: 'center' }}>
                {/* Aura Arc */}
                <path 
                  d={`M ${serverX} ${serverY - shieldRadius - 10} A ${shieldRadius} ${shieldRadius} 0 0 0 ${serverX} ${serverY + shieldRadius + 10}`} 
                  fill="none" 
                  stroke="var(--success-main)" 
                  strokeWidth="24" 
                  strokeOpacity="0.15"
                  strokeLinecap="round"
                />
                {/* Solid Core Arc */}
                <path 
                  d={`M ${serverX} ${serverY - shieldRadius - 10} A ${shieldRadius} ${shieldRadius} 0 0 0 ${serverX} ${serverY + shieldRadius + 10}`} 
                  fill="none" 
                  stroke="var(--success-main)" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                />
                {/* Dashed outer arc (to look more like DDoS) */}
                <path 
                  d={`M ${serverX} ${serverY - shieldRadius - 20} A ${shieldRadius + 10} ${shieldRadius + 10} 0 0 0 ${serverX} ${serverY + shieldRadius + 20}`} 
                  fill="none" 
                  stroke="var(--success-main)" 
                  strokeWidth="2" 
                  strokeDasharray="10 8"
                  strokeLinecap="round"
                />
                <text x={serverX - shieldRadius + 5} y={serverY - shieldRadius - 30} fill="var(--success-main)" fontSize="12" fontWeight="bold" textAnchor="middle">
                  IP FILTER
                </text>
              </g>

              {/* Central Server */}
              <g className={`server-node ${status === 'crashing' ? 'server-crash-anim' : ''}`}>
                <circle 
                  cx={serverX} cy={serverY} 
                  r={serverRadius} 
                  fill={status === 'crashing' ? 'var(--danger-main)' : 'var(--background-paper)'} 
                  stroke="var(--text-primary)" 
                  strokeWidth="1.5"
                  style={{ transition: 'fill 0.3s' }}
                />
                <text 
                  x={serverX} y={serverY + 5} 
                  textAnchor="middle" 
                  className={`server-text ${status === 'crashing' ? 'crashing' : 'normal'}`}
                >
                  SERVER
                </text>
              </g>

              {/* Animated Requests */}
              {requests.map((req) => {
                let endScale = 0;
                let endOpacity = 0;
                let fill = req.type === 'attacker' ? 'var(--danger-main)' : 'var(--primary-main)';

                if (req.type === 'attacker') {
                  // Explode if hitting server during crash, or hitting the firewall
                  if (status === 'crashing' || status === 'protected') endScale = 3;
                } else {
                  // If normal user hits server while crashing, it bounces/fails (turns gray, shrinks)
                  if (status === 'crashing') {
                    endScale = 0;
                    fill = 'var(--text-disabled)';
                  }
                }

                return (
                  <circle
                    key={`req-${req.id}`}
                    r="4"
                    fill={fill}
                    className="request-particle"
                    style={{
                      '--start-x': `${req.cx}px`,
                      '--start-y': `${req.cy}px`,
                      '--end-x': `${req.tx}px`,
                      '--end-y': `${req.ty}px`,
                      '--end-scale': endScale,
                      '--end-opacity': endOpacity,
                    }}
                  />
                );
              })}

              {/* Client Nodes */}
              {clients.map(client => (
                <g key={client.id}>
                  {client.type === 'attacker' ? (
                    <g transform={`translate(${client.cx - 20}, ${client.cy - 15})`}>
                      <rect width="40" height="25" rx="3" fill="var(--background-paper)" stroke="var(--danger-main)" strokeWidth="2.5" />
                      <line x1="8" y1="25" x2="8" y2="30" stroke="var(--danger-main)" strokeWidth="2" />
                      <line x1="32" y1="25" x2="32" y2="30" stroke="var(--danger-main)" strokeWidth="2" />
                      <line x1="4" y1="30" x2="36" y2="30" stroke="var(--danger-main)" strokeWidth="4" strokeLinecap="round" />
                      <text x="20" y="16" fill="var(--danger-main)" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="2">X X</text>
                      <path d="M 15 20 Q 20 15 25 20" fill="none" stroke="var(--danger-main)" strokeWidth="2" />
                      <text x="20" y="45" fill="var(--danger-main)" fontSize="12" fontWeight="bold" textAnchor="middle">ATTACKER</text>
                    </g>
                  ) : (
                    <g transform={`translate(${client.cx - 15}, ${client.cy - 12})`}>
                      <rect width="30" height="20" rx="2" fill="var(--background-paper)" stroke="var(--text-primary)" strokeWidth="2.5" />
                      <line x1="15" y1="20" x2="15" y2="25" stroke="var(--text-primary)" strokeWidth="2.5" />
                      <line x1="5" y1="25" x2="25" y2="25" stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />
                      <text x="15" y="40" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">USER</text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="dos-controls">
            
            <div className="dos-slider-container">
              <input 
                type="range" 
                min="0" max="100" 
                value={requestLevel}
                onChange={(e) => setRequestLevel(Number(e.target.value))}
                className="dos-slider"
                style={{
                  '--thumb-color': isOverloaded ? 'var(--danger-main)' : 'var(--primary-main)'
                }}
              />
              <div className="dos-slider-label">Attacker Request Volume</div>
            </div>

            <div className="dos-firewall-toggle">
              <button 
                onClick={() => setFirewallEnabled(!firewallEnabled)}
                className={`dos-toggle-btn ${firewallEnabled ? 'active' : 'inactive'}`}
              >
                <div className={`dos-toggle-thumb ${firewallEnabled ? 'active' : 'inactive'}`} />
              </button>
              <div>
                <div className="dos-firewall-label">IP Block</div>
                <div className="dos-slider-label" style={{ marginTop: 0, marginBottom: 0, textTransform: 'none' }}>Targeted Firewall</div>
              </div>
            </div>

          </div>

          {getStatusText()}

      </div>
    </div>
  );
}