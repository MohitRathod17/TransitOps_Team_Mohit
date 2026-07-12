"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/RoleGuard";

export default function RegisterVehiclePage() {
  const router = useRouter();
  const [regNum, setRegNum] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("Truck");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [odometer, setOdometer] = useState("0");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [region, setRegion] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/vehicles/", {
        registration_number: regNum.trim(),
        model: model.trim(),
        type,
        max_load_capacity: parseFloat(maxCapacity),
        odometer: parseFloat(odometer),
        acquisition_cost: parseFloat(acquisitionCost),
        region: region.trim() || null,
      });
      router.push("/dashboard/vehicles");
    } catch (err: any) {
      setError(err.message || "Failed to register vehicle.");
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["Fleet Manager"]}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="page-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h1 className="page-title">Register New Vehicle</h1>
            <p className="page-subtitle">Add a new assets to the fleet registry</p>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="table-container" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Registration Number (Unique)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. VAN-05, TRUCK-102"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Model / Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ford Transit, Volvo FH16"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Semi">Semi</option>
                  <option value="Car">Car</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max Load Capacity (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 500, 20000"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Odometer (km)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 0, 15000"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Acquisition Cost ($)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 45000"
                  value={acquisitionCost}
                  onChange={(e) => setAcquisitionCost(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Region (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. North Region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/dashboard/vehicles")}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Registering..." : "Register Vehicle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
