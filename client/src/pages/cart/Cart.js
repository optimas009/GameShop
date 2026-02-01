import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil"; 

import "../../css/Cart.css";

const Cart = () => {
  const [items, setItems] = useState([]); 
  const [loadingCart, setLoadingCart] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoadingCart(true);

        const res = await AuthFetch("/cart");
        if (!res) return;
        if (res.status === 401) return;

        const data = await res.json().catch(() => ({}));
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        alert("Failed to load cart");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  const applyItemsFromResponse = async (res) => {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Cart update failed");
      return;
    }

    setItems(Array.isArray(data.items) ? data.items : []);
  };

  const removeFromCart = async (gameId) => {
    try {
      const res = await AuthFetch(`/cart/remove/${gameId}`, { method: "DELETE" });
      if (!res || res.status === 401) return;
      await applyItemsFromResponse(res);
    } catch {
      alert("Failed to remove");
    }
  };

  const incQty = async (gameId) => {
    try {
      const res = await AuthFetch(`/cart/add/${gameId}`, { method: "POST" });
      if (!res || res.status === 401) return;
      await applyItemsFromResponse(res);
    } catch {
      alert("Failed to increase quantity");
    }
  };

  const decQty = async (gameId, currentQty) => {
    try {
      const nextQty = Number(currentQty) - 1;

      const res = await AuthFetch(`/cart/update/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: nextQty }),
      });
      if (!res || res.status === 401) return;
      await applyItemsFromResponse(res);
    } catch {
      alert("Failed to decrease quantity");
    }
  };

  const setQty = async (gameId, value) => {
    const qty = Number(value);
    if (Number.isNaN(qty)) return;

    try {
      const res = await AuthFetch(`/cart/update/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      if (!res || res.status === 401) return;
      await applyItemsFromResponse(res);
    } catch {
      alert("Failed to update quantity");
    }
  };

  const total = items.reduce((sum, item) => {
    const price = Number(item?.game?.price) || 0;
    const qty = Number(item?.quantity) || 0;
    return sum + price * qty;
  }, 0);

  if (loadingCart) {
    return (
      <div className="cart-page">
        <div className="cart-wrap">
          <h1 className="cart-title">Your Cart</h1>
          <p className="cart-empty">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-wrap">
        <h1 className="cart-title">Your Cart</h1>

        {items.length === 0 ? (
          <p className="cart-empty">
            Cart is empty.{" "}
            <span className="cart-link" onClick={() => navigate("/games")}>
              Browse games
            </span>
          </p>
        ) : (
          <>
            <div className="cart-grid">
              {items.map((item) => {
                const g = item.game;
                const qty = item.quantity;

                const coverSrc = MediaUtil.toAbsoluteMediaUrl(
                  g?.coverMedia || g?.imageUrl
                );

                return (
                  <div key={g._id} className="cart-card">
                    <div className="cart-media">
                      {coverSrc ? (
                        <img
                          className="cart-img"
                          src={coverSrc}
                          alt={g.title}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="cart-img-placeholder">No image</div>
                      )}
                    </div>

                    <div className="cart-main">
                      <div className="cart-left">
                        <h3 className="cart-game-title">{g.title}</h3>

                        <p className="cart-price">
                          <b>Price:</b> ${g.price}
                        </p>

                        <p className="cart-line">
                          <b>Line Total:</b>{" "}
                          ${(Number(g.price || 0) * Number(qty || 0)).toFixed(2)}
                        </p>

                        <p className="cart-muted">
                          {g.platform || "N/A"} • {g.genre || "N/A"}
                        </p>
                      </div>

                      <div className="cart-right">
                        <div className="cart-qty">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => decQty(g._id, qty)}
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min="1"
                            className="qty-input"
                            value={qty}
                            onChange={(e) => setQty(g._id, e.target.value)}
                          />

                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => incQty(g._id)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="cart-remove"
                          type="button"
                          onClick={() => removeFromCart(g._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary">
              <div>
                <div className="cart-total-label">Total</div>
                <div className="cart-total">${total.toFixed(2)}</div>
              </div>

              <button
                className="cart-checkout"
                type="button"
                onClick={() => navigate("/payment")}
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
