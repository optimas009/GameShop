import { Navigate, Outlet } from "react-router-dom";

const AdminComponent = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  if (!token) return <Navigate to="/home" replace />;
  return isAdmin ? <Outlet /> : <Navigate to="/games" replace />;
};

export default AdminComponent;
