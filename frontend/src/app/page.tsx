import Link from "next/link";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem", fontWeight: "800" }}>TransitOps</h1>
      <p style={{ fontSize: "1.25rem", color: "#94a3b8", maxWidth: "600px", marginBottom: "2rem" }}>
        Smart Transport Operations Platform. Manage your fleet, vehicle maintenance, drivers, and trips all in one place.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link href="/login" style={{ background: "#6366f1", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "600" }}>
          Log In
        </Link>
        <Link href="/login?register=true" style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "600" }}>
          Create Account
        </Link>
      </div>
    </div>
  );
}
