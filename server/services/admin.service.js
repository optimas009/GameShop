const Order = require("../models/Order");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const { deleteLocalUploads } = require("../helpers/media.helper");

function out(status, body) {
  return { status, body };
}

/* ===================== ADMIN dashboard ===================== */
async function dashboard() {
  const rows = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: { userId: "$userId", gameId: "$items.gameId" },
        title: { $first: "$items.title" },
        price: { $first: "$items.price" },
        imageUrl: { $first: "$items.imageUrl" },
        platform: { $first: "$items.platform" },
        genre: { $first: "$items.genre" },
        developer: { $first: "$items.developer" },
        sizeGB: { $first: "$items.sizeGB" },
        totalQty: { $sum: "$items.quantity" },
        spent: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    {
      $lookup: {
        from: "gamekeys",
        let: { u: "$_id.userId", g: "$_id.gameId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$userId", "$$u"] }, { $eq: ["$gameId", "$$g"] }],
              },
            },
          },
          { $project: { key: 1, status: 1, usedAt: 1, createdAt: 1 } },
          { $sort: { createdAt: 1 } },
        ],
        as: "keys",
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        copiesTotal: { $sum: "$totalQty" },
        spentTotal: { $sum: "$spent" },
        uniqueGames: { $sum: 1 },
        games: {
          $push: {
            gameId: "$_id.gameId",
            title: "$title",
            price: "$price",
            imageUrl: "$imageUrl",
            platform: "$platform",
            genre: "$genre",
            developer: "$developer",
            sizeGB: "$sizeGB",
            totalQty: "$totalQty",
            keys: "$keys",
          },
        },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: "$user.name",
        email: "$user.email",
        copiesTotal: 1,
        uniqueGames: 1,
        spentTotal: 1,
        games: 1,
      },
    },
    { $sort: { spentTotal: -1 } },
  ]);

  return out(200, { users: rows });
}

/* ===================== ADMIN: delete ===================== */
async function deletePost(postId) {
  const post = await Post.findById(postId);
  if (!post) return out(404, { message: "Post not found" });

  const urlsToDelete = Array.isArray(post.media) ? post.media : [];
  await deleteLocalUploads(urlsToDelete);

  await Comment.deleteMany({ postId });
  await Post.deleteOne({ _id: postId });

  return out(200, { message: "Post deleted by admin" });
}

async function deleteComment(commentId) {
  const comment = await Comment.findById(commentId);
  if (!comment) return out(404, { message: "Comment not found" });

  await Comment.deleteOne({ _id: commentId });

  const updatedPost = await require("../models/Post")
    .findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } }, { new: true })
    .select("commentsCount");

  return out(200, {
    message: "Comment deleted by admin",
    commentsCount: updatedPost?.commentsCount || 0,
  });
}

module.exports = {
  dashboard,
  deletePost,
  deleteComment,
};
