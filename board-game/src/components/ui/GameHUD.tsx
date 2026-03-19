import { useState } from "react";
import { useGameStore, computeNetWorth } from "../../store/gameStore";
import { LIFE_GOALS } from "../../data/goals";
import type { Player, InvestmentOption, TimelineEvent } from "../../types/game";
import "./GameHUD.css";

const CHART_COLORS = ["#E53935", "#1E88E5", "#43A047", "#FDD835"];

export default function GameHUD() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const round = useGameStore((s) => s.round);
  const turnPhase = useGameStore((s) => s.turnPhase);
  const diceValue = useGameStore((s) => s.diceValue);
  const rollDice = useGameStore((s) => s.rollDice);
  const gameLog = useGameStore((s) => s.gameLog);
  const investments = useGameStore((s) => s.investments);
  const currentScenario = useGameStore((s) => s.currentScenario);

  const [showPortfolioChart, setShowPortfolioChart] = useState(false);

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
        <div className="hud-current-player" style={{ borderColor: currentPlayer.color }}>
          <span className="hud-player-dot" style={{ backgroundColor: currentPlayer.color }} />
          {currentPlayer.playerName}'s Turn
        </div>
        <div className="hud-money">${currentPlayer.money.toLocaleString()}</div>
      </div>

      {/* Goal progress for current player */}
      {currentGoal ? (
        <div className="hud-goal">
          <div className="hud-goal-header">
            <span>{currentGoal.emoji} {currentGoal.name}</span>
            <span className="hud-net-worth">
              Net Worth: ${Math.round(netWorth).toLocaleString()}
            </span>
          </div>
          <div className="hud-goal-bar-bg">
            <div
              className="hud-goal-bar-fill"
              style={{ width: `${Math.min(100, (netWorth / currentGoal.targetNetWorth) * 100)}%` }}
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

      {/* Scenario timeline strip */}
      {currentScenario && (
        <TimelineStrip scenario={currentScenario} currentRound={round} />
      )}

      {/* Dice / action area */}
      <div className="hud-action-area">
        {canRoll && (
          <button className="hud-roll-btn" onClick={rollDice}>
            🎲 Roll Dice
          </button>
        )}
        {turnPhase === "rolling" && <div className="hud-dice-info">Rolling...</div>}
        {turnPhase === "moving" && diceValue !== null && (
          <div className="hud-dice-info">Rolled a {diceValue}! Moving...</div>
        )}
        {turnPhase === "event" && (
          <div className="hud-dice-info">Resolving event...</div>
        )}
      </div>

      {/* Player scoreboard */}
      <div className="hud-scoreboard">
        <div className="hud-scoreboard-header">
          <span>Players</span>
          <button
            className="hud-chart-btn"
            onClick={() => setShowPortfolioChart(true)}
            title="View portfolio performance chart"
          >
            📊
          </button>
        </div>
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
                    <span className="hud-player-money">${p.money.toLocaleString()}</span>
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

      {/* Portfolio performance chart modal */}
      {showPortfolioChart && (
        <PortfolioChartModal
          players={players}
          investments={investments}
          currentRound={round}
          scenarioEvents={currentScenario?.events ?? []}
          onClose={() => setShowPortfolioChart(false)}
        />
      )}
    </div>
  );
}

// ── Timeline Strip ────────────────────────────────────────────────────────

function TimelineStrip({
  scenario,
  currentRound,
}: {
  scenario: NonNullable<ReturnType<typeof useGameStore.getState>["currentScenario"]>;
  currentRound: number;
}) {
  const events = scenario.events;
  const maxRound = Math.max(...events.map((e) => e.round), currentRound + 2);

  return (
    <div className="hud-timeline">
      <div className="hud-timeline-label">
        {scenario.emoji} {scenario.name}
      </div>
      <div className="hud-timeline-track">
        {events.map((event) => {
          const isPast = event.round < currentRound;
          const isCurrent = event.round === currentRound;
          const progress = (event.round / maxRound) * 100;

          return (
            <div
              key={event.id}
              className={`hud-timeline-event ${isPast ? "past" : ""} ${isCurrent ? "current" : ""} ${event.severity}`}
              style={{ left: `${progress}%` }}
              title={isPast || isCurrent ? `R${event.round}: ${event.title}` : `R${event.round}: ???`}
            >
              <div className="hud-timeline-dot" />
              <div className="hud-timeline-round">R{event.round}</div>
            </div>
          );
        })}

        {/* Current round marker */}
        <div
          className="hud-timeline-now"
          style={{ left: `${(currentRound / maxRound) * 100}%` }}
        />

        <div className="hud-timeline-bar" />
      </div>
    </div>
  );
}

// ── Portfolio Performance Chart ───────────────────────────────────────────

function PortfolioChartModal({
  players,
  investments,
  scenarioEvents,
  onClose,
}: {
  players: Player[];
  investments: InvestmentOption[];
  currentRound: number;
  scenarioEvents: TimelineEvent[];
  onClose: () => void;
}) {
  const W = 560;
  const H = 220;
  const PAD_LEFT = 56;
  const PAD_RIGHT = 16;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;

  const activePlayers = players.filter((p) => !p.isBankrupt || p.netWorthHistory.length > 1);

  // Find global min/max across all net worth histories
  const allValues = activePlayers.flatMap((p) => p.netWorthHistory);
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues, 1000);
  const range = maxV - minV || 1;

  const maxLen = Math.max(...activePlayers.map((p) => p.netWorthHistory.length), 2);

  const toX = (i: number) =>
    PAD_LEFT + (i / Math.max(maxLen - 1, 1)) * (W - PAD_LEFT - PAD_RIGHT);
  const toY = (v: number) =>
    PAD_TOP + (1 - (v - minV) / range) * (H - PAD_TOP - PAD_BOTTOM);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD_TOP + (1 - f) * (H - PAD_TOP - PAD_BOTTOM),
    label: `$${Math.round(minV + f * range).toLocaleString()}`,
  }));

  return (
    <div className="portfolio-modal-overlay" onClick={onClose}>
      <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portfolio-modal-header">
          <h3 className="portfolio-modal-title">📈 Portfolio Performance</h3>
          <button className="portfolio-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="portfolio-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="portfolio-chart-svg">
            {/* Grid lines + Y labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={PAD_LEFT}
                  y1={tick.y}
                  x2={W - PAD_RIGHT}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={PAD_LEFT - 6}
                  y={tick.y + 4}
                  fontSize="9"
                  fill="rgba(255,255,255,0.3)"
                  textAnchor="end"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* X-axis round labels */}
            {Array.from({ length: maxLen }, (_, i) => (
              <text
                key={i}
                x={toX(i)}
                y={H - 4}
                fontSize="8"
                fill="rgba(255,255,255,0.25)"
                textAnchor="middle"
              >
                R{i}
              </text>
            ))}

            {/* Scenario event markers */}
            {scenarioEvents
              .filter((e) => e.round < maxLen)
              .map((e) => {
                const x = toX(e.round);
                return (
                  <g key={e.id}>
                    <line
                      x1={x}
                      y1={PAD_TOP}
                      x2={x}
                      y2={H - PAD_BOTTOM}
                      stroke={e.severity === "major" ? "rgba(244,67,54,0.3)" : "rgba(255,152,0,0.25)"}
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    />
                    <text
                      x={x}
                      y={PAD_TOP - 2}
                      fontSize="8"
                      fill={e.severity === "major" ? "rgba(244,67,54,0.7)" : "rgba(255,152,0,0.7)"}
                      textAnchor="middle"
                    >
                      ⚡
                    </text>
                  </g>
                );
              })}

            {/* Player lines */}
            {activePlayers.map((player, pidx) => {
              const color = CHART_COLORS[pidx % CHART_COLORS.length];
              const pts = player.netWorthHistory
                .map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
                .join(" ");
              const lastX = toX(player.netWorthHistory.length - 1);
              const lastY = toY(player.netWorthHistory[player.netWorthHistory.length - 1]);

              return (
                <g key={player.id}>
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.9"
                  />
                  <circle cx={lastX} cy={lastY} r="4" fill={color} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="portfolio-legend">
          {activePlayers.map((p, idx) => {
            const nw = computeNetWorth(p, investments);
            return (
              <div key={p.id} className="portfolio-legend-item">
                <span
                  className="portfolio-legend-dot"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="portfolio-legend-name">{p.playerName}</span>
                <span className="portfolio-legend-nw">
                  ${Math.round(nw).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        <p className="portfolio-chart-note">
          ⚡ = Scheduled scenario event &nbsp;|&nbsp; Net worth includes cash + portfolio at current prices
        </p>
      </div>
    </div>
  );
}
