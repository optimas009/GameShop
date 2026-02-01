import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // clear session
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // notify app )
    window.dispatchEvent(new Event("auth-changed"));

    // redirect
    navigate("/home", { replace: true });
  }, [navigate]);

  // return something
  return null;
};

export default Logout;
