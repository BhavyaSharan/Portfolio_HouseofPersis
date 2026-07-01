import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SmokeCanvas from './components/SmokeCanvas';
import PortfolioOverlay from './components/PortfolioOverlay';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';

// ─── Data ────────────────────────────────────────────────────────────────────

const IMAGES = [
  {
    src: '/Vivan.png',
    bg: '#F4845F', panel: '#F79B7F', label: 'BOY',
    name: 'Vivan Oberoi',
    punchline: 'Where code meets canvas and algorithms become art — Creative Tech',
    dataIndex: 3,  // → PORTFOLIO_DATA[3] Luna Wei / Vivan
  },
  {
    src: '/Sameera.png',
    bg: '#520371ff', panel: '#ED9DC4', label: 'GIRL',
    name: 'Sameera Abrar',
    punchline: 'Hijabi girl stuck in this paapi world',
    scaleOverride: 0.88,
    dataIndex: 1,  // → PORTFOLIO_DATA[1] Sameera
  },
  {
    src: '/SurekhaKR.png',
    bg: '#6BBF7A', panel: '#85CC92', label: 'GIRL',
    name: 'Sureka KR',
    punchline: 'Just a girl surviving in a world that desperately needs better content.',
    scaleOverride: 0.82,
    dataIndex: 0,  // → PORTFOLIO_DATA[0] Surekha
  },
  {
    src: '/Niraj.png',
    bg: '#6EB5FF', panel: '#8DC4FF', label: 'BOY',
    name: 'Niraj Bhoite',
    punchline: 'Smile Karo, Baaki Editing main Sambhalenge!',
    scaleOverride: 0.90,
    dataIndex: 2,  // → PORTFOLIO_DATA[2] Niraj
  },
  {
    src: '/Bhavya.png',
    bg: '#E8A020', panel: '#F0B840', label: 'BOY',
    name: 'Bhavya Sharan',
    punchline: 'Turning ideas into digital reality — one line of code at a time.',
    scaleOverride: 0.88,
    dataIndex: 4,  // → PORTFOLIO_DATA[4] Bhavya
  },
];

const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E`;

// ─── Types ───────────────────────────────────────────────────────────────────

type Direction = 'next' | 'prev';
type Role = 'center' | 'left' | 'right' | 'back';

/**
 * React-visible state: only 'idle' or 'portfolio'.
 * Internal animation sub-phases live purely in animPhaseRef (never setState mid-animation).
 */
type PortalPhase = 'idle' | 'portfolio';
type AnimPhase = 'idle' | 'entering' | 'covering' | 'portfolio' | 'exiting' | 'uncovering';

// ─── Easing ──────────────────────────────────────────────────────────────────

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ToonHub() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCarouselAnimating, setIsCarouselAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [preloaderDone, setPreloaderDone] = useState(false);

  // React portal state — only two values, no intermediate phases in state
  const [portalPhase, setPortalPhase] = useState<PortalPhase>('idle');
  const [portalIndex, setPortalIndex] = useState(0);
  const [showPortfolio, setShowPortfolio] = useState(false);

  // Live animation values (updated every rAF frame via setState)
  const [smokeProgress, setSmokeProgress] = useState(0);
  const [cameraScale, setCameraScale] = useState(1);
  const [cameraBlur, setCameraBlur] = useState(0);
  const [motionBlur, setMotionBlur] = useState(false);
  const [bgColor, setBgColor] = useState(IMAGES[0].bg);

  // Drag / swipe refs
  const dragStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Internal refs — never trigger re-renders on their own
  const animPhaseRef = useRef<AnimPhase>('idle');
  const animFrameRef = useRef<number>(0);
  const phaseStartRef = useRef<number>(0);
  const portalIndexRef = useRef(0);
  const activeIndexRef = useRef(activeIndex);
  const carouselTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  activeIndexRef.current = activeIndex;

  // ── Preload images
  useEffect(() => {
    IMAGES.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // ── Track viewport width
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Bg colour sync (only when fully idle)
  useEffect(() => {
    if (portalPhase === 'idle') {
      setBgColor(IMAGES[activeIndex].bg);
    }
  }, [activeIndex, portalPhase]);

  // ── Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(animFrameRef.current);
    if (carouselTimerRef.current) clearTimeout(carouselTimerRef.current);
  }, []);

  const N = IMAGES.length;

  // ── Carousel navigation
  const navigate = useCallback(
    (dir: Direction) => {
      if (isCarouselAnimating || portalPhase !== 'idle') return;
      setIsCarouselAnimating(true);
      setActiveIndex((prev) => dir === 'next' ? (prev + 1) % N : (prev + N - 1) % N);
      if (carouselTimerRef.current) clearTimeout(carouselTimerRef.current);
      carouselTimerRef.current = setTimeout(() => setIsCarouselAnimating(false), 650);
    },
    [isCarouselAnimating, portalPhase, N],
  );

  // ── Touch / mouse swipe handlers
  const onDragStart = useCallback((clientX: number) => {
    dragStartX.current = clientX;
    isDragging.current = false;
    document.body.classList.add('dragging');
  }, []);

  const onDragEnd = useCallback((clientX: number) => {
    document.body.classList.remove('dragging');
    if (dragStartX.current === null) return;
    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > 50) navigate(delta < 0 ? 'next' : 'prev');
    dragStartX.current = null;
    isDragging.current = false;
  }, [navigate]);

  // ── Role assignment
  const getRole = (i: number): Role => {
    if (i === activeIndex) return 'center';
    if (i === (activeIndex + N - 1) % N) return 'left';
    if (i === (activeIndex + 1) % N) return 'right';
    return 'back';
  };

  // ── Per-role styles (enhanced during portal)
  const roleStyle = useCallback(
    (role: Role, i: number): React.CSSProperties => {
      const isAnim = animPhaseRef.current !== 'idle' && animPhaseRef.current !== 'portfolio';
      const isPortalTarget = isAnim && i === portalIndexRef.current;
      const isNotTarget = isAnim && i !== portalIndexRef.current;

      const transition =
        'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1)';
      const willChange = 'transform, filter, opacity';

      let base: React.CSSProperties;
      switch (role) {
        case 'center':
          base = {
            left: '50%', bottom: isMobile ? '0%' : '0', height: isMobile ? '72%' : '92%',
            transform: `translateX(-50%) scale(${isMobile ? 1 : 1.68})`, filter: 'none', opacity: 1, zIndex: 20, transition, willChange
          };
          break;
        case 'left':
          base = {
            left: isMobile ? '20%' : '30%', bottom: isMobile ? '12%' : '12%', height: isMobile ? '18%' : '28%',
            transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10, transition, willChange
          };
          break;
        case 'right':
          base = {
            left: isMobile ? '80%' : '70%', bottom: isMobile ? '12%' : '12%', height: isMobile ? '18%' : '28%',
            transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10, transition, willChange
          };
          break;
        default:
          base = {
            left: '50%', bottom: isMobile ? '12%' : '12%', height: isMobile ? '14%' : '22%',
            transform: 'translateX(-50%) scale(1)', filter: 'blur(4px)', opacity: 1, zIndex: 5, transition, willChange
          };
      }

      if (isPortalTarget) {
        base = {
          ...base,
          transform: `translateX(-50%) scale(${cameraScale * (isMobile ? 1.25 : 1.68)})`,
          filter: motionBlur ? `blur(${cameraBlur + 4}px)` : cameraBlur > 0 ? `blur(${cameraBlur}px)` : 'none',
          transition: 'none',
          zIndex: 22,
        };
      }

      if (isNotTarget) {
        base = {
          ...base,
          opacity: Math.max(0, 1 - smokeProgress * 3),
          filter: `blur(${smokeProgress * 12}px)`,
          transition: 'none',
        };
      }

      return base;
    },
    [isMobile, cameraScale, cameraBlur, motionBlur, smokeProgress],
  );

  // ─── Core animation loop — runs entirely via refs, no mid-flight setState for phase ──

  const runEnterAnimation = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    animPhaseRef.current = 'entering';
    phaseStartRef.current = performance.now();

    const tick = () => {
      const phase = animPhaseRef.current;
      const elapsed = (performance.now() - phaseStartRef.current) / 1000;

      // ── entering: 1.5s zoom + smoke 0→0.82
      if (phase === 'entering') {
        const t = Math.min(elapsed / 1.5, 1);
        const ease = easeInOutCubic(t);
        setCameraScale(1 + ease * 1.8);
        setSmokeProgress(ease * 0.82);
        setCameraBlur(ease * 3);
        setMotionBlur(t > 0.4);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          // Move to covering — purely ref-based, no setState
          animPhaseRef.current = 'covering';
          phaseStartRef.current = performance.now();
          animFrameRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      // ── covering: 0.5s smoke 0.82→1 (flash)
      if (phase === 'covering') {
        const t = Math.min(elapsed / 0.5, 1);
        const ease = easeOutQuart(t);
        setSmokeProgress(0.82 + ease * 0.18);
        setCameraScale(2.8 + ease * 2);
        setCameraBlur(ease * 8);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          // Fully covered → reveal portfolio
          animPhaseRef.current = 'portfolio';
          setCameraScale(1);
          setCameraBlur(0);
          setMotionBlur(false);
          setShowPortfolio(true);
          setPortalPhase('portfolio');          // only setState now, after anim done

          // Animate smoke 1→0 over 900ms so portfolio "emerges from fog"
          const smokeStart = performance.now();
          const fadeTick = () => {
            const t2 = Math.min((performance.now() - smokeStart) / 900, 1);
            setSmokeProgress(1 - easeInOutCubic(t2));
            if (t2 < 1) requestAnimationFrame(fadeTick);
          };
          requestAnimationFrame(fadeTick);
        }
        return;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const runExitAnimation = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    animPhaseRef.current = 'exiting';
    phaseStartRef.current = performance.now();

    const tick = () => {
      const phase = animPhaseRef.current;
      const elapsed = (performance.now() - phaseStartRef.current) / 1000;

      // ── exiting: 0.6s smoke 0→0.92 (portfolio dissolves into fog)
      if (phase === 'exiting') {
        const t = Math.min(elapsed / 0.6, 1);
        const ease = easeInOutCubic(t);
        setSmokeProgress(ease * 0.92);
        setCameraBlur(ease * 4);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          setShowPortfolio(false);
          animPhaseRef.current = 'uncovering';
          phaseStartRef.current = performance.now();
          animFrameRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      // ── uncovering: 1.6s reverse zoom + smoke 0.92→0
      if (phase === 'uncovering') {
        const t = Math.min(elapsed / 1.6, 1);
        const ease = easeInOutCubic(t);
        setSmokeProgress((1 - ease) * 0.92);
        setCameraScale(2.8 - ease * 1.8);
        setCameraBlur((1 - ease) * 4);
        setMotionBlur(t < 0.6);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          // Back to idle
          animPhaseRef.current = 'idle';
          setPortalPhase('idle');
          setCameraScale(1);
          setSmokeProgress(0);
          setCameraBlur(0);
          setMotionBlur(false);
          setBgColor(IMAGES[activeIndexRef.current].bg);
        }
        return;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // ─── Public triggers ──────────────────────────────────────────────────────

  const handleDiscover = useCallback(() => {
    if (animPhaseRef.current !== 'idle') return;
    // Use dataIndex to open the correct PORTFOLIO_DATA entry regardless of carousel order
    const dataIdx = (IMAGES[activeIndexRef.current] as any).dataIndex ?? activeIndexRef.current;
    portalIndexRef.current = dataIdx;
    setPortalIndex(dataIdx);
    setSmokeProgress(0);
    setCameraScale(1);
    setCameraBlur(0);
    setMotionBlur(false);
    setShowPortfolio(false);
    runEnterAnimation();
  }, [runEnterAnimation]);

  const handleBack = useCallback(() => {
    if (animPhaseRef.current !== 'portfolio') return;
    runExitAnimation();
    setPortalPhase('idle');
  }, [runExitAnimation]);

  // ── Keyboard navigation (placed here so navigate/handleDiscover/handleBack are in scope)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft') navigate('prev');
      if ((e.key === 'Enter' || e.key === ' ') && portalPhase === 'idle') handleDiscover();
      if (e.key === 'Escape' && portalPhase === 'portfolio') handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [portalPhase, navigate, handleDiscover, handleBack]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const active = IMAGES[activeIndex];
  const isPortalActive = portalPhase !== 'idle' || animPhaseRef.current !== 'idle';
  const portalImage = IMAGES.find(img => img.dataIndex === portalIndex);
  const smokeAccent = isPortalActive ? (portalImage ? portalImage.bg : active.bg) : active.bg;

  return (
    <>
      {/* ── Cinematic preloader — unmounts after its own fade-out */}
      {!preloaderDone && (
        <Preloader onComplete={() => setPreloaderDone(true)} />
      )}

      <CustomCursor />

      {/* Volumetric smoke canvas */}
      <SmokeCanvas
        progress={smokeProgress}
        accentColor={smokeAccent}
        active={isPortalActive}
      />

      {/* Portfolio overlay */}
      <PortfolioOverlay
        index={portalIndex}
        visible={showPortfolio}
        onBack={handleBack}
      />

      {/* Main scene */}
      <div
        style={{
          backgroundColor: bgColor,
          transition: isPortalActive ? 'none' : 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}
          onMouseDown={e => onDragStart(e.clientX)}
          onMouseUp={e => onDragEnd(e.clientX)}
          onMouseLeave={() => { document.body.classList.remove('dragging'); dragStartX.current = null; }}
          onTouchStart={e => onDragStart(e.touches[0].clientX)}
          onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
        >

          {/* 1. Grain */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
            backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat', opacity: 0.4
          }} />

          {/* 1b. Floating ambient orbs */}
          {!isPortalActive && [
            { size: '28vw', top: '5%', left: '8%', delay: '0s', dur: '9s', alt: false },
            { size: '18vw', top: '55%', left: '72%', delay: '2s', dur: '12s', alt: true },
            { size: '12vw', top: '70%', left: '18%', delay: '4s', dur: '8s', alt: false },
          ].map((orb, oi) => (
            <div key={oi} style={{
              position: 'absolute',
              width: orb.size, height: orb.size,
              borderRadius: '50%',
              top: orb.top, left: orb.left,
              background: `radial-gradient(circle, ${active.bg}55 0%, transparent 70%)`,
              filter: 'blur(32px)',
              pointerEvents: 'none',
              zIndex: 1,
              animation: `${orb.alt ? 'floatOrbAlt' : 'floatOrb'} ${orb.dur} ease-in-out ${orb.delay} infinite`,
              opacity: 0.7,
            }} />
          ))}

          {/* 2. Ghost name text */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '18%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            userSelect: 'none', zIndex: 2,
            opacity: isPortalActive ? Math.max(0, 1 - smokeProgress * 4) : 1,
            transition: isPortalActive ? 'none' : 'opacity 300ms'
          }}>
            <span
              key={activeIndex}
              style={{
                fontFamily: "'Anton', sans-serif", fontSize: 'clamp(52px, 15vw, 240px)',
                fontWeight: 900, color: 'white', opacity: 1, lineHeight: 1,
                textTransform: 'uppercase', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
                animation: 'punchlineFade 600ms ease forwards'
              }}>
              {active.name}
            </span>
          </div>

          {/* 3. Brand label */}
          <div className="absolute top-6 left-4 sm:left-8" style={{
            zIndex: 60,
            opacity: isPortalActive ? Math.max(0, 1 - smokeProgress * 3) : 1,
            transition: isPortalActive ? 'none' : 'opacity 300ms'
          }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
              color: 'white', opacity: 0.9, letterSpacing: '0.18em'
            }}>
              PORTFOLIO
            </span>
          </div>

          {/* 4. Carousel figures */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
            {IMAGES.map((img, i) => {
              const role = getRole(i);
              const rs = roleStyle(role, i);
              const so = (img as any).scaleOverride;
              if (so && rs.transform) {
                rs.transform = (rs.transform as string).replace(
                  /scale\(([^)]+)\)/,
                  (_: string, s: string) => `scale(${parseFloat(s) * so})`
                );
              }
              const isCenter = role === 'center';
              return (
                <div
                  key={i}
                  style={{ position: 'absolute', aspectRatio: '0.6 / 1', ...rs }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    if (isCenter && !isPortalActive) handleDiscover();
                    else if (!isPortalActive && !isCarouselAnimating) {
                      const diff = (i - activeIndex + N) % N;
                      navigate(diff === 1 ? 'next' : 'prev');
                    }
                  }}
                  title={isCenter ? `Click to explore ${img.name}` : img.name}
                >
                  {/* Pulse ring on center hover */}
                  {isCenter && !isPortalActive && (
                    <div style={{
                      position: 'absolute', inset: '-12%', borderRadius: '50%',
                      border: `2px solid ${active.bg}`,
                      animation: 'ringPulse 2.4s ease-in-out infinite',
                      pointerEvents: 'none', zIndex: -1,
                    }} />
                  )}
                  <img
                    src={img.src}
                    alt={`figurine-${i + 1}`}
                    draggable={false}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      objectPosition: 'bottom center', display: 'block',
                      transition: 'filter 300ms',
                      filter: hoveredIndex === i && isCenter ? 'drop-shadow(0 0 32px rgba(255,255,255,0.35))' : 'none',
                      cursor: isCenter ? 'pointer' : 'pointer',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* 5. Bottom info + nav card */}
          <div
            style={{
              position: 'absolute',
              left: 0, right: 0, bottom: 0,
              zIndex: 60,
              opacity: isPortalActive ? Math.max(0, 1 - smokeProgress * 3) : 1,
              pointerEvents: isPortalActive ? 'none' : 'auto',
              transition: isPortalActive ? 'none' : 'opacity 300ms',
              /* Desktop: move to left/bottom corner */
            }}
            className="sm:left-auto sm:right-auto sm:bottom-20 sm:absolute"
          >
            {/* Mobile card — stretches full width, sits at bottom */}
            <div
              className="sm:hidden"
              style={{
                background: 'rgba(0,0,0,0.30)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                padding: '14px 16px 20px',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p style={{
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
                color: 'white', opacity: 1, margin: 0, marginBottom: '4px',
                textShadow: '0 1px 6px rgba(0,0,0,0.3)', fontSize: '15px'
              }}>
                TEAM HOP
              </p>
              <p
                key={activeIndex}
                style={{
                  color: 'white', opacity: 0.88, lineHeight: 1.5, margin: 0,
                  marginBottom: '12px', textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  fontStyle: 'italic', letterSpacing: '0.01em', fontSize: '12px',
                  animation: 'punchlineFade 500ms ease forwards'
                }}
              >
                {active.punchline}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['prev', 'next'] as Direction[]).map((dir) => (
                    <button key={dir} onClick={() => navigate(dir)}
                      aria-label={dir === 'prev' ? 'Previous figurine' : 'Next figurine'}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'transparent', border: '2px solid rgba(255,255,255,0.8)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, transition: 'background 150ms'
                      }}>
                      {dir === 'prev' ? <ArrowLeft size={18} strokeWidth={2.25} /> : <ArrowRight size={18} strokeWidth={2.25} />}
                    </button>
                  ))}
                </div>
                <button onClick={handleDiscover}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: "'Anton', sans-serif", fontSize: '18px',
                    fontWeight: 400, color: 'white', letterSpacing: '-0.02em',
                    lineHeight: 1, textTransform: 'uppercase', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, opacity: 0.95
                  }}>
                  DISCOVER IT
                  <ArrowRight size={18} strokeWidth={2.25} />
                </button>
              </div>
            </div>

            {/* Desktop card — compact floating box */}
            <div
              className="hidden sm:block"
              style={{
                background: 'rgba(0,0,0,0.22)',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                borderRadius: 16, padding: '20px 24px', maxWidth: 320,
                marginLeft: '6rem'
              }}
            >
              <p style={{
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
                color: 'white', opacity: 1, margin: 0, marginBottom: '0.5rem',
                textShadow: '0 1px 6px rgba(0,0,0,0.3)', fontSize: '22px'
              }}>
                TEAM HOP
              </p>
              <p key={activeIndex} style={{
                color: 'white', opacity: 0.92, lineHeight: 1.6, margin: 0,
                marginBottom: '1.25rem', textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                fontStyle: 'italic', letterSpacing: '0.01em', fontSize: '14px',
                animation: 'punchlineFade 500ms ease forwards'
              }}>
                {active.punchline}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(['prev', 'next'] as Direction[]).map((dir) => (
                  <button key={dir} onClick={() => navigate(dir)}
                    aria-label={dir === 'prev' ? 'Previous figurine' : 'Next figurine'}
                    style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'transparent', border: '2px solid white', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'transform 150ms, background-color 150ms'
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                    {dir === 'prev' ? <ArrowLeft size={26} strokeWidth={2.25} /> : <ArrowRight size={26} strokeWidth={2.25} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Dot nav indicators — desktop only (mobile has full-width card at bottom) */}
          <div className="hidden sm:flex" style={{
            position: 'absolute', bottom: '18px',
            left: '50%', transform: 'translateX(-50%)',
            gap: 10, zIndex: 60,
            opacity: isPortalActive ? Math.max(0, 1 - smokeProgress * 3) : 1,
            transition: isPortalActive ? 'none' : 'opacity 300ms',
          }}>
            {IMAGES.map((_, di) => (
              <button
                key={di}
                onClick={() => {
                  if (isCarouselAnimating || isPortalActive) return;
                  const diff = (di - activeIndex + N) % N;
                  if (diff === 0) return;
                  navigate(diff <= Math.floor(N / 2) ? 'next' : 'prev');
                }}
                style={{
                  width: di === activeIndex ? 28 : 8,
                  height: 8, borderRadius: 4,
                  background: di === activeIndex ? 'white' : 'rgba(255,255,255,0.38)',
                  border: 'none', padding: 0, cursor: 'pointer',
                  transition: 'width 400ms cubic-bezier(0.22,1,0.36,1), background 400ms',
                }}
                aria-label={`Go to figurine ${di + 1}`}
              />
            ))}
          </div>

          {/* 7. DISCOVER IT */}
          <div className="hidden sm:flex absolute bottom-20 right-10"
            style={{
              zIndex: 60,
              opacity: isPortalActive ? Math.max(0, 1 - smokeProgress * 3) : 1,
              pointerEvents: isPortalActive ? 'none' : 'auto',
              transition: isPortalActive ? 'none' : 'opacity 300ms'
            }}>
            <button onClick={handleDiscover}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                fontFamily: "'Anton', sans-serif", fontSize: 'clamp(20px, 4vw, 56px)',
                fontWeight: 400, color: 'white', opacity: 0.95, letterSpacing: '-0.02em',
                lineHeight: 1, textTransform: 'uppercase', background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, transition: 'opacity 200ms, transform 200ms',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity = '1';
                b.style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity = '0.95';
                b.style.transform = 'translateX(0)';
              }}>
              DISCOVER IT
              <ArrowRight className="w-8 h-8" strokeWidth={2.25} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
