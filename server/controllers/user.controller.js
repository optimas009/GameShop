const userService = require("../services/user.service");

async function getMe(req, res) {
  try {
    const result = await userService.getMe(req.user._id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = {
  getMe,
};
