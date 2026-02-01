import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../../css/Signup-Login.css";

const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [loading, setLoading] = useState(false);

  //popup state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const [nextRoute, setNextRoute] = useState("");
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");

  const navigate = useNavigate();

  const openPopup = (type, msg, routeAfterOk = "", verifyEmail = "") => {
    setMessageType(type);
    setMessage(msg);
    setNextRoute(routeAfterOk);
    setPendingVerifyEmail(verifyEmail);
  };

  const handleOk = () => {
    const route = nextRoute;
    const vEmail = pendingVerifyEmail;

    setMessage("");
    setMessageType("");
    setNextRoute("");
    setPendingVerifyEmail("");

    // case: go to verify with email
    if (route === "/verify" && vEmail) {
      navigate("/verify", { replace: true, state: { email: vEmail } });
      return;
    }

    if (route) navigate(route, { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  const handleEmailChange = (val) => {
    setEmail(val);
    if (emailError) setEmailError("");

    if (/[A-Z]/.test(val)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (val && !isValidEmail(val)) setEmailError("Please enter a valid email address");
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (passError) setPassError("");
  };

  const datasshow = async () => {
    if (loading) return;

    const cleanEmail = String(email || "").trim().toLowerCase();

    setMessage("");
    setMessageType("");
    setNextRoute("");
    setPendingVerifyEmail("");

    if (/[A-Z]/.test(email)) {
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
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail, password }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If not verified → popup then go to verify after OK
        if (
          response.status === 403 &&
          String(result.message || "").toLowerCase().includes("verify")
        ) {
          openPopup(
            "error",
            result.message || "Please verify your email first",
            "/verify",
            cleanEmail
          );
          return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        openPopup("error", result.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("token", result.token);

      navigate("/home", { replace: true });
    } catch {
      openPopup("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/*popup */}
      {message && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${messageType}`}>
            <h3>{messageType === "success" ? "Success" : "Error"}</h3>
            <p>{message}</p>
            <button type="button" onClick={handleOk}>OK</button>
          </div>
        </div>
      )}

      <div className="signup">
        <h1>Login</h1>

        <div className="input-group">
          <input
            className={`sgbox ${emailError ? "input-error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Enter Email"
            autoComplete="username"
            disabled={loading}
          />
          {emailError && <span className="error-msg">{emailError}</span>}
        </div>

        <div className="input-group">
          <input
            className={`sgbox ${passError ? "input-error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Enter Password"
            autoComplete="current-password"
            disabled={loading}
          />
          {passError && <span className="error-msg">{passError}</span>}
        </div>

        <button onClick={datasshow} className="subbox" type="button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="subbox"
          type="button"
          disabled={loading}
          style={{ marginTop: 0, background: "#111", border: "1px solid #333" }}
        >
          Create account
        </button>

        <button
          onClick={() => navigate("/forgot-password")}
          className="Forgot"
          type="button"
          disabled={loading}
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
};

export default Login;
