/**
 * Threads — React Bits animated background
 * Fonte: https://reactbits.dev/backgrounds/threads
 * Adaptado para React 19 + Tailwind v4 + shadcn/ui (Meu Ganho Pessoal)
 */

import { useEffect, useRef } from "react";

interface ThreadsProps {
  color?: [number, number, number];
  amplitude?: number;
  distance?: number;
  enableMouseInteraction?: boolean;
  className?: string;
}

interface ThreadPoint {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: { x: number; y: number; vx: number; vy: number };
}

interface Thread {
  id: number;
  points: ThreadPoint[];
  color: string;
  opacity: number;
  width: number;
}

export function Threads({
  color = [0, 200, 100],
  amplitude = 0.5,
  distance = 0,
  enableMouseInteraction = true,
  className,
}: ThreadsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const threadsRef = useRef<Thread[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const THREAD_COUNT = 18;
    const POINTS_PER_THREAD = 30;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initThreads();
    };

    const initThreads = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      threadsRef.current = Array.from({ length: THREAD_COUNT }, (_, i) => {
        const yBase = (h / (THREAD_COUNT - 1)) * i;
        const opacity = 0.08 + Math.random() * 0.28;
        const width = 0.5 + Math.random() * 1.2;
        const points: ThreadPoint[] = Array.from(
          { length: POINTS_PER_THREAD },
          (_, j) => ({
            x: (w / (POINTS_PER_THREAD - 1)) * j,
            y: yBase,
            wave: { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          })
        );
        return {
          id: i,
          points,
          color: `rgba(${color[0]},${color[1]},${color[2]}`,
          opacity,
          width,
        };
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const drawThread = (thread: Thread, time: number) => {
      const pts = thread.points;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x + pts[0].cursor.x, pts[0].y + pts[0].cursor.y);

      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        const next = pts[i + 1];

        const waveAmpX = amplitude * 25 * Math.sin(p.wave.x + time * 0.4);
        const waveAmpY = amplitude * 18 * Math.sin(p.wave.y + time * 0.3);

        if (enableMouseInteraction && mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x;
          const dy = (p.y + waveAmpY) - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / (120 + distance));
          const force = influence * influence * 60;
          p.cursor.vx += (dx / (dist + 0.001)) * force * 0.12;
          p.cursor.vy += (dy / (dist + 0.001)) * force * 0.12;
        }

        p.cursor.vx *= 0.88;
        p.cursor.vy *= 0.88;
        p.cursor.x += p.cursor.vx;
        p.cursor.y += p.cursor.vy;

        const cx = p.x + waveAmpX + p.cursor.x;
        const cy = p.y + waveAmpY + p.cursor.y;
        const nx = next.x + amplitude * 25 * Math.sin(next.wave.x + time * 0.4) + next.cursor.x;
        const ny = next.y + amplitude * 18 * Math.sin(next.wave.y + time * 0.3) + next.cursor.y;

        ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
      }

      const last = pts[pts.length - 1];
      ctx.lineTo(last.x + last.cursor.x, last.y + last.cursor.y);

      ctx.strokeStyle = `${thread.color},${thread.opacity})`;
      ctx.lineWidth = thread.width;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      timeRef.current += 0.008;
      threadsRef.current.forEach((thread) => drawThread(thread, timeRef.current));
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animate();

    if (enableMouseInteraction) {
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseleave", onMouseLeave);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animationRef.current);
      ro.disconnect();
      if (enableMouseInteraction) {
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, [color, amplitude, distance, enableMouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
