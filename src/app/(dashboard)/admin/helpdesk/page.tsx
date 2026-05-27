"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import HelpdeskModal from "@/components/dashboard/HelpdeskModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function HelpdeskPage() {
  const [userRole, setUserRole] = useState("super_admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [technicianFilter, setTechnicianFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });

  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchComplaints();
    fetchStats();

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          setCurrentUser(u);
          if (u.role === "Admin" || u.role === "Super Admin") {
            setUserRole("super_admin");
          } else if (u.role === "Owner" || u.role === "Office Owner") {
            setUserRole("technician");
          } else {
            setUserRole("viewer");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/helpdesk/stats');
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch helpdesk stats:", err);
    }
  };

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/helpdesk');
      if (response.success) {
        setComplaints(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch helpdesk tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique technicians for filter
  const technicians = Array.from(new Set(complaints.map(c => c.allocatedTo).filter(Boolean)));

  const filteredComplaints = complaints.filter(c => {
    const isOwner = currentUser?.role === "Owner" || currentUser?.role === "Office Owner";
    if (isOwner) {
      const matchName = (c.tenant?.tenantName || "").toLowerCase().includes(currentUser.name.toLowerCase()) ||
                        (c.tenant?.companyName || "").toLowerCase().includes((currentUser.companyName || "").toLowerCase()) ||
                        (c.allocatedTo || "").toLowerCase().includes(currentUser.name.toLowerCase());
      const matchCreator = c.createdBy === currentUser._id || c.tenant?.user === currentUser._id;
      if (!matchName && !matchCreator) return false;
    }

    const matchesSearch = 
      (c.ticketNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.natureOfComplaint || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.allocatedTo || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesTechnician = technicianFilter === "All" || c.allocatedTo === technicianFilter;
    
    return matchesSearch && matchesStatus && matchesTechnician;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const handleOpenModal = (mode: ModalMode, ticket: any = null) => {
    setModalMode(mode);
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleSaveTicket = async (savedData: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/helpdesk/${savedData._id}`, savedData);
      } else {
        response = await api.post('/helpdesk', savedData);
      }
      
      if (response.success) {
        fetchComplaints();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to save ticket:", err);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Role Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Helpdesk & Complaints</h2>
          <p className="text-muted small mb-0">Manage service requests and monitor resolution times</p>
        </div>
        <div className="d-flex gap-3 align-items-center">

          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export Log
          </button>
          {userRole !== 'viewer' && (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
              style={{ backgroundColor: '#014aad', fontSize: '0.75rem' }}
              onClick={() => handleOpenModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> Raise Ticket
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total</div>
              <div className="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-ticket-detailed"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.total}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>All Complaints</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#EF4444' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Open</div>
              <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-exclamation-circle"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.open}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Awaiting Action</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#F59E0B' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>In Progress</div>
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-tools"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.inProgress}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Under Repair</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#3B82F6' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Resolved</div>
              <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-check2-circle"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.resolved}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Fixed, Awaiting Verify</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#014aad' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Closed</div>
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-check-all"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.closed}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Verified & Closed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex align-items-center gap-3">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '40%' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by ticket no, nature..." 
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex align-items-center gap-2 ms-auto flex-grow-1 justify-content-end">
          <select 
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-semibold" 
            style={{ fontSize: '0.75rem', height: '38px', maxWidth: '180px' }}
            value={statusFilter}
            onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}
          >
            <option value="All">Status: All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select 
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-semibold" 
            style={{ fontSize: '0.75rem', height: '38px', maxWidth: '200px' }}
            value={technicianFilter}
            onChange={(e) => {setTechnicianFilter(e.target.value); setCurrentPage(1);}}
          >
            <option value="All">Allocated To: All</option>
            {technicians.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button 
            className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center justify-content-center gap-2" 
            style={{ fontSize: '0.75rem', height: '38px' }}
            onClick={() => {setSearchTerm(""); setStatusFilter("All"); setTechnicianFilter("All"); setCurrentPage(1);}}
          >
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', width: '50px' }}>S.No</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Ticket No</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Nature of Complaint</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Date & Time</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Allocated To</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-center" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Escalated</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Resolved Date & Time</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-center" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Productive Hrs</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Status</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((c, index) => (
                <tr 
                  key={c._id} 
                  className="transition-all hover-bg-light cursor-pointer" 
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => handleOpenModal('view', c)}
                >
                  <td className="px-3 py-3 fw-bold text-muted">{indexOfFirstItem + index + 1}</td>
                  <td className="px-3 py-3 fw-bold text-primary">{c.ticketNumber}</td>
                  <td className="px-3 py-3 fw-medium text-dark">{c.natureOfComplaint}</td>
                  <td className="px-3 py-3 text-muted">{c.dateOfComplaint ? new Date(c.dateOfComplaint).toLocaleDateString() : '-'} {c.timeOfComplaint}</td>
                  <td className="px-3 py-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                        <i className="bi bi-person"></i>
                      </div>
                      <span className="fw-medium">{c.allocatedTo || '-'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {c.escalated ? (
                      <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2">Yes</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">{c.resolvedDate ? new Date(c.resolvedDate).toLocaleDateString() : '-'} {c.resolvedTime}</td>
                  <td className="px-3 py-3 text-center fw-bold text-muted">{c.productiveHours || '-'}</td>
                  <td className="px-3 py-3">
                    <span className={`badge rounded-pill px-2 py-1 fw-medium border ${
                      c.status === 'Open' ? 'bg-danger bg-opacity-10 text-danger border-danger' :
                      c.status === 'In Progress' ? 'bg-warning bg-opacity-10 text-warning border-warning' :
                      'bg-success bg-opacity-10 text-success border-success'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                        style={{ width: '28px', height: '28px' }} 
                        title="View"
                        onClick={() => handleOpenModal('view', c)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-success" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Edit"
                          onClick={() => handleOpenModal('edit', c)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted">
                    {isLoading ? "Loading tickets..." : "No tickets found matching your criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <span className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredComplaints.length)} of {filteredComplaints.length} entries
          </span>
          <div className="d-flex gap-1">
            <button 
              className="btn btn-sm btn-white border px-2 shadow-none" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                className={`btn btn-sm border-0 px-3 shadow-none ${currentPage === page ? 'btn-primary text-white' : 'btn-white border'}`}
                style={currentPage === page ? { backgroundColor: '#014aad' } : {}}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className="btn btn-sm btn-white border px-2 shadow-none" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hover-lift:hover { transform: translateY(-3px); }
        .text-primary { color: #014aad !important; }
        .bg-emerald { background-color: #014aad !important; }
        .rounded-xl { border-radius: 1rem !important; }
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.02) !important; }
      `}</style>
      
      <HelpdeskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTicket}
        editData={selectedTicket}
        mode={modalMode}
      />
    </div>
  );
}
