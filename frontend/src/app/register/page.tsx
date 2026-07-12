"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M22 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);

const ROLES = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"];

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleName, setRoleName] = useState("Fleet Manager");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Local client side validates orgName and phoneNumber, and registers user via API
      await registerUser(email, password, fullName, roleName);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please check inputs.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Pane — Role Permissions Table */}
      <div className="auth-branding-pane" style={{ padding: "2.5rem 2rem", justifyContent: "center" }}>
        <Link href="/" className="auth-branding-logo">
          <LogoIcon /> TransitOps
        </Link>

        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem", letterSpacing: "-0.01em" }}>
            Role Access Permissions
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
            Your access is determined by the role you select below.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", color: "#94a3b8", fontWeight: 600 }}>Module</th>
                  <th style={{ textAlign: "center", padding: "0.5rem 0.6rem", color: "#94a3b8", fontWeight: 600 }}>Fleet Mgr</th>
                  <th style={{ textAlign: "center", padding: "0.5rem 0.6rem", color: "#94a3b8", fontWeight: 600 }}>Driver</th>
                  <th style={{ textAlign: "center", padding: "0.5rem 0.6rem", color: "#94a3b8", fontWeight: 600 }}>Safety Off.</th>
                  <th style={{ textAlign: "center", padding: "0.5rem 0.6rem", color: "#94a3b8", fontWeight: 600 }}>Fin. Analyst</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { mod: "Dashboard",       fm: "View", dr: "View",  so: "View",  fa: "View" },
                  { mod: "Vehicle Registry", fm: "Full", dr: "—",    so: "—",     fa: "View" },
                  { mod: "Drivers",          fm: "View", dr: "—",    so: "Full",  fa: "—"    },
                  { mod: "Trips",            fm: "View", dr: "Full",  so: "—",    fa: "View" },
                  { mod: "Maintenance",      fm: "Full", dr: "—",    so: "—",     fa: "View" },
                  { mod: "Fuel & Expenses",  fm: "—",    dr: "—",    so: "—",     fa: "Full" },
                  { mod: "Reports",          fm: "View", dr: "—",    so: "View",  fa: "Full" },
                  { mod: "Settings",         fm: "Full", dr: "—",    so: "—",     fa: "—"    },
                ].map((row, i) => {
                  const cell = (val: string) => (
                    <td key={val} style={{
                      textAlign: "center", padding: "0.5rem 0.6rem",
                      color: val === "Full" ? "#10b981" : val === "View" ? "#60a5fa" : "#475569",
                      fontWeight: val === "Full" ? 700 : 400,
                    }}>{val}</td>
                  );
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ padding: "0.5rem 0.6rem", color: "#e2e8f0", fontWeight: 500 }}>{row.mod}</td>
                      {cell(row.fm)}{cell(row.dr)}{cell(row.so)}{cell(row.fa)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "1rem" }}>
            Full = can create/edit/delete · View = read-only · — = no access
          </p>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-form-card" style={{ padding: "2rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Create Account</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>Set up your organization console account</p>
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
              <span>Account created successfully! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={loading || success}
                />
              </div>

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
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="orgName">Organization</label>
                <input
                  id="orgName"
                  type="text"
                  className="form-control"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Transit Global Inc."
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className="form-control"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={6}
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Organizational Role</label>
              <select
                id="role"
                className="form-control"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={loading || success}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || success} style={{ marginTop: "1rem" }}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
