import "./App.css";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";


// layout
import Nav from "./pages/layout/Nav";
import Footer from "./pages/layout/Footer";
import PrivateComponent from "./pages/layout/PrivateComponent";
import UserOnlyRoute from "./pages/layout/UserOnlyRoute";

// auth
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

//home
import Home from "./pages/home/Home";

//  games
import Game from "./pages/games/Game";
import GameDetails from "./pages/games/GameDetails";

// feed
import NewsFeed from "./pages/feed/NewsFeed";
import CreatePost from "./pages/feed/CreatePost";

// profile
import Profile from "./pages/profile/Profile";
import MyPosts from "./pages/profile/MyPosts";

// cart
import Cart from "./pages/cart/Cart";
import Payment from "./pages/cart/Payment";

// admin
import AdminComponent from "./pages/admin/AdminComponent";
import AddGame from "./pages/admin/AddGame";
import ManageGames from "./pages/admin/ManageGames";
import UpdateGame from "./pages/admin/UpdateGame";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SecretAdminLogin from "./pages/admin/SecretAdminLogin";


//ai
import AiChat from "./pages/ai/AiChat";



import { SERVER_BASE_URL } from "./services/MediaUtil";

function App() {
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      alert("Session expired. Please login again.");
      navigate("/home", { replace: true });
    };

    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, [navigate]);

  useEffect(() => {
    fetch(`${SERVER_BASE_URL}/health`)
      .catch(() => { });
  }, []);

  return (
    <div className="App">
      <Nav />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />




          <Route path="/home" element={<Home />} />
          <Route path="/game/:id" element={<GameDetails />} />
          <Route path="/feed" element={<NewsFeed />} />
          <Route path="/create-post" element={<CreatePost />} />

          <Route path="/secret" element={<SecretAdminLogin />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/*  Public + user-only pages (admin blocked) */}
          <Route element={<UserOnlyRoute />}>
            <Route path="/games" element={<Game />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Any logged-in (admin + user) */}
          <Route element={<PrivateComponent />}>
            <Route path="/logout" element={<Logout />} />
            <Route path="/my-posts" element={<MyPosts />} />
          </Route>

          {/* Admin-only */}
          <Route element={<AdminComponent />}>
            <Route path="/add" element={<AddGame />} />
            <Route path="/update" element={<ManageGames />} />
            <Route path="/update/:id" element={<UpdateGame />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </div>

      {/* ADD HERE */}
      {!aiOpen && (
        <button className="ai-fab" onClick={() => setAiOpen(true)}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "18px" }}>🤖</span>
            <span style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1 }}>
              Need AI<br />Assistant?
            </span>
          </span>
        </button>)}
      <AiChat open={aiOpen} onClose={() => setAiOpen(false)} />

      <Footer />
    </div>
  );
}

export default App;
