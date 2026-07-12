"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/RoleGuard";

export default function OnboardDriverPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("Class A");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/drivers/", {
        name: name.trim(),
        license_number: licenseNumber.trim(),
        license_category: licenseCategory.trim(),
        license_expiry_date: licenseExpiryDate,
        contact_number: contactNumber.trim(),
      });
      router.push("/dashboard/drivers");
    } catch (err: any) {
      setError(err.message || "Failed to onboard driver.");
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["Fleet Manager", "Safety Officer"]}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="page-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h1 className="page-title">Onboard Driver Profile</h1>
            <p className="page-subtitle">Add a new driver profile and document compliance</p>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="table-container" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Driver Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. DL-9834571"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">License Category</label>
                <select
                  className="form-control"
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value)}
                >
                  <option value="Class A">Class A (Commercial/Semi)</option>
                  <option value="Class B">Class B (Heavy Truck/Bus)</option>
                  <option value="Class C">Class C (Light Vehicle/Van)</option>
                  <option value="Regular">Regular Class</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={licenseExpiryDate}
                  onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +1 (555) 123-4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/dashboard/drivers")}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Onboarding..." : "Onboard Driver"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
