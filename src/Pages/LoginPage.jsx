// src/Pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";

// ✅ import context
import { useUser } from "../context/UserContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUser(); // ✅ get setUser from context

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/login", {
        UserName: email,
        Password: pwd,
      });

      // ✅ Extract from response
      const userId = res?.data?.UserId;
      const username = res?.data?.UserName?.split("@")[0] || "User";
      const roleName = res?.data?.RoleName;

      // ✅ Save user globally in context
      setUser({
        userId,
        username,
        rolename: roleName,
      });

      // ✅ Navigate by role (no need to pass state anymore)
      if (roleName === "Admin") {
        navigate("/admin");
      } else if (roleName === "Member") {
        navigate("/user");
      } else {
        alert("Unknown role, please contact support.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-left">
          <div className="logo-container">
            <img src={logo1} alt="Logo 1" className="auth-logo" />
            <img src={logo2} alt="Logo 2" className="auth-logo" />
          </div>
          <h2>Login</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="email"
              placeholder="Username / Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <br></br>
           <br></br>
          <p className="switch-auth">
                  Don’t have an account? <Link to="/register">   Sign Up</Link>
          </p>
           <p className="switch-auth">
            Don’t you remember password? <Link to="/forgotpassword">Reset</Link>
          </p>
          
        </div>

              <div className="login-right">
     
          <h1>WELCOME BACK!</h1>
          <p>Our task management app</p>
        </div>
      </div>
    </div>
  );
}
