"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Vehicle {
  id: number;
  registration_number: string;
  model: string;
}

interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  description: string;
  cost: number;
  start_date: string;
  end_date: string | null;
  status: string;
  vehicle: Vehicle | null;
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Maintenance form state
  const [showStartForm, setShowStartForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [formLoading, setFormLoading] = useState(false);

  // Close Maintenance inline form state
  const [closingLogId, setClosingLogId] = useState<number | null>(null);
  const [cost, setCost] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [closeLoading, setCloseLoading] = useState(false);

  const isFleetManager = user?.role?.name === "Fleet Manager";

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MaintenanceLog[]>("/maintenance/");
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load maintenance logs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      // Load vehicles that are available to put into shop
      const data = await api.get<Vehicle[]>("/vehicles/?status=Available");
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load available vehicles for maintenance", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (showStartForm) {
      fetchAvailableVehicles();
    }
  }, [showStartForm]);

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      await api.post("/maintenance/start", {
        vehicle_id: parseInt(selectedVehicleId),
        description: description.trim(),
        start_date: startDate,
      });
      setShowStartForm(false);
      setSelectedVehicleId("");
      setDescription("");
      fetchLogs();
    } catch (err: any) {
      setError(err.message || "Failed to start maintenance.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    setCloseLoading(true);
    setError(null);

    try {
      await api.post(`/maintenance/${id}/close`, {
        cost: parseFloat(cost),
        end_date: endDate,
      });
      setClosingLogId(null);
      setCost("");
      fetchLogs();
    } catch (err: any) {
      setError(err.message || "Failed to close maintenance log.");
    } finally {
      setCloseLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Center</h1>
          <p className="page-subtitle">Schedule repairs, track active logs, and audit service expenses</p>
        </div>
        {isFleetManager && !showStartForm && (
          <button className="btn btn-primary w-auto" onClick={() => setShowStartForm(true)} style={{ display: "flex", alignItems: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> Put Vehicle In Shop
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Start Maintenance Panel */}
      {showStartForm && (
        <div className="table-container" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--color-primary)" }}>Send Vehicle to Maintenance</h3>
          <form onSubmit={handleStartSubmit}>
            <div className="form-group">
              <label className="form-label">Select Available Vehicle</label>
              <select
                className="form-control"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} - {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Maintenance Details / Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 50k km Oil Change & Filter Replacement"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-secondary w-auto"
                onClick={() => setShowStartForm(false)}
                disabled={formLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-auto" disabled={formLoading || vehicles.length === 0}>
                {formLoading ? "Sending..." : "Confirm Maintenance"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close Maintenance Panel */}
      {closingLogId && (
        <div className="table-container" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--color-warning)" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--color-warning)" }}>Close Maintenance Log #{closingLogId}</h3>
          <form onSubmit={(e) => handleCloseSubmit(e, closingLogId)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Maintenance Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 250"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Completion/End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-secondary w-auto"
                onClick={() => setClosingLogId(null)}
                disabled={closeLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-auto" disabled={closeLoading}>
                {closeLoading ? "Saving..." : "Record Expense & Return to Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container" style={{ minHeight: "200px" }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Vehicle</th>
                <th>Description</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Cost</th>
                <th>Status</th>
                {isFleetManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={isFleetManager ? 8 : 7} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td>
                      {log.vehicle ? (
                        <strong>{log.vehicle.registration_number}</strong>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>Deleted</span>
                      )}
                    </td>
                    <td>{log.description}</td>
                    <td>{log.start_date}</td>
                    <td>{log.end_date || "—"}</td>
                    <td style={{ fontWeight: "bold" }}>
                      {log.cost > 0 ? `₹${Number(log.cost).toLocaleString()}` : "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${log.status === "Active" ? "inshop" : "completed"}`}>
                        {log.status}
                      </span>
                    </td>
                    {isFleetManager && (
                      <td>
                        {log.status === "Active" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", width: "auto" }}
                            onClick={() => {
                              setClosingLogId(log.id);
                              setCost("");
                            }}
                          >
                            Close Service
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
