"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import FloorModal from "@/components/dashboard/FloorModal";

export default function FloorDetailClient({ floorId }: { floorId: string }) {
  const [floor, setFloor] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFloorAndUnits = async () => {
    setIsLoading(true);
    try {
      const [floorRes, unitsRes] = await Promise.all([
        api.get(`/floors/${floorId}`),
        api.get(`/units?floor=${floorId}&limit=100`)
      ]);
      if (floorRes.success) {
        setFloor(floorRes.data);
      }
      if (unitsRes.success) {
        setUnits(unitsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (floorId && floorId !== "new" && floorId !== "fallback") {
      fetchFloorAndUnits();
    } else {
      setIsLoading(false);
    }
  }, [floorId]);

  const handleSave = async (data: any) => {
    try {
      const r = await api.put(`/floors/${floorId}`, data);
      if (r.success) {
        fetchFloorAndUnits();
      }
    } catch (err) {
      console.error(err);
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!floor) {
    return (
      <div className="p-4 text-center">
        <h5 className="text-danger">Floor not found</h5>
        <Link href="/admin/floors" className="btn btn-outline-secondary btn-sm mt-3">
          Back to Floors
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ fontFamily: "var(--font-geist-sans)" }}>
      {/* Detail Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item">
                <Link href="/admin/floors" className="text-decoration-none text-muted">Floors Management</Link>
              </li>
              <li className="breadcrumb-item active fw-semibold text-dark" aria-current="page">
                {floor.floorName || `Floor ${floor.floorNumber}`}
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            Floor Details
          </h2>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1"
            style={{ fontSize: '0.8rem', borderRadius: '6px' }}
          >
            <i className="bi bi-pencil-square"></i> Edit
          </button>
          <Link href="/admin/floors" className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', borderRadius: '6px' }}>
            <i className="bi bi-arrow-left"></i> Back
          </Link>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        {/* Left Side: Floor Info Card */}
        <div className="col-lg-4 col-md-5 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column">
            {/* Image banner */}
            <div className="position-relative overflow-hidden rounded-3 mb-4" style={{ height: 180 }}>
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop"
                alt="Floor View" className="w-100 h-100" style={{ objectFit: "cover" }}
              />
              <div
                className="position-absolute bg-white px-3 py-1 shadow-sm d-flex align-items-center gap-2"
                style={{ bottom: 12, right: 12, borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: floor.status === "Active" ? "#10b981" : "#f59e0b", display: "inline-block" }}></span>
                <span className="text-dark">{floor.status || "Active"}</span>
              </div>
            </div>

            {/* Header info */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#e8f0fe', color: '#014aad', flexShrink: 0 }}>
                <i className="bi bi-layers-fill" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div className="text-truncate">
                <h5 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: '1rem' }}>
                  {floor.floorName || `Floor ${floor.floorNumber}`}
                </h5>
                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {floor.property?.propertyName || 'Property Name'}
                </div>
              </div>
            </div>

            <hr className="opacity-10" />

            {/* Attributes list */}
            <div className="d-flex flex-column">
              {[
                { label: "Total Capacity", value: `${(floor.totalSft || 0).toLocaleString()} SFT`, icon: "bi-aspect-ratio" },
                { label: "Occupied Space", value: `${(floor.occupiedSft || 0).toLocaleString()} SFT`, icon: "bi-building-fill" },
                { label: "Available Space", value: `${Math.max(0, (floor.totalSft || 0) - (floor.occupiedSft || 0)).toLocaleString()} SFT`, icon: "bi-check-circle-fill", cls: "text-success" },
                { label: "Property Owner", value: floor.assignedOwner?.ownerName || "Unassigned", icon: "bi-person-fill" },
                { label: "Floor Admin", value: floor.assignedAdmin?.name || "Unassigned", icon: "bi-person-badge-fill" },
                { label: "Floor Revenue", value: `₹${(floor.floorRevenue || 0).toLocaleString()}`, icon: "bi-currency-rupee" }
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  className="d-flex justify-content-between align-items-center py-2"
                  style={{ borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f1f5f9" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 6, color: '#014aad' }}
                    >
                      <i className={`bi ${row.icon}`} style={{ fontSize: "0.85rem" }}></i>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{row.label}</span>
                  </div>
                  <span className={`fw-bold text-dark text-end ${row.cls || ""}`} style={{ fontSize: '0.82rem', maxWidth: '55%' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Units Table & Summary cards */}
        <div className="col-lg-8 col-md-7 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column" style={{ minHeight: 520 }}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-grid-3x3-gap" style={{ color: "#014aad" }}></i> Units on this Floor
              </h6>
              <span className="badge bg-light text-dark border px-3 py-2 fw-bold" style={{ fontSize: "0.75rem", borderRadius: 6 }}>
                {units.length} Units
              </span>
            </div>

            {units.length > 0 ? (
              <div className="overflow-auto flex-grow-1 mb-3">
                <table className="table mb-0 align-middle" style={{ fontSize: "0.83rem" }}>
                  <thead>
                    <tr>
                      {["Unit / Flat", "Type", "SFT", "Owner", "Tenant", "Status"].map(h => (
                        <th key={h} className="py-2 px-3 fw-bold text-muted" style={{ backgroundColor: "#f8fafc", fontSize: "0.72rem", textTransform: "uppercase", border: "none", letterSpacing: "0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td className="py-2 px-3 fw-bold text-dark" style={{ border: "none" }}>{u.unitNumber}</td>
                        <td className="py-2 px-3 text-muted" style={{ border: "none" }}>{u.unitType}</td>
                        <td className="py-2 px-3 fw-bold text-dark" style={{ border: "none" }}>{u.sqft ? u.sqft.toLocaleString() : 0}</td>
                        <td className="py-2 px-3 text-dark" style={{ border: "none" }}>{u.owner?.ownerName || <span className="text-muted">—</span>}</td>
                        <td className="py-2 px-3 text-dark" style={{ border: "none" }}>{u.tenant?.tenantName || <span className="text-muted">—</span>}</td>
                        <td className="py-2 px-3" style={{ border: "none" }}>
                          <span className={`badge rounded-pill px-2 py-1 fw-bold ${u.unitStatus === "Available" ? "bg-success bg-opacity-10 text-success" : "bg-warning bg-opacity-10 text-warning"}`} style={{ fontSize: "0.68rem" }}>
                            {u.unitStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center py-5 text-muted mb-3">
                <i className="bi bi-grid-3x3-gap mb-2" style={{ fontSize: "2rem", opacity: 0.4 }}></i>
                <span className="small">No units configured on this floor.</span>
              </div>
            )}

            {/* Bottom Summary Cards */}
            <div className="row g-3 flex-shrink-0">
              {[
                { label: "Total Units", value: `${units.length} Unit(s)`, icon: "bi-grid-3x3-gap" },
                { label: "Occupied Space", value: `${(floor.occupiedSft || 0).toLocaleString()} SFT`, icon: "bi-aspect-ratio" },
              ].map(card => (
                <div key={card.label} className="col-md-6 col-12">
                  <div className="d-flex align-items-center gap-3 bg-light bg-opacity-50 p-3 border" style={{ borderRadius: 10 }}>
                    <div className="d-flex align-items-center justify-content-center bg-white border" style={{ width: 40, height: 40, borderRadius: 8, color: '#014aad' }}>
                      <i className={`bi ${card.icon}`} style={{ fontSize: '1.1rem' }}></i>
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={{ fontSize: '0.72rem' }}>{card.label}</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <FloorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={floor}
      />
    </div>
  );
}
