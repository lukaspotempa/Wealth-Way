import { useGameStore } from "../../store/gameStore";
import { LIFE_GOALS } from "../../data/goals";
import "./GoalModal.css";

/**
 * Celebratory modal shown when a player achieves a life goal.
 * Displays the achievement, a real-world tip, and a preview of the next goal.
 */
export default function GoalModal() {
  const celebratedGoal = useGameStore((s) => s.celebratedGoal);
  const dismissGoalCelebration = useGameStore((s) => s.dismissGoalCelebration);
  const players = useGameStore((s) => s.players);

  if (!celebratedGoal) return null;

  const player = players.find((p) => p.id === celebratedGoal.playerId);
  const goal = celebratedGoal.goal;
  const goalIndex = LIFE_GOALS.indexOf(goal);
  const nextGoal = goalIndex >= 0 ? LIFE_GOALS[goalIndex + 1] : undefined;

  return (
    <div className="goal-overlay">
      <div className="goal-card">
        <div className="goal-emoji-big">{goal.emoji}</div>
        <div className="goal-achieved-label">Goal Achieved!</div>
        <h2 className="goal-name">{goal.name}</h2>
        {player && (
          <div className="goal-player-name" style={{ color: player.color }}>
            {player.playerName}
          </div>
        )}
        <p className="goal-celebration">{goal.celebrationMessage}</p>

        <div className="goal-tip">
          <span className="goal-tip-icon">💡</span>
          <p>{goal.realWorldTip}</p>
        </div>

        {nextGoal ? (
          <div className="goal-next">
            <div className="goal-next-label">Next Goal</div>
            <div className="goal-next-content">
              <span className="goal-next-emoji">{nextGoal.emoji}</span>
              <div>
                <div className="goal-next-name">{nextGoal.name}</div>
                <div className="goal-next-target">
                  ${nextGoal.targetNetWorth.toLocaleString()} net worth
                </div>
                <div className="goal-next-desc">{nextGoal.description}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="goal-final">
            You've achieved all goals! True financial wisdom! 🏆
          </div>
        )}

        <button className="goal-btn" onClick={dismissGoalCelebration}>
          {nextGoal ? `Let's chase the ${nextGoal.name}!` : "I'm a legend! 🏆"}
        </button>
      </div>
    </div>
  );
}
