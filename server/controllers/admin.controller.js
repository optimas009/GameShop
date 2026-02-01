const adminService = require("../services/admin.service");

async function dashboard(req, res) {
  try {
    const result = await adminService.dashboard();
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function deletePost(req, res) {
  try {
    const result = await adminService.deletePost(req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    const result = await adminService.deleteComment(req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = { dashboard, deletePost, deleteComment };
