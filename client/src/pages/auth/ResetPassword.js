import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../services/AuthFetch";

import "../../css/Signup-Login.css";

const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  // Popup 
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [nextRoute, setNextRoute] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const stEmail = location.state?.email;

    //if user did not come from forgot-password flow, redirect
    if (!stEmail) {
      navigate("/home", { replace: true });
      return;
    }
    setEmail(String(stEmail).trim().toLowerCase());
  }, [location.state, navigate]);

  const openPopup = (type, msg, routeAfterOk = "", emailAfterOk = "") => {
    setMessageType(type);
    setMessage(msg);
    setNextRoute(routeAfterOk);
    setPendingEmail(emailAfterOk);
  };

  const handleOk = () => {
    const route = nextRoute;
    const e = pendingEmail;

    setMessage("");
    setMessageType("");
    setNextRoute("");
    setPendingEmail("");

    if (!route) return;


    if (route === "/verify" && e) {
      navigate("/verify", { replace: true, state: { email: e } });
      return;
    }

    navigate(route, { replace: true });
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (emailError) setEmailError("");

    if (/[A-Z]/.test(val)) {
      setEmailError("Email must be all lowercase (no capital letters)");
      return;
    }
    if (val && !isValidEmail(val)) setEmailError("Please enter a valid email address");
  };

  const handleReset = async () => {
    if (loading) return;

    setEmailError("");
    setCodeError("");
    setPasswordError("");

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanCode = String(code || "").trim();
    const cleanPassword = String(newPassword || "");

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
    if (!cleanPassword) {
      setPasswordError("Enter your new password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          newPassword: cleanPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || "Invalid or expired reset code";


        if (msg.toLowerCase().includes("password")) {
          setPasswordError(msg);
        } else {
          setCodeError(msg);
        }

        openPopup("error", msg);
        return;
      }

      openPopup("success", data.message || "Password reset successful. Please login.", "/login");
    } catch {
      openPopup("error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;

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
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      //verify 
      if (res.status === 403 && data.reason === "NOT_VERIFIED") {
        openPopup(
          "error",
          data.message || "Your email is not verified. Verification code was sent again.",
          "/verify",
          cleanEmail
        );
        return;
      }

      if (!res.ok) {
        openPopup("error", data.message || "Please wait before requesting another code.");
        return;
      }

      openPopup("success", data.message || "If this email exists, a reset code was sent.");
    } catch {
      openPopup("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/*Popup  */}
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
        <h1>Reset Password</h1>

        <div className="input-group">
          <input
            className={`sgbox ${emailError ? "input-error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Enter Email"
            disabled={loading}
          />
          {emailError && <span className="error-msg">{emailError}</span>}
          <small className="password-hint">Enter the email you used to request the code.</small>
        </div>

        <div className="input-group">
          <input
            className={`sgbox ${codeError ? "input-error" : ""}`}
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (codeError) setCodeError("");
            }}
            placeholder="6-digit code"
            disabled={loading}
            inputMode="numeric"
            maxLength={6}
          />
          {codeError && <span className="error-msg">{codeError}</span>}
        </div>

        <div className="input-group">
          <input
            className={`sgbox ${passwordError ? "input-error" : ""}`}
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            placeholder="New Password"
            disabled={loading}
          />
          {passwordError && <span className="error-msg">{passwordError}</span>}
          <small className="password-hint">
            Must follow your password rules (min 6, 1 uppercase, 1 special, no 3 repeats).
          </small>
        </div>

        <button onClick={handleReset} className="subbox" type="button" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
