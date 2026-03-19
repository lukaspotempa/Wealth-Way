import { useGameStore } from "../../store/gameStore";
import { computeNetWorth } from "../../store/gameStore";
import { LIFE_GOALS } from "../../data/goals";
import "./GameHUD.css";

/**
 * Main heads-up display showing:
 * - Current player info (name, money, net worth, round)
 * - Goal progress bar for the current player
 * - Roll dice button
 * - All players' quick stats (with goal emoji + net worth)
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
  const investments = useGameStore((s) => s.investments);

  if (players.length === 0) return null;

  const currentPlayer = players[currentPlayerIndex];
  const canRoll = turnPhase === "waiting" && !currentPlayer.isBankrupt;

  const currentGoal =
    currentPlayer.currentGoalIndex < LIFE_GOALS.length
      ? LIFE_GOALS[currentPlayer.currentGoalIndex]
      : null;

  const netWorth = computeNetWorth(currentPlayer, investments);

  return (
    <div className="game-hud">
      {/* Top bar: round + current player + money */}
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
          {currentPlayer.playerName}'s Turn
        </div>
        <div className="hud-money">${currentPlayer.money.toLocaleString()}</div>
      </div>

      {/* Goal progress for current player */}
      {currentGoal ? (
        <div className="hud-goal">
          <div className="hud-goal-header">
            <span>
              {currentGoal.emoji} {currentGoal.name}
            </span>
            <span className="hud-net-worth">
              Net Worth: ${Math.round(netWorth).toLocaleString()}
            </span>
          </div>
          <div className="hud-goal-bar-bg">
            <div
              className="hud-goal-bar-fill"
              style={{
                width: `${Math.min(100, (netWorth / currentGoal.targetNetWorth) * 100)}%`,
              }}
            />
          </div>
          <div className="hud-goal-target">
            Target: ${currentGoal.targetNetWorth.toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="hud-goal hud-goal-complete">
          <span>🌍 All goals complete!</span>
          <span className="hud-net-worth">
            Net Worth: ${Math.round(netWorth).toLocaleString()}
          </span>
        </div>
      )}

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
        {players.map((p, i) => {
          const pNetWorth = computeNetWorth(p, investments);
          const pGoal =
            p.currentGoalIndex < LIFE_GOALS.length
              ? LIFE_GOALS[p.currentGoalIndex]
              : null;
          return (
            <div
              key={p.id}
              className={`hud-player-row ${i === currentPlayerIndex ? "active" : ""} ${p.isBankrupt ? "bankrupt" : ""}`}
              style={{ borderLeftColor: p.color }}
            >
              <span className="hud-player-name">
                {pGoal ? pGoal.emoji : "🌍"} {p.playerName}
              </span>
              <div className="hud-player-right">
                {p.isBankrupt ? (
                  <span className="hud-player-money">BANKRUPT</span>
                ) : (
                  <>
                    <span className="hud-player-money">
                      ${p.money.toLocaleString()}
                    </span>
                    <span className="hud-player-networth">
                      NW ${Math.round(pNetWorth).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              {p.powerUps.length > 0 && (
                <span className="hud-player-powerups">⚡ {p.powerUps.length}</span>
              )}
            </div>
          );
        })}
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
