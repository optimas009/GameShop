const Game = require("../models/Game");

const {
  isAllowedMediaUrl,
  normalizeCoverMedia,
  normalizeScreenshots,
  collectGameMedia,
  diffRemovedLocalUploads,
  deleteLocalUploads,
} = require("../helpers/media.helper");



function out(status, body) {
  return { status, body };
}

async function getAllGames() {
  const games = await Game.find();
  return out(200, games);
}

async function getGameById(id) {
  const game = await Game.findById(id);
  if (!game) return out(404, { message: "Game not found" });
  return out(200, game);
}

// ===================== ADMIN GAMES =====================
async function adminGetAllGames() {
  const games = await Game.find();
  return out(200, games);
}

async function adminGetGameById(id) {
  const game = await Game.findById(id);
  if (!game) return out(404, { message: "Game not found" });
  return out(200, game);
}

// CREATE: validate coverMedia + screenshots
async function adminCreateGame(body = {}) {
  const coverMedia = normalizeCoverMedia(body.coverMedia);
  const screenshots = normalizeScreenshots(body.screenshots);

  if (coverMedia && !isAllowedMediaUrl(coverMedia)) {
    return out(400, { message: "Invalid coverMedia URL" });
  }

  for (const u of screenshots) {
    if (!isAllowedMediaUrl(u)) {
      return out(400, { message: "Invalid screenshot URL" });
    }
  }

  const game = new Game({
    ...body,
    coverMedia,
    screenshots,
  });

  const savedGame = await game.save();
  return out(201, savedGame);
}

// UPDATE: delete removed uploads from /uploads

async function adminUpdateGame(gameId, body = {}) {
  const game = await Game.findById(gameId);
  if (!game) return out(404, { message: "Game not found" });

  const nextCoverMedia =
    body.coverMedia !== undefined ? normalizeCoverMedia(body.coverMedia) : game.coverMedia;

  const nextScreenshots =
    body.screenshots !== undefined ? normalizeScreenshots(body.screenshots) : game.screenshots;

  // validate
  if (nextCoverMedia && !isAllowedMediaUrl(nextCoverMedia)) {
    await deleteLocalUploads([nextCoverMedia]);
    return out(400, { message: "Invalid coverMedia URL" });
  }

  for (const u of nextScreenshots) {
    if (!isAllowedMediaUrl(u)) {
      await deleteLocalUploads(nextScreenshots);
      return out(400, { message: "Invalid screenshot URL" });
    }
  }

  // delete removed local uploads

  const oldAll = collectGameMedia(game.coverMedia, game.screenshots);
  const newAll = collectGameMedia(nextCoverMedia, nextScreenshots);
  const removedLocal = diffRemovedLocalUploads(oldAll, newAll);
  await deleteLocalUploads(removedLocal);

  
  const cleanedBody = { ...body };
  delete cleanedBody.imageUrl;

  game.set({
    ...cleanedBody,
    coverMedia: nextCoverMedia,
    screenshots: nextScreenshots,
  });

  const updated = await game.save();
  return out(200, updated);
}

// DELETE: delete all uploads for this game

async function adminDeleteGame(gameId) {
  const game = await Game.findById(gameId);
  if (!game) return out(404, { message: "Game not found" });

  const urlsToDelete = collectGameMedia(game.coverMedia, game.screenshots);
  await deleteLocalUploads(urlsToDelete);

  await Game.deleteOne({ _id: gameId });

  return out(200, { message: "Game deleted successfully" });
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
