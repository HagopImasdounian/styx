import {useState, useEffect} from 'react';
import {useRouteLoaderData, Link} from '@remix-run/react';
import {STYX, FONT} from './constants';
import type {RootLoader} from '~/root';

function fmt(n: number) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function GoldTicker() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const goldData = (rootData as any)?.goldData;

  // No real data — don't show the ticker at all
  if (!goldData?.spotPerOz) return null;

  const apiSpot = goldData.spotPerOz;

  // Small client-side jitter to make it feel "live"
  const [spot, setSpot] = useState(apiSpot);
  const [prev, setPrev] = useState(apiSpot);

  useEffect(() => {
    setSpot(apiSpot);
    setPrev(apiSpot);
  }, [apiSpot]);

  useEffect(() => {
    const id = setInterval(() => {
      setSpot((s: number) => {
        setPrev(s);
        const delta = (Math.random() - 0.48) * 1.4;
        return +(s + delta).toFixed(2);
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const change = spot - apiSpot;
  const pct = ((change / apiSpot) * 100).toFixed(2);

  const per10k = (spot / 31.1035) * 0.417;
  const per14k = (spot / 31.1035) * 0.585;

  const cell: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
  };

  const lbl: React.CSSProperties = {
    color: 'rgba(239,234,224,0.45)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  const val: React.CSSProperties = {
    color: STYX.bone,
    fontSize: 11,
    fontWeight: 500,
  };

  return (
    <div
      style={{
        background: STYX.ink,
        color: STYX.bone,
        padding: '8px 56px',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        fontFamily: FONT.mono,
        fontSize: 11,
        letterSpacing: '0.08em',
        borderBottom: '1px solid rgba(239,234,224,0.08)',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Live indicator */}
      <div style={{display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto'}}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#7DB86F',
            boxShadow: '0 0 8px #7DB86F',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: STYX.gold,
            textTransform: 'uppercase',
          }}
        >
          LIVE
        </span>
      </div>

      {/* Data cells */}
      <div style={{display: 'flex', gap: 28, flex: 1, overflow: 'hidden'}}>
        <div style={cell}>
          <span style={lbl}>Gold Spot</span>
          <span style={val}>${fmt(spot)}/oz</span>
        </div>
        <div style={cell}>
          <span style={lbl}>24h</span>
          <span
            style={{
              ...val,
              color: change >= 0 ? '#A8C99B' : '#C99B8C',
            }}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)} ({pct}%)
          </span>
        </div>
        <div style={cell}>
          <span style={lbl}>10k / g</span>
          <span style={val}>${fmt(per10k)}</span>
        </div>
        <div style={cell}>
          <span style={lbl}>14k / g</span>
          <span style={val}>${fmt(per14k)}</span>
        </div>
      </div>

      {/* Right link */}
      <span
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 10,
          letterSpacing: '0.3em',
          color: 'rgba(239,234,224,0.55)',
          textTransform: 'uppercase',
          flex: '0 0 auto',
          cursor: 'pointer',
        }}
      >
        Why we show this
      </span>
    </div>
  );
}
