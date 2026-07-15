import React, { useEffect, useRef } from 'react';

const PhilosophyCourseCover = ({ 
  totalLessons = 50, 
  lessonsFinished = 15, 
  height = 160, 
  borderRadius, 
  borderBottom,
  badgePosition = 'bottom'
}) => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);

  const totalStars = totalLessons || 1;
  const activeStars = lessonsFinished || 0;

  // Generate constellation stars (insights)
  const createStar = (index) => {
    const baseRadius = 55 + (index % 5) * 18 + Math.random() * 12;
    return {
      angle: Math.random() * Math.PI * 2,
      baseRadius,
      radius: baseRadius,
      speed: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.006),
      wobbleSpeed: 0.005 + Math.random() * 0.015,
      wobbleOffset: Math.random() * Math.PI * 2,
      size: 1.2 + Math.random() * 2,
      isActive: false,
      twinkleOffset: Math.random() * Math.PI * 2
    };
  };

  useEffect(() => {
    const currentStars = starsRef.current;
    while (currentStars.length < totalStars) {
      currentStars.push(createStar(currentStars.length));
    }
    if (currentStars.length > totalStars) {
      currentStars.length = totalStars;
    }
    const actualActive = Math.min(activeStars, totalStars);
    for (let i = 0; i < currentStars.length; i++) {
      currentStars[i].isActive = i < actualActive;
    }
  }, [totalStars, activeStars]);

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

    // Draw concentric celestial rings and radiating lines (polar grid)
    const drawCelestialGrid = (cx, cy, time) => {
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.02)';
      ctx.lineWidth = 1;
      
      // Concentric circles
      for (let r = 40; r < 200; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radiating lines
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.02);
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 220, Math.sin(angle) * 220);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Draw a spinning 3D wireframe octahedron in the center
    const drawOctahedron = (cx, cy, time) => {
      const size = 20 + Math.sin(time * 1.5) * 1.0;
      const angleY = time * 0.4;
      const angleX = time * 0.25;

      // 3D vertices of an octahedron
      const vertices = [
        { x: 0, y: -size, z: 0 },
        { x: size, y: 0, z: 0 },
        { x: 0, y: 0, z: size },
        { x: -size, y: 0, z: 0 },
        { x: 0, y: 0, z: -size },
        { x: 0, y: size, z: 0 }
      ];

      // Project 3D vertices onto 2D viewport
      const project = (v) => {
        // Rotate around X axis
        let y1 = v.y * Math.cos(angleX) - v.z * Math.sin(angleX);
        let z1 = v.y * Math.sin(angleX) + v.z * Math.cos(angleX);
        
        // Rotate around Y axis
        let x2 = v.x * Math.cos(angleY) - z1 * Math.sin(angleY);
        let z2 = v.x * Math.sin(angleY) + z1 * Math.cos(angleY);

        // Perspective projection
        const d = 100;
        const scale = d / (d + z2);
        return {
          x: cx + x2 * scale,
          y: cy + y1 * scale
        };
      };

      const proj = vertices.map(project);

      // Inner glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 1.8);
      grad.addColorStop(0, 'rgba(217, 70, 239, 0.12)');
      grad.addColorStop(1, 'rgba(217, 70, 239, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - size * 2, cy - size * 2, size * 4, size * 4);

      // Draw edges of octahedron
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ec4899';

      const drawEdge = (i, j) => {
        ctx.beginPath();
        ctx.moveTo(proj[i].x, proj[i].y);
        ctx.lineTo(proj[j].x, proj[j].y);
        ctx.stroke();
      };

      // Top pyramid edges
      drawEdge(0, 1); drawEdge(0, 2); drawEdge(0, 3); drawEdge(0, 4);
      // Middle base edges
      drawEdge(1, 2); drawEdge(2, 3); drawEdge(3, 4); drawEdge(4, 1);
      // Bottom pyramid edges
      drawEdge(5, 1); drawEdge(5, 2); drawEdge(5, 3); drawEdge(5, 4);

      ctx.shadowBlur = 0;
    };

    // Draw constellation mapping
    const drawConstellation = (stars, cx, cy, time) => {
      ctx.lineWidth = 0.75;
      
      // Connect active insights/stars
      for (let i = 0; i < stars.length; i++) {
        const starA = stars[i];
        if (!starA.isActive) continue;

        const ax = cx + Math.cos(starA.angle) * starA.radius;
        const ay = cy + Math.sin(starA.angle) * starA.radius;

        for (let j = i + 1; j < stars.length; j++) {
          const starB = stars[j];
          if (!starB.isActive || Math.abs(i - j) > 4) continue;

          const bx = cx + Math.cos(starB.angle) * starB.radius;
          const by = cy + Math.sin(starB.angle) * starB.radius;

          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(236, 72, 153, ${0.15 * (1 - dist / 120)})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // Draw stars
      stars.forEach((star) => {
        const x = cx + Math.cos(star.angle) * star.radius;
        const y = cy + Math.sin(star.angle) * star.radius;
        const twinkle = Math.sin(time * 4 + star.twinkleOffset) * 0.4 + 0.6;

        if (star.isActive) {
          ctx.shadowBlur = 6 * twinkle;
          ctx.shadowColor = '#f59e0b'; // Gold glow for completed insights
          ctx.fillStyle = `rgba(245, 158, 11, ${twinkle})`;
          
          // Draw a small 4-point star for philosophy/ethics insight theme
          ctx.beginPath();
          ctx.moveTo(x, y - star.size * 1.8);
          ctx.lineTo(x + star.size * 0.5, y - star.size * 0.5);
          ctx.lineTo(x + star.size * 1.8, y);
          ctx.lineTo(x + star.size * 0.5, y + star.size * 0.5);
          ctx.lineTo(x, y + star.size * 1.8);
          ctx.lineTo(x - star.size * 0.5, y + star.size * 0.5);
          ctx.lineTo(x - star.size * 1.8, y);
          ctx.lineTo(x - star.size * 0.5, y - star.size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Inactive insights are faint background stars
          ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * twinkle})`;
          ctx.beginPath();
          ctx.arc(x, y, star.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const render = () => {
      if (!canvas || !ctx) return;
      time += 0.016;

      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0518');
      bgGradient.addColorStop(1, '#1b0e2d');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      drawCelestialGrid(cx, cy, time);

      // Update positions
      starsRef.current.forEach((star) => {
        if (star.isActive) {
          star.radius += (40 - star.radius) * 0.03;
          star.angle += star.speed * 0.25;
        } else {
          const wobble = Math.sin(time * star.wobbleSpeed * 30 + star.wobbleOffset) * 12;
          star.radius = star.baseRadius + wobble;
          star.angle += star.speed;
        }
      });

      drawConstellation(starsRef.current, cx, cy, time);
      drawOctahedron(cx, cy, time);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [totalStars, activeStars, height]);

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
            backgroundColor: '#ec4899',
            display: 'inline-block'
          }}></span>
          Done: {activeStars}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#475569',
            display: 'inline-block'
          }}></span>
          Todo: {totalStars - activeStars}
        </span>
      </div>
    </div>
  );
};

export default PhilosophyCourseCover;
