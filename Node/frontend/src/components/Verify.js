import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CSS/Signup-Login.css";

const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const pending = location.state?.email;
    if (pending) setEmail(String(pending).trim().toLowerCase());
  }, [location.state]);

  const handleEmailChange = (val) => {
    setEmail(val);
    if (emailError) setEmailError("");

    if (/[A-Z]/.test(val)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (val && !isValidEmail(val)) setEmailError("Please enter a valid email address");
  };

  const handleVerify = async () => {
    setEmailError("");
    setCodeError("");

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanCode = String(code || "").trim();

    if (/[A-Z]/.test(email)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!/^\d{6}$/.test(cleanCode)) {
      setCodeError("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCodeError(data.message || "Invalid code");
        return;
      }

      alert(data.message || "Email verified successfully");
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setEmailError("");

    const cleanEmail = String(email || "").trim().toLowerCase();

    if (/[A-Z]/.test(email)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/resend-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      alert(data.message || "Verification code resent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup">
        <h1>Verify Email</h1>

        <div className="input-group">
          <input
            className={`sgbox ${emailError ? "input-error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Enter Email"
          />
          {emailError && <span className="error-msg">{emailError}</span>}
          <small className="password-hint">Enter the 6-digit code sent to your email.</small>
        </div>

        <div className="input-group">
          <input
            className={`sgbox ${codeError ? "input-error" : ""}`}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
          />
          {codeError && <span className="error-msg">{codeError}</span>}
        </div>

        <button onClick={handleVerify} className="subbox" type="button" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          onClick={handleResend}
          className="subbox"
          type="button"
          disabled={loading}
          style={{ marginTop: 0, background: "#111", border: "1px solid #333" }}
        >
          Resend Code
        </button>

        <button
          onClick={() => navigate("/login")}
          className="subbox"
          type="button"
          disabled={loading}
          style={{ marginTop: 0, background: "#111", border: "1px solid #333" }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default Verify;
