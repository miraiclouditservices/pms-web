"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ITEMS_PER_PAGE = 10;

// ── Lease Filter Drawer Component ────────────────────────────────────────────
interface LeaseFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (status: string) => void;
  onApply: () => void;
  onReset: () => void;
}

function LeaseFilterDrawer({
  isOpen,
  onClose,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  onApply,
  onReset,
}: LeaseFilterDrawerProps) {
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
            Filter Agreements
          </span>
          <button onClick={onClose} className="btn-close shadow-none" style={{ fontSize: "0.8rem" }} />
        </div>

        <div className="flex-grow-1">
          {/* Role Filter */}
          <div className="mb-4">
            <label className="form-label fw-bold text-muted" style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>
              Assigned User Role
            </label>
            <select
              className="form-select shadow-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="FLOOR_ADMIN,OFFICE_OWNER">All Roles</option>
              <option value="FLOOR_ADMIN">Floor Admin</option>
              <option value="OFFICE_OWNER">Office Owner</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <label className="form-label fw-bold text-muted" style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>
              Agreement Status
            </label>
            <select
              className="form-select shadow-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="mb-4">
            <label className="form-label fw-bold text-muted" style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>
              Payment Status
            </label>
            <select
              className="form-select shadow-none"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
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

// ── LeasesContent Component ──────────────────────────────────────────────────
function LeasesContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Filters and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("FLOOR_ADMIN,OFFICE_OWNER");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal States
  const [paymentUpdateUser, setPaymentUpdateUser] = useState<any | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Record Payment Form inputs
  const [payMonth, setPayMonth] = useState(MONTHS[new Date().getMonth()]);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Online");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payTxnId, setPayTxnId] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  const buildQuery = useCallback(() => {
    const q: Record<string, string> = {
      role: roleFilter,
      page: String(currentPage),
      limit: String(ITEMS_PER_PAGE),
    };
    if (debouncedSearch.trim()) q.search = debouncedSearch.trim();
    if (statusFilter !== "All") q.agreementStatus = statusFilter;
    if (paymentStatusFilter !== "All") q.paymentStatus = paymentStatusFilter;
    return new URLSearchParams(q).toString();
  }, [roleFilter, currentPage, debouncedSearch, statusFilter, paymentStatusFilter]);

  const fetchUsersList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/users?${buildQuery()}`);
      if (res.success) {
        setUsers(res.data);
        setTotalPages(res.pagination?.pages || 1);
        setTotalItems(res.pagination?.total || res.data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  // Load static configurations once
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [resProps, resFloors, resUnits, resLeases, resNotifs] = await Promise.all([
          api.get("/properties"),
          api.get("/floors?limit=100"),
          api.get("/units?limit=100"),
          api.get("/leases?limit=100"),
          api.get("/notifications"),
        ]);
        if (resProps.success) setProperties(resProps.data);
        if (resFloors.success) setFloors(resFloors.data);
        if (resUnits.success) setUnits(resUnits.data);
        if (resLeases.success) setLeases(resLeases.data || []);
        if (resNotifs.success) setNotifications(resNotifs.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfigs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.put(`/notifications/${id}/read`, {});
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const leaseNotifications = notifications.filter((notif: any) => {
    const keywords = ["lease", "rent", "due", "expir", "agreement", "occupant", "tenant", "payment"];
    const titleLower = (notif.title || "").toLowerCase();
    const msgLower = (notif.message || "").toLowerCase();
    return keywords.some((k) => titleLower.includes(k) || msgLower.includes(k));
  });

  const getExpiryAlertBadge = (endDateStr: string) => {
    if (!endDateStr) return null;
    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(endDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 5) {
      return (
        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill px-2 py-0.5" style={{ fontSize: "0.65rem" }}>
          ⚠️ Expiry in {diffDays}d
        </span>
      );
    }
    return null;
  };

  const getDueAlertBadge = (dueDayVal: any) => {
    if (!dueDayVal) return null;
    const dueDay = Number(dueDayVal);
    const today = new Date();
    const currentDay = today.getDate();
    const daysUntilDue = dueDay - currentDay;

    if (daysUntilDue >= 0 && daysUntilDue <= 5) {
      return (
        <span className="badge bg-warning bg-opacity-20 text-warning border border-warning rounded-pill px-2 py-0.5" style={{ fontSize: "0.65rem" }}>
          ⚠️ Due in {daysUntilDue}d
        </span>
      );
    }
    return null;
  };

  // Spatial asset mapping helpers
  const getUserProperties = (u: any) => {
    if (!u || !u.assignedProperties || u.assignedProperties.length === 0) return "N/A";
    return u.assignedProperties
      .map((prop: any) => {
        if (typeof prop === "object" && prop !== null) {
          return prop.propertyName || prop.name || "";
        }
        const found = properties.find((p) => p._id === prop || p.id === prop);
        return found ? found.propertyName : "";
      })
      .filter(Boolean)
      .join(", ") || "N/A";
  };

  const getUserFloors = (u: any) => {
    if (!u || !u.assignedFloors || u.assignedFloors.length === 0) return "N/A";
    return u.assignedFloors
      .map((floor: any) => {
        if (typeof floor === "object" && floor !== null) {
          return floor.floorName || `Floor ${floor.floorNumber}`;
        }
        const found = floors.find((f) => f._id === floor || f.id === floor);
        return found ? found.floorName || `Floor ${found.floorNumber}` : "";
      })
      .filter(Boolean)
      .join(", ") || "N/A";
  };

  const getUserUnits = (u: any) => {
    if (!u || !u.assignedUnits || u.assignedUnits.length === 0) return "N/A";
    return u.assignedUnits
      .map((unit: any) => {
        if (typeof unit === "object" && unit !== null) {
          return `Unit ${unit.unitNumber}`;
        }
        const found = units.find((un) => un._id === unit || un.id === unit);
        return found ? `Unit ${found.unitNumber}` : "";
      })
      .filter(Boolean)
      .join(", ") || "N/A";
  };

  const handleUserPaymentStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    if (confirm(`Mark this agreement payment status as ${nextStatus}?`)) {
      try {
        const res = await api.put(`/users/${userId}`, { paymentStatus: nextStatus });
        if (res.success) {
          fetchUsersList();
        }
      } catch (err: any) {
        alert(err.message || "Failed to toggle status");
      }
    }
  };

  const getOrCreateLeaseForUser = async (u: any) => {
    const foundLease = leases.find((l) => l.tenantEmail === u.email || l.tenantName === u.name);
    if (foundLease) return foundLease;

    const propertyId =
      u.assignedProperties && u.assignedProperties.length > 0
        ? typeof u.assignedProperties[0] === "object"
          ? u.assignedProperties[0]._id
          : u.assignedProperties[0]
        : null;

    const floorId =
      u.assignedFloors && u.assignedFloors.length > 0
        ? typeof u.assignedFloors[0] === "object"
          ? u.assignedFloors[0]._id
          : u.assignedFloors[0]
        : null;

    const unitIds =
      u.assignedUnits && u.assignedUnits.length > 0
        ? u.assignedUnits.map((unit: any) => (typeof unit === "object" ? unit._id : unit))
        : [];

    const fallbackPropertyId = propertyId || (properties.length > 0 ? properties[0]._id : null);
    const fallbackFloorId = floorId || (floors.length > 0 ? floors[0]._id : null);

    if (!fallbackPropertyId || !fallbackFloorId) {
      throw new Error("Cannot record payment: No property or floor assignments found in database.");
    }

    const payload = {
      tenantName: u.name,
      tenantEmail: u.email,
      tenantContact: u.phoneNumber || "0000000000",
      property: fallbackPropertyId,
      floor: fallbackFloorId,
      units: unitIds,
      startDate: u.floorAssignmentStartDate || new Date().toISOString(),
      endDate: u.floorAssignmentEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyRent: u.monthlyManagementAmount || 0,
      rentPerSft: 0,
      totalMonthlyAmount: u.monthlyManagementAmount || 0,
      status: "Active",
    };

    const res = await api.post("/leases", payload);
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.error || "Failed to auto-create lease record.");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUpdateUser || !payAmount) {
      alert("Amount is required.");
      return;
    }
    setIsSubmittingModal(true);
    try {
      const activeLease = await getOrCreateLeaseForUser(paymentUpdateUser);

      const payload = {
        lease: activeLease._id,
        month: payMonth,
        year: Number(payYear),
        amount: Number(payAmount),
        paymentMethod: payMethod,
        paymentDate: payDate ? new Date(payDate) : undefined,
        transactionId: payTxnId || undefined,
        remarks: payRemarks || undefined,
      };

      const res = await api.post("/payments", payload);
      if (res.success) {
        await api.put(`/users/${paymentUpdateUser._id}`, { paymentStatus: "Paid" });
        alert("Payment recorded successfully!");
        setPaymentUpdateUser(null);
        setPayAmount("");
        setPayTxnId("");
        setPayRemarks("");
        fetchUsersList();
      } else {
        alert(res.error || "Failed to record payment.");
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const handleReset = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("FLOOR_ADMIN,OFFICE_OWNER");
    setStatusFilter("All");
    setPaymentStatusFilter("All");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const activeFilters = [
    debouncedSearch.trim() !== "",
    roleFilter !== "FLOOR_ADMIN,OFFICE_OWNER",
    statusFilter !== "All",
    paymentStatusFilter !== "All",
  ].filter(Boolean).length;

  const columns: TableColumn<any>[] = [
    {
      header: "User / Owner",
      render: (u) => (
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-secondary border" style={{ width: 36, height: 36, fontSize: "0.85rem", flexShrink: 0 }}>
            {getInitials(u.name)}
          </div>
          <div>
            <Link href={`/admin/leases/${u._id}`} className="fw-semibold text-dark text-decoration-none small">
              {u.name}
            </Link>
            <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      render: (u) => (
        <span className={`badge rounded-pill px-2.5 py-1 ${u.role === "FLOOR_ADMIN" ? "bg-info bg-opacity-10 text-info border border-info border-opacity-25" : "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"}`} style={{ fontSize: "0.72rem", fontWeight: "600" }}>
          {u.role === "FLOOR_ADMIN" ? "Floor Admin" : "Office Owner"}
        </span>
      ),
    },
    {
      header: "Assigned Spaces",
      render: (u) => (
        <div>
          {u.role === "FLOOR_ADMIN" ? (
            <div className="small text-dark fw-medium">{getUserFloors(u)}</div>
          ) : (
            <div className="small text-dark fw-medium">{getUserUnits(u)}</div>
          )}
          <span className="text-muted" style={{ fontSize: "0.75rem" }}>{getUserProperties(u)}</span>
        </div>
      ),
    },
    {
      header: "Monthly Dues",
      render: (u) => (
        <span className="fw-semibold text-dark small">
          ₹{(u.monthlyManagementAmount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Contract Term",
      render: (u) => (
        <div>
          <div className="small text-dark">{formatDate(u.floorAssignmentStartDate)}</div>
          <div className="text-muted small d-flex align-items-center flex-wrap gap-1" style={{ fontSize: "0.75rem" }}>
            to {formatDate(u.floorAssignmentEndDate)}
            {getExpiryAlertBadge(u.floorAssignmentEndDate)}
          </div>
        </div>
      ),
    },
    {
      header: "Due Day",
      render: (u) => (
        <div className="d-flex align-items-center flex-wrap gap-1">
          <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle rounded-pill px-2" style={{ fontSize: "0.7rem" }}>
            {u.paymentDueDay || 5}th
          </span>
          {getDueAlertBadge(u.paymentDueDay || 5)}
        </div>
      ),
    },
    {
      header: "Status",
      render: (u) => (
        <span className={`badge rounded-pill px-2.5 py-1 ${u.agreementStatus === "Active" ? "bg-success bg-opacity-10 text-success" : u.agreementStatus === "Pending" ? "bg-warning bg-opacity-10 text-warning" : u.agreementStatus === "Expired" ? "bg-secondary bg-opacity-10 text-secondary" : "bg-danger bg-opacity-10 text-danger"}`} style={{ fontSize: "0.72rem", fontWeight: "600" }}>
          {u.agreementStatus || "Active"}
        </span>
      ),
    },
    {
      header: "Payment",
      render: (u) => (
        <button
          onClick={() => handleUserPaymentStatusToggle(u._id, u.paymentStatus)}
          className={`btn badge rounded-pill px-3 py-1 border text-decoration-none shadow-none ${u.paymentStatus === "Paid" ? "bg-success bg-opacity-10 text-success border-success" : "bg-danger bg-opacity-10 text-danger border-danger"}`}
          style={{ fontSize: "0.72rem", fontWeight: "bold" }}
        >
          {u.paymentStatus || "Unpaid"}
        </button>
      ),
    },
    {
      header: "Actions",
      style: { textAlign: "right" as const },
      render: (u) => (
        <div className="d-flex align-items-center justify-content-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/leases/${u._id}`}
            title="View Details"
            className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm border border-light-subtle"
            style={{ width: "32px", height: "32px" }}
          >
            <i className="bi bi-eye text-secondary" style={{ fontSize: "0.95rem" }}></i>
          </Link>
          <button
            className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm border border-light-subtle"
            style={{ width: "32px", height: "32px" }}
            onClick={() => {
              setPaymentUpdateUser(u);
              setPayAmount((u.monthlyManagementAmount || 0).toString());
              setPayMonth(MONTHS[new Date().getMonth()]);
              setPayYear(new Date().getFullYear());
              setPayMethod("Online");
              setPayDate(new Date().toISOString().split("T")[0]);
              setPayTxnId("");
              setPayRemarks("");
            }}
            title="Record Payment"
          >
            <i className="bi bi-wallet2 text-primary" style={{ fontSize: "0.95rem" }}></i>
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
      <LeaseFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
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
            Tenant Lease Agreements
          </span>
          <div className="text-muted mt-1" style={{ fontSize: "0.72rem" }}>
            Review occupant assignments, contract terms, billing schedules, and ledger entries
          </div>
        </div>

        {/* Controls */}
        <div className="d-flex gap-2 align-items-center">
          {/* Search bar */}
          <div className="position-relative">
            <input
              type="text"
              className="form-control shadow-none"
              placeholder="Search agreements..."
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
        </div>
      </div>

      {/* Proactive Alerts Panel */}
      {leaseNotifications.some((n) => !n.readStatus) && (
        <div className="mx-4 p-3 mb-3 rounded border border-warning" style={{ backgroundColor: "#fffbeb" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-bell-fill text-warning"></i>
              <strong className="text-dark small">Proactive 5-Day Alerts & Reminders</strong>
            </div>
            <button
              className="btn btn-sm btn-link text-muted small text-decoration-none p-0 fw-bold"
              style={{ fontSize: "0.75rem" }}
              onClick={async () => {
                try {
                  await api.get("/notifications?markAsRead=true");
                  setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Clear All Alerts
            </button>
          </div>
          <div className="row g-2" style={{ maxHeight: "110px", overflowY: "auto" }}>
            {leaseNotifications
              .filter((n) => !n.readStatus)
              .map((notif) => (
                <div key={notif._id} className="col-12 col-md-6">
                  <div className="p-2 bg-white border rounded d-flex justify-content-between align-items-center gap-2">
                    <span className="text-muted small text-truncate" style={{ fontSize: "0.75rem" }}>
                      <strong>{notif.title}</strong>: {notif.message}
                    </span>
                    <button className="btn btn-link p-0 border-0" title="Mark as Read" onClick={() => handleMarkAsRead(notif._id)}>
                      <i className="bi bi-check2-circle text-primary" style={{ fontSize: "1rem" }}></i>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-grow-1 overflow-hidden d-flex flex-column">
        <Table
          columns={columns}
          data={users}
          isLoading={isLoading}
          loadingMessage="Loading lease agreements..."
          emptyMessage="No active agreements matching the filters."
          containerClassName="table-responsive"
          containerStyle={{ flexGrow: 1, overflowY: "auto" }}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* RECORD PAYMENT MODAL (Styled perfectly like asset popup modal layout) */}
      {paymentUpdateUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div className="bg-white rounded-3 shadow-lg overflow-hidden w-100 mx-3" style={{ maxWidth: "520px" }}>
            {/* Dark Header */}
            <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#2d3748" }}>
              <h6 className="fw-bold mb-0 text-white" style={{ fontSize: "1rem" }}>
                Record Payment
              </h6>
              <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setPaymentUpdateUser(null)} style={{ fontSize: "0.8rem" }}></button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="p-4" style={{ maxHeight: "72vh", overflowY: "auto" }}>
                {/* personnel overview */}
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <div className="fw-bold text-dark small">{paymentUpdateUser.name}</div>
                  <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{paymentUpdateUser.email}</div>
                  <hr className="my-2 opacity-10" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>Monthly Dues:</span>
                    <span className="fw-bold text-primary small">₹{(paymentUpdateUser.monthlyManagementAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Month */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Month</label>
                    <select
                      className="form-select border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Year</label>
                    <input
                      type="number"
                      className="form-control border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      value={payYear}
                      onChange={(e) => setPayYear(Number(e.target.value))}
                      required
                    />
                  </div>

                  {/* Amount Paid */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Amount Paid (₹)</label>
                    <input
                      type="number"
                      className="form-control border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Payment Method</label>
                    <select
                      className="form-select border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="Online">Online</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Payment Date */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Payment Date</label>
                    <input
                      type="date"
                      className="form-control border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Transaction ID */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Transaction ID / Reference</label>
                    <input
                      type="text"
                      className="form-control border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      placeholder="Optional txn reference ID"
                      value={payTxnId}
                      onChange={(e) => setPayTxnId(e.target.value)}
                    />
                  </div>

                  {/* Remarks */}
                  <div className="col-12">
                    <label className="form-label fw-bold text-muted small">Remarks</label>
                    <textarea
                      className="form-control border shadow-none"
                      style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                      rows={2}
                      placeholder="Optional payment notes"
                      value={payRemarks}
                      onChange={(e) => setPayRemarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 py-3 border-top d-flex gap-2 justify-content-end bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary fw-bold px-3 py-2"
                  onClick={() => setPaymentUpdateUser(null)}
                  disabled={isSubmittingModal}
                  style={{ fontSize: "0.85rem", borderRadius: "4px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm fw-bold text-white px-4 py-2"
                  disabled={isSubmittingModal}
                  style={{ fontSize: "0.85rem", borderRadius: "4px", backgroundColor: "#014aad" }}
                >
                  {isSubmittingModal ? "Recording..." : "Record Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeasesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeasesContent />
    </Suspense>
  );
}
