import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./CSS/Signup-Login.css";

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState(""); // Email validation state
    const [passError, setPassError] = useState("");   // Password validation state

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) navigate('/home');
    }, [navigate]);

    // Handle email validation as user types
    const handleEmailChange = (val) => {
        setEmail(val);
        if (val && !isValidEmail(val)) {
            setEmailError("Please enter a valid email address");
        } else {
            setEmailError("");
        }
    };

    // Handle password validation as user types (Signup requires 6 chars)
    const handlePasswordChange = (val) => {
        setPassword(val);
        if (val && val.length < 3) {
            setPassError("Password must be at least 3 characters");
        } else {
            setPassError("");
        }
    };

    const datasshow = async () => {
        // Final validation before sending to backend
        if (!isValidEmail(email)) {
            setEmailError("Enter a valid email address");
            return;
        }

        if (password.length < 6) {
            setPassError("At least 6 characters required");
            return;
        }

        let response = await fetch('http://localhost:5000/register', {
            method: 'post',
            body: JSON.stringify({ name, email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        let result = await response.json();

        if (response.status === 409) {
            alert(result.message);
            return;
        }

        if (!response.ok) {
            alert("Registration failed");
            return;
        }

        alert("Registered successfully. Please check your email to verify your account.");
        navigate('/login');
    };

    return (
        <div className="auth-container">
            <div className="signup">
                <h1>Signup</h1>
                
                <div className="input-group">
                    <input className="sgbox" type="text"
                        value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Name" />
                </div>

                <div className="input-group">
                    <input className={`sgbox ${emailError ? "input-error" : ""}`} type="email"
                        value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="Enter Email" />
                    {emailError && <span className="error-msg">{emailError}</span>}
                </div>

                <div className="input-group">
                    <input className={`sgbox ${passError ? "input-error" : ""}`} type="password"
                        value={password} onChange={(e) => handlePasswordChange(e.target.value)} placeholder="Enter Password" />
                    {passError && <span className="error-msg">{passError}</span>}
                </div>

                <button onClick={datasshow} className="subbox" type="button">SignUp</button>
            </div>
        </div>
    );
}

export default Signup;