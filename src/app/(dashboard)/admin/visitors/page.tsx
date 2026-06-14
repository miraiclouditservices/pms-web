"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import VisitorFormModal from "@/components/visitors/VisitorFormModal";
import VisitorDetailView from "@/components/visitors/VisitorDetailView";
import VisitorFilterDrawer from "@/components/visitors/VisitorFilterDrawer";
import Table, { TableColumn } from "@/components/common/Table";
import { ModalMode } from "@/components/dashboard/AssetModal";

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!timeStr || timeStr === "-" || timeStr === "") {
    return <span className="text-muted" style={{ fontSize: "0.85rem" }}>—</span>;
  }
  let datePart = "";
  try {
    const dateObj = new Date(dateStr || "");
    if (!isNaN(dateObj.getTime())) {
      datePart = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } else {
      datePart = dateStr || "";
    }
  } catch {
    datePart = dateStr || "";
  }

  let timePart = "";
  try {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      timePart = `${displayHours}:${displayMinutes} ${ampm}`;
    } else {
      timePart = timeStr;
    }
  } catch {
    timePart = timeStr;
  }

  return (
    <div>
      <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
        {datePart}
      </div>
      <div className="text-muted" style={{ fontSize: "0.74rem", marginTop: "2px" }}>
        {timePart}
      </div>
    </div>
  );
};

export default function VisitorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("Select Date");
  const [purposeFilter, setPurposeFilter] = useState("Purpose: All");
  const [statusFilter, setStatusFilter] = useState("Visit Status: All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, todayCount: 0, checkedIn: 0, pending: 0, approved: 0, checkedOut: 0, rejected: 0 });
  const [viewItem, setViewItem] = useState<any>(null);
  const [confirmCheckOutId, setConfirmCheckOutId] = useState<string | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    api.get("/auth/me").then(res => {
      if (res.success) {
        setCurrentUser(res.data);
      } else {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored));
            } catch { }
          }
        }
      }
    }).catch(() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch { }
        }
      }
    });
  }, []);

  const fetchVisitors = async (page = currentPage) => {
    setIsLoading(true);
    try {
      let queryParams = [];
      queryParams.push(`page=${page}`);
      queryParams.push(`limit=${limit}`);
      if (searchTerm) {
        queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      if (dateFilter && dateFilter !== "Select Date") {
        queryParams.push(`dateFilter=${encodeURIComponent(dateFilter)}`);
      }
      if (purposeFilter && purposeFilter !== "Purpose: All") {
        queryParams.push(`purpose=${encodeURIComponent(purposeFilter)}`);
      }
      if (statusFilter && statusFilter !== "Visit Status: All") {
        queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await api.get(`/visitors${queryString}`);
      if (response.success) {
        setVisitors(response.data);
        setTotalItems(response.total || response.count || 0);
        setTotalPages(response.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/visitors/stats");
      if (response.success) setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch visitor stats:", err);
    }
  };

  // Fetch visitors when pagination/filters/search changes
  useEffect(() => {
    fetchVisitors(currentPage);
    fetchStats();
  }, [currentPage, searchTerm, dateFilter, purposeFilter, statusFilter]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, purposeFilter, statusFilter]);

  const handleOpenModal = (mode: ModalMode, visitor: any = null) => {
    if (mode === "view") { setViewItem(visitor); return; }
    setModalMode(mode);
    setSelectedVisitor(visitor);
    setIsModalOpen(true);
  };

  const handleSaveVisitor = async (savedData: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/visitors/${savedData._id}`, savedData)
          : await api.post("/visitors", savedData);
      if (response.success) {
        fetchVisitors();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to save visitor:", err);
    }
    setIsModalOpen(false);
  };

  const handleCheckOut = async (id: string) => {
    setCheckingOutId(id);
    try {
      const response = await api.patch(`/visitors/${id}/check-out`, {});
      if (response.success) {
        fetchVisitors();
        fetchStats();
        if (viewItem && viewItem._id === id) {
          setViewItem(response.data);
        }
        return true;
      }
    } catch (err) {
      console.error("Failed to check out visitor:", err);
    } finally {
      setCheckingOutId(null);
    }
    return false;
  };



  const handleReset = () => {
    setSearchTerm("");
    setDateFilter("Select Date");
    setPurposeFilter("Purpose: All");
    setStatusFilter("Visit Status: All");
    setCurrentPage(1);
  };

  const activeFilters = [
    searchTerm.trim() !== "",
    dateFilter !== "Select Date",
    purposeFilter !== "Purpose: All" && purposeFilter !== "All",
    statusFilter !== "Visit Status: All" && statusFilter !== "All",
  ].filter(Boolean).length;

  const columns: TableColumn<any>[] = [
    {
      header: "Visitor Name",
      render: (visitor: any) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>
            {visitor.visitorName}
          </div>
          <div className="text-muted" style={{ fontSize: "0.78rem", marginTop: "2px" }}>
            {visitor.visitorContactNumber}
          </div>
        </div>
      ),
    },
    {
      header: "Property / Flat",
      render: (visitor: any) => (
        <div style={{ minWidth: "180px" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
            {visitor.property?.propertyName || visitor.placeOfVisit || "—"}
          </div>
          {visitor.floor && (
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              <i className="bi bi-layers me-1" style={{ color: "#014aad" }} />
              Floor {visitor.floor?.floorNumber || "—"}
              {visitor.floor?.floorName ? ` (${visitor.floor.floorName})` : ""}
            </div>
          )}
          {visitor.unit && (
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "1px" }}>
              <i className="bi bi-door-open me-1" style={{ color: "#16a34a" }} />
              Unit {visitor.unit?.unitNumber || "—"}
              {visitor.unit?.unitType ? (
                <span
                  className="ms-1 badge rounded-pill"
                  style={{ fontSize: "0.62rem", backgroundColor: "#f1f5f9", color: "#475569", padding: "1px 6px" }}
                >
                  {visitor.unit.unitType}
                </span>
              ) : null}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Person to Meet",
      render: (visitor: any) => (
        <span className="fw-medium text-dark" style={{ fontSize: "0.85rem" }}>
          {visitor.personToMeet || "—"}
        </span>
      ),
    },
    {
      header: "In Time",
      render: (visitor: any) => formatDateTime(visitor.visitDate, visitor.inTime),
    },
    {
      header: "Out Time",
      render: (visitor: any) => formatDateTime(visitor.outDate || visitor.visitDate, visitor.outTime),
    },
    {
      header: "Status",
      render: (visitor: any) => {
        const s = visitor.status;
        const cfg: Record<string, { bg: string; color: string; label: string }> = {
          "Checked-In": { bg: "#dbeafe", color: "#1e40af", label: "🟢 Checked In" },
          "Checked-Out": { bg: "#f1f5f9", color: "#475569", label: "Checked Out" },
        };
        const { bg, color, label } = cfg[s] || cfg["Checked-In"];
        return (
          <span
            className="badge rounded-pill fw-bold px-2 py-1"
            style={{ backgroundColor: bg, color, fontSize: "0.7rem" }}
          >
            {label}
          </span>
        );
      },
    },
    {
      header: "Actions",
      style: { textAlign: "right" as const },
      render: (visitor: any) => (
        <div className="d-flex gap-2 justify-content-end align-items-center" onClick={(e) => e.stopPropagation()}>
          <button
            title="View Details"
            onClick={() => handleOpenModal("view", visitor)}
            style={{
              width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#1e293b",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <i className="bi bi-eye" style={{ fontSize: "0.9rem" }} />
          </button>
          {visitor.status !== "Checked-Out" && (
            <button
              title="Check Out"
              disabled={checkingOutId === visitor._id}
              onClick={() => setConfirmCheckOutId(visitor._id)}
              style={{
                width: 32, height: 32, borderRadius: "6px", border: checkingOutId === visitor._id ? "1px solid #e2e8f0" : "1px solid #fee2e2",
                background: checkingOutId === visitor._id ? "#f1f5f9" : "#fee2e2", cursor: checkingOutId === visitor._id ? "not-allowed" : "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: checkingOutId === visitor._id ? "#94a3b8" : "#991b1b",
                transition: "background 0.15s",
              }}
            >
              {checkingOutId === visitor._id ? (
                <span className="spinner-border spinner-border-sm" style={{ width: "0.85rem", height: "0.85rem" }} />
              ) : (
                <i className="bi bi-box-arrow-right" style={{ fontSize: "0.9rem" }} />
              )}
            </button>
          )}
        </div>
      ),
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
          <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>Visitor Management</span>
          {/* VERY SMALL STATS UI */}
          <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize: "0.72rem" }}>
            <span>Total: <strong className="text-dark">{stats.total}</strong></span>
            <span>·</span>
            <span className="text-success">Today's: <strong>{stats.todayCount}</strong></span>
            <span className="text-primary">Checked In: <strong>{stats.checkedIn}</strong></span>
            <span>·</span>
            <span className="text-secondary">Checked Out: <strong>{stats.checkedOut}</strong></span>
          </div>
        </div>

        <div className="d-flex gap-3 align-items-center">
          {/* Search */}
          <div className="position-relative" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder="Search name, contact, purpose..."
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

          {/* Add Visitor */}
          <button
            className="btn d-flex align-items-center gap-2 px-4"
            style={{
              backgroundColor: "#014aad", color: "#fff", fontWeight: 500,
              borderRadius: "4px", height: 40, fontSize: "0.85rem", border: "none",
            }}
            onClick={() => handleOpenModal("create")}
          >
            <i className="bi bi-plus-lg" /> Visitor
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
          {dateFilter !== "Select Date" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Date: <strong>{dateFilter}</strong>
              <button onClick={() => { setDateFilter("Select Date"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {purposeFilter !== "Purpose: All" && purposeFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Purpose: <strong>{purposeFilter.replace("Purpose: ", "")}</strong>
              <button onClick={() => { setPurposeFilter("Purpose: All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {statusFilter !== "Visit Status: All" && statusFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Status: <strong>{statusFilter}</strong>
              <button onClick={() => { setStatusFilter("Visit Status: All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
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
        data={visitors}
        isLoading={isLoading}
        loadingMessage="Fetching visitors..."
        emptyMessage={
          activeFilters > 0
            ? "No visitors match the current filters."
            : "No visitor records found."
        }
        containerClassName="table-responsive-container table-responsive flex-grow-1"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onPageChange={setCurrentPage}
      />

      {/* ── Visitor Form Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <VisitorFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveVisitor}
          editData={selectedVisitor}
          mode={modalMode}
        />
      )}

      {/* ── View Detail Drawer ────────────────────────────────────────────── */}
      {viewItem && (
        <VisitorDetailView
          viewItem={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={(item) => {
            setViewItem(null);
            handleOpenModal("edit", item);
          }}
          onCheckOut={(id) => {
            setConfirmCheckOutId(id);
          }}
          isCheckingOut={checkingOutId === viewItem._id}
        />
      )}

      {/* ── Filter Drawer ─────────────────────────────────────────────────── */}
      <VisitorFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchTerm={searchTerm}
        setSearchTerm={v => { setSearchTerm(v); setCurrentPage(1); }}
        dateFilter={dateFilter}
        setDateFilter={v => { setDateFilter(v); setCurrentPage(1); }}
        purposeFilter={purposeFilter}
        setPurposeFilter={v => { setPurposeFilter(v); setCurrentPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={v => { setStatusFilter(v); setCurrentPage(1); }}
        onReset={handleReset}
      />
      {confirmCheckOutId && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1200, backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content border-0" style={{ borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <div className="modal-body text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle"
                  style={{ width: 56, height: 56, backgroundColor: "#fee2e2", color: "#dc2626" }}
                >
                  <i className="bi bi-exclamation-triangle" style={{ fontSize: "1.6rem" }}></i>
                </div>
                <h5 className="fw-bold mb-2" style={{ fontSize: "1.1rem", color: "#1f2937" }}>Confirm Check-Out</h5>
                <p className="text-muted mb-4" style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                  Are you sure you want to check out this visitor? This will update their status, out date, and out time.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn px-4 py-2 fw-semibold"
                    disabled={!!checkingOutId}
                    onClick={() => setConfirmCheckOutId(null)}
                    style={{ border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.85rem", color: "#374151", backgroundColor: "#fff" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn px-4 py-2 fw-semibold text-white d-flex align-items-center justify-content-center"
                    disabled={!!checkingOutId}
                    onClick={async () => {
                      const id = confirmCheckOutId;
                      const success = await handleCheckOut(id);
                      if (success) {
                        setConfirmCheckOutId(null);
                      }
                    }}
                    style={{ backgroundColor: "#dc2626", border: "none", borderRadius: "6px", fontSize: "0.85rem", minWidth: "105px" }}
                  >
                    {checkingOutId ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" style={{ width: "0.85rem", height: "0.85rem" }} />
                        Saving...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
