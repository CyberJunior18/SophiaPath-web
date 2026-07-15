import React, { useEffect, useRef } from 'react';

const ComputerScienceCourseCover = ({ 
  totalLessons = 50, 
  lessonsFinished = 15, 
  height = 160, 
  borderRadius, 
  borderBottom,
  badgePosition = 'bottom'
}) => {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);

  const totalNodes = totalLessons || 1;
  const activeNodes = lessonsFinished || 0;

  // Generate computer science network nodes
  const createNode = (index) => {
    const baseRadius = 50 + (index % 6) * 15 + Math.random() * 10;
    return {
      angle: Math.random() * Math.PI * 2,
      baseRadius,
      radius: baseRadius,
      speed: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.008),
      wobbleSpeed: 0.01 + Math.random() * 0.02,
      wobbleOffset: Math.random() * Math.PI * 2,
      size: 1.5 + Math.random() * 2,
      isActive: false,
      pulsePosition: Math.random()
    };
  };

  useEffect(() => {
    const currentNodes = nodesRef.current;
    while (currentNodes.length < totalNodes) {
      currentNodes.push(createNode(currentNodes.length));
    }
    if (currentNodes.length > totalNodes) {
      currentNodes.length = totalNodes;
    }
    const actualActive = Math.min(activeNodes, totalNodes);
    for (let i = 0; i < currentNodes.length; i++) {
      currentNodes[i].isActive = i < actualActive;
    }
  }, [totalNodes, activeNodes]);

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
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offset = (time * 4) % gridSize;

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

    const drawCPU = (cx, cy, time) => {
      const pulse = Math.sin(time * 3) * 1.2;
      const cpuSize = 24 + pulse;

      // Glow effect around the CPU
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cpuSize * 2);
      glowGrad.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cx - cpuSize * 2.5, cy - cpuSize * 2.5, cpuSize * 5, cpuSize * 5);

      ctx.save();
      ctx.translate(cx, cy);

      // CPU Outer pins (circuit lines)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 1.5;
      const pinLength = 8;
      
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        for (let j = -12; j <= 12; j += 8) {
          ctx.beginPath();
          ctx.moveTo(j, -cpuSize);
          ctx.lineTo(j, -cpuSize - pinLength);
          ctx.stroke();
        }
      }

      // CPU Main Block
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#3b82f6';
      
      ctx.beginPath();
      ctx.roundRect(-cpuSize, -cpuSize, cpuSize * 2, cpuSize * 2, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Internal Core Die
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-cpuSize * 0.5, -cpuSize * 0.5, cpuSize, cpuSize, 2);
      ctx.fill();
      ctx.stroke();

      // Microprocessor trace lines in core
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-cpuSize * 0.3, -cpuSize * 0.2);
      ctx.lineTo(cpuSize * 0.3, -cpuSize * 0.2);
      ctx.moveTo(-cpuSize * 0.2, 0);
      ctx.lineTo(cpuSize * 0.2, 0);
      ctx.moveTo(-cpuSize * 0.3, cpuSize * 0.2);
      ctx.lineTo(cpuSize * 0.3, cpuSize * 0.2);
      ctx.stroke();

      ctx.restore();
    };

    const drawNetwork = (nodes, cx, cy, time) => {
      // Connect nodes with lines
      ctx.lineWidth = 0.75;
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const ax = cx + Math.cos(nodeA.angle) * nodeA.radius;
        const ay = cy + Math.sin(nodeA.angle) * nodeA.radius;

        // Draw connections to nearby nodes (closer in orbit index or index distance)
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.abs(i - j) > 4 && j % 6 !== i % 6) continue;
          
          const nodeB = nodes[j];
          const bx = cx + Math.cos(nodeB.angle) * nodeB.radius;
          const by = cy + Math.sin(nodeB.angle) * nodeB.radius;

          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < 110) {
            const isConnActive = nodeA.isActive && nodeB.isActive;
            ctx.strokeStyle = isConnActive 
              ? `rgba(96, 165, 250, ${0.15 * (1 - dist / 110)})`
              : `rgba(255, 255, 255, ${0.02 * (1 - dist / 110)})`;
            
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Draw a pulsing data packet along the active connection
            if (isConnActive && (i + j) % 3 === 0) {
              const pulseT = (time * 0.4 + (i + j) * 0.1) % 1;
              const px = ax + (bx - ax) * pulseT;
              const py = ay + (by - ay) * pulseT;
              ctx.fillStyle = '#60a5fa';
              ctx.beginPath();
              ctx.arc(px, py, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Draw nodes themselves
      nodes.forEach((node, idx) => {
        const x = cx + Math.cos(node.angle) * node.radius;
        const y = cy + Math.sin(node.angle) * node.radius;

        if (node.isActive) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#60a5fa';
          ctx.fillStyle = '#60a5fa';
          
          // Draw a small square node for digital/CS theme
          ctx.fillRect(x - node.size, y - node.size, node.size * 2, node.size * 2);
          ctx.shadowBlur = 0;

          // Connect active node directly back to core with a faint bus line
          if (idx % 5 === 0) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(cx, cy);
            ctx.stroke();

            // Pulse traveling to core
            node.pulsePosition = (node.pulsePosition + 0.008) % 1;
            const px = x + (cx - x) * node.pulsePosition;
            const py = y + (cy - y) * node.pulsePosition;
            ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
            ctx.fillRect(px - 1, py - 1, 2, 2);
          }
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.fillRect(x - node.size * 0.7, y - node.size * 0.7, node.size * 1.4, node.size * 1.4);
        }
      });
    };

    const render = () => {
      if (!canvas || !ctx) return;
      time += 0.016;

      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#020617');
      bgGradient.addColorStop(1, '#0b1329');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid(canvas.width, canvas.height, time);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Update node positions
      nodesRef.current.forEach((node) => {
        if (node.isActive) {
          // Active nodes orbit in a tighter, stable calculation ring
          node.radius += (40 - node.radius) * 0.04;
          node.angle += node.speed * 0.3;
        } else {
          const wobble = Math.sin(time * node.wobbleSpeed * 40 + node.wobbleOffset) * 15;
          node.radius = node.baseRadius + wobble;
          node.angle += node.speed;
        }
      });

      drawNetwork(nodesRef.current, cx, cy, time);
      drawCPU(cx, cy, time);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [totalNodes, activeNodes, height]);

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
            backgroundColor: '#3b82f6',
            display: 'inline-block'
          }}></span>
          Done: {activeNodes}
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
          Todo: {totalNodes - activeNodes}
        </span>
      </div>
    </div>
  );
};

export default ComputerScienceCourseCover;
