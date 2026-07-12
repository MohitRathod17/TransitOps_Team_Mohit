"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface KPIs {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  drivers_on_duty: number;
  fleet_utilization: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const kpiData = await api.get<KPIs>("/reports/dashboard-kpis");
        setKpis(kpiData);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading TransitOps Dashboard...</p>
      </div>
    );
  }

  const utilization = kpis?.fleet_utilization || 0;
  const totalVehicles = (kpis?.active_vehicles || 0) + (kpis?.available_vehicles || 0) + (kpis?.vehicles_in_maintenance || 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.full_name}</h1>
          <p className="page-subtitle">Here is the operational overview for your transport fleet today</p>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "right" }}>
          Role: <strong style={{ color: "var(--color-primary)" }}>{user?.role.name}</strong>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPIs Summary Cards */}
      <div className="kpis-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="kpi-card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <span className="kpi-title">Fleet Utilization</span>
          <span className="kpi-value">{utilization}%</span>
          <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${utilization}%`, height: "100%", backgroundColor: "var(--color-primary)" }}></div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--color-ontrip)" }}>
          <span className="kpi-title">Active Vehicles (On Trip)</span>
          <span className="kpi-value">{kpis?.active_vehicles}</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--color-available)" }}>
          <span className="kpi-title">Available Vehicles</span>
          <span className="kpi-value">{kpis?.available_vehicles}</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--color-inshop)" }}>
          <span className="kpi-title">Vehicles In Shop</span>
          <span className="kpi-value">{kpis?.vehicles_in_maintenance}</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--color-info)" }}>
          <span className="kpi-title">Total Registered Drivers</span>
          <span className="kpi-value">{kpis?.drivers_on_duty}</span>
        </div>
      </div>

      {/* Main Analytics Panels */}
      <div className="charts-grid">
        {/* Fleet Composition Visual */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>🚚 Fleet Capacity Allocation</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total: {totalVehicles} Vehicles</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                <span>Active (On Trip)</span>
                <strong>{kpis?.active_vehicles} ({totalVehicles > 0 ? Math.round((kpis?.active_vehicles || 0) / totalVehicles * 100) : 0}%)</strong>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${totalVehicles > 0 ? (kpis?.active_vehicles || 0) / totalVehicles * 100 : 0}%`, height: "100%", backgroundColor: "var(--color-ontrip)" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                <span>Available</span>
                <strong>{kpis?.available_vehicles} ({totalVehicles > 0 ? Math.round((kpis?.available_vehicles || 0) / totalVehicles * 100) : 0}%)</strong>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${totalVehicles > 0 ? (kpis?.available_vehicles || 0) / totalVehicles * 100 : 0}%`, height: "100%", backgroundColor: "var(--color-available)" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                <span>In Maintenance (In Shop)</span>
                <strong>{kpis?.vehicles_in_maintenance} ({totalVehicles > 0 ? Math.round((kpis?.vehicles_in_maintenance || 0) / totalVehicles * 100) : 0}%)</strong>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${totalVehicles > 0 ? (kpis?.vehicles_in_maintenance || 0) / totalVehicles * 100 : 0}%`, height: "100%", backgroundColor: "var(--color-inshop)" }}></div>
              </div>
            </div>

            {/* Quick action panel inside dashboard */}
            <div style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-card)" }}>
              <h4 style={{ marginBottom: "0.75rem" }}>⚡ Quick Actions</h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link href="/dashboard/vehicles/new" className="btn btn-primary w-auto" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                  Register Vehicle
                </Link>
                <Link href="/dashboard/drivers/new" className="btn btn-secondary w-auto" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                  Onboard Driver
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Guidelines Panel */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>📋 Fleet & Driver Management</h3>
          </div>
          
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            <p>
              Welcome to the <strong>TransitOps Fleet and Driver Console</strong>. This dashboard provides you with high-level metrics about your assets and workforce.
            </p>
            
            <div style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-card)", borderRadius: "8px" }}>
              <h4 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>🚚 Vehicle Registry</h4>
              <span style={{ fontSize: "0.85rem" }}>
                Keep track of your fleet configuration, license plates, models, and maintenance status. You can register new transport assets and update their details as needed.
              </span>
            </div>

            <div style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-card)", borderRadius: "8px" }}>
              <h4 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>👤 Driver Directory</h4>
              <span style={{ fontSize: "0.85rem" }}>
                Monitor registered operators, licensing requirements, and active/inactive duty status. Add and configure profile credentials for drivers in your organization.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
