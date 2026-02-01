import { useState } from "react";

import AuthFetch from "../../services/AuthFetch";
import MediaUtil from "../../services/MediaUtil"; 

import "../../css/Profile.css";

const KeysBox = ({ keys, onUseKey, busyKeyId }) => {
  const [copiedId, setCopiedId] = useState(null);

  const copyKey = async (key, id) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      alert("Failed to copy key");
    }
  };

  const hasKeys = Array.isArray(keys) && keys.length > 0;

  return (
    <div className="keys-box">
      <div className="keys-title">Your Keys</div>

      {hasKeys ? (
        <div className="keys-list">
          {keys.map((k) => {
            const isUsed = k.status === "used";
            const isBusy = busyKeyId === k._id;

            return (
              <div key={k._id} className="key-row">
                <div className="key-text">{k.key}</div>

                <div className="key-actions">
                  <button
                    type="button"
                    className={`key-copy-btn ${copiedId === k._id ? "copied" : ""}`}
                    onClick={() => copyKey(k.key, k._id)}
                    title="Copy key"
                  >
                    {copiedId === k._id ? "✓" : "📋"}
                  </button>

                  {isUsed ? (
                    <div className="key-used">Used</div>
                  ) : (
                    <button
                      type="button"
                      className="key-use-btn"
                      onClick={() => onUseKey(k._id)}
                      disabled={isBusy}
                      title="Mark as used"
                    >
                      {isBusy ? "…" : "✓"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="keys-empty">No keys generated yet.</div>
      )}
    </div>
  );
};

const LibraryRow = ({ game, isOpen, toggle, setLibrary }) => {
  const id = String(game.gameId || game._id);
  const [busyKeyId, setBusyKeyId] = useState(null);

  const coverSrc = MediaUtil.toAbsoluteMediaUrl(game?.coverMedia || game?.imageUrl);

  const handleUseKey = async (keyId) => {
    if (busyKeyId) return;

    try {
      setBusyKeyId(keyId);

      const res = await AuthFetch(`/keys/use/${keyId}`, { method: "PATCH" });
      if (!res || res.status === 401) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Failed to mark key as used");
        return;
      }

      setLibrary((prev) =>
        prev.map((g) => {
          const gid = String(g.gameId || g._id);
          if (gid !== id) return g;

          return {
            ...g,
            keys: (g.keys || []).map((k) =>
              String(k._id) === String(keyId)
                ? { ...k, status: "used", usedAt: new Date().toISOString() }
                : k
            ),
          };
        })
      );
    } catch {
      alert("Failed to mark key as used");
    } finally {
      setBusyKeyId(null);
    }
  };

  return (
    <div className={`library-row ${isOpen ? "open" : ""}`}>
      <button type="button" className="library-row-header" onClick={() => toggle(id)}>
        <div className="library-row-left">
          {coverSrc ? (
            <img
              className="library-row-thumb"
              src={coverSrc}
              alt={game.title}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="library-row-thumb ph" />
          )}

          <div className="library-row-title-wrap">
            <div className="library-row-title">{game.title}</div>
            <div className="library-row-subprice">
              ${Number(game.price || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="library-row-price">
          Purchased Copies: {Number(game.totalQty || 1)}
        </div>
      </button>

      {isOpen && (
        <div className="library-row-body">
          <p>
            <b>Platform:</b> <span>{game.platform || "N/A"}</span>
          </p>
          <p>
            <b>Genre:</b> <span>{game.genre || "N/A"}</span>
          </p>
          <p>
            <b>Developer:</b> <span>{game.developer || "N/A"}</span>
          </p>
          <p>
            <b>Size:</b> <span>{game.sizeGB ? `${game.sizeGB} GB` : "N/A"}</span>
          </p>

          {game.description ? (
            <p className="library-description">
              <b>Description:</b> {game.description}
            </p>
          ) : null}

          <KeysBox keys={game.keys} onUseKey={handleUseKey} busyKeyId={busyKeyId} />
        </div>
      )}
    </div>
  );
};

export default LibraryRow;
