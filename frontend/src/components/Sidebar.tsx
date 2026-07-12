"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Vehicles", href: "/dashboard/vehicles", icon: "🚚" },
    { name: "Drivers", href: "/dashboard/drivers", icon: "👤" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>📦</span> TransitOps
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user.full_name}</span>
            <span className="user-role">{user.role.name}</span>
          </div>
          <button className="btn btn-secondary w-full" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      )}
    </aside>
  );
}
