import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthFetch from "./AuthFetch";

const AdminComponent = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const res = await AuthFetch("/me"); // keep normal 401 handling here

        if (!res || res.status !== 200) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const me = await res.json();
        setIsAdmin(me.role === "admin");
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []); // ✅ run once on mount

  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/home" replace />;
  if (loading) return null;

  return isAdmin ? <Outlet /> : <Navigate to="/games" replace />;
};

export default AdminComponent;
