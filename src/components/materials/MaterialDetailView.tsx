"use client";

import React from "react";

interface MaterialDetailViewProps {
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

export default function MaterialDetailView({
  viewItem,
  onClose,
  onEdit,
  onCheckOut,
  isCheckingOut = false,
}: MaterialDetailViewProps) {
  if (!viewItem) return null;

  const statusCfg: Record<string, { bg: string; color: string; icon: string }> = {
    Approved: { bg: "#dcfce7", color: "#166534", icon: "bi-check-circle-fill" },
    Cleared:  { bg: "#dbeafe", color: "#1e40af", icon: "bi-check-all" },
    Rejected: { bg: "#fee2e2", color: "#991b1b", icon: "bi-x-circle-fill" },
    Pending:  { bg: "#fef9c3", color: "#854d0e", icon: "bi-hourglass-split" },
  };

  const { bg, color, icon } = statusCfg[viewItem.status] || statusCfg["Pending"];

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
              View Gate Pass Details
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
            
            {/* Center Header Badge */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle text-white fw-bold"
                style={{ width: 56, height: 56, backgroundColor: "#014aad", fontSize: "1.3rem" }}
              >
                <i className="bi bi-box-seam"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: "#1f2937" }}>
                  {viewItem.materialDetails}
                </h5>
                <div className="d-flex gap-2 justify-content-center align-items-center mt-2">
                  <span
                    className="badge px-3 py-1 fw-bold"
                    style={{
                      backgroundColor: viewItem.gatePassType === "Inward" ? "#dcfce7" : "#dbeafe",
                      color: viewItem.gatePassType === "Inward" ? "#166534" : "#1e40af",
                      fontSize: "0.8rem",
                    }}
                  >
                    {viewItem.gatePassType === "Inward" ? "⬇ Inward" : "⬆ Outward"}
                  </span>
                  <span
                    className="badge px-3 py-1 fw-bold"
                    style={{
                      backgroundColor: bg,
                      color: color,
                      border: `1px solid ${color}30`,
                      borderRadius: 6,
                      fontSize: "0.8rem",
                    }}
                  >
                    <i className={`bi ${icon} me-1`} />
                    {viewItem.status || "Pending"}
                  </span>
                  {viewItem.totalCost !== undefined && viewItem.totalCost !== null && (
                    <span
                      className="badge px-3 py-1 fw-bold"
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#b45309",
                        border: "1px solid #b4530930",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                      }}
                    >
                      💰 Cost: ₹{Number(viewItem.totalCost).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1: Material Information */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                Material Information
              </h6>
              <ROW label="Details" value={viewItem.materialDetails} />
              <ROW label="HSN Code" value={viewItem.hsnCode} />
              <ROW label="Quantity" value={`${viewItem.quantity} units`} />
              <ROW label="Rate" value={viewItem.rate ? `₹ ${Number(viewItem.rate).toLocaleString()}` : null} />
            </div>

            {/* Section 2: Location Details */}
            {(viewItem.property || viewItem.floor || viewItem.unit) && (
              <div className="mb-4 pt-2">
                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                  <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                  Location Details
                </h6>
                {viewItem.property && (
                  <>
                    <ROW label="Property / Building" value={viewItem.property?.propertyName || viewItem.building} />
                    <ROW label="Address" value={viewItem.property?.propertyAddress} />
                  </>
                )}
                {viewItem.floor && (
                  <>
                    <ROW label="Floor Level" value={`Floor ${viewItem.floor?.floorNumber}${viewItem.floor?.floorName ? ` — ${viewItem.floor?.floorName}` : ""}`} />
                    {viewItem.floor?.assignedAdmin && (
                      <ROW label="Floor Admin" value={`${viewItem.floor.assignedAdmin.name || "—"} (${viewItem.floor.assignedAdmin.phone || "—"})`} />
                    )}
                    {viewItem.floor?.assignedOwner && (
                      <ROW label="Floor Owner" value={`${viewItem.floor.assignedOwner.ownerName || "—"} (${viewItem.floor.assignedOwner.contactNumber || "—"})`} />
                    )}
                  </>
                )}
                {viewItem.unit && (
                  <>
                    <ROW label="Linked Office / Unit" value={`Unit ${viewItem.unit?.unitNumber} (${viewItem.unit?.unitType || "—"})`} />
                    <ROW label="Unit Owner Name" value={viewItem.unit?.ownerName || "—"} />
                    {viewItem.unit?.owner?.contactNumber && (
                      <ROW label="Unit Owner Contact" value={viewItem.unit.owner.contactNumber} />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Section 3: Movement Details */}
            <div className="mb-4 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-truck text-primary me-2"></i>
                Movement Details
              </h6>
              <ROW label="Place of Visit" value={viewItem.placeOfVisit} />
              <ROW label="Purpose" value={viewItem.purposeOfVisit} />
              <ROW label="Vehicle Number" value={viewItem.vehicleNumber} />
              <ROW label="In Date & Time" value={formatDateTime(viewItem.createdAt, viewItem.inTime)} />
              <ROW label="Out Date & Time" value={viewItem.outTime ? formatDateTime(viewItem.outDate || viewItem.createdAt, viewItem.outTime) : "—"} />
            </div>

            {/* Section 4: Audit & Creator Details */}
            <div className="mb-4 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-person-badge-fill text-primary me-2"></i>
                Creator Details
              </h6>
              {viewItem.createdBy ? (
                <>
                  <ROW label="Created By (User)" value={`${viewItem.createdBy.name} (${viewItem.createdBy.role || "Staff"})`} />
                  <ROW label="Creator Email" value={viewItem.createdBy.email} />
                  <ROW label="Creator Phone" value={viewItem.createdBy.phone} />
                </>
              ) : (
                <ROW label="Created By" value="System / Legacy" />
              )}
              <ROW label="Created Date / Time" value={viewItem.createdAt ? fmt(viewItem.createdAt) : null} />
            </div>

            {/* Section 5: Approval Details */}
            {viewItem.status !== "Pending" && (
              <div className="mb-3 pt-2">
                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                  <i className="bi bi-shield-check text-primary me-2"></i>
                  Approval Decision Details
                </h6>
                {viewItem.approvedBy ? (
                  <>
                    <ROW label="Decision By (User)" value={`${viewItem.approvedBy.name} (${viewItem.approvedBy.role})`} />
                    <ROW label="Approver Email" value={viewItem.approvedBy.email} />
                    <ROW label="Approver Phone" value={viewItem.approvedBy.phone} />
                  </>
                ) : (
                  <ROW label="Decision By" value="System / Automatically Routed" />
                )}
                <ROW label="Decision Date / Time" value={viewItem.approvedAt ? fmt(viewItem.approvedAt) : null} />
                {viewItem.status === "Rejected" && viewItem.rejectionReason && (
                  <ROW label="Rejection Reason" value={viewItem.rejectionReason} highlight />
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 bg-light border-top d-flex gap-2 justify-content-end align-items-center">
            <button
              onClick={onClose}
              disabled={isCheckingOut}
              className="btn btn-outline-secondary btn-sm rounded px-3 fw-bold"
            >
              Close
            </button>
            {viewItem.status !== "Cleared" && viewItem.status !== "Rejected" && onCheckOut && (
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => onCheckOut(viewItem._id)}
                className="btn btn-danger btn-sm rounded px-3 fw-bold d-flex align-items-center gap-1"
                style={{ backgroundColor: "#dc2626", border: "none" }}
              >
                {isCheckingOut ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" style={{ width: "0.85rem", height: "0.85rem" }} />
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
              onClick={() => onEdit(viewItem)}
              disabled={isCheckingOut}
              className="btn btn-primary btn-sm rounded px-3 fw-bold text-white shadow-sm border-0"
              style={{ backgroundColor: "#014aad" }}
            >
              <i className="bi bi-pencil-square me-1" /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ROW Helper Component ──────────────────────────────────────────────────────
function ROW({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) {
  if (value === undefined || value === null || String(value).trim() === "" || String(value).trim() === "-") {
    value = "—";
  }

  const isPhone = label.toLowerCase().includes("phone") || label.toLowerCase().includes("contact") || label.toLowerCase().includes("number");
  const isEmail = label.toLowerCase().includes("email");

  let renderedValue = value;
  if (value && value !== "—") {
    const stringVal = String(value).trim();
    if (isPhone && /^\+?[0-9\s\-()]{7,20}$/.test(stringVal)) {
      renderedValue = (
        <a href={`tel:${stringVal}`} className="text-decoration-none fw-semibold" style={{ color: "#014aad" }}>
          <i className="bi bi-telephone me-1" />{value}
        </a>
      );
    } else if (isEmail && stringVal.includes("@")) {
      renderedValue = (
        <a href={`mailto:${stringVal}`} className="text-decoration-none fw-semibold" style={{ color: "#014aad" }}>
          <i className="bi bi-envelope me-1" />{value}
        </a>
      );
    }
  }

  return (
    <div className="d-flex justify-content-between py-2 border-bottom border-light" style={{ fontSize: "0.85rem" }}>
      <span className="text-muted fw-medium">{label}</span>
      <span className={`fw-semibold ${highlight ? "text-danger fw-bold" : "text-dark"}`}>
        {renderedValue}
      </span>
    </div>
  );
}
