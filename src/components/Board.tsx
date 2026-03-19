import { useMemo, useEffect, useRef } from "react";
import Tile from "./Tile";
import BoardBase from "./BoardBase";
import PlayerToken from "./PlayerToken";
import Dice from "./Dice";
import { BOARD_CONFIG } from "../data/boardConfig";
import { generateTiles } from "../data/tiles";
import { useGameStore } from "../store/gameStore";

/**
 * The complete 3D board: base plate, tiles, player tokens, and dice.
 */
export default function Board() {
  const tiles = useMemo(() => generateTiles(), []);
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const turnPhase = useGameStore((s) => s.turnPhase);
  const finishMovementRef = useRef(useGameStore.getState().finishMovement);

  // Keep the ref up-to-date
  useEffect(() => {
    finishMovementRef.current = useGameStore.getState().finishMovement;
  });

  // Trigger movement completion after the token lerp settles
  useEffect(() => {
    if (turnPhase === "moving") {
      const timer = setTimeout(() => {
        finishMovementRef.current();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turnPhase]);

  return (
    <group>
      <BoardBase config={BOARD_CONFIG} />

      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} config={BOARD_CONFIG} />
      ))}

      {players.map((player) => (
        <PlayerToken
          key={player.id}
          player={player}
          tiles={tiles}
          config={BOARD_CONFIG}
          allPlayers={players}
          isCurrentPlayer={player.id === players[currentPlayerIndex]?.id}
        />
      ))}

      <Dice />
    </group>
  );
}
