"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="dashboard-wrapper">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </RoleGuard>
  );
}
