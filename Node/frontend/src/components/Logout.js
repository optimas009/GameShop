import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";


const Logout = () => {

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/home", { replace: true });
        },[navigate, location]);


};

export default Logout;
