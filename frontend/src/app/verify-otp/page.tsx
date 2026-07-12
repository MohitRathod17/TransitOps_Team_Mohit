"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M22 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);

export default function VerifyOtpPage() {
  const { verifyOtpAndLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await verifyOtpAndLogin(email.trim(), otpCode.trim());
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please fill in your email address first.");
      return;
    }
    setError(null);
    setSuccess(null);
    setResending(true);

    try {
      await api.post("/auth/resend-otp", { email: email.trim(), purpose: "verify" });
      setSuccess("A fresh 6-digit verification code has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Branding Pane */}
      <div className="auth-branding-pane">
        <Link href="/" className="auth-branding-logo">
          <LogoIcon /> TransitOps
        </Link>
        <div className="auth-branding-content">
          <h2 className="auth-branding-title">Safety & Identity Verification</h2>
          <p className="auth-branding-text">
            To safeguard our logistical operational database, all console user profiles must verify their active emails before accessing dispatch pipelines.
          </p>
        </div>
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
          TransitOps Integrity System
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Verify Email</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>Enter the 6-digit OTP code sent to your email</p>
            </div>
            <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Theme">
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                disabled={loading || !!searchParams.get("email")}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="otp">6-Digit Verification Code</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="form-control"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                disabled={loading}
                style={{ letterSpacing: "0.5rem", fontSize: "1.5rem", textAlign: "center", fontWeight: 700 }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
                fontSize: "inherit"
              }}
            >
              {resending ? "Resending..." : "Resend Code"}
            </button>
          </div>
          
          <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
            <Link href="/login" style={{ color: "var(--text-secondary)", textDecoration: "underline" }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
