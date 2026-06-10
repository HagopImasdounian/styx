import {STYX, FONT} from './constants';
import {ChainSilhouette} from './ChainSilhouette';
import {ActualSizeToggle} from './ActualSizeToggle';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {styleToSlug, parseMm} from '~/lib/chains';

/**
 * Product-page block: lets a shopper see this exact chain at its true physical
 * width on their own screen (after a one-time card calibration). Self-contained
 * — derives the weave slug + mm from the product's spec fields.
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
  const {actualSizeOn, pxPerMm, staleZoom, openCalibration} = useScaleCalibration();
  const mm = parseMm(thickness, title);
  const slug = styleToSlug(chainStyle, title);

  // No usable width → nothing meaningful to scale.
  if (mm == null) return null;

  const showing = actualSizeOn && pxPerMm != null;

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
              ? `${mm} mm — shown at true size on your screen`
              : 'Match a bank card to your screen and view this chain at its real width.'}
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
              gap: 6,
            }}
          >
            {staleZoom && (
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: STYX.goldDeep,
                }}
              >
                Your browser zoom changed — re-calibrate for accuracy
              </div>
            )}
            <button
              type="button"
              onClick={() => openCalibration()}
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: STYX.silt,
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Re-calibrate screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
