import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil"; 

import { API_BASE_URL } from "../../services/AuthFetch";

import "../../css/GameDetails.css";

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  // role check
  const [isAdmin, setIsAdmin] = useState(false);

  
  const [qty, setQty] = useState(1);

  // Popup state 
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
    if (route) navigate(route);
  };

  const toEmbedUrl = (url) => {
    if (!url) return "";
    const m = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
    );
    return m ? `https://www.youtube.com/embed/${m[1]}` : "";
  };

  // Load game
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/games/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          openPopup("error", data.message || "Failed to fetch game", "/games");
          setLoading(false);
          return;
        }

        setGame(data);
      } catch {
        openPopup("error", "Something went wrong", "/games");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  //  Detect admin/user via /me 

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAdmin(false);
      return;
    }

    const loadMe = async () => {
      try {
        const res = await AuthFetch("/me", { skip401Handler: true });
        if (!res || res.status === 401) {
          setIsAdmin(false);
          return;
        }

        const me = await res.json().catch(() => ({}));
        setIsAdmin(me?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };

    loadMe();
  }, []);

  const setQtySafe = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return setQty(1);
    setQty(Math.max(1, n));
  };

  const incQty = () => setQty((p) => Math.max(1, Number(p || 1) + 1));
  const decQty = () => setQty((p) => Math.max(1, Number(p || 1) - 1));

  // Add to cart
  const addToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      openPopup("error", "Please login first to add to cart.", "/login");
      return;
    }

    const quantity = Math.max(1, Number(qty || 1));

    try {
      const res = await AuthFetch(`/cart/add/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res || res.status === 401) {
        openPopup("error", "Session expired. Please login again.", "/login");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openPopup("error", data.message || "Error adding to cart");
        return;
      }

      openPopup("success", `Added to cart (x${quantity})`);
      setQty(1);
    } catch {
      openPopup("error", "Failed to add to cart");
    }
  };

  //Admin action
  const goEdit = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      openPopup("error", "Please login as admin to edit.", "/adminlogin");
      return;
    }
    navigate(`/update/${id}`);
  };

  if (loading) {
    return (
      <div className="gd-page">
        <p className="gd-loading">Loading...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="gd-page">
        <p className="gd-loading">Game not found.</p>
        <button
          className="gd-back-btn"
          type="button"
          onClick={() => navigate(isAdmin ? "/update" : "/games")}
        >
          ← Back
        </button>

        {message && (
          <div className="overlay" role="dialog" aria-modal="true">
            <div className={`msg-modal ${messageType}`}>
              <h3>{messageType === "success" ? "Success" : "Error"}</h3>
              <p>{message}</p>
              <button type="button" onClick={handleOk}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

 
  const coverSrc = MediaUtil.toAbsoluteMediaUrl(game?.coverMedia || game?.imageUrl);
  const shots = Array.isArray(game?.screenshots) ? game.screenshots : [];
  const shotSrcs = shots.map((u) => MediaUtil.toAbsoluteMediaUrl(u)).filter(Boolean);

  const embed = toEmbedUrl(game.trailerUrl);

  return (
    <div className="gd-page">
      {/*Popup */}
      {message && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${messageType}`}>
            <h3>{messageType === "success" ? "Success" : "Error"}</h3>
            <p>{message}</p>
            <button type="button" onClick={handleOk}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="gd-wrap">
        <button
          className="gd-back-btn"
          type="button"
          onClick={() => navigate(isAdmin ? "/update" : "/games")}
        >
          ← Back to Catalog
        </button>

        <div className="gd-top">
          <div className="gd-cover">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={game.title}
                onError={(e) => {
                  
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="gd-cover-ph">No Image</div>
            )}
          </div>

          <div className="gd-info">
            <h1 className="gd-title">{game.title}</h1>

            <div className="gd-meta">
              <span><b>Developer:</b> {game.developer || "N/A"}</span>
              <span><b>Platform:</b> {game.platform || "N/A"}</span>
              <span><b>Genre:</b> {game.genre || "N/A"}</span>
              <span><b>Size:</b> {game.sizeGB ? `${game.sizeGB} GB` : "N/A"}</span>
            </div>

            <div className="gd-price">${Number(game.price || 0).toFixed(2)}</div>

            <p className="gd-desc">{game.description || "No description available."}</p>

            {/*ADMIN vs USER*/}
            {isAdmin ? (
              <div className="game-actions">
                <button className="cart-btn" type="button" onClick={goEdit}>
                  Edit Details
                </button>
              </div>
            ) : (
              <div className="game-actions">
                <div className="qty-picker">
                  <button type="button" className="qty-btn" onClick={decQty}>
                    −
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQtySafe(e.target.value)}
                    className="qty-input"
                  />

                  <button type="button" className="qty-btn" onClick={incQty}>
                    +
                  </button>
                </div>

                <button className="cart-btn" type="button" onClick={addToCart}>
                  Add to Cart
                </button>
              </div>
            )}

            <div className="gd-pills">
              {(game.modes || []).map((m) => (
                <span key={m} className="gd-pill">{m}</span>
              ))}
              {game.onlineRequired && <span className="gd-pill">Online Required</span>}
              {game.crossplay && <span className="gd-pill">Crossplay</span>}
              {game.controllerSupport && <span className="gd-pill">Controller Support</span>}
            </div>

            {(game.languages || []).length > 0 && (
              <p className="gd-lang">
                <b>Languages:</b> {game.languages.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Trailer */}
        <div className="gd-card">
          <h2 className="gd-card-title">Trailer</h2>
          {embed ? (
            <div className="gd-video">
              <iframe
                src={embed}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="gd-muted">No trailer added.</p>
          )}
        </div>

        {/* Screenshots */}
        <div className="gd-card">
          <h2 className="gd-card-title">Screenshots</h2>
          {shotSrcs.length > 0 ? (
            <div className="gd-shots">
              {shotSrcs.map((src, i) => (
                <div className="gd-shot" key={src + i}>
                  <img src={src} alt={`Screenshot ${i + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="gd-muted">No screenshots added.</p>
          )}
        </div>

        {/* Requirements */}
        <div className="gd-card">
          <h2 className="gd-card-title">PC System Requirements</h2>

          <div className="gd-req-grid">
            <div className="gd-req-box">
              <h3>Minimum</h3>
              <ReqRow label="OS" value={game.minimumRequirements?.os} />
              <ReqRow label="CPU" value={game.minimumRequirements?.cpu} />
              <ReqRow label="RAM" value={game.minimumRequirements?.ram} />
              <ReqRow label="GPU" value={game.minimumRequirements?.gpu} />
              <ReqRow label="Storage" value={game.minimumRequirements?.storage} />
            </div>

            <div className="gd-req-box">
              <h3>Recommended</h3>
              <ReqRow label="OS" value={game.recommendedRequirements?.os} />
              <ReqRow label="CPU" value={game.recommendedRequirements?.cpu} />
              <ReqRow label="RAM" value={game.recommendedRequirements?.ram} />
              <ReqRow label="GPU" value={game.recommendedRequirements?.gpu} />
              <ReqRow label="Storage" value={game.recommendedRequirements?.storage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReqRow = ({ label, value }) => {
  return (
    <div className="gd-req-row">
      <span className="gd-req-label">{label}</span>
      <span className="gd-req-value">{value || "—"}</span>
    </div>
  );
};

export default GameDetails;
