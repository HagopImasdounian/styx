import {useRef, useMemo, useEffect} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

type Gender = 'male' | 'female';
type BuildKey = 'slim' | 'athletic' | 'heavy';

interface SceneProps {
  gender: Gender;
  build: BuildKey;
  heightInches: number;
  chainLength: number;
  chainThickness: number;
}

/* ═══════════════════════════════════════════════════════════════
   Build parameters — controls body proportions
   ═══════════════════════════════════════════════════════════════ */

const BUILD_PARAMS = {
  slim: {shoulder: 0.88, chest: 0.85, neck: 0.9, waist: 0.82},
  athletic: {shoulder: 1.0, chest: 1.0, neck: 1.0, waist: 0.9},
  heavy: {shoulder: 1.1, chest: 1.2, neck: 1.12, waist: 1.15},
} as const;

const GENDER_PARAMS = {
  male: {
    shoulderWidth: 0.46,
    chestDepth: 0.22,
    chestWidth: 0.38,
    waistWidth: 0.32,
    neckRadius: 0.065,
    neckHeight: 0.12,
    headRadius: 0.105,
    torsoHeight: 0.58,
    hipWidth: 0.34,
  },
  female: {
    shoulderWidth: 0.40,
    chestDepth: 0.20,
    chestWidth: 0.34,
    waistWidth: 0.28,
    neckRadius: 0.055,
    neckHeight: 0.11,
    headRadius: 0.10,
    torsoHeight: 0.54,
    hipWidth: 0.36,
  },
} as const;

/* ═══════════════════════════════════════════════════════════════
   Mannequin — procedural upper-body bust
   ═══════════════════════════════════════════════════════════════ */

function Mannequin({
  gender,
  build,
  heightScale,
}: {
  gender: Gender;
  build: BuildKey;
  heightScale: number;
}) {
  const gp = GENDER_PARAMS[gender];
  const bp = BUILD_PARAMS[build];

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: gender === 'male' ? '#a89080' : '#c4a898',
        roughness: 0.7,
        metalness: 0.05,
      }),
    [gender],
  );

  // Scaled dimensions
  const sw = gp.shoulderWidth * bp.shoulder;
  const cw = gp.chestWidth * bp.chest;
  const cd = gp.chestDepth * bp.chest;
  const ww = gp.waistWidth * bp.waist;
  const nr = gp.neckRadius * bp.neck;
  const nh = gp.neckHeight;
  const hr = gp.headRadius;
  const th = gp.torsoHeight;
  const hw = gp.hipWidth * bp.waist;

  // Build the torso as a lathe profile (half cross-section rotated)
  const torsoGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 = bottom (waist), 1 = top (shoulders)
      let radius: number;
      if (t < 0.3) {
        // Waist to lower chest
        radius = THREE.MathUtils.lerp(ww / 2, cw / 2, t / 0.3);
      } else if (t < 0.7) {
        // Chest area (widest)
        const chestT = (t - 0.3) / 0.4;
        radius = cw / 2 + Math.sin(chestT * Math.PI) * (sw / 2 - cw / 2) * 0.5;
      } else {
        // Shoulders tapering to neck
        const shoulderT = (t - 0.7) / 0.3;
        radius = THREE.MathUtils.lerp(sw / 2, nr * 1.5, shoulderT * shoulderT);
      }
      points.push(new THREE.Vector2(radius, t * th));
    }
    return new THREE.LatheGeometry(points, 32);
  }, [sw, cw, ww, nr, th]);

  return (
    <group scale={[heightScale, heightScale, heightScale]}>
      {/* Torso */}
      <mesh
        geometry={torsoGeometry}
        material={material}
        position={[0, -th / 2, 0]}
      />

      {/* Neck */}
      <mesh material={material} position={[0, th / 2 + nh / 2, 0]}>
        <cylinderGeometry args={[nr, nr * 1.15, nh, 16]} />
      </mesh>

      {/* Head */}
      <mesh material={material} position={[0, th / 2 + nh + hr * 0.85, 0]}>
        <sphereGeometry args={[hr, 24, 16]} />
      </mesh>

      {/* Shoulders — rounded caps */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          material={material}
          position={[side * sw * 0.48, th * 0.42, 0]}
        >
          <sphereGeometry args={[0.06 * bp.shoulder, 12, 8]} />
        </mesh>
      ))}

      {/* Upper arms (just stubs for context) */}
      {[-1, 1].map((side) => (
        <mesh
          key={`arm-${side}`}
          material={material}
          position={[side * sw * 0.52, th * 0.25, 0]}
          rotation={[0, 0, side * 0.15]}
        >
          <capsuleGeometry args={[0.04 * bp.shoulder, 0.2, 6, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Chain — gold tube following a catenary-like curve
   ═══════════════════════════════════════════════════════════════ */

function Chain({
  gender,
  build,
  heightScale,
  chainLengthInches,
  thicknessMm,
}: {
  gender: Gender;
  build: BuildKey;
  heightScale: number;
  chainLengthInches: number;
  thicknessMm: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const gp = GENDER_PARAMS[gender];
  const bp = BUILD_PARAMS[build];
  const nr = gp.neckRadius * bp.neck;
  const th = gp.torsoHeight;

  const {geometry, material} = useMemo(() => {
    // Chain hangs from the neck base
    // Convert inches to model units (roughly 1 unit = torso height ≈ 22 inches for reference person)
    const refTorsoInches = 22;
    const inchToUnit = th / refTorsoInches;
    const halfChainUnits = (chainLengthInches / 2) * inchToUnit;

    // Neck base Y position
    const neckBaseY = th / 2;

    // Create a U-shaped catenary curve for the chain
    const points: THREE.Vector3[] = [];
    const segments = 48;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 = left shoulder, 1 = right shoulder
      const angle = Math.PI + t * Math.PI; // Goes around the front of neck/chest

      // Horizontal position — starts at neck width, goes to front, back to other side
      const neckCircleRadius = nr * 1.3;
      const x = Math.sin(angle) * neckCircleRadius * (0.3 + t * 0.4 + (1 - t) * 0.4);

      // For the drape: use a parabolic curve that reaches down based on chain length
      // The bottom of the chain hangs at: neckBaseY - droopAmount
      const droopAmount = Math.max(0, halfChainUnits - neckCircleRadius * Math.PI * 0.5);
      const droop = Math.sin(t * Math.PI); // 0 at sides, 1 at center
      const y = neckBaseY - droop * droopAmount;

      // Depth — front of body
      const z = Math.cos(angle) * neckCircleRadius * 0.8;

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points, false);

    // Chain thickness: convert mm to model units
    // Reference: neck radius ~65mm for male = 0.065 units, so 1mm ≈ 0.001 units
    const radiusUnits = (thicknessMm / 2) * 0.001;

    const geo = new THREE.TubeGeometry(curve, 64, radiusUnits, 8, false);

    const mat = new THREE.MeshStandardMaterial({
      color: '#d4a844',
      roughness: 0.25,
      metalness: 0.85,
      envMapIntensity: 1.5,
    });

    return {geometry: geo, material: mat};
  }, [gender, build, chainLengthInches, thicknessMm, nr, th]);

  // Subtle shimmer animation
  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.envMapIntensity = 1.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      scale={[heightScale, heightScale, heightScale]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   Height ruler overlay
   ═══════════════════════════════════════════════════════════════ */

function HeightRuler({heightInches}: {heightInches: number}) {
  const feet = Math.floor(heightInches / 12);
  const inches = heightInches % 12;
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: '15%',
        bottom: '15%',
        width: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      <div style={{width: 1, flex: 1, background: 'rgba(255,255,255,0.15)'}} />
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.1em',
          textAlign: 'center',
          padding: '8px 0',
          whiteSpace: 'nowrap',
        }}
      >
        {feet}'{inches}"
      </div>
      <div style={{width: 1, flex: 1, background: 'rgba(255,255,255,0.15)'}} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Exported Scene wrapper
   ═══════════════════════════════════════════════════════════════ */

export function ChainLengthScene({
  gender,
  build,
  heightInches,
  chainLength,
  chainThickness,
}: SceneProps) {
  // Scale model relative to a 5'10" reference (70 inches)
  const heightScale = heightInches / 70;

  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      <Canvas
        camera={{position: [0, 0.25, 1.2], fov: 35}}
        gl={{antialias: true, alpha: false}}
        style={{background: '#1a1815'}}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 2]} intensity={1.5} color="#fff5e0" />
        <directionalLight position={[-1, 2, -1]} intensity={0.5} color="#e0e5ff" />
        <pointLight position={[0, 0.2, 1.5]} intensity={0.8} color="#d4a844" />
        <pointLight position={[0, -0.3, -1]} intensity={0.3} color="#ffffff" />

        <Mannequin gender={gender} build={build} heightScale={heightScale} />
        <Chain
          gender={gender}
          build={build}
          heightScale={heightScale}
          chainLengthInches={chainLength}
          thicknessMm={chainThickness}
        />

        <OrbitControls
          enablePan={false}
          minDistance={0.6}
          maxDistance={2.5}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.7}
          target={[0, 0.2, 0]}
        />
      </Canvas>

      <HeightRuler heightInches={heightInches} />

      {/* Chain length indicator */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontFamily: "'Cinzel', serif",
          fontSize: 36,
          color: '#d4a844',
          letterSpacing: '0.02em',
          pointerEvents: 'none',
          lineHeight: 1,
        }}
      >
        {chainLength}"
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginTop: 6,
          }}
        >
          {chainThickness}mm thickness
        </div>
      </div>
    </div>
  );
}
