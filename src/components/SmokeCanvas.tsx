import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
  drift: number;
  phase: number;
  speed: number;
  color: string;
}

interface SmokeCanvasProps {
  progress: number;          // 0 = invisible, 1 = fully engulfed
  accentColor: string;       // figurine bg color for tinted smoke
  active: boolean;           // whether to run the animation loop
  onFullyCovered?: () => void; // callback when progress >= 1 and smoke is dense
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Handle rgb/rgba strings too
  const clean = hex.trim();
  if (clean.startsWith('#')) {
    const h = clean.slice(1);
    const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  return { r: 120, g: 100, b: 160 };
}

export default function SmokeCanvas({ progress, accentColor, active }: SmokeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef(progress);
  const activeRef = useRef(active);

  // Keep refs in sync
  progressRef.current = progress;
  activeRef.current = active;

  const createParticles = useCallback((width: number, height: number, color: { r: number; g: number; b: number }) => {
    const count = Math.floor((width * height) / 3000);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // Spread some particles from center (figurine origin) outward
      const fromCenter = Math.random() < 0.6;
      const cx = width / 2;
      const cy = height * 0.55; // figurine center roughly

      const spreadX = fromCenter
        ? cx + (Math.random() - 0.5) * width * 0.5
        : Math.random() * width;
      const spreadY = fromCenter
        ? cy + (Math.random() - 0.5) * height * 0.4
        : Math.random() * height;

      const r = Math.floor(color.r + (Math.random() - 0.5) * 40);
      const g = Math.floor(color.g + (Math.random() - 0.5) * 40);
      const b = Math.floor(color.b + (Math.random() - 0.5) * 40);
      const particleColor = `${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))}`;

      particles.push({
        x: spreadX,
        y: spreadY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.3 + 0.05),
        radius: Math.random() * 180 + 80,
        opacity: 0,
        baseOpacity: Math.random() * 0.55 + 0.15,
        drift: (Math.random() - 0.5) * 0.003,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.1,
        color: particleColor,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Init / resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rgb = hexToRgb(accentColor);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles(canvas.width, canvas.height, rgb);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [accentColor, createParticles]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const p = progressRef.current;

      if (p <= 0 && !activeRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const now = performance.now() * 0.001;

      // Draw a base vignette / fog layer
      if (p > 0) {
        const radGrad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.05,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.85,
        );
        const rgb = hexToRgb(accentColor);
        const vigOpacity = Math.min(p * 1.2, 0.96);
        radGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        radGrad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${vigOpacity * 0.45})`);
        radGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${vigOpacity})`);
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center burst glow
        const burstGrad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height * 0.5, 0,
          canvas.width / 2, canvas.height * 0.5, canvas.width * 0.5,
        );
        burstGrad.addColorStop(0, `rgba(255,255,255,${p * 0.3})`);
        burstGrad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},${p * 0.15})`);
        burstGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = burstGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw smoke particles
      for (const particle of particles) {
        particle.phase += 0.008 * particle.speed;
        particle.x += particle.vx + Math.sin(now * 0.3 + particle.phase) * 0.15;
        particle.y += particle.vy;
        particle.vx += particle.drift;

        // Wrap vertically
        if (particle.y + particle.radius < 0) {
          particle.y = canvas.height + particle.radius;
          particle.x = Math.random() * canvas.width;
        }

        // Target opacity driven by progress + natural pulse
        const pulse = Math.sin(now * 0.5 + particle.phase) * 0.08;
        const targetOpacity = particle.baseOpacity * p + pulse * p;
        particle.opacity += (targetOpacity - particle.opacity) * 0.02;

        if (particle.opacity <= 0.005) continue;

        // Parallax-like depth: particles near center move slower (deep)
        const distFromCenter = Math.hypot(
          particle.x - canvas.width / 2,
          particle.y - canvas.height / 2,
        );
        const parallaxScale = 1 + (distFromCenter / (canvas.width * 0.8)) * p * 0.3;

        const grad = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius * parallaxScale,
        );
        grad.addColorStop(0, `rgba(${particle.color},${particle.opacity * 0.9})`);
        grad.addColorStop(0.4, `rgba(${particle.color},${particle.opacity * 0.5})`);
        grad.addColorStop(1, `rgba(${particle.color},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * parallaxScale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Full white flash at peak (p close to 1)
      if (p > 0.88) {
        const flashOpacity = Math.min((p - 0.88) / 0.12, 1);
        ctx.fillStyle = `rgba(255,255,255,${flashOpacity * 0.95})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    />
  );
}
