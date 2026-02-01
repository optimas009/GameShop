const gameService = require("../services/game.service");

async function getAllGames(req, res) {
  try {
    const result = await gameService.getAllGames();
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
}

async function getGameById(req, res) {
  try {
    const result = await gameService.getGameById(req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function adminGetAllGames(req, res) {
  try {
    const result = await gameService.adminGetAllGames();
    return res.status(result.status).send(result.body);
  } catch {
    return res.status(500).send({ message: "Server error" });
  }
}

async function adminGetGameById(req, res) {
  try {
    const result = await gameService.adminGetGameById(req.params.id);
    return res.status(result.status).send(result.body);
  } catch {
    return res.status(500).send({ message: "Server error" });
  }
}

async function adminCreateGame(req, res) {
  try {
    const result = await gameService.adminCreateGame(req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
}

async function adminUpdateGame(req, res) {
  try {
    const result = await gameService.adminUpdateGame(req.params.id, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
}

async function adminDeleteGame(req, res) {
  try {
    const result = await gameService.adminDeleteGame(req.params.id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}
module.exports = {
  getAllGames,
  getGameById,
  adminGetAllGames,
  adminGetGameById,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
};
