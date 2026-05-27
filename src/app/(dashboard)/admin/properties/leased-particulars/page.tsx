"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LeaseModal from "@/components/dashboard/LeaseModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function LeasedParticularsPage() {
  const [userRole, setUserRole] = useState("super_admin");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === "Admin") {
            setUserRole("super_admin");
          } else if (u.role === "Owner") {
            setUserRole("leasing_manager");
          } else {
            setUserRole("viewer");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedLease, setSelectedLease] = useState<any>(null);

  const metrics = {
    totalUnits: 42,
    activeLeases: 38,
    expiringSoon: 4,
    totalArea: "28,450"
  };

  const [leases, setLeases] = useState([
    {
      id: "LSE001",
      holderName: "Amit Patel",
      startDate: "01-Apr-2023",
      endDate: "31-Mar-2026",
      floor: "1st Floor",
      units: "101, 102",
      sqft: "2450"
    },
    {
      id: "LSE002",
      holderName: "Neha Shah",
      startDate: "15-May-2023",
      endDate: "14-May-2026",
      floor: "2nd Floor",
      units: "201, 202",
      sqft: "2400"
    },
    {
      id: "LSE003",
      holderName: "Rohan Singh",
      startDate: "01-Jun-2023",
      endDate: "31-May-2026",
      floor: "3rd Floor",
      units: "301",
      sqft: "1250"
    },
    {
      id: "LSE004",
      holderName: "Kunal Joshi",
      startDate: "10-Jul-2023",
      endDate: "09-Jul-2026",
      floor: "4th Floor",
      units: "401",
      sqft: "1250"
    },
    {
      id: "LSE005",
      holderName: "Payal Desai",
      startDate: "01-Aug-2023",
      endDate: "31-Jul-2026",
      floor: "5th Floor",
      units: "501",
      sqft: "1250"
    }
  ]);

  const filteredLeases = leases.filter(l => 
    l.holderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.floor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, lease: any = null) => {
    setModalMode(mode);
    setSelectedLease(lease);
    setIsModalOpen(true);
  };

  const handleSaveLease = async (savedData: any): Promise<boolean> => {
    if (modalMode === 'create') {
      setLeases([savedData, ...leases]);
    } else if (modalMode === 'edit') {
      setLeases(leases.map(l => l.id === savedData.id ? savedData : l));
    }
    return true;
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lease record?")) {
      setLeases(leases.filter(l => l.id !== id));
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Role Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item"><Link href="/admin/properties" className="text-decoration-none text-muted">Properties</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Leased Particulars</li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Leased Particulars</h2>
          <p className="text-muted small mb-0">View and manage all leased property details</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="d-flex align-items-center bg-light rounded-pill p-1">
            <span className="small fw-bold text-muted px-2">Role:</span>
            <select 
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-primary shadow-none py-0" 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              style={{ width: '130px', cursor: 'pointer' }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="leasing_manager">Leasing Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export
          </button>
          {userRole !== 'viewer' && (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
              style={{ backgroundColor: '#014aad', fontSize: '0.75rem' }}
              onClick={() => handleOpenModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> Add New Lease
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-building-check fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Leased Units</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.totalUnits}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>All Time</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-calendar-check fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Active Leases</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.activeLeases}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Currently Active</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-calendar-minus fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Expiring Soon</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.expiringSoon}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Next 30 Days</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-grid-1x2 fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Leased Area</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.totalArea}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Sq Ft</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by lease holder name, ID, floor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex gap-2">
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
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Lease ID</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Name of the Lease Holder</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Lease Start Date</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Lease End Date</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Leased Floor</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Leased Units</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Sq Ft</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map((lease, index) => (
                <tr key={lease.id} className="transition-all hover-bg-light" style={{ fontSize: '0.85rem' }}>
                  <td className="px-3 py-3 fw-bold text-muted">{index + 1}</td>
                  <td className="px-3 py-3 fw-bold text-primary">{lease.id}</td>
                  <td className="px-3 py-3 fw-medium text-dark">{lease.holderName}</td>
                  <td className="px-3 py-3 text-muted">{lease.startDate}</td>
                  <td className="px-3 py-3 text-muted">{lease.endDate}</td>
                  <td className="px-3 py-3 fw-medium">{lease.floor}</td>
                  <td className="px-3 py-3">{lease.units}</td>
                  <td className="px-3 py-3 fw-bold">{lease.sqft}</td>
                  <td className="px-3 py-3">
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                        style={{ width: '28px', height: '28px' }} 
                        title="View"
                        onClick={() => handleOpenModal('view', lease)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-success" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Edit"
                          onClick={() => handleOpenModal('edit', lease)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {userRole === 'super_admin' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-danger" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Delete"
                          onClick={() => handleDelete(lease.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <span className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>
            Showing 1 to {filteredLeases.length} of {metrics.totalUnits} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-sm btn-primary border-0 px-3 shadow-none" style={{ backgroundColor: '#014aad' }}>1</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">2</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">3</button>
            <span className="px-2 align-self-center text-muted">...</span>
            <button className="btn btn-sm btn-white border px-3 shadow-none">5</button>
            <button className="btn btn-sm btn-white border px-2 shadow-none"><i className="bi bi-chevron-right"></i></button>
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
