import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Float, Sparkles } from '@react-three/drei';
import { Wrench, Hammer, Screwdriver, Gear, Nut, PipeElbow, PointerRig } from './Tools';

// The interactive 3D moment: floating low-poly tools that lean toward the cursor.
// `active` lets the wrapper stop the render loop when the canvas scrolls away.
export default function ToolsScene({ active = true, reduced = false }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={active && !reduced ? 'always' : 'never'}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -2, 3]} intensity={45} color="#6C5CE7" />
      <pointLight position={[5, 3, -4]} intensity={35} color="#00D4C8" />

      <PointerRig>
        <Suspense fallback={null}>
          <group position={[0, 0.1, 0]}>
            <Tool float={{ speed: 1.4, rotationIntensity: reduced ? 0 : 0.5, floatIntensity: 1.1 }} position={[-1.95, 0.45, 0]} rotation={[0.3, 0.5, -0.35]} scale={0.95}>
              <Wrench />
            </Tool>

            <Tool float={{ speed: 1.1, rotationIntensity: reduced ? 0 : 0.4, floatIntensity: 0.9 }} position={[1.75, 0.85, -0.5]} rotation={[-0.2, 0.2, 0.5]} scale={0.85}>
              <Hammer />
            </Tool>

            <Tool float={{ speed: 1.7, rotationIntensity: reduced ? 0 : 0.35, floatIntensity: 1.3 }} position={[-0.55, -1.15, 0.7]} rotation={[0.1, -0.4, 0.2]} scale={0.8}>
              <Screwdriver />
            </Tool>

            <Tool float={{ speed: 0.9, rotationIntensity: reduced ? 0 : 0.6, floatIntensity: 0.8 }} position={[2.15, -0.95, 0.25]} rotation={[0.4, 0.1, 0]} scale={0.9}>
              <Gear />
            </Tool>

            <Tool float={{ speed: 1.3, rotationIntensity: reduced ? 0 : 0.45, floatIntensity: 1 }} position={[-2.35, -0.95, -0.6]} rotation={[0.5, 0.3, 0.2]} scale={0.75}>
              <Nut />
            </Tool>

            <Tool float={{ speed: 1.05, rotationIntensity: reduced ? 0 : 0.4, floatIntensity: 1.15 }} position={[0.45, 1.5, -0.9]} rotation={[0.2, 0.6, 0.4]} scale={0.85}>
              <PipeElbow />
            </Tool>
          </group>

          <Sparkles count={26} scale={[7, 4, 3]} size={2.4} speed={reduced ? 0 : 0.28} opacity={0.5} color="#8df7ef" />
          <ContactShadows position={[0, -2.15, 0]} opacity={0.32} scale={11} blur={2.8} far={4.4} resolution={512} color="#0f1535" />
        </Suspense>
      </PointerRig>
    </Canvas>
  );
}

// Small wrapper so each tool keeps its own float settings without repeating JSX.
function Tool({ children, float, ...rest }) {
  return (
    <Float {...float} {...rest}>
      {children}
    </Float>
  );
}
