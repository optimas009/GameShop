import { NavLink } from "react-router-dom";
import "./CSS/Nav.css";

const Nav = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!token;
  const isAdmin = user?.role === "admin";

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <span className="nav-logo">🎮 GameShop</span>

        <NavLink to="/home" className="nav-link">Home</NavLink>
        <NavLink to="/games" className="nav-link">Games</NavLink>

        {isLoggedIn && isAdmin && (
          <>
            <NavLink to="/add" className="nav-link">Add</NavLink>
            <NavLink to="/update" className="nav-link">Manage</NavLink>
            <NavLink to="/profile" className="nav-link">Profile</NavLink>

          </>
        )}

        {isLoggedIn && !isAdmin && (
          <NavLink to="/profile" className="nav-link">Profile</NavLink>
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
            {/* ✅ Cart on right, left of Logout */}
            <NavLink to="/cart" className="nav-btn cart">Cart</NavLink>
            <NavLink to="/logout" className="nav-btn danger">Logout</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Nav;
