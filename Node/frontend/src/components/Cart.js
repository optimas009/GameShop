import "./CSS/Cart.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";

const Cart = () => {
  const [items, setItems] = useState([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);
  const navigate = useNavigate();

  // ✅ Load cart once on mount (best practice: logic inside useEffect)
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoadingCart(true);

        const res = await AuthFetch("/cart");
        if (!res) return;
        if (res.status === 401) return; // AuthFetch already triggers session-expired

        const data = await res.json().catch(() => ({}));
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        alert("Failed to load cart");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  // ✅ Click action (keep outside useEffect)
  const removeFromCart = async (gameId) => {
    try {
      const res = await AuthFetch(`/cart/remove/${gameId}`, { method: "DELETE" });
      if (!res) return;
      if (res.status === 401) return;

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Failed to remove");
        return;
      }

      // ✅ update UI
      setItems((prev) => prev.filter((g) => g._id !== gameId));
    } catch {
      alert("Failed to remove");
    }
  };

  const total = items.reduce((sum, g) => sum + (Number(g.price) || 0), 0);

  // ✅ Click action (keep outside useEffect)
  const checkout = async () => {
    try {
      setLoadingCheckout(true);

      const res = await AuthFetch("/cart/checkout", { method: "POST" });
      if (!res) return;
      if (res.status === 401) return;

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Checkout failed");
        return;
      }

      alert(data.message || "Purchase successful!");
      setItems([]); // ✅ clear UI
      // navigate("/profile"); // optional: go to profile/library after purchase
    } catch {
      alert("Checkout failed");
    } finally {
      setLoadingCheckout(false);
    }
  };

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
              {items.map((g) => (
                <div key={g._id} className="cart-card">
                  <div className="cart-media">
                    {g.imageUrl ? (
                      <img className="cart-img" src={g.imageUrl} alt={g.title} />
                    ) : (
                      <div className="cart-img-placeholder">No image</div>
                    )}
                  </div>

                  <div className="cart-info">
                    <h3 className="cart-game-title">{g.title}</h3>
                    <p>
                      <b>Price:</b> ${g.price}
                    </p>
                    <p className="cart-muted">
                      {g.platform || "N/A"} • {g.genre || "N/A"}
                    </p>

                    <button
                      className="cart-remove"
                      type="button"
                      onClick={() => removeFromCart(g._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div>
                <div className="cart-total-label">Total</div>
                <div className="cart-total">${total.toFixed(2)}</div>
              </div>

              <button
                className="cart-checkout"
                type="button"
                onClick={checkout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? "Processing..." : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
