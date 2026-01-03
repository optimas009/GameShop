import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Signup-Login.css";

const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");

  const navigate = useNavigate();

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
    const cleanEmail = String(email || "").trim().toLowerCase();

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

    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (
        response.status === 403 &&
        String(result.message || "").toLowerCase().includes("verify")
      ) {
        alert(result.message || "Please verify your email first");
        navigate("/verify", { replace: true, state: { email: cleanEmail } });
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert(result.message || "Invalid email or password");
      return;
    }

    localStorage.setItem("user", JSON.stringify(result.user));
    localStorage.setItem("token", result.token);

    navigate("/home", { replace: true });
  };

  return (
    <div className="auth-container">
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
          />
          {passError && <span className="error-msg">{passError}</span>}
        </div>

        <button onClick={datasshow} className="subbox" type="button">
          Login
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="subbox"
          type="button"
          style={{ marginTop: 0, background: "#111", border: "1px solid #333" }}
        >
          Create account
        </button>
      </div>
    </div>
  );
};

export default Login;
