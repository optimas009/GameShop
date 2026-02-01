function generateRawKey15() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 15; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function formatKey(raw15) {
  return `${raw15.slice(0, 5)}-${raw15.slice(5, 10)}-${raw15.slice(10, 15)}`;
}

async function generateUniqueKey(GameKeyModel) {
  for (let i = 0; i < 10; i++) {
    const raw = generateRawKey15();
    const k = formatKey(raw);

    const exists = await GameKeyModel.findOne({ key: k }).select("_id");
    if (!exists) return k;
  }
  throw new Error("Failed to generate unique key");
}

module.exports = { generateRawKey15, formatKey, generateUniqueKey };
