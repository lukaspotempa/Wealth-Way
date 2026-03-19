import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { LIFE_GOALS } from "../../data/goals";
import { SCENARIOS, FREE_PLAY_ID } from "../../data/scenarios";
import { RISK_PROFILES } from "../../data/riskProfiles";
import type { RiskProfileId } from "../../types/game";
import "./GameSetup.css";

const DEFAULT_NAMES = ["Alex", "Sam", "Jordan", "Riley"];
const PLAYER_COLORS_PREVIEW = ["#E53935", "#1E88E5", "#43A047", "#FDD835"];

const ALL_SCENARIOS = [
  ...SCENARIOS,
  {
    id: FREE_PLAY_ID,
    name: "Free Play",
    emoji: "🎲",
    era: "No era",
    tagline: "No scripted timeline — pure dice luck",
    description:
      "No scheduled events. Tile-triggered market events are fully random and at full intensity. " +
      "Great for learning the basics without a fixed narrative.",
    events: [],
    baseSentiment: "neutral" as const,
  },
];

export default function GameSetup() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES.slice(0, 2));
  const [riskProfileIds, setRiskProfileIds] = useState<RiskProfileId[]>(["balanced", "balanced"]);

  const initGame = useGameStore((s) => s.initGame);
  const players = useGameStore((s) => s.players);

  if (players.length > 0) return null;

  const firstGoal = LIFE_GOALS[0];
  const selectedScenario = ALL_SCENARIOS.find((s) => s.id === selectedScenarioId)!;

  const handleCountChange = (n: number) => {
    setPlayerCount(n);
    setPlayerNames(Array.from({ length: n }, (_, i) => playerNames[i] ?? DEFAULT_NAMES[i]));
    setRiskProfileIds(Array.from({ length: n }, (_, i) => riskProfileIds[i] ?? "balanced"));
  };

  const handleNameChange = (i: number, value: string) => {
    setPlayerNames((prev) => prev.map((name, idx) => (idx === i ? value : name)));
  };

  const handleProfileChange = (i: number, profileId: RiskProfileId) => {
    setRiskProfileIds((prev) => prev.map((p, idx) => (idx === i ? profileId : p)));
  };

  const handleStart = () => {
    initGame(playerCount, playerNames, riskProfileIds, selectedScenarioId);
  };

  // ── Step 1: Scenario Selection ─────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="setup-overlay">
        <div className="setup-card setup-card-wide">
          <div className="setup-logo">💹</div>
          <h1 className="setup-title">Wealth Manager Arena</h1>
          <p className="setup-subtitle">
            Choose your market era — this scripted history will unfold as you play.
          </p>

          <div className="setup-scenarios">
            {ALL_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                className={`setup-scenario-card ${selectedScenarioId === scenario.id ? "selected" : ""}`}
                onClick={() => setSelectedScenarioId(scenario.id)}
              >
                <div className="setup-scenario-emoji">{scenario.emoji}</div>
                <div className="setup-scenario-info">
                  <div className="setup-scenario-name">{scenario.name}</div>
                  <div className="setup-scenario-era">{scenario.era}</div>
                  <div className="setup-scenario-tagline">{scenario.tagline}</div>
                </div>
                {selectedScenarioId === scenario.id && (
                  <div className="setup-scenario-check">✓</div>
                )}
              </button>
            ))}
          </div>

          {selectedScenario && selectedScenarioId !== FREE_PLAY_ID && (
            <div className="setup-scenario-desc">
              <p>{selectedScenario.description}</p>
              <div className="setup-scenario-events">
                {selectedScenario.events.map((e) => (
                  <div key={e.id} className={`setup-event-pill severity-${e.severity}`}>
                    R{e.round} · {e.title}
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <button className="setup-start-btn" onClick={() => setStep(2)}>
            Next: Choose Players →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Players + Risk Profiles ────────────────────────────────────
  return (
    <div className="setup-overlay">
      <div className="setup-card setup-card-wide">
        <button className="setup-back-btn" onClick={() => setStep(1)}>
          ← {selectedScenario.emoji} {selectedScenario.name}
        </button>

        <h2 className="setup-step-title">Who's playing?</h2>
        <p className="setup-step-subtitle">
          Each player picks a starting portfolio. This is your first real investing decision.
        </p>

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

        <div className="setup-player-rows">
          {Array.from({ length: playerCount }, (_, i) => {
            const profile = RISK_PROFILES.find((p) => p.id === riskProfileIds[i])!;
            return (
              <div key={i} className="setup-player-row">
                <div className="setup-player-row-header">
                  <span
                    className="setup-player-color-dot"
                    style={{ backgroundColor: PLAYER_COLORS_PREVIEW[i] }}
                  />
                  <input
                    className="setup-name-input"
                    placeholder={`Player ${i + 1} name`}
                    value={playerNames[i] ?? ""}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    maxLength={20}
                  />
                </div>

                <div className="setup-profile-selector">
                  {RISK_PROFILES.map((rp) => (
                    <button
                      key={rp.id}
                      className={`setup-profile-btn ${riskProfileIds[i] === rp.id ? "active" : ""}`}
                      onClick={() => handleProfileChange(i, rp.id)}
                      title={rp.description}
                    >
                      <span className="setup-profile-emoji">{rp.emoji}</span>
                      <span className="setup-profile-name">{rp.name}</span>
                    </button>
                  ))}
                </div>

                <div className="setup-profile-desc">
                  <strong>{profile.emoji} {profile.name}</strong>: {profile.description}
                </div>
              </div>
            );
          })}
        </div>

        <button className="setup-start-btn" onClick={handleStart}>
          Start Game →
        </button>
      </div>
    </div>
  );
}
