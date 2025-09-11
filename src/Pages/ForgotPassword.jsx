import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Forgot.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";

const BASE = "http://localhost:5000"; // 👈 adjust if needed

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = request code, 2 = reset
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // step 2
  const [otp, setOtp] = useState(Array(6).fill(""));
  const otpRefs = useRef([]);
  const [pwd, setPwd] = useState("");
  const [cpwd, setCpwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0); // resend timer

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  function handleOtpChange(i, val) {
    const v = val.replace(/\D/g, "").slice(0, 1); // only digit
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpPaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    const last = Math.min(text.length - 1, 5);
    otpRefs.current[last]?.focus();
    e.preventDefault();
  }

  async function handleRequestCode(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BASE}/forgot-password`, { email });
      alert("If the email exists, a 6-digit code has been sent.");
      setStep(2);
      setCountdown(60); // 60s before resend
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not send code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await axios.post(`${BASE}/forgot-password`, { email });
      alert("A new code has been sent (if the email exists).");
      setCountdown(60);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Resend failed. Try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return alert("Enter the 6-digit code.");
    if (pwd.length < 6) return alert("Password must be at least 6 characters.");
    if (pwd !== cpwd) return alert("Passwords do not match.");

    setLoading(true);
    try {
      await axios.post(`${BASE}/reset-password`, {
        email,
        otp: code,
        newPassword: pwd,
      });
      alert("Password updated successfully. Please login.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Reset failed. Check the code and try again.");
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

          {step === 1 ? (
            <>
              <h2>Forgot Password</h2>
              <p className="forgot-note">
                Enter your email. We’ll send a 6-digit code to reset your password.
              </p>
              <form onSubmit={handleRequestCode} className="forgot-form">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Code"}
                </button>
              </form>
              <p className="switch-auth">
                Remembered it? <Link to="/">Back to Login</Link>
              </p>
            </>
          ) : (
            <>
              <h2>Verify & Reset</h2>
              <p className="forgot-note">Enter the 6-digit code sent to <b>{email}</b></p>

              <form onSubmit={handleReset} className="forgot-form">
                <div
                  className="otp-inputs"
                  onPaste={handleOtpPaste}
                  aria-label="One-time code input"
                >
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      ref={(el) => (otpRefs.current[i] = el)}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="password-field">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="New password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="peek"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="password-field">
                  <input
                    type={showCpwd ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={cpwd}
                    onChange={(e) => setCpwd(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="peek"
                    onClick={() => setShowCpwd((s) => !s)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showCpwd ? "Hide" : "Show"}
                  </button>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  title={countdown > 0 ? `You can resend in ${countdown}s` : "Resend code"}
                >
                  {resending
                    ? "Resending..."
                    : countdown > 0
                    ? `Resend in ${countdown}s`
                    : "Resend Code"}
                </button>
              </form>

              <p className="switch-auth">
                Used the wrong email?{" "}
                <button
                  className="linklike"
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp(Array(6).fill(""));
                    setPwd("");
                    setCpwd("");
                  }}
                >
                  Change email
                </button>
                .
              </p>
              <p className="switch-auth">
                Back to <Link to="/">Login</Link>
              </p>
            </>
          )}
        </div>

        <div className="login-right">
          <h1>{step === 1 ? "RESET YOUR PASSWORD" : "CHECK YOUR INBOX"}</h1>
          <p>
            {step === 1
              ? "We’ll email a verification code."
              : "Enter the code, then set your new password."}
          </p>
        </div>
      </div>
    </div>
  );
}
