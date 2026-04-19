import { useEffect, useRef } from 'react';
import styles from './ParticleBackground.module.css';

type Particle = { x: number; y: number; vx: number; vy: number; r: number };

/** 全屏动态粒子 + 连线，随主题与鼠标微调，科技风背景 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const themeRef = useRef<'dark' | 'light'>('dark');
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const readTheme = (): 'dark' | 'light' =>
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';

    themeRef.current = readTheme();
    const mo = new MutationObserver(() => {
      themeRef.current = readTheme();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const initParticles = (w: number, h: number) => {
      const cap = Math.min(88, Math.max(42, Math.floor((w * h) / 16000)));
      const arr: Particle[] = [];
      for (let i = 0; i < cap; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.42,
          vy: (Math.random() - 0.5) * 0.42,
          r: Math.random() * 1.6 + 0.5,
        });
      }
      particlesRef.current = arr;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(w, h);
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const loop = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const dark = themeRef.current === 'dark';
      const linkDist = dark ? 118 : 92;

      const bg = ctx.createRadialGradient(
        w * 0.2,
        h * 0.15,
        0,
        w * 0.55,
        h * 0.45,
        Math.max(w, h) * 0.95
      );
      if (dark) {
        bg.addColorStop(0, '#0a1628');
        bg.addColorStop(0.35, '#0d1a32');
        bg.addColorStop(0.65, '#0a1224');
        bg.addColorStop(1, '#050810');
      } else {
        bg.addColorStop(0, '#e8effa');
        bg.addColorStop(0.45, '#dde8f5');
        bg.addColorStop(1, '#c8d4e8');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const lineRgb = dark ? '56, 189, 248' : '37, 99, 235';
      const dotOuter = dark ? '147, 197, 253' : '59, 130, 246';
      const dotInner = dark ? '255, 255, 255' : '255, 255, 255';

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < 180 && md > 0.5) {
          const pull = ((180 - md) / 180) * 0.032;
          p.vx -= (dx / md) * pull;
          p.vy -= (dy / md) * pull;
        }
        p.vx *= 0.994;
        p.vy *= 0.994;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            const t = 1 - d / linkDist;
            const alpha = t * (dark ? 0.42 : 0.22);
            ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
            ctx.lineWidth = dark ? 0.65 : 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = `rgba(${dotOuter}, ${dark ? 0.75 : 0.55})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${dotInner}, ${dark ? 0.22 : 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }

      const vignette = ctx.createRadialGradient(
        w * 0.5,
        h * 0.55,
        Math.max(w, h) * 0.18,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75
      );
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(
        1,
        dark ? 'rgba(3, 6, 14, 0.5)' : 'rgba(250, 252, 255, 0.35)'
      );
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    resize();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      mo.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden />;
}
