import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthFetch from "../../services/AuthFetch";
import "../../css/Nav.css";

const Nav = () => {
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [me, setMe] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

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

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 850) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isAdmin = me?.role === "admin";
  const isUser = isLoggedIn && !isAdmin;

  const closeMobile = () => setMobileOpen(false);

  //  If you click same route again, scroll to top
  const onNavClick = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
    closeMobile();
  };

  return (
    <nav className="navbar">
      {/* ================= LEFT SIDE LINKS ================= */}
      <div className="nav-left">
        {/* Logo now clickable -> /home */}
        <NavLink to="/home" className="nav-logo" onClick={() => onNavClick("/home")}>
          🎮 GameVault
        </NavLink>

        {/* Desktop links */}
        <div className="nav-desktop-links">
          <NavLink to="/home" className="nav-link" onClick={() => onNavClick("/home")}>
            Home
          </NavLink>

          {!isAdmin && (
            <NavLink to="/games" className="nav-link" onClick={() => onNavClick("/games")}>
              Games
            </NavLink>
          )}

          <NavLink to="/feed" className="nav-link" onClick={() => onNavClick("/feed")}>
            NewsFeed
          </NavLink>

          {isUser && (
            <NavLink to="/profile" className="nav-link" onClick={() => onNavClick("/profile")}>
              Profile
            </NavLink>
          )}

          {isLoggedIn && (
            <NavLink to="/my-posts" className="nav-link" onClick={() => onNavClick("/my-posts")}>
              My Posts
            </NavLink>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/dashboard"
                className="nav-link"
                onClick={() => onNavClick("/dashboard")}
              >
                Dashboard
              </NavLink>
              <NavLink to="/add" className="nav-link" onClick={() => onNavClick("/add")}>
                Add
              </NavLink>
              <NavLink to="/update" className="nav-link" onClick={() => onNavClick("/update")}>
                Manage
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDE BUTTONS ================= */}
      <div className="nav-right">
        {/* Desktop buttons */}
        <div className="nav-desktop-actions">
          {!isLoggedIn ? (
            <>
              <NavLink to="/signup" className="nav-btn outline" onClick={() => onNavClick("/signup")}>
                Sign Up
              </NavLink>
              <NavLink to="/login" className="nav-btn solid" onClick={() => onNavClick("/login")}>
                Login
              </NavLink>
            </>
          ) : (
            <>
              {isUser && (
                <NavLink to="/cart" className="nav-btn cart" onClick={() => onNavClick("/cart")}>
                  Cart
                </NavLink>
              )}
              <NavLink to="/logout" className="nav-btn danger" onClick={() => onNavClick("/logout")}>
                Logout
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <div className={`nav-mobile-menu ${mobileOpen ? "open" : ""}`}>
        <NavLink to="/home" className="nav-link" onClick={() => onNavClick("/home")}>
          Home
        </NavLink>

        {!isAdmin && (
          <NavLink to="/games" className="nav-link" onClick={() => onNavClick("/games")}>
            Games
          </NavLink>
        )}

        <NavLink to="/feed" className="nav-link" onClick={() => onNavClick("/feed")}>
          NewsFeed
        </NavLink>

        {isUser && (
          <NavLink to="/profile" className="nav-link" onClick={() => onNavClick("/profile")}>
            Profile
          </NavLink>
        )}

        {isLoggedIn && (
          <NavLink to="/my-posts" className="nav-link" onClick={() => onNavClick("/my-posts")}>
            My Posts
          </NavLink>
        )}

        {isAdmin && (
          <>
            <NavLink to="/dashboard" className="nav-link" onClick={() => onNavClick("/dashboard")}>
              Dashboard
            </NavLink>
            <NavLink to="/add" className="nav-link" onClick={() => onNavClick("/add")}>
              Add
            </NavLink>
            <NavLink to="/update" className="nav-link" onClick={() => onNavClick("/update")}>
              Manage
            </NavLink>
          </>
        )}

        <div className="nav-mobile-actions">
          {!isLoggedIn ? (
            <>
              <NavLink
                to="/signup"
                className="nav-btn outline"
                onClick={() => onNavClick("/signup")}
              >
                Sign Up
              </NavLink>
              <NavLink
                to="/login"
                className="nav-btn solid"
                onClick={() => onNavClick("/login")}
              >
                Login
              </NavLink>
            </>
          ) : (
            <>
              {isUser && (
                <NavLink to="/cart" className="nav-btn cart" onClick={() => onNavClick("/cart")}>
                  Cart
                </NavLink>
              )}
              <NavLink
                to="/logout"
                className="nav-btn danger"
                onClick={() => onNavClick("/logout")}
              >
                Logout
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Overlay to close menu when tapping outside */}
      {mobileOpen && <div className="nav-overlay" onClick={closeMobile} />}
    </nav>
  );
};

export default Nav;