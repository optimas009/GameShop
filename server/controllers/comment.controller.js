const commentService = require("../services/comment.service");

async function getPostComments(req, res) {
  try {
    const result = await commentService.getPostComments(req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function createComment(req, res) {
  try {
    const result = await commentService.createComment(req.user._id, req.params.id, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function updateComment(req, res) {
  try {
    const result = await commentService.updateComment(req.user._id, req.params.id, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    const result = await commentService.deleteComment(req.user._id, req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
};
