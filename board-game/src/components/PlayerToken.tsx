import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Group } from "three";
import * as THREE from "three";
import type { Player } from "../types/game";
import type { TileData, BoardConfig } from "../types/board";
import { getTileWorldPosition, getPlayerOffset } from "../utils/tilePositions";

interface PlayerTokenProps {
  player: Player;
  tiles: TileData[];
  config: BoardConfig;
  allPlayers: Player[];
  isCurrentPlayer: boolean;
}

/**
 * A 3D player token (cylinder + sphere "pawn" shape) that smoothly
 * interpolates to its target tile position each frame.
 */
export default function PlayerToken({
  player,
  tiles,
  config,
  allPlayers,
  isCurrentPlayer,
}: PlayerTokenProps) {
  const groupRef = useRef<Group>(null);

  // Calculate how many players share this tile and this player's index among them
  const playersOnSameTile = useMemo(
    () =>
      allPlayers.filter(
        (p) => !p.isBankrupt && p.tileIndex === player.tileIndex
      ),
    [allPlayers, player.tileIndex]
  );
  const indexOnTile = playersOnSameTile.findIndex((p) => p.id === player.id);

  // Target position
  const targetPos = useMemo(() => {
    const base = getTileWorldPosition(player.tileIndex, tiles, config);
    const offset = getPlayerOffset(indexOnTile, playersOnSameTile.length);
    return new THREE.Vector3(
      base[0] + offset[0],
      base[1] + offset[1],
      base[2] + offset[2]
    );
  }, [player.tileIndex, tiles, config, indexOnTile, playersOnSameTile.length]);

  // Smooth movement via lerp
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(targetPos, 0.08);
  });

  if (player.isBankrupt) return null;

  return (
    <group ref={groupRef} position={[targetPos.x, targetPos.y, targetPos.z]}>
      {/* Base cylinder */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 16]} />
        <meshStandardMaterial
          color={player.color}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Body */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.14, 16]} />
        <meshStandardMaterial
          color={player.color}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Head sphere */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={player.color}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Current player indicator (floating ring) */}
      {isCurrentPlayer && (
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.015, 8, 24]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Player number label */}
      <Text
        position={[0, 0.42, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {`P${player.id + 1}`}
      </Text>
    </group>
  );
}
