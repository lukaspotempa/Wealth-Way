import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { LIFE_GOALS } from "../../data/goals";
import "./GameSetup.css";

const DEFAULT_NAMES = ["Alex", "Sam", "Jordan", "Riley"];

/**
 * Pre-game setup screen where players choose count and enter names.
 */
export default function GameSetup() {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES.slice(0, 2));
  const initGame = useGameStore((s) => s.initGame);
  const players = useGameStore((s) => s.players);

  // If game is already initialized, don't show setup
  if (players.length > 0) return null;

  const handleCountChange = (n: number) => {
    setPlayerCount(n);
    setPlayerNames(
      Array.from({ length: n }, (_, i) => playerNames[i] ?? DEFAULT_NAMES[i] ?? `Player ${i + 1}`)
    );
  };

  const handleNameChange = (i: number, value: string) => {
    setPlayerNames((prev) => prev.map((name, idx) => (idx === i ? value : name)));
  };

  const firstGoal = LIFE_GOALS[0];

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-logo">💹</div>
        <h1 className="setup-title">Wealth Manager Arena</h1>
        <p className="setup-subtitle">
          Roll the dice. Build your wealth. Reach your life goals.
        </p>

        <div className="setup-first-goal">
          <span className="setup-goal-emoji">{firstGoal.emoji}</span>
          <div>
            <div className="setup-goal-label">First goal</div>
            <div className="setup-goal-name">{firstGoal.name}</div>
            <div className="setup-goal-target">
              ${firstGoal.targetNetWorth.toLocaleString()} net worth
            </div>
          </div>
        </div>

        <div className="setup-option">
          <label className="setup-label">Number of Players</label>
          <div className="setup-player-btns">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className={`setup-player-btn ${n === playerCount ? "active" : ""}`}
                onClick={() => handleCountChange(n)}
              >
                {n}P
              </button>
            ))}
          </div>
        </div>

        <div className="setup-names">
          {Array.from({ length: playerCount }, (_, i) => (
            <input
              key={i}
              className="setup-name-input"
              placeholder={`Player ${i + 1} name`}
              value={playerNames[i] ?? ""}
              onChange={(e) => handleNameChange(i, e.target.value)}
              maxLength={20}
            />
          ))}
        </div>

        <button
          className="setup-start-btn"
          onClick={() => initGame(playerCount, playerNames)}
        >
          Start Game →
        </button>
      </div>
    </div>
  );
}
