"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import UnitModal from "@/components/dashboard/UnitModal";

const ITEMS_PER_PAGE = 10;

const STATUS_COLOR: Record<string, string> = {
  Available: "success",
  Occupied: "primary",
  Reserved: "warning",
  Maintenance: "danger",
  "Under Maintenance": "danger",
};

// ── Unit Filter Drawer Component ─────────────────────────────────────────────
interface UnitFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  floors: any[];
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  selectedFloorId: string;
  setSelectedFloorId: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onApply: () => void;
  onReset: () => void;
}

function UnitFilterDrawer({
  isOpen,
  onClose,
  properties,
  floors,
  selectedPropertyId,
  setSelectedPropertyId,
  selectedFloorId,
  setSelectedFloorId,
  statusFilter,
  setStatusFilter,
  onApply,
  onReset,
}: UnitFilterDrawerProps) {
  const filteredFloors = floors.filter(
    (f) =>
      selectedPropertyId === "all" ||
      f.property === selectedPropertyId ||
      (f.property && f.property._id === selectedPropertyId)
  );

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
            Filter Units
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
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setSelectedFloorId("all");
              }}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyName}
                </option>
              ))}
            </select>
          </div>

          {/* Floor Filter */}
          <div className="mb-4">
            <label className="form-label fw-bold text-muted" style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>
              Floor Level
            </label>
            <select
              className="form-select shadow-none"
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              disabled={selectedPropertyId === "all"}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="all">All Floors</option>
              {filteredFloors.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.floorName || `Floor ${f.floorNumber}`}
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
              <option value="all">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Reserved">Reserved</option>
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

// ── Main Units Page ──────────────────────────────────────────────────────────
export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);

  // Search & Filter state
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedFloorId, setSelectedFloorId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    fetchFloors();
  }, []);

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {
      page: String(currentPage),
      limit: String(ITEMS_PER_PAGE),
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (selectedPropertyId !== "all") p.property = selectedPropertyId;
    if (selectedFloorId !== "all") p.floor = selectedFloorId;
    if (selectedStatus !== "all") p.unitStatus = selectedStatus;
    return new URLSearchParams(p).toString();
  }, [currentPage, debouncedSearch, selectedPropertyId, selectedFloorId, selectedStatus]);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await api.get(`/units?${buildParams()}`);
      if (r.success) {
        setUnits(r.data);
        setTotalPages(r.totalPages || r.pagination?.pages || 1);
        setTotalItems(r.total || r.pagination?.total || r.data.length);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const fetchProperties = async () => {
    try {
      const r = await api.get("/properties");
      if (r.success) setProperties(r.data);
    } catch {}
  };

  const fetchFloors = async () => {
    try {
      const r = await api.get("/floors?limit=100");
      if (r.success) setFloors(r.data);
    } catch {}
  };

  const handleSaveUnit = async (data: any) => {
    try {
      if (editUnit) await api.put(`/units/${editUnit._id}`, data);
      else await api.post("/units", data);
      fetchUnits();
    } catch {}
    setIsModalOpen(false);
    setEditUnit(null);
  };

  const handleReset = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedPropertyId("all");
    setSelectedFloorId("all");
    setSelectedStatus("all");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const activeFilters = [
    debouncedSearch.trim() !== "",
    selectedPropertyId !== "all",
    selectedFloorId !== "all",
    selectedStatus !== "all",
  ].filter(Boolean).length;

  const occupantDisplay = (unit: any) => {
    if (unit.lease) return { name: unit.lease.tenantName || "—", badge: "Lease Holder", color: "info", phone: unit.lease.tenantContact };
    if (unit.tenant) return { name: unit.tenant.tenantName || "—", badge: "Tenant", color: "primary", phone: unit.tenant.contactNumber };
    if (unit.owner) return { name: unit.owner.ownerName || "—", badge: "Office Owner", color: "success", phone: unit.owner.contactNumber };
    if (unit.ownerName) return { name: unit.ownerName, badge: "Office Owner", color: "success", phone: "" };
    return null;
  };

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
      header: "Unit Details",
      render: (u) => (
        <div className="d-flex align-items-center gap-3">
          <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38, backgroundColor: "#e8f0fe", color: "#1a73e8" }}>
            <i className="bi bi-door-open-fill"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <Link href={`/admin/units/${u._id}`} className="fw-bold text-dark text-decoration-none" style={{ fontSize: "0.88rem" }}>
                {u.unitName || `Unit ${u.unitNumber}`}
              </Link>
              <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: "0.65rem" }}>
                {u.sqft ? u.sqft.toLocaleString() : 0} SFT
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: "0.74rem" }}>
              {u.unitName ? `Unit ${u.unitNumber} · ${u.unitType}` : u.unitType}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Property / Floor",
      render: (u) => (
        <div>
          <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
            {u.property?.propertyName || "—"}
          </div>
          <span className="badge bg-light text-muted border rounded-pill mt-1" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>
            {u.floor?.floorName || `Floor ${u.floor?.floorNumber || u.floorNumber || "—"}`}
          </span>
        </div>
      ),
    },
    {
      header: "Occupant",
      render: (u) => {
        const occ = occupantDisplay(u);
        if (!occ) return <span className="text-muted small">—</span>;
        return (
          <div>
            <div className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: "0.85rem" }}>
              {occ.name}
            </div>
            {occ.phone && <div className="text-muted" style={{ fontSize: "0.72rem" }}>{occ.phone}</div>}
            <span className={`badge bg-${occ.color} bg-opacity-10 text-${occ.color} border border-${occ.color} border-opacity-25 rounded-pill mt-1`} style={{ fontSize: "0.6rem" }}>
              {occ.badge}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      render: (u) =>
        u.isMeetingRoom ? (
          <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-1 fw-bold" style={{ fontSize: "0.72rem" }}>
            Meeting Room
          </span>
        ) : (
          <span className={`badge bg-${STATUS_COLOR[u.unitStatus] || "secondary"} bg-opacity-10 text-${STATUS_COLOR[u.unitStatus] || "secondary"} border border-${STATUS_COLOR[u.unitStatus] || "secondary"} border-opacity-25 rounded-pill px-2 py-1 fw-bold`} style={{ fontSize: "0.72rem" }}>
            {u.unitStatus || "Available"}
          </span>
        ),
    },
    {
      header: "Actions",
      style: { textAlign: "right" as const },
      render: (u) => (
        <div className="d-flex gap-2 justify-content-end" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/units/${u._id}`}
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
              setEditUnit(u);
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
      <UnitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditUnit(null);
        }}
        onSave={handleSaveUnit}
        editData={editUnit}
      />

      <UnitFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        properties={properties}
        floors={floors}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        selectedFloorId={selectedFloorId}
        setSelectedFloorId={setSelectedFloorId}
        statusFilter={selectedStatus}
        setStatusFilter={setSelectedStatus}
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
            Units & SFT
          </span>
          <div className="text-muted mt-1" style={{ fontSize: "0.72rem" }}>
            Manage commercial units, office spaces, occupancy statuses, and area configurations
          </div>
        </div>

        {/* Controls */}
        <div className="d-flex gap-2 align-items-center">
          {/* Search bar */}
          <div className="position-relative">
            <input
              type="text"
              className="form-control shadow-none"
              placeholder="Search units..."
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

          {/* Add Unit Button */}
          <button
            onClick={() => {
              setEditUnit(null);
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
            <i className="bi bi-plus-lg"></i> Add Unit
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-grow-1 overflow-hidden d-flex flex-column">
        <Table
          columns={columns}
          data={units}
          isLoading={isLoading}
          loadingMessage="Loading units..."
          emptyMessage="No units configured matching the selected filters."
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
