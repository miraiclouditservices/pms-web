"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import VendorModal from "@/components/dashboard/VendorModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function VendorsPage() {
  const [userRole, setUserRole] = useState("super_admin");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    contacts: 0
  });

  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
    fetchMetrics();

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === "Admin") {
            setUserRole("super_admin");
          } else if (u.role === "Owner") {
            setUserRole("manager");
          } else {
            setUserRole("viewer");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/vendors');
      if (response.success) {
        setVendors(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/vendors/stats');
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  const filteredVendors = vendors.filter(v => 
    (v.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.vendorCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.contactName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, vendor: any = null) => {
    setModalMode(mode);
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleSaveVendor = async (savedData: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/vendors/${savedData._id}`, savedData);
      } else {
        response = await api.post('/vendors', savedData);
      }
      
      if (response.success) {
        fetchVendors();
        fetchMetrics();
      }
    } catch (err) {
      console.error("Failed to save vendor:", err);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        const response = await api.delete(`/vendors/${id}`);
        if (response.success) {
          fetchVendors();
          fetchMetrics();
        }
      } catch (err) {
        console.error("Failed to delete vendor:", err);
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Role Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Vendor Management</h2>
          <p className="text-muted small mb-0">View and manage all vendors and contracts</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="d-flex align-items-center bg-light rounded-pill p-1 shadow-sm">
            <span className="small fw-bold text-muted px-2">Role:</span>
            <select 
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-emerald shadow-none py-0" 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              style={{ width: '130px', cursor: 'pointer' }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="manager">Vendor Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold shadow-sm" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export
          </button>
          {userRole !== 'viewer' && (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
              style={{ backgroundColor: '#10B981', fontSize: '0.75rem' }}
              onClick={() => handleOpenModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> Add New Vendor
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift" style={{ borderLeft: '4px solid #0D6EFD' }}>
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-people fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Vendors</div>
              <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{metrics.total}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Registered Vendors</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift" style={{ borderLeft: '4px solid #10B981' }}>
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-person-check fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Active Vendors</div>
              <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{metrics.active}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Currently Active</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift" style={{ borderLeft: '4px solid #F59E0B' }}>
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-person-dash fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Inactive Vendors</div>
              <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{metrics.inactive}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Currently Inactive</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift" style={{ borderLeft: '4px solid #0EA5E9' }}>
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-envelope fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Contacts</div>
              <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{metrics.contacts}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Vendor Contacts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '300px' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by vendor name, code, contact name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Status: All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Scope of Works: All</option>
          </select>
          <button className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-funnel"></i> Filters
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
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Vendor Code</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Vendor Name</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Address</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Scope of Works</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Contact Name</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Mobile Number</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Mail ID</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Status</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    <span className="text-muted small">Loading vendors...</span>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted small">No vendors found.</td>
                </tr>
              ) : (
                filteredVendors.map((vendor, index) => (
                  <tr key={vendor._id} className="transition-all hover-bg-light" style={{ fontSize: '0.85rem' }}>
                    <td className="px-3 py-3 fw-bold text-muted">{index + 1}</td>
                    <td className="px-3 py-3 fw-bold">{vendor.vendorCode}</td>
                    <td className="px-3 py-3 fw-medium text-dark">{vendor.vendorName}</td>
                    <td className="px-3 py-3 text-muted">{vendor.address}</td>
                    <td className="px-3 py-3 small">{vendor.scopeOfWork}</td>
                    <td className="px-3 py-3">{vendor.contactName}</td>
                    <td className="px-3 py-3 text-muted">{vendor.mobileNumber}</td>
                    <td className="px-3 py-3 text-muted">{vendor.emailId}</td>
                    <td className="px-3 py-3">
                      <span className={`badge rounded-pill px-2 py-1 fw-medium ${vendor.status === 'Active' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {vendor.status || 'Active'}
                      </span>
                    </td>
                  <td className="px-3 py-3">
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                        style={{ width: '28px', height: '28px' }} 
                        title="View"
                        onClick={() => handleOpenModal('view', vendor)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-success" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Edit"
                          onClick={() => handleOpenModal('edit', vendor)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {userRole === 'super_admin' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-danger" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Delete"
                          onClick={() => handleDelete(vendor._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <span className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>
            Showing 1 to {filteredVendors.length} of {metrics.total} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-sm btn-primary border-0 px-3 shadow-none" style={{ backgroundColor: '#10B981' }}>1</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">2</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">3</button>
            <span className="px-2 align-self-center text-muted">...</span>
            <button className="btn btn-sm btn-white border px-3 shadow-none">8</button>
            <button className="btn btn-sm btn-white border px-2 shadow-none"><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hover-lift:hover { transform: translateY(-3px); }
        .text-emerald { color: #10B981 !important; }
        .bg-emerald { background-color: #10B981 !important; }
        .rounded-xl { border-radius: 1rem !important; }
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.02) !important; }
      `}</style>
      
      <VendorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVendor}
        editData={selectedVendor}
        mode={modalMode}
      />
    </div>
  );
}
