"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M22 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);

import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchableResources = [
    { label: "Dashboard Overview", href: "/dashboard", category: "Navigation" },
    { label: "Vehicles Directory", href: "/dashboard/vehicles", category: "Fleet" },
    { label: "Add New Vehicle", href: "/dashboard/vehicles/new", category: "Fleet" },
    { label: "Drivers Directory", href: "/dashboard/drivers", category: "Personnel" },
    { label: "Add New Driver", href: "/dashboard/drivers/new", category: "Personnel" },
    { label: "Trips Log & Planner", href: "/dashboard/trips", category: "Operations" },
    { label: "Dispatch New Trip", href: "/dashboard/trips/new", category: "Operations" },
    { label: "Maintenance Logs", href: "/dashboard/maintenance", category: "Operations" },
    { label: "Reports & ROI Analytics", href: "/dashboard/reports", category: "Analytics" },
  ];

  const filteredResources = searchableResources.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard>
      <div className="dashboard-wrapper">
        <Sidebar />
        
        <main className="main-content" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          {/* Streamlined Compact Topbar */}
          <div className="dashboard-topbar" style={{ padding: "0.6rem 1.5rem", height: "48px", borderBottom: "1px solid var(--border-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Org Switcher */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                  className="btn btn-secondary w-auto" 
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", padding: "0.3rem 0.75rem", border: "1px solid var(--border-card)", height: "30px" }}
                >
                  <span style={{ fontWeight: 600 }}>TransitOps Global</span>
                  <ChevronDownIcon />
                </button>
                {showOrgDropdown && (
                  <div style={{ position: "absolute", top: "115%", left: 0, background: "var(--bg-sidebar)", border: "1px solid var(--border-card)", borderRadius: "8px", width: "160px", boxShadow: "var(--shadow-md)", padding: "4px", zIndex: 110 }}>
                    <div style={{ padding: "6px 8px", fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Organizations</div>
                    <div style={{ padding: "6px 8px", fontSize: "0.8rem", cursor: "pointer", borderRadius: "6px", backgroundColor: "rgba(99,102,241,0.1)", fontWeight: 600 }}>TransitOps Global</div>
                    <div style={{ padding: "6px 8px", fontSize: "0.8rem", cursor: "pointer", borderRadius: "6px" }} onClick={() => setShowOrgDropdown(false)}>Regional East</div>
                    <div style={{ padding: "6px 8px", fontSize: "0.8rem", cursor: "pointer", borderRadius: "6px" }} onClick={() => setShowOrgDropdown(false)}>Regional West</div>
                  </div>
                )}
              </div>

              {/* Real-time synchronization indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span style={{ position: "relative", display: "inline-flex", width: "6px", height: "6px" }}>
                  <span style={{ position: "absolute", display: "inline-flex", width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "var(--color-success)", opacity: 0.75 }}></span>
                  <span style={{ position: "relative", display: "inline-flex", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-success)" }}></span>
                </span>
                <span style={{ fontSize: "0.72rem" }}>Last synced: Just now</span>
              </div>
            </div>

            {/* Compact Search Bar with select dropdown options */}
            <div 
              style={{ position: "relative" }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            >
              <div className="dashboard-search-container" style={{ width: "260px", padding: "0.3rem 0.75rem", height: "30px" }}>
                <SearchIcon />
                <input 
                  type="text" 
                  placeholder="Search resources & select..." 
                  className="dashboard-search-input"
                  style={{ fontSize: "0.75rem" }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                />
              </div>
              {showSearchDropdown && (
                <div style={{ 
                  position: "absolute", 
                  top: "115%", 
                  right: 0, 
                  background: "var(--bg-sidebar)", 
                  border: "1px solid var(--border-card)", 
                  borderRadius: "8px", 
                  width: "280px", 
                  boxShadow: "var(--shadow-md)", 
                  padding: "6px", 
                  zIndex: 150,
                  maxHeight: "300px",
                  overflowY: "auto"
                }}>
                  <div style={{ padding: "6px 8px", fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-card)", marginBottom: "4px" }}>
                    Matching Resources ({filteredResources.length})
                  </div>
                  {filteredResources.length > 0 ? (
                    filteredResources.map((item) => (
                      <div 
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setSearchQuery("");
                          setShowSearchDropdown(false);
                        }}
                        style={{ 
                          padding: "8px", 
                          fontSize: "0.78rem", 
                          cursor: "pointer", 
                          borderRadius: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        className="search-dropdown-item-hover"
                      >
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", textTransform: "uppercase", background: "rgba(99,102,241,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                          {item.category}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px 8px", fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
                      No resources match "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Action Group */}
            <div className="dashboard-actions-group" style={{ gap: "0.75rem" }}>
              <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme" style={{ padding: "4px" }}>
                {theme === "light" ? <MoonIcon /> : <SunIcon />}
              </button>

              <button className="theme-toggle-btn" title="Notifications" style={{ position: "relative", padding: "4px" }}>
                <BellIcon />
                <span style={{ position: "absolute", top: "2px", right: "2px", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }}></span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary), var(--color-info))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.75rem" }}>
                  {user?.full_name ? user.full_name.split(" ").map(w => w[0]).join("") : "U"}
                </div>
              </div>
            </div>
          </div>

          {/* Page Container */}
          <div style={{ padding: "1.5rem", flexGrow: 1, backgroundColor: "var(--bg-app)" }}>
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
