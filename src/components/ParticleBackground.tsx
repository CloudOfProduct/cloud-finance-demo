import React, { useEffect, useRef } from 'react';

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle pool
    const particleCount = Math.min(Math.floor((width * height) / 22000), 65);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = [
      'rgba(0, 210, 255, ',
      'rgba(56, 189, 248, ',
      'rgba(99, 102, 241, ',
      'rgba(148, 163, 184, ',
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.45 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Deep space gradient backdrop
      const radialGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.25,
        50,
        width * 0.5,
        height * 0.5,
        width * 0.85
      );
      radialGradient.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      radialGradient.addColorStop(0.5, 'rgba(10, 15, 29, 0.25)');
      radialGradient.addColorStop(1, 'rgba(6, 9, 17, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle electric cloud aura
      const cloudGlow = ctx.createRadialGradient(
        width * 0.8,
        height * 0.15,
        10,
        width * 0.8,
        height * 0.15,
        450
      );
      cloudGlow.addColorStop(0, 'rgba(0, 210, 255, 0.04)');
      cloudGlow.addColorStop(1, 'rgba(0, 210, 255, 0)');
      ctx.fillStyle = cloudGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw faint constellation connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.12;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle electric twinkle
        const dynamicAlpha = p.alpha + Math.sin(tick * 0.02 + i) * 0.08;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, dynamicAlpha)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
};
