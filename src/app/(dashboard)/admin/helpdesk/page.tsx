"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import HelpdeskFormModal from "@/components/helpdesk/HelpdeskFormModal";
import HelpdeskDetailView from "@/components/helpdesk/HelpdeskDetailView";
import HelpdeskFilterDrawer from "@/components/helpdesk/HelpdeskFilterDrawer";

export default function HelpdeskPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    waitingResponse: 0,
    resolved: 0,
    closed: 0
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Fetch metrics and tickets whenever filters or page change
  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, categoryFilter, propertyFilter, currentUser]);

  const fetchStats = async () => {
    try {
      const response = await api.get("/helpdesk/stats");
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch helpdesk stats:", err);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        property: propertyFilter
      });

      const response = await api.get(`/helpdesk?${queryParams.toString()}`);
      if (response.success) {
        setTickets(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
          setTotalItems(response.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode: "create" | "view", ticket: any = null) => {
    if (mode === "create") {
      setIsCreateOpen(true);
    } else {
      setSelectedTicket(ticket);
      setIsDetailOpen(true);
    }
  };

  const handleSaveTicket = async (savedData: any) => {
    try {
      const response = await api.post("/helpdesk", savedData);
      if (response.success) {
        await fetchTickets();
        await fetchStats();
        setIsCreateOpen(false);
      }
    } catch (err) {
      console.error("Failed to save ticket:", err);
      throw err;
    }
  };



  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setCategoryFilter("All");
    setPropertyFilter("All");
    setCurrentPage(1);
  };

  const activeFilters = [
    searchTerm.trim() !== "",
    statusFilter !== "All",
    priorityFilter !== "All",
    categoryFilter !== "All",
    propertyFilter !== "All"
  ].filter(Boolean).length;

  const columns: TableColumn<any>[] = [
    {
      header: "Ticket ID",
      render: (item) => (
        <span className="fw-bold text-primary cursor-pointer" onClick={() => handleOpenModal("view", item)}>
          {item.ticketId}
        </span>
      )
    },
    {
      header: "Title",
      render: (item) => (
        <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span className="fw-bold text-dark d-block">{item.title}</span>
          <span className="text-muted extra-small">{item.category}</span>
        </div>
      )
    },
    {
      header: "Priority",
      render: (item) => (
        <span className={`badge rounded-pill px-2 py-1 border fw-bold ${
          item.priority === "Critical" ? "bg-danger text-white border-danger" :
          item.priority === "High" ? "bg-warning text-dark border-warning" :
          "bg-light text-dark border-secondary"
        }`}>
          {item.priority}
        </span>
      )
    },
    {
      header: "Property / Floor",
      render: (item) => (
        <div>
          <span className="fw-medium text-dark d-block">{item.property?.propertyName || "-"}</span>
          <span className="text-muted extra-small">
            {item.floor?.floorName || (item.floor?.floorNumber ? `Floor ${item.floor.floorNumber}` : "-")}
          </span>
        </div>
      )
    },
    {
      header: "Status",
      render: (item) => (
        <span className={`badge rounded-pill px-2 py-1 fw-bold border ${
          item.status === "OPEN" ? "bg-danger bg-opacity-10 text-danger border-danger" :
          item.status === "ASSIGNED" ? "bg-info bg-opacity-10 text-info border-info" :
          item.status === "IN_PROGRESS" ? "bg-warning bg-opacity-10 text-warning border-warning" :
          item.status === "RESOLVED" ? "bg-success bg-opacity-10 text-success border-success" :
          "bg-secondary bg-opacity-10 text-secondary border-secondary"
        }`}>
          {item.status}
        </span>
      )
    },
    {
      header: "Actions",
      style: { textAlign: "right" as const },
      render: (item) => (
        <div className="d-flex justify-content-end align-items-center" onClick={(e) => e.stopPropagation()}>
          <button
            title="Open Workspace"
            onClick={() => handleOpenModal("view", item)}
            style={{
              width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#1e293b",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <i className="bi bi-eye text-secondary" style={{ fontSize: "0.9rem" }}></i>
          </button>
        </div>
      )
    }
  ];

  const canCreateTicket = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "OFFICE_OWNER" || currentUser?.role === "Tenant";

  return (
    <div
      className="p-0 d-flex flex-column bg-white border rounded-4"
      style={{ height: "calc(100vh - 104px)", fontFamily: "var(--font-geist-sans)", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center pb-2 pt-3 px-4 flex-shrink-0"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div>
          <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>Helpdesk & Complaints</span>
          {/* Very small stats list */}
          <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize: "0.72rem" }}>
            <span>Total: <strong className="text-dark">{metrics.total}</strong></span>
            <span>·</span>
            <span className="text-danger">Open: <strong>{metrics.open}</strong></span>
            <span className="text-primary">Assigned: <strong>{metrics.assigned}</strong></span>
            <span className="text-warning">In Progress: <strong>{metrics.inProgress}</strong></span>
            <span>·</span>
            <span className="text-success">Resolved: <strong>{metrics.resolved}</strong></span>
          </div>
        </div>

        <div className="d-flex gap-3 align-items-center">
          {/* Search bar */}
          <div className="position-relative" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder="Search by title, ID, category..."
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

          {/* Filter Trigger Button */}
          <button
            className={`btn border d-flex align-items-center justify-content-center position-relative ${showFilters ? "text-white border-primary" : "bg-white text-dark border-light"}`}
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

          {/* Export Button */}
          <button
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ height: 40, fontSize: "0.85rem", borderRadius: "4px", fontWeight: 500 }}
          >
            <i className="bi bi-download me-2" /> Export
          </button>

          {/* Create Button */}
          {canCreateTicket && (
            <button
              className="btn d-flex align-items-center gap-2 px-4"
              style={{
                backgroundColor: "#014aad", color: "#fff", fontWeight: 500,
                borderRadius: "4px", height: 40, fontSize: "0.85rem", border: "none",
              }}
              onClick={() => handleOpenModal("create")}
            >
              <i className="bi bi-plus-lg" /> Ticket
            </button>
          )}
        </div>
      </div>

      {/* Active filters chips bar */}
      {activeFilters > 0 && (
        <div className="d-flex align-items-center gap-2 px-4 pb-2 flex-shrink-0 flex-wrap">
          {searchTerm && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Search: <strong>{searchTerm}</strong>
              <button onClick={() => { setSearchTerm(""); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {statusFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Status: <strong>{statusFilter}</strong>
              <button onClick={() => { setStatusFilter("All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {priorityFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Priority: <strong>{priorityFilter}</strong>
              <button onClick={() => { setPriorityFilter("All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {categoryFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Category: <strong>{categoryFilter}</strong>
              <button onClick={() => { setCategoryFilter("All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          {propertyFilter !== "All" && (
            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
              Property Selected
              <button onClick={() => { setPropertyFilter("All"); setCurrentPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, color: "#64748b" }}>×</button>
            </span>
          )}
          <button
            onClick={handleReset}
            className="btn btn-link btn-sm p-0 text-decoration-none fw-bold"
            style={{ fontSize: "0.75rem", color: "#ef4444" }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Table */}
      <Table
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        loadingMessage="Loading support tickets ledger..."
        emptyMessage="No tickets found matching your filter criteria."
        containerClassName="table-responsive-container table-responsive flex-grow-1"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* decupled Form Modal */}
      <HelpdeskFormModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveTicket}
      />

      {/* decoupled Detail View Workspace */}
      {isDetailOpen && selectedTicket && (
        <HelpdeskDetailView
          viewItem={selectedTicket}
          onClose={() => { setIsDetailOpen(false); setSelectedTicket(null); }}
          currentUser={currentUser}
          onRefresh={() => { fetchTickets(); fetchStats(); }}
        />
      )}

      {/* decoupled Filter Drawer */}
      <HelpdeskFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        propertyFilter={propertyFilter}
        setPropertyFilter={setPropertyFilter}
        onReset={handleReset}
      />

      <style jsx global>{`
        .text-primary { color: #014aad !important; }
        .rounded-xl { border-radius: 1rem !important; }
        .extra-small { font-size: 0.75rem !important; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
}
