"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import VendorModal from "@/components/dashboard/VendorModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const [metrics, setMetrics] = useState({ total: 0, active: 0, inactive: 0, contacts: 0 });
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
    fetchMetrics();
  }, []);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/vendors");
      if (response.success) setVendors(response.data);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await api.get("/vendors/stats");
      if (response.success) setMetrics(response.data);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  const filteredVendors = vendors.filter(
    v =>
      (v.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vendorCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.contactName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, vendor: any = null) => {
    setModalMode(mode);
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleSaveVendor = async (savedData: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/vendors/${savedData._id}`, savedData)
          : await api.post("/vendors", savedData);
      if (response.success) {
        fetchVendors();
        fetchMetrics();
      }
    } catch (err) {
      console.error("Failed to save vendor:", err);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        const response = await api.delete(`/vendors/${id}`);
        if (response.success) {
          fetchVendors();
          fetchMetrics();
        }
      } catch (err) {
        console.error("Failed to delete vendor:", err);
      }
    }
  };

  // ── Shared thead cell style ────────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 9,
    fontSize: "0.72rem",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    border: "none",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "12px 14px",
    whiteSpace: "nowrap",
  };

  return (
    <div className="container-fluid p-0">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
            Vendor Management
          </h2>
          <p className="text-muted small mb-0">View and manage all vendors and contracts</p>
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
            <i className="bi bi-plus-circle" /> Add New Vendor
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Vendors",    sub: "Registered Vendors",  value: metrics.total,    icon: "bi-people",       color: "#0D6EFD" },
          { label: "Active Vendors",   sub: "Currently Active",    value: metrics.active,   icon: "bi-person-check", color: "#16a34a" },
          { label: "Inactive Vendors", sub: "Currently Inactive",  value: metrics.inactive, icon: "bi-person-dash",  color: "#F59E0B" },
          { label: "Total Contacts",   sub: "Vendor Contacts",     value: metrics.contacts, icon: "bi-envelope",     color: "#0EA5E9" },
        ].map(({ label, sub, value, icon, color }) => (
          <div className="col-md-3" key={label}>
            <div
              className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center gap-3"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px", backgroundColor: `${color}18`, color }}
              >
                <i className={`bi ${icon} fs-4`} />
              </div>
              <div>
                <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>{label}</div>
                <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.02em" }}>{value}</h3>
                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border px-3 py-2 mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        {/* Search */}
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "320px" }}>
          <i className="bi bi-search text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none small"
            placeholder="Search by vendor name, code, contact..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>

        {/* Dropdowns + Filter */}
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium"
            style={{ fontSize: "0.75rem" }}
          >
            <option>Status: All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium"
            style={{ fontSize: "0.75rem" }}
          >
            <option>Scope of Work</option>
          </select>
          <button
            className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2"
            style={{ fontSize: "0.75rem" }}
          >
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
                <th style={{ ...thStyle, width: "50px" }}>S.NO</th>
                <th style={thStyle}>Vendor Code</th>
                <th style={thStyle}>Vendor Name</th>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Contact Name</th>
                <th style={thStyle}>Mobile Number</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading vendors...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-inbox me-2" />No vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor, index) => (
                  <tr
                    key={vendor._id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.85rem",
                    }}
                  >
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{index + 1}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700 }}>{vendor.vendorCode}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{vendor.vendorName}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{vendor.address}</td>
                    <td style={{ padding: "10px 14px" }}>{vendor.contactName}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{vendor.mobileNumber}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        className={`badge rounded-pill px-2 py-1 fw-medium ${
                          vendor.status === "Active"
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                        style={{ fontSize: "0.72rem" }}
                      >
                        {vendor.status || "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div className="d-flex gap-2 justify-content-center align-items-center">
                        <button
                          className="btn btn-link p-0"
                          title="View"
                          onClick={() => handleOpenModal("view", vendor)}
                        >
                          <i className="bi bi-eye-fill" style={{ fontSize: "1.05rem", color: "#4b5563" }} />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Edit"
                          onClick={() => handleOpenModal("edit", vendor)}
                        >
                          <i className="bi bi-pencil-square" style={{ fontSize: "1.05rem", color: "#014aad" }} />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Delete"
                          onClick={() => handleDelete(vendor._id)}
                        >
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

        {/* ── Pagination Footer ───────────────────────────────────────────── */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing 1–{filteredVendors.length} of {metrics.total} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled>
              <i className="bi bi-chevron-left" />
            </button>
            <button
              className="btn btn-sm border-0 px-3 shadow-none text-white fw-bold"
              style={{ backgroundColor: "#014aad", borderRadius: "6px" }}
            >
              1
            </button>
            <button className="btn btn-sm btn-white border px-2 shadow-none">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Vendor Modal ────────────────────────────────────────────────────── */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVendor}
        editData={selectedVendor}
        mode={modalMode}
      />

    </div>
  );
}
