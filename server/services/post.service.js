const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const {
  uniqueArray,
  isAllowedMediaUrl,
  isYoutubeUrl,
  extractUploadsPath,
  deleteLocalUploads,
  diffRemovedLocalUploads,
} = require("../helpers/media.helper");

function out(status, body) {
  return { status, body };
}

/* ===================== FEED ===================== */
async function getFeed(req) {
  let viewerId = null;

  const auth = req.headers["authorization"];
  if (auth) {
    const parts = auth.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      try {
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
        viewerId = decoded?._id || null;
      } catch {}
    }
  }

  const limit = Math.min(30, Number(req.query.limit) || 15);

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name");

  const mapped = posts.map((p) => ({
    _id: p._id,
    userId: p.userId,
    text: p.text,
    media: Array.isArray(p.media) ? p.media : [],
    youtubeUrls: Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [],
    createdAt: p.createdAt,
    likesCount: p.likesCount || 0,
    likedByMe: viewerId ? p.likes.some((u) => String(u) === String(viewerId)) : false,
    commentsCount: p.commentsCount || 0,
  }));

  return out(200, { posts: mapped });
}

/* ===================== CREATE POST ===================== */
async function createPost(userId, body = {}) {
  const text = String(body.text || "").trim();
  const media = uniqueArray(body.media);
  const youtubeUrls = uniqueArray(body.youtubeUrls);

  if (!text && media.length === 0 && youtubeUrls.length === 0) {
    return out(400, { message: "Post cannot be empty" });
  }

  for (const u of media) {
    if (!isAllowedMediaUrl(u)) {
      return out(400, { message: "Invalid media URL" });
    }
  }

  for (const u of youtubeUrls) {
    if (!isYoutubeUrl(u)) {
      return out(400, { message: "Only YouTube links allowed in YouTube URLs" });
    }
  }

  const post = await Post.create({ userId, text, media, youtubeUrls });

  const populated = await Post.findById(post._id).populate("userId", "name");

  const p = populated.toObject();
  p.media = Array.isArray(p.media) ? p.media : [];
  p.youtubeUrls = Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [];

  return out(201, { post: p });
}

/* ===================== UPDATE POST ===================== */
async function updatePost(userId, postId, body = {}) {
  const nextText = typeof body.text === "string" ? String(body.text).trim() : undefined;
  const nextMedia = body.media !== undefined ? uniqueArray(body.media) : undefined;
  const nextYoutubeUrls = body.youtubeUrls !== undefined ? uniqueArray(body.youtubeUrls) : undefined;

  
  const attemptedNewUploads = [];
  if (Array.isArray(nextMedia)) {
    for (const u of nextMedia) if (extractUploadsPath(u)) attemptedNewUploads.push(u);
  }

  const cleanupAttemptedUploads = async () => {
    await deleteLocalUploads(attemptedNewUploads);
  };

  try {
    const post = await Post.findById(postId);
    if (!post) {
      await cleanupAttemptedUploads();
      return out(404, { message: "Post not found" });
    }

    if (String(post.userId) !== String(userId)) {
      await cleanupAttemptedUploads();
      return out(403, { message: "Not allowed" });
    }

    const finalText = nextText !== undefined ? nextText : post.text;

    const finalMedia =
      nextMedia !== undefined
        ? nextMedia
        : Array.isArray(post.media)
        ? uniqueArray(post.media)
        : [];

    const finalYoutube =
      nextYoutubeUrls !== undefined
        ? nextYoutubeUrls
        : Array.isArray(post.youtubeUrls)
        ? uniqueArray(post.youtubeUrls)
        : [];

    for (const u of finalMedia) {
      if (!isAllowedMediaUrl(u)) {
        await cleanupAttemptedUploads();
        return out(400, { message: "Invalid media URL" });
      }
    }

    for (const u of finalYoutube) {
      if (!isYoutubeUrl(u)) {
        await cleanupAttemptedUploads();
        return out(400, { message: "Only YouTube links allowed in YouTube URLs" });
      }
    }

    if (!finalText && finalMedia.length === 0 && finalYoutube.length === 0) {
      await cleanupAttemptedUploads();
      return out(400, { message: "Post cannot be empty" });
    }

    const removedLocal = diffRemovedLocalUploads(post.media || [], finalMedia || []);
    await deleteLocalUploads(removedLocal);

    post.text = finalText;
    post.media = finalMedia;
    post.youtubeUrls = finalYoutube;

    await post.save();

    const p = post.toObject();
    p.media = Array.isArray(p.media) ? p.media : [];
    p.youtubeUrls = Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [];

    return out(200, { message: "Post updated", post: p });
  } catch (err) {
    await cleanupAttemptedUploads();
    throw err;
  }
}

/* ===================== REACT (LIKE) ===================== */
async function reactToPost(userId, postId) {
  const post = await Post.findById(postId).select("likes likesCount");
  if (!post) return out(404, { message: "Post not found" });

  const alreadyLiked = post.likes.some((u) => u.toString() === userId.toString());

  if (alreadyLiked) {
    post.likes = post.likes.filter((u) => u.toString() !== userId.toString());
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(userId);
    post.likesCount += 1;
  }

  await post.save();

  return out(200, {
    liked: !alreadyLiked,
    likesCount: post.likesCount,
  });
}

/* ===================== DELETE POST ===================== */
async function deletePost(userId, postId) {
  const post = await Post.findById(postId);
  if (!post) return out(404, { message: "Post not found" });

  if (String(post.userId) !== String(userId)) {
    return out(403, { message: "Not allowed" });
  }

  const urlsToDelete = Array.isArray(post.media) ? post.media : [];
  await deleteLocalUploads(urlsToDelete);

  await Comment.deleteMany({ postId });
  await Post.deleteOne({ _id: postId });

  return out(200, { message: "Post deleted" });
}

/* ===================== MY POSTS ===================== */
async function getMyPosts(viewerId, query = {}) {
  const limit = Math.min(50, Number(query.limit) || 30);

  const posts = await Post.find({ userId: viewerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name");

  const mapped = posts.map((p) => ({
    _id: p._id,
    userId: p.userId,
    text: p.text,
    media: Array.isArray(p.media) ? p.media : [],
    youtubeUrls: Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [],
    createdAt: p.createdAt,
    likesCount: p.likesCount || 0,
    likedByMe: p.likes.some((u) => String(u) === String(viewerId)),
    commentsCount: p.commentsCount || 0,
  }));

  return out(200, { posts: mapped });
}

module.exports = {
  getFeed,
  createPost,
  updatePost,
  reactToPost,
  deletePost,
  getMyPosts,
};
