import { useEffect, useState, useRef } from 'react';

// ── Acrostic words (spells C·R·A·F·T)
const WORDS = [
  { initial: 'C', rest: 'REATIVE'  },
  { initial: 'R', rest: 'ELIABLE'  },
  { initial: 'A', rest: 'MBITIOUS' },
  { initial: 'F', rest: 'OCUSED'   },
  { initial: 'T', rest: 'ENACIOUS' },
];
const N = WORDS.length;

// ── Timing (ms)
const T_INITIALS  = 300;                    // all initials appear
const T_BRANCHES  = T_INITIALS  + 900;      // branches start drawing
const BRANCH_DUR  = 500;                    // each branch draw time
const BRANCH_GAP  = 110;                    // stagger between branches
const WORD_DELAY  = 180;                    // word appears after its branch
const T_HOLD      = T_BRANCHES + (N-1)*BRANCH_GAP + BRANCH_DUR + WORD_DELAY + 800;
const T_WORDS_OUT = T_HOLD;
const T_FINAL     = T_WORDS_OUT + 500;
const T_FINAL_IN  = T_FINAL    + 80;
const T_EXIT      = T_FINAL_IN + 2000;
const T_DONE      = T_EXIT     + 800;

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [initialsOn,  setInitialsOn]  = useState(false);
  const [branches,    setBranches]    = useState<boolean[]>(Array(N).fill(false));
  const [words,       setWords]       = useState<boolean[]>(Array(N).fill(false));
  const [wordsOut,    setWordsOut]    = useState(false);
  const [showFinal,   setShowFinal]   = useState(false);
  const [finalIn,     setFinalIn]     = useState(false);
  const [exiting,     setExiting]     = useState(false);
  const tids = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const T = (fn: () => void, d: number) => { const id = setTimeout(fn, d); tids.current.push(id); };

    T(() => setInitialsOn(true), T_INITIALS);

    WORDS.forEach((_, i) => {
      const base = T_BRANCHES + i * BRANCH_GAP;
      T(() => setBranches(p => { const n=[...p]; n[i]=true; return n; }), base);
      T(() => setWords(p => { const n=[...p]; n[i]=true; return n; }), base + BRANCH_DUR + WORD_DELAY);
    });

    T(() => setWordsOut(true),  T_WORDS_OUT);
    T(() => setShowFinal(true), T_FINAL);
    T(() => setFinalIn(true),   T_FINAL_IN);
    T(() => setExiting(true),   T_EXIT);
    T(() => onComplete(),        T_DONE);

    return () => tids.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: exiting ? 0 : 1,
      transition: `opacity 800ms cubic-bezier(0.4,0,0.2,1)`,
    }}>
      {/* Grain */}
      <div aria-hidden style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
        backgroundSize:'200px 200px', opacity:0.6,
      }}/>

      {/* ── ACROSTIC block ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 'clamp(10px, 2.2vh, 22px)',
        opacity: wordsOut ? 0 : 1,
        transform: wordsOut ? 'translateY(-20px)' : 'translateY(0)',
        transition: 'opacity 450ms ease, transform 450ms ease',
        position: 'absolute',
      }}>
        {WORDS.map((w, i) => {
          const initVisible = initialsOn;
          const branchOn    = branches[i];
          const wordOn      = words[i];
          return (
            <div key={w.initial} style={{
              display: 'flex', alignItems: 'center',
              opacity:   initVisible ? 1 : 0,
              transform: initVisible ? 'translateY(0)' : 'translateY(18px)',
              transition: `opacity 550ms ${i * 60}ms ease, transform 550ms ${i * 60}ms ease`,
            }}>
              {/* Initial */}
              <span style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: 'clamp(52px, 7.5vw, 106px)',
                fontWeight: 700, color: 'white', lineHeight: 1,
                minWidth: 'clamp(44px, 6.5vw, 92px)',
                textShadow: '0 0 40px rgba(255,255,255,0.25)',
                userSelect: 'none',
              }}>{w.initial}</span>

              {/* Branch */}
              <div style={{
                height: '1.5px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.15))',
                margin: '0 clamp(10px,1.4vw,18px)',
                flexShrink: 0,
                width: branchOn ? 'clamp(28px,3.5vw,54px)' : '0px',
                transition: `width ${BRANCH_DUR}ms cubic-bezier(0.4,0,0.2,1)`,
              }}/>

              {/* Rest of word */}
              <span style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: 'clamp(16px, 2.4vw, 36px)',
                fontWeight: 400, letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1, whiteSpace: 'nowrap',
                userSelect: 'none',
                opacity:   wordOn ? 1 : 0,
                transform: wordOn ? 'translateX(0)' : 'translateX(-12px)',
                transition: 'opacity 450ms ease, transform 450ms ease',
              }}>{w.rest}</span>
            </div>
          );
        })}
      </div>

      {/* ── FINAL TITLE ── */}
      {showFinal && (
        <div style={{
          textAlign: 'center',
          opacity:   finalIn ? 1 : 0,
          transform: finalIn ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.96)',
          filter:    finalIn ? 'blur(0px)' : 'blur(10px)',
          transition: 'opacity 750ms ease, transform 750ms ease, filter 750ms ease',
          padding: '0 clamp(16px,6vw,60px)',
        }}>
          <p style={{
            margin: '0 0 14px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(11px,1.4vw,15px)', fontWeight: 600,
            letterSpacing: '0.45em', color: 'rgba(255,255,255,0.38)',
            textTransform: 'uppercase', userSelect: 'none',
          }}>MEET THE TEAM OF</p>

          <div style={{
            width: '100%', height: 1, marginBottom: 26,
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)',
          }}/>

          <p style={{
            margin: 0,
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 'clamp(34px,6.5vw,100px)', fontWeight: 700,
            color: 'white', letterSpacing: '0.07em',
            textTransform: 'uppercase', userSelect: 'none', lineHeight: 1,
            textShadow: '0 0 80px rgba(255,255,255,0.2)',
          }}>HOUSE OF PERSIS</p>

          <div style={{
            width: '100%', height: 1, marginTop: 26,
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)',
          }}/>
        </div>
      )}
    </div>
  );
}
