import { useGameStore } from "../../store/gameStore";
import type { InvestmentOption, TimelineEvent } from "../../types/game";
import "./MarketFlash.css";

const CHART_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0", "#00BCD4"];

const SEVERITY_LABEL: Record<TimelineEvent["severity"], string> = {
  minor: "Minor Event",
  moderate: "Market Shift",
  major: "MAJOR EVENT",
};

/**
 * Full-screen "breaking news" modal shown when a timeline event fires.
 *
 * Shows:
 *  - Newspaper-style headline
 *  - Multi-line price chart of all affected investments (before → after impact)
 *  - Price impact summary per investment
 *  - Educational learning tip
 */
export default function MarketFlash() {
  const activeTimelineEvent = useGameStore((s) => s.activeTimelineEvent);
  const dismissTimelineEvent = useGameStore((s) => s.dismissTimelineEvent);
  const investments = useGameStore((s) => s.investments);

  if (!activeTimelineEvent) return null;

  const event = activeTimelineEvent;
  const affected = investments.filter((inv) =>
    event.affectedInvestmentIds.includes(inv.id)
  );

  const impactPct = Math.round((event.priceMultiplier - 1) * 100);
  const isPositive = impactPct >= 0;

  return (
    <div className="flash-overlay">
      <div className="flash-card">
        {/* Header */}
        <div className={`flash-severity severity-${event.severity}`}>
          📡 {SEVERITY_LABEL[event.severity]}
        </div>

        <h2 className="flash-title">{event.title}</h2>
        <p className="flash-headline">"{event.headline}"</p>

        {/* Multi-line price chart */}
        <div className="flash-chart-container">
          <div className="flash-chart-label">Price History — Affected Assets</div>
          <MultiLineChart investments={affected} />
        </div>

        {/* Impact summary */}
        <div className="flash-impact-grid">
          {affected.map((inv, idx) => {
            const history = inv.priceHistory;
            const before = history.length >= 2 ? history[history.length - 2] : history[0];
            const after = history[history.length - 1];
            const pct = ((after - before) / before) * 100;
            return (
              <div key={inv.id} className="flash-impact-item">
                <span
                  className="flash-impact-dot"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="flash-impact-ticker">{inv.ticker}</span>
                <span className={`flash-impact-pct ${pct >= 0 ? "positive" : "negative"}`}>
                  {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                </span>
                <span className="flash-impact-price">${after.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <p className="flash-description">{event.description}</p>

        {/* Learning tip */}
        <div className="flash-tip">
          <span className="flash-tip-icon">💡</span>
          <p>{event.learningTip}</p>
        </div>

        <button className="flash-btn" onClick={dismissTimelineEvent}>
          {isPositive
            ? "Ride the wave — continue →"
            : "Stay calm, stay invested — continue →"}
        </button>
      </div>
    </div>
  );
}

// ── Multi-line SVG Chart ───────────────────────────────────────────────────

function MultiLineChart({ investments }: { investments: InvestmentOption[] }) {
  if (investments.length === 0) return null;

  const W = 540;
  const H = 160;
  const PAD_LEFT = 48;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 24;

  // Global min/max across all histories
  const allPrices = investments.flatMap((inv) => inv.priceHistory);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;

  const maxLen = Math.max(...investments.map((inv) => inv.priceHistory.length));

  const toX = (i: number) =>
    PAD_LEFT + (i / Math.max(maxLen - 1, 1)) * (W - PAD_LEFT - PAD_RIGHT);
  const toY = (price: number) =>
    PAD_TOP + (1 - (price - minP) / range) * (H - PAD_TOP - PAD_BOTTOM);

  // Y-axis labels (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({
    y: PAD_TOP + (1 - f) * (H - PAD_TOP - PAD_BOTTOM),
    label: `$${Math.round(minP + f * range)}`,
  }));

  // "NOW" x position (last data point of the longest series)
  const nowX = toX(maxLen - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="flash-chart-svg">
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={PAD_LEFT}
            y1={tick.y}
            x2={W - PAD_RIGHT}
            y2={tick.y}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
          <text
            x={PAD_LEFT - 6}
            y={tick.y + 4}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
            textAnchor="end"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* "NOW" dashed vertical line */}
      <line
        x1={nowX}
        y1={PAD_TOP}
        x2={nowX}
        y2={H - PAD_BOTTOM}
        stroke="rgba(255,215,0,0.6)"
        strokeWidth="1.5"
        strokeDasharray="4,3"
      />
      <text
        x={nowX}
        y={H - PAD_BOTTOM + 12}
        fontSize="8"
        fill="rgba(255,215,0,0.7)"
        textAnchor="middle"
      >
        NOW
      </text>

      {/* One line per investment */}
      {investments.map((inv, idx) => {
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        const pts = inv.priceHistory
          .map((price, i) => `${toX(i).toFixed(1)},${toY(price).toFixed(1)}`)
          .join(" ");

        const lastX = toX(inv.priceHistory.length - 1);
        const lastY = toY(inv.priceHistory[inv.priceHistory.length - 1]);

        return (
          <g key={inv.id}>
            <polyline
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Terminal dot */}
            <circle cx={lastX} cy={lastY} r="4" fill={color} />
            {/* Ticker label next to terminal dot */}
            <text
              x={lastX + 6}
              y={lastY + 4}
              fontSize="9"
              fill={color}
              fontWeight="700"
            >
              {inv.ticker}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
