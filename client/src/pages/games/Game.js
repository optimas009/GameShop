import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil"; 

import "../../css/Games.css";

const Games = () => {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");
  const [ownedIds, setOwnedIds] = useState(new Set()); 
  const [qtyMap, setQtyMap] = useState({}); 
  const [ownedQtyMap, setOwnedQtyMap] = useState({}); 
  const navigate = useNavigate();

  //Popup state 
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

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/games");


        if (!res.ok) {
          openPopup("error", "Failed to fetch games");
          return;
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        setGames(arr);

        // init qty = 1
        const init = {};
        arr.forEach((g) => (init[String(g._id)] = 1));
        setQtyMap(init);
      } catch {
        openPopup("error", "Something went wrong");
      }
    };

    const fetchOwned = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await AuthFetch("/library");
        if (!res || res.status === 401) return;

        const data = await res.json().catch(() => ({}));
        const library = Array.isArray(data.library) ? data.library : [];

        // Set owned IDs for badge
        setOwnedIds(new Set(library.map((x) => String(x.gameId))));

        // Set owned quantities map
        const q = {};
        library.forEach((x) => {
          q[String(x.gameId)] = Number(x.totalQty || 1);
        });
        setOwnedQtyMap(q);
      } catch {}
    };

    fetchGames();
    fetchOwned();
  }, []);

  const setQty = (gameId, value) => {
    const n = Number(value);
    setQtyMap((prev) => ({
      ...prev,
      [String(gameId)]: Number.isNaN(n) ? 1 : Math.max(1, n),
    }));
  };

  const incQty = (gameId) => setQty(gameId, (qtyMap[String(gameId)] || 1) + 1);
  const decQty = (gameId) =>
    setQty(gameId, Math.max(1, (qtyMap[String(gameId)] || 1) - 1));

  const addToCart = async (gameId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      openPopup("error", "Please login first to add to cart.", "/login");
      return;
    }

    const quantity = Math.max(1, Number(qtyMap[String(gameId)] || 1));

    try {
      const res = await AuthFetch(`/cart/add/${gameId}`, {
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

      // reset back to 1 
      setQtyMap((prev) => ({ ...prev, [String(gameId)]: 1 }));
    } catch {
      openPopup("error", "Failed to add to cart");
    }
  };

  const filteredGames = games.filter((g) =>
    (g.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="games-page">
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

      <div className="games-wrap">
        <h1 className="games-title">Game Catalog</h1>

        <div className="search-container">
          <input
            className="games-search"
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredGames.length === 0 ? (
          <p className="games-empty">No games found matching your search.</p>
        ) : (
          <div className="games-grid">
            {filteredGames.map((g) => {
              const isOwned = ownedIds.has(String(g._id));
              const ownedQty = ownedQtyMap[String(g._id)] || 0;
              const qty = qtyMap[String(g._id)] || 1;

              
              const coverSrc = MediaUtil.toAbsoluteMediaUrl(
                g?.coverMedia || g?.imageUrl
              );

              return (
                <div
                  key={g._id}
                  className="game-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/game/${g._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/game/${g._id}`);
                  }}
                >
                  <div className="game-media">
                    {coverSrc ? (
                      <img className="game-img" src={coverSrc} alt={g.title} />
                    ) : (
                      <div className="game-img-placeholder">No Image</div>
                    )}
                    {isOwned && <div className="owned-badge">Owned: {ownedQty}</div>}
                  </div>

                  <div className="game-info">
                    <h3 className="game-title">{g.title}</h3>

                    <div className="game-meta">
                      <div className="price-tag">${Number(g.price || 0).toFixed(2)}</div>
                      <p><span>Developer:</span> {g.developer || "N/A"}</p>
                      <p><span>Size:</span> {g.sizeGB ? `${g.sizeGB} GB` : "N/A"}</p>
                      <p><span>Platform:</span> {g.platform || "N/A"}</p>
                      <p><span>Genre:</span> {g.genre || "N/A"}</p>
                    </div>

                    <p className="game-desc">{g.description || "No description available."}</p>

                    <div
                      className="game-actions"
                      onClick={(e) => e.stopPropagation()} //prevent card click
                    >
                      <div className="qty-picker">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => decQty(g._id)}
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => setQty(g._id, e.target.value)}
                          className="qty-input"
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
                        className="cart-btn"
                        type="button"
                        onClick={() => addToCart(g._id)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
