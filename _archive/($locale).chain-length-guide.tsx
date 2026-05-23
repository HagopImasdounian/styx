import {type MetaFunction} from 'react-router';
import {Link} from 'react-router';
import {useState, useEffect} from 'react';
import {STYX, FONT, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [
    {title: 'Chain Length Guide — STYX'},
    {
      name: 'description',
      content:
        'Find your perfect chain length. Use our interactive 3D tool to see how different chain lengths look on your body type.',
    },
  ];
};

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const CHAIN_LENGTHS = [16, 18, 20, 22, 24, 26, 28, 30];

const CHAIN_LENGTH_LABELS: Record<number, string> = {
  16: 'Choker — sits at the base of the neck',
  18: 'Princess — rests on the collarbone',
  20: 'Matinee — sits just below the collarbone',
  22: 'Mid-chest — the most popular length',
  24: 'Sternum — a statement length',
  26: 'Lower chest — bold and visible over clothing',
  28: 'Just above the navel — dramatic drop',
  30: 'Navel-length — maximum presence',
};

const BUILD_PRESETS = {
  slim: {label: 'Slim', shoulderScale: 0.88, chestScale: 0.85, neckScale: 0.9},
  athletic: {label: 'Athletic', shoulderScale: 1.0, chestScale: 1.0, neckScale: 1.0},
  heavy: {label: 'Heavy', shoulderScale: 1.12, chestScale: 1.2, neckScale: 1.1},
} as const;

type BuildKey = keyof typeof BUILD_PRESETS;
type Gender = 'male' | 'female';

/* ═══════════════════════════════════════════════════════════════
   3D Scene (lazy loaded — avoids SSR issues with Three.js)
   ═══════════════════════════════════════════════════════════════ */

type SceneComponentType = React.ComponentType<{
  gender: Gender;
  build: BuildKey;
  heightInches: number;
  chainLength: number;
  chainThickness: number;
}>;

function LazyChainScene(props: {
  gender: Gender;
  build: BuildKey;
  heightInches: number;
  chainLength: number;
  chainThickness: number;
}) {
  const [Scene, setScene] = useState<SceneComponentType | null>(null);

  useEffect(() => {
    import('~/components/styx/ChainLengthScene').then((mod) => {
      setScene(() => mod.ChainLengthScene);
    });
  }, []);

  if (!Scene) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: STYX.ink,
          color: STYX.silt,
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        Loading 3D Scene...
      </div>
    );
  }

  return <Scene {...props} />;
}

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function ChainLengthGuide() {
  const [gender, setGender] = useState<Gender>('male');
  const [build, setBuild] = useState<BuildKey>('athletic');
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightExtraInches, setHeightExtraInches] = useState(10);
  const [chainLength, setChainLength] = useState(22);
  const [chainThickness, setChainThickness] = useState(4);

  const totalHeightInches = heightFeet * 12 + heightExtraInches;
  const heightDisplay = `${heightFeet}'${heightExtraInches}"`;

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      {/* Header */}
      <div style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div style={{maxWidth: 1440, margin: '0 auto', padding: '60px 56px 48px'}}>
          <StyxLabel>Tools &middot; Find Your Fit</StyxLabel>
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 48,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: STYX.ink,
              lineHeight: 0.95,
              margin: '12px 0 0',
            }}
          >
            Chain Length
            <br />
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
                fontSize: '0.65em',
              }}
            >
              guide.
            </span>
          </h1>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 18,
              color: STYX.silt,
              lineHeight: 1.6,
              marginTop: 14,
              maxWidth: 460,
            }}
          >
            Select your height, build, and chain length to see exactly how it
            sits on you.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div
        className="styx-chain-guide-layout"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 56px',
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 0,
          minHeight: 700,
        }}
      >
        {/* 3D Viewport */}
        <div
          style={{
            background: STYX.ink,
            position: 'relative',
            minHeight: 600,
          }}
        >
          <LazyChainScene
            gender={gender}
            build={build}
            heightInches={totalHeightInches}
            chainLength={chainLength}
            chainThickness={chainThickness}
          />
          {/* Drag hint */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}
          >
            Drag to rotate &middot; Scroll to zoom
          </div>
        </div>

        {/* Controls Panel */}
        <div
          style={{
            borderLeft: `1px solid ${STYX.line}`,
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            overflowY: 'auto',
          }}
        >
          {/* Gender */}
          <ControlSection label="Gender">
            <div style={{display: 'flex', gap: 8}}>
              {(['male', 'female'] as Gender[]).map((g) => (
                <ToggleButton
                  key={g}
                  active={gender === g}
                  onClick={() => setGender(g)}
                >
                  {g === 'male' ? 'Male' : 'Female'}
                </ToggleButton>
              ))}
            </div>
          </ControlSection>

          {/* Build */}
          <ControlSection label="Build">
            <div style={{display: 'flex', gap: 8}}>
              {(Object.keys(BUILD_PRESETS) as BuildKey[]).map((b) => (
                <ToggleButton
                  key={b}
                  active={build === b}
                  onClick={() => setBuild(b)}
                >
                  {BUILD_PRESETS[b].label}
                </ToggleButton>
              ))}
            </div>
          </ControlSection>

          {/* Height */}
          <ControlSection label={`Height — ${heightDisplay}`}>
            <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
              <div style={{flex: 1}}>
                <label
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 9,
                    color: STYX.silt,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Feet
                </label>
                <select
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(Number(e.target.value))}
                  style={selectStyle}
                >
                  {[4, 5, 6, 7].map((f) => (
                    <option key={f} value={f}>
                      {f} ft
                    </option>
                  ))}
                </select>
              </div>
              <div style={{flex: 1}}>
                <label
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 9,
                    color: STYX.silt,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Inches
                </label>
                <select
                  value={heightExtraInches}
                  onChange={(e) => setHeightExtraInches(Number(e.target.value))}
                  style={selectStyle}
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i}>
                      {i} in
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ControlSection>

          {/* Chain Length */}
          <ControlSection label={`Chain Length — ${chainLength}"`}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              {CHAIN_LENGTHS.map((len) => (
                <ToggleButton
                  key={len}
                  active={chainLength === len}
                  onClick={() => setChainLength(len)}
                >
                  {len}"
                </ToggleButton>
              ))}
            </div>
            <p
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 15,
                color: STYX.silt,
                lineHeight: 1.5,
                marginTop: 10,
              }}
            >
              {CHAIN_LENGTH_LABELS[chainLength]}
            </p>
          </ControlSection>

          {/* Chain Thickness */}
          <ControlSection label={`Chain Thickness — ${chainThickness}mm`}>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={chainThickness}
              onChange={(e) => setChainThickness(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: STYX.gold,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: FONT.mono,
                fontSize: 9,
                color: STYX.silt2,
                letterSpacing: '0.1em',
                marginTop: 4,
              }}
            >
              <span>1mm</span>
              <span>10mm</span>
            </div>
          </ControlSection>

          {/* CTA */}
          <div style={{marginTop: 'auto', paddingTop: 20}}>
            <Link
              to={`/collections/chains`}
              style={{
                display: 'block',
                width: '100%',
                padding: '18px 0',
                background: STYX.ink,
                color: STYX.bone,
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Shop {chainLength}" Chains
            </Link>
            <p
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                color: STYX.silt2,
                textAlign: 'center',
                marginTop: 10,
                letterSpacing: '0.1em',
              }}
            >
              Free insured shipping on all orders
            </p>
          </div>
        </div>
      </div>

      {/* Length reference table */}
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '80px 56px',
          borderTop: `1px solid ${STYX.line}`,
        }}
      >
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 10,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: STYX.gold,
            marginBottom: 20,
          }}
        >
          Quick Reference
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
          className="styx-chain-ref-grid"
        >
          {CHAIN_LENGTHS.map((len) => (
            <div
              key={len}
              style={{
                padding: '20px',
                border: `1px solid ${chainLength === len ? STYX.gold : STYX.line}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => setChainLength(len)}
            >
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 22,
                  color: chainLength === len ? STYX.gold : STYX.ink,
                  marginBottom: 6,
                }}
              >
                {len}"
              </div>
              <div
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: STYX.silt,
                  lineHeight: 1.4,
                }}
              >
                {CHAIN_LENGTH_LABELS[len]}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UI Primitives
   ═══════════════════════════════════════════════════════════════ */

function ControlSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: STYX.silt,
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        border: `1px solid ${active ? STYX.gold : STYX.line}`,
        background: active ? STYX.ink : 'transparent',
        color: active ? STYX.gold : STYX.graphite,
        fontFamily: FONT.cinzel,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${STYX.line}`,
  background: STYX.bone,
  fontFamily: FONT.cinzel,
  fontSize: 13,
  color: STYX.ink,
  cursor: 'pointer',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
};
