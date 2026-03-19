import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Board from "./Board";

/**
 * The root R3F scene.
 *
 * Camera is positioned for a 2.5D "top-side" perspective:
 * looking down at the board from a tilted angle, not pure top-down.
 */
export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 8, 5],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Sky / background color */}
      <color attach="background" args={["#1a1a2e"]} />

      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight
        position={[-3, 6, -4]}
        intensity={0.3}
      />

      {/* The board */}
      <Board />

      {/* Camera controls - restricted to maintain 2.5D feel */}
      <OrbitControls
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 6}    // Prevent going too horizontal
        maxPolarAngle={Math.PI / 3}    // Prevent going full top-down
        minDistance={6}
        maxDistance={16}
        enablePan={false}
      />
    </Canvas>
  );
}
