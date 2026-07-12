"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const ActiveRoutesMap = dynamic(() => import("@/components/ActiveRoutesMap"), {
  ssr: false,
  loading: () => <div style={{ height: '180px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>Loading Active Routes...</div>
});

interface KPIs {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization: number;
  delayed_trips: number;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  cargo_weight: number;
  planned_distance: number;
  status: string;
  revenue?: number;
  vehicle: { registration_number: string } | null;
  driver: { name: string } | null;
  source_lat?: number | null;
  source_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
}

// Sparkline Component
function Sparkline({ points, strokeColor }: { points: string; strokeColor: string }) {
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ height: "24px", width: "100%", opacity: 0.8 }}>
      <path d={points} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ChartPoint {
  date: string;
  day: string;
  value: number;
}

interface ChartData {
  utilization_trend: ChartPoint[];
  fuel_costs: ChartPoint[];
}

const fallbackChartData: ChartData = {
  utilization_trend: [
    { date: "", day: "Mon", value: 23.0 },
    { date: "", day: "Tue", value: 40.0 },
    { date: "", day: "Wed", value: 29.0 },
    { date: "", day: "Thu", value: 47.7 },
    { date: "", day: "Fri", value: 70.8 },
    { date: "", day: "Sat", value: 60.0 },
    { date: "", day: "Sun", value: 88.5 }
  ],
  fuel_costs: [
    { date: "", day: "Mon", value: 12000.0 },
    { date: "", day: "Tue", value: 16500.0 },
    { date: "", day: "Wed", value: 9000.0 },
    { date: "", day: "Thu", value: 14250.0 },
    { date: "", day: "Fri", value: 17250.0 },
    { date: "", day: "Sat", value: 11250.0 },
    { date: "", day: "Sun", value: 18750.0 }
  ]
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable tasks state
  const [tasks, setTasks] = useState<{ id: number, text: string, done: boolean, type: string }[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // Mock feed log
  const feedEvents = [
    { time: "10 mins ago", text: "Vehicle TRUCK-84 departed source location", type: "info" },
    { time: "25 mins ago", text: "Trip Route #402 successfully marked COMPLETED", type: "success" },
    { time: "1 hour ago", text: "New preventive maintenance scheduled for SEMI-09", type: "maintenance" },
    { time: "2 hours ago", text: "Delayed alert: VAN-12 slowed down on Route 5", type: "warning" },
  ];

  useEffect(() => {
    async function loadDashboardData(silent = false) {
      if (!silent) setLoading(true);
      
      const [kpiData, tripData, activeTripsData, chartResponse] = await Promise.allSettled([
        api.get<KPIs>("/reports/dashboard-kpis"),
        api.get<Trip[]>("/trips/"),
        api.get<Trip[]>("/trips/?status=Dispatched"),
        api.get<ChartData>("/reports/dashboard-charts"),
      ]);

      if (kpiData.status === "fulfilled") {
        setKpis(kpiData.value);
      }

      if (tripData.status === "fulfilled") {
        setRecentTrips(tripData.value.slice(-5).reverse());
      }
      
      if (activeTripsData.status === "fulfilled") {
        setActiveTrips(activeTripsData.value);
      }

      if (chartResponse.status === "fulfilled") {
        setChartData(chartResponse.value);
      }

      if (!silent) setLoading(false);
    }

    loadDashboardData();

    // Setup 5-second polling interval for real-time updates
    const intervalId = setInterval(() => {
      loadDashboardData(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const savedTasks = localStorage.getItem("dashboard_tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks([
        { id: 1, text: "Approve Route 12 fuel dispatch", done: false, type: "approval" },
        { id: 2, text: "Schedule inspection for Van FORD-20", done: false, type: "maintenance" },
        { id: 3, text: "Audit driver David's expiring CDL license", done: false, type: "alert" },
        { id: 4, text: "Confirm completed trip cargo logs", done: true, type: "task" }
      ]);
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("dashboard_tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText,
      done: false,
      type: "task"
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Loading TransitOps Platform...</p>
      </div>
    );
  }

  const utilization = kpis?.fleet_utilization || 0;
  const healthScore = 94; // AI-Powered Score

  const charts = chartData || fallbackChartData;

  // 1. Fleet Utilization Trend line path calculations
  const utilizationPoints = (charts.utilization_trend || []).map((pt, idx) => {
    const x = 30 + idx * 75;
    const y = 150 - (pt.value / 100) * 130;
    return { x, y };
  });

  const linePath = utilizationPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = utilizationPoints.length > 0
    ? `${linePath} L ${utilizationPoints[utilizationPoints.length - 1].x},150 L ${utilizationPoints[0].x},150 Z`
    : '';

  const lastPoint = utilizationPoints[utilizationPoints.length - 1] || { x: 480, y: 35 };

  const avgUtilization = charts.utilization_trend && charts.utilization_trend.length > 0
    ? (charts.utilization_trend.reduce((sum, pt) => sum + pt.value, 0) / charts.utilization_trend.length).toFixed(1)
    : "78.4";

  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  // 2. Weekly Fuel Cost margins bar charts calculations
  const fuelCostsList = charts.fuel_costs || [];
  const maxFuelCost = Math.max(...fuelCostsList.map(pt => pt.value), 20000);
  const totalWeeklyFuelCost = fuelCostsList.reduce((sum, pt) => sum + pt.value, 0);

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
  };

  const fuelBars = fuelCostsList.map((pt, idx) => {
    const x = 50 + idx * 60;
    const height = (pt.value / maxFuelCost) * 130;
    const y = 150 - height;
    return {
      x,
      y,
      height,
      width: 20,
      value: pt.value,
      day: pt.day
    };
  });

  return (
    <div>
      {/* 1. Intelligent Command Center Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", fontWeight: 700 }}>Intelligent Command Center</span>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--text-secondary)", opacity: 0.5 }}></span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>System Status: Nominal</span>
          </div>
          <h1 className="page-title" style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.25rem", letterSpacing: "-0.02em" }}>
            Welcome, {user?.full_name || "Fleet Operator"}
          </h1>
        </div>

        {/* Command center quick statuses */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", minWidth: "90px" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Trips Active</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-primary)" }}>{kpis?.active_trips ?? 0}</span>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", minWidth: "90px" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Delayed Routes</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: (kpis?.delayed_trips ?? 0) > 0 ? "var(--color-danger)" : "var(--text-secondary)" }}>
              {kpis?.delayed_trips ?? 0}
            </span>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", minWidth: "90px" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Weather Info</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Sunny, 32°C</span>
          </div>
        </div>
      </div>

      {/* 2. Standout AI-Powered Fleet Health Score Banner */}
      <div style={{ display: "flex", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(14, 165, 233, 0.08))", border: "1px solid var(--border-card)", borderRadius: "12px", padding: "1.25rem", gap: "1.5rem", marginBottom: "1.5rem", alignItems: "center" }}>
        {/* SVG Health circular Gauge */}
        <div style={{ position: "relative", width: "70px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="70" height="70" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-card)" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - healthScore} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", fontSize: "0.95rem", fontWeight: 800 }}>{healthScore}%</div>
        </div>

        {/* AI Recommendations */}
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)" }}>AI-Powered Health Score</span>
            <span style={{ fontSize: "0.65rem", background: "rgba(99, 102, 241, 0.15)", color: "var(--color-primary)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>RECOMMENDATIONS ACTIVE</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.8rem", display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ color: "var(--color-warning)" }}>✦</span>
              <span style={{ color: "var(--text-secondary)" }}>Two vehicles are approaching scheduled mileage thresholds.</span>
            </div>
            <div style={{ fontSize: "0.8rem", display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ color: "var(--color-warning)" }}>✦</span>
              <span style={{ color: "var(--text-secondary)" }}>Weekly fuel logs indicate 8% volume growth vs. averages.</span>
            </div>
            <div style={{ fontSize: "0.8rem", display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ color: "var(--color-warning)" }}>✦</span>
              <span style={{ color: "var(--text-secondary)" }}>Driver allocation can be optimized for Route 12.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Refined Compact KPIs Grid */}
      <div className="kpis-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Fleet Utilization */}
        <div className="kpi-card" style={{ padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-title" style={{ fontSize: "0.68rem" }}>Fleet Utilization</span>
            <span className="trend-indicator trend-up" style={{ fontSize: "0.7rem" }}>+2.4%</span>
          </div>
          <span className="kpi-value" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0" }}>{utilization}%</span>
          <Sparkline points="M0,15 Q25,8 50,12 T100,2" strokeColor="var(--color-success)" />
        </div>

        {/* Active Vehicles */}
        <div className="kpi-card" style={{ padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-title" style={{ fontSize: "0.68rem" }}>Active Vehicles</span>
            <span className="trend-indicator trend-up" style={{ fontSize: "0.7rem" }}>+12%</span>
          </div>
          <span className="kpi-value" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0" }}>{kpis?.active_vehicles}</span>
          <Sparkline points="M0,20 Q25,14 50,18 T100,5" strokeColor="var(--color-success)" />
        </div>

        {/* Available Vehicles */}
        <div className="kpi-card" style={{ padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-title" style={{ fontSize: "0.68rem" }}>Available Vehicles</span>
            <span className="trend-indicator trend-down" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>0</span>
          </div>
          <span className="kpi-value" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0" }}>{kpis?.available_vehicles}</span>
          <Sparkline points="M0,10 H100" strokeColor="var(--text-secondary)" />
        </div>

        {/* Drivers On Duty */}
        <div className="kpi-card" style={{ padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-title" style={{ fontSize: "0.68rem" }}>Drivers On Duty</span>
            <span className="trend-indicator trend-up" style={{ fontSize: "0.7rem" }}>+4%</span>
          </div>
          <span className="kpi-value" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0" }}>{kpis?.drivers_on_duty}</span>
          <Sparkline points="M0,12 Q25,5 50,10 T100,8" strokeColor="var(--color-success)" />
        </div>

        {/* Vehicles in Shop */}
        <div className="kpi-card" style={{ padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-title" style={{ fontSize: "0.68rem" }}>In Shop Maintenance</span>
            <span className="trend-indicator trend-down" style={{ fontSize: "0.7rem", color: "var(--color-warning)" }}>-1</span>
          </div>
          <span className="kpi-value" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0" }}>{kpis?.vehicles_in_maintenance}</span>
          <Sparkline points="M0,5 Q25,20 50,8 T100,18" strokeColor="var(--color-warning)" />
        </div>

        {/* Operational Cost Ratio */}
        <div className="kpi-card" style={{ padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-title" style={{ fontSize: "0.68rem" }}>Operational Cost Ratio</span>
            <span className="trend-indicator trend-down" style={{ fontSize: "0.7rem", color: "var(--color-danger)" }}>+1.5%</span>
          </div>
          <span className="kpi-value" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0" }}>34.2%</span>
          <Sparkline points="M0,10 Q25,12 50,22 T100,28" strokeColor="var(--color-danger)" />
        </div>
      </div>

      {/* 4. Operations Intelligence Workspace (Two Column Layout) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Left Column: Live GPS Route Map & Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Live GPS Fleet Map Representation */}
          <div className="table-container" style={{ padding: "1.25rem", margin: 0 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Live GPS Routing Map</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Simulated regional dispatch tracks and node statuses</p>
            </div>
            
            <div style={{ border: "1px solid var(--border-card)", borderRadius: "8px", background: "var(--bg-app)", padding: "1rem", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ActiveRoutesMap trips={activeTrips} />
            </div>
          </div>

          {/* Operations Feed */}
          <div className="table-container" style={{ padding: "1.25rem", margin: 0 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Operations Feed</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Live dispatch network audits and alerts</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {recentTrips.length > 0 ? (
                recentTrips.map((trip) => {
                  let text = "";
                  let type = "info";
                  let time = "Just now";

                  if (trip.status === "Completed") {
                    text = `Trip #${trip.id} completed. Generated ₹${trip.revenue ?? 0} in revenue.`;
                    type = "success";
                  } else if (trip.status === "Dispatched") {
                    text = `Vehicle ${trip.vehicle?.registration_number || "N/A"} dispatched to ${trip.destination} with driver ${trip.driver?.name || "N/A"}.`;
                    type = "info";
                  } else if (trip.status === "Cancelled") {
                    text = `Route assignment for Trip #${trip.id} to ${trip.destination} was cancelled.`;
                    type = "danger";
                  } else {
                    text = `New dispatch route draft prepared from ${trip.source} to ${trip.destination}.`;
                    type = "warning";
                  }

                  return (
                    <div key={trip.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px solid var(--border-card)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: type === "success" ? "var(--color-success)" : type === "danger" ? "var(--color-danger)" : type === "warning" ? "var(--color-warning)" : "var(--color-primary)"
                        }}></span>
                        <span style={{ fontSize: "0.8rem" }}>{text}</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{time}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "12px", fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>
                  No active operational feed events available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Tasks, Checklist & Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Operational Checklist */}
          <div className="table-container" style={{ padding: "1.25rem", margin: 0 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Today's Tasks & Checklist</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Action items requiring immediate operations sign-off</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tasks.map((task) => (
                <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "0.5rem", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    style={{ marginTop: "3px", cursor: "pointer" }}
                  />
                  <div style={{ flexGrow: 1, cursor: "pointer" }} onClick={() => toggleTask(task.id)}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--text-secondary)" : "var(--text-primary)" }}>
                      {task.text}
                    </div>
                    <span style={{
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: task.type === "alert" ? "var(--color-danger)" : task.type === "maintenance" ? "var(--color-warning)" : "var(--color-primary)",
                      opacity: task.done ? 0.5 : 1
                    }}>
                      {task.type}
                    </span>
                  </div>
                  <button onClick={() => removeTask(task.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "1.2rem", padding: "0 5px", lineHeight: 1 }}>&times;</button>
                </div>
              ))}
            </div>
            
            <form onSubmit={addTask} style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                value={newTaskText} 
                onChange={(e) => setNewTaskText(e.target.value)} 
                placeholder="Add a new task..." 
                style={{ flexGrow: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-card)", background: "var(--bg-app)", color: "var(--text-primary)", fontSize: "0.8rem" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto" }}>Add</button>
            </form>
          </div>

          {/* Quick Actions Panel */}
          <div className="table-container" style={{ padding: "1.25rem", margin: 0 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Quick Actions</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Frequently accessed operational workflows</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Link href="/dashboard/trips/new" className="btn btn-primary" style={{ padding: "0.5rem", fontSize: "0.8rem", height: "36px" }}>
                Plan Trip
              </Link>
              <Link href="/dashboard/vehicles/new" className="btn btn-secondary" style={{ padding: "0.5rem", fontSize: "0.8rem", height: "36px", border: "1px solid var(--border-card)" }}>
                Register Vehicle
              </Link>
              <Link href="/dashboard/drivers/new" className="btn btn-secondary" style={{ padding: "0.5rem", fontSize: "0.8rem", height: "36px", border: "1px solid var(--border-card)" }}>
                Onboard Driver
              </Link>
              <Link href="/dashboard/reports" className="btn btn-secondary" style={{ padding: "0.5rem", fontSize: "0.8rem", height: "36px", border: "1px solid var(--border-card)" }}>
                ROI Audit
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Logistics Chart Visualizations (Refined & Compact Side-by-Side) */}
      <div className="charts-grid" style={{ gap: "1.5rem" }}>
        {/* Utilization Area Chart */}
        <div className="chart-card" style={{ padding: "1.25rem", minHeight: "260px" }}>
          <div className="chart-header" style={{ marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Fleet Utilization Trend</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Average weekly cargo payload utilization %</p>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{currentMonthName} Average: {avgUtilization}%</span>
          </div>
          
          <div style={{ width: "100%", overflow: "hidden" }}>
            <svg viewBox="0 0 500 170" style={{ width: "100%", height: "160px" }}>
              {/* Horizontal grid lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="65" x2="480" y2="65" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="110" x2="480" y2="110" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="150" x2="480" y2="150" stroke="var(--border-card)" strokeWidth="1" />
              
              {/* Area path */}
              {areaPath && <path d={areaPath} fill="rgba(99, 102, 241, 0.08)" />}
              {/* Line path */}
              {linePath && <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              
              {/* Data point circle */}
              {lastPoint && <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="var(--color-primary)" stroke="var(--bg-card)" strokeWidth="1.5" />}
              
              {/* Axis labels */}
              {charts.utilization_trend.map((pt, i) => (
                <text key={i} x={30 + i * 75} y="162" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">{pt.day}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Weekly Activities Bar Chart */}
        <div className="chart-card" style={{ padding: "1.25rem", minHeight: "260px" }}>
          <div className="chart-header" style={{ marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Weekly Fuel Cost Margins</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total fuel costs (₹) logged against routes</p>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>This Week: ₹{formatRupees(totalWeeklyFuelCost)} / Target: Under ₹20k</span>
          </div>

          <div style={{ width: "100%", overflow: "hidden" }}>
            <svg viewBox="0 0 500 170" style={{ width: "100%", height: "160px" }}>
              {/* Horizontal grid lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="65" x2="480" y2="65" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="110" x2="480" y2="110" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="150" x2="480" y2="150" stroke="var(--border-card)" strokeWidth="1" />

              {/* Bar Rectangles */}
              {fuelBars.map((bar, i) => (
                <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx="3" fill="var(--color-primary)" opacity="0.85" />
              ))}

              {/* Axis labels */}
              {fuelBars.map((bar, i) => (
                <text key={i} x={bar.x + 10} y="162" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">{bar.day}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
