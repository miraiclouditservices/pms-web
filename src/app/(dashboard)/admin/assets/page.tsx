"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import AssetFilterDrawer from "@/components/assets/AssetFilterDrawer";
import AssetFormModal from "@/components/assets/AssetFormModal";
import AssetDetailView from "@/components/assets/AssetDetailView";
import { exportAssetsToExcel } from "@/utils/exportAssetsExcel";
import { exportAssetsToPdf } from "@/utils/exportAssetsPdf";

const ITEMS_PER_PAGE = 20;

export default function AssetsPage() {
  // ── Server Data ───────────────────────────────────────────────────────────
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allFloors, setAllFloors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    amcActive: 0,
    amcExpired: 0,
    amcExpiringSoon: 0,
    warrantyExpiringSoon: 0,
    noAmc: 0,
  });

  // ── Query Parameters ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // ── UI State ──────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailAssetId, setDetailAssetId] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Export Modal State ────────────────────────────────────────────────────
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState("excel");
  const [exportPreviewData, setExportPreviewData] = useState<any[] | null>(null);

  // ── Debounce Search Input ─────────────────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 500);
  };

  // ── Reset page when filter changes ────────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [statusFilter, categoryFilter]);

  // ── Build API Query Params ────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const params: Record<string, string> = {
      page: String(currentPage),
      limit: String(ITEMS_PER_PAGE),
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== "All") params.assetStatus = statusFilter;
    if (categoryFilter !== "All") params.category = categoryFilter;
    return new URLSearchParams(params).toString();
  }, [currentPage, debouncedSearch, statusFilter, categoryFilter]);

  // ── Fetch Assets ──────────────────────────────────────────────────────────
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/assets?${buildParams()}`);
      if (res.success) {
        setAssets(res.data);
        setTotalItems(res.total ?? res.data.length);
        setTotalPages(res.pages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  // ── Fetch Stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      // Fetch all assets once to calculate metrics locally (since stats endpoint is not built for asset)
      const res = await api.get("/assets?limit=5000");
      if (res.success) {
        const all = res.data;
        const today = new Date();
        const amcActive = all.filter((a: any) => a.amcEndDate && new Date(a.amcEndDate) >= today).length;
        const amcExpired = all.filter((a: any) => a.amcEndDate && new Date(a.amcEndDate) < today).length;
        const amcExpiringSoon = all.filter((a: any) => {
          if (!a.amcEndDate) return false;
          const diff = Math.ceil((new Date(a.amcEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 10;
        }).length;
        const warrantyExpiringSoon = all.filter((a: any) => {
          if (!a.warrantyEndDate) return false;
          const diff = Math.ceil((new Date(a.warrantyEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 10;
        }).length;

        setStats({
          total: all.length,
          amcActive,
          amcExpired,
          amcExpiringSoon,
          warrantyExpiringSoon,
          noAmc: all.filter((a: any) => !a.amcEndDate).length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch asset stats:", err);
    }
  }, []);

  const fetchAllFloors = useCallback(async () => {
    try {
      const res = await api.get("/floors?limit=5000");
      if (res.success) {
        setAllFloors(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch all floors:", err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchStats();
    fetchAllFloors();
  }, [fetchAssets, fetchStats, fetchAllFloors]);

  // ── Save (create / edit) ──────────────────────────────────────────────────
  const handleSave = async (data: any) => {
    try {
      setIsSubmitting(true);
      const res = modalMode === "edit"
        ? await api.put(`/assets/${data._id}`, data)
        : await api.post("/assets", data);
      if (res.success) {
        fetchAssets();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to save asset:", err);
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
    }
  };

  // ── Toggle Status (Active ↔ Under Repair ↔ Scrapped) ──────────────────────
  const handleToggleStatus = async (asset: any) => {
    const nextStatusMap: Record<string, string> = {
      "Active": "Under Repair",
      "Under Repair": "Scrapped",
      "Scrapped": "Active",
    };
    const nextStatus = nextStatusMap[asset.assetStatus] || "Active";
    try {
      setAssets(prev =>
        prev.map(a => (a._id === asset._id ? { ...a, assetStatus: nextStatus } : a))
      );
      const res = await api.put(`/assets/${asset._id}`, { assetStatus: nextStatus });
      if (!res.success) {
        fetchAssets();
      }
    } catch (err) {
      console.error("Failed to toggle asset status:", err);
      fetchAssets();
    }
  };

  // ── Reset Filters ─────────────────────────────────────────────────────────
  const handleReset = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setCurrentPage(1);
  };

  // ── Active Filters Count ──────────────────────────────────────────────────
  const activeFilters = [
    debouncedSearch.trim() !== "",
    statusFilter !== "All",
    categoryFilter !== "All",
  ].filter(Boolean).length;

  // ── Date Range Helper for Export ──────────────────────────────────────────
  const getFilteredExportData = async () => {
    try {
      const res = await api.get("/assets?limit=5000");
      if (!res.success) return [];
      const all = res.data;
      if (!exportStartDate || !exportEndDate) return all;
      return all.filter((a: any) => {
        const pd = new Date(a.purchaseDate);
        return pd >= new Date(exportStartDate) && pd <= new Date(exportEndDate);
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // ── Export Triggers ───────────────────────────────────────────────────────
  const handleDownloadExport = async () => {
    const dataToExport = await getFilteredExportData();
    if (dataToExport.length === 0) {
      alert("No assets found in the selected date range!");
      return;
    }
    const totalValue = dataToExport.reduce((sum: number, a: any) => sum + (a.purchaseValue || 0), 0);
    if (exportFormat === "pdf") {
      exportAssetsToPdf(dataToExport, totalValue);
    } else {
      exportAssetsToExcel(dataToExport);
    }
    setIsExportModalOpen(false);
  };

  const handlePreviewExport = async () => {
    const dataToExport = await getFilteredExportData();
    if (dataToExport.length === 0) {
      alert("No assets match this criteria.");
      setExportPreviewData(null);
    } else {
      setExportPreviewData(dataToExport);
    }
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
    setExportPreviewData(null);
  };

  // ── AMC & Warranty Status Indicators ─────────────────────────────────────
  const getAmcInfo = (a: any) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!a.amcEndDate) return { status: "No AMC", badge: "secondary" };
    const aDate = new Date(a.amcEndDate); aDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((aDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "AMC Expired", badge: "danger" };
    if (diffDays <= 10) return { status: "Expiring Soon", badge: "warning" };
    return { status: "AMC Active", badge: "success" };
  };

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = [
    {
      header: "Asset",
      render: (v: any) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>{v.assetDescription}</div>
          <div className="text-muted" style={{ fontSize: "0.78rem" }}>{v.assetCode}</div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (v: any) => (
        <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.78rem" }}>
          {v.category || "—"}
        </span>
      ),
    },
    {
      header: "Location",
      render: (v: any) => {
        const floorObj = allFloors.find(f => {
          const propId = typeof f.property === "object" ? f.property?._id : f.property;
          const targetPropId = typeof v.property === "object" ? v.property?._id : v.property;
          const matchProp = propId === targetPropId;
          const matchFloor = String(f.floorNumber) === String(v.floorNumber);
          return matchProp && matchFloor;
        });
        const floorLabel = floorObj ? floorObj.floorName : (v.floorNumber !== undefined ? `Floor ${v.floorNumber}` : "Ground Floor");
        return (
          <div>
            <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
              {v.property?.propertyName || "Main Complex"}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
              {floorLabel}
              {v.unit && ` · Unit ${v.unit.unitNumber}`}
            </div>
          </div>
        );
      },
    },
    {
      header: "Value & Date",
      render: (v: any) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
            ₹ {v.purchaseValue?.toLocaleString() || "—"}
          </div>
          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
            {v.purchaseDate ? new Date(v.purchaseDate).toLocaleDateString() : "—"}
          </div>
        </div>
      ),
    },
    {
      header: "AMC Status",
      render: (v: any) => {
        const amc = getAmcInfo(v);
        return (
          <span
            className={`badge bg-${amc.badge} bg-opacity-10 text-${amc.badge} border border-${amc.badge} border-opacity-25 rounded-pill px-3 py-1`}
            style={{ fontSize: "0.72rem", fontWeight: 700 }}
          >
            {amc.status}
          </span>
        );
      },
    },
    {
      header: "Status",
      render: (v: any) => (
        <span
          onClick={() => handleToggleStatus(v)}
          className={`badge rounded-pill px-3 py-1 ${
            v.assetStatus === "Active"
              ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
              : v.assetStatus === "Under Repair"
              ? "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25"
              : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"
          }`}
          style={{ fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
          title="Click to toggle status"
        >
          {v.assetStatus || "Active"}
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
            onClick={() => { setDetailAssetId(v._id); setShowDetail(true); }}
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
            onClick={() => { setSelectedAsset(v); setModalMode("edit"); setShowModal(true); }}
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
        <div>
          <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>Assets Management</span>
          {/* VERY SMALL STATS UI */}
          <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize: "0.72rem" }}>
            <span>Total: <strong className="text-dark">{stats.total}</strong></span>
            <span>·</span>
            <span className="text-success">AMC Active: <strong>{stats.amcActive}</strong></span>
            <span>·</span>
            <span className="text-warning">Expiring: <strong>{stats.amcExpiringSoon}</strong></span>
            <span>·</span>
            <span className="text-danger">Expired: <strong>{stats.amcExpired}</strong></span>
          </div>
        </div>

        <div className="d-flex gap-3 align-items-center">
          {/* Search */}
          <div className="position-relative" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder="Search name, code, serial..."
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

          {/* Export */}
          <button
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ height: 40, fontSize: "0.85rem", borderRadius: "4px", fontWeight: 500 }}
            onClick={() => setIsExportModalOpen(true)}
          >
            <i className="bi bi-download me-2" /> Export
          </button>

          {/* Add Asset */}
          <button
            className="btn d-flex align-items-center gap-2 px-4"
            style={{
              backgroundColor: "#014aad", color: "#fff", fontWeight: 500,
              borderRadius: "4px", height: 40, fontSize: "0.85rem", border: "none",
            }}
            onClick={() => { setSelectedAsset(null); setModalMode("create"); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg" /> Add Asset
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
          {categoryFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Category: <strong>{categoryFilter}</strong>
              <button onClick={() => setCategoryFilter("All")} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
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
      <AssetFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={v => { setStatusFilter(v); setCurrentPage(1); }}
        categoryFilter={categoryFilter}
        setCategoryFilter={v => { setCategoryFilter(v); setCurrentPage(1); }}
        onReset={handleReset}
      />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Table
        columns={columns}
        data={assets}
        isLoading={isLoading}
        loadingMessage="Fetching assets..."
        emptyMessage={
          activeFilters > 0
            ? "No assets match the current filters."
            : "No assets found. Add your first asset."
        }
        containerClassName="table-responsive-container table-responsive flex-grow-1"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* ── Detail View ───────────────────────────────────────────────────── */}
      {showDetail && detailAssetId && (
        <AssetDetailView
          assetId={detailAssetId}
          onClose={() => { setShowDetail(false); setDetailAssetId(""); }}
          onEdit={() => {
            const a = assets.find(x => x._id === detailAssetId);
            setSelectedAsset(a || null);
            setModalMode("edit");
            setShowDetail(false);
            setShowModal(true);
          }}
        />
      )}

      {/* ── Form Modal (create / edit) ─────────────────────────────────────── */}
      {showModal && (
        <AssetFormModal
          mode={modalMode}
          editData={selectedAsset}
          onSubmit={handleSave}
          onClose={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ── Export Modal ────────────────────────────────────────────────────── */}
      {isExportModalOpen && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 9999,
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg overflow-hidden"
            style={{ width: "100%", maxWidth: exportPreviewData ? "800px" : "450px", transition: "max-width 0.3s ease" }}
          >
            <div className="border-bottom p-3 d-flex justify-content-between align-items-center bg-light">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-spreadsheet text-success" /> Export Assets Data
              </h6>
              <button className="btn-close shadow-none" onClick={closeExportModal} />
            </div>

            <div className="p-4 d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">Date Range (Purchase Date)</label>
                  <div className="d-flex gap-2">
                    <input type="date" className="form-control form-control-sm" value={exportStartDate}
                      onChange={e => { setExportStartDate(e.target.value); setExportPreviewData(null); }} />
                    <span className="align-self-center text-muted">to</span>
                    <input type="date" className="form-control form-control-sm" value={exportEndDate}
                      onChange={e => { setExportEndDate(e.target.value); setExportPreviewData(null); }} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">Export Format</label>
                  <select className="form-select form-select-sm" value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                    <option value="excel">Excel (.csv)</option>
                    <option value="pdf">PDF Document</option>
                  </select>
                </div>
              </div>

              {exportPreviewData && (
                <div className="border rounded-3 overflow-hidden bg-light">
                  <div className="p-2 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <span className="small fw-bold text-primary">Previewing {exportPreviewData.length} Records</span>
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">
                      Total Value: ₹ {exportPreviewData.reduce((s, a) => s + (a.purchaseValue || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                    <table className="table table-sm mb-0 align-middle text-nowrap" style={{ fontSize: "0.75rem" }}>
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>Asset Code</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Value &amp; Date</th>
                          <th>Created By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportPreviewData.slice(0, 10).map((a, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{a.assetCode}</td>
                            <td>{a.assetDescription}</td>
                            <td>{a.category}</td>
                            <td>
                              <div className="fw-bold text-dark">₹ {a.purchaseValue?.toLocaleString() || 0}</div>
                              <div className="text-muted" style={{ fontSize: "0.65rem" }}>
                                {a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : "N/A"}
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold">
                                {a.createdBy ? (typeof a.createdBy === "object" ? a.createdBy.name : "System") : "System"}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {exportPreviewData.length > 10 && (
                          <tr><td colSpan={5} className="text-center text-muted">...and {exportPreviewData.length - 10} more rows</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 justify-content-end mt-2">
                <button className="btn btn-light btn-sm fw-bold px-3 border" onClick={handlePreviewExport}>
                  <i className="bi bi-eye" /> Preview Data
                </button>
                <button
                  className={`btn btn-${exportFormat === "pdf" ? "danger" : "success"} btn-sm fw-bold px-3 shadow-sm`}
                  onClick={handleDownloadExport}
                >
                  <i className={`bi bi-${exportFormat === "pdf" ? "file-earmark-pdf" : "download"}`} />{" "}
                  Download {exportFormat.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
