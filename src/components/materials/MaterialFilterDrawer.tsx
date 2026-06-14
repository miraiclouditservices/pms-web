"use client";
import React from "react";

interface MaterialFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  gatePassTypeFilter: string;
  setGatePassTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onReset: () => void;
}

const TYPE_OPTIONS = ["All", "Inward", "Outward"];
const STATUS_OPTIONS = ["All", "Pending", "Approved", "Cleared", "Rejected"];

export default function MaterialFilterDrawer({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  gatePassTypeFilter,
  setGatePassTypeFilter,
  statusFilter,
  setStatusFilter,
  onReset,
}: MaterialFilterDrawerProps) {
  const hasFilters =
    searchTerm.trim() !== "" ||
    (gatePassTypeFilter !== "Type: All" && gatePassTypeFilter !== "All") ||
    (statusFilter !== "Status: All" && statusFilter !== "All");

  const handleStatusSelect = (status: string) => {
    if (status === "All") {
      setStatusFilter("Status: All");
    } else {
      setStatusFilter(status);
    }
  };

  const handleTypeSelect = (type: string) => {
    if (type === "All") {
      setGatePassTypeFilter("Type: All");
    } else {
      setGatePassTypeFilter(type);
    }
  };

  const currentStatusLabel = statusFilter.startsWith("Status: ")
    ? "All"
    : statusFilter;

  const currentTypeLabel = gatePassTypeFilter.startsWith("Type: ")
    ? "All"
    : gatePassTypeFilter;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.18)",
            backdropFilter: "blur(2px)",
            zIndex: 1040,
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "320px",
          background: "#fff",
          zIndex: 1050,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "rgba(1,74,173,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-funnel text-primary" style={{ fontSize: "0.9rem" }} />
            </div>
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: "0.9rem" }}>Advanced Filters</div>
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>Configure material results</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Search */}
          <div className="mb-4">
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Search Text
            </label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="Details, HSN, vehicle..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem", paddingRight: "36px" }}
              />
              <i
                className="bi bi-search position-absolute text-muted"
                style={{ right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }}
              />
            </div>
          </div>

          {/* Gate Pass Type */}
          <div className="mb-4">
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Gate Pass Type
            </label>
            <div className="d-flex flex-wrap gap-2">
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeSelect(t)}
                  className={`btn btn-sm px-3 py-2 rounded-3 fw-semibold ${currentTypeLabel === t ? "btn-primary" : "btn-outline-secondary"}`}
                  style={{ fontSize: "0.82rem" }}
                >
                  {t === "All" ? "All Types" : t}
                </button>
              ))}
            </div>
          </div>

          {/* Gate Pass Status */}
          <div className="mb-4">
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Gate Pass Status
            </label>
            <div className="d-flex flex-column gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusSelect(s)}
                  className={`btn btn-sm text-start px-3 py-2 rounded-3 fw-semibold ${currentStatusLabel === s ? "btn-primary" : "btn-outline-secondary"}`}
                  style={{ fontSize: "0.82rem" }}
                >
                  {s === "All" ? "All Statuses" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onReset}
            disabled={!hasFilters}
            className="btn btn-outline-secondary flex-fill rounded-3 fw-semibold"
            style={{ fontSize: "0.82rem" }}
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn flex-fill rounded-3 fw-semibold text-white"
            style={{ backgroundColor: "#014aad", border: "none", fontSize: "0.82rem" }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
