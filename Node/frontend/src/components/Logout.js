import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ clear session
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // optional: notify app (AdminComponent / others)
    window.dispatchEvent(new Event("auth-changed"));

    // ✅ redirect
    navigate("/home", { replace: true });
  }, [navigate]);

  // ✅ must return something
  return null;
};

export default Logout;
