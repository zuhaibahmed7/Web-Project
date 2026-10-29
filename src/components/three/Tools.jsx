import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Low-poly workshop tools, assembled from primitives so nothing has to be
// downloaded. Each piece uses flat shading for the faceted look.
const PALETTE = {
  violet: '#6C5CE7',
  teal: '#00D4C8',
  amber: '#FFB020',
  orange: '#FF7A1A',
  blue: '#3B82F6',
  ink: '#1a2150',
  steel: '#aab3d4',
};

function Metal({ color, metalness = 0.5, roughness = 0.38 }) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} flatShading />;
}

export function Wrench({ color = PALETTE.violet }) {
  return (
    <group>
      <RoundedBox args={[0.17, 1.45, 0.15]} radius={0.06} smoothness={1}>
        <Metal color={color} />
      </RoundedBox>
      {/* hexagonal open jaw */}
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.12, 6, 6]} />
        <Metal color={color} />
      </mesh>
      <mesh position={[0, -0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.1, 6, 6]} />
        <Metal color={color} />
      </mesh>
    </group>
  );
}

export function Hammer({ handle = PALETTE.amber, head = PALETTE.ink }) {
  return (
    <group>
      <RoundedBox args={[0.15, 1.35, 0.15]} radius={0.055} smoothness={1} position={[0, -0.15, 0]}>
        <Metal color={handle} metalness={0.15} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.32, 0.32]} radius={0.08} smoothness={1} position={[0, 0.55, 0]}>
        <Metal color={head} metalness={0.7} roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.26, 0.26]} radius={0.06} smoothness={1} position={[-0.6, 0.55, 0]}>
        <Metal color={head} metalness={0.7} roughness={0.3} />
      </RoundedBox>
    </group>
  );
}

export function Screwdriver({ grip = PALETTE.teal }) {
  return (
    <group rotation={[0, 0, 0.28]}>
      <RoundedBox args={[0.26, 0.62, 0.26]} radius={0.1} smoothness={1} position={[0, -0.55, 0]}>
        <Metal color={grip} metalness={0.1} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.66, 8]} />
        <Metal color={PALETTE.steel} metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.47, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.18, 6]} />
        <Metal color={PALETTE.steel} metalness={0.85} roughness={0.22} />
      </mesh>
    </group>
  );
}

export function Gear({ color = PALETTE.blue, radius = 0.52 }) {
  const teeth = 8;
  return (
    <group rotation={[Math.PI / 2.3, 0.2, 0]}>
      <mesh>
        <torusGeometry args={[radius, 0.14, 6, teeth]} />
        <Metal color={color} />
      </mesh>
      {Array.from({ length: teeth }).map((_, i) => {
        const angle = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * (radius + 0.13), Math.sin(angle) * (radius + 0.13), 0]}>
            <boxGeometry args={[0.17, 0.2, 0.2]} />
            <Metal color={color} />
          </mesh>
        );
      })}
      <mesh>
        <cylinderGeometry args={[radius * 0.24, radius * 0.24, 0.24, 8]} />
        <Metal color={PALETTE.steel} metalness={0.8} roughness={0.28} />
      </mesh>
    </group>
  );
}

export function Nut({ color = PALETTE.orange }) {
  return (
    <group rotation={[Math.PI / 2.6, 0.3, 0]}>
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, 0.22, 6]} />
        <Metal color={color} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.18, 0.18, 0.26, 8]} />
        <MeshHole />
      </mesh>
    </group>
  );
}

// Dark centre for the nut so the hex ring reads as a hole.
function MeshHole() {
  return <meshStandardMaterial color="#05081a" metalness={0.2} roughness={0.8} flatShading />;
}

export function PipeElbow({ color = PALETTE.teal }) {
  return (
    <group rotation={[0, 0.4, 0.3]}>
      <mesh>
        <torusGeometry args={[0.45, 0.15, 8, 12, Math.PI / 1.6]} />
        <Metal color={color} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0.45, -0.28, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
        <Metal color={color} metalness={0.35} roughness={0.45} />
      </mesh>
    </group>
  );
}

// Whole group leans toward the cursor with a damped spring, so the scene feels
// connected to the pointer without snapping.
export function PointerRig({ children, intensity = 0.32 }) {
  const ref = useRef(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetY = state.pointer.x * intensity;
    const targetX = -state.pointer.y * intensity * 0.7;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, targetY, 3.2, delta);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, targetX, 3.2, delta);
  });

  return <group ref={ref}>{children}</group>;
}
