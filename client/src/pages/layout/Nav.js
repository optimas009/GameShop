import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthFetch from "../../services/AuthFetch";

import "../../css/Nav.css";

const Nav = () => {
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [me, setMe] = useState(null); 

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setMe(null);
        return;
      }

      try {
        const res = await AuthFetch("/me");
        if (!res || res.status !== 200) {
          setMe(null);
          return;
        }

        const user = await res.json();
        setMe(user);
      } catch {
        setMe(null);
      }
    };

    loadMe();
  }, [token]);

  const isAdmin = me?.role === "admin";
  const isUser = isLoggedIn && !isAdmin;

  return (

  <nav className="navbar">
    {/* ================= LEFT SIDE LINKS ================= */}
    <div className="nav-left">
      <span className="nav-logo">🎮 GameShop</span>

      {/* Public links*/}
      <NavLink to="/home" className="nav-link">
        Home
      </NavLink>

      {/* Public link for (guests + users) */}
      {!isAdmin && (
        <NavLink to="/games" className="nav-link">
          Games
        </NavLink>
      )}
      <NavLink to="/feed" className="nav-link">
        NewsFeed
      </NavLink>

      {/* User-only links */}
      {isUser && (
        <NavLink to="/profile" className="nav-link">
          Profile
        </NavLink>
      )}
      
      {/* Logged-in links BOTH user + admin */}
      {isLoggedIn && (
        <NavLink to="/my-posts" className="nav-link">
          My Posts
        </NavLink>
      )}

      {/* Admin-only links */}
      {isAdmin && (
        <>
          <NavLink to="/dashboard" className="nav-link">
            Dashboard
          </NavLink>

          <NavLink to="/add" className="nav-link">
            Add
          </NavLink>

          <NavLink to="/update" className="nav-link">
            Manage
          </NavLink>
        </>
      )}
    </div>

    {/* ================= RIGHT SIDE BUTTONS ================= */}
    <div className="nav-right">
      {/* Guest buttons */}
      {!isLoggedIn ? (
        <>
          <NavLink to="/signup" className="nav-btn outline">
            Sign Up
          </NavLink>

          <NavLink to="/login" className="nav-btn solid">
            Login
          </NavLink>
        </>
      ) : (
        <>
          {/* User-only button */}
          {isUser && (
            <NavLink to="/cart" className="nav-btn cart">
              Cart
            </NavLink>
          )}

          {/* Logged-in button both admin + user*/}
          <NavLink to="/logout" className="nav-btn danger">
            Logout
          </NavLink>
        </>
      )}
    </div>
  </nav>
);}



export default Nav;
