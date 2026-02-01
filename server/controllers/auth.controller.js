const authService = require("../services/auth.service");

async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).send({ message: err.message });
  }
}

async function verifyEmailCode(req, res) {
  try {
    const result = await authService.verifyEmailCode(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function resendVerificationCode(req, res) {
  try {
    const result = await authService.resendVerificationCode(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).send({ message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).send({ message: err.message });
  }
}

async function adminLogin(req, res) {
  try {
    const result = await authService.adminLogin(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = {
  register,
  verifyEmailCode,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  adminLogin,
  login,
};
