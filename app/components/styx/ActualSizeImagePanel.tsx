import {STYX, FONT} from './constants';
import {ChainSilhouette} from './ChainSilhouette';
import {ActualSizeImageButton} from './ActualSizeImageButton';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {styleToSlug, parseMm} from '~/lib/chains';

/**
 * True-size view that swaps in WHERE THE LEAD PRODUCT IMAGE WAS (Alex Moss
 * pattern): tapping "View actual size" on the image replaces the photo with
 * the chain rendered at its real physical width; tapping again restores the
 * photo. Square (1/1) to match the 2000² product photography so the swap
 * doesn't shift the page. Parent decides when to render it (actual-size on +
 * parseable width); it self-hides otherwise as a safety net.
 */
export function ActualSizeImagePanel({
  thickness,
  chainStyle,
  title,
}: {
  thickness?: string | null;
  chainStyle?: string | null;
  title: string;
}) {
  const {
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

  if (mm == null || pxPerMm == null) return null;

  // On desktop the estimate is a guess (the monitor's real size is unknowable),
  // so we nudge those shoppers toward validating with a card.
  const lowConfidence = source === 'estimate' && estimateConfidence === 'low';
  const userSet = source === 'calibration' || source === 'manual';

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: '48px 24px 72px',
        overflow: 'hidden',
      }}
    >
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: STYX.gold,
          }}
        >
          Shown at Actual Size
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 17,
            color: STYX.silt,
            marginTop: 6,
          }}
        >
          {source === 'calibration'
            ? `${mm} mm — true size, calibrated to your screen`
            : source === 'manual'
            ? `${mm} mm — true size, adjusted to your screen`
            : `${mm} mm — true size on your screen`}
        </div>
      </div>

      {/* Horizontal so the chain's true thickness is its HEIGHT — reads like
          laying the chain on a ruler in front of you. */}
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
              textAlign: 'center',
            }}
          >
            {staleZoom
              ? 'Your browser zoom changed — re-check against a card'
              : 'Estimated for this screen — fine-tune below or check with a card'}
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
          <NudgeBtn
            label="−"
            title="Slightly smaller"
            onClick={() => adjustScale(-1)}
          />
          <NudgeBtn
            label="+"
            title="Slightly larger"
            onClick={() => adjustScale(1)}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => openCalibration()}
            style={LINK_STYLE}
          >
            {isCalibrated
              ? 'Re-check with a bank card'
              : 'Match a bank card exactly'}
          </button>
          {userSet && (
            <button type="button" onClick={clearCalibration} style={LINK_STYLE}>
              Reset to auto
            </button>
          )}
        </div>
      </div>

      {/* Same overlay button as the photo, now reading "Actual size: on" —
          tapping it swaps the photo back. */}
      <ActualSizeImageButton />
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

function NudgeBtn({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
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
