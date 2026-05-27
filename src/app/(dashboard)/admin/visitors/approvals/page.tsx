"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

// Status config
const STATUS_CFG: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  Pending:       { bg: "#fef9c3", color: "#854d0e", icon: "bi-hourglass-split",   label: "Pending Approval" },
  Approved:      { bg: "#dcfce7", color: "#166534", icon: "bi-check-circle-fill", label: "Approved"         },
  Rejected:      { bg: "#fee2e2", color: "#991b1b", icon: "bi-x-circle-fill",     label: "Rejected"         },
  "Checked-In":  { bg: "#dbeafe", color: "#1e40af", icon: "bi-door-open-fill",    label: "Checked In"       },
  "Checked-Out": { bg: "#f1f5f9", color: "#475569", icon: "bi-door-closed-fill",  label: "Checked Out"      },
};

export default function OwnerVisitorApprovalsPage() {
  const [visitors, setVisitors]   = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<"all" | "Pending" | "Approved" | "Rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchVisitors(); }, []);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/visitors");
      if (res.success) setVisitors(res.data);
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await api.patch(`/visitors/${id}/approve`, {});
      if (res.success) fetchVisitors();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return;
    try {
      const res = await api.patch(`/visitors/${id}/reject`, { reason });
      if (res.success) fetchVisitors();
    } catch (err) { console.error(err); }
  };

  const filtered = visitors.filter(v => {
    const matchStatus = filter === "all" || v.status === filter;
    const matchSearch =
      (v.visitorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.visitorContactNumber || "").includes(searchTerm) ||
      (v.personToMeet || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pending  = visitors.filter(v => v.status === "Pending").length;
  const approved = visitors.filter(v => v.status === "Approved").length;
  const rejected = visitors.filter(v => v.status === "Rejected").length;

  // ── Shared thead style ─────────────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    position: "sticky", top: 0, zIndex: 9,
    fontSize: "0.72rem", backgroundColor: "#1e293b", color: "#ffffff",
    border: "none", fontWeight: 700, letterSpacing: "0.05em",
    textTransform: "uppercase", padding: "12px 14px", whiteSpace: "nowrap",
  };

  return (
    <div className="container-fluid p-0">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
            Visitor Approvals
          </h2>
          <p className="text-muted small mb-0">Review and approve visitor access requests for your unit</p>
        </div>
        <button
          className="btn btn-sm rounded px-3 fw-bold border-0 text-white d-flex align-items-center gap-2"
          style={{ backgroundColor: "#014aad", height: "36px", fontSize: "0.85rem" }}
          onClick={fetchVisitors}
        >
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Requests", sub: "All Time",       value: visitors.length, icon: "bi-people",          color: "#014aad" },
          { label: "Pending",        sub: "Awaiting Review", value: pending,         icon: "bi-hourglass-split", color: "#eab308" },
          { label: "Approved",       sub: "Access Granted",  value: approved,        icon: "bi-check-circle",    color: "#16a34a" },
          { label: "Rejected",       sub: "Entry Denied",    value: rejected,        icon: "bi-x-circle",        color: "#dc2626" },
        ].map(({ label, sub, value, icon, color }) => (
          <div className="col-md-3" key={label}>
            <div
              className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center gap-3 h-100"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: "46px", height: "46px", backgroundColor: `${color}18`, color }}
              >
                <i className={`bi ${icon}`} style={{ fontSize: "1.2rem" }} />
              </div>
              <div>
                <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.05em" }}>{label}</div>
                <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.02em" }}>{value}</h3>
                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border px-3 py-2 mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        {/* Search */}
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "300px" }}>
          <i className="bi bi-search text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none small"
            placeholder="Search visitor name, contact, person to meet..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>

        {/* Status filter pills */}
        <div className="d-flex gap-1">
          {(["all", "Pending", "Approved", "Rejected"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn btn-sm"
              style={{
                fontSize: "0.78rem", padding: "4px 14px", borderRadius: "20px",
                backgroundColor: filter === s ? "#014aad" : "transparent",
                color: filter === s ? "#fff" : "#6b7280",
                border: filter === s ? "1px solid #014aad" : "1px solid #e5e7eb",
                fontWeight: filter === s ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {s === "all" ? "All" : s}
              {s === "Pending" && pending > 0 && (
                <span
                  className="ms-1 badge rounded-pill"
                  style={{
                    backgroundColor: filter === s ? "#fff" : "#eab308",
                    color: filter === s ? "#014aad" : "#fff",
                    fontSize: "0.65rem", padding: "2px 6px",
                  }}
                >
                  {pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pending Alert Banner ─────────────────────────────────────────────── */}
      {pending > 0 && (
        <div
          className="rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-3"
          style={{ background: "#fef9c3", border: "1px solid #fde68a" }}
        >
          <i className="bi bi-bell-fill" style={{ color: "#b45309", fontSize: "1.1rem" }} />
          <div>
            <span className="fw-bold" style={{ color: "#92400e", fontSize: "0.9rem" }}>
              {pending} visitor{pending > 1 ? "s" : ""} waiting for your approval
            </span>
            <p className="mb-0" style={{ fontSize: "0.75rem", color: "#78350f" }}>
              Approve or reject requests below — approved visitors will receive gate entry access.
            </p>
          </div>
        </div>
      )}

      {/* ── Visitor Approval Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Visitor Name</th>
                <th style={thStyle}>Contact No</th>
                <th style={thStyle}>Person to Meet</th>
                <th style={thStyle}>Property / Unit</th>
                <th style={thStyle}>Purpose</th>
                <th style={thStyle}>Visit Date</th>
                <th style={thStyle}>In Time</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading visitor requests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-inbox me-2" />No visitor requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((visitor, index) => {
                  const cfg = STATUS_CFG[visitor.status] || STATUS_CFG["Pending"];
                  return (
                    <tr
                      key={visitor._id}
                      style={{
                        backgroundColor: visitor.status === "Pending"
                          ? "#fffbeb"
                          : index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.85rem",
                      }}
                    >
                      {/* Visitor Name */}
                      <td style={{ padding: "12px 14px" }}>
                        <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>{visitor.visitorName}</div>
                        {visitor.idProofType && (
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                            {visitor.idProofType}: {visitor.idNumber || "—"}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "12px 14px", color: "#64748b", fontFamily: "monospace" }}>
                        {visitor.visitorContactNumber}
                      </td>

                      {/* Person to Meet */}
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>
                        {visitor.personToMeet || "—"}
                      </td>

                      {/* Property / Unit */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                          {visitor.property?.propertyName || visitor.placeOfVisit || "—"}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          {visitor.floor ? `Floor ${visitor.floor?.floorNumber}` : ""}
                          {visitor.unit ? ` · Unit ${visitor.unit?.unitNumber}` : ""}
                        </div>
                      </td>

                      {/* Purpose */}
                      <td style={{ padding: "12px 14px", color: "#64748b" }}>
                        {visitor.purposeOfVisit || "—"}
                      </td>

                      {/* Visit Date */}
                      <td style={{ padding: "12px 14px", color: "#64748b" }}>
                        {visitor.visitDate
                          ? new Date(visitor.visitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      {/* In Time */}
                      <td style={{ padding: "12px 14px", color: "#64748b" }}>
                        {visitor.inTime || "—"}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          className="badge rounded-pill fw-bold px-2 py-1 d-flex align-items-center gap-1"
                          style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: "0.7rem", width: "fit-content" }}
                        >
                          <i className={`bi ${cfg.icon}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {visitor.status === "Pending" ? (
                          <div className="d-flex gap-2 justify-content-center align-items-center">
                            <button
                              className="btn btn-sm fw-bold d-flex align-items-center gap-1"
                              style={{
                                backgroundColor: "#dcfce7", color: "#166534",
                                border: "1px solid #bbf7d0", borderRadius: "8px",
                                fontSize: "0.75rem", padding: "4px 12px",
                              }}
                              onClick={() => handleApprove(visitor._id)}
                              title="Approve — Gate Entry Allowed"
                            >
                              <i className="bi bi-check-lg" /> Approve
                            </button>
                            <button
                              className="btn btn-sm fw-bold d-flex align-items-center gap-1"
                              style={{
                                backgroundColor: "#fee2e2", color: "#991b1b",
                                border: "1px solid #fca5a5", borderRadius: "8px",
                                fontSize: "0.75rem", padding: "4px 12px",
                              }}
                              onClick={() => handleReject(visitor._id)}
                              title="Reject — Gate Entry Denied"
                            >
                              <i className="bi bi-x-lg" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {visitor.status === "Approved" ? (
                              <span style={{ color: "#166534" }}>
                                <i className="bi bi-shield-check me-1" />Gate Access Granted
                              </span>
                            ) : visitor.status === "Rejected" ? (
                              <span style={{ color: "#991b1b" }}>
                                <i className="bi bi-shield-x me-1" />Entry Denied
                              </span>
                            ) : visitor.status === "Checked-In" ? (
                              <span style={{ color: "#1e40af" }}>
                                <i className="bi bi-door-open me-1" />Inside
                              </span>
                            ) : (
                              <span><i className="bi bi-door-closed me-1" />Checked Out</span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing {filtered.length} of {visitors.length} requests
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm border px-2 shadow-none" disabled>
              <i className="bi bi-chevron-left" />
            </button>
            <button
              className="btn btn-sm border-0 px-3 text-white fw-bold"
              style={{ backgroundColor: "#014aad", borderRadius: "6px" }}
            >1</button>
            <button className="btn btn-sm border px-2 shadow-none">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
