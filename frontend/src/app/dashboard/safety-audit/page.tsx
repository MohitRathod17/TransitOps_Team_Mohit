"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";

interface DriverDocument {
  id: number;
  driver_id: number;
  driver_name: string;
  document_type: string;
  file_path: string;
  uploaded_at: string;
  verified_status: string;
}

interface VehicleDocument {
  id: number;
  vehicle_id: number;
  registration_number: string;
  model: string;
  document_type: string;
  file_path: string;
  uploaded_at: string;
  verified_status: string;
}

interface PendingDocs {
  driver_documents: DriverDocument[];
  vehicle_documents: VehicleDocument[];
}

export default function SafetyAuditPage() {
  const [docs, setDocs] = useState<PendingDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PendingDocs>("/documents/pending");
      setDocs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pending safety audit items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDocs();
  }, []);

  const handleAudit = async (type: "driver" | "vehicle", id: number, status: "Verified" | "Rejected") => {
    try {
      await api.post(`/documents/${type}/${id}/verify?status=${status}`, null);
      fetchPendingDocs();
    } catch (err: any) {
      alert(err.message || "Failed to audit document.");
    }
  };

  return (
    <RoleGuard allowedRoles={["Safety Officer", "Fleet Manager"]}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">🛡️ Safety compliance & Audits</h1>
            <p className="page-subtitle">Verify and sign driver driving licenses and vehicle insurance policies</p>
          </div>
          <button className="btn btn-secondary w-auto" onClick={fetchPendingDocs}>
            🔄 Refresh Queue
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading-container" style={{ minHeight: "300px" }}>
            <div className="spinner"></div>
            <p>Loading compliance verification queue...</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Driver Documents Table */}
            <div className="table-container">
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-card)", background: "rgba(255, 255, 255, 0.02)" }}>
                <h3 style={{ fontSize: "1.1rem" }}>👤 Driver Documents Pending Review ({docs?.driver_documents?.length || 0})</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Document Type</th>
                    <th>Upload Date</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!docs || docs.driver_documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                        All driver documents audited! No pending reviews.
                      </td>
                    </tr>
                  ) : (
                    docs.driver_documents.map((doc) => (
                      <tr key={doc.id}>
                        <td><strong>{doc.driver_name}</strong> (ID: {doc.driver_id})</td>
                        <td style={{ textTransform: "capitalize" }}>{doc.document_type.replace("_", " ")}</td>
                        <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                        <td>
                          <a href={`http://127.0.0.1:8000/${doc.file_path}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-info)", textDecoration: "underline" }}>
                            Open Document
                          </a>
                        </td>
                        <td>
                          <span className="badge badge-inshop">Pending Audit</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-primary w-auto"
                              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", backgroundColor: "var(--color-success)" }}
                              onClick={() => handleAudit("driver", doc.id, "Verified")}
                            >
                              Verify
                            </button>
                            <button
                              className="btn btn-danger w-auto"
                              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                              onClick={() => handleAudit("driver", doc.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Vehicle Documents Table */}
            <div className="table-container">
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-card)", background: "rgba(255, 255, 255, 0.02)" }}>
                <h3 style={{ fontSize: "1.1rem" }}>🚚 Vehicle Documents Pending Review ({docs?.vehicle_documents?.length || 0})</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehicle Details</th>
                    <th>Document Type</th>
                    <th>Upload Date</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!docs || docs.vehicle_documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                        All vehicle documents audited! No pending reviews.
                      </td>
                    </tr>
                  ) : (
                    docs.vehicle_documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.registration_number}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{doc.model} (ID: {doc.vehicle_id})</div>
                        </td>
                        <td style={{ textTransform: "capitalize" }}>{doc.document_type}</td>
                        <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                        <td>
                          <a href={`http://127.0.0.1:8000/${doc.file_path}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-info)", textDecoration: "underline" }}>
                            Open Document
                          </a>
                        </td>
                        <td>
                          <span className="badge badge-inshop">Pending Audit</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-primary w-auto"
                              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", backgroundColor: "var(--color-success)" }}
                              onClick={() => handleAudit("vehicle", doc.id, "Verified")}
                            >
                              Verify
                            </button>
                            <button
                              className="btn btn-danger w-auto"
                              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                              onClick={() => handleAudit("vehicle", doc.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </RoleGuard>
  );
}
