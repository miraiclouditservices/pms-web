"use client";
import React from "react";

interface VisitorFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
  purposeFilter: string;
  setPurposeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onReset: () => void;
}

const PURPOSE_OPTIONS = ["All", "Meeting", "Delivery", "Interview", "Maintenance", "Personal", "Other"];
const STATUS_OPTIONS = ["All", "Checked-In", "Checked-Out"];
const DATE_OPTIONS = ["Select Date", "Today", "Yesterday"];

export default function VisitorFilterDrawer({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  purposeFilter,
  setPurposeFilter,
  statusFilter,
  setStatusFilter,
  onReset,
}: VisitorFilterDrawerProps) {
  const hasFilters =
    searchTerm.trim() !== "" ||
    dateFilter !== "Select Date" ||
    purposeFilter !== "Purpose: All" && purposeFilter !== "All" ||
    statusFilter !== "Visit Status: All" && statusFilter !== "All";

  const handleStatusSelect = (status: string) => {
    if (status === "All") {
      setStatusFilter("Visit Status: All");
    } else {
      setStatusFilter(status);
    }
  };

  const currentStatusLabel = statusFilter.startsWith("Visit Status: ")
    ? "All"
    : statusFilter;

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
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>Configure visitor results</div>
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
                placeholder="Name, contact, purpose..."
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

          {/* Date Filter */}
          <div className="mb-4">
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Visit Date
            </label>
            <select
              className="form-select"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
            >
              {DATE_OPTIONS.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Status */}
          <div className="mb-4">
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Visit Status
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

          {/* Purpose of Visit */}
          <div className="mb-4">
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Purpose of Visit
            </label>
            <select
              className="form-select"
              value={purposeFilter.startsWith("Purpose: ") ? purposeFilter.replace("Purpose: ", "") : purposeFilter}
              onChange={e => setPurposeFilter(e.target.value === "All" ? "Purpose: All" : e.target.value)}
              style={{ borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
            >
              {PURPOSE_OPTIONS.map(p => (
                <option key={p} value={p}>
                  {p === "All" ? "All Purposes" : p}
                </option>
              ))}
            </select>
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
