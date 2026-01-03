import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import "./CSS/Nav.css";
import AuthFetch from "./AuthFetch";

const Nav = () => {
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [me, setMe] = useState(null); // null = unknown, object = user

  useEffect(() => {
    const loadMe = async () => {
      // if not logged in, clear me
      if (!token) {
        setMe(null);
        return;
      }

      try {
        const res = await AuthFetch("/me");
        if (!res) return;

        if (res.status !== 200) {
          setMe(null);
          return;
        }

        const user = await res.json();
        setMe(user);

        // optional: keep user fresh
        //localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        setMe(null);
      }
    };

    loadMe();
  }, [token]);

  const isAdmin = me?.role === "admin";

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <span className="nav-logo">🎮 GameShop</span>

        <NavLink to="/home" className="nav-link">Home</NavLink>
        <NavLink to="/games" className="nav-link">Games</NavLink>

        {/* ✅ Profile for ALL logged-in users */}
        {isLoggedIn && <NavLink to="/profile" className="nav-link">Profile</NavLink>}

        {/* ✅ Admin-only links (server verified role) */}
        {isLoggedIn && isAdmin && (
          <>
            <NavLink to="/add" className="nav-link">Add</NavLink>
            <NavLink to="/update" className="nav-link">Manage</NavLink>
          </>
        )}
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {!isLoggedIn ? (
          <>
            <NavLink to="/signup" className="nav-btn outline">Sign Up</NavLink>
            <NavLink to="/login" className="nav-btn solid">Login</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/cart" className="nav-btn cart">Cart</NavLink>
            <NavLink to="/logout" className="nav-btn danger">Logout</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Nav;
