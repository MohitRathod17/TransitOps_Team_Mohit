"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Vehicle {
  id: number;
  registration_number: string;
  model: string;
  max_load_capacity: number;
  documents?: any[];
}

interface Driver {
  id: number;
  name: string;
  license_expiry_date: string;
  documents?: any[];
}

export default function PlanTripPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [plannedDistance, setPlannedDistance] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResources() {
      try {
        // Fetch only available vehicles
        const availVehicles = await api.get<Vehicle[]>("/vehicles/?status=Available");
        // Keep only vehicles with verified registration AND insurance
        const verifiedVehicles = availVehicles.filter(v => {
          const hasReg = v.documents?.some(doc => doc.document_type === "registration" && doc.verified_status === "Verified");
          const hasIns = v.documents?.some(doc => doc.document_type === "insurance" && doc.verified_status === "Verified");
          return hasReg && hasIns;
        });
        setVehicles(verifiedVehicles);

        // Fetch only available drivers
        const availDrivers = await api.get<Driver[]>("/drivers/?status=Available");
        // Keep only drivers with verified license
        const verifiedDrivers = availDrivers.filter(d => 
          d.documents?.some(doc => doc.document_type === "license" && doc.verified_status === "Verified")
        );
        
        // Extra compliance check: filter out expired driver licenses on client too
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const validDrivers = verifiedDrivers.filter(d => new Date(d.license_expiry_date) >= today);
        
        setDrivers(validDrivers);
      } catch (err: any) {
        setError("Failed to load available vehicles or drivers.");
      } finally {
        setFetchLoading(false);
      }
    }
    loadResources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate capacity
    const selectedVehicle = vehicles.find(v => v.id === parseInt(selectedVehicleId));
    if (!selectedVehicle) {
      setError("Please select a valid vehicle.");
      return;
    }

    const weight = parseFloat(cargoWeight);
    if (weight > selectedVehicle.max_load_capacity) {
      setError(`Cargo weight (${weight} kg) exceeds vehicle's maximum capacity (${selectedVehicle.max_load_capacity} kg).`);
      return;
    }

    setLoading(true);
    try {
      await api.post("/trips/", {
        source: source.trim(),
        destination: destination.trim(),
        vehicle_id: parseInt(selectedVehicleId),
        driver_id: parseInt(selectedDriverId),
        cargo_weight: weight,
        planned_distance: parseFloat(plannedDistance),
      });
      router.push("/dashboard/trips");
    } catch (err: any) {
      setError(err.message || "Failed to create trip.");
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="loading-container" style={{ minHeight: "300px" }}>
        <div className="spinner"></div>
        <p>Loading available fleet assets...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Plan New Delivery Trip</h1>
          <p className="page-subtitle">Assign available vehicles and drivers, check capacity and compliance</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {vehicles.length === 0 && (
        <div className="alert alert-danger">
          ⚠️ No vehicles are currently marked <strong>Available</strong>. Add a vehicle or complete existing trips first.
        </div>
      )}

      {drivers.length === 0 && (
        <div className="alert alert-danger">
          ⚠️ No drivers are currently marked <strong>Available</strong> with a valid license. Onboard a driver or complete existing trips first.
        </div>
      )}

      <div className="table-container" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source City / Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. New York, NY"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                disabled={vehicles.length === 0 || drivers.length === 0}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Destination City / Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Boston, MA"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                disabled={vehicles.length === 0 || drivers.length === 0}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Available Vehicle</label>
            <select
              className="form-control"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              required
              disabled={vehicles.length === 0 || drivers.length === 0}
            >
              <option value="">-- Choose Available Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.model} (Max: {v.max_load_capacity} kg)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Available Driver</label>
            <select
              className="form-control"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              required
              disabled={vehicles.length === 0 || drivers.length === 0}
            >
              <option value="">-- Choose Available Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (License Expiry: {d.license_expiry_date})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo Weight (kg)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 450"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                min="1"
                required
                disabled={vehicles.length === 0 || drivers.length === 0}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Planned Distance (km)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 350"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
                min="1"
                required
                disabled={vehicles.length === 0 || drivers.length === 0}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/dashboard/trips")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || vehicles.length === 0 || drivers.length === 0}
            >
              {loading ? "Creating..." : "Plan Trip (Draft)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
