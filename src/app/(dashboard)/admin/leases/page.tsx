"use client";

import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import LeaseModal from "@/components/dashboard/LeaseModal";

function LeasesContent() {
  const [activeTab, setActiveTab] = useState<"tenants" | "owners">("owners");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  
  // Payment Update Modal States for Owners & Admins
  const [paymentUpdateUser, setPaymentUpdateUser] = useState<any | null>(null);
  const [viewUserAgreement, setViewUserAgreement] = useState<any | null>(null);
  const [modalPaymentStatus, setModalPaymentStatus] = useState("Unpaid");
  const [modalAgreementStatus, setModalAgreementStatus] = useState("Active");
  const [modalDueDay, setModalDueDay] = useState(5);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  
  // Data states
  const [leases, setLeases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUserRole(parsed.role);
        } catch {}
      }
    }
    fetchProperties();
    fetchFloors();
    fetchUnits();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "tenants") {
      fetchLeases(currentPage, search, filterStatus);
    } else {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus, activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else if (activeTab === "tenants") fetchLeases(1, search, filterStatus);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLeases = async (page: number, searchTerm: string, status: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/leases?page=${page}&limit=${limit}&search=${searchTerm}&status=${status}`);
      if (response.success) {
        setLeases(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch leases:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      if (res.success) setProperties(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFloors = async () => {
    try {
      const res = await api.get('/floors');
      if (res.success) setFloors(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/units');
      if (res.success) setUnits(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSaveLease = async (data: any): Promise<boolean> => {
    try {
      let response;
      if (selectedLease && modalMode === "edit") {
        response = await api.put(`/leases/${selectedLease._id}`, data);
      } else {
        response = await api.post("/leases", data);
      }
      if (response.success) {
        fetchLeases(currentPage, search, filterStatus);
        return true;
      } else {
        alert(response.error || "Failed to save lease.");
        return false;
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
      return false;
    }
  };

  const handlePaymentToggle = async (leaseId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    if (confirm(`Mark this monthly due as ${nextStatus}?`)) {
      try {
        const response = await api.put(`/leases/${leaseId}`, { paymentStatus: nextStatus });
        if (response.success) {
          fetchLeases(currentPage, search, filterStatus);
        }
      } catch (err) {
        console.error("Failed to update payment status:", err);
      }
    }
  };

  const handleUserPaymentToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Pending" : "Active";
    if (confirm(`Change this agreement status to ${nextStatus}?`)) {
      try {
        const response = await api.put(`/users/${userId}`, { agreementStatus: nextStatus });
        if (response.success) {
          fetchUsers();
        }
      } catch (err) {
        console.error("Failed to update user agreement status:", err);
      }
    }
  };

  const handleUserPaymentStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    if (confirm(`Mark this staff/owner management fee as ${nextStatus}?`)) {
      try {
        const response = await api.put(`/users/${userId}`, { paymentStatus: nextStatus });
        if (response.success) {
          fetchUsers();
        }
      } catch (err) {
        console.error("Failed to update user payment status:", err);
      }
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUpdateUser) return;
    setIsSubmittingModal(true);
    try {
      const response = await api.put(`/users/${paymentUpdateUser._id}`, {
        paymentStatus: modalPaymentStatus,
        paymentDueDay: Number(modalDueDay)
      });
      if (response.success) {
        fetchUsers();
        setPaymentUpdateUser(null);
      } else {
        alert(response.error || "Failed to update payment details.");
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const openViewModal = (lease: any) => { setModalMode("view"); setSelectedLease(lease); setIsModalOpen(true); };
  const openEditModal = (lease: any) => { setModalMode("edit"); setSelectedLease(lease); setIsModalOpen(true); };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString('en-GB');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Floor Admin': return 'text-primary border-primary bg-primary bg-opacity-10';
      case 'Office Owner': return 'text-purple border-purple bg-purple-light';
      default: return 'text-warning border-warning bg-warning bg-opacity-10';
    }
  };

  const getSpatialAllocations = (u: any) => {
    const props = (u.assignedProperties || []).map((id: string) => {
      const found = properties.find((p: any) => (p._id || p) === id || p._id?.toString() === id?.toString());
      return found ? found.propertyName : '';
    }).filter(Boolean).join(', ');

    const flrs = (u.assignedFloors || []).map((id: string) => {
      const found = floors.find((f: any) => (f._id || f) === id || f._id?.toString() === id?.toString());
      return found ? (found.floorName || `Floor ${found.floorNumber}`) : '';
    }).filter(Boolean).join(', ');

    const unitNums = (u.assignedUnits || []).map((id: string) => {
      const found = units.find((un: any) => (un._id || un) === id || un._id?.toString() === id?.toString());
      return found ? `Unit ${found.unitNumber}` : '';
    }).filter(Boolean).join(', ');

    const spatial = [props, flrs].filter(Boolean).join(' - ') || 'N/A';
    return unitNums ? `${spatial} • ${unitNums}` : spatial;
  };

  const getUserProperties = (u: any) => {
    if (!u || !u.assignedProperties) return 'N/A';
    return u.assignedProperties.map((id: string) => {
      const found = properties.find(p => p._id === id);
      return found ? found.propertyName : '';
    }).filter(Boolean).join(', ') || 'N/A';
  };

  const getUserFloors = (u: any) => {
    if (!u || !u.assignedFloors) return 'N/A';
    return u.assignedFloors.map((id: string) => {
      const found = floors.find(f => f._id === id);
      return found ? (found.floorName || `Floor ${found.floorNumber}`) : '';
    }).filter(Boolean).join(', ') || 'N/A';
  };

  const getUserUnits = (u: any) => {
    if (!u || !u.assignedUnits) return 'N/A';
    return u.assignedUnits.map((id: string) => {
      const found = units.find(unit => unit._id === id);
      return found ? `Unit ${found.unitNumber}` : '';
    }).filter(Boolean).join(', ') || 'N/A';
  };

  // Filtered Office Owners & Floor Admins who have management agreements
  const filteredUsers = users.filter(u => {
    if (u.role !== 'Office Owner' && u.role !== 'Floor Admin') return false;
    const nameMatch = u.name ? u.name.toLowerCase().includes(search.toLowerCase()) : false;
    const emailMatch = u.email ? u.email.toLowerCase().includes(search.toLowerCase()) : false;
    const matchesSearch = nameMatch || emailMatch;
    const matchesStatus = !filterStatus || u.agreementStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Client-side pagination for Office Owner & Admin Agreements
  const itemsPerPage = 10;
  const totalOwnerPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container-fluid p-0" style={{ fontFamily: 'var(--font-geist-sans)' }}>
      <style jsx global>{`
        .text-purple { color: #8b5cf6 !important; }
        .border-purple { border-color: #8b5cf6 !important; }
        .bg-purple { background-color: #8b5cf6 !important; }
        .bg-purple-light { background-color: rgba(139, 92, 246, 0.1) !important; }
        
        .table-responsive::-webkit-scrollbar {
          height: 6px;
          display: block !important;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Header with Title & Action / Filter Row */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.02em", fontSize: "1.35rem" }}>
            Office Owner & Admin Agreements
          </h2>
        </div>
        <div className="d-flex align-items-center gap-2 ms-md-auto">
          <div className="bg-white border rounded px-3 d-flex align-items-center gap-2 shadow-sm" style={{ width: "260px", height: "36px" }}>
            <i className="bi bi-search text-muted" style={{ fontSize: "0.85rem" }}></i>
            <input
              type="text"
              className="border-0 bg-transparent w-100 shadow-none"
              placeholder="Search owner name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ outline: "none", fontSize: "0.85rem" }}
            />
          </div>
          
          <select
            className="form-select border rounded fw-medium text-muted bg-white shadow-sm"
            style={{ width: "150px", height: "36px", fontSize: "0.85rem" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded border shadow-sm overflow-hidden">
        <div className="table-responsive w-100" style={{ overflowX: 'auto', display: 'block' }}>
          <table className="table mb-0 align-middle text-nowrap" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            
            <thead>
              <tr>
                {["S No", "Personnel Details", "Role", "Spatial Mapping Area", "Monthly Dues", "Due Day", "Duration", "Payment Status", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="py-3 px-4 fw-bold text-start"
                    style={{
                      backgroundColor: "#3f3f3f",
                      color: "#ffffff",
                      fontSize: "0.78rem",
                      border: "none",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <div className="text-muted small mt-2">Loading active agreements...</div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted small">
                    <i className="bi bi-file-earmark-person fs-2 d-block mb-2 text-muted opacity-50"></i>
                    No Floor Admin or Office Owner agreements found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => (
                  <tr
                    key={u._id}
                    style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                  >
                    <td className="py-2 px-4 text-muted" style={{ border: "none", fontSize: "0.8rem" }}>
                      {String(index + 1 + (currentPage - 1) * itemsPerPage).padStart(3, "0")}
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>{u.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>{u.email}</div>
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <span className={`badge rounded-pill px-3 py-1 border ${getRoleBadge(u.role)}`} style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <div className="small fw-semibold text-dark">{getSpatialAllocations(u)}</div>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>Allocated Space</span>
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <div className="fw-bold text-emerald" style={{ fontSize: "0.85rem", color: "#014aad" }}>
                        ₹{(u.monthlyManagementAmount || 0).toLocaleString()}
                      </div>
                      <span className="text-muted" style={{ fontSize: "0.65rem" }}>{u.paymentType || 'Monthly'} cycle</span>
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill px-2" style={{ fontSize: "0.7rem" }}>
                        {u.paymentDueDay || 5}th of Month
                      </span>
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <div className="fw-medium text-dark" style={{ fontSize: "0.8rem" }}>{formatDate(u.floorAssignmentStartDate)}</div>
                      <div className="text-muted" style={{ fontSize: "0.65rem" }}>To {formatDate(u.floorAssignmentEndDate)}</div>
                    </td>
                    <td className="py-2 px-4" style={{ border: "none" }}>
                      <button 
                        className={`btn btn-sm rounded-pill fw-bold px-3 py-1 border transition-all ${
                          u.paymentStatus === "Paid" 
                            ? "bg-success bg-opacity-10 text-success border-success" 
                            : "bg-danger bg-opacity-10 text-danger border-danger"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                        onClick={() => handleUserPaymentStatusToggle(u._id, u.paymentStatus)}
                      >
                        {u.paymentStatus || "Unpaid"}
                      </button>
                    </td>
                    <td className="py-2 px-4 text-center" style={{ border: "none" }}>
                      <div className="d-flex justify-content-center align-items-center gap-3">
                        <button 
                          className="btn btn-link p-0 text-secondary" 
                          title="View Agreement Details" 
                          onClick={() => setViewUserAgreement(u)}
                        >
                          <i className="bi bi-eye-fill" style={{ fontSize: "1.15rem", color: "#4b5563" }}></i>
                        </button>
                        <button 
                          className="btn btn-link p-0 text-primary" 
                          title="Update Payment & Agreement Status" 
                          onClick={() => {
                            setPaymentUpdateUser(u);
                            setModalPaymentStatus(u.paymentStatus || "Unpaid");
                            setModalAgreementStatus(u.agreementStatus || "Active");
                            setModalDueDay(u.paymentDueDay || 5);
                          }}
                        >
                          <i className="bi bi-credit-card-2-front-fill" style={{ fontSize: "1.15rem", color: "#014aad" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>
            Page <strong>{currentPage}</strong> of <strong>{totalOwnerPages}</strong>
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn border shadow-sm d-flex align-items-center gap-1 text-muted fw-medium"
              style={{ fontSize: "0.85rem", borderRadius: "20px", padding: "4px 16px" }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <i className="bi bi-chevron-left small"></i> Previous
            </button>
            <button
              className="btn border shadow-sm d-flex align-items-center gap-1 text-muted fw-medium"
              style={{ fontSize: "0.85rem", borderRadius: "20px", padding: "4px 16px" }}
              disabled={currentPage === totalOwnerPages}
              onClick={() => setCurrentPage(prev => Math.min(totalOwnerPages, prev + 1))}
            >
              Next <i className="bi bi-chevron-right small"></i>
            </button>
          </div>
        </div>
      </div>

      <LeaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLease}
        editData={selectedLease}
        mode={modalMode}
      />

      {/* Premium Payment & Status Update Modal */}
      {paymentUpdateUser && (
        <div 
          className="modal fade show d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              
              {/* Header */}
              <div className="modal-header border-0 bg-light px-4 pt-4 pb-3" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                <div>
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "1.15rem" }}>
                    <i className="bi bi-shield-check text-primary"></i>
                    Update Agreement Billing
                  </h5>
                  <p className="text-muted small mb-0 mt-1">Configure dues cycle and collection state.</p>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setPaymentUpdateUser(null)}
                  style={{ fontSize: "0.8rem" }}
                ></button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleModalSubmit}>
                <div className="modal-body px-4 py-3">
                  
                  {/* personnel overview */}
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <div className="fw-bold text-dark small">{paymentUpdateUser.name}</div>
                    <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{paymentUpdateUser.email}</div>
                    <hr className="my-2 opacity-10" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small" style={{ fontSize: "0.75rem" }}>Monthly Dues:</span>
                      <span className="fw-bold text-primary small">₹{(paymentUpdateUser.monthlyManagementAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Status Option */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">Payment Status</label>
                    <select
                      className="form-select border rounded px-3"
                      style={{ fontSize: "0.85rem", height: "38px" }}
                      value={modalPaymentStatus}
                      onChange={(e) => setModalPaymentStatus(e.target.value)}
                    >
                      <option value="Paid">Paid / Collected</option>
                      <option value="Unpaid">Unpaid / Pending</option>
                    </select>
                  </div>

                  {/* Due day of Month */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold text-secondary small">Payment Due Day</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      className="form-control border rounded px-3"
                      style={{ fontSize: "0.85rem", height: "38px" }}
                      value={modalDueDay}
                      onChange={(e) => setModalDueDay(Number(e.target.value))}
                    />
                    <div className="text-muted mt-1" style={{ fontSize: "0.65rem" }}>Specify billing cycle day (1 to 28).</div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="modal-footer border-0 px-4 pb-4 pt-2 d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-light fw-semibold px-4 py-2 border rounded-pill"
                    style={{ fontSize: "0.8rem" }}
                    onClick={() => setPaymentUpdateUser(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary fw-semibold px-4 py-2 rounded-pill d-flex align-items-center gap-2"
                    style={{ fontSize: "0.8rem", backgroundColor: "#014aad", borderColor: "#014aad" }}
                    disabled={isSubmittingModal}
                  >
                    {isSubmittingModal && (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    )}
                    Save Updates
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM DETAILS & AGREEMENT FOLDER OVERLAY MODAL */}
      {viewUserAgreement && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050, backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              
              {/* Modal Header */}
              <div className="modal-header border-0 px-4 py-3 bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-file-earmark-text-fill" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{viewUserAgreement.name}</h5>
                    <span className="text-muted small">Agreement & Spatial Allocation Profile</span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setViewUserAgreement(null)}></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                
                {/* Section 1: Spatial Assignments */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-layers-fill text-primary me-2"></i>Spatial Mapping Configuration</h6>
                  <div className="p-3 bg-light rounded-3 border border-light-subtle row g-3">
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Allocated Space & Properties</span>
                      <strong className="text-dark small">{getUserProperties(viewUserAgreement)}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Assigned Floors</span>
                      <strong className="text-dark small">{getUserFloors(viewUserAgreement)}</strong>
                    </div>
                    <div className="col-12 mt-2 pt-2 border-top">
                      <span className="text-muted small d-block">Specific Unit Allocations</span>
                      <strong className="text-dark small">{getUserUnits(viewUserAgreement)}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 2: Billing & Payments */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-credit-card-2-front-fill text-primary me-2"></i>Billing & Payments Details</h6>
                  <div className="p-3 bg-light rounded-3 border border-light-subtle row g-3">
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Monthly Management Dues</span>
                      <strong className="text-primary small" style={{ fontSize: '1rem' }}>₹{(viewUserAgreement.monthlyManagementAmount || 0).toLocaleString()}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Billing Cycle</span>
                      <strong className="text-dark small">{viewUserAgreement.paymentType || 'Monthly'} Cycle</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Billing Due Day</span>
                      <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill px-2" style={{ fontSize: '0.75rem' }}>
                        {viewUserAgreement.paymentDueDay || 5}th of Month
                      </span>
                    </div>
                    <div className="col-md-4 mt-2 pt-2 border-top">
                      <span className="text-muted small d-block">Agreement Status</span>
                      <span className={`badge rounded-pill px-3 py-1 ${
                        viewUserAgreement.agreementStatus === 'Active' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'
                      }`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {viewUserAgreement.agreementStatus || 'Active'}
                      </span>
                    </div>
                    <div className="col-md-4 mt-2 pt-2 border-top">
                      <span className="text-muted small d-block">Current Payment Status</span>
                      <span className={`badge rounded-pill px-3 py-1 ${
                        viewUserAgreement.paymentStatus === 'Paid' ? 'bg-success bg-opacity-10 text-success border-success' : 'bg-danger bg-opacity-10 text-danger border-danger'
                      }`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {viewUserAgreement.paymentStatus || 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Agreement Duration & Contact Details */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-clock-history text-primary me-2"></i>Agreement Duration & Contact Details</h6>
                  <div className="p-3 bg-light rounded-3 border border-light-subtle row g-3">
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Agreement Start Date</span>
                      <strong className="text-dark small">{formatDate(viewUserAgreement.floorAssignmentStartDate)}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Agreement End Date</span>
                      <strong className="text-dark small">{formatDate(viewUserAgreement.floorAssignmentEndDate)}</strong>
                    </div>
                    <div className="col-md-6 mt-2 pt-2 border-top">
                      <span className="text-muted small d-block">Official Email ID</span>
                      <strong className="text-dark small">{viewUserAgreement.email || 'N/A'}</strong>
                    </div>
                    <div className="col-md-6 mt-2 pt-2 border-top">
                      <span className="text-muted small d-block">Contact Number</span>
                      <strong className="text-dark small">{viewUserAgreement.phoneNumber || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end">
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-bold shadow-sm" onClick={() => setViewUserAgreement(null)}>
                  Close Agreement
                </button>
              </div>

            </div>
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
