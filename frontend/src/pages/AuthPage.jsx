// src/pages/AuthPage.jsx
// Responsibility: auth flow router — decides which auth screen to show.
// This is the ONLY auth page imported by App.jsx.
// It does NOT contain any form logic — that lives in pages/auth/*.
import { useState } from "react";
import LoginPage          from "./auth/LoginPage";
import SignupPage         from "./auth/SignupPage";
import OTPPage            from "./auth/OTPPage";
import ForgotPasswordPage from "./auth/ForgotPasswordPage";
import ResetPasswordPage  from "./auth/ResetPasswordPage";

// screen: "login" | "signup" | "otp" | "forgot" | "reset"
export default function AuthPage({ theme: T }) {
  const [screen,    setScreen]    = useState(() => {
    // If URL has ?token=, go straight to reset password
    return window.location.search.includes("token=") ? "reset" : "login";
  });
  const [otpEmail, setOtpEmail]   = useState("");

  const goOTP = (email) => { setOtpEmail(email); setScreen("otp"); };

  switch (screen) {
    case "signup":
      return <SignupPage theme={T} onSwitch={() => setScreen("login")} onNeedOTP={goOTP} />;
    case "otp":
      return <OTPPage    theme={T} email={otpEmail} onBack={() => setScreen("login")} />;
    case "forgot":
      return <ForgotPasswordPage theme={T} onBack={() => setScreen("login")} />;
    case "reset":
      return <ResetPasswordPage  theme={T} />;
    default:
      return <LoginPage  theme={T} onSwitch={(dest) => setScreen(dest || "signup")} onNeedOTP={goOTP} />;
  }
}
