import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";
import "./CSS/ManageGame.css";

const ManageGames = () => {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      const res = await AuthFetch("/admin/games");
      if (!res) return;

      if (res.status === 401) return;

      if (res.status === 403) {
        alert("Admin access required");
        navigate("/games", { replace: true });
        return;
      }

      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    };

    fetchGames();
  }, [navigate]);


  const deleteGame = async (id) => {
    if (!window.confirm("Delete this game?")) return;

    const res = await AuthFetch(`/admin/games/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) return;

    if (res.status === 403) {
      alert("Admin access required");
      navigate("/games", { replace: true });
      return;
    }

    if (!res.ok) {
      alert(data.message || "Delete failed");
      return;
    }

    setGames((prev) => prev.filter((g) => g._id !== id));
  };

  return (
    <div className="games-page">
      <div className="games-wrap">
        <h1 className="games-title">Manage Games (Admin)</h1>

        {games.length === 0 ? (
          <p className="games-empty">No games found</p>
        ) : (
          <div className="games-grid">
            {games.map((g) => (
              <div key={g._id} className="game-card">
                <div className="game-media">
                  {g.imageUrl ? (
                    <img className="game-img" src={g.imageUrl} alt={g.title} />
                  ) : (
                    <div className="game-img-placeholder">No image</div>
                  )}
                </div>

                <div className="game-info">
                  <h3 className="game-title">{g.title}</h3>

                  <div className="game-meta">
                    <p><b>Price:</b> ${g.price}</p>
                    <p><b>Developer:</b> {g.developer || "N/A"}</p>
                    <p><b>Size:</b> {g.sizeGB ? `${g.sizeGB} GB` : "N/A"}</p>
                    <p><b>Platform:</b> {g.platform || "N/A"}</p>
                    <p><b>Genre:</b> {g.genre || "N/A"}</p>
                  </div>

                  <div className="admin-actions">
                    <button
                      className="admin-btn"
                      type="button"
                      onClick={() => navigate(`/update/${g._id}`)}
                    >
                      Update
                    </button>

                    <button
                      className="admin-btn danger"
                      type="button"
                      onClick={() => deleteGame(g._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageGames;

