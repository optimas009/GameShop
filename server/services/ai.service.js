const OpenAI = require("openai");
const Game = require("../models/Game");
const Post = require("../models/Post");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const GROQ_MODEL = "openai/gpt-oss-120b";

/* ================= HELPERS ================= */

function lastUserText(messages = []) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return String(messages[i].content || "");
  }
  return "";
}

function isPostsIntent(text = "") {
  const t = text.toLowerCase();
  return (
    t.includes("newsfeed") ||
    t.includes("news feed") ||
    t.includes("feed") ||
    t.includes("recent post") ||
    t.includes("recent posts") ||
    t.includes("latest post") ||
    t.includes("latest posts") ||
    t.includes("today post") ||
    t.includes("today posts") ||
    t.includes("people posting") ||
    (t.includes("posting") && (t.includes("today") || t.includes("recent") || t.includes("latest"))) ||
    (t.includes("post") && (t.includes("today") || t.includes("recent") || t.includes("latest")))
  );
}

function looksLikeGameQuestion(text = "") {
  const t = text.toLowerCase();
  if (isPostsIntent(t)) return false;

  return (
    t.includes("tell me about") ||
    t.includes("price of") ||
    t.includes("do you have") ||
    t.includes("is it available") ||
    t.includes("available in your shop")
  );
}

function extractGameName(text = "") {
  return text
    .replace(/tell me about/gi, "")
    .replace(/price of/gi, "")
    .replace(/do you have/gi, "")
    .replace(/is it available/gi, "")
    .replace(/available in your shop/gi, "")
    .replace(/\?/g, "")
    .trim();
}

function notInCatalogMessage(gameName) {
  const name = gameName ? `**${gameName}**` : "that game";
  return (
    `Nice choice 😄 ${name} isn’t available in **GameVault** right now.\n\n` +
    `We’re adding new titles regularly 🚀 Want me to suggest similar games from our current catalog?`
  );
}

/* ================= SAFE DATA ================= */

function safeGame(g) {
  return {
    title: g.title,
    price: g.price,
    genre: g.genre,
    platform: g.platform,
    description: g.description,
  };
}

function safePost(p) {
  return {
    text: p.text,
    mediaCount: Array.isArray(p.media) ? p.media.length : 0,
    youtubeCount: Array.isArray(p.youtubeUrls) ? p.youtubeUrls.length : 0,
    createdAt: p.createdAt,
    author: { name: p.userId?.name || "User" },
  };
}

/* ================= DB QUERIES ================= */

async function getLatestPosts(limit = 5) {
  return Post.find(
    {},
    { text: 1, media: 1, youtubeUrls: 1, createdAt: 1, userId: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name")
    .lean();
}

async function findGameByTitle(name) {
  if (!name) return null;
  return Game.findOne(
    { title: { $regex: name, $options: "i" } },
    { title: 1, price: 1, genre: 1, platform: 1, description: 1 }
  ).lean();
}

async function getCatalogSample(limit = 6) {
  return Game.find(
    {},
    { title: 1, price: 1, genre: 1, platform: 1, description: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/* ================= CONTEXT BUILDER ================= */

function buildContext({ games, posts }) {
  const blocks = [];

  if (games.length) {
    blocks.push(
      "GAMES IN SHOP (ONLY recommend from this list):\n" +
        games
          .map(
            (g, i) =>
              `${i + 1}. ${g.title} | $${g.price} | ${g.genre || ""} | ${g.platform || ""}\n` +
              `   ${String(g.description || "").slice(0, 160)}`
          )
          .join("\n")
    );
  }

  if (posts.length) {
    blocks.push(
      "PUBLIC NEWSFEED POSTS (author name is public):\n" +
        posts
          .map(
            (p, i) =>
              `${i + 1}. ${p.author.name}: ${String(p.text || "").slice(0, 180)}\n` +
              `   Media files: ${p.mediaCount}, YouTube links: ${p.youtubeCount}`
          )
          .join("\n")
    );
  }

  return blocks.join("\n\n");
}

/* ================= MAIN CHAT ================= */

exports.chat = async ({ messages }) => {
  try {
    const userText = lastUserText(messages).trim();

    let rawGames = [];
    let rawPosts = [];

    if (isPostsIntent(userText)) {
      rawPosts = await getLatestPosts(5);
      rawGames = await getCatalogSample(4);
    } else if (looksLikeGameQuestion(userText)) {
      const gameName = extractGameName(userText);

      if (!gameName) {
        rawGames = await getCatalogSample(6);
      } else {
        const found = await findGameByTitle(gameName);
        if (!found) {
          return {
            reply: { role: "assistant", content: notInCatalogMessage(gameName) },
            sources: { games: [], posts: [] },
          };
        }
        rawGames = [found];
      }
    } else {
      rawGames = await getCatalogSample(6);
    }

    const games = rawGames.map(safeGame);
    const posts = rawPosts.map(safePost);
    const context = buildContext({ games, posts });

    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are the AI assistant for **GameVault**.\n\n" +
            "RULES:\n" +
            "- Use ONLY the provided database context.\n" +
            "- Recommend ONLY from the provided shop catalog list.\n" +
            "- If a game is not in the catalog context, do NOT invent details; say it’s not available.\n" +
            "- For posts:\n" +
            "  • mediaCount > 0 → post HAS media\n" +
            "  • mediaCount = 0 → text-only post\n" +
            "- NEVER guess or assume media.\n" +
            "- You may mention post author names (public).\n" +
            "- NEVER talk about likes, comments, or reactions.\n" +
            "- If asked about likes/comments/reactions → reply exactly: 'That requires login, I can’t access that.'\n",
        },
        ...(context ? [{ role: "system", content: context }] : []),
        ...messages,
      ],
    });

    return {
      reply: completion.choices?.[0]?.message,
      sources: { games, posts },
    };
  } catch (err) {
    console.error("AI SERVICE ERROR:", err?.response?.data || err?.message || err);
    return {
      reply: {
        role: "assistant",
        content: "⚠️ AI is unavailable right now. Please try again in a moment.",
      },
      sources: { games: [], posts: [] },
    };
  }
};
