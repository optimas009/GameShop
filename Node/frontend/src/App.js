import "./App.css";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Signup from "./components/Signup";
import PrivateComponent from "./components/PrivateComponent";
import Logout from "./components/Logout";
import Login from "./components/Login";
import Game from "./components/Game";
import AdminComponent from "./components/AdminComponent";
import AddGame from "./components/AddGame";
import ManageGames from "./components/ManageGames";
import UpdateGame from "./components/UpdateGame";
import Home from "./components/Home";
import Cart from "./components/Cart";
import Profile from "./components/Profile"
import SecretAdminLogin from "./components/SecretAdminLogin";
import Verify from "./components/Verify";


function App() {
  const navigate = useNavigate();

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

  return (
    <div className="App">
      <Nav />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/games" element={<Game />} />
          <Route path="/secret" element={<SecretAdminLogin />} />
          <Route path="/verify" element={<Verify />} />
         
          {/* ✅ Logged-in users (admin + user) */}
          <Route element={<PrivateComponent />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/logout" element={<Logout />} />
          </Route>

          {/* ✅ Admin-only */}
          <Route element={<AdminComponent />}>
            <Route path="/add" element={<AddGame />} />
            <Route path="/update" element={<ManageGames />} />
            <Route path="/update/:id" element={<UpdateGame />} />
          </Route>

          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
