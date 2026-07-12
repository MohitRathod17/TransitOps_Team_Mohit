"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface VehicleDocument {
  id: number;
  vehicle_id: number;
  document_type: string;
  file_path: string;
  verified_status: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: string;
  region: string | null;
  documents: VehicleDocument[];
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<number | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  const isFleetManager = user?.role?.name === "Fleet Manager";

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/vehicles/?";
      if (filterType) url += `type=${encodeURIComponent(filterType)}&`;
      if (filterStatus) url += `status=${encodeURIComponent(filterStatus)}&`;
      if (filterRegion) url += `region=${encodeURIComponent(filterRegion)}&`;
      
      const data = await api.get<Vehicle[]>(url);
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filterType, filterStatus, filterRegion]);

  const handleRetire = async (id: number, regNum: string) => {
    if (!confirm(`Are you sure you want to retire vehicle ${regNum}?`)) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err: any) {
      alert(err.message || "Failed to retire vehicle.");
    }
  };

  const toggleDocuments = (vehicleId: number) => {
    if (expandedVehicleId === vehicleId) {
      setExpandedVehicleId(null);
    } else {
      setExpandedVehicleId(vehicleId);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Registry</h1>
          <p className="page-subtitle">Manage company vehicles, operational states, and capacities</p>
        </div>
        {isFleetManager && (
          <Link href="/dashboard/vehicles/new" className="btn btn-primary w-auto">
            ➕ Register Vehicle
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-input">
          <label className="form-label">Vehicle Type</label>
          <select 
            className="form-control" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Semi">Semi</option>
            <option value="Car">Car</option>
          </select>
        </div>

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
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div className="filter-input">
          <label className="form-label">Region</label>
          <input 
            type="text" 
            placeholder="e.g. North, South" 
            className="form-control"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary w-auto" onClick={fetchVehicles}>
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
                <th>Registration</th>
                <th>Model</th>
                <th>Type</th>
                <th>Max Capacity</th>
                <th>Odometer</th>
                <th>Acquisition Cost</th>
                <th>Region</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No vehicles found matching filters.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <React.Fragment key={v.id}>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>{v.registration_number}</td>
                      <td>{v.model}</td>
                      <td>{v.type}</td>
                      <td>{v.max_load_capacity} kg</td>
                      <td>{Number(v.odometer).toLocaleString()} km</td>
                      <td>₹{Number(v.acquisition_cost).toLocaleString()}</td>
                      <td>{v.region || "—"}</td>
                      <td>
                        {(() => {
                          const hasReg = v.documents?.some(doc => doc.document_type === "registration" && doc.verified_status === "Verified");
                          const hasIns = v.documents?.some(doc => doc.document_type === "insurance" && doc.verified_status === "Verified");
                          const isVerified = hasReg && hasIns;
                          const statusToDisplay = isVerified ? v.status : "Unverified";
                          const badgeClass = isVerified ? v.status.toLowerCase().replace(" ", "") : "unverified";
                          return (
                            <span className={`badge badge-${badgeClass}`}>
                              {statusToDisplay}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
                            onClick={() => toggleDocuments(v.id)}
                          >
                            📄 Docs
                          </button>
                          {isFleetManager && v.status !== "Retired" && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
                              onClick={() => handleRetire(v.id, v.registration_number)}
                            >
                              Retire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedVehicleId === v.id && (
                      <tr style={{ background: "rgba(255, 255, 255, 0.01)" }}>
                        <td colSpan={9} style={{ padding: "1.5rem" }}>
                          <VehicleDocsPanel vehicle={v} onUpdate={fetchVehicles} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface VehicleDocsPanelProps {
  vehicle: Vehicle;
  onUpdate: () => void;
}

function VehicleDocsPanel({ vehicle, onUpdate }: VehicleDocsPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("registration");
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
      await api.post(`/documents/vehicles/${vehicle.id}/upload`, formData, true);
      setSelectedFile(null);
      setExpiryDate("");
      // Reset input value manually if needed
      const fileInput = document.getElementById(`file-input-${vehicle.id}`) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const docTypes = [
    { key: "registration", label: "Vehicle Registration" },
    { key: "insurance", label: "Insurance Policy" }
  ];

  return (
    <div style={{ padding: "1.5rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-md)" }}>
      <h4 style={{ marginBottom: "1rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>📄</span> Document Vault — {vehicle.registration_number}
      </h4>
      
      {error && <div className="alert alert-danger" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
        {/* Document list */}
        <div>
          <h5 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>Current Documents</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {docTypes.map((type) => {
              const doc = vehicle.documents?.find(d => d.document_type === type.key);
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
                <option value="registration">Vehicle Registration</option>
                <option value="insurance">Insurance Policy</option>
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
                id={`file-input-${vehicle.id}`}
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
