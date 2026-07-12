"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                {isFleetManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={isFleetManager ? 9 : 8} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No vehicles found matching filters.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: "bold" }}>{v.registration_number}</td>
                    <td>{v.model}</td>
                    <td>{v.type}</td>
                    <td>{v.max_load_capacity} kg</td>
                    <td>{Number(v.odometer).toLocaleString()} km</td>
                    <td>${Number(v.acquisition_cost).toLocaleString()}</td>
                    <td>{v.region || "—"}</td>
                    <td>
                      <span className={`badge badge-${v.status.toLowerCase().replace(" ", "")}`}>
                        {v.status}
                      </span>
                    </td>
                    {isFleetManager && (
                      <td>
                        {v.status !== "Retired" && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
                            onClick={() => handleRetire(v.id, v.registration_number)}
                          >
                            Retire
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
