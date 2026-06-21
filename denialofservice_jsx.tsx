import React, { useState, useMemo, useEffect, useRef } from 'react';

export default function App() {
  const [requestLevel, setRequestLevel] = useState(20);
  const [firewallEnabled, setFirewallEnabled] = useState(false);
  const [externalRequests, setExternalRequests] = useState([]);
  const [internalRequests, setInternalRequests] = useState([]);
  
  const extReqIdCounter = useRef(0);
  const intReqIdCounter = useRef(0);

  // Constants and thresholds
  const THRESHOLD = 70;
  const isOverloaded = requestLevel > THRESHOLD;
  
  // Determine current state
  let status = 'normal';
  if (isOverloaded && !firewallEnabled) status = 'crashing';
  if (isOverloaded && firewallEnabled) status = 'protected';

  // Map the slider value (1-100) to a number of client dots (4 to 32)
  const numClients = Math.floor(4 + (requestLevel / 100) * 28);

  // SVG dimensions
  const center = 250;
  const orbitRadius = 190;
  
  // Dynamic radii based on state
  const serverRadius = 45;
  const shieldOuterRadius = 75;
  const shieldInnerRadius = 55;

  // Generate clients and their angles
  const clients = useMemo(() => {
    const nodes = [];
    for (let i = 0; i < numClients; i++) {
      const angle = (i / numClients) * 2 * Math.PI - Math.PI / 2; 
      const cx = center + orbitRadius * Math.cos(angle);
      const cy = center + orbitRadius * Math.sin(angle);
      
      // Determine if this is inherently a "malicious/excess" request source
      const isRedBase = (i % 2 !== 0 || i % 3 === 0) && requestLevel > 40;

      nodes.push({ id: i, cx, cy, angle, isRedBase });
    }
    return nodes;
  }, [numClients, requestLevel]);

  // Effect to continuously spawn random EXTERNAL request balls
  useEffect(() => {
    const spawnSpeed = Math.max(20, 800 - (requestLevel * 7.8)); 

    const interval = setInterval(() => {
      if (clients.length === 0) return;
      
      const client = clients[Math.floor(Math.random() * clients.length)];
      
      // All become red when crashing without firewall. Otherwise, keep their base intent.
      const isRed = status === 'crashing' ? true : client.isRedBase;
      
      // If firewall is active, target the shield's outer edge. Otherwise, target the server.
      const targetRadius = status === 'protected' ? shieldOuterRadius : serverRadius + 4;
      
      const tx = center + targetRadius * Math.cos(client.angle);
      const ty = center + targetRadius * Math.sin(client.angle);
      
      const id = extReqIdCounter.current++;
      
      const newReq = { id, cx: client.cx, cy: client.cy, tx, ty, isRed };
      
      setExternalRequests(prev => {
        const next = [...prev, newReq];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
      
      setTimeout(() => {
        setExternalRequests(prev => prev.filter(r => r.id !== id));
      }, 800);

    }, spawnSpeed);
    
    return () => clearInterval(interval);
  }, [clients, requestLevel, status]);

  // Effect to manage INTERNAL organized traffic (Only when Firewall is ON)
  useEffect(() => {
    if (status !== 'protected') return;

    // Steady, safe emission rate from the firewall to the server
    const interval = setInterval(() => {
      const queueIndex = Math.floor(Math.random() * 8); // 8 organized paths
      const angle = (queueIndex / 8) * 2 * Math.PI;
      
      // Start from inner edge of firewall, go to server edge
      const cx = center + shieldInnerRadius * Math.cos(angle);
      const cy = center + shieldInnerRadius * Math.sin(angle);
      const tx = center + (serverRadius + 4) * Math.cos(angle);
      const ty = center + (serverRadius + 4) * Math.sin(angle);

      const id = intReqIdCounter.current++;
      
      // Internal traffic is always cleaned/legitimate (blue)
      const newReq = { id, cx, cy, tx, ty, isRed: false };
      
      setInternalRequests(prev => {
        const next = [...prev, newReq];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
      
      // Faster travel time for the short internal distance
      setTimeout(() => {
        setInternalRequests(prev => prev.filter(r => r.id !== id));
      }, 400);

    }, 250); // Consistent, manageable interval
    
    return () => clearInterval(interval);
  }, [status]);


  // Determine text based on state
  const getStatusText = () => {
    if (status === 'normal') {
      return (
        <>
          <p className="text-xl font-medium text-gray-800">Server works normally</p>
          <p className="text-gray-600">(number of requests &lt; what it could handle)</p>
        </>
      );
    }
    if (status === 'crashing') {
      return (
        <>
          <p className="text-xl font-medium text-red-600">Server Crashing!</p>
          <p className="text-gray-600">(number of requests &gt; what it could handle)</p>
        </>
      );
    }
    if (status === 'protected') {
      return (
        <>
          <p className="text-xl font-medium text-emerald-600">Firewall Organizing Traffic</p>
          <p className="text-gray-600">Absorbing flood & sending safe queue to server</p>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      
      <style>{`
        .dos-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: linear-gradient(to right, #2563eb, #ef4444);
          outline: none;
        }
        .dos-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${isOverloaded ? '#ef4444' : '#2563eb'};
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: background 0.3s;
        }
        
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, -2px); }
        }
        .server-crash-anim {
          animation: shake 0.4s ease-in-out infinite;
          transform-origin: center;
        }

        /* Continuous slow spin for the outer firewall shield */
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fw-spin {
          animation: slow-spin 12s linear infinite;
          transform-origin: 250px 250px;
        }

        /* Pulsing dots inside the firewall */
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .fw-pulse {
          animation: pulse-opacity 2s infinite ease-in-out;
        }

        /* Particles animations */
        @keyframes travel-and-pop {
          0% {
             transform: translate(var(--start-x), var(--start-y)) scale(0);
             opacity: 0;
          }
          5% {
             transform: translate(var(--start-x), var(--start-y)) scale(1);
             opacity: 1;
          }
          85% {
             transform: translate(var(--end-x), var(--end-y)) scale(1);
             opacity: 1;
          }
          100% {
             /* --end-scale decides if it explodes (3) or absorbs/enters smoothly (0) */
             transform: translate(var(--end-x), var(--end-y)) scale(var(--end-scale));
             opacity: 0;
          }
        }
        
        .request-particle {
          animation: travel-and-pop 0.8s linear forwards;
        }
        .internal-particle {
          animation: travel-and-pop 0.4s linear forwards;
        }
      `}</style>

      <h1 className="text-4xl md:text-5xl font-bold mb-10 text-black">
        Denial of Service
      </h1>

      {/* Main Visualization Area */}
      <div className="relative w-full max-w-[500px] aspect-square mb-12">
        <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-sm">
          <defs>
            {/* Arrowhead definitions */}
            <marker id="arrow-gray" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#d1d5db" />
            </marker>
            <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#fca5a5" />
            </marker>
            <marker id="arrow-blue-small" markerWidth="8" markerHeight="8" refX="6" refY="2" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,4 L6,2 z" fill="#93c5fd" />
            </marker>
          </defs>

          {/* Outer gray orbit ring */}
          <circle 
            cx={center} cy={center} r={orbitRadius} 
            fill="none" stroke="#f3f4f6" strokeWidth="4" 
          />

          {/* External Connective Lines */}
          {clients.map((client) => {
            const isRedLine = status === 'crashing' ? true : client.isRedBase;
            const strokeColor = isRedLine ? "#fca5a5" : "#e5e7eb";
            const markerId = isRedLine ? "url(#arrow-red)" : "url(#arrow-gray)";
            
            const targetR = status === 'protected' ? shieldOuterRadius : serverRadius + 4;
            const tx = center + targetR * Math.cos(client.angle);
            const ty = center + targetR * Math.sin(client.angle);

            return (
              <line 
                key={`line-${client.id}`}
                x1={client.cx} y1={client.cy} 
                x2={tx} y2={ty} 
                stroke={strokeColor} 
                strokeWidth="2"
                markerEnd={markerId}
                className="transition-all duration-300 ease-out"
              />
            );
          })}

          {/* Internal Connective Lines (Organized Queues) */}
          {status === 'protected' && Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 2 * Math.PI;
            const x1 = center + shieldInnerRadius * Math.cos(angle);
            const y1 = center + shieldInnerRadius * Math.sin(angle);
            const x2 = center + (serverRadius + 4) * Math.cos(angle);
            const y2 = center + (serverRadius + 4) * Math.sin(angle);
            
            return (
              <line 
                key={`internal-line-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#93c5fd" // Light blue queue lines
                strokeWidth="1.5"
                strokeDasharray="4 2"
                markerEnd="url(#arrow-blue-small)"
                className="opacity-60 transition-opacity duration-500"
              />
            );
          })}

          {/* Firewall Group */}
          <g className={`transition-all duration-500 ${status === 'protected' ? 'opacity-100' : 'opacity-0 scale-95 origin-center'}`}>
            {/* Thick translucent background (The processing zone) */}
            <circle 
              cx={center} cy={center} 
              r="65" 
              fill="#10b981" fillOpacity="0.1"
              stroke="#10b981" strokeWidth="20" strokeOpacity="0.15" 
            />
            
            {/* Outer scanning/filtering ring (Spins) */}
            <circle 
              cx={center} cy={center} 
              r={shieldOuterRadius} 
              fill="none" 
              stroke="#10b981" strokeWidth="2" strokeDasharray="12 8"
              className="fw-spin"
            />
            
            {/* Inner dispatch ring */}
            <circle 
              cx={center} cy={center} 
              r={shieldInnerRadius} 
              fill="none" 
              stroke="#059669" strokeWidth="2"
            />

            {/* Processing Nodes (Pulsing dots representing organization logic) */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * 2 * Math.PI;
              const r = 65; // Middle of the firewall zone
              return (
                <circle 
                  key={`node-${i}`}
                  cx={center + r * Math.cos(angle)} 
                  cy={center + r * Math.sin(angle)} 
                  r="2.5" 
                  fill="#34d399"
                  className="fw-pulse"
                  style={{ animationDelay: `${(i % 4) * 0.5}s` }}
                />
              );
            })}
          </g>

          {/* Central Server */}
          <g className={status === 'crashing' ? 'server-crash-anim' : 'transition-all duration-300'}>
            <circle 
              cx={center} cy={center} 
              r={serverRadius} 
              fill={status === 'crashing' ? '#ef4444' : '#ffffff'} 
              stroke="#1f2937" 
              strokeWidth="1.5"
              className="transition-colors duration-300"
            />
            <text 
              x={center} y={center + 5} 
              textAnchor="middle" 
              className={`text-sm font-medium transition-colors duration-300 ${status === 'crashing' ? 'fill-white' : 'fill-gray-800'}`}
            >
              Server
            </text>
          </g>

          {/* Active EXTERNAL Request Balls */}
          {externalRequests.map((req) => {
            // If malicious OR hitting the server directly, it explodes (scale 3). 
            // If legitimate AND hitting the firewall, it is absorbed cleanly (scale 0).
            const endScale = (req.isRed || status !== 'protected') ? 3 : 0;
            
            return (
              <circle 
                key={req.id}
                r="4.5" 
                fill={req.isRed ? '#ef4444' : '#3b82f6'}
                className="request-particle"
                style={{
                  '--start-x': `${req.cx}px`,
                  '--start-y': `${req.cy}px`,
                  '--end-x': `${req.tx}px`,
                  '--end-y': `${req.ty}px`,
                  '--end-scale': endScale,
                }}
              />
            );
          })}

          {/* Active INTERNAL Request Balls (Only active when Firewall is organizing) */}
          {internalRequests.map((req) => (
             <circle 
                key={`int-${req.id}`}
                r="3.5" 
                fill="#3b82f6" // Always legitimate traffic
                className="internal-particle"
                style={{
                  '--start-x': `${req.cx}px`,
                  '--start-y': `${req.cy}px`,
                  '--end-x': `${req.tx}px`,
                  '--end-y': `${req.ty}px`,
                  '--end-scale': 0, // Absorbed by server cleanly
                }}
              />
          ))}

          {/* Computer Icons (Clients) */}
          {clients.map((client) => (
            <g key={`comp-${client.id}`} transform={`translate(${client.cx}, ${client.cy}) scale(0.85)`}>
              <rect x="-14" y="-11" width="28" height="18" rx="2" fill="#ffffff" stroke="#1f2937" strokeWidth="2.5" />
              <path d="M-18 11 L18 11" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-5" y1="7" x2="-5" y2="11" stroke="#1f2937" strokeWidth="2.5" />
              <line x1="5" y1="7" x2="5" y2="11" stroke="#1f2937" strokeWidth="2.5" />
            </g>
          ))}
        </svg>
      </div>

      {/* Controls Area */}
      <div className="w-full max-w-[600px] flex flex-col md:flex-row items-center justify-between gap-10 px-4">
        
        {/* Slider Control */}
        <div className="flex-1 w-full max-w-[300px] flex flex-col items-center">
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={requestLevel}
            onChange={(e) => setRequestLevel(parseInt(e.target.value))}
            className="dos-slider mb-2"
          />
          <div className="text-center text-sm text-gray-600 mt-2">
            <span className="md:hidden">Adjust Request Volume</span>
          </div>
        </div>

        {/* Firewall Toggle */}
        <div className="flex items-center gap-4">
          <button
            className={`w-16 h-8 rounded-full flex items-center transition-colors duration-300 focus:outline-none shadow-inner ${
              firewallEnabled ? 'bg-black' : 'bg-gray-200 border-2 border-gray-300'
            }`}
            onClick={() => setFirewallEnabled(!firewallEnabled)}
            aria-label="Toggle Firewall"
          >
            <div 
              className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                firewallEnabled ? 'translate-x-9' : 'translate-x-1'
              }`} 
            />
          </button>
          <span className="text-2xl font-bold text-black">Firewall</span>
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="mt-12 text-center h-20">
        {getStatusText()}
      </div>

      {/* Hidden helper text for desktop */}
      <div className="hidden md:block fixed right-10 bottom-40 text-right">
        <p className="text-lg text-gray-800">Slider of</p>
        <p className="text-lg text-gray-800">number of</p>
        <p className="text-lg text-gray-800">requests</p>
        <svg className="absolute -left-32 top-8 w-24 h-8" viewBox="0 0 100 20">
           <path d="M 0 10 Q 50 15 100 5" fill="none" stroke="#6b7280" strokeWidth="2" markerStart="url(#arrow-gray)"/>
        </svg>
      </div>

    </div>
  );
}