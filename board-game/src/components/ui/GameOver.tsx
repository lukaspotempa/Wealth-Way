import { useGameStore } from "../../store/gameStore";
import { computeNetWorth } from "../../store/gameStore";
import { LIFE_GOALS } from "../../data/goals";
import "./GameOver.css";

/**
 * Game over screen showing final rankings, stats, and a play-again option.
 * Displayed when turnPhase === "game-over".
 */
export default function GameOver() {
  const turnPhase = useGameStore((s) => s.turnPhase);
  const players = useGameStore((s) => s.players);
  const investments = useGameStore((s) => s.investments);
  const initGame = useGameStore((s) => s.initGame);

  if (turnPhase !== "game-over") return null;

  const withNetWorth = players
    .map((p) => ({
      ...p,
      netWorth: computeNetWorth(p, investments),
    }))
    .sort((a, b) => b.netWorth - a.netWorth);

  const winner = withNetWorth[0];

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        <div className="gameover-trophy">🏆</div>
        <h2 className="gameover-title">Game Over!</h2>
        <div className="gameover-winner">
          <span style={{ color: winner.color }}>{winner.playerName}</span>{" "}
          wins with ${Math.round(winner.netWorth).toLocaleString()} net worth!
        </div>

        <div className="gameover-players">
          {withNetWorth.map((p, rank) => {
            const goalsAchieved = p.achievedGoals.length;
            const lastGoal =
              goalsAchieved > 0
                ? LIFE_GOALS.find(
                    (g) => g.id === p.achievedGoals[p.achievedGoals.length - 1]
                  )
                : null;
            const portfolioValue = p.netWorth - p.money;

            return (
              <div
                key={p.id}
                className={`gameover-player ${rank === 0 ? "winner" : ""}`}
              >
                <div className="gameover-rank">#{rank + 1}</div>
                <div
                  className="gameover-player-name"
                  style={{ color: p.color }}
                >
                  {p.playerName}
                </div>
                <div className="gameover-player-stats">
                  <span>Net Worth: ${Math.round(p.netWorth).toLocaleString()}</span>
                  <span>Cash: ${Math.round(p.money).toLocaleString()}</span>
                  <span>Portfolio: ${Math.round(portfolioValue).toLocaleString()}</span>
                  <span>
                    {goalsAchieved} goal{goalsAchieved !== 1 ? "s" : ""} achieved
                  </span>
                  {lastGoal && (
                    <span>
                      Last: {lastGoal.emoji} {lastGoal.name}
                    </span>
                  )}
                  {p.isBankrupt && <span className="gameover-bankrupt">BANKRUPT</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="gameover-tip">
          <strong>Real-world takeaway:</strong> The winner didn't just save —
          they invested consistently and let compound growth do the heavy lifting.
          That's the core lesson of this game.
        </div>

        <button
          className="gameover-btn"
          onClick={() =>
            initGame(players.length, players.map((p) => p.playerName))
          }
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
