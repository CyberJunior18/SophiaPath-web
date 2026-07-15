import React, { useEffect, useRef } from 'react';

const CybersecurityCourseCover = ({ 
  totalLessons = 50, 
  lessonsFinished = 15, 
  height = 160, 
  borderRadius, 
  borderBottom,
  badgePosition = 'bottom'
}) => {
  const canvasRef = useRef(null);
  const bugsRef = useRef([]);

  const totalBugs = totalLessons || 1;
  const discoveredBugs = lessonsFinished || 0;

  // Generate a new bug with random characteristics, spreading the orbit base radius
  const createBug = (index) => {
    const baseRadius = 55 + (index % 5) * 18 + Math.random() * 10;
    return {
      angle: Math.random() * Math.PI * 2,
      baseRadius,
      radius: baseRadius,
      speed: (Math.random() > 0.5 ? 1 : -1) * (0.004 + Math.random() * 0.012),
      wobbleSpeed: 0.015 + Math.random() * 0.035,
      wobbleOffset: Math.random() * Math.PI * 2,
      size: 1.2 + Math.random() * 1.5,
      isDiscovered: false,
    };
  };

  // Manage bug population when props change
  useEffect(() => {
    const currentBugs = bugsRef.current;
    
    // Add bugs if needed
    while (currentBugs.length < totalBugs) {
      currentBugs.push(createBug(currentBugs.length));
    }
    
    // Remove bugs if needed
    if (currentBugs.length > totalBugs) {
      currentBugs.length = totalBugs;
    }
    
    const actualDiscovered = Math.min(discoveredBugs, totalBugs);
    
    // Update statuses (first N bugs are discovered)
    for (let i = 0; i < currentBugs.length; i++) {
      currentBugs[i].isDiscovered = i < actualDiscovered;
    }
  }, [totalBugs, discoveredBugs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || 300;
      canvas.height = canvas.offsetHeight || (typeof height === 'number' ? height : window.innerHeight);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawGrid = (width, height, time) => {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      const offset = (time * 5) % gridSize;

      ctx.beginPath();
      for (let x = offset; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offset; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    };

    const drawShield = (cx, cy, time) => {
      const pulse = Math.sin(time * 2) * 1.5;
      const shieldSize = 22 + pulse;

      // Inner glow
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, shieldSize * 1.5);
      gradient.addColorStop(0, 'rgba(0, 243, 255, 0.12)');
      gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - shieldSize * 2, cy - shieldSize * 2, shieldSize * 4, shieldSize * 4);

      ctx.save();
      ctx.translate(cx, cy);

      // Outer rotating dashed ring
      ctx.rotate(time * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, shieldSize * 1.4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.rotate(-time * 0.5);

      // Shield Shape
      ctx.beginPath();
      ctx.moveTo(0, -shieldSize);
      ctx.lineTo(shieldSize * 0.8, -shieldSize * 0.6);
      ctx.lineTo(shieldSize * 0.8, shieldSize * 0.4);
      ctx.lineTo(0, shieldSize);
      ctx.lineTo(-shieldSize * 0.8, shieldSize * 0.4);
      ctx.lineTo(-shieldSize * 0.8, -shieldSize * 0.6);
      ctx.closePath();

      ctx.fillStyle = 'rgba(10, 20, 35, 0.85)';
      ctx.fill();

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f3ff';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center Lock Icon
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-5, -1, 10, 8);
      ctx.beginPath();
      ctx.arc(0, -1, 3.5, Math.PI, 0);
      ctx.stroke();

      ctx.restore();
    };

    const drawBug = (bug, cx, cy, time) => {
      const x = cx + Math.cos(bug.angle) * bug.radius;
      const y = cy + Math.sin(bug.angle) * bug.radius;

      ctx.save();
      ctx.translate(x, y);

      if (bug.isDiscovered) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#00ff66';
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(-bug.size, -bug.size, bug.size * 2, bug.size * 2);
        
        // Target reticle
        const reticleSize = bug.size * 2.2 + Math.sin(time * 5);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.5)';
        ctx.lineWidth = 0.75;
        const bracket = reticleSize * 0.4;
        
        ctx.beginPath(); ctx.moveTo(-reticleSize, -reticleSize + bracket); ctx.lineTo(-reticleSize, -reticleSize); ctx.lineTo(-reticleSize + bracket, -reticleSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(reticleSize - bracket, -reticleSize); ctx.lineTo(reticleSize, -reticleSize); ctx.lineTo(reticleSize, -reticleSize + bracket); ctx.stroke();
        
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else {
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ff2a2a';
        ctx.fillStyle = '#ff2a2a';
        
        ctx.rotate(bug.angle + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -bug.size * 1.8);
        ctx.lineTo(bug.size, bug.size);
        ctx.lineTo(0, bug.size * 0.5);
        ctx.lineTo(-bug.size, bug.size);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    };

    const render = () => {
      if (!canvas || !ctx) return;
      time += 0.016;
      
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#020617');
      bgGradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid(canvas.width, canvas.height, time);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      bugsRef.current.forEach((bug) => {
        if (bug.isDiscovered) {
          // Discovered bugs orbit closer in a stable ring
          bug.radius += (36 - bug.radius) * 0.05;
          bug.angle += bug.speed * 0.2; 
        } else {
          const wobble = Math.sin(time * bug.wobbleSpeed * 50 + bug.wobbleOffset) * 15;
          bug.radius = bug.baseRadius + wobble;
          bug.angle += bug.speed;
        }
        drawBug(bug, cx, cy, time);
      });

      drawShield(cx, cy, time);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [totalBugs, discoveredBugs, height]);

  const isFullScreen = height === '100vh' || height === '80vh' || height === '70vh' || height === '100%';
  const finalBorderRadius = borderRadius !== undefined ? borderRadius : (isFullScreen ? '0' : '28px 28px 0 0');
  const finalBorderBottom = borderBottom !== undefined ? borderBottom : (isFullScreen ? 'none' : '1px solid #1e293b');

  return (
    <div 
      style={{
        position: height === '100%' ? 'absolute' : 'relative',
        top: height === '100%' ? 0 : undefined,
        left: height === '100%' ? 0 : undefined,
        right: height === '100%' ? 0 : undefined,
        bottom: height === '100%' ? 0 : undefined,
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        borderRadius: finalBorderRadius,
        borderBottom: finalBorderBottom
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      {/* Dynamic Overlay badge showing metrics inside the cover */}
      <div style={{
        position: 'absolute',
        top: badgePosition === 'top' ? '12px' : 'auto',
        bottom: badgePosition === 'bottom' ? '12px' : 'auto',
        left: '12px',
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        border: '1px solid rgba(30, 41, 59, 0.8)',
        padding: '4px 10px',
        borderRadius: '8px',
        backdropFilter: 'blur(12px)',
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#cbd5e1',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
        zIndex: 5
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block'
          }}></span>
          Done: {discoveredBugs}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'inline-block'
          }}></span>
          Todo: {totalBugs - discoveredBugs}
        </span>
      </div>
    </div>
  );
};

export default CybersecurityCourseCover;
