import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    adminCode: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!form.name || !form.email || !form.password) {
      alert("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // Prepare payload for API
      const payload = {
        FullName: form.name,
        UserName: form.email,
        Password: form.password,
        AdminId: form.adminCode ? parseInt(form.adminCode) : 0, // Convert adminCode to number or default to 0
      };

      // Make API call to register user
      const res = await axios.post("http://localhost:5000/create-user", payload);

      // Check if registration was successful
      if (res.status === 200 || res.status === 201) {
        alert(`Account created successfully for ${form.name}!`);
        setForm({ name: "", email: "", password: "", adminCode: "" }); // Reset form
        navigate("/login"); // Navigate to login page
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert(
        err.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        {/* Left Side - Logo + Heading */}
        <div className="login-left">
          <div className="logo-container">
            <img src={logo1} alt="Logo 1" className="auth-logo" />
            <img src={logo2} alt="Logo 2" className="auth-logo" />
          </div>
          <h2 className="app-heading">TASK MANAGEMENT WEB APP</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={set("name")}
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={set("email")}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={set("password")}
              required
            />

            <input
              type="text"
              placeholder="Admin Code (optional)"
              value={form.adminCode}
              onChange={set("adminCode")}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="switch-auth">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </div>

        {/* Right Side - Welcome Message */}
        <div className="login-right">
          <h1>JOIN US!</h1>
          <p>Create your account and start managing your tasks effectively.</p>
        </div>
      </div>
    </div>
  );
}