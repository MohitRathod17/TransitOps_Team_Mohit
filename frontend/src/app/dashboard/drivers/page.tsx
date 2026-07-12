"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface DriverDocument {
  id: number;
  driver_id: number;
  document_type: string;
  file_path: string;
  verified_status: string;
}

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
  documents: DriverDocument[];
}

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<number | null>(null);

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
    expiry.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return expiry < today;
  };

  const toggleDocuments = (driverId: number) => {
    if (expandedDriverId === driverId) {
      setExpandedDriverId(null);
    } else {
      setExpandedDriverId(driverId);
    }
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No drivers registered.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => {
                  const licenseExpired = isExpired(d.license_expiry_date);
                  return (
                    <React.Fragment key={d.id}>
                      <tr>
                        <td style={{ fontWeight: "bold" }}>{d.name}</td>
                        <td>{d.license_number}</td>
                        <td>{d.license_category}</td>
                        <td style={{ color: licenseExpired ? "var(--color-danger)" : "inherit" }}>
                          {d.license_expiry_date} {licenseExpired && <span style={{ color: "var(--color-danger)", marginLeft: "8px" }}>(Expired)</span>}
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
                          {(() => {
                            const hasLicense = d.documents?.some(doc => doc.document_type === "license" && doc.verified_status === "Verified");
                            const displayStatus = hasLicense ? d.status : "Unverified";
                            const badgeClass = hasLicense ? d.status.toLowerCase().replace(" ", "") : "unverified";
                            return (
                              <span className={`badge badge-${badgeClass}`}>
                                {displayStatus}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
                              onClick={() => toggleDocuments(d.id)}
                            >
                              📄 Docs
                            </button>
                            {canManageDrivers && d.status !== "Suspended" && (
                              <button
                                className="btn btn-danger"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
                                onClick={() => handleSuspend(d.id, d.name)}
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedDriverId === d.id && (
                        <tr style={{ background: "rgba(255, 255, 255, 0.01)" }}>
                          <td colSpan={8} style={{ padding: "1.5rem" }}>
                            <DriverDocsPanel driver={d} onUpdate={fetchDrivers} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

interface DriverDocsPanelProps {
  driver: Driver;
  onUpdate: () => void;
}

function DriverDocsPanel({ driver, onUpdate }: DriverDocsPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("license");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", docType);
    if (expiryDate) {
      formData.append("expiry_date", expiryDate);
    }

    try {
      await api.post(`/documents/drivers/${driver.id}/upload`, formData, true);
      setSelectedFile(null);
      setExpiryDate("");
      const fileInput = document.getElementById(`file-input-d-${driver.id}`) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const docTypes = [
    { key: "license", label: "Driving License" }
  ];

  return (
    <div style={{ padding: "1.5rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-md)" }}>
      <h4 style={{ marginBottom: "1rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>👤</span> Document Vault — {driver.name}
      </h4>
      
      {error && <div className="alert alert-danger" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
        {/* Document list */}
        <div>
          <h5 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>Current Documents</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {docTypes.map((type) => {
              const doc = driver.documents?.find(d => d.document_type === type.key);
              return (
                <div key={type.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "var(--bg-app)", border: "1px solid var(--border-card)", borderRadius: "8px" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", display: "block" }}>{type.label}</span>
                    {doc ? (
                      <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                        <a href={`http://127.0.0.1:8000/${doc.file_path}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-info)", textDecoration: "underline", marginRight: "0.5rem" }}>
                          View Document File
                        </a>
                        {doc.expiry_date && (
                          <span style={{ color: "var(--text-secondary)" }}>
                            (Expires: {doc.expiry_date})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-danger)", marginTop: "4px", display: "block" }}>Not uploaded</span>
                    )}
                  </div>
                  <div>
                    {doc ? (
                      <span className={`badge badge-${doc.verified_status.toLowerCase()}`}>
                        {doc.verified_status}
                      </span>
                    ) : (
                      <span className="badge badge-draft">Missing</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Form */}
        <div style={{ borderLeft: "1px solid var(--border-card)", paddingLeft: "2rem" }}>
          <h5 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>Upload / Replace Document</h5>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "0.8rem" }}>Document Type</label>
              <select className="form-control" style={{ padding: "0.5rem" }} value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="license">Driving License</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label" style={{ fontSize: "0.8rem" }}>Expiry Date (Optional)</label>
              <input 
                type="date" 
                className="form-control" 
                value={expiryDate} 
                onChange={e => setExpiryDate(e.target.value)} 
                style={{ padding: "0.4rem 0.5rem", fontSize: "0.85rem" }} 
              />
            </div>
            
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <input 
                id={`file-input-d-${driver.id}`}
                type="file" 
                onChange={handleFileChange} 
                required 
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem", fontSize: "0.85rem", marginTop: "1rem" }} disabled={uploading || !selectedFile}>
              {uploading ? "Uploading file..." : "Upload Document"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
