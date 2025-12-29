import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./CSS/Signup-Login.css";

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passError, setPassError] = useState(""); // ⬅️ New state for password error
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) navigate('/home');
    }, [navigate]);

    const handleEmailChange = (val) => {
        setEmail(val);
        if (val && !isValidEmail(val)) {
            setEmailError("Please enter a valid email address");
        } else {
            setEmailError("");
        }
    };

    // ⬅️ New handler for password validation
    const handlePasswordChange = (val) => {
        setPassword(val);
        if (val && val.length < 3) {
            setPassError("Password must be at least 3 characters");
        } else {
            setPassError("");
        }
    };

    const datasshow = async () => {
        // Validation checks before sending request
        if (!isValidEmail(email)) {
            setEmailError("Enter a valid email address");
            return;
        }

        if (password.length < 3) {
            setPassError("At least 3 characters required");
            return;
        }

        let response = await fetch("http://localhost:5000/login", {
            method: "post",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
        });

        let result = await response.json();

        if (!response.ok) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert(result.message || "Invalid email or password");
            return;
        }

        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("token", result.token);
        navigate("/home");
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
                    />
                    {emailError && <span className="error-msg">{emailError}</span>}
                </div>

                <div className="input-group">
                    <input 
                        className={`sgbox ${passError ? "input-error" : ""}`} // ⬅️ Conditional class
                        type="password"
                        value={password} 
                        onChange={(e) => handlePasswordChange(e.target.value)} // ⬅️ Updated handler
                        placeholder="Enter Password"
                    />
                    {/* ⬇️ Password Error message */}
                    {passError && <span className="error-msg">{passError}</span>}
                </div>

                <button onClick={datasshow} className="subbox" type="button">Login</button>
            </div>
        </div>
    );
}

export default Login;