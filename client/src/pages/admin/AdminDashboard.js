import { useEffect, useState } from "react";

import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil"; 
import "../../css/AdminDashboard.css";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [openUserId, setOpenUserId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await AuthFetch("/admin/dashboard");
        if (!res || res.status === 401) return;

        const data = await res.json().catch(() => ({}));
        setUsers(Array.isArray(data.users) ? data.users : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleUser = (id) => setOpenUserId((prev) => (prev === id ? null : id));

  if (loading) {
    return (
      <div className="ad-page">
        <div className="ad-wrap">
          <h1 className="ad-title">Admin Dashboard</h1>
          <p className="ad-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-page">
      <div className="ad-wrap">
        <h1 className="ad-title">Admin Dashboard</h1>
        <p className="ad-sub">
          Users: <b>{users.length}</b>
        </p>

        {users.length === 0 ? (
          <div className="ad-empty">No purchases yet.</div>
        ) : (
          <div className="ad-list">
            {users.map((u) => {
              const isOpen = openUserId === u.userId;

              return (
                <div key={u.userId} className={`ad-card ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="ad-card-header"
                    onClick={() => toggleUser(u.userId)}
                  >
                    <div className="ad-user">
                      <div className="ad-name">{u.name || "User"}</div>
                      <div className="ad-email">{u.email}</div>
                    </div>

                    <div className="ad-metrics">
                      <div className="ad-metric">
                        <div className="ad-metric-label">Unique Games</div>
                        <div className="ad-metric-value">{u.uniqueGames}</div>
                      </div>
                      <div className="ad-metric">
                        <div className="ad-metric-label">Total Copies</div>
                        <div className="ad-metric-value">{u.copiesTotal}</div>
                      </div>
                      <div className="ad-metric">
                        <div className="ad-metric-label">Total Spent</div>
                        <div className="ad-metric-value">
                          ${Number(u.spentTotal || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="ad-body">
                      {u.games.map((g) => {
                        
                        // make image absolute 

                        const thumbSrc = MediaUtil.toAbsoluteMediaUrl(g?.imageUrl);

                        return (
                          <div key={g.gameId} className="ad-game">
                            <div className="ad-game-left">
                              {thumbSrc ? (
                                <img className="ad-thumb" src={thumbSrc} alt={g.title} />
                              ) : (
                                <div className="ad-thumb ph" />
                              )}
                            </div>

                            <div className="ad-game-right">
                              <div className="ad-game-top">
                                <div className="ad-game-title">{g.title}</div>
                                <div className="ad-game-qty">
                                  Qty: <span>{g.totalQty}</span>
                                </div>
                              </div>

                              <div className="ad-game-meta">
                                <span>{g.platform || "N/A"}</span>
                                <span>•</span>
                                <span>{g.genre || "N/A"}</span>
                              </div>

                              <div className="ad-keys">
                                <div className="ad-keys-title">Keys</div>

                                {Array.isArray(g.keys) && g.keys.length > 0 ? (
                                  <div className="ad-keys-list">
                                    {g.keys.map((k) => (
                                      <div key={k._id} className="ad-key-row">
                                        <div className="ad-key">{k.key}</div>
                                        <div
                                          className={`ad-key-status ${
                                            k.status === "used" ? "used" : "unused"
                                          }`}
                                        >
                                          {k.status === "used" ? "USED" : "UNUSED"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="ad-muted">No keys found.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
