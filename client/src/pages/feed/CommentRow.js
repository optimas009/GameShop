
import { useEffect, useRef, useState } from "react";

import AuthFetch from "../../services/AuthFetch";

const CommentRow = ({ comment, myId, isAdmin, onDeleted, onEdited }) => {
  const token = localStorage.getItem("token");

  const cOwnerId = comment?.userId?._id || comment?.userId;
  const isMyComment = myId && String(cOwnerId) === String(myId);

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment?.text || "");
  const [saving, setSaving] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [popupAction, setPopupAction] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    if (!editing) setText(comment?.text || "");
  }, [comment?.text, editing]);

  useEffect(() => {
    if (popupOpen) {
      setTimeout(() => {
        modalRef.current?.focus();
        modalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    }
  }, [popupOpen]);

  const openConfirm = (msg, fn) => {
    setPopupMsg(msg);
    setPopupAction(() => fn);
    setPopupOpen(true);
  };

  const closePopup = () => {
    setPopupOpen(false);
    setPopupMsg("");
    setPopupAction(null);
  };

  const confirmPopup = async () => {
    const fn = popupAction;
    closePopup();
    if (typeof fn === "function") await fn();
  };

  const save = async () => {
    if (!token) return;
    if (!isMyComment) return;

    const t = String(text || "").trim();
    if (!t) return;

    setSaving(true);
    try {
      const res = await AuthFetch(`/comments/${comment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });

      if (!res || res.status === 401) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;

      const updatedComment = data.comment || { ...comment, text: t };
      onEdited?.(comment._id, updatedComment);

      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!token) return;
    if (!isAdmin && !isMyComment) return;

    const url = isAdmin ? `/admin/comments/${comment._id}` : `/comments/${comment._id}`;
    const res = await AuthFetch(url, { method: "DELETE" });
    if (!res || res.status === 401) return;

    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;

   
    onDeleted?.(comment._id, data.commentsCount);
  };

  const canDelete = !!token && (isMyComment || isAdmin);
  const canEdit = !!token && isMyComment;

  return (
    <div className="comment-row">
      {popupOpen && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="msg-modal confirm" ref={modalRef} tabIndex={-1}>
            <h3>Confirm</h3>
            <p>{popupMsg}</p>

            <div className="modal-actions">
              <button className="modal-btn danger" type="button" onClick={confirmPopup}>
                DELETE
              </button>
              <button className="modal-btn" type="button" onClick={closePopup}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <span className="comment-name">{comment?.userId?.name || "User"}:</span>{" "}
          {!editing ? <span className="comment-text">{comment.text}</span> : null}
        </div>

        {(canEdit || canDelete) && (
          <div className="comment-actions">
            {!editing && (
              <>
                {canEdit && (
                  <button className="mini-btn" type="button" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                )}

                {canDelete && (
                  <button
                    className="mini-btn danger"
                    type="button"
                    onClick={() => openConfirm("Delete this comment?", doDelete)}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
          <input
            className="comment-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={saving}
          />
          <button className="btn btn--primary btn--sm" type="button" onClick={save} disabled={saving}>
            Save
          </button>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              setText(comment?.text || "");
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentRow;
