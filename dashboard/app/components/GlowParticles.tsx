"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  alpha: number;
}

export default function GlowParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const spawnParticles = useCallback((x: number, y: number, now: number) => {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 1.2;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: now,
        maxLife: 600 + Math.random() * 800,
        size: 1.5 + Math.random() * 3,
        hue: 240 + Math.random() * 80,
        alpha: 0.7 + Math.random() * 0.3,
      });
    }
    lastSpawnRef.current = now;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      const now = performance.now();
      if (now - lastSpawnRef.current > 16) {
        spawnParticles(e.clientX, e.clientY, now);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      mouseRef.current.x = t.clientX;
      mouseRef.current.y = t.clientY;
      mouseRef.current.active = true;
      const now = performance.now();
      if (now - lastSpawnRef.current > 20) {
        spawnParticles(t.clientX, t.clientY, now);
      }
    }

    function handleLeave() {
      mouseRef.current.active = false;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.life;
        if (age > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.008;
        p.vx *= 0.995;
        p.vy *= 0.995;

        const progress = age / p.maxLife;
        const fade = 1 - progress;
        const currentAlpha = p.alpha * fade;
        const currentSize = p.size * (1 - progress * 0.5);

        if (currentAlpha < 0.01) continue;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, currentSize * 4
        );
        gradient.addColorStop(0, `hsla(${p.hue}, 85%, 65%, ${currentAlpha * 0.6})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 90%, 55%, ${currentAlpha * 0.2})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 90%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 90%, ${currentAlpha * 0.9})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="glow-particles-canvas"
      aria-hidden="true"
    />
  );
}