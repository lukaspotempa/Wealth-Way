import { useRef, useState, useCallback, useMemo } from "react";
import { Text } from "@react-three/drei";
import type { Mesh } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { TileData, TileCategory, BoardConfig } from "../types/board";
import { computeTileTransform } from "../utils/tileTransform";

interface TileProps {
  tile: TileData;
  config: BoardConfig;
}

/** Map tile categories to their visual colors */
const CATEGORY_COLORS: Record<TileCategory, string> = {
  start: "#F5F0E1",
  investment: "#4CAF50",
  "market-event": "#FF9800",
  income: "#2196F3",
  "negative-event": "#F44336",
  shop: "#9C27B0",
};

/** Icon/emoji for each category (shown on tile) */
const CATEGORY_ICONS: Record<TileCategory, string> = {
  start: "★",
  investment: "📈",
  "market-event": "📰",
  income: "💰",
  "negative-event": "⚠",
  shop: "🛒",
};

const HOVER_EMISSIVE = 0.15;

export default function Tile({ tile, config }: TileProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const { position, rotation, size } = useMemo(
    () => computeTileTransform(tile, config),
    [tile, config]
  );

  const baseColor = CATEGORY_COLORS[tile.category];
  const icon = CATEGORY_ICONS[tile.category];
  const isCorner = tile.index === -1;

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
  }, []);

  const fontSize = isCorner ? 0.12 : 0.07;
  const maxWidth = isCorner
    ? config.cornerSize * 0.8
    : config.tileDepth * 0.85;

  return (
    <group position={position} rotation={rotation}>
      {/* Main tile body */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={hovered ? HOVER_EMISSIVE : 0}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Category icon */}
      <Text
        position={[0, config.tileHeight / 2 + 0.01, isCorner ? -0.15 : -0.08]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={isCorner ? 0.2 : 0.14}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
      >
        {icon}
      </Text>

      {/* Label text */}
      <Text
        position={[0, config.tileHeight / 2 + 0.01, isCorner ? 0.15 : 0.08]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={fontSize}
        maxWidth={maxWidth}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        fontWeight="bold"
      >
        {tile.label}
      </Text>
    </group>
  );
}
