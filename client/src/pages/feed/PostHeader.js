
const PostHeader = ({ post, isOwner, isAdmin, token, editingPost, onEdit, onDelete }) => {
  const author = post?.userId?.name || "Unknown";
  const created = post?.createdAt ? new Date(post.createdAt).toLocaleString() : "";

  return (
    <div className="post-head">
      <div className="post-author">{author}</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div className="post-time">{created}</div>

        {token && !editingPost && (isOwner || isAdmin) && (
          <div className="post-owner-actions">
            {isOwner && (
              <button className="btn btn--ghost btn--sm" type="button" onClick={onEdit}>
                Edit
              </button>
            )}

            <button className="btn btn--ghost btn--sm btn--danger" type="button" onClick={onDelete}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostHeader;


