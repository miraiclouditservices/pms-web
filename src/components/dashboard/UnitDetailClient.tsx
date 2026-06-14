"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import UnitModal from "@/components/dashboard/UnitModal";

const STATUS_COLOR: Record<string, string> = {
  Available: "success",
  Occupied: "primary",
  Reserved: "warning",
  Maintenance: "danger",
  "Under Maintenance": "danger",
};

export default function UnitDetailClient({ unitId }: { unitId: string }) {
  const [unit, setUnit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUnitDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/units/${unitId}`);
      if (res.success) {
        setUnit(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const r = await api.put(`/units/${unitId}`, data);
      if (r.success) {
        fetchUnitDetails();
      }
    } catch (err) {
      console.error(err);
    }
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (unitId && unitId !== "new" && unitId !== "fallback") {
      fetchUnitDetails();
    } else {
      setIsLoading(false);
    }
  }, [unitId]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="p-4 text-center">
        <h5 className="text-danger">Unit not found</h5>
        <Link href="/admin/units" className="btn btn-outline-secondary btn-sm mt-3">
          Back to Units
        </Link>
      </div>
    );
  }

  const occupantDisplay = (u: any) => {
    if (u.lease) return { name: u.lease.tenantName || "—", badge: "Lease Holder", color: "info", phone: u.lease.tenantContact, email: u.lease.tenantEmail };
    if (u.tenant) return { name: u.tenant.tenantName || "—", badge: "Tenant", color: "primary", phone: u.tenant.contactNumber, email: u.tenant.emailId };
    if (u.owner) return { name: u.owner.ownerName || "—", badge: "Office Owner", color: "success", phone: u.owner.contactNumber, email: u.owner.emailId };
    if (u.ownerName) return { name: u.ownerName, badge: "Office Owner", color: "success", phone: "", email: "" };
    return null;
  };

  const occ = occupantDisplay(unit);
  const sc = STATUS_COLOR[unit.unitStatus] || "secondary";

  return (
    <div className="container-fluid p-0" style={{ fontFamily: "var(--font-geist-sans)" }}>
      {/* Detail Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item">
                <Link href="/admin/units" className="text-decoration-none text-muted">Units & SFT</Link>
              </li>
              <li className="breadcrumb-item active fw-semibold text-dark" aria-current="page">
                {unit.unitName || `Unit ${unit.unitNumber}`}
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            Unit Details
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
          <Link href="/admin/units" className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', borderRadius: '6px' }}>
            <i className="bi bi-arrow-left"></i> Back
          </Link>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        {/* Left Side: Unit Info Card */}
        <div className="col-lg-5 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column">
            {/* Header info */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 52, height: 52, backgroundColor: '#e8f0fe', color: '#1a73e8', flexShrink: 0 }}>
                <i className="bi bi-door-open-fill" style={{ fontSize: '1.4rem' }}></i>
              </div>
              <div className="text-truncate">
                <h5 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: '1rem' }}>
                  {unit.unitName || `Unit ${unit.unitNumber}`}
                </h5>
                <span className={`badge bg-${sc} bg-opacity-10 text-${sc} border border-${sc} border-opacity-25 rounded-pill mt-1`} style={{ fontSize: "0.72rem" }}>
                  {unit.isMeetingRoom ? "Meeting Room" : unit.unitStatus || "Available"}
                </span>
              </div>
            </div>

            <hr className="opacity-10" />

            {/* Attributes list */}
            <div className="d-flex flex-column">
              {[
                { label: "Unit Number", value: unit.unitNumber, icon: "bi-hash" },
                { label: "Unit Type", value: unit.unitType || "—", icon: "bi-tag-fill" },
                { label: "Area Size", value: `${(unit.sqft || 0).toLocaleString()} SFT`, icon: "bi-aspect-ratio" },
                { label: "Property", value: unit.property?.propertyName || "—", icon: "bi-building" },
                { label: "Floor Level", value: unit.floor?.floorName || `Floor ${unit.floor?.floorNumber || unit.floorNumber || "—"}`, icon: "bi-layers-fill" },
                { label: "Meeting Room Capability", value: unit.isMeetingRoom ? "Yes" : "No", icon: "bi-calendar-check" }
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  className="d-flex justify-content-between align-items-center py-2"
                  style={{ borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f1f5f9" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 6, color: '#1a73e8' }}
                    >
                      <i className={`bi ${row.icon}`} style={{ fontSize: "0.85rem" }}></i>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{row.label}</span>
                  </div>
                  <span className="fw-bold text-dark text-end" style={{ fontSize: '0.82rem', maxWidth: '55%' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Occupant Info & Lease Specifics */}
        <div className="col-lg-7 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between" style={{ minHeight: 360 }}>
            <div>
              <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-person-fill" style={{ color: "#014aad" }}></i> Occupant & Lease Details
              </h6>

              {occ ? (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-primary bg-opacity-75" style={{ width: 48, height: 48, fontSize: "1.1rem" }}>
                      {occ.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>{occ.name}</div>
                      {occ.phone && <div className="text-muted" style={{ fontSize: "0.78rem" }}><i className="bi bi-telephone-fill me-1" />{occ.phone}</div>}
                      {occ.email && <div className="text-muted" style={{ fontSize: "0.78rem" }}><i className="bi bi-envelope-fill me-1" />{occ.email}</div>}
                      <span className={`badge bg-${occ.color} bg-opacity-10 text-${occ.color} border border-${occ.color} border-opacity-25 rounded-pill mt-1`} style={{ fontSize: "0.68rem" }}>
                        {occ.badge}
                      </span>
                    </div>
                  </div>

                  {unit.lease && (
                    <div className="bg-light rounded-3 p-3 border">
                      <div className="fw-bold text-dark mb-3" style={{ fontSize: "0.82rem" }}>Active Lease Information</div>
                      <div className="row g-3">
                        {[
                          { label: "Start Date", value: unit.lease.startDate ? new Date(unit.lease.startDate).toLocaleDateString() : "—" },
                          { label: "End Date", value: unit.lease.endDate ? new Date(unit.lease.endDate).toLocaleDateString() : "—" },
                          { label: "Monthly Rental", value: unit.lease.monthlyRent ? `₹${unit.lease.monthlyRent.toLocaleString()}` : "—" },
                          { label: "Security Deposit", value: unit.lease.securityDeposit ? `₹${unit.lease.securityDeposit.toLocaleString()}` : "—" }
                        ].map(r => (
                          <div key={r.label} className="col-sm-6 col-12">
                            <div className="text-muted small" style={{ fontSize: '0.74rem' }}>{r.label}</div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{r.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                  <i className="bi bi-person-slash mb-2" style={{ fontSize: "2.2rem", opacity: 0.4 }}></i>
                  <span className="small">This unit is currently unoccupied.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-top mt-4 d-flex justify-content-end">
              <span className="small text-muted">Last Updated: {unit.updatedAt ? new Date(unit.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      <UnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={unit}
      />
    </div>
  );
}
