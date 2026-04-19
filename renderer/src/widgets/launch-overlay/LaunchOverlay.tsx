import { useEffect, useState } from 'react';

interface Props {
  ready: boolean;
}

export function LaunchOverlay({ ready }: Props) {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    if (!ready) return;
    // One frame delay so the main UI has time to paint before we fade out
    const t1 = setTimeout(() => setFading(true),  60);
    const t2 = setTimeout(() => setMounted(false), 60 + 420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ready]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes _toxo_launch_in {
          from { opacity: 0; transform: scale(0.82) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px);  }
        }
        @keyframes _toxo_launch_text {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
      <div
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         9999,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          background:     '#09090d',
          opacity:        fading ? 0 : 1,
          transition:     fading ? 'opacity 400ms cubic-bezier(0.4,0,0.6,1)' : 'none',
          pointerEvents:  fading ? 'none' : 'all',
        }}
      >
        {/* Icon */}
        <div style={{ animation: '_toxo_launch_in 300ms cubic-bezier(0.34,1.40,0.64,1) both' }}>
          <img
            src="./app_icon.png"
            alt="toXo"
            style={{
              width:        80,
              height:       80,
              borderRadius: 20,
              boxShadow:    '0 8px 40px rgba(32,130,255,0.18), 0 2px 8px rgba(0,0,0,0.5)',
              display:      'block',
            }}
          />
        </div>

        {/* Text */}
        <div
          style={{
            marginTop:  20,
            textAlign:  'center',
            animation:  '_toxo_launch_text 300ms 120ms cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          <div style={{
            fontSize:      24,
            fontWeight:    700,
            color:         '#ffffff',
            letterSpacing: '-0.03em',
            lineHeight:    1,
          }}>
            toXo
          </div>
          <div style={{
            fontSize:      11,
            color:         'rgba(255,255,255,0.28)',
            marginTop:     6,
            letterSpacing: '0.04em',
            fontWeight:    400,
          }}>
            by TheOverforge
          </div>
        </div>
      </div>
    </>
  );
}
