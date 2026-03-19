import { useMemo } from "react";
import type { BoardConfig } from "../types/board";
import { getBoardSpan } from "../data/boardConfig";

interface BoardBaseProps {
  config: BoardConfig;
}

/**
 * The large base plate that sits underneath all the tiles,
 * representing the center of the board.
 */
export default function BoardBase({ config }: BoardBaseProps) {
  const span = useMemo(() => getBoardSpan(config), [config]);
  const innerSize = span - config.tileWidth * 2;
  const baseThickness = 0.06;

  return (
    <group>
      {/* Full board base plate */}
      <mesh
        position={[0, -baseThickness / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[span + 0.02, baseThickness, span + 0.02]} />
        <meshStandardMaterial
          color="#C8E6C9"
          roughness={0.8}
          metalness={0.02}
        />
      </mesh>

      {/* Inner board area (slightly raised, lighter color) */}
      <mesh
        position={[0, baseThickness / 2 - 0.01, 0]}
        receiveShadow
      >
        <boxGeometry args={[innerSize, 0.02, innerSize]} />
        <meshStandardMaterial
          color="#D7ECD9"
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
