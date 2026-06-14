"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import VendorFilterDrawer from "@/components/vendors/VendorFilterDrawer";
import VendorFormModal from "@/components/vendors/VendorFormModal";
import VendorDetailView from "@/components/vendors/VendorDetailView";

const ITEMS_PER_PAGE = 20;

export default function VendorsPage() {
  // ── Server Data ───────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Params (all drive the API call) ───────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scopeFilter, setScopeFilter] = useState("All");

  // ── UI State ──────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailVendorId, setDetailVendorId] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Debounce search input (500ms) ─────────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 500);
  };

  // ── Reset page when any filter changes ────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [statusFilter, scopeFilter]);

  // ── Build API query params ────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const params: Record<string, string> = {
      page: String(currentPage),
      limit: String(ITEMS_PER_PAGE),
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== "All")  params.status = statusFilter;
    if (scopeFilter !== "All")   params.scopeOfWork = scopeFilter;
    return new URLSearchParams(params).toString();
  }, [currentPage, debouncedSearch, statusFilter, scopeFilter]);

  // ── Fetch vendors from backend ────────────────────────────────────────────
  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/vendors?${buildParams()}`);
      if (res.success) {
        setVendors(res.data);
        setTotalItems(res.total ?? res.data.length);
        setTotalPages(res.pages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  // ── Save (create / edit) ──────────────────────────────────────────────────
  const handleSave = async (data: any) => {
    try {
      setIsSubmitting(true);
      const res = modalMode === "edit"
        ? await api.put(`/vendors/${data._id}`, data)
        : await api.post("/vendors", data);
      if (res.success) fetchVendors();
    } catch (err) {
      console.error("Failed to save vendor:", err);
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
    }
  };

  // ── Toggle Status ─────────────────────────────────────────────────────────
  const handleToggleStatus = async (vendor: any) => {
    const newStatus = vendor.status === "Active" ? "Inactive" : "Active";
    try {
      setVendors(prev =>
        prev.map(v => (v._id === vendor._id ? { ...v, status: newStatus } : v))
      );
      const res = await api.put(`/vendors/${vendor._id}`, { status: newStatus });
      if (!res.success) {
        fetchVendors();
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      fetchVendors();
    }
  };

  // ── Reset all filters ─────────────────────────────────────────────────────
  const handleReset = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setScopeFilter("All");
    setCurrentPage(1);
  };

  // ── Active filter count (for badge) ───────────────────────────────────────
  const activeFilters = [
    debouncedSearch.trim() !== "",
    statusFilter !== "All",
    scopeFilter !== "All",
  ].filter(Boolean).length;

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = [
    {
      header: "Vendor",
      render: (v: any) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>{v.vendorName}</div>
          <div className="text-muted" style={{ fontSize: "0.78rem" }}>{v.vendorCode}</div>
        </div>
      ),
    },
    {
      header: "Scope of Work",
      render: (v: any) => (
        <span className="text-muted" style={{
          fontSize: "0.83rem", maxWidth: 200, display: "block",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {v.scopeOfWork || "—"}
        </span>
      ),
    },
    {
      header: "Contact",
      render: (v: any) => (
        <div>
          <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>{v.contactName}</div>
          <div className="text-muted" style={{ fontSize: "0.78rem" }}>
            {v.contactNumber || v.mobileNumber || "—"}
          </div>
          {v.emergencyNumber && (
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
              <span className="fw-semibold" style={{ color: "#f59e0b" }}>Emrg: </span>
              {v.emergencyNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Email",
      render: (v: any) => (
        <span className="text-muted" style={{ fontSize: "0.82rem" }}>{v.emailId || "—"}</span>
      ),
    },
    {
      header: "Status",
      render: (v: any) => (
        <span
          onClick={() => handleToggleStatus(v)}
          className={`badge rounded-pill px-3 py-1 ${
            v.status === "Active"
              ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
              : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"
          }`}
          style={{ fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
          title="Click to toggle status"
        >
          {v.status || "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      style: { textAlign: "center" as const },
      render: (v: any) => (
        <div className="d-flex justify-content-center gap-2">
          <button
            title="View"
            onClick={() => { setDetailVendorId(v._id); setShowDetail(true); }}
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
          <button
            title="Edit"
            onClick={() => { setSelectedVendor(v); setModalMode("edit"); setShowModal(true); }}
            style={{
              width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#1e293b",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <i className="bi bi-pencil" style={{ fontSize: "0.85rem" }} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
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
        <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>Vendor Management</span>

        <div className="d-flex gap-3 align-items-center">
          {/* Search — debounced, hits backend */}
          <div className="position-relative" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder="Search name, code, contact..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ borderRadius: "4px", border: "1px solid #e0e0e0", fontSize: "0.85rem" }}
            />
            {searchQuery ? (
              <button
                onClick={() => handleSearchChange("")}
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
            className={`btn border d-flex align-items-center justify-content-center position-relative ${
              showFilters ? "text-white border-primary" : "bg-white text-dark border-light"
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

          {/* Add Vendor */}
          <button
            className="btn d-flex align-items-center gap-2 px-4"
            style={{
              backgroundColor: "#014aad", color: "#fff", fontWeight: 500,
              borderRadius: "4px", height: 40, fontSize: "0.85rem", border: "none",
            }}
            onClick={() => { setSelectedVendor(null); setModalMode("create"); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="d-flex align-items-center gap-2 px-4 pb-2 flex-shrink-0 flex-wrap">
          {debouncedSearch && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Search: <strong>{debouncedSearch}</strong>
              <button onClick={() => handleSearchChange("")} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {statusFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Status: <strong>{statusFilter}</strong>
              <button onClick={() => setStatusFilter("All")} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {scopeFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Scope: <strong>{scopeFilter}</strong>
              <button onClick={() => setScopeFilter("All")} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
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

      {/* ── Filter Drawer ─────────────────────────────────────────────────── */}
      <VendorFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={v => { setStatusFilter(v); setCurrentPage(1); }}
        scopeFilter={scopeFilter}
        setScopeFilter={v => { setScopeFilter(v); setCurrentPage(1); }}
        onReset={handleReset}
      />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Table
        columns={columns}
        data={vendors}
        isLoading={isLoading}
        loadingMessage="Fetching vendors..."
        emptyMessage={
          activeFilters > 0
            ? "No vendors match the current filters."
            : "No vendors found. Add your first vendor."
        }
        containerClassName="table-responsive-container table-responsive flex-grow-1"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* ── Detail View ───────────────────────────────────────────────────── */}
      {showDetail && detailVendorId && (
        <VendorDetailView
          vendorId={detailVendorId}
          onClose={() => { setShowDetail(false); setDetailVendorId(""); }}
          onEdit={() => {
            const v = vendors.find(x => x._id === detailVendorId);
            setSelectedVendor(v || null);
            setModalMode("edit");
            setShowDetail(false);
            setShowModal(true);
          }}
        />
      )}

      {/* ── Form Modal (create / edit) ─────────────────────────────────────── */}
      {showModal && (
        <VendorFormModal
          mode={modalMode}
          editData={selectedVendor}
          onSubmit={handleSave}
          onClose={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
