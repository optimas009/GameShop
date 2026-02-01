const cartService = require("../services/cart.service");

async function getCart(req, res) {
  try {
    const result = await cartService.getCart(req.user._id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const result = await cartService.removeFromCart(req.user._id, req.params.gameId);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function addToCart(req, res) {
  try {
    const result = await cartService.addToCart(req.user._id, req.params.gameId, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function updateCartItem(req, res) {
  try {
    const result = await cartService.updateCartItem(req.user._id, req.params.gameId, req.body);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function checkout(req, res) {
  try {
    const result = await cartService.checkout(req.user._id);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = {
  getCart,
  removeFromCart,
  addToCart,
  updateCartItem,
  checkout,
};
