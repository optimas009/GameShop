import { useEffect, useState } from "react";
import AuthFetch from "../../services/AuthFetch";
import CommentRow from "./CommentRow";


const CommentsPanel = ({
  postId,
  token,
  myId,
  isAdmin,
  onRequireLogin,
  onCommentsCountUpdate,
  openTick, 
}) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [cText, setCText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await AuthFetch(`/posts/${postId}/comments`, {
        cache: "no-store", 
      });
      const data = await res.json().catch(() => ({}));

      const list = Array.isArray(data.comments) ? data.comments : [];
      setComments(list);

      // sync counter from backend GET response
      if (typeof data.commentsCount !== "undefined") {
        onCommentsCountUpdate?.(data.commentsCount);
      }
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // refetch when opening (openTick changes) and when post changes
  useEffect(() => {
    loadComments();
    
  }, [postId, openTick]);

  const addComment = async () => {
    if (!token) return onRequireLogin?.();

    setErr("");
    const text = String(cText || "").trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await AuthFetch(`/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res || res.status === 401) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data.message || "Failed to comment");

      setCText("");
      setComments((prev) => [data.comment, ...prev]);

      
      if (typeof data.commentsCount !== "undefined") {
        onCommentsCountUpdate?.(data.commentsCount);
      }
    } finally {
      setSending(false);
    }
  };

  const removeLocal = (commentId, newCount) => {
    setComments((prev) => prev.filter((c) => String(c._id) !== String(commentId)));
    if (typeof newCount !== "undefined") {
      onCommentsCountUpdate?.(newCount);
    }
  };

  const updateLocal = (commentId, updatedComment) => {
    setComments((prev) =>
      prev.map((c) => (String(c._id) === String(commentId) ? { ...c, ...updatedComment } : c))
    );
  };

  return (
    <div className="comment-block">
      <div className="comment-title">Comments</div>

      {loadingComments ? (
        <div className="comment-empty">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="comment-empty">No comments yet.</div>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <CommentRow
              key={c._id}
              comment={c}
              myId={myId}
              isAdmin={isAdmin}
              onDeleted={(deletedId, newCount) => removeLocal(deletedId, newCount)}
              onEdited={updateLocal}
            />
          ))}
        </div>
      )}

      <div className="comment-add">
        <input
          className="comment-input"
          placeholder="Write a comment..."
          value={cText}
          onChange={(e) => setCText(e.target.value)}
          disabled={sending}
        />
        <button className="btn btn--primary btn--sm" type="button" onClick={addComment} disabled={sending}>
          {sending ? "..." : "Send"}
        </button>
      </div>

      {err && <div className="feed-error">{err}</div>}
    </div>
  );
};

export default CommentsPanel;
