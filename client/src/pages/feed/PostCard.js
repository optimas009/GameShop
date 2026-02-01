import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import PostHeader from "./PostHeader";
import PostBody from "./PostBody";
import PostActions from "./PostActions";
import CommentsPanel from "./CommentsPanel";

const decodeJwtPayload = (token) => {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const ensureArrays = (p) => {
  if (!p) return p;
  return {
    ...p,
    media: Array.isArray(p.media) ? p.media : [],
    youtubeUrls: Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [],
  };
};

const PostCard = ({ post, onDeleteLocal, isAdmin = false }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [postState, setPostState] = useState(ensureArrays(post));

  useEffect(() => {
    setPostState(ensureArrays(post));
  }, [post]);

  const myId = useMemo(() => {
    const decoded = decodeJwtPayload(token);
    return decoded?._id || null;
  }, [token]);

  const postOwnerId = postState?.userId?._id || postState?.userId;
  const isOwner = myId && String(postOwnerId) === String(myId);

  const [liked, setLiked] = useState(!!postState?.likedByMe);
  const [likesCount, setLikesCount] = useState(Number(postState?.likesCount) || 0);
  const [reacting, setReacting] = useState(false);

  const [commentsCount, setCommentsCount] = useState(Number(postState?.commentsCount) || 0);

  const [editingPost, setEditingPost] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // used to force refetch when opening comments
  const [openTick, setOpenTick] = useState(0);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const [popupAction, setPopupAction] = useState(null);

  useEffect(() => {
    setLiked(!!postState?.likedByMe);
    setLikesCount(Number(postState?.likesCount) || 0);
    setCommentsCount(Number(postState?.commentsCount) || 0);
  }, [postState?.likedByMe, postState?.likesCount, postState?.commentsCount]);

  const requireLogin = () => navigate("/login");

  const openConfirm = (msg, onConfirmFn) => {
    setPopupType("confirm");
    setPopupMsg(msg);
    setPopupAction(() => onConfirmFn);
    setPopupOpen(true);
  };

  const closePopup = () => {
    setPopupOpen(false);
    setPopupType("");
    setPopupMsg("");
    setPopupAction(null);
  };

  const handleConfirm = async () => {
    const fn = popupAction;
    closePopup();
    if (typeof fn === "function") await fn();
  };

  const toggleReact = async () => {
    if (!token) return requireLogin();
    if (reacting) return;

    setReacting(true);
    try {
      const res = await AuthFetch(`/posts/${postState._id}/react`, { method: "POST" });
      if (!res || res.status === 401) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;

      setLiked(!!data.liked);
      setLikesCount(Number(data.likesCount) || 0);
    } finally {
      setReacting(false);
    }
  };

  const deletePost = () => {
    if (!token) return requireLogin();
    if (!isAdmin && !isOwner) return;

    openConfirm("Delete this post?", async () => {
      const url = isAdmin ? `/admin/posts/${postState._id}` : `/posts/${postState._id}`;
      const res = await AuthFetch(url, { method: "DELETE" });
      if (!res || res.status === 401) return;

      if (res.ok) onDeleteLocal?.(postState._id);
    });
  };

  return (
    <div className="post-card">
      {popupOpen && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${popupType}`}>
            <h3>Confirm</h3>
            <p>{popupMsg}</p>

            <div className="modal-actions">
              <button className="modal-btn danger" type="button" onClick={handleConfirm}>
                DELETE
              </button>
              <button className="modal-btn" type="button" onClick={closePopup}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <PostHeader
        post={postState}
        isOwner={!!isOwner}
        isAdmin={!!isAdmin}
        token={token}
        editingPost={editingPost}
        onEdit={() => setEditingPost(true)}
        onDelete={deletePost}
      />

      <PostBody
        post={postState}
        token={token}
        isOwner={!!isOwner}
        editingPost={editingPost}
        onCancelEdit={() => setEditingPost(false)}
        onSaved={(updatedPost) => {
          if (updatedPost) setPostState(ensureArrays(updatedPost));
          setEditingPost(false);
        }}
        onRequireLogin={requireLogin}
      />

      {!editingPost && (
        <>
          <PostActions
            token={token}
            liked={liked}
            likesCount={likesCount}
            commentsCount={commentsCount}
            reacting={reacting}
            onReact={toggleReact}
            onToggleComments={() => {
              if (!token) return requireLogin();

              
              setShowComments((prev) => {
                const next = !prev;
                if (next) setOpenTick((t) => t + 1);
                return next;
              });
            }}
          />

          {showComments && token && (
            <CommentsPanel
              postId={postState._id}
              token={token}
              myId={myId}
              isAdmin={!!isAdmin}
              onRequireLogin={requireLogin}
              onCommentsCountUpdate={(count) => setCommentsCount(Number(count) || 0)}
              openTick={openTick} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default PostCard;
