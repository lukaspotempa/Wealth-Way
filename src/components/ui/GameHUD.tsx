import { useGameStore } from "../../store/gameStore";
import "./GameHUD.css";

/**
 * Main heads-up display showing:
 * - Current player info (name, money, round)
 * - Roll dice button
 * - All players' quick stats
 * - Game log
 */
export default function GameHUD() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const round = useGameStore((s) => s.round);
  const turnPhase = useGameStore((s) => s.turnPhase);
  const diceValue = useGameStore((s) => s.diceValue);
  const rollDice = useGameStore((s) => s.rollDice);
  const gameLog = useGameStore((s) => s.gameLog);

  if (players.length === 0) return null;

  const currentPlayer = players[currentPlayerIndex];
  const canRoll = turnPhase === "waiting" && !currentPlayer.isBankrupt;

  return (
    <div className="game-hud">
      {/* Top bar: round + current player */}
      <div className="hud-top-bar">
        <div className="hud-round">Round {round + 1}</div>
        <div
          className="hud-current-player"
          style={{ borderColor: currentPlayer.color }}
        >
          <span
            className="hud-player-dot"
            style={{ backgroundColor: currentPlayer.color }}
          />
          {currentPlayer.name}'s Turn
        </div>
        <div className="hud-money">${currentPlayer.money.toLocaleString()}</div>
      </div>

      {/* Dice / action area */}
      <div className="hud-action-area">
        {canRoll && (
          <button className="hud-roll-btn" onClick={rollDice}>
            🎲 Roll Dice
          </button>
        )}
        {turnPhase === "rolling" && (
          <div className="hud-dice-info">Rolling...</div>
        )}
        {turnPhase === "moving" && diceValue !== null && (
          <div className="hud-dice-info">Rolled a {diceValue}! Moving...</div>
        )}
        {turnPhase === "event" && (
          <div className="hud-dice-info">Resolving event...</div>
        )}
      </div>

      {/* Player scoreboard */}
      <div className="hud-scoreboard">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`hud-player-row ${i === currentPlayerIndex ? "active" : ""} ${p.isBankrupt ? "bankrupt" : ""}`}
            style={{ borderLeftColor: p.color }}
          >
            <span className="hud-player-name">{p.name}</span>
            <span className="hud-player-money">
              {p.isBankrupt ? "BANKRUPT" : `$${p.money.toLocaleString()}`}
            </span>
            {p.holdings.length > 0 && (
              <span className="hud-player-holdings">
                📊 {p.holdings.length}
              </span>
            )}
            {p.powerUps.length > 0 && (
              <span className="hud-player-powerups">
                ⚡ {p.powerUps.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Game log */}
      <div className="hud-log">
        <div className="hud-log-title">Game Log</div>
        <div className="hud-log-entries">
          {gameLog
            .slice(-8)
            .reverse()
            .map((msg, i) => (
              <div key={i} className="hud-log-entry">
                {msg}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
