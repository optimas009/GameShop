import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil";

import "../../css/ManageGame.css";

const ManageGames = () => {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  // popup state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [nextRoute, setNextRoute] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const openPopup = (type, msg, routeAfterOk = "") => {
    setMessageType(type);
    setMessage(msg);
    setNextRoute(routeAfterOk);
  };

  const closePopup = () => {
    setMessage("");
    setMessageType("");
    setNextRoute("");
    setPendingDeleteId(null);
  };

  const handleOk = () => {
    const route = nextRoute;
    closePopup();
    if (route) navigate(route, { replace: true });
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await AuthFetch("/admin/games");

        if (!res) {
          openPopup("error", "Failed to load games.");
          return;
        }

        if (res.status === 401) {
          openPopup("error", "Session expired.", "/login");
          return;
        }

        if (res.status === 403) {
          openPopup("error", "Admin access required.", "/games");
          return;
        }

        const data = await res.json().catch(() => []);
        setGames(Array.isArray(data) ? data : []);
      } catch {
        openPopup("error", "Something went wrong.");
      }
    };

    fetchGames();
  }, []);

  const deleteGame = (id) => {
    setPendingDeleteId(id);
    openPopup("confirm", "Delete this game? This action cannot be undone.");
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      const res = await AuthFetch(`/admin/games/${pendingDeleteId}`, {
        method: "DELETE",
      });

      if (!res) {
        openPopup("error", "Delete failed.");
        return;
      }

      if (res.status === 401) {
        openPopup("error", "Session expired.", "/login");
        return;
      }

      if (res.status === 403) {
        openPopup("error", "Admin access required.", "/games");
        return;
      }

      if (!res.ok) {
        openPopup("error", "Delete failed.");
        return;
      }

      setGames((prev) => prev.filter((g) => g._id !== pendingDeleteId));
      openPopup("success", "Game deleted successfully");
    } catch {
      openPopup("error", "Something went wrong while deleting.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="games-page">
      {message && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${messageType}`}>
            <h3>
              {messageType === "confirm"
                ? "Confirm Delete"
                : messageType === "success"
                ? "Success"
                : "Error"}
            </h3>

            <p>{message}</p>

            {messageType === "confirm" ? (
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn danger"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>

                <button
                  type="button"
                  className="modal-btn"
                  onClick={closePopup}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleOk}>
                OK
              </button>
            )}
          </div>
        </div>
      )}

      <div className="games-wrap">
        <h1 className="games-title">Manage Games (Admin)</h1>

        {games.length === 0 ? (
          <p className="games-empty">No games found</p>
        ) : (
          <div className="games-grid">
            {games.map((g) => {
              const cover = g.coverMedia || ""; 
              const coverSrc = cover ? MediaUtil.toAbsoluteMediaUrl(cover) : "";

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
                      <div className="game-img-placeholder">No cover</div>
                    )}
                  </div>

                  <div className="game-info">
                    <h3 className="game-title">{g.title}</h3>

                    <div className="price-tag">
                      ${Number(g.price || 0).toFixed(2)}
                    </div>

                    <div className="game-meta">
                      <p><span>Developer:</span> {g.developer || "N/A"}</p>
                      <p><span>Size:</span> {g.sizeGB ? `${g.sizeGB} GB` : "N/A"}</p>
                      <p><span>Platform:</span> {g.platform || "N/A"}</p>
                      <p><span>Genre:</span> {g.genre || "N/A"}</p>
                    </div>

                    <div
                      className="game-actions"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/update/${g._id}`);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-action-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGame(g._id);
                        }}
                      >
                        Delete
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

export default ManageGames;
