const Comment = require("../models/Comment");
const Post = require("../models/Post");

function out(status, body) {
  return { status, body };
}

/* ===================== COMMENTS ===================== */
async function getPostComments(postId) {
  const [comments, post] = await Promise.all([
    Comment.find({ postId }).sort({ createdAt: -1 }).limit(50).populate("userId", "name"),
    Post.findById(postId).select("commentsCount"),
  ]);

  return out(200, {
    comments,
    commentsCount: post?.commentsCount ?? comments.length,
  });
}

async function createComment(userId, postId, body = {}) {
  const text = String(body.text || "").trim();
  if (!text) return out(400, { message: "Comment required" });

  const exists = await Post.findById(postId).select("_id");
  if (!exists) return out(404, { message: "Post not found" });

  const comment = await Comment.create({ postId, userId, text });

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $inc: { commentsCount: 1 } },
    { new: true }
  ).select("commentsCount");

  const populated = await Comment.findById(comment._id).populate("userId", "name");

  return out(201, {
    comment: populated,
    commentsCount: updatedPost?.commentsCount || 0,
  });
}

async function updateComment(userId, commentId, body = {}) {
  const comment = await Comment.findById(commentId);
  if (!comment) return out(404, { message: "Comment not found" });

  if (String(comment.userId) !== String(userId)) {
    return out(403, { message: "Not allowed" });
  }

  comment.text = String(body.text || "").trim();
  await comment.save();

  return out(200, { message: "Comment updated", comment });
}

async function deleteComment(userId, commentId) {
  const comment = await Comment.findById(commentId);
  if (!comment) return out(404, { message: "Comment not found" });

  if (String(comment.userId) !== String(userId)) {
    return out(403, { message: "Not allowed" });
  }

  await Comment.deleteOne({ _id: commentId });

  const updatedPost = await Post.findByIdAndUpdate(
    comment.postId,
    { $inc: { commentsCount: -1 } },
    { new: true }
  ).select("commentsCount");

  return out(200, {
    message: "Comment deleted",
    commentsCount: updatedPost?.commentsCount || 0,
  });
}

module.exports = {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
};
