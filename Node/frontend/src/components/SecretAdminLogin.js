import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";
import "./CSS/Signup-Login.css";

// ✅ strict: NO capitals + basic valid email format
const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const SecretAdminLogin = () => {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true); // ✅ prevent UI flashing
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Guard: if logged-in user is NOT admin -> send to /home
  useEffect(() => {
    const guardSecret = async () => {
      const token = localStorage.getItem("token");

      // ✅ Not logged in => allow admin login screen
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const res = await AuthFetch("/me", { skip401Handler: true });

        // if token invalid, AuthFetch handles 401; just stop checking
        if (!res || res.status !== 200) {
          setChecking(false);
          return;
        }

        const me = await res.json();

        // ✅ already admin -> go to admin panel
        if (me.role === "admin") {
          navigate("/update", { replace: true });
          return;
        }

        // ✅ logged-in but not admin -> hide this page
        navigate("/home", { replace: true });
      } catch (err) {
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

    // clear previous errors while typing
    setEmailError("");

    // ✅ show special message if any capital exists
    if (/[A-Z]/.test(v)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }

    if (v && !isValidEmail(v)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (passError) setPassError(""); // clear error while typing
  };

  const login = async () => {
    const cleanEmail = email.trim();

    // ✅ frontend validation
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
      const res = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // ✅ IMPORTANT: do NOT clear token/user here
        alert(data.message || "Invalid credentials");
        return;
      }

      // ✅ On success, replace session with admin token/user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/update", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
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
