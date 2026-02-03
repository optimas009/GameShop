import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";

import "../../css/Signup-Login.css";

// NO capitals + basic valid email format
const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const SecretAdminLogin = () => {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [loading, setLoading] = useState(false);

  //POPUP 
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [nextRoute, setNextRoute] = useState(""); 

  const openPopup = (type, msg, routeAfterOk = "") => {
    setMessageType(type);
    setMessage(msg);
    setNextRoute(routeAfterOk);
  };

  const handleOk = () => {
    const route = nextRoute;
    setMessage("");
    setMessageType("");
    setNextRoute("");
    if (route) navigate(route, { replace: true });
  };

  // if logged-in user is NOT admin -> send to /home
  useEffect(() => {
    const guardSecret = async () => {
      const token = localStorage.getItem("token");

      // Not logged in => allow admin login screen
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const res = await AuthFetch("/me", { skip401Handler: true });

        if (!res || res.status !== 200) {
          setChecking(false);
          return;
        }

        const me = await res.json();

        // admin -> go to admin panel
        if (me.role === "admin") {
          navigate("/update", { replace: true });
          return;
        }

        // logged-in but not admin 
        navigate("/home", { replace: true });
      } catch {
        navigate("/home", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    guardSecret();
  }, [navigate]);

  if (checking) return null;

  const handleEmailChange = (val) => {
    const v = val.trim();
    setEmail(v);
    setEmailError("");

    if (/[A-Z]/.test(v)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (v && !isValidEmail(v)) setEmailError("Please enter a valid email address");
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (passError) setPassError("");
  };

  const login = async () => {
    if (loading) return;

    const cleanEmail = email.trim();

    setEmailError("");
    setPassError("");

    if (/[A-Z]/.test(cleanEmail)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }

    if (!password) {
      setPassError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        //  alert with popup
        openPopup("error", data.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      
      

      
      navigate("/update", { replace: true });
    } catch {
      openPopup("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      
      {/* POPUP overlay */}
      {message && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${messageType}`}>
            <h3>{messageType === "success" ? "Success" : "Error"}</h3>
            <p>{message}</p>
            <button type="button" onClick={handleOk}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="signup">
        <h1>Admin Login</h1>

        <div className="input-group">
          <input
            className={`sgbox ${emailError ? "input-error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Email"
            autoComplete="username"
          />
          {emailError && <span className="error-msg">{emailError}</span>}
        </div>

        <div className="input-group">
          <input
            className={`sgbox ${passError ? "input-error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          {passError && <span className="error-msg">{passError}</span>}
        </div>

        <button className="subbox" type="button" onClick={login} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default SecretAdminLogin;
