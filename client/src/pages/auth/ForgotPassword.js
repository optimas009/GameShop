import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../services/AuthFetch";
import "../../css/Signup-Login.css";

const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  //Popup 
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [nextRoute, setNextRoute] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const pending = location.state?.email;
    if (pending) setEmail(String(pending).trim().toLowerCase());
  }, [location.state]);

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

    // Routes that need email passed
    if ((route === "/reset-password" || route === "/verify") && e) {
      navigate(route, { replace: true, state: { email: e } });
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

  const handleSendCode = async () => {
    if (loading) return;

    setEmailError("");
    setMessage("");
    setMessageType("");
    setNextRoute("");
    setPendingEmail("");

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

      //Unverified -> backend resends verification code
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

      //go reset page after OK
      openPopup(
        "success",
        data.message || "If this email exists, a reset code was sent.",
        "/reset-password",
        cleanEmail
      );
    } catch {
      openPopup("error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="auth-container">

      {/*  modal popup */}
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
        <h1>Forgot Password</h1>

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

          <small className="password-hint">
            We will send a 6-digit reset code to your email.
          </small>
        </div>

        <button onClick={handleSendCode} className="subbox" type="button" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Code"}
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

export default ForgotPassword;
