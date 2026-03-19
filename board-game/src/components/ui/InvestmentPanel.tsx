import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import type { InvestmentCategory } from "../../types/game";
import "./InvestmentPanel.css";

interface InvestmentPanelProps {
  /** If true, only show sell functionality (used for negative event resolution) */
  sellOnly?: boolean;
}

const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  etf: "ETFs",
  bond: "Bonds",
  stock: "Stocks",
};

const QUANTITY_OPTIONS = [1, 5, 10];

/**
 * Investment market panel showing available investments categorized by type.
 * Each player can buy/sell from their own section.
 * Supports multi-quantity trading and shows unrealized P&L.
 */
export default function InvestmentPanel({ sellOnly = false }: InvestmentPanelProps) {
  const players = useGameStore((s) => s.players);
  const investments = useGameStore((s) => s.investments);
  const round = useGameStore((s) => s.round);
  const buyInvestment = useGameStore((s) => s.buyInvestment);
  const sellInvestment = useGameStore((s) => s.sellInvestment);

  const [activeCategory, setActiveCategory] = useState<InvestmentCategory>("etf");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<number>(players[0]?.id ?? 0);
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);

  // Determine which categories are unlocked
  const unlockedCategories: InvestmentCategory[] = ["etf"];
  if (round >= 2) unlockedCategories.push("bond");
  if (round >= 4) unlockedCategories.push("stock");

  const visibleInvestments = investments.filter(
    (inv) =>
      inv.category === activeCategory && inv.unlockRound <= round
  );

  const selectedInvestment = investments.find(
    (inv) => inv.id === selectedInvestmentId
  );

  const activePlayer = players.find((p) => p.id === activePlayerId);
  const activePlayers = players.filter((p) => !p.isBankrupt);

  const playerHolding = activePlayer?.holdings.find(
    (h) => h.investmentId === selectedInvestmentId
  );

  // Compute unrealized P&L for a holding
  const getUnrealizedPnL = (holdingInvestmentId: string) => {
    const inv = investments.find((i) => i.id === holdingInvestmentId);
    const holding = activePlayer?.holdings.find((h) => h.investmentId === holdingInvestmentId);
    if (!inv || !holding) return null;
    const pnl = (inv.currentPrice - holding.averageBuyPrice) * holding.quantity;
    const pnlPct = ((inv.currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice) * 100;
    return { pnl, pnlPct };
  };

  const tradeCost = selectedInvestment ? selectedInvestment.currentPrice * tradeQuantity : 0;
  const canBuy = activePlayer && selectedInvestment && activePlayer.money >= tradeCost;
  const canSell = playerHolding && playerHolding.quantity >= tradeQuantity;

  return (
    <div className="investment-panel">
      {/* Player selector tabs */}
      {!sellOnly && (
        <div className="inv-player-tabs">
          {activePlayers.map((p) => (
            <button
              key={p.id}
              className={`inv-player-tab ${p.id === activePlayerId ? "active" : ""}`}
              style={{
                borderColor: p.color,
                backgroundColor:
                  p.id === activePlayerId ? p.color + "33" : "transparent",
              }}
              onClick={() => setActivePlayerId(p.id)}
            >
              {p.playerName} — ${p.money.toLocaleString()}
            </button>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="inv-category-tabs">
        {unlockedCategories.map((cat) => (
          <button
            key={cat}
            className={`inv-cat-tab ${cat === activeCategory ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(cat);
              setSelectedInvestmentId(null);
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
        {round < 2 && (
          <span className="inv-locked">🔒 Bonds unlock in Round 3</span>
        )}
        {round >= 2 && round < 4 && (
          <span className="inv-locked">🔒 Stocks unlock in Round 5</span>
        )}
      </div>

      {/* Investment list */}
      <div className="inv-list">
        {visibleInvestments.map((inv) => {
          const holding = activePlayer?.holdings.find((h) => h.investmentId === inv.id);
          const pnlData = holding ? (() => {
            const pnl = (inv.currentPrice - holding.averageBuyPrice) * holding.quantity;
            const pnlPct = ((inv.currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice) * 100;
            return { pnl, pnlPct };
          })() : null;

          return (
            <div
              key={inv.id}
              className={`inv-item ${inv.id === selectedInvestmentId ? "selected" : ""}`}
              onClick={() => setSelectedInvestmentId(inv.id)}
            >
              <div className="inv-item-header">
                <span className="inv-ticker">{inv.ticker}</span>
                <span className="inv-name">{inv.name}</span>
              </div>
              <div className="inv-item-right">
                <div className="inv-item-price">
                  <span className="inv-price">${inv.currentPrice.toFixed(2)}</span>
                  <span
                    className={`inv-change ${inv.lastChange >= 0 ? "positive" : "negative"}`}
                  >
                    {inv.lastChange >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(inv.lastChange).toFixed(2)}%
                  </span>
                </div>
                {holding && pnlData && (
                  <div className={`inv-pnl-small ${pnlData.pnl >= 0 ? "positive" : "negative"}`}>
                    {pnlData.pnl >= 0 ? "+" : ""}${Math.round(pnlData.pnl).toLocaleString()} ({pnlData.pnlPct >= 0 ? "+" : ""}{pnlData.pnlPct.toFixed(1)}%)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail view for selected investment */}
      {selectedInvestment && (
        <div className="inv-detail">
          <div className="inv-detail-header">
            <h3>
              {selectedInvestment.ticker} — {selectedInvestment.name}
            </h3>
            <span className="inv-detail-price">
              ${selectedInvestment.currentPrice.toFixed(2)}
            </span>
          </div>

          {/* Simple price history chart */}
          <div className="inv-chart">
            <PriceChart history={selectedInvestment.priceHistory} />
          </div>

          {/* Holdings info with P&L */}
          {playerHolding && (() => {
            const pnlData = getUnrealizedPnL(selectedInvestment.id);
            return (
              <div className="inv-holding">
                <div className="inv-holding-row">
                  <span>You hold: <strong>{playerHolding.quantity} units</strong></span>
                  <span className="inv-holding-avg">avg buy: ${playerHolding.averageBuyPrice.toFixed(2)}</span>
                </div>
                {pnlData && (
                  <div className={`inv-holding-pnl ${pnlData.pnl >= 0 ? "positive" : "negative"}`}>
                    Unrealized P&L: {pnlData.pnl >= 0 ? "+" : ""}${Math.round(pnlData.pnl).toLocaleString()} ({pnlData.pnlPct >= 0 ? "+" : ""}{pnlData.pnlPct.toFixed(1)}%)
                  </div>
                )}
              </div>
            );
          })()}

          {/* Quantity selector */}
          {activePlayer && (
            <div className="inv-quantity-selector">
              <span className="inv-qty-label">Qty:</span>
              {QUANTITY_OPTIONS.map((q) => (
                <button
                  key={q}
                  className={`inv-qty-btn ${tradeQuantity === q ? "active" : ""}`}
                  onClick={() => setTradeQuantity(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Buy/Sell buttons */}
          {activePlayer && (
            <div className="inv-trade-actions">
              {!sellOnly && (
                <button
                  className="modal-btn primary"
                  disabled={!canBuy}
                  onClick={() => {
                    buyInvestment(activePlayer.id, selectedInvestment.id, tradeQuantity);
                  }}
                >
                  Buy {tradeQuantity} (${tradeCost.toFixed(2)})
                </button>
              )}
              {playerHolding && playerHolding.quantity > 0 && (
                <button
                  className="modal-btn secondary"
                  disabled={!canSell}
                  onClick={() => {
                    sellInvestment(
                      activePlayer.id,
                      selectedInvestment.id,
                      Math.min(tradeQuantity, playerHolding.quantity)
                    );
                  }}
                >
                  Sell {Math.min(tradeQuantity, playerHolding.quantity)} (${(selectedInvestment.currentPrice * Math.min(tradeQuantity, playerHolding.quantity)).toFixed(2)})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Simple SVG line chart for price history */
function PriceChart({ history }: { history: number[] }) {
  if (history.length < 2) {
    return <div className="inv-chart-empty">Not enough data yet</div>;
  }

  const width = 400;
  const height = 80;
  const padding = 4;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history
    .map((price, i) => {
      const x = padding + (i / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((price - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = history[history.length - 1] >= history[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="inv-chart-svg">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#4CAF50" : "#F44336"}
        strokeWidth="2"
      />
    </svg>
  );
}
