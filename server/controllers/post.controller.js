const postService = require("../services/post.service");

async function getFeed(req, res) {
  try {
    const result = await postService.getFeed(req);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function createPost(req, res) {
  try {
    const result = await postService.createPost(req.user._id, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function updatePost(req, res) {
  try {
    const result = await postService.updatePost(req.user._id, req.params.id, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function deletePost(req, res) {
  try {
    const result = await postService.deletePost(req.user._id, req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function reactToPost(req, res) {
  try {
    const result = await postService.reactToPost(req.user._id, req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function getMyPosts(req, res) {
  try {
    const result = await postService.getMyPosts(req.user._id, req.query);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = {
  getFeed,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  getMyPosts,
};
