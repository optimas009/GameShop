import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Signup-Login.css";

const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const validatePassword = (pw) => {
  const password = String(pw || "");

  if (password.length < 6) return "Password must be at least 6 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least 1 uppercase letter";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least 1 special character";
  if (/(.)\1\1/.test(password))
    return "Password cannot contain 3 consecutive identical characters (e.g., aaa, 111)";
  return "";
};

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [passTouched, setPassTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  const handleEmailChange = (val) => {
    setEmail(val);

    if (/[A-Z]/.test(val)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }

    setEmailError(val && !isValidEmail(val) ? "Please enter a valid email address" : "");
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (!passTouched) setPassTouched(true);

    if (!val) {
      setPassError("");
      return;
    }
    setPassError(validatePassword(val));
  };

  const handleRegister = async () => {
    if (!name.trim()) return alert("Name is required");

    const cleanEmail = String(email || "").trim().toLowerCase();

    if (/[A-Z]/.test(email)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }

    const pwMsg = validatePassword(password);
    if (pwMsg) {
      setPassTouched(true);
      setPassError(pwMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert(data.message || "Code sent to your email");

      // ✅ go to verify page with email (NO sessionStorage)
      navigate("/verify", { replace: true, state: { email: cleanEmail } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup">
        <h1>Signup</h1>

        <div className="input-group">
          <input
            className="sgbox"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name"
          />
        </div>

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
            autoComplete="new-password"
          />
          {passTouched && passError && <span className="error-msg">{passError}</span>}
          {(!passTouched || !passError) && (
            <small className="password-hint">
              Must be 6+ chars, 1 uppercase, 1 special, no “aaa/111”.
            </small>
          )}
        </div>

        <button onClick={handleRegister} className="subbox" type="button" disabled={loading}>
          {loading ? "Sending..." : "SignUp"}
        </button>

        <button
          onClick={() => navigate("/login")}
          className="subbox"
          type="button"
          disabled={loading}
          style={{ marginTop: 0, background: "#111", border: "1px solid #333" }}
        >
          Already have account? Login
        </button>
      </div>
    </div>
  );
};

export default Signup;
