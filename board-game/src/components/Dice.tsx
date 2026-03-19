import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Group } from "three";
import { useGameStore } from "../store/gameStore";

/**
 * A simple 3D dice that appears on the board center when rolled.
 * Shows the dice value on its top face with a scale-in + spin animation.
 * Uses refs for per-frame animation to avoid React re-render overhead.
 */
export default function Dice() {
  const groupRef = useRef<Group>(null);
  const diceValue = useGameStore((s) => s.diceValue);
  const turnPhase = useGameStore((s) => s.turnPhase);

  // Animation state stored in refs (mutated per-frame, no re-renders)
  const scaleRef = useRef(0);
  const rotYRef = useRef(0);
  const prevPhaseRef = useRef(turnPhase);

  // Derive visibility directly from state — no effect needed
  const isVisible =
    diceValue !== null &&
    (turnPhase === "rolling" || turnPhase === "moving");

  // Per-frame animation (direct mutation via refs, no setState)
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Reset animation values when transitioning to "rolling"
    if (turnPhase === "rolling" && prevPhaseRef.current !== "rolling") {
      scaleRef.current = 0;
      rotYRef.current = 0;
    }
    prevPhaseRef.current = turnPhase;

    if (!isVisible) return;

    if (turnPhase === "rolling") {
      scaleRef.current += (1 - scaleRef.current) * 0.12;
      rotYRef.current += delta * 8;
    } else {
      scaleRef.current += (1 - scaleRef.current) * 0.15;
      rotYRef.current *= 0.95;
    }

    groupRef.current.scale.setScalar(scaleRef.current);
    groupRef.current.rotation.y = rotYRef.current;
  });

  if (!isVisible || diceValue === null) return null;

  const pips = getDicePips(diceValue);

  return (
    <group ref={groupRef} position={[0, 0.35, 0]} scale={0}>
      {/* Dice body */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Number on top face */}
      <Text
        position={[0, 0.26, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {diceValue.toString()}
      </Text>

      {/* Pips on the front face */}
      {pips.map((pos, i) => (
        <mesh key={i} position={[pos[0] * 0.12, pos[1] * 0.12, 0.26]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

/** Returns normalized pip positions for a given dice face value */
function getDicePips(value: number): [number, number][] {
  switch (value) {
    case 1:
      return [[0, 0]];
    case 2:
      return [[-1, -1], [1, 1]];
    case 3:
      return [[-1, -1], [0, 0], [1, 1]];
    case 4:
      return [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    case 5:
      return [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]];
    case 6:
      return [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]];
    default:
      return [];
  }
}
