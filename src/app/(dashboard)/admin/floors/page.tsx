"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import FloorModal from "@/components/dashboard/FloorModal";

const ITEMS_PER_PAGE = 10;

// ── Floor Filter Drawer Component ────────────────────────────────────────────
interface FloorFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onApply: () => void;
  onReset: () => void;
}

function FloorFilterDrawer({
  isOpen,
  onClose,
  properties,
  selectedPropertyId,
  setSelectedPropertyId,
  statusFilter,
  setStatusFilter,
  onApply,
  onReset,
}: FloorFilterDrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: isOpen ? 0 : -340,
          width: 340,
          height: "100vh",
          background: "#fff",
          borderLeft: "1px solid #e2e8f0",
          zIndex: 1001,
          transition: "right 0.3s ease-in-out",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
            Filter Floors
          </span>
          <button onClick={onClose} className="btn-close shadow-none" style={{ fontSize: "0.8rem" }} />
        </div>

        <div className="flex-grow-1">
          {/* Property Filter */}
          <div className="mb-4">
            <label className="form-label fw-bold text-muted" style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>
              Property Name
            </label>
            <select
              className="form-select shadow-none"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="All">All Properties</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <label className="form-label fw-bold text-muted" style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>
              Operational Status
            </label>
            <select
              className="form-select shadow-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="d-flex gap-2 pt-3 border-top">
          <button
            onClick={onReset}
            className="btn btn-sm btn-light border flex-grow-1 py-2"
            style={{ fontSize: "0.82rem", fontWeight: 600, borderRadius: "6px" }}
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className="btn btn-sm text-white flex-grow-1 py-2"
            style={{ backgroundColor: "#014aad", fontSize: "0.82rem", fontWeight: 600, borderRadius: "6px" }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Floors Page ─────────────────────────────────────────────────────────
export default function FloorsPage() {
  const [floors, setFloors] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  
  // Search & Filter state
  const [selectedPropertyId, setSelectedPropertyId] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFloor, setEditFloor] = useState<any>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search logic
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {
      page: String(currentPage),
      limit: String(ITEMS_PER_PAGE),
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (selectedPropertyId !== "All") p.property = selectedPropertyId;
    if (statusFilter !== "All") p.status = statusFilter;
    return new URLSearchParams(p).toString();
  }, [currentPage, debouncedSearch, selectedPropertyId, statusFilter]);

  const fetchFloors = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await api.get(`/floors?${buildParams()}`);
      if (r.success) {
        setFloors(r.data);
        setTotalPages(r.totalPages || r.pagination?.pages || 1);
        setTotalItems(r.total || r.pagination?.total || r.data.length);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  const fetchProperties = async () => {
    try {
      const r = await api.get("/properties");
      if (r.success && r.data) {
        setProperties(r.data);
      }
    } catch {}
  };

  const handleSaveFloor = async (data: any) => {
    try {
      if (editFloor) await api.put(`/floors/${editFloor._id}`, data);
      else await api.post("/floors", data);
      fetchFloors();
    } catch {}
    setIsModalOpen(false);
    setEditFloor(null);
  };

  const handleReset = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedPropertyId("All");
    setStatusFilter("All");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const activeFilters = [
    debouncedSearch.trim() !== "",
    selectedPropertyId !== "All",
    statusFilter !== "All",
  ].filter(Boolean).length;

  const columns: TableColumn<any>[] = [
    {
      header: "#",
      style: { width: 56 },
      render: (_, i) => (
        <span className="text-muted fw-semibold" style={{ fontSize: "0.8rem" }}>
          {String((currentPage - 1) * ITEMS_PER_PAGE + i + 1).padStart(3, "0")}
        </span>
      ),
    },
    {
      header: "Floor Name",
      render: (f) => (
        <div>
          <Link href={`/admin/floors/${f._id}`} className="fw-bold text-dark text-decoration-none" style={{ fontSize: "0.88rem" }}>
            {f.floorName || `Floor ${f.floorNumber}`}
          </Link>
          <div className="text-muted" style={{ fontSize: "0.74rem" }}>
            {f.property?.propertyName || "—"}
          </div>
        </div>
      ),
    },
    {
      header: "Assigned Owner / Admin",
      render: (f) =>
        f.assignedOwner ? (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill" style={{ fontSize: "0.65rem" }}>
              Owner
            </span>
            <span className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
              {f.assignedOwner.ownerName}
            </span>
          </div>
        ) : f.assignedAdmin ? (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary rounded-pill" style={{ fontSize: "0.65rem" }}>
              Admin
            </span>
            <span className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
              {f.assignedAdmin.name}
            </span>
          </div>
        ) : (
          <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: "0.72rem" }}>
            Unassigned
          </span>
        ),
    },
    {
      header: "Contact",
      render: (f) => {
        const contact = f.assignedOwner || f.assignedAdmin;
        const phone = f.assignedOwner ? f.assignedOwner.contactNumber : f.assignedAdmin?.phoneNumber;
        const email = f.assignedOwner ? f.assignedOwner.emailId : f.assignedAdmin?.email;
        if (!contact) return <span className="text-muted small">—</span>;
        return (
          <div className="d-flex flex-column" style={{ fontSize: "0.82rem" }}>
            <span className="text-dark">{phone || "—"}</span>
            <span className="text-muted" style={{ fontSize: "0.72rem" }}>
              {email || "—"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Capacity (SFT)",
      render: (f) => (
        <span className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
          {f.totalSft ? f.totalSft.toLocaleString() : 0} SFT
        </span>
      ),
    },
    {
      header: "Occupied (SFT)",
      render: (f) => (
        <div>
          <span className="fw-bold text-danger" style={{ fontSize: "0.85rem" }}>
            {f.occupiedSft ? f.occupiedSft.toLocaleString() : 0} SFT
          </span>
          {f.totalSft > 0 && (
            <div className="text-muted" style={{ fontSize: "0.7rem" }}>
              {Math.round(((f.occupiedSft || 0) / f.totalSft) * 100)}% occupied
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      render: (f) => (
        <span
          className={`badge rounded-pill px-2 py-1 fw-bold border ${
            f.status === "Active"
              ? "bg-success bg-opacity-10 text-success border-success"
              : "bg-warning bg-opacity-10 text-warning border-warning"
          }`}
          style={{ fontSize: "0.72rem" }}
        >
          {f.status || "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      style: { textAlign: "right" as const },
      render: (f) => (
        <div className="d-flex gap-2 justify-content-end" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/floors/${f._id}`}
            title="View Details"
            className="d-flex align-items-center justify-content-center text-decoration-none"
            style={{
              width: 32,
              height: 32,
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#64748b",
            }}
          >
            <i className="bi bi-eye" style={{ fontSize: "0.9rem" }}></i>
          </Link>
          <button
            title="Edit"
            onClick={() => {
              setEditFloor(f);
              setIsModalOpen(true);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="bi bi-pencil-square" style={{ fontSize: "0.9rem", color: "#014aad" }}></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div
      className="p-0 d-flex flex-column bg-white border rounded-4"
      style={{ height: "calc(100vh - 104px)", fontFamily: "var(--font-geist-sans)", overflow: "hidden" }}
    >
      <FloorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditFloor(null);
        }}
        onSave={handleSaveFloor}
        editData={editFloor}
      />

      <FloorFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onApply={() => {
          setCurrentPage(1);
          setShowFilters(false);
        }}
        onReset={handleReset}
      />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center px-4 pt-3 pb-2 flex-shrink-0" style={{ backgroundColor: "#ffffff" }}>
        <div>
          <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>
            Floors Management
          </span>
          <div className="text-muted mt-1" style={{ fontSize: "0.72rem" }}>
            Configure floor plans, assign administrators, and manage ownership
          </div>
        </div>
        
        {/* Controls */}
        <div className="d-flex gap-2 align-items-center">
          {/* Search bar */}
          <div className="position-relative">
            <input
              type="text"
              className="form-control shadow-none"
              placeholder="Search floors..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: 210,
                height: 40,
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "0.82rem",
                paddingRight: 32,
              }}
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "1.1rem",
                }}
              >
                &times;
              </button>
            ) : (
              <i className="bi bi-search position-absolute text-muted" style={{ right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }} />
            )}
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 position-relative"
            style={{
              height: 40,
              fontSize: "0.82rem",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              fontWeight: 500,
              backgroundColor: activeFilters > 0 ? "#f8fafc" : "#fff",
            }}
          >
            <i className="bi bi-funnel" /> Filters
            {activeFilters > 0 && (
              <span
                className="position-absolute bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  fontSize: "0.68rem",
                  backgroundColor: "#014aad",
                }}
              >
                {activeFilters}
              </span>
            )}
          </button>

          {/* Add Floor Button */}
          <button
            onClick={() => {
              setEditFloor(null);
              setIsModalOpen(true);
            }}
            className="btn fw-bold text-white border-0 d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: "#014aad",
              fontSize: "0.85rem",
              height: 40,
              borderRadius: "6px",
              padding: "0 16px",
              whiteSpace: "nowrap",
            }}
          >
            <i className="bi bi-plus-lg"></i> Add Floor
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-grow-1 overflow-hidden d-flex flex-column">
        <Table
          columns={columns}
          data={floors}
          isLoading={isLoading}
          loadingMessage="Loading floors..."
          emptyMessage="No floors configured matching the selected filters."
          containerClassName="table-responsive"
          containerStyle={{ flexGrow: 1, overflowY: "auto" }}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
