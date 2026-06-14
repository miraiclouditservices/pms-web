"use client";

import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import Table from "@/components/common/Table";
import MaterialFormModal from "@/components/materials/MaterialFormModal";
import MaterialDetailView from "@/components/materials/MaterialDetailView";
import MaterialFilterDrawer from "@/components/materials/MaterialFilterDrawer";
import { ModalMode } from "@/components/dashboard/AssetModal";

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

function MaterialsContent() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gatePassTypeFilter, setGatePassTypeFilter] = useState("Type: All");
  const [statusFilter, setStatusFilter] = useState("Status: All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedGatePass, setSelectedGatePass] = useState<any>(null);

  // View detail drawer
  const [viewItem, setViewItem] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const fetchMaterials = async (page = currentPage) => {
    setIsLoading(true);
    try {
      let queryParams = [];
      queryParams.push(`page=${page}`);
      queryParams.push(`limit=${limit}`);
      if (searchTerm) {
        queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      if (gatePassTypeFilter && gatePassTypeFilter !== "Type: All" && gatePassTypeFilter !== "All") {
        queryParams.push(`gatePassType=${encodeURIComponent(gatePassTypeFilter)}`);
      }
      if (statusFilter && statusFilter !== "Status: All" && statusFilter !== "All") {
        queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await api.get(`/materials${queryString}`);
      if (response.success) {
        setMaterials(response.data);
        setTotalItems(response.total || response.count || 0);
        setTotalPages(response.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when page, search, or filters change
  useEffect(() => {
    fetchMaterials(currentPage);
  }, [currentPage, searchTerm, gatePassTypeFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gatePassTypeFilter, statusFilter]);

  const handleOpenModal = (mode: ModalMode, item: any = null) => {
    setModalMode(mode);
    setSelectedGatePass(item);
    setIsModalOpen(true);
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await api.get(`/materials/${id}`);
      if (response.success) {
        setViewItem(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch material details:", err);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/materials/${data._id}`, data)
          : await api.post("/materials", data);
      if (response.success) fetchMaterials(currentPage);
    } catch (err) {
      console.error("Failed to save gate pass:", err);
    }
  };


  const handleCheckOut = async (id: string) => {
    if (!confirm("Are you sure you want to check out this material?")) return;
    setCheckingOutId(id);
    try {
      const response = await api.patch(`/materials/${id}/check-out`, {});
      if (response.success) {
        fetchMaterials(currentPage);
        if (viewItem && viewItem._id === id) {
          setViewItem(response.data);
        }
      }
    } catch (err) {
      console.error("Failed to check out material:", err);
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setGatePassTypeFilter("Type: All");
    setStatusFilter("Status: All");
    setCurrentPage(1);
  };

  const statusCfg: Record<string, { bg: string; color: string }> = {
    Approved: { bg: "#dcfce7", color: "#166534" },
    Cleared:  { bg: "#dbeafe", color: "#1e40af" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
    Pending:  { bg: "#fef9c3", color: "#854d0e" },
  };

  const activeFilters =
    (searchTerm.trim() !== "" ? 1 : 0) +
    (gatePassTypeFilter !== "Type: All" && gatePassTypeFilter !== "All" ? 1 : 0) +
    (statusFilter !== "Status: All" && statusFilter !== "All" ? 1 : 0);

  // Define table columns
  const columns = [
    {
      header: "Gate Pass Type",
      render: (item: any) => (
        <span
          className="badge rounded-pill fw-bold px-2 py-1"
          style={{
            backgroundColor: item.gatePassType === "Inward" ? "#dcfce7" : "#dbeafe",
            color: item.gatePassType === "Inward" ? "#166534" : "#1e40af",
            fontSize: "0.7rem",
          }}
        >
          {item.gatePassType === "Inward" ? "⬇ Inward" : "⬆ Outward"}
        </span>
      )
    },
    {
      header: "Material Details",
      render: (item: any) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
            {item.materialDetails}
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: "0.72rem" }}>
            HSN: {item.hsnCode || "—"}
          </div>
        </div>
      )
    },
    {
      header: "Location / Office",
      render: (item: any) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.83rem" }}>
            <i className="bi bi-building me-1" style={{ color: "#014aad" }} />
            {item.property?.propertyName || item.building || "—"}
          </div>
          {(item.floor?.floorNumber || item.floorLabel) && (
            <div className="text-muted small mt-1" style={{ fontSize: "0.72rem" }}>
              <i className="bi bi-layers me-1 text-info" />
              Floor {item.floor?.floorNumber || item.floorLabel}
            </div>
          )}
          {(item.unit?.unitNumber || item.unitLabel) && (
            <div className="text-muted small mt-1" style={{ fontSize: "0.72rem" }}>
              <i className="bi bi-door-open me-1 text-purple" />
              Unit {item.unit?.unitNumber || item.unitLabel}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Quantity / Rate",
      render: (item: any) => (
        <div>
          <div className="fw-bold text-dark">{item.quantity} units</div>
          <div className="text-muted small mt-1">@ ₹{item.rate}</div>
        </div>
      )
    },

    {
      header: "Time",
      render: (item: any) => (
        <div style={{ minWidth: "150px" }}>
          <div>
            <span className="text-success fw-bold">In: </span>
            <span className="text-dark">{formatDateTime(item.createdAt, item.inTime)}</span>
          </div>
          <div className="mt-1">
            <span className="text-danger fw-bold">Out: </span>
            <span className="text-dark">{item.outTime && item.outTime !== "-" ? formatDateTime(item.outDate || item.createdAt, item.outTime) : "—"}</span>
          </div>
        </div>
      )
    },
    {
      header: "Status",
      render: (item: any) => {
        const { bg, color } = statusCfg[item.status] || statusCfg["Pending"];
        return (
          <span
            className="badge rounded-pill fw-bold px-2 py-1"
            style={{ backgroundColor: bg, color, fontSize: "0.7rem" }}
          >
            {item.status || "Pending"}
          </span>
        );
      }
    },
    {
      header: "Actions",
      style: { textAlign: "center" as const },
      render: (item: any) => (
        <div className="d-flex gap-2 justify-content-center align-items-center" onClick={(e) => e.stopPropagation()}>
          <button
            title="View Details"
            onClick={() => handleViewDetails(item._id)}
            style={{
              width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", color: "#1e293b",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <i className="bi bi-eye text-secondary" style={{ fontSize: "0.95rem" }} />
          </button>
          {item.status !== "Cleared" && item.status !== "Rejected" && (
            <button
              title="Check Out"
              disabled={checkingOutId === item._id}
              onClick={() => handleCheckOut(item._id)}
              style={{
                width: 32, height: 32, borderRadius: "6px", border: checkingOutId === item._id ? "1px solid #e2e8f0" : "1px solid #fee2e2",
                background: checkingOutId === item._id ? "#f1f5f9" : "#fee2e2", cursor: checkingOutId === item._id ? "not-allowed" : "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: checkingOutId === item._id ? "#94a3b8" : "#991b1b",
                transition: "background 0.15s",
              }}
            >
              {checkingOutId === item._id ? (
                <span className="spinner-border spinner-border-sm" style={{ width: "0.85rem", height: "0.85rem" }} />
              ) : (
                <i className="bi bi-box-arrow-right" style={{ fontSize: "0.9rem" }} />
              )}
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div
      className="p-0 d-flex flex-column bg-white border rounded-4"
      style={{ height: "calc(100vh - 104px)", fontFamily: "var(--font-geist-sans)", overflow: "hidden" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="d-flex justify-content-between align-items-center pb-2 pt-3 px-4 flex-shrink-0"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div>
          <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>Material Management</span>
          <p className="text-muted small mb-0" style={{ fontSize: "0.72rem" }}>
            Track inward and outward material movement with gate passes.
          </p>
        </div>

        <div className="d-flex gap-3 align-items-center">
          {/* Search */}
          <div className="position-relative" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder="Search details, HSN, vehicle..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ borderRadius: "4px", border: "1px solid #e0e0e0", fontSize: "0.85rem" }}
            />
            {searchTerm ? (
              <button
                onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  border: "none", background: "none", cursor: "pointer", color: "#94a3b8",
                  fontSize: "0.85rem", lineHeight: 1,
                }}
              >×</button>
            ) : (
              <i className="bi bi-search position-absolute text-muted"
                style={{ right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }} />
            )}
          </div>

          {/* Filter Toggle */}
          <button
            className={`btn border d-flex align-items-center justify-content-center position-relative ${showFilters ? "text-white border-primary" : "bg-white text-dark border-light"
              }`}
            onClick={() => setShowFilters(true)}
            style={{
              width: 40, height: 40, borderRadius: "4px",
              backgroundColor: showFilters ? "#014aad" : "#fff",
            }}
            title="Advanced Filters"
          >
            <i className={`bi bi-funnel ${showFilters ? "text-white" : "text-dark"}`} />
            {activeFilters > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                style={{ fontSize: "0.6rem", padding: "2px 5px" }}
              >
                {activeFilters}
              </span>
            )}
          </button>

          {/* Export */}
          <button
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ height: 40, fontSize: "0.85rem", borderRadius: "4px", fontWeight: 500 }}
          >
            <i className="bi bi-download me-2" /> Export
          </button>

          {/* New Gate Pass */}
          <button
            className="btn d-flex align-items-center gap-2 px-4"
            style={{
              backgroundColor: "#014aad", color: "#fff", fontWeight: 500,
              borderRadius: "4px", height: 40, fontSize: "0.85rem", border: "none",
            }}
            onClick={() => handleOpenModal("create")}
          >
            <i className="bi bi-plus-lg" /> Gate Pass
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="d-flex align-items-center gap-2 px-4 pb-2 flex-shrink-0 flex-wrap">
          {searchTerm && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Search: <strong>{searchTerm}</strong>
              <button onClick={() => { setSearchTerm(""); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {gatePassTypeFilter !== "Type: All" && gatePassTypeFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Type: <strong>{gatePassTypeFilter}</strong>
              <button onClick={() => { setGatePassTypeFilter("Type: All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {statusFilter !== "Status: All" && statusFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Status: <strong>{statusFilter}</strong>
              <button onClick={() => { setStatusFilter("Status: All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          <button
            onClick={handleReset}
            className="btn btn-link p-0 text-danger"
            style={{ fontSize: "0.75rem", textDecoration: "none" }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Table
        columns={columns}
        data={materials}
        isLoading={isLoading}
        loadingMessage="Fetching gate passes..."
        emptyMessage={
          activeFilters > 0
            ? "No gate passes match the current filters."
            : "No gate pass records found."
        }
        containerClassName="table-responsive-container table-responsive flex-grow-1"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onPageChange={setCurrentPage}
      />

      {/* ── Material Form Modal ─────────────────────────────────────────────── */}
      <MaterialFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={selectedGatePass}
        mode={modalMode}
      />

      {/* ── View Detail Drawer ────────────────────────────────────────────── */}
      <MaterialDetailView
        viewItem={viewItem}
        onClose={() => setViewItem(null)}
        onEdit={(item) => {
          setViewItem(null);
          handleOpenModal("edit", item);
        }}
        onCheckOut={handleCheckOut}
        isCheckingOut={checkingOutId === viewItem?._id}
      />

      {/* ── Advanced Filters Drawer ────────────────────────────────────────── */}
      <MaterialFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        gatePassTypeFilter={gatePassTypeFilter}
        setGatePassTypeFilter={setGatePassTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReset={handleReset}
      />
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MaterialsContent />
    </Suspense>
  );
}
