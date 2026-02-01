const router = require("express").Router();

const { verifyToken } = require("../helpers/jwt.helper");
const { upload } = require("../helpers/upload.helper"); // posts/default
const { uploadGames } = require("../helpers/uploadGames.helper");
const { requireAdmin ,blockAdminPurchase} = require("../helpers/admin.middleware");


const { uploadSingle, deleteUpload } = require("../controllers/upload.controller");
const authController = require("../controllers/auth.controller");
const gameController = require("../controllers/game.controller");
const userController = require("../controllers/user.controller");
const adminController = require("../controllers/admin.controller");
const cartController = require("../controllers/cart.controller");
const libraryController = require("../controllers/library.controller");
const postController = require("../controllers/post.controller");
const commentController = require("../controllers/comment.controller");

// UPLOAD
router.post("/upload", verifyToken, upload.single("file"), uploadSingle);
router.post("/admin/upload-game",verifyToken,requireAdmin,uploadGames.single("file"),uploadSingle);

router.delete("/upload", verifyToken, deleteUpload);
router.delete("/admin/upload-game", verifyToken, requireAdmin, deleteUpload);


// AUTH
router.post("/register", authController.register);
router.post("/verify-email-code", authController.verifyEmailCode);
router.post("/resend-verification-code", authController.resendVerificationCode);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

//login
router.post("/admin/login", authController.adminLogin);
router.post("/login", authController.login);

// GAMES (PUBLIC)
router.get("/games", gameController.getAllGames);
router.get("/games/:id", gameController.getGameById);

//Me
router.get("/me", verifyToken, userController.getMe);

// ===================== ADMIN GAMES =====================
router.get("/admin/games", verifyToken, requireAdmin, gameController.adminGetAllGames);
router.get("/admin/games/:id", verifyToken, requireAdmin, gameController.adminGetGameById);
router.post("/admin/games", verifyToken, requireAdmin, gameController.adminCreateGame);
router.put("/admin/games/:id", verifyToken, requireAdmin, gameController.adminUpdateGame);
router.delete("/admin/games/:id", verifyToken, requireAdmin, gameController.adminDeleteGame);

// ===================== ADMIN DASHBOARD =====================
router.get("/admin/dashboard", verifyToken, requireAdmin, adminController.dashboard);

// ===================== ADMIN POSTS/COMMENTS =====================
router.delete("/admin/posts/:id", verifyToken, requireAdmin, adminController.deletePost);
router.delete("/admin/comments/:id", verifyToken, requireAdmin, adminController.deleteComment);

// ===================== CART =====================
router.get("/cart", verifyToken, blockAdminPurchase, cartController.getCart);
router.post("/cart/add/:gameId", verifyToken, blockAdminPurchase, cartController.addToCart);
router.patch("/cart/update/:gameId", verifyToken, blockAdminPurchase, cartController.updateCartItem);
router.delete("/cart/remove/:gameId", verifyToken, blockAdminPurchase, cartController.removeFromCart);
router.post("/cart/checkout", verifyToken, blockAdminPurchase, cartController.checkout);

// ===================== LIBRARY =====================
router.get("/library", verifyToken, blockAdminPurchase, libraryController.getLibrary);
router.patch("/keys/use/:keyId", verifyToken, libraryController.useKey);

// ===================== FEED / POSTS =====================
router.get("/feed", postController.getFeed);
router.get("/my-posts", verifyToken, postController.getMyPosts);

router.post("/posts", verifyToken, postController.createPost);
router.patch("/posts/:id", verifyToken, postController.updatePost);
router.delete("/posts/:id", verifyToken, postController.deletePost);

router.post("/posts/:id/react", verifyToken, postController.reactToPost);

// ===================== COMMENTS =====================
router.get("/posts/:id/comments", commentController.getPostComments);
router.post("/posts/:id/comments", verifyToken, commentController.createComment);

router.patch("/comments/:id", verifyToken, commentController.updateComment);
router.delete("/comments/:id", verifyToken, commentController.deleteComment);


module.exports = router;
