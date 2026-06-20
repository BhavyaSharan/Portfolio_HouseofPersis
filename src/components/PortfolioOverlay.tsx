import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Code2, AtSign, Globe } from 'lucide-react';


// ─── Portfolio data per figurine ─────────────────────────────────────────────
export const PORTFOLIO_DATA = [
  {
    name: 'Sureka KR',
    role: 'Content Writer',
    tagline: 'Just a girl surviving in a world that desperately needs better content.',
    description:
      'Turning thoughts into content and content into conversations. I craft words that help businesses stand out, stay relevant, and actually get read — from website copy to brand stories.',
    skills: [
      'Content Writing',
      'Script Writing',
      'Website Content',
      'Social Media Content',
      'Brand Storytelling',
      'Creative Copywriting',
      'Research & Content Strategy',
    ],
    works: [
      { title: 'Website Copy', type: 'Web Content', accent: '#6BBF7A' },
      { title: 'Brand Stories', type: 'Brand Storytelling', accent: '#45B26B' },
      { title: 'Social Media Content', type: 'Social Media', accent: '#2ECC71' },
      { title: 'Scripts', type: 'Script Writing', accent: '#3DD68C' },
      { title: 'Marketing Communication', type: 'Copywriting', accent: '#27AE60' },
    ],
    experience: [
      {
        company: 'House of Persis',
        role: 'Content Writer',
        period: 'Current',
        desc: 'Writing website copy, social media content, scripts, brand stories, and marketing communication that help businesses stand out, stay relevant, and actually get read.',
      },
    ],
    socials: { github: '#', twitter: '#', linkedin: '#', web: '#' },
    accentBg: '#6BBF7A',
  },
  {
    name: 'Sameera Abrar',
    role: 'Marketing Manager',
    tagline: 'Hijabi girl stuck in this paapi world.',
    description:
      '5 years of making normal founders the go-to expert in their industry. I turn brands from invisible to inevitable — through sharp strategy, scroll-stopping content, and ads that actually convert.',
    skills: [
      'Marketing Strategy',
      'Social Media Marketing',
      'Meta Ads',
      'Google Ads',
      'Online Customer Acquisition',
      'Customer Retention Strategy',
      'Creative Strategy',
      'Growth Hacking',
      'Marketing Funnels',
      'FB · IG · YT · LI',
    ],
    works: [
      { title: 'Marketing Strategy', type: 'Brand Growth', accent: '#7B2FBE' },
      { title: 'Social Media Marketing', type: 'FB · IG · YT · LI', accent: '#9D4EDD' },
      { title: 'Meta & Google Ads', type: 'Paid Media', accent: '#6A1FA0' },
      { title: 'Customer Acquisition', type: 'Growth Strategy', accent: '#5A189A' },
      { title: 'Customer Retention', type: 'Lifecycle Marketing', accent: '#4A0E8F' },
      { title: 'Marketing Funnels', type: 'Conversion Strategy', accent: '#3A0070' },
    ],
    experience: [
      {
        company: 'House of Persis',
        role: 'Marketing Manager — 25 Din Me Paisa Double',
        period: '5 Years',
        desc: 'Making normal founders the go-to expert in their industry. Marketing strategy, social media marketing across FB, IG, YT & LinkedIn, growth hacking, running high-ROI ads on Meta and Google, turning one-time customers into lifetime buyers, and building marketing funnels that actually convert.',
      },
    ],
    socials: { github: '#', twitter: '#', linkedin: '#', web: '#' },
    accentBg: '#520371',
  },
  {
    name: 'Niraj Bhoite',
    role: 'Photographer & Filmmaker',
    tagline: 'Smile Karo, Baaki Editing main Sambhalenge!',
    description:
      "Hi, I'm Niraj Bhoite, a passionate photographer and filmmaker. My journey in visual storytelling began with a simple passion for capturing genuine moments and transforming them into meaningful memories. Over the years, I have worked on weddings, corporate events, school promotions, cafe and resort marketing campaigns, social media content, and commercial projects.",
    skills: [
      'Wedding Photography & Films',
      'Corporate Event Coverage',
      'Commercial Photography',
      'Brand & Product Shoots',
      'Cinematic Videography',
      'Social Media Reels & Content',
    ],
    works: [
      { title: 'Wedding Films', type: 'Cinematography', accent: '#6EB5FF' },
      { title: 'Brand & Product Shoots', type: 'Commercial', accent: '#4DA3FF' },
      { title: 'Social Media Reels', type: 'Content Creation', accent: '#2B91FF' },
      { title: 'Corporate Events', type: 'Event Coverage', accent: '#1A7FFF' },
      { title: 'School Promotions', type: 'Institutional', accent: '#0071FF' },
      { title: 'Cafe & Resort Campaigns', type: 'Hospitality', accent: '#005FE0' },
    ],
    experience: [
      {
        company: 'House of Persis',
        role: 'Videographer & Editor',
        period: 'Current',
        desc: 'Creating cinematic content, brand films, and social media reels for HOP — handling everything from shoot direction to final color-graded edit.',
      },
    ],
    socials: { github: '#', twitter: '#', linkedin: '#', web: '#' },
    accentBg: '#6EB5FF',
  },
  {
    name: 'Luna Wei',
    role: 'Creative Technologist',
    tagline: 'Where art meets algorithm.',
    description:
      'I live at the intersection of code and creativity — generative art, interactive installations, and experimental web experiences that blur the line between digital and physical.',
    skills: ['Three.js', 'GLSL', 'p5.js', 'Creative Coding', 'WebGL'],
    works: [
      { title: 'Generative NFT', type: 'Generative Art', accent: '#A78BFA' },
      { title: 'WebGL Sculpture', type: 'Interactive Art', accent: '#8B5CF6' },
      { title: 'Data Viz', type: 'Data Art', accent: '#7C3AED' },
    ],
    socials: { github: '#', twitter: '#', linkedin: '#', web: '#' },
    accentBg: '#F4845F',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgbStr(hex: string) {
  const clean = hex.trim();
  if (clean.startsWith('#')) {
    const h = clean.slice(1);
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
  }
  return '120,100,160';
}

function darken(hex: string, amount = 40) {
  const clean = hex.trim();
  if (clean.startsWith('#')) {
    const h = clean.slice(1);
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    const r = Math.max(0, ((num >> 16) & 255) - amount);
    const g = Math.max(0, ((num >> 8) & 255) - amount);
    const b = Math.max(0, (num & 255) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return hex;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PortfolioOverlayProps {
  index: number;
  visible: boolean;
  onBack: () => void;
}

const GRAIN = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E`;

export default function PortfolioOverlay({ index, visible, onBack }: PortfolioOverlayProps) {
  const data = PORTFOLIO_DATA[index];
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  // Re-run scroll reveal every time overlay opens
  useEffect(() => {
    if (!visible) { setMounted(false); return; }
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [visible]);

  // IntersectionObserver — re-observe on every open
  useEffect(() => {
    if (!visible || !mounted) return;
    const container = scrollRef.current;
    if (!container) return;
    // reset all to invisible first
    container.querySelectorAll<HTMLElement>('.rev').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(36px)';
    });
    const obs = new IntersectionObserver(
      entries => entries.forEach(en => {
        if (en.isIntersecting) {
          const el = en.target as HTMLElement;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.unobserve(el);
        }
      }),
      { threshold: 0.08, root: container }
    );
    container.querySelectorAll('.rev').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [visible, mounted, index]);

  if (!visible) return null;

  const rgb = hexToRgbStr(data.accentBg);
  const dark = darken(data.accentBg, 55);
  const hasExp = 'experience' in data && Array.isArray((data as any).experience);
  const exp = hasExp ? (data as any).experience as { company: string; role: string; period: string; desc: string }[] : [];

  const revStyle: React.CSSProperties = {
    transition: 'opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)',
    opacity: 0,
    transform: 'translateY(36px)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: `linear-gradient(150deg, ${data.accentBg} 0%, ${dark} 55%, #060608 100%)`,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("${GRAIN}")`, backgroundSize: '200px 200px', opacity: 0.45
      }} />

      {/* Ambient orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '55vw', height: '55vw', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,0.11) 0%, rgba(${rgb},0.06) 45%, transparent 70%)`,
          top: '-18vw', right: '-8vw', filter: 'blur(50px)', animation: 'floatOrb 14s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', width: '38vw', height: '38vw', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${rgb},0.22) 0%, transparent 70%)`,
          bottom: '5vh', left: '-8vw', filter: 'blur(64px)', animation: 'floatOrbAlt 18s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', width: '20vw', height: '20vw', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)`,
          top: '40%', left: '55%', filter: 'blur(40px)', animation: 'floatOrb 10s ease-in-out 3s infinite'
        }} />
      </div>

      {/* ── Sticky nav ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px',
        background: `rgba(${rgb},0.12)`,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        transition: 'opacity 600ms ease', opacity: mounted ? 1 : 0,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)',
          color: 'white', padding: '9px 18px', borderRadius: 50, cursor: 'pointer',
          fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'all 200ms', backdropFilter: 'blur(10px)',
        }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.22)'; b.style.transform = 'translateX(-3px)'; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.1)'; b.style.transform = 'translateX(0)'; }}
        >
          <ArrowLeft size={15} strokeWidth={2.5} /> Back
        </button>

        <span style={{
          fontFamily: "'Anton', sans-serif", color: 'white', opacity: 0.5,
          fontSize: 12, letterSpacing: '0.26em', textTransform: 'uppercase'
        }}>
          HOUSE OF PERSIS · PORTFOLIO
        </span>

        <div style={{ display: 'flex', gap: 10 }}>
          {([['github', Code2], ['linkedin', Globe], ['twitter', AtSign], ['web', ExternalLink]] as const).map(([key, Icon]) => (
            <a key={key} href={data.socials[key as keyof typeof data.socials]} target="_blank" rel="noreferrer"
              style={{
                color: 'rgba(255,255,255,0.55)', transition: 'color 200ms, transform 200ms', display: 'flex',
                padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)'
              }}
              onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.color = 'white'; a.style.transform = 'translateY(-2px)'; a.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.color = 'rgba(255,255,255,0.55)'; a.style.transform = 'translateY(0)'; a.style.background = 'rgba(255,255,255,0.06)'; }}>
              <Icon size={16} strokeWidth={1.75} />
            </a>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div ref={scrollRef} style={{
        position: 'relative', zIndex: 1, overflowY: 'auto', flex: 1,
        scrollBehavior: 'smooth',
      }}>

        {/* ── HERO ── */}
        <div style={{
          minHeight: '85vh', display: 'flex', alignItems: 'center',
          padding: 'clamp(48px,8vh,100px) clamp(24px,8vw,120px)',
          gap: 'clamp(32px, 6vw, 80px)', flexWrap: 'wrap',
        }}>
          {/* Left col */}
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            {/* Role badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 100, padding: '6px 16px', marginBottom: 28,
              transition: 'opacity 700ms 100ms ease, transform 700ms 100ms ease',
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: 'white', display: 'block',
                boxShadow: '0 0 10px 2px white', animation: 'glowPulse 2.5s ease-in-out infinite'
              }} />
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {data.role}
              </span>
            </div>

            {/* Name */}
            <h1 style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(52px, 9vw, 140px)', fontWeight: 400, color: 'white',
              lineHeight: 0.88, margin: '0 0 24px', textTransform: 'uppercase',
              letterSpacing: '-0.02em', textShadow: `0 0 80px rgba(${rgb},0.55)`,
              transition: 'opacity 700ms 250ms ease, transform 700ms 250ms ease',
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(28px)',
            }}>{data.name}</h1>

            {/* Tagline */}
            <p style={{
              fontFamily: "'Anton', sans-serif", fontSize: 'clamp(18px,2.8vw,42px)',
              color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', fontWeight: 400, lineHeight: 1.2,
              transition: 'opacity 700ms 400ms ease, transform 700ms 400ms ease',
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            }}>{data.tagline}</p>

            {/* Description */}
            <p style={{
              color: 'rgba(255,255,255,0.78)', fontSize: 'clamp(14px,1.3vw,18px)',
              lineHeight: 1.8, margin: '0 0 40px', maxWidth: 560,
              transition: 'opacity 700ms 550ms ease, transform 700ms 550ms ease',
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            }}>{data.description}</p>

            {/* CTA */}
            <div style={{
              transition: 'opacity 700ms 650ms ease, transform 700ms 650ms ease',
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            }}>
              <button onClick={onBack} style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'white', color: '#0a0a0f', padding: '14px 28px',
                borderRadius: 50, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'transform 200ms, box-shadow 200ms',
                boxShadow: `0 8px 32px rgba(${rgb},0.4)`,
              }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(-3px)'; b.style.boxShadow = `0 14px 40px rgba(${rgb},0.55)`; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(0)'; b.style.boxShadow = `0 8px 32px rgba(${rgb},0.4)`; }}
              >
                ← Back to Showcase
              </button>
            </div>
          </div>

          {/* Right col — Skills */}
          <div style={{
            flex: '1 1 280px', minWidth: 0,
            transition: 'opacity 700ms 700ms ease, transform 700ms 700ms ease',
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          }}>
            <p style={{
              fontFamily: "'Anton', sans-serif", color: 'rgba(255,255,255,0.38)',
              fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: 20
            }}>
              Skills &amp; Expertise
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {data.skills.map(skill => (
                <span key={skill}
                  onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
                  style={{
                    background: activeSkill === skill ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.09)',
                    border: `1px solid ${activeSkill === skill ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'}`,
                    color: 'white', padding: '9px 18px', borderRadius: 100,
                    fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
                    backdropFilter: 'blur(8px)', cursor: 'pointer',
                    transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)',
                    boxShadow: activeSkill === skill ? `0 4px 18px rgba(${rgb},0.4)` : 'none',
                    transform: activeSkill === skill ? 'translateY(-3px) scale(1.04)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (activeSkill === skill) return;
                    const el = e.currentTarget as HTMLSpanElement;
                    el.style.background = 'rgba(255,255,255,0.17)';
                    el.style.transform = 'translateY(-3px) scale(1.03)';
                    el.style.borderColor = 'rgba(255,255,255,0.38)';
                  }}
                  onMouseLeave={e => {
                    if (activeSkill === skill) return;
                    const el = e.currentTarget as HTMLSpanElement;
                    el.style.background = 'rgba(255,255,255,0.09)';
                    el.style.transform = 'none';
                    el.style.borderColor = 'rgba(255,255,255,0.18)';
                  }}
                >{skill}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── WORK EXPERIENCE ── */}
        {hasExp && (
          <div className="rev" style={{
            ...revStyle,
            padding: '0 clamp(24px,8vw,120px) clamp(40px,6vh,80px)',
          }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 3, height: 28, borderRadius: 2, background: `linear-gradient(180deg, white, rgba(${rgb},0.4))` }} />
              <p style={{
                fontFamily: "'Anton', sans-serif", color: 'rgba(255,255,255,0.42)',
                fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', margin: 0
              }}>
                Work Experience
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {exp.map((e, ei) => (
                <div key={ei} style={{
                  background: 'rgba(255,255,255,0.055)',
                  border: '1px solid rgba(255,255,255,0.11)',
                  borderRadius: 24, padding: '28px 32px',
                  backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden',
                  transition: 'background 250ms, border-color 250ms, transform 250ms, box-shadow 250ms',
                }}
                  onMouseEnter={ev => { const el = ev.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.borderColor = 'rgba(255,255,255,0.22)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.28)'; }}
                  onMouseLeave={ev => { const el = ev.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.055)'; el.style.borderColor = 'rgba(255,255,255,0.11)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${data.accentBg}, rgba(${rgb},0.3), transparent)`,
                    borderRadius: '24px 24px 0 0'
                  }} />
                  {/* Number badge */}
                  <div style={{
                    position: 'absolute', top: 20, right: 24,
                    fontFamily: "'Anton', sans-serif", fontSize: 72, color: 'rgba(255,255,255,0.04)',
                    lineHeight: 1, userSelect: 'none', pointerEvents: 'none'
                  }}>
                    {String(ei + 1).padStart(2, '0')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div>
                      <p style={{
                        margin: 0, fontFamily: "'Anton', sans-serif", fontSize: 'clamp(20px,2.2vw,28px)',
                        color: 'white', fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1.2
                      }}>
                        {e.role}
                      </p>
                      <p style={{
                        margin: '6px 0 0', fontSize: 13, color: `rgba(${rgb === '120,100,160' ? '200,180,255' : rgb},0.9)`,
                        fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase'
                      }}>
                        {e.company}
                      </p>
                    </div>
                    <span style={{
                      background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.7)', padding: '5px 16px', borderRadius: 100,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap', alignSelf: 'flex-start',
                    }}>{e.period}</span>
                  </div>

                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.68)', fontSize: 15, lineHeight: 1.78 }}>
                    {e.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SELECTED WORK ── */}
        <div className="rev" style={{
          ...revStyle,
          padding: 'clamp(40px,6vh,80px) clamp(24px,8vw,120px)',
          transitionDelay: '100ms',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ width: 3, height: 28, borderRadius: 2, background: `linear-gradient(180deg, white, rgba(${rgb},0.4))` }} />
            <p style={{
              fontFamily: "'Anton', sans-serif", color: 'rgba(255,255,255,0.42)',
              fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', margin: 0
            }}>
              Selected Work
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {data.works.map((work, wi) => (
              <div key={wi} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 22, padding: '28px 26px 24px', cursor: 'pointer',
                backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden',
                transition: 'transform 280ms cubic-bezier(0.22,1,0.36,1), background 280ms, border-color 280ms, box-shadow 280ms',
              }}
                onMouseEnter={ev => { const el = ev.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-8px) scale(1.01)'; el.style.background = 'rgba(255,255,255,0.12)'; el.style.borderColor = 'rgba(255,255,255,0.25)'; el.style.boxShadow = `0 24px 60px rgba(0,0,0,0.32), 0 0 0 1px ${work.accent}33`; }}
                onMouseLeave={ev => { const el = ev.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.background = 'rgba(255,255,255,0.06)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.boxShadow = 'none'; }}
              >
                {/* Accent top bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${work.accent}, transparent)`, borderRadius: '22px 22px 0 0'
                }} />
                {/* Ghost number */}
                <div style={{
                  position: 'absolute', bottom: 12, right: 20,
                  fontFamily: "'Anton', sans-serif", fontSize: 64, color: 'rgba(255,255,255,0.05)',
                  lineHeight: 1, userSelect: 'none', pointerEvents: 'none'
                }}>
                  {String(wi + 1).padStart(2, '0')}
                </div>
                {/* Accent dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: work.accent,
                  marginBottom: 14, boxShadow: `0 0 12px 3px ${work.accent}66`
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)'
                }}>
                  {work.type}
                </span>
                <h3 style={{
                  fontFamily: "'Anton', sans-serif", fontSize: 'clamp(22px,2vw,30px)',
                  color: 'white', margin: '10px 0 0', fontWeight: 400, lineHeight: 1.1
                }}>
                  {work.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: 'clamp(20px,4vh,40px) clamp(24px,8vw,120px) clamp(32px,6vh,60px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 16,
        }}>
          <span style={{
            fontFamily: "'Anton', sans-serif", color: 'rgba(255,255,255,0.28)',
            fontSize: 13, letterSpacing: '0.12em'
          }}>
            © {new Date().getFullYear()} {data.name} · House of Persis
          </span>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.55)', padding: '10px 22px', borderRadius: 50,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
            transition: 'all 200ms', fontFamily: "'Inter', sans-serif",
          }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.14)'; b.style.color = 'white'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.07)'; b.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            <ArrowLeft size={14} /> Exit Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
