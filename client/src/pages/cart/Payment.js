import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil";

import "../../css/Payment.css";

function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

// Luhn check basic card validity
function luhnCheck(numStr) {
  const digits = onlyDigits(numStr);
  if (digits.length < 12) return false;

  let sum = 0;
  let dbl = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function isValidExpiry(mmYY) {
  const s = String(mmYY || "").trim();

  // MM/YY or MMYY
  const cleaned = s.includes("/") ? s : `${s.slice(0, 2)}/${s.slice(2, 4)}`;
  const match = cleaned.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const mm = Number(match[1]);
  const yy = Number(match[2]);

  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const currentYY = Number(String(now.getFullYear()).slice(-2));
  const currentMM = now.getMonth() + 1;

  if (yy < currentYY) return false;
  if (yy === currentYY && mm < currentMM) return false;

  return true;
}

function cardType(cardNumber) {
  const n = onlyDigits(cardNumber);

  // Very simple patterns
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return "MasterCard";
  if (/^4/.test(n)) return "Visa";
  if (/^3[47]/.test(n)) return "AmEx";
  return "Card";
}

const Payment = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [method, setMethod] = useState("card"); // card
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/YY
  const [cvv, setCvv] = useState("");
  const [billingZip, setBillingZip] = useState("");

  //Popup 
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [nextRoute, setNextRoute] = useState("");

  const openPopup = (type, msg, routeAfterOk = "") => {
    setMessageType(type);
    setMessage(msg);
    setNextRoute(routeAfterOk);
  };

  const handleOk = () => {
    const route = nextRoute;
    setMessage("");
    setMessageType("");
    setNextRoute("");
    if (route) navigate(route, { replace: true });
  };

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const res = await AuthFetch("/cart");

        if (!res) {
          openPopup("error", "Could not load cart. Please try again.");
          return;
        }

        if (res.status === 401) {
          openPopup("error", "Session expired. Please login again.", "/login");
          return;
        }

        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data.items) ? data.items : [];
        setCartItems(items);

        // if cart empty, go back
        if (items.length === 0) {
          navigate("/cart", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item?.game?.price) || 0;
      const qty = Number(item?.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }, [cartItems]);

  const errors = useMemo(() => {
    const errs = {};

    if (method === "card") {
      const digits = onlyDigits(cardNumber);
      const type = cardType(digits);

      if (!nameOnCard.trim()) errs.nameOnCard = "Name is required";

      // MasterCard/Visa usually 16, AmEx 15
      if (type === "MasterCard" && digits.length !== 16) {
        errs.cardNumber = "MasterCard must be 16 digits";
      } else if (type !== "AmEx" && digits.length !== 16) {
        errs.cardNumber = "Card number must be 16 digits";
      } else if (type === "AmEx" && digits.length !== 15) {
        errs.cardNumber = "AmEx must be 15 digits";
      }

      if (!luhnCheck(digits)) {
        errs.cardNumber = "Card number is invalid";
      }

      if (!isValidExpiry(expiry)) errs.expiry = "Expiry must be valid (MM/YY)";

      const cvvDigits = onlyDigits(cvv);
      const cvvLenOk = type === "AmEx" ? cvvDigits.length === 4 : cvvDigits.length === 3;
      if (!cvvLenOk) errs.cvv = type === "AmEx" ? "CVV must be 4 digits" : "CVV must be 3 digits";

      if (billingZip && onlyDigits(billingZip).length < 4) {
        errs.billingZip = "ZIP/Postal looks too short";
      }
    }

    return errs;
  }, [method, nameOnCard, cardNumber, expiry, cvv, billingZip]);

  const canPay = method !== "card" ? false : Object.keys(errors).length === 0;

  const proceed = async () => {
    if (!canPay || paying) return;

    try {
      setPaying(true);

      const res = await AuthFetch("/cart/checkout", { method: "POST" });

      if (!res) {
        openPopup("error", "Payment failed. Please try again.");
        return;
      }

      if (res.status === 401) {
        openPopup("error", "Session expired. Please login again.", "/login");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openPopup("error", data.message || "Payment failed");
        return;
      }

      
      openPopup("success", "Payment successful! Purchase completed.", "/profile");
    } catch {
      openPopup("error", "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="pay-page">
        <div className="pay-wrap">
          <h1 className="pay-title">Checkout</h1>
          <p className="pay-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const typeLabel = cardType(cardNumber);

  return (
    <div className="pay-page">
      {/* Popup */}
      {message && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${messageType}`}>
            <h3>{messageType === "success" ? "Success" : "Error"}</h3>
            <p>{message}</p>
            <button type="button" onClick={handleOk}>OK</button>
          </div>
        </div>
      )}

      <div className="pay-wrap">
        <h1 className="pay-title">Checkout</h1>

        <div className="pay-grid">

          {/* LEFT: Payment form */}
          <div className="pay-card">
            <div className="pay-section-title">Payment Method</div>

            <div className="pay-methods">
              <button
                type="button"
                className={`pay-method ${method === "card" ? "active" : ""}`}
                onClick={() => setMethod("card")}
              >
                Card
              </button>

              <button
                type="button"
                className={`pay-method disabled`}
                onClick={() => { }}
                title="Coming soon"
              >
                PayPal (soon)
              </button>
            </div>

            <div className="pay-form">
              <label className="pay-label">
                Name on card
                <input
                  className={`pay-input ${errors.nameOnCard ? "invalid" : ""}`}
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value)}
                  placeholder="e.g. John Doe"
                />
                {errors.nameOnCard && <div className="pay-error">{errors.nameOnCard}</div>}
              </label>

              <label className="pay-label">
                Card number <span className="pay-hint">({typeLabel})</span>
                <input
                  className={`pay-input ${errors.cardNumber ? "invalid" : ""}`}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                />
                {errors.cardNumber && <div className="pay-error">{errors.cardNumber}</div>}
              </label>

              <div className="pay-row">
                <label className="pay-label">
                  Expiry (MM/YY)
                  <input
                    className={`pay-input ${errors.expiry ? "invalid" : ""}`}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="08/29"
                    inputMode="numeric"
                  />
                  {errors.expiry && <div className="pay-error">{errors.expiry}</div>}
                </label>

                <label className="pay-label">
                  CVV
                  <input
                    className={`pay-input ${errors.cvv ? "invalid" : ""}`}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder={typeLabel === "AmEx" ? "1234" : "123"}
                    inputMode="numeric"
                  />
                  {errors.cvv && <div className="pay-error">{errors.cvv}</div>}
                </label>
              </div>

              <label className="pay-label">
                Billing ZIP (optional)
                <input
                  className={`pay-input ${errors.billingZip ? "invalid" : ""}`}
                  value={billingZip}
                  onChange={(e) => setBillingZip(e.target.value)}
                  placeholder="e.g. 10001"
                  inputMode="numeric"
                />
                {errors.billingZip && <div className="pay-error">{errors.billingZip}</div>}
              </label>

              <button
                type="button"
                className="pay-btn"
                disabled={!canPay || paying}
                onClick={proceed}
              >
                {paying ? "Processing..." : "Proceed & Pay"}
              </button>

              <button
                type="button"
                className="pay-btn ghost"
                onClick={() => navigate("/cart")}
                disabled={paying}
              >
                Back to cart
              </button>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="pay-summary">
            <div className="pay-section-title">Order Summary</div>

            <div className="pay-items">
              {cartItems.map((item) => {
                const g = item?.game;
                const coverSrc = MediaUtil.toAbsoluteMediaUrl(
                  g?.coverMedia || g?.imageUrl
                );

                return (
                  <div key={g?._id} className="pay-item">
                    <div className="pay-item-left">
                      <div className="pay-thumb">
                        {coverSrc ? (
                          <img
                            src={coverSrc}
                            alt={g?.title}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : null}
                      </div>

                      <div>
                        <div className="pay-item-title">{g?.title}</div>
                        <div className="pay-muted">
                          Qty: {item?.quantity} • $
                          {Number(g?.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pay-total">
              <div className="pay-muted">Total</div>
              <div className="pay-total-value">${total.toFixed(2)}</div>
            </div>

            <div className="pay-note">
              This is a demo payment screen. No real payment is processed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
