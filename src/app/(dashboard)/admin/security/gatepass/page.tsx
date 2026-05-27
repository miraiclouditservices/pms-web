"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import GatePassModal from "@/components/dashboard/GatePassModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function GatePassPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [modalMode, setModalMode]           = useState<ModalMode>("create");
  const [selectedGatePass, setSelectedGatePass] = useState<any>(null);

  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

  // Live stats derived from data
  const stats = {
    total:   gatePasses.length,
    today:   gatePasses.filter(g => {
      const d = g.createdAt ? new Date(g.createdAt).toISOString().split("T")[0] : "";
      return d === new Date().toISOString().split("T")[0];
    }).length,
    pending: gatePasses.filter(g => g.status === "PENDING" || !g.status).length,
  };

  useEffect(() => { fetchGatePasses(); }, []);

  const fetchGatePasses = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/materials");
      if (response.success) setGatePasses(response.data);
    } catch (err) {
      console.error("Failed to fetch gate passes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPasses = gatePasses.filter(
    gp =>
      (gp.materialDetails || gp.material || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gp.hsnCode || "").includes(searchTerm) ||
      (gp.vehicleNo || gp.vehicle || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, gatePass: any = null) => {
    setModalMode(mode);
    setSelectedGatePass(gatePass);
    setIsModalOpen(true);
  };

  const handleSaveGatePass = async (savedData: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/materials/${savedData._id}`, savedData)
          : await api.post("/materials", savedData);
      if (response.success) fetchGatePasses();
    } catch (err) {
      console.error("Failed to save gate pass:", err);
    }
    setIsModalOpen(false);
  };

  const handleClear = async (id: string) => {
    if (confirm("Mark this gate pass as cleared?")) {
      try {
        const response = await api.put(`/materials/${id}`, { status: "CLEARED", outTime: new Date() });
        if (response.success) fetchGatePasses();
      } catch (err) {
        console.error("Failed to clear gate pass:", err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this gate pass?")) {
      try {
        const response = await api.delete(`/materials/${id}`);
        if (response.success) fetchGatePasses();
      } catch (err) {
        console.error("Failed to delete gate pass:", err);
      }
    }
  };

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
            Material Gate Pass
          </h2>
          <p className="text-muted small mb-0">Track inward and outward material movement</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-secondary btn-sm rounded px-3 fw-bold bg-white shadow-sm d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", height: "36px" }}
          >
            <i className="bi bi-download" /> Export
          </button>
          <button
            className="btn btn-sm rounded px-3 shadow-sm fw-bold text-white border-0 d-flex align-items-center gap-2"
            style={{ backgroundColor: "#014aad", fontSize: "0.85rem", height: "36px" }}
            onClick={() => handleOpenModal("create")}
          >
            <i className="bi bi-plus-circle" /> Create Gate Pass
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Gate Pass",   sub: "All Time",       value: stats.total,   icon: "bi-file-earmark-text", color: "#014aad" },
          { label: "Today's Gate Pass", sub: "Issued Today",   value: stats.today,   icon: "bi-calendar-event",    color: "#16a34a" },
          { label: "Pending",           sub: "Awaiting Action",value: stats.pending, icon: "bi-hourglass-split",   color: "#eab308" },
        ].map(({ label, sub, value, icon, color }) => (
          <div className="col-md-4" key={label}>
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

      {/* ── Search & Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border px-3 py-2 mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "380px" }}>
          <i className="bi bi-search text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none small"
            placeholder="Search by material, HSN code, vehicle no..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="d-flex align-items-center border rounded-pill px-3 py-1 bg-light">
            <i className="bi bi-calendar3 text-muted me-2 small" />
            <select className="form-select border-0 bg-transparent shadow-none text-muted fw-medium py-0 px-0 pe-3" style={{ fontSize: "0.75rem", width: "110px" }}>
              <option>Select Date</option>
              <option>Today</option>
              <option>Yesterday</option>
            </select>
          </div>
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: "0.75rem" }}>
            <option>Type: All</option>
            <option>Returnable</option>
            <option>Non-Returnable</option>
          </select>
          <button className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2" style={{ fontSize: "0.75rem" }}>
            <i className="bi bi-funnel" /> Filters
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle" style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead>
              <tr>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Material Details</th>
                <th style={thStyle}>HSN Code</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Qty</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Rate (₹)</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total Cost (₹)</th>
                <th style={thStyle}>Vehicle No</th>
                <th style={thStyle}>In Time</th>
                <th style={thStyle}>Out Time</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading gate passes...
                  </td>
                </tr>
              ) : filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-inbox me-2" />No gate passes found.
                  </td>
                </tr>
              ) : (
                filteredPasses.map((gp, index) => (
                  <tr
                    key={gp._id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.85rem",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        className="badge rounded-pill px-2 py-1 fw-medium"
                        style={{
                          fontSize: "0.72rem",
                          backgroundColor: gp.typeOfGatePass === "Returnable" ? "#fef9c3" : "#dbeafe",
                          color: gp.typeOfGatePass === "Returnable" ? "#854d0e" : "#1e40af",
                        }}
                      >
                        {gp.typeOfGatePass || gp.type || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                      {gp.materialDetails || gp.material || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace" }}>
                      {gp.hsnCode || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700 }}>
                      {gp.quantity ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                      {gp.rate ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#014aad" }}>
                      {gp.totalCost ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b" }}>
                      {gp.vehicleNo || gp.vehicle || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>
                      {gp.inTime ? new Date(gp.inTime).toLocaleTimeString() : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>
                      {gp.outTime ? new Date(gp.outTime).toLocaleTimeString() : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div className="d-flex gap-2 justify-content-center align-items-center">
                        <button className="btn btn-link p-0" title="View" onClick={() => handleOpenModal("view", gp)}>
                          <i className="bi bi-eye-fill" style={{ fontSize: "1.05rem", color: "#4b5563" }} />
                        </button>
                        <button className="btn btn-link p-0" title="Edit" onClick={() => handleOpenModal("edit", gp)}>
                          <i className="bi bi-pencil-square" style={{ fontSize: "1.05rem", color: "#014aad" }} />
                        </button>
                        {(gp.status === "PENDING" || !gp.status) && (
                          <button className="btn btn-link p-0" title="Mark Cleared" onClick={() => handleClear(gp._id)}>
                            <i className="bi bi-check-circle-fill" style={{ fontSize: "1.05rem", color: "#16a34a" }} />
                          </button>
                        )}
                        <button className="btn btn-link p-0" title="Delete" onClick={() => handleDelete(gp._id)}>
                          <i className="bi bi-trash3" style={{ fontSize: "1.05rem", color: "#dc2626" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing 1–{filteredPasses.length} of {gatePasses.length} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm border px-2 shadow-none" disabled>
              <i className="bi bi-chevron-left" />
            </button>
            <button className="btn btn-sm border-0 px-3 text-white fw-bold" style={{ backgroundColor: "#014aad", borderRadius: "6px" }}>1</button>
            <button className="btn btn-sm border px-2 shadow-none">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Gate Pass Modal ──────────────────────────────────────────────────── */}
      <GatePassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGatePass}
        editData={selectedGatePass}
        mode={modalMode}
      />

    </div>
  );
}
