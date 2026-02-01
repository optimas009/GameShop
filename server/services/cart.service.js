const Cart = require("../models/Cart");
const Game = require("../models/Game");
const Order = require("../models/Order");
const GameKey = require("../models/GameKey");

const { generateUniqueKey } = require("../helpers/gamekey.helper");

function out(status, body) {
  return { status, body };
}

function mapCartItems(cartDoc) {
  const items = cartDoc.items.map((it) => ({
    game: it.gameId,
    quantity: it.quantity,
  }));
  return items;
}

/* ===================== CART ===================== */
async function getCart(userId) {
  const cart = await Cart.findOne({ userId }).populate("items.gameId");
  if (!cart) return out(200, { items: [] });

  return out(200, { items: mapCartItems(cart) });
}

async function removeFromCart(userId, gameId) {
  const updated = await Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { gameId } } },
    { new: true }
  ).populate("items.gameId");

  if (!updated) return out(404, { message: "Cart not found", items: [] });

  if (updated.items.length === 0) {
    await Cart.deleteOne({ userId });
    return out(200, { message: "Removed. Cart is now empty.", items: [] });
  }

  return out(200, { message: "Removed from cart", items: mapCartItems(updated) });
}

async function addToCart(userId, gameId, body = {}) {
  const qty = Math.max(1, parseInt(body?.quantity, 10) || 1);

  const game = await Game.findById(gameId);
  if (!game) return out(404, { message: "Game not found" });

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{ gameId, quantity: qty }],
    });
  } else {
    const item = cart.items.find((it) => it.gameId.toString() === gameId);

    if (item) item.quantity += qty;
    else cart.items.push({ gameId, quantity: qty });

    await cart.save();
  }

  const populated = await Cart.findOne({ userId }).populate("items.gameId");
  return out(200, { message: `Added x${qty}`, items: mapCartItems(populated) });
}

async function updateCartItem(userId, gameId, body = {}) {
  const { quantity } = body;

  const qty = Number(quantity);
  if (Number.isNaN(qty)) {
    return out(400, { message: "quantity is required" });
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) return out(404, { message: "Cart not found" });

  const idx = cart.items.findIndex((it) => it.gameId.toString() === gameId);
  if (idx === -1) return out(404, { message: "Item not in cart" });

  if (qty <= 0) cart.items.splice(idx, 1);
  else cart.items[idx].quantity = qty;

  if (cart.items.length === 0) {
    await Cart.deleteOne({ userId });
    return out(200, { message: "Cart is now empty", items: [] });
  }

  await cart.save();

  const populated = await Cart.findOne({ userId }).populate("items.gameId");
  return out(200, { message: "Cart updated", items: mapCartItems(populated) });
}

/* ===================== CHECKOUT ===================== */
async function checkout(userId) {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    return out(400, { message: "Cart is empty" });
  }

  const gameIds = cart.items.map((it) => it.gameId);
  const games = await Game.find({ _id: { $in: gameIds } });

  const gameMap = new Map(games.map((g) => [g._id.toString(), g]));

  const items = cart.items
    .map((it) => {
      const g = gameMap.get(it.gameId.toString());
      if (!g) return null;

      const qty = Math.max(1, Number(it.quantity) || 1);

      return {
        gameId: g._id,
        title: g.title,
        price: Number(g.price) || 0,

        imageUrl: g.coverMedia || "",

        platform: g.platform,
        genre: g.genre,
        developer: g.developer,
        sizeGB: g.sizeGB,
        description: g.description,
        quantity: qty,
      };
    })
    .filter(Boolean);

  if (items.length === 0) {
    return out(400, { message: "Cart has invalid items" });
  }

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const order = await Order.create({ userId, items, total, status: "paid" });

  const keyDocs = [];
  for (const it of items) {
    for (let i = 0; i < it.quantity; i++) {
      const k = await generateUniqueKey(GameKey);
      keyDocs.push({
        userId,
        gameId: it.gameId,
        orderId: order._id,
        key: k,
        status: "unused",
        usedAt: null,
      });
    }
  }

  if (keyDocs.length > 0) {
    await GameKey.insertMany(keyDocs);
  }

  await Cart.deleteOne({ userId });

  return out(201, { message: "Purchase successful", orderId: order._id });
}

module.exports = {
  getCart,
  removeFromCart,
  addToCart,
  updateCartItem,
  checkout,
};
