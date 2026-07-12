"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading TransitOps...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return (
      <div className="forbidden-container">
        <div className="forbidden-card">
          <div className="forbidden-icon">⚠️</div>
          <h2>Access Denied</h2>
          <p>Your current role (<strong>{user.role.name}</strong>) does not have authorization to access this panel.</p>
          <p>Please contact your administrator if you believe this is an error.</p>
          <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
