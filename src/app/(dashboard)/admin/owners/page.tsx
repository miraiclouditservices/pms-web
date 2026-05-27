"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import OwnerModal from "@/components/dashboard/OwnerModal";

function OwnersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [ownerDetails, setOwnerDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'units' | 'materials' | 'visitors' | 'leases'>('units');

  // Pagination & Search & Filter State
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 25;

  useEffect(() => {
    fetchOwners(currentPage, search, filterType, filterStatus);
  }, [currentPage, filterType, filterStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchOwners(1, search, filterType, filterStatus);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOwners = async (page: number, searchTerm: string, type: string, status: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/owners?page=${page}&limit=${limit}&search=${searchTerm}&ownerType=${type}&status=${status}`);
      if (response.success) {
        setOwners(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.total);
      }
    } catch (err) {
      console.error("Failed to fetch owners:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwnerDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/owners/${id}/details`);
      if (response.success) {
        setOwnerDetails(response.data);
        setViewMode('details');
      }
    } catch (err) {
      console.error("Failed to fetch owner details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOwner(null);
  };

  const openAddModal = () => {
    setModalMode("create");
    setSelectedOwner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (owner: any) => {
    setModalMode("edit");
    setSelectedOwner(owner);
    setIsModalOpen(true);
  };

  const handleSaveOwner = async (savedData: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/owners/${savedData._id}`, savedData);
      } else {
        response = await api.post('/owners', savedData);
      }
      
      if (response.success) {
        fetchOwners(currentPage, search, filterType, filterStatus);
      }
    } catch (err) {
      console.error("Failed to save owner:", err);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    if (confirm("Are you sure you want to delete this owner?")) {
      try {
        const response = await api.delete(`/owners/${id}`);
        if (response.success) {
          fetchOwners(currentPage, search, filterType, filterStatus);
        }
      } catch (err) {
        console.error("Failed to delete owner:", err);
      }
    }
  };

  if (viewMode === 'details' && ownerDetails) {
    const { owner, materials, visitors } = ownerDetails;
    return (
      <div className="container-fluid p-0">
        {/* Detail Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex gap-4">
              <div className="bg-emerald bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                <i className={owner.ownerType === 'Company' ? "bi bi-building" : "bi bi-person-fill"}></i>
              </div>
              <div>
                <h2 className="fw-bold mb-1 text-dark">{owner.ownerName}</h2>
                <div className="d-flex gap-3 text-muted small fw-medium">
                  <span><i className="bi bi-envelope-at me-1"></i> {owner.emailId}</span>
                  <span><i className="bi bi-telephone me-1"></i> {owner.contactNumber}</span>
                  <span className="badge bg-light text-dark border">{owner.ownerType}</span>
                </div>
                <p className="mt-2 text-muted mb-0" style={{ maxWidth: '500px' }}><i className="bi bi-geo-alt me-1"></i> {owner.address}</p>
              </div>
            </div>
            <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" onClick={() => setViewMode('list')}>
              <i className="bi bi-arrow-left me-1"></i> Back to List
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-bottom px-4 pt-3 d-flex gap-4">
            {['units', 'leases', 'materials', 'visitors'].map((tab) => (
              <button 
                key={tab}
                className={`pb-3 fw-bold border-bottom border-2 transition-all text-capitalize ${activeTab === tab ? 'border-emerald text-primary' : 'border-transparent text-muted'}`}
                onClick={() => setActiveTab(tab as any)}
                style={{ fontSize: '0.85rem', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
              >
                {tab} ({tab === 'units' ? owner.unitsAssigned?.length || 0 : tab === 'leases' ? ownerDetails.leases?.length || 0 : tab === 'materials' ? materials.length : visitors.length})
              </button>
            ))}
          </div>

          <div className="p-0">
            {activeTab === 'units' && (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
                    <tr>
                      <th className="py-3 px-4">Unit Number</th>
                      <th className="py-3 px-4">Building / Floor</th>
                      <th className="py-3 px-4">Area (SqFt)</th>
                      <th className="py-3 px-4 text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owner.unitsAssigned?.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-5 text-muted">No units assigned.</td></tr>
                    ) : owner.unitsAssigned.map((u: any) => (
                      <tr key={u._id}>
                        <td className="px-4 py-3 fw-bold text-dark">{u.unitNumber}</td>
                        <td className="px-4 py-3 text-muted">{u.property?.propertyName || u.property?.building || 'Main Building'} / {u.floorNumber}</td>
                        <td className="px-4 py-3 fw-medium">{u.sqft ? `${u.sqft} Sq.Ft` : 'N/A'}</td>
                        <td className="px-4 py-3 text-end">
                          <span className={`badge rounded-pill px-2 py-1 ${u.unitStatus === 'Occupied' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                            {u.unitStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'leases' && (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
                    <tr>
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Assigned Units</th>
                      <th className="py-3 px-4">Rent / Duration</th>
                      <th className="py-3 px-4 text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!ownerDetails.leases || ownerDetails.leases.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-5 text-muted">No lease agreements found.</td></tr>
                    ) : ownerDetails.leases.map((l: any) => (
                      <tr key={l._id}>
                        <td className="px-4 py-3">
                          <div className="fw-bold text-dark">{l.tenantName}</div>
                          <div className="text-muted small">{l.tenantContact}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="small fw-medium">
                            {l.units?.map((u: any) => u.unitNumber).join(", ")}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.65rem' }}>{l.units?.length} Unit(s)</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="fw-bold text-primary small">₹{l.monthlyRent.toLocaleString()}</div>
                          <div className="text-muted small" style={{ fontSize: '0.65rem' }}>
                            Exp: {new Date(l.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <span className={`badge rounded-pill px-2 py-1 fw-bold ${l.status === 'Active' ? 'bg-success text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '0.6rem' }}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
                    <tr>
                      <th className="py-3 px-4">Gate Pass ID</th>
                      <th className="py-3 px-4">Material Details</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-5 text-muted">No gate passes found.</td></tr>
                    ) : materials.map((m: any) => (
                      <tr key={m._id}>
                        <td className="px-4 py-3 fw-bold text-primary small">{m._id.toString().toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <div className="fw-medium text-dark">{m.materialDetails}</div>
                          <div className="text-muted small">Qty: {m.quantity} | {new Date(m.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3">
                           <span className={`badge bg-${m.gatePassType === 'Inward' ? 'info' : 'primary'} bg-opacity-10 text-${m.gatePassType === 'Inward' ? 'info' : 'primary'} rounded-pill px-3`}>
                            {m.gatePassType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <span className={`badge rounded-pill px-2 py-1 ${m.status === 'Approved' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'visitors' && (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
                    <tr>
                      <th className="py-3 px-4">Visitor Name</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4 text-end">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-5 text-muted">No visitor logs found.</td></tr>
                    ) : visitors.map((v: any) => (
                      <tr key={v._id}>
                        <td className="px-4 py-3">
                          <div className="fw-bold text-dark">{v.visitorName}</div>
                          <div className="text-muted small">{v.contactNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-muted fw-medium">{v.purposeOfVisit}</td>
                        <td className="px-4 py-3"><span className="badge bg-light text-dark border">{v.unit}</span></td>
                        <td className="px-4 py-3 text-end text-muted small">
                          <div>{new Date(v.createdAt).toLocaleDateString()}</div>
                          <div>{v.inTime}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Owner Management</h2>
          <p className="text-muted small mb-0">Manage property owners, portfolios, and linked accounts.</p>
        </div>
        <button 
          className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold text-white border-0 d-flex align-items-center gap-2" 
          style={{ backgroundColor: '#014aad', transition: 'all 0.2s' }}
          onClick={openAddModal}
        >
          <i className="bi bi-plus-lg"></i> Add New Owner
        </button>
      </div>

      {/* Metrics Section */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-people-fill fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Owners</div>
              <h3 className="fw-bold mb-0 text-dark">{totalRecords}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Registered</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-emerald bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-check-circle-fill fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Active Accounts</div>
              <h3 className="fw-bold mb-0 text-dark">{owners.filter(o => o.status === 'Active').length}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Verified</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-building fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Companies</div>
              <h3 className="fw-bold mb-0 text-dark">{owners.filter(o => o.ownerType === 'Company').length}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Corporate</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-person-fill fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Individuals</div>
              <h3 className="fw-bold mb-0 text-dark">{owners.filter(o => o.ownerType === 'Individual').length}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Retail</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        {["All", "Individual", "Company"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterType(cat === "All" ? "" : cat)}
            className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${((cat === "All" && !filterType) || filterType === cat) ? 'btn-primary shadow-sm' : 'btn-white border text-muted'}`}
            style={((cat === "All" && !filterType) || filterType === cat) ? { backgroundColor: '#014aad', border: 'none', fontSize: '0.75rem' } : { fontSize: '0.75rem', backgroundColor: '#fff' }}
          >
            {cat} Owners
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '450px' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by owner name, email, or contact number..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex gap-2">
           <select 
            className="form-select form-select-sm rounded-pill border-0 bg-light px-3 fw-bold text-muted shadow-none"
            style={{ width: '150px', fontSize: '0.75rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              <tr>
                <th className="py-3 px-4">Owner Profile</th>
                <th className="py-3 px-4">Contact & Type</th>
                <th className="py-3 px-4 text-center">Portfolio Units</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
              ) : owners.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-5 text-muted small">No records found matching your criteria.</td></tr>
              ) : owners.map((owner) => (
                <tr key={owner._id} className="hover-bg-light transition-all border-bottom">
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-emerald bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary shadow-sm fw-bold" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                        {owner.ownerName.charAt(0)}
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{owner.ownerName}</h6>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>{owner.emailId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="fw-bold text-dark small">{owner.contactNumber}</div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                       <span className={`badge rounded-pill px-2 py-0 fw-normal border ${owner.ownerType === 'Company' ? 'bg-info bg-opacity-10 text-info' : 'bg-warning bg-opacity-10 text-warning'}`} style={{ fontSize: '0.6rem' }}>
                        {owner.ownerType}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="d-flex flex-column align-items-center">
                      <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{owner.unitsAssigned?.length || 0}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>Assigned Units</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge rounded-pill px-3 py-1 fw-bold ${owner.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {owner.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <button className="btn btn-sm btn-light rounded-circle transition-all hover-scale" title="View Full Details" onClick={() => fetchOwnerDetails(owner._id)}>
                        <i className="bi bi-eye-fill text-primary"></i>
                      </button>
                      <button className="btn btn-sm btn-light rounded-circle transition-all hover-scale" title="Edit Profile" onClick={() => openEditModal(owner)}>
                        <i className="bi bi-pencil-square text-success"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination */}
        <div className="px-4 py-3 border-top bg-light d-flex justify-content-between align-items-center">
          <div className="small text-muted fw-medium">
            Showing <span className="text-dark fw-bold">{owners.length}</span> of <span className="text-dark fw-bold">{totalRecords}</span> entries
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-white border rounded shadow-sm px-3 fw-bold transition-all" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{ fontSize: '0.75rem' }}
            >
              <i className="bi bi-chevron-left me-1"></i> Previous
            </button>
            
            <div className="d-flex gap-1">
              {[...Array(Math.max(1, totalPages))].map((_, i) => (
                <button 
                  key={i} 
                  className={`btn btn-sm border rounded shadow-sm px-2 fw-bold transition-all ${currentPage === i + 1 ? 'bg-emerald text-white border-emerald' : 'bg-white text-muted hover-bg-light'}`}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ fontSize: '0.75rem', minWidth: '32px' }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              className="btn btn-sm btn-white border rounded shadow-sm px-3 fw-bold transition-all" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{ fontSize: '0.75rem' }}
            >
              Next <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .rounded-xl { border-radius: 1rem !important; }
        .text-primary { color: #014aad !important; }
        .bg-emerald { background-color: #014aad !important; }
        .border-emerald { border-color: #014aad !important; }
        .hover-bg-light:hover { background-color: #f8fafc !important; }
        .hover-scale:hover { transform: scale(1.15); }
        .transition-all { transition: all 0.2s ease-in-out; }
        .btn-white { background: white; color: #334155; }
        .btn-white:hover { background: #f1f5f9; }
      `}</style>

      <OwnerModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveOwner}
        editData={selectedOwner}
        mode={modalMode}
      />
    </div>
  );
}

export default function OwnersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OwnersContent />
    </Suspense>
  );
}
