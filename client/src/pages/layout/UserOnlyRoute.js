import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthFetch from "../../services/AuthFetch";

const UserOnlyRoute = () => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAllowed(true); // not logged in = allow public routes
        setLoading(false);
        return;
      }

      try {
        const res = await AuthFetch("/me");
        if (!res || res.status !== 200) {
          setAllowed(true);
          return;
        }

        const me = await res.json();

        // if admin => block this route group
        if (me.role === "admin") {
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      } catch {
        setAllowed(true);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return null;
  return allowed ? <Outlet /> : <Navigate to="/home" replace />;
};

export default UserOnlyRoute;
