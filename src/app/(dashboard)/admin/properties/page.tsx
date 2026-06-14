"use client";

import Link from "next/link";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import PropertyModal from "@/components/dashboard/PropertyModal";

const ITEMS_PER_PAGE = 10;

// ── Filter Drawer ────────────────────────────────────────────────────────────
function PropertyFilterDrawer({
  isOpen, onClose,
  statusFilter, setStatusFilter,
  typeFilter, setTypeFilter,
  onReset,
}: any) {
  if (!isOpen) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.25)", zIndex:1040 }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        style={{
          position:"fixed", top:0, right:0, bottom:0, width:320,
          backgroundColor:"#fff", zIndex:1050, boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",
          display:"flex", flexDirection:"column",
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill text-primary" style={{ color:"#014aad" }}></i>
            Filter Properties
          </h6>
          <button className="btn-close shadow-none" onClick={onClose} />
        </div>

        {/* Filters */}
        <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4">
          {/* Status */}
          <div>
            <label className="form-label fw-bold text-muted mb-2" style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>Status</label>
            <div className="d-grid gap-2" style={{ gridTemplateColumns:"1fr 1fr", display:"grid" }}>
              {["All","Active","Inactive"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`btn btn-sm fw-semibold ${statusFilter===s ? "text-white" : "btn-light border"}`}
                  style={{ borderRadius:6, height:36, fontSize:"0.82rem", backgroundColor: statusFilter===s ? "#014aad" : undefined }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="form-label fw-bold text-muted mb-2" style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>Property Type</label>
            <div className="d-grid gap-2" style={{ gridTemplateColumns:"1fr 1fr", display:"grid" }}>
              {["All","Commercial","Residential","Mixed-Use","Industrial"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`btn btn-sm fw-semibold ${typeFilter===t ? "text-white" : "btn-light border"}`}
                  style={{ borderRadius:6, height:36, fontSize:"0.82rem", backgroundColor: typeFilter===t ? "#014aad" : undefined }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-top d-flex gap-2">
          <button className="btn btn-light border flex-grow-1 fw-semibold" style={{ borderRadius:6, fontSize:"0.85rem" }} onClick={onReset}>
            Reset All
          </button>
          <button className="btn fw-semibold text-white flex-grow-1" style={{ borderRadius:6, fontSize:"0.85rem", backgroundColor:"#014aad" }} onClick={onClose}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Content ─────────────────────────────────────────────────────────────
function PropertiesContent() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<any>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedSearch(val); setCurrentPage(1); }, 400);
  };

  useEffect(() => { setCurrentPage(1); }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("user");
      if (s) { try { setUser(JSON.parse(s)); } catch {} }
    }
  }, []);

  // legacy ?action=add support — now redirects to /new page
  useEffect(() => {}, [searchParams, user]);

  useEffect(() => { if (user?.role === "Owner") fetchOwnerProfile(); }, [user]);

  const buildParams = useCallback(() => {
    const p: Record<string,string> = { page: String(currentPage), limit: String(ITEMS_PER_PAGE) };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter !== "All") p.status = statusFilter;
    if (typeFilter !== "All") p.type = typeFilter;
    return new URLSearchParams(p).toString();
  }, [currentPage, debouncedSearch, statusFilter, typeFilter]);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await api.get(`/properties?${buildParams()}`);
      if (r.success) {
        setProperties(r.data);
        setTotalPages(r.pagination?.pages || 1);
        setTotalItems(r.pagination?.total || r.data.length);
      }
    } catch {} finally { setIsLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const fetchOwnerProfile = async () => {
    try { const r = await api.get("/owners/my-profile"); if (r.success) setOwnerProfile(r.data); } catch {}
  };

  const handleSave = async (data: any) => {
    try {
      const r = editProperty
        ? await api.put(`/properties/${editProperty._id}`, data)
        : await api.post("/properties", data);
      if (r.success) fetchProperties();
    } catch {}
    setEditProperty(null);
    setIsModalOpen(false);
  };

  const handleReset = () => {
    setSearchQuery(""); setDebouncedSearch("");
    setStatusFilter("All"); setTypeFilter("All");
    setCurrentPage(1);
  };

  const activeFilters = [
    debouncedSearch.trim() !== "",
    statusFilter !== "All",
    typeFilter !== "All",
  ].filter(Boolean).length;

  const isAdmin = !user || ["Admin","SUPER_ADMIN"].includes(user.role || "");

  // ── TABLE COLUMNS ──────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = [
    {
      header: "Building / Block",
      render: (p) => (
        <div>
          <Link href={`/admin/properties/${p._id}`} className="fw-bold text-dark text-decoration-none" style={{ fontSize:"0.88rem" }}>
            {p.propertyName}
          </Link>
          <div className="text-muted" style={{ fontSize:"0.74rem" }}>{p.propertyAddress || p.location || "No address"}</div>
        </div>
      ),
    },
    {
      header: "Property Type",
      render: (p) => (
        <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize:"0.78rem" }}>
          {p.propertyType || "—"}
        </span>
      ),
    },
    {
      header: "Structure",
      render: (p) => (
        <div>
          <div className="fw-semibold text-dark" style={{ fontSize:"0.85rem" }}>{p.totalFloors || 0} Floors</div>
          <div className="text-muted" style={{ fontSize:"0.74rem" }}>{p.towers || 1} Tower(s)</div>
        </div>
      ),
    },
    {
      header: "Total SFT",
      render: (p) => (
        <span className="fw-bold text-dark" style={{ fontSize:"0.85rem" }}>
          {p.totalSft ? p.totalSft.toLocaleString() : "0"} SFT
        </span>
      ),
    },
    {
      header: "Occupied SFT",
      render: (p) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize:"0.85rem" }}>{p.occupiedSft ? p.occupiedSft.toLocaleString() : "0"} SFT</div>
          {p.totalSft > 0 && (
            <div className="text-muted" style={{ fontSize:"0.7rem" }}>{Math.round(((p.occupiedSft||0)/p.totalSft)*100)}% occupied</div>
          )}
        </div>
      ),
    },
    {
      header: "Added By",
      render: (p) => (
        <span className="text-muted" style={{ fontSize:"0.82rem" }}>{p.createdBy?.name || "Admin"}</span>
      ),
    },
    {
      header: "Status",
      render: (p) => (
        <span className={`badge rounded-pill px-2 py-1 fw-bold border ${
          p.status==="Active" ? "bg-success bg-opacity-10 text-success border-success" : "bg-warning bg-opacity-10 text-warning border-warning"
        }`} style={{ fontSize:"0.72rem" }}>
          {p.status || "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      style: { textAlign:"center" as const },
      render: (p) => (
        <div className="d-flex gap-2 justify-content-center" onClick={e => e.stopPropagation()}>
          <Link
            href={`/admin/properties/${p._id}`}
            title="View Details"
            className="d-flex align-items-center justify-content-center"
            style={{ width:32, height:32, borderRadius:"6px", border:"1px solid #e2e8f0", background:"#fff", textDecoration:"none", color:"#64748b", transition:"background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background="#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background="#fff")}
          >
            <i className="bi bi-eye" style={{ fontSize:"0.9rem" }}></i>
          </Link>
          {isAdmin && (
            <button
              title="Edit"
              onClick={() => { setEditProperty(p); setIsModalOpen(true); }}
              style={{ width:32, height:32, borderRadius:"6px", border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background="#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background="#fff")}
            >
              <i className="bi bi-pencil" style={{ fontSize:"0.85rem", color:"#014aad" }}></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── OWNER VIEW ──────────────────────────────────────────────────────────────
  if (user?.role === "Owner") {
    return (
      <div className="p-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-1 text-dark" style={{ fontSize:"1rem" }}>My Office Details</h2>
          <p className="text-muted small mb-0">View your assigned office details and active units.</p>
        </div>
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="bg-white border rounded-4 p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width:48, height:48, backgroundColor:"#e6f4ea", color:"#137333" }}>
                  <i className="bi bi-briefcase-fill" style={{ fontSize:"1.4rem" }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0 text-dark">{ownerProfile?.ownerName || "Office Profile"}</h5>
                  <span className="badge fw-semibold" style={{ backgroundColor:"#e6f4ea", color:"#137333", fontSize:"0.72rem" }}>Active Profile</span>
                </div>
              </div>
              <hr className="opacity-10" />
              {[["Contact Person",ownerProfile?.contactPerson],["Designation",ownerProfile?.designation],["Email",ownerProfile?.emailId],["Phone",ownerProfile?.contactNumber],["GST",ownerProfile?.gstNumber],["Type",ownerProfile?.ownerType]].map(([l,v]) => (
                <div key={l} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom:"1px solid #f1f5f9", fontSize:"0.85rem" }}>
                  <span className="text-muted fw-semibold">{l}</span>
                  <span className="fw-bold text-dark">{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-6">
            <div className="bg-white border rounded-4 p-4 h-100">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><i className="bi bi-building text-success"></i> Assigned Units</h6>
              <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight:340 }}>
                {ownerProfile?.unitsAssigned?.length > 0 ? ownerProfile.unitsAssigned.map((u: any) => (
                  <div key={u._id} className="p-3 border rounded-3 d-flex align-items-center justify-content-between bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width:38, height:38, backgroundColor:"#e8f0fe", color:"#1a73e8" }}>
                        <i className="bi bi-door-open-fill"></i>
                      </div>
                      <div>
                        <div className="fw-bold text-dark small">Unit {u.unitNumber}</div>
                        <div className="text-muted" style={{ fontSize:"0.74rem" }}>{u.property?.propertyName || "—"}</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="badge d-block mb-1 small fw-bold" style={{ backgroundColor:"#e8f0fe", color:"#1a73e8" }}>Floor {u.floorNumber}</span>
                      <span className="text-muted small fw-bold">{u.sqft ? Math.round(u.sqft).toLocaleString() : "N/A"} SFT</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-building-dash d-block mb-2" style={{ fontSize:"2rem" }}></i>
                    <span className="small">No units assigned.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN TABLE VIEW ────────────────────────────────────────────────────────
  return (
    <div
      className="p-0 d-flex flex-column bg-white border rounded-4"
      style={{ height:"calc(100vh - 104px)", fontFamily:"var(--font-geist-sans)", overflow:"hidden" }}
    >
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditProperty(null); }}
        onSave={handleSave}
        editData={editProperty}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center pb-2 pt-3 px-4 flex-shrink-0" style={{ backgroundColor:"#ffffff" }}>
        <div>
          <span className="fw-bold text-dark" style={{ fontSize:"1rem" }}>Property Master</span>
          <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize:"0.72rem" }}>
            <span>Total: <strong className="text-dark">{totalItems}</strong></span>
            <span>·</span>
            <span className="text-success">Active: <strong>{properties.filter(p=>p.status==="Active").length}</strong></span>
            <span>·</span>
            <span className="text-warning">Inactive: <strong>{properties.filter(p=>p.status!=="Active").length}</strong></span>
          </div>
        </div>

        <div className="d-flex gap-3 align-items-center">
          {/* Search */}
          <div className="position-relative" style={{ width:260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder="Search name, address, type..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ borderRadius:"4px", border:"1px solid #e0e0e0", fontSize:"0.85rem" }}
            />
            {searchQuery ? (
              <button onClick={() => handleSearchChange("")}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", border:"none", background:"none", cursor:"pointer", color:"#94a3b8", fontSize:"0.85rem", lineHeight:1 }}>
                ×
              </button>
            ) : (
              <i className="bi bi-search position-absolute text-muted" style={{ right:12, top:"50%", transform:"translateY(-50%)", fontSize:"0.8rem" }} />
            )}
          </div>

          {/* Filter Toggle */}
          <button
            className={`btn border d-flex align-items-center justify-content-center position-relative`}
            onClick={() => setShowFilters(true)}
            style={{ width:40, height:40, borderRadius:"4px", backgroundColor: showFilters ? "#014aad" : "#fff", borderColor: showFilters ? "#014aad" : "#e0e0e0" }}
            title="Advanced Filters"
          >
            <i className={`bi bi-funnel ${showFilters ? "text-white" : "text-dark"}`} />
            {activeFilters > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize:"0.6rem", padding:"2px 5px" }}>
                {activeFilters}
              </span>
            )}
          </button>

          {/* Add Property */}
          {isAdmin && (
            <button
              onClick={() => { setEditProperty(null); setIsModalOpen(true); }}
              className="btn d-flex align-items-center gap-2 px-4"
              style={{ backgroundColor:"#014aad", color:"#fff", fontWeight:500, borderRadius:"4px", height:40, fontSize:"0.85rem", border:"none" }}
            >
              <i className="bi bi-plus-lg" /> Add Property
            </button>
          )}
        </div>
      </div>

      {/* ── Active Filter Chips ──────────────────────────────────────────────── */}
      {activeFilters > 0 && (
        <div className="d-flex align-items-center gap-2 px-4 pb-2 flex-shrink-0 flex-wrap">
          {debouncedSearch && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize:"0.75rem" }}>
              Search: <strong>{debouncedSearch}</strong>
              <button onClick={() => handleSearchChange("")} style={{ border:"none", background:"none", cursor:"pointer", marginLeft:4, color:"#64748b" }}>×</button>
            </span>
          )}
          {statusFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize:"0.75rem" }}>
              Status: <strong>{statusFilter}</strong>
              <button onClick={() => setStatusFilter("All")} style={{ border:"none", background:"none", cursor:"pointer", marginLeft:4, color:"#64748b" }}>×</button>
            </span>
          )}
          {typeFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize:"0.75rem" }}>
              Type: <strong>{typeFilter}</strong>
              <button onClick={() => setTypeFilter("All")} style={{ border:"none", background:"none", cursor:"pointer", marginLeft:4, color:"#64748b" }}>×</button>
            </span>
          )}
          <button onClick={handleReset} className="btn btn-link p-0 text-danger" style={{ fontSize:"0.75rem", textDecoration:"none" }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── Filter Drawer ─────────────────────────────────────────────────────── */}
      <PropertyFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        statusFilter={statusFilter}
        setStatusFilter={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}
        typeFilter={typeFilter}
        setTypeFilter={(v: string) => { setTypeFilter(v); setCurrentPage(1); }}
        onReset={handleReset}
      />

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <Table
        columns={columns}
        data={properties}
        isLoading={isLoading}
        loadingMessage="Fetching properties..."
        emptyMessage={activeFilters > 0 ? "No properties match the current filters." : "No properties found. Add your first property."}
        containerClassName="table-responsive-container table-responsive flex-grow-1"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight:"60vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
