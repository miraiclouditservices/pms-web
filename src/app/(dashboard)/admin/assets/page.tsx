"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import AssetModal, { ModalMode } from "@/components/dashboard/AssetModal";
import { exportAssetsToExcel } from "@/utils/exportAssetsExcel";
import { exportAssetsToPdf } from "@/utils/exportAssetsPdf";

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState("excel");
  const [exportPreviewData, setExportPreviewData] = useState<any[] | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["All", "HVAC", "Electrical", "Plumbing", "IT & Tech", "Security", "Furniture", "Others"];

  const metrics = {
    total: assets.length,
    amcActive: assets.filter(a => a.amcEndDate && new Date(a.amcEndDate) >= new Date()).length,
    amcExpired: assets.filter(a => a.amcEndDate && new Date(a.amcEndDate) < new Date()).length,
    amcExpiringSoon: assets.filter(a => {
      if (!a.amcEndDate) return false;
      const diff = Math.ceil((new Date(a.amcEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 10;
    }).length,
    warrantyExpiringSoon: assets.filter(a => {
      if (!a.warrantyEndDate) return false;
      const diff = Math.ceil((new Date(a.warrantyEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 10;
    }).length,
    noAmc: assets.filter(a => !a.amcEndDate).length,
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/assets");
      if (response.success) setAssets(response.data);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.assetDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "All" || a.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenModal = (mode: ModalMode, asset: any = null) => {
    setModalMode(mode);
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (savedData: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/assets/${savedData._id}`, savedData)
          : await api.post("/assets", savedData);
      if (response.success) fetchAssets();
    } catch (err) {
      console.error("Failed to save asset:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        const response = await api.delete(`/assets/${id}`);
        if (response.success) fetchAssets();
      } catch (err) {
        console.error("Failed to delete asset:", err);
      }
    }
  };

  const getFilteredExportData = () => {
    if (!exportStartDate || !exportEndDate) return assets;
    return assets.filter(a => {
      const pd = new Date(a.purchaseDate);
      return pd >= new Date(exportStartDate) && pd <= new Date(exportEndDate);
    });
  };

  const handleDownloadExcel = () => {
    const dataToExport = getFilteredExportData();
    if (dataToExport.length === 0) { alert("No assets found in the selected date range!"); return; }
    const totalValue = dataToExport.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
    if (exportFormat === "pdf") {
      exportAssetsToPdf(dataToExport, totalValue);
    } else {
      exportAssetsToExcel(dataToExport);
    }
    setIsExportModalOpen(false);
  };

  const handlePreview = () => {
    const dataToExport = getFilteredExportData();
    if (dataToExport.length === 0) { alert("No assets match this criteria."); setExportPreviewData(null); }
    else setExportPreviewData(dataToExport);
  };

  const closeExportModal = () => { setIsExportModalOpen(false); setExportPreviewData(null); };

  const getAmcInfo = (asset: any) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!asset.amcEndDate) return { status: "No AMC", badge: "secondary", alert: null };
    const aDate = new Date(asset.amcEndDate); aDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((aDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "AMC Expired", badge: "danger", alert: null };
    if (diffDays <= 10) return { status: "AMC Active", badge: "success", alert: `AMC expires in ${diffDays} days` };
    return { status: "AMC Active", badge: "success", alert: null };
  };

  const getWarrantyInfo = (asset: any) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!asset.warrantyEndDate) return { status: "No Warranty", badge: "secondary", alert: null };
    const wDate = new Date(asset.warrantyEndDate); wDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((wDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "Warranty Expired", badge: "danger", alert: null };
    if (diffDays <= 10) return { status: "Warranty Active", badge: "success", alert: `Warranty expires in ${diffDays} days` };
    return { status: "Warranty Active", badge: "success", alert: null };
  };

  // ─── Shared thead cell style ───────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 9,
    fontSize: "0.75rem",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    border: "none",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "12px 16px",
    whiteSpace: "nowrap",
  };

  return (
    <div className="container-fluid p-0">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
            Assets Management
          </h2>
          <p className="text-muted small mb-0">View and manage all global assets</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-secondary btn-sm rounded px-3 fw-bold bg-white shadow-sm d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", height: "36px" }}
            onClick={() => setIsExportModalOpen(true)}
          >
            <i className="bi bi-download" /> Export
          </button>
          <button
            className="btn btn-sm rounded px-3 shadow-sm fw-bold text-white border-0 d-flex align-items-center gap-2"
            style={{ backgroundColor: "#014aad", fontSize: "0.85rem", height: "36px" }}
            onClick={() => handleOpenModal("create")}
          >
            <i className="bi bi-plus-circle" /> Add New
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Assets",      sub: "Registered Assets",   value: metrics.total,                icon: "bi-box-seam",           color: "#014aad" },
          { label: "AMC Active",        sub: "Currently Active",    value: metrics.amcActive,            icon: "bi-shield-check",       color: "#16a34a" },
          { label: "AMC Expiring Soon", sub: "Expiring in 10 days", value: metrics.amcExpiringSoon,      icon: "bi-clock-history",      color: "#eab308" },
          { label: "AMC Expired",       sub: "Needs Renewal",       value: metrics.amcExpired,           icon: "bi-shield-x",           color: "#dc2626" },
          { label: "Warranty Expiring", sub: "Expiring in 10 days", value: metrics.warrantyExpiringSoon, icon: "bi-exclamation-circle", color: "#f97316" },
          { label: "Without AMC",       sub: "No AMC Assigned",     value: metrics.noAmc,               icon: "bi-file-earmark-x",     color: "#6b7280" },
        ].map(({ label, sub, value, icon, color }) => (
          <div className="col-md-2" key={label}>
            <div
              className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center gap-3 h-100"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: "42px", height: "42px", backgroundColor: `${color}18`, color }}
              >
                <i className={`bi ${icon}`} style={{ fontSize: "1.1rem" }} />
              </div>
              <div>
                <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.05em" }}>{label}</div>
                <h4 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.02em" }}>{value}</h4>
                <div className="text-muted" style={{ fontSize: "0.68rem" }}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Category Filter Bar ────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border px-3 py-2 mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        {/* Search */}
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "320px" }}>
          <i className="bi bi-search text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none small"
            placeholder="Search by asset name, code, serial..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>

        {/* Category Tabs */}
        <div className="d-flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveTab(cat); setCurrentPage(1); }}
              className="btn btn-sm"
              style={{
                fontSize: "0.78rem",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: activeTab === cat ? "#014aad" : "transparent",
                color: activeTab === cat ? "#fff" : "#6b7280",
                border: activeTab === cat ? "1px solid #014aad" : "1px solid #e5e7eb",
                fontWeight: activeTab === cat ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Icon */}
        <button className="btn btn-white border shadow-sm" style={{ height: "34px", width: "34px", padding: 0, borderRadius: "8px" }}>
          <i className="bi bi-funnel text-muted" />
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <div className="table-responsive" style={{ overflowY: "auto" }}>
          <table className="table mb-0 align-middle text-nowrap" style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead>
              <tr>
                <th style={thStyle}>Asset Code</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Purchase Value</th>
                <th style={thStyle}>Purchase Date</th>

                <th style={thStyle}>AMC Status</th>
                <th style={thStyle}>Alerts</th>
                <th style={{ ...thStyle, textAlign: "center", borderTopRightRadius: "0px" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading assets...
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-inbox me-2" />No assets found.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset, index) => {
                  const amc = getAmcInfo(asset);
                  const warranty = getWarrantyInfo(asset);
                  const hasAlerts = amc.alert || warranty.alert;
                  const isExpired = amc.badge === "danger" || warranty.badge === "danger";

                  const rowBg = isExpired
                    ? "#fff5f5"
                    : index % 2 === 0
                    ? "#ffffff"
                    : "#f8fafc";

                  return (
                    <tr key={asset._id} style={{ backgroundColor: rowBg, borderBottom: "1px solid #f1f5f9" }}>



                      {/* Asset Code */}
                      <td style={{ padding: "10px 16px" }}>
                        <span className="badge bg-light text-dark border px-2" style={{ fontSize: "0.75rem" }}>
                          {asset.assetCode || "—"}
                        </span>
                      </td>


                      {/* Category */}
                      <td style={{ padding: "10px 16px", fontSize: "0.8rem", color: "#64748b" }}>
                        {asset.category || "—"}
                      </td>

                      {/* Location */}
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                          {asset.property?.propertyName || "Main Complex"}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          Floor {asset.floorNumber || "0"}
                          {asset.unit && ` · Unit ${asset.unit.unitNumber}`}
                        </div>
                      </td>

                      {/* Purchase Value */}
                      <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: "0.85rem", color: "#014aad" }}>
                        ₹ {asset.purchaseValue?.toLocaleString() || "0"}
                      </td>

                      {/* Purchase Date */}
                      <td style={{ padding: "10px 16px", fontSize: "0.8rem", color: "#64748b" }}>
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "N/A"}
                      </td>



                      {/* AMC Status */}
                      <td style={{ padding: "10px 16px" }}>
                        <span
                          className={`badge bg-${amc.badge} bg-opacity-10 text-${amc.badge} rounded-pill`}
                          style={{ fontSize: "0.72rem" }}
                        >
                          {amc.status}
                        </span>
                      </td>

                      {/* Alerts */}
                      <td style={{ padding: "10px 16px" }}>
                        {hasAlerts ? (
                          <div className="d-flex flex-column gap-1">
                            {warranty.alert && (
                              <span className="badge bg-warning text-dark py-1 px-2 d-flex align-items-center gap-1" style={{ fontSize: "0.7rem" }}>
                                <i className="bi bi-bell-fill" /> {warranty.alert}
                              </span>
                            )}
                            {amc.alert && (
                              <span className="badge bg-warning text-dark py-1 px-2 d-flex align-items-center gap-1" style={{ fontSize: "0.7rem" }}>
                                <i className="bi bi-bell-fill" /> {amc.alert}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <div className="d-flex gap-2 justify-content-center align-items-center">
                          <button
                            className="btn btn-link p-0"
                            title="View Asset"
                            onClick={() => handleOpenModal("view", asset)}
                          >
                            <i className="bi bi-eye-fill" style={{ fontSize: "1.05rem", color: "#4b5563" }} />
                          </button>
                          <button
                            className="btn btn-link p-0"
                            title="Edit Asset"
                            onClick={() => handleOpenModal("edit", asset)}
                          >
                            <i className="bi bi-pencil-square" style={{ fontSize: "1.05rem", color: "#014aad" }} />
                          </button>
                          <button
                            className="btn btn-link p-0"
                            title="Delete Asset"
                            onClick={() => handleDelete(asset._id)}
                          >
                            <i className="bi bi-trash3" style={{ fontSize: "1.05rem", color: "#dc2626" }} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAssets.length)}–{Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-white border px-3 shadow-sm d-flex align-items-center gap-1 text-muted fw-medium"
              style={{ fontSize: "0.85rem", borderRadius: "20px" }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            >
              <i className="bi bi-chevron-left small" /> Previous
            </button>
            <button
              className="btn btn-white border px-4 shadow-sm d-flex align-items-center gap-1 text-muted fw-medium"
              style={{ fontSize: "0.85rem", borderRadius: "20px" }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            >
              Next <i className="bi bi-chevron-right small" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Asset Modal ─────────────────────────────────────────────────────── */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAsset}
        editData={selectedAsset}
        mode={modalMode}
      />

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
                              <div className="text-muted" style={{ fontSize: "0.65rem" }}>
                                {a.createdBy && typeof a.createdBy === "object" ? (a.createdBy.email || a.createdBy.phoneNumber || "") : ""}
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
                <button className="btn btn-light btn-sm fw-bold px-3 border" onClick={handlePreview}>
                  <i className="bi bi-eye" /> Preview Data
                </button>
                <button
                  className={`btn btn-${exportFormat === "pdf" ? "danger" : "success"} btn-sm fw-bold px-3 shadow-sm`}
                  onClick={handleDownloadExcel}
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
