"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";

interface HelpdeskFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  propertyFilter: string;
  setPropertyFilter: (v: string) => void;
  onReset: () => void;
}

const CATEGORY_OPTIONS = [
  "All",
  "Maintenance",
  "Electricity",
  "Water",
  "Payment",
  "Agreement",
  "Security",
  "Technical Issue",
  "Complaint",
  "Other"
];

const STATUS_OPTIONS = [
  "All",
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_RESPONSE",
  "RESOLVED",
  "CLOSED"
];

const PRIORITY_OPTIONS = ["All", "Low", "Medium", "High", "Critical"];

const STATUS_CONFIG: Record<string, { label: string; activeBg: string; activeFg: string }> = {
  "All": { label: "All Statuses", activeBg: "#014aad", activeFg: "#ffffff" },
  "OPEN": { label: "Open", activeBg: "#ef4444", activeFg: "#ffffff" },
  "ASSIGNED": { label: "Assigned", activeBg: "#3b82f6", activeFg: "#ffffff" },
  "IN_PROGRESS": { label: "In Progress", activeBg: "#f59e0b", activeFg: "#ffffff" },
  "WAITING_FOR_RESPONSE": { label: "Waiting", activeBg: "#6366f1", activeFg: "#ffffff" },
  "RESOLVED": { label: "Resolved", activeBg: "#10b981", activeFg: "#ffffff" },
  "CLOSED": { label: "Closed", activeBg: "#64748b", activeFg: "#ffffff" }
};

const PRIORITY_CONFIG: Record<string, { label: string; activeBg: string; activeFg: string }> = {
  "All": { label: "All Priorities", activeBg: "#014aad", activeFg: "#ffffff" },
  "Low": { label: "Low Priority", activeBg: "#10b981", activeFg: "#ffffff" },
  "Medium": { label: "Medium Priority", activeBg: "#f59e0b", activeFg: "#ffffff" },
  "High": { label: "High Priority", activeBg: "#ef4444", activeFg: "#ffffff" },
  "Critical": { label: "Critical Priority", activeBg: "#7f1d1d", activeFg: "#ffffff" }
};

export default function HelpdeskFilterDrawer({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  propertyFilter,
  setPropertyFilter,
  onReset
}: HelpdeskFilterDrawerProps) {
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get("/properties").then(res => {
        if (res.success) setProperties(res.data);
      });
    }
  }, [isOpen]);

  const hasFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    categoryFilter !== "All" ||
    propertyFilter !== "All";

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
            zIndex: 1040
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
          flexDirection: "column"
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
            flexShrink: 0
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
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>Configure ticket results</div>
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

        {/* Filters Content */}
        <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4">
          {/* Search Input */}
          <div>
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Search Keywords
            </label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="ID, Title or Desc..."
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

          {/* Ticket Status Chips */}
          <div>
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Ticket Status
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {STATUS_OPTIONS.map(s => {
                const cfg = STATUS_CONFIG[s];
                const isActive = statusFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    style={{
                      gridColumn: s === "All" ? "1 / span 2" : "auto",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: isActive ? `1px solid ${cfg.activeBg}` : "1px solid #e2e8f0",
                      backgroundColor: isActive ? cfg.activeBg : "#f8fafc",
                      color: isActive ? cfg.activeFg : "#475569",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level Chips */}
          <div>
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Priority Level
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {PRIORITY_OPTIONS.map(p => {
                const cfg = PRIORITY_CONFIG[p];
                const isActive = priorityFilter === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    style={{
                      gridColumn: p === "All" ? "1 / span 2" : "auto",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: isActive ? `1px solid ${cfg.activeBg}` : "1px solid #e2e8f0",
                      backgroundColor: isActive ? cfg.activeBg : "#f8fafc",
                      color: isActive ? cfg.activeFg : "#475569",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Category
            </label>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Property Dropdown */}
          <div>
            <label className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              Property / Building
            </label>
            <select
              className="form-select"
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              style={{ borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
            >
              <option value="All">All Properties</option>
              {properties.map(p => (
                <option key={p._id} value={p._id}>{p.propertyName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 10,
            flexShrink: 0,
            backgroundColor: "#f8fafc"
          }}
        >
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm flex-grow-1"
            onClick={onReset}
            disabled={!hasFilters}
            style={{ height: "36px", fontSize: "0.82rem", borderRadius: "6px" }}
          >
            Reset Filters
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex-grow-1 text-white border-0"
            onClick={onClose}
            style={{ height: "36px", fontSize: "0.82rem", backgroundColor: "#014aad", borderRadius: "6px" }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
