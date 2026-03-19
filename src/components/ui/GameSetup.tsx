import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import "./GameSetup.css";

/**
 * Pre-game setup screen where players choose the number of players.
 */
export default function GameSetup() {
  const [playerCount, setPlayerCount] = useState(2);
  const initGame = useGameStore((s) => s.initGame);
  const players = useGameStore((s) => s.players);

  // If game is already initialized, don't show setup
  if (players.length > 0) return null;

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <h1 className="setup-title">Investment Game</h1>
        <p className="setup-subtitle">
          Roll the dice, invest wisely, and grow your wealth!
        </p>

        <div className="setup-option">
          <label className="setup-label">Number of Players</label>
          <div className="setup-player-btns">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className={`setup-player-btn ${n === playerCount ? "active" : ""}`}
                onClick={() => setPlayerCount(n)}
              >
                {n} Players
              </button>
            ))}
          </div>
        </div>

        <button
          className="setup-start-btn"
          onClick={() => initGame(playerCount)}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
