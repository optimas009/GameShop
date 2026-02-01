const libraryService = require("../services/library.service");

async function getLibrary(req, res) {
  try {
    const result = await libraryService.getLibrary(req.user._id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function useKey(req, res) {
  try {
    const result = await libraryService.useKey(req.user._id, req.params.keyId);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = { getLibrary, useKey };
