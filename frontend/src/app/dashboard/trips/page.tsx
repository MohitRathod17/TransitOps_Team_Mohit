"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => <div style={{ height: '400px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

interface Vehicle {
  id: number;
  registration_number: string;
  odometer: number;
}

interface Driver {
  id: number;
  name: string;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  planned_distance: number;
  source_lat?: number | null;
  source_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  actual_distance: number | null;
  status: string;
  revenue: number;
  fuel_consumed: number | null;
  final_odometer: number | null;
  dispatched_at: string | null;
  completed_at: string | null;
  vehicle: Vehicle | null;
  driver: Driver | null;
}

export default function TripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMapTrip, setSelectedMapTrip] = useState<Trip | null>(null);

  // Completion Form State
  const [completingTripId, setCompletingTripId] = useState<number | null>(null);
  const [finalOdometer, setFinalOdometer] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");
  const [revenue, setRevenue] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Trip[]>("/trips/");
      setTrips(data);
    } catch (err: any) {
      setError(err.message || "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDispatch = async (id: number) => {
    try {
      await api.post(`/trips/${id}/dispatch`, null);
      fetchTrips();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch trip.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this trip?")) return;
    try {
      await api.post(`/trips/${id}/cancel`, null);
      fetchTrips();
    } catch (err: any) {
      alert(err.message || "Failed to cancel trip.");
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    setCompleteLoading(true);
    setError(null);

    try {
      await api.post(`/trips/${id}/complete`, {
        final_odometer: parseFloat(finalOdometer),
        fuel_consumed: parseFloat(fuelConsumed),
        revenue: parseFloat(revenue || "0"),
      });
      setCompletingTripId(null);
      setFinalOdometer("");
      setFuelConsumed("");
      setRevenue("");
      fetchTrips();
    } catch (err: any) {
      setError(err.message || "Failed to complete trip.");
    } finally {
      setCompleteLoading(false);
    }
  };

  const startCompletion = (trip: Trip) => {
    setCompletingTripId(trip.id);
    setFinalOdometer((Number(trip.vehicle?.odometer || 0) + Number(trip.planned_distance)).toString());
    setFuelConsumed((Number(trip.planned_distance) * 0.12).toFixed(1)); // mock reasonable fuel (12L per 100km)
    setRevenue((Number(trip.planned_distance) * 25).toString()); // mock revenue (₹25 per km)
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Management</h1>
          <p className="page-subtitle">Plan routes, dispatch vehicles, and track delivery logs</p>
        </div>
        <Link href="/dashboard/trips/new" className="btn btn-primary w-auto" style={{ display: "flex", alignItems: "center" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg> Plan Trip
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Completion Overlay Panel */}
      {completingTripId && (
        <div className="table-container" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--color-primary)" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--color-primary)" }}>Complete Trip #{completingTripId}</h3>
          <form onSubmit={(e) => handleCompleteSubmit(e, completingTripId)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Final Odometer Reading (km)</label>
                <input
                  type="number"
                  className="form-control"
                  value={finalOdometer}
                  onChange={(e) => setFinalOdometer(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  min="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Revenue Generated (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-secondary w-auto"
                onClick={() => setCompletingTripId(null)}
                disabled={completeLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-auto" disabled={completeLoading}>
                {completeLoading ? "Saving..." : "Submit Trip Logs"}
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
                <th>Trip ID</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo Weight</th>
                <th>Distance (Planned)</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No trips found in the records.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td style={{ fontWeight: "600" }}>
                      {t.source} &rarr; {t.destination}
                    </td>
                    <td>
                      {t.vehicle ? (
                        <span>{t.vehicle.registration_number}</span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>Deleted</span>
                      )}
                    </td>
                    <td>{t.driver ? t.driver.name : "Deleted"}</td>
                    <td>{t.cargo_weight} kg</td>
                    <td>
                      {t.actual_distance ? (
                        <span>{t.actual_distance} km <small style={{ color: "var(--text-secondary)" }}>({t.planned_distance} planned)</small></span>
                      ) : (
                        <span>{t.planned_distance} km</span>
                      )}
                    </td>
                    <td>₹{Number(t.revenue).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", width: "auto" }}
                          onClick={() => setSelectedMapTrip(t)}
                        >
                          View Map
                        </button>
                        {t.status === "Draft" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", width: "auto" }}
                            onClick={() => handleDispatch(t.id)}
                          >
                            Dispatch
                          </button>
                        )}
                        {t.status === "Dispatched" && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", width: "auto", backgroundColor: "var(--color-success)" }}
                              onClick={() => startCompletion(t)}
                            >
                              Complete
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", width: "auto" }}
                              onClick={() => handleCancel(t.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {t.status === "Completed" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            Completed ({t.completed_at?.substring(0, 10)})
                          </span>
                        )}
                        {t.status === "Cancelled" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-danger)" }}>
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedMapTrip && (
        <div className="map-panel-container" style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Map View: Trip #{selectedMapTrip.id}</h3>
            <button className="btn btn-secondary w-auto" onClick={() => setSelectedMapTrip(null)}>Close Map</button>
          </div>
          <TripMap trip={selectedMapTrip} />
        </div>
      )}
    </div>
  );
}
