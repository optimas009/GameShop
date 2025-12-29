import "./CSS/Games.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";

const Games = () => {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState(""); // 🔍 Search state
  const [ownedIds, setOwnedIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    getGames();
    loadOwned();
  }, []);

  const getGames = async () => {
    try {
      const res = await fetch("http://localhost:5000/games");
      if (!res.ok) return alert("Failed to fetch games");
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (e) {
      alert("Something went wrong");
    }
  };

  const loadOwned = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await AuthFetch("/library");
      if (!res || res.status === 401) return;
      const data = await res.json();
      const library = Array.isArray(data.library) ? data.library : [];
      const set = new Set(library.map((x) => String(x.gameId)));
      setOwnedIds(set);
    } catch (e) {}
  };

  const addToCart = async (gameId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first to add to cart.");
      navigate("/login");
      return;
    }

    if (ownedIds.has(String(gameId))) {
      alert("You already own this game.");
      return;
    }

    try {
      const res = await AuthFetch(`/cart/add/${gameId}`, { method: "POST" });
      if (!res || res.status === 401) return;
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Error adding to cart");
      alert(data.message || "Added to cart");
    } catch (err) {
      alert("Failed to add to cart");
    }
  };

  // ✅ Filter games based on search input
  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="games-page">
      <div className="games-wrap">
        <h1 className="games-title">Game Catalog</h1>

        {/* 🔍 Search Bar Section */}
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

              return (
                <div key={g._id} className="game-card">
                  <div className="game-media">
                    {g.imageUrl ? (
                      <img className="game-img" src={g.imageUrl} alt={g.title} />
                    ) : (
                      <div className="game-img-placeholder">No Image</div>
                    )}
                    {isOwned && <div className="owned-badge">Owned</div>}
                  </div>

                  <div className="game-info">
                    <h3 className="game-title">{g.title}</h3>

                    <div className="game-meta">
                      <div className="price-tag">${g.price}</div>
                      <p><span>Developer:</span> {g.developer || "N/A"}</p>
                      <p><span>Size:</span> {g.sizeGB ? `${g.sizeGB} GB` : "N/A"}</p>
                      <p><span>Platform:</span> {g.platform || "N/A"}</p>
                      <p><span>Genre:</span> {g.genre || "N/A"}</p>
                    </div>

                    <p className="game-desc">
                      {g.description || "No description available."}
                    </p>

                    <button
                      className={`cart-btn ${isOwned ? "disabled" : ""}`}
                      type="button"
                      disabled={isOwned}
                      onClick={() => addToCart(g._id)}
                    >
                      {isOwned ? "In Library" : "Add to Cart"}
                    </button>
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