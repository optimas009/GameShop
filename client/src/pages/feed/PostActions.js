
const PostActions = ({
  token,
  liked,
  likesCount,
  commentsCount,
  reacting,
  onReact,
  onToggleComments,
}) => {
  return (
    <div className="post-actions">
      <button
        type="button"
        className={`action-btn ${liked ? "active" : ""}`}
        onClick={onReact}
        disabled={reacting}
        title={token ? "React" : "Login to react"}
      >
        {liked ? "❤️ Reacted" : "🤍 React"} · {likesCount}
      </button>

      <button
        type="button"
        className="action-btn"
        onClick={onToggleComments}
        title={token ? "Comment" : "Login to comment"}
      >
        💬 Comment {commentsCount > 0 ? `· ${commentsCount}` : ""}
      </button>

      {!token && <div className="action-note">Login to comment or react</div>}
    </div>
  );
};

export default PostActions;
