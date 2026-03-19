import { useGameStore } from "../../store/gameStore";
import InvestmentPanel from "./InvestmentPanel";
import ShopPanel from "./ShopPanel";
import "./EventModal.css";

/**
 * Renders the appropriate modal based on the current active event.
 * Acts as a dispatcher to specialized event panels.
 */
export default function EventModal() {
  const activeEvent = useGameStore((s) => s.activeEvent);
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  const dismissEvent = useGameStore((s) => s.dismissEvent);
  const currentPlayer = useGameStore((s) => s.getCurrentPlayer());
  const payNegativeEvent = useGameStore((s) => s.payNegativeEvent);
  const declareBankrupt = useGameStore((s) => s.declareBankrupt);

  if (!activeEvent) return null;

  const handleDismiss = () => {
    resolveEvent();
    dismissEvent();
  };

  switch (activeEvent.type) {
    case "investment":
      return (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>📈 Investment Market</h2>
              <span className="modal-subtitle">
                All players may buy or sell investments
              </span>
            </div>
            <InvestmentPanel />
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleDismiss}>
                Close Market
              </button>
            </div>
          </div>
        </div>
      );

    case "market-event":
      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📰 {activeEvent.event.title}</h2>
            </div>
            <p className="modal-description">
              {activeEvent.event.description}
            </p>
            <div className="modal-impact">
              {activeEvent.event.priceMultiplier >= 1 ? (
                <span className="impact-positive">
                  ▲ +{Math.round((activeEvent.event.priceMultiplier - 1) * 100)}% to affected investments
                </span>
              ) : (
                <span className="impact-negative">
                  ▼ {Math.round((activeEvent.event.priceMultiplier - 1) * 100)}% to affected investments
                </span>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleDismiss}>
                OK
              </button>
            </div>
          </div>
        </div>
      );

    case "income":
      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>💰 Income!</h2>
            </div>
            <p className="modal-description">
              {activeEvent.event.description}
            </p>
            <div className="modal-impact">
              <span className="impact-positive">
                +${activeEvent.event.amount}
              </span>
            </div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleDismiss}>
                Collect
              </button>
            </div>
          </div>
        </div>
      );

    case "negative-event": {
      const cost = activeEvent.event.cost;
      const canPay = currentPlayer.money >= cost;
      const totalPortfolioValue = currentPlayer.holdings.reduce(
        (sum, h) => sum + h.quantity * h.averageBuyPrice,
        0
      );
      const canSurvive = currentPlayer.money + totalPortfolioValue >= cost;

      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⚠️ Bad Luck!</h2>
            </div>
            <p className="modal-description">
              {activeEvent.event.description}
            </p>
            <div className="modal-impact">
              <span className="impact-negative">-${cost}</span>
            </div>
            <div className="modal-balance">
              Your balance: ${currentPlayer.money.toLocaleString()}
            </div>
            <div className="modal-actions">
              {canPay ? (
                <button
                  className="modal-btn primary"
                  onClick={() => {
                    payNegativeEvent(currentPlayer.id, cost);
                    dismissEvent();
                  }}
                >
                  Pay ${cost}
                </button>
              ) : canSurvive ? (
                <>
                  <p className="modal-warning">
                    Not enough cash! Sell investments to cover the cost.
                  </p>
                  <InvestmentPanel sellOnly />
                  <button
                    className="modal-btn primary"
                    onClick={() => {
                      // Check if they now have enough
                      const updated = useGameStore.getState().players.find(
                        (p) => p.id === currentPlayer.id
                      );
                      if (updated && updated.money >= cost) {
                        payNegativeEvent(currentPlayer.id, cost);
                        dismissEvent();
                      }
                    }}
                  >
                    Pay Now (${cost})
                  </button>
                </>
              ) : (
                <>
                  <p className="modal-warning">
                    You can't afford this! You must declare bankruptcy.
                  </p>
                  <button
                    className="modal-btn danger"
                    onClick={() => {
                      declareBankrupt(currentPlayer.id);
                      dismissEvent();
                    }}
                  >
                    Give Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "shop":
      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛒 Shop</h2>
              <span className="modal-subtitle">
                Buy power-ups to gain an advantage
              </span>
            </div>
            <ShopPanel />
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleDismiss}>
                Leave Shop
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
