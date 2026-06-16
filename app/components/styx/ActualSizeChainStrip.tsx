import {STYX, FONT} from './constants';
import {ChainSilhouette} from './ChainSilhouette';
import {ActualSizeToggle} from './ActualSizeToggle';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {styleToSlug, parseMm} from '~/lib/chains';

/**
 * Product-page block: lets a shopper see this exact chain at its true physical
 * width on their own screen. Works instantly off an auto-estimate of the
 * screen's pixel density; a card calibration is offered as optional validation.
 * Self-contained — derives the weave slug + mm from the product's spec fields.
 */
export function ActualSizeChainStrip({
  thickness,
  chainStyle,
  title,
}: {
  thickness?: string | null;
  chainStyle?: string | null;
  title: string;
}) {
  const {
    actualSizeOn,
    pxPerMm,
    source,
    isCalibrated,
    estimateConfidence,
    staleZoom,
    openCalibration,
    adjustScale,
    clearCalibration,
  } = useScaleCalibration();
  const mm = parseMm(thickness, title);
  const slug = styleToSlug(chainStyle, title);

  // No usable width → nothing meaningful to scale.
  if (mm == null) return null;

  const showing = actualSizeOn && pxPerMm != null;
  // On desktop the estimate is a guess (the monitor's real size is unknowable),
  // so we nudge those shoppers toward validating with a card.
  const lowConfidence = source === 'estimate' && estimateConfidence === 'low';
  const userSet = source === 'calibration' || source === 'manual';

  return (
    <div style={{marginTop: 40, paddingTop: 32, borderTop: `1px solid ${STYX.line}`}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: STYX.ink,
            }}
          >
            See It At Actual Size
          </div>
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 16,
              color: STYX.silt,
              marginTop: 2,
            }}
          >
            {showing
              ? source === 'calibration'
                ? `${mm} mm — true size, calibrated to your screen`
                : source === 'manual'
                  ? `${mm} mm — true size, adjusted to your screen`
                  : `${mm} mm — shown at true size on your screen`
              : 'See this exact chain at its real width on your screen — turn it on.'}
          </div>
        </div>
        <ActualSizeToggle />
      </div>

      {showing && (
        <div style={{marginTop: 24}}>
          {/* Horizontal so the chain's true thickness is its HEIGHT — reads
              like laying it on a ruler and costs far less vertical space than a
              tall vertical strip. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <ChainSilhouette
              styleSlug={slug}
              widthMm={mm}
              pxPerMm={pxPerMm}
              orientation="horizontal"
              title={title}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {(staleZoom || lowConfidence) && (
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: STYX.goldDeep,
                }}
              >
                {staleZoom
                  ? 'Your browser zoom changed — re-check against a card'
                  : 'Estimated for this screen — fine-tune it below or check with a card'}
              </div>
            )}

            {/* Eyeball fine-tune: nudge the rendered width up or down without a
                card. Persists as a manual adjustment. */}
            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                }}
              >
                Looks off?
              </span>
              <NudgeBtn label="−" title="Slightly smaller" onClick={() => adjustScale(-1)} />
              <NudgeBtn label="+" title="Slightly larger" onClick={() => adjustScale(1)} />
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center'}}>
              <button
                type="button"
                onClick={() => openCalibration()}
                style={LINK_STYLE}
              >
                {isCalibrated ? 'Re-check with a bank card' : 'Match a bank card exactly'}
              </button>
              {userSet && (
                <button type="button" onClick={clearCalibration} style={LINK_STYLE}>
                  Reset to auto
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LINK_STYLE: React.CSSProperties = {
  fontFamily: FONT.mono,
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: STYX.silt,
  background: 'none',
  border: 'none',
  textDecoration: 'underline',
  cursor: 'pointer',
};

function NudgeBtn({label, title, onClick}: {label: string; title: string; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: '50%',
        border: `1px solid ${STYX.line}`,
        background: 'transparent',
        color: STYX.ink,
        fontSize: 16,
        lineHeight: 1,
        cursor: 'pointer',
        touchAction: 'manipulation',
      }}
    >
      {label}
    </button>
  );
}
