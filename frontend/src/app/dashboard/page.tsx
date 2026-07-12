"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setRole(localStorage.getItem("userRole"));
    setEmail(localStorage.getItem("userEmail"));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <h2 className="sidebar-title">TransitOps</h2>
        <nav>
          <ul className="sidebar-nav">
            <li>
              <a href="#" className="sidebar-link active">Dashboard</a>
            </li>
            <li>
              <a href="#" className="sidebar-link">Vehicles</a>
            </li>
            <li>
              <a href="#" className="sidebar-link">Drivers</a>
            </li>
            <li>
              <a href="#" className="sidebar-link">Trips</a>
            </li>
          </ul>
        </nav>
        <button 
          onClick={handleLogout}
          style={{ marginTop: "4rem", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", width: "100%" }}
        >
          Log Out
        </button>
      </aside>

      <main className="dashboard-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Operations Dashboard</h1>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Welcome back, {email || "User"} ({role || "Guest"})</p>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Vehicles</p>
            <h3 className="stat-value">12</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active Drivers</p>
            <h3 className="stat-value">8</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">Trips in Progress</p>
            <h3 className="stat-value">3</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">Maintenance Alerts</p>
            <h3 className="stat-value" style={{ color: "#f59e0b" }}>1</h3>
          </div>
        </section>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", padding: "1.5rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>System Status</h2>
          <p style={{ color: "#94a3b8" }}>
            This is the initial commit of the TransitOps platform. Backend integration is ready, database models are initialized, and basic authentication is supported.
          </p>
        </div>
      </main>
    </div>
  );
}
