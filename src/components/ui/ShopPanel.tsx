import { useGameStore } from "../../store/gameStore";
import { SHOP_ITEMS } from "../../data/events";
import "./ShopPanel.css";

/**
 * Shop panel where the current player can purchase power-ups.
 * Power-ups provide strategic advantages without harming other players.
 */
export default function ShopPanel() {
  const currentPlayer = useGameStore((s) => s.getCurrentPlayer());
  const buyPowerUp = useGameStore((s) => s.buyPowerUp);

  return (
    <div className="shop-panel">
      <div className="shop-balance">
        Your balance: <strong>${currentPlayer.money.toLocaleString()}</strong>
      </div>

      <div className="shop-items">
        {SHOP_ITEMS.map((item) => {
          const canAfford = currentPlayer.money >= item.cost;
          const alreadyOwned = currentPlayer.powerUps.some(
            (p) => p.type === item.powerUpType
          );

          return (
            <div
              key={item.id}
              className={`shop-item ${!canAfford ? "unaffordable" : ""} ${alreadyOwned ? "owned" : ""}`}
            >
              <div className="shop-item-header">
                <span className="shop-item-name">{item.name}</span>
                <span className="shop-item-cost">${item.cost}</span>
              </div>
              <p className="shop-item-desc">{item.description}</p>
              <button
                className="modal-btn primary shop-buy-btn"
                disabled={!canAfford || alreadyOwned}
                onClick={() => buyPowerUp(currentPlayer.id, item.id)}
              >
                {alreadyOwned ? "Already Owned" : canAfford ? "Buy" : "Can't Afford"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
