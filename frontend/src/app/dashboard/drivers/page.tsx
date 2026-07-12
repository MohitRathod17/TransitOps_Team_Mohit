"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Driver {
  id: number;
  user_id: number | null;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: string;
}

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [minSafetyScore, setMinSafetyScore] = useState("");

  const canManageDrivers = ["Fleet Manager", "Safety Officer"].includes(user?.role?.name || "");

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/drivers/?";
      if (filterStatus) url += `status=${encodeURIComponent(filterStatus)}&`;
      if (minSafetyScore) url += `min_safety_score=${encodeURIComponent(minSafetyScore)}&`;
      
      const data = await api.get<Driver[]>(url);
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filterStatus, minSafetyScore]);

  const handleSuspend = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to suspend driver ${name}?`)) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err: any) {
      alert(err.message || "Failed to suspend driver.");
    }
  };

  const isExpired = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    // set hours to 0 to compare dates accurately
    expiry.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return expiry < today;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Profiles</h1>
          <p className="page-subtitle">Onboard, track licenses, and monitor driver safety performance</p>
        </div>
        {canManageDrivers && (
          <Link href="/dashboard/drivers/new" className="btn btn-primary w-auto">
            👤 Onboard Driver
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-input">
          <label className="form-label">Status</label>
          <select 
            className="form-control" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="filter-input">
          <label className="form-label">Min Safety Score</label>
          <input 
            type="number" 
            placeholder="e.g. 80" 
            className="form-control"
            value={minSafetyScore}
            onChange={(e) => setMinSafetyScore(e.target.value)}
            min="0"
            max="100"
          />
        </div>

        <button className="btn btn-secondary w-auto" onClick={fetchDrivers}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: "200px" }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>License Number</th>
                <th>Category</th>
                <th>Expiry Date</th>
                <th>Contact</th>
                <th>Safety Score</th>
                <th>Status</th>
                {canManageDrivers && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={canManageDrivers ? 8 : 7} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No drivers registered.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => {
                  const licenseExpired = isExpired(d.license_expiry_date);
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: "bold" }}>{d.name}</td>
                      <td>{d.license_number}</td>
                      <td>{d.license_category}</td>
                      <td style={{ color: licenseExpired ? "var(--color-danger)" : "inherit" }}>
                        {d.license_expiry_date} {licenseExpired && "⚠️ (Expired)"}
                      </td>
                      <td>{d.contact_number}</td>
                      <td>
                        <span style={{ 
                          fontWeight: "bold", 
                          color: Number(d.safety_score) >= 90 ? "var(--color-success)" : Number(d.safety_score) >= 75 ? "var(--color-warning)" : "var(--color-danger)"
                        }}>
                          {d.safety_score}/100
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${d.status.toLowerCase().replace(" ", "")}`}>
                          {d.status}
                        </span>
                      </td>
                      {canManageDrivers && (
                        <td>
                          {d.status !== "Suspended" && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
                              onClick={() => handleSuspend(d.id, d.name)}
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
