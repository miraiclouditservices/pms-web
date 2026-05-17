"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import LeaseModal from "@/components/dashboard/LeaseModal";

function LeasesContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<any>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Pagination & Search & Filter State
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
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchLeases(currentPage, search, filterStatus);
  }, [currentPage, filterStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchLeases(1, search, filterStatus);
      }
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

  const handleSaveLease = async (data: any) => {
    try {
      let response;
      if (selectedLease && modalMode === 'edit') {
        response = await api.put(`/leases/${selectedLease._id}`, data);
      } else {
        response = await api.post('/leases', data);
      }
      if (response.success) {
        fetchLeases(currentPage, search, filterStatus);
      }
    } catch (err) {
      console.error("Failed to save lease:", err);
    }
  };

  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");

  const openViewModal = (lease: any) => {
    setModalMode("view");
    setSelectedLease(lease);
    setIsModalOpen(true);
  };

  const openEditModal = (lease: any) => {
    setModalMode("edit");
    setSelectedLease(lease);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedLease(null);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Lease Management</h2>
          <p className="text-muted small mb-0">Track active agreements, rentals, and tenant portfolios.</p>
        </div>
        {(!user || user.role === 'Admin') && (
          <button 
            className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold text-white border-0 d-flex align-items-center gap-2" 
            style={{ backgroundColor: '#10B981' }}
            onClick={openCreateModal}
          >
            <i className="bi bi-plus-lg"></i> Create New Lease
          </button>
        )}
      </div>

      <div className="row g-3 mb-4 align-items-center">
        <div className="col-md-5">
          <div className="bg-white p-2 rounded-pill border shadow-sm d-flex align-items-center px-3">
            <i className="bi bi-search text-muted me-2"></i>
            <input 
              type="text" 
              className="border-0 bg-transparent w-100 shadow-none small py-1" 
              placeholder="Search tenant or contact..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ outline: 'none' }}
            />
          </div>
        </div>
        <div className="col-md-7 d-flex justify-content-end gap-2">
          <select 
            className="form-select form-select-sm rounded-pill border shadow-sm bg-white px-3 fw-bold text-muted"
            style={{ width: '180px', fontSize: '0.8rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Agreements</option>
            <option value="Active">Active Only</option>
            <option value="Pending">Pending Only</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              <tr>
                <th className="py-3 px-4">Tenant Details</th>
                <th className="py-3 px-4">Unit Portfolio</th>
                <th className="py-3 px-4">Property Owner</th>
                <th className="py-3 px-4">Rent Due</th>
                <th className="py-3 px-4">Monthly Total</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-5"><div className="spinner-border spinner-border-sm text-emerald"></div></td></tr>
              ) : leases.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted small">No active lease agreements found.</td></tr>
              ) : leases.map((lease) => (
                <tr key={lease._id} className="hover-bg-light transition-all border-bottom">
                  <td className="px-4 py-3">
                    <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{lease.tenantName}</h6>
                    <span className="text-muted small">{lease.tenantContact}</span>
                  </td>
                  <td className="px-4 py-3">
                    {lease.units && lease.units.length > 0 ? (
                      <div className="d-flex flex-column">
                        <div className="fw-bold text-dark small d-flex align-items-center gap-1">
                          <i className="bi bi-door-open-fill text-emerald"></i>
                          {lease.units[0].unitNumber}
                        </div>
                        {lease.units.length > 1 && (
                          <span className="badge bg-light text-muted border mt-1 w-fit" style={{ fontSize: '0.6rem', width: 'fit-content' }}>
                            +{lease.units.length - 1} more units
                          </span>
                        )}
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {lease.units[0].property?.propertyName || 'Main Block'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted small italic">Not Linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="fw-bold text-dark small">{lease.owner?.ownerName}</div>
                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Landlord</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="bg-warning bg-opacity-10 text-warning px-2 py-1 rounded-pill d-inline-block fw-bold" style={{ fontSize: '0.7rem' }}>
                      {lease.dueDay || 5}th of Month
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="fw-bold text-emerald small">₹{((lease.monthlyRent || 0) + (lease.maintenanceCharges || 0)).toLocaleString()}</div>
                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Base: ₹{lease.monthlyRent?.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-dark fw-medium small">{formatDate(lease.startDate)}</div>
                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>To {formatDate(lease.endDate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge rounded-pill px-2 py-1 fw-bold ${lease.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="d-flex gap-3 justify-content-end">
                      <button className="btn p-0 text-primary transition-all hover-scale" title="View Agreement" onClick={() => openViewModal(lease)}>
                        <i className="bi bi-eye-fill fs-5"></i>
                      </button>
                      {(!user || user.role === 'Admin') && (
                        <button className="btn p-0 text-primary transition-all hover-scale" title="Edit Lease" onClick={() => openEditModal(lease)}>
                          <i className="bi bi-pencil-square fs-5"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-top bg-light d-flex justify-content-between align-items-center">
          <div className="small text-muted fw-medium">
            Page <span className="text-dark fw-bold">{currentPage}</span> of <span className="text-dark fw-bold">{totalPages}</span>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-white border rounded shadow-sm px-3 fw-bold transition-all" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{ fontSize: '0.75rem' }}
            >
              Previous
            </button>
            <button 
              className="btn btn-sm btn-white border rounded shadow-sm px-3 fw-bold transition-all" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{ fontSize: '0.75rem' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .rounded-xl { border-radius: 1rem !important; }
        .text-emerald { color: #10B981 !important; }
        .bg-emerald { background-color: #10B981 !important; }
        .border-emerald { border-color: #10B981 !important; }
        .hover-bg-light:hover { background-color: #f8fafc !important; }
        .hover-scale:hover { transform: scale(1.15); }
        .transition-all { transition: all 0.2s ease-in-out; }
        .btn-white { background: white; color: #334155; }
        .btn-white:hover { background: #f1f5f9; }
      `}</style>

      <LeaseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLease}
        editData={selectedLease}
        mode={modalMode}
      />
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
