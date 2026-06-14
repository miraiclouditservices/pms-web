"use client";

import React from "react";

interface VisitorDetailViewProps {
  viewItem: any;
  onClose: () => void;
  onEdit: (item: any) => void;
  onCheckOut?: (id: string) => void;
  isCheckingOut?: boolean;
}

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "—";
  let datePart = "";
  try {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      datePart = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } else {
      datePart = dateStr;
    }
  } catch {
    datePart = dateStr;
  }

  if (!timeStr || timeStr === "-") return datePart;

  try {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      return `${datePart}, ${displayHours}:${displayMinutes} ${ampm}`;
    }
  } catch {}

  return `${datePart}, ${timeStr}`;
};

const fmt = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatValue = (label: string, value: any) => {
  if (!value || value === "—") return "—";
  const stringVal = String(value).trim();
  const isPhone = label.toLowerCase().includes("phone") || label.toLowerCase().includes("contact") || label.toLowerCase().includes("alternate") || label.toLowerCase().includes("number");
  const isEmail = label.toLowerCase().includes("email");

  if (isPhone && /^\+?[0-9\s\-()]{7,20}$/.test(stringVal)) {
    return (
      <a href={`tel:${stringVal}`} style={{ color: "#014aad", textDecoration: "none", fontWeight: 600 }}>
        <i className="bi bi-telephone me-1" />{value}
      </a>
    );
  } else if (isEmail && stringVal.includes("@")) {
    return (
      <a href={`mailto:${stringVal}`} style={{ color: "#014aad", textDecoration: "none", fontWeight: 600 }}>
        <i className="bi bi-envelope me-1" />{value}
      </a>
    );
  }
  return value;
};

const ROW = ({ label, value }: { label: string; value: any }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "170px 16px 1fr",
      alignItems: "flex-start",
      padding: "10px 0",
      borderBottom: "1px solid #f1f5f9",
    }}
  >
    <span style={{ fontSize: "0.83rem", color: "#6b7280", fontWeight: 500 }}>{label}</span>
    <span style={{ color: "#d1d5db" }}>:</span>
    <span style={{ fontSize: "0.85rem", color: "#1f2937", fontWeight: 500 }}>{formatValue(label, value)}</span>
  </div>
);

export default function VisitorDetailView({
  viewItem,
  onClose,
  onEdit,
  onCheckOut,
  isCheckingOut = false,
}: VisitorDetailViewProps) {
  if (!viewItem) return null;

  const statusText = viewItem.status === "Checked-Out" ? "Checked-Out" : "Checked-In";

  const cfg: Record<string, { bg: string; cl: string; icon: string; msg: string }> = {
    "Checked-In":  { bg: "#dbeafe", cl: "#1e40af", icon: "bi-door-open-fill",    msg: "Visitor is currently inside the building." },
    "Checked-Out": { bg: "#f1f5f9", cl: "#475569", icon: "bi-door-closed-fill",  msg: "Visitor has checked out." },
  };
  const ss = cfg[statusText];

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 580 }}>
        <div
          className="modal-content border-0 overflow-hidden"
          style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              View Visitor Details
            </h5>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#d1d5db",
                fontSize: "1.4rem", lineHeight: 1, cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "24px", maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
            {/* Center Avatar Badge */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle text-white fw-bold"
                style={{ width: 56, height: 56, backgroundColor: "#014aad", fontSize: "1.3rem" }}
              >
                <i className="bi bi-person-badge"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: "#1f2937" }}>
                  {viewItem.visitorName}
                </h5>
                <span
                  className="badge px-3 py-1 fw-bold"
                  style={{
                    backgroundColor: ss.bg,
                    color: ss.cl,
                    border: `1px solid ${ss.cl}30`,
                    borderRadius: 6,
                    fontSize: "0.85rem",
                  }}
                >
                  <i className={`bi ${ss.icon} me-1`} />
                  {statusText}
                </span>
              </div>
            </div>

            {/* Section 1: Visitor Information */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-person-badge-fill text-primary me-2"></i>
                Visitor Information
              </h6>
              <ROW label="Full Name" value={viewItem.visitorName} />
              <ROW label="Contact Number" value={viewItem.visitorContactNumber} />
              <ROW label="Address" value={viewItem.address || "—"} />
              <ROW label="ID Proof Type" value={viewItem.idProofType || "—"} />
              <ROW label="ID Number" value={viewItem.idNumber || "—"} />
              <ROW label="Vehicle Number" value={viewItem.vehicleNumber || "—"} />
            </div>

            {/* Section 2: Visiting Location */}
            {(viewItem.property || viewItem.floor || viewItem.unit) && (
              <div className="mb-4 pt-2">
                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                  <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                  Visiting Location
                </h6>
                {viewItem.property && (
                  <>
                    <ROW label="Building / Property" value={viewItem.property?.propertyName || "—"} />
                    <ROW label="Property Address" value={viewItem.property?.propertyAddress || "—"} />
                    <ROW label="Property Type" value={viewItem.property?.propertyType || "—"} />
                  </>
                )}
                {viewItem.floor && (
                  <>
                    <ROW label="Floor Level" value={`Floor ${viewItem.floor?.floorNumber}${viewItem.floor?.floorName ? ` — ${viewItem.floor?.floorName}` : ""}`} />
                    {viewItem.floor?.assignedOwner && (
                      <ROW label="Floor Owner" value={`${viewItem.floor.assignedOwner.ownerName || "—"} (${viewItem.floor.assignedOwner.contactNumber || "—"})`} />
                    )}
                    {viewItem.floor?.assignedAdmin && (
                      <ROW label="Floor Admin" value={`${viewItem.floor.assignedAdmin.name || "—"} (${viewItem.floor.assignedAdmin.phoneNumber || "—"})`} />
                    )}
                  </>
                )}
                {viewItem.unit && (
                  <>
                    <ROW label="Linked Flat / Unit" value={`${viewItem.unit?.unitNumber} (${viewItem.unit?.unitType || "—"})`} />
                    <ROW label="Unit Owner Name" value={viewItem.unit?.ownerName || "—"} />
                    {viewItem.unit?.ownerContactNumber && (
                      <ROW label="Unit Owner Contact" value={viewItem.unit.ownerContactNumber} />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Section 3: Visit Details */}
            <div className="mb-4 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-calendar-check-fill text-primary me-2"></i>
                Visit Details
              </h6>
              <ROW label="Person to Meet" value={viewItem.personToMeet || "—"} />
              <ROW label="Purpose of Visit" value={viewItem.purposeOfVisit || "—"} />
              <ROW label="In Date & Time" value={formatDateTime(viewItem.visitDate, viewItem.inTime)} />
              <ROW label="Out Date & Time" value={viewItem.outTime ? formatDateTime(viewItem.outDate || viewItem.visitDate, viewItem.outTime) : "—"} />
            </div>

            {/* Section 4: Security Approval & Audit */}
            <div className="mb-2 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-shield-fill-check text-primary me-2"></i>
                Audit Details
              </h6>
              
              <ROW label="Created By" value={viewItem.createdBy ? `${viewItem.createdBy.name} (${viewItem.createdBy.role || "—"})${viewItem.createdBy.email ? ` — ${viewItem.createdBy.email}` : ""}` : "—"} />
              <ROW label="Registered At" value={fmt(viewItem.createdAt)} />

              {statusText === "Checked-Out" && (
                <>
                  <ROW label="Checked Out By" value={viewItem.approvedBy ? `${viewItem.approvedBy.name} (${viewItem.approvedBy.role || "—"})${viewItem.approvedBy.email ? ` — ${viewItem.approvedBy.email}` : ""}` : "—"} />
                  <ROW label="Checked Out At" value={formatDateTime(viewItem.outDate || viewItem.visitDate, viewItem.outTime)} />
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="d-flex justify-content-end gap-3 px-4 py-3"
            style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}
          >
             <button
              type="button"
              disabled={isCheckingOut}
              onClick={onClose}
              className="btn px-4 py-2 fw-semibold"
              style={{
                border: "1px solid #d1d5db", borderRadius: "6px",
                fontSize: "0.85rem", color: "#374151", backgroundColor: "#fff",
              }}
            >
              Close
            </button>

            {viewItem.status !== "Checked-Out" && onCheckOut && (
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => onCheckOut(viewItem._id)}
                className="btn px-4 py-2 fw-semibold text-white d-flex align-items-center gap-2"
                style={{ backgroundColor: "#dc2626", border: "none", borderRadius: "6px", fontSize: "0.85rem" }}
              >
                {isCheckingOut ? (
                  <>
                    <span className="spinner-border spinner-border-sm" style={{ width: "0.85rem", height: "0.85rem" }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-right" /> Check Out
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              disabled={isCheckingOut}
              onClick={() => onEdit(viewItem)}
              className="btn px-4 py-2 fw-semibold text-white"
              style={{ backgroundColor: "#014aad", border: "none", borderRadius: "6px", fontSize: "0.85rem" }}
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
