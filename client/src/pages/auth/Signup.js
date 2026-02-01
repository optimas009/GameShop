import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../../css/Signup-Login.css";

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

  // Popup //
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [pendingEmail, setPendingEmail] = useState(""); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  const openPopup = (type, msg) => {
    setMessageType(type);
    setMessage(msg);
  };

  const handleOk = () => {
    const type = messageType;
    const emailToUse = pendingEmail;

    setMessage("");
    setMessageType("");
    setPendingEmail("");

    // only go verify after success
    if (type === "success" && emailToUse) {
      navigate("/verify", { replace: true, state: { email: emailToUse } });
    }
  };

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
    if (loading) return;

    setEmailError("");
   
    setMessage("");
    setMessageType("");
    setPendingEmail("");

    if (!name.trim()) {
      openPopup("error", "Name is required");
      return;
    }

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
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        openPopup("error", data.message || "Registration failed");
        return;
      }

     
      setPendingEmail(cleanEmail);
      openPopup("success", data.message || "Verification code sent to your email.");
    } catch (err) {
      openPopup("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      
      {/* POPUP  */}
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
