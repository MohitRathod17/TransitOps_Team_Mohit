"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface FuelEfficiency {
  vehicle_id: number;
  registration_number: string;
  model: string;
  total_distance: number;
  total_fuel: number;
  efficiency: number;
}

interface VehicleROI {
  vehicle_id: number;
  registration_number: string;
  model: string;
  acquisition_cost: number;
  total_revenue: number;
  total_maintenance: number;
  total_fuel: number;
  roi: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"roi" | "efficiency">("roi");
  const [roiData, setRoiData] = useState<VehicleROI[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<FuelEfficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "roi") {
        const data = await api.get<VehicleROI[]>("/reports/vehicle-roi");
        setRoiData(data);
      } else {
        const data = await api.get<FuelEfficiency[]>("/reports/fuel-efficiency");
        setEfficiencyData(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get<Blob>("/reports/export-csv");
      
      // create client side download link
      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transitops_fleet_analytics_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Failed to export CSV: " + (err.message || err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Fleet Analytics</h1>
          <p className="page-subtitle">Track return on investment (ROI), efficiency indexes, and financial breakdowns</p>
        </div>
        <button className="btn btn-primary w-auto" onClick={handleExportCSV} style={{ display: "flex", alignItems: "center" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export Fleet Data (CSV)
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs Selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-card)", paddingBottom: "1px" }}>
        <button
          className={`btn w-auto`}
          style={{
            borderRadius: "8px 8px 0 0",
            backgroundColor: activeTab === "roi" ? "rgba(99, 102, 241, 0.15)" : "transparent",
            color: activeTab === "roi" ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: activeTab === "roi" ? "2px solid var(--color-primary)" : "none",
            padding: "0.75rem 1.5rem"
          }}
          onClick={() => setActiveTab("roi")}
        >
          Vehicle ROI Breakdown
        </button>
        <button
          className={`btn w-auto`}
          style={{
            borderRadius: "8px 8px 0 0",
            backgroundColor: activeTab === "efficiency" ? "rgba(99, 102, 241, 0.15)" : "transparent",
            color: activeTab === "efficiency" ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: activeTab === "efficiency" ? "2px solid var(--color-primary)" : "none",
            padding: "0.75rem 1.5rem"
          }}
          onClick={() => setActiveTab("efficiency")}
        >
          Fuel Efficiency Analytics
        </button>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: "200px" }}>
          <div className="spinner"></div>
        </div>
      ) : activeTab === "roi" ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Acquisition Cost</th>
                <th>Total Revenue</th>
                <th>Maintenance Costs</th>
                <th>Fuel Costs</th>
                <th>Net Income</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {roiData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No vehicle records found for ROI analysis.
                  </td>
                </tr>
              ) : (
                roiData.map((v) => {
                  const netIncome = v.total_revenue - (v.total_maintenance + v.total_fuel);
                  const roiPercent = (v.roi * 100).toFixed(2);
                  return (
                    <tr key={v.vehicle_id}>
                      <td>
                        <strong>{v.registration_number}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{v.model}</div>
                      </td>
                      <td>₹{Number(v.acquisition_cost).toLocaleString()}</td>
                      <td style={{ color: "var(--color-success)" }}>+₹{Number(v.total_revenue).toLocaleString()}</td>
                      <td style={{ color: "var(--color-danger)" }}>-₹{Number(v.total_maintenance).toLocaleString()}</td>
                      <td style={{ color: "var(--color-danger)" }}>-₹{Number(v.total_fuel).toLocaleString()}</td>
                      <td style={{ color: netIncome >= 0 ? "var(--color-success)" : "var(--color-danger)", fontWeight: "bold" }}>
                        {netIncome >= 0 ? "+" : ""}₹{Number(netIncome).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ 
                          fontWeight: "bold", 
                          color: v.roi > 0 ? "var(--color-success)" : v.roi < 0 ? "var(--color-danger)" : "inherit"
                        }}>
                          {roiPercent}%
                        </span>
                        <div style={{ width: "80px", height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", marginTop: "0.25rem" }}>
                          <div style={{ 
                            width: `${Math.min(Math.max(v.roi * 100, 0), 100)}%`, 
                            height: "100%", 
                            backgroundColor: v.roi >= 0 ? "var(--color-success)" : "var(--color-danger)" 
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Total Odometer Distance</th>
                <th>Total Fuel Logged</th>
                <th>Average Fuel Efficiency</th>
                <th>Performance Gauge</th>
              </tr>
            </thead>
            <tbody>
              {efficiencyData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No vehicle records found for fuel efficiency analysis.
                  </td>
                </tr>
              ) : (
                efficiencyData.map((v) => {
                  const efficiency = Number(v.efficiency).toFixed(2);
                  const isGood = v.efficiency >= 8; // standard threshold e.g. 8 km/L
                  return (
                    <tr key={v.vehicle_id}>
                      <td>
                        <strong>{v.registration_number}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{v.model}</div>
                      </td>
                      <td>{Number(v.total_distance).toLocaleString()} km</td>
                      <td>{Number(v.total_fuel).toLocaleString()} Liters</td>
                      <td style={{ fontWeight: "bold", color: "var(--text-primary)" }}>
                        {efficiency} km/L
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "120px", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ 
                              width: `${Math.min((v.efficiency / 15) * 100, 100)}%`, // map to 0-15 km/L gauge
                              height: "100%", 
                              backgroundColor: isGood ? "var(--color-success)" : "var(--color-warning)" 
                            }}></div>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {isGood ? "Efficient" : "Heavy Load / Wear"}
                          </span>
                        </div>
                      </td>
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
