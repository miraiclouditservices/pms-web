"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import GatePassModal from "@/components/dashboard/GatePassModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function GatePassPage() {
  const [userRole, setUserRole] = useState("super_admin");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedGatePass, setSelectedGatePass] = useState<any>(null);

  const metrics = {
    total: 342,
    today: 18,
    pending: 5,
    totalCost: "₹ 12,45,000"
  };

  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGatePasses();

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === "Admin") {
            setUserRole("super_admin");
          } else if (u.role === "Owner") {
            setUserRole("security");
          } else {
            setUserRole("viewer");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const fetchGatePasses = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/materials');
      if (response.success) {
        setGatePasses(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch gate passes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPasses = gatePasses.filter(gp => 
    (gp.materialDetails || gp.material || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (gp.hsnCode || "").includes(searchTerm) ||
    (gp.vehicleNo || gp.vehicle || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, gatePass: any = null) => {
    setModalMode(mode);
    setSelectedGatePass(gatePass);
    setIsModalOpen(true);
  };

  const handleSaveGatePass = async (savedData: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/materials/${savedData._id}`, savedData);
      } else {
        response = await api.post('/materials', savedData);
      }
      
      if (response.success) {
        fetchGatePasses();
      }
    } catch (err) {
      console.error("Failed to save gate pass:", err);
    }
    setIsModalOpen(false);
  };

  const handleClear = async (id: string) => {
    if (confirm("Mark this gate pass as cleared?")) {
      try {
        const response = await api.put(`/materials/${id}`, { status: 'CLEARED', outTime: new Date() });
        if (response.success) {
          fetchGatePasses();
        }
      } catch (err) {
        console.error("Failed to clear gate pass:", err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this gate pass?")) {
      try {
        const response = await api.delete(`/materials/${id}`);
        if (response.success) {
          fetchGatePasses();
        }
      } catch (err) {
        console.error("Failed to delete gate pass:", err);
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Role Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Material Gate Pass</h2>
          <p className="text-muted small mb-0">Track inward and outward material movement</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="d-flex align-items-center bg-light rounded-pill p-1">
            <span className="small fw-bold text-muted px-2">Role:</span>
            <select 
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-emerald shadow-none py-0" 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              style={{ width: '130px', cursor: 'pointer' }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="security">Security Officer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export
          </button>
          {userRole !== 'viewer' && (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
              style={{ backgroundColor: '#10B981', fontSize: '0.75rem' }}
              onClick={() => handleOpenModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> Create Gate Pass
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-file-earmark-text fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Gate Pass</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.total}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>All Time</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-calendar-event fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Today's Gate Pass</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.today}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Issued Today</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-hourglass-split fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Pending Gate Pass</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.pending}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Awaiting Action</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-currency-rupee fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Material Cost</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.totalCost}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Cumulative Value</div>
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
            placeholder="Search by material, HSN code, vehicle no..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 border shadow-none">
            <i className="bi bi-calendar3 text-muted me-2 small"></i>
            <select className="form-select border-0 bg-transparent shadow-none text-muted fw-medium py-0 px-0 pe-3" style={{ fontSize: '0.75rem', width: '110px' }}>
              <option>Select Date</option>
              <option>Today</option>
              <option>Yesterday</option>
            </select>
          </div>
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Type: All</option>
            <option>Returnable</option>
            <option>Non-Returnable</option>
          </select>
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Purpose: All</option>
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
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>S.No</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Type of Gate Pass</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Material Details</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>HSN Code</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-center" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Qty</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Rate (₹)</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Cost (₹)</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Place of Visit</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Purpose</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Vehicle No</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Intime</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Outtime</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((gp, index) => (
                <tr key={gp._id} className="transition-all hover-bg-light" style={{ fontSize: '0.85rem' }}>
                  <td className="px-3 py-3 fw-bold text-muted">{index + 1}</td>
                  <td className="px-3 py-3">
                    <span className={`badge rounded-pill px-2 py-1 fw-medium ${
                      gp.typeOfGatePass === 'Returnable' ? 'bg-warning bg-opacity-10 text-warning border border-warning' : 'bg-info bg-opacity-10 text-info border border-info'
                    }`}>
                      {gp.typeOfGatePass || gp.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 fw-medium text-dark">{gp.materialDetails || gp.material}</td>
                  <td className="px-3 py-3 fw-mono text-muted">{gp.hsnCode}</td>
                  <td className="px-3 py-3 text-center fw-bold">{gp.quantity}</td>
                  <td className="px-3 py-3 text-end">{gp.rate}</td>
                  <td className="px-3 py-3 text-end fw-bold">{gp.totalCost}</td>
                  <td className="px-3 py-3 text-muted">{gp.placeOfVisit || gp.place}</td>
                  <td className="px-3 py-3">{gp.purpose}</td>
                  <td className="px-3 py-3 fw-bold">{gp.vehicleNo || gp.vehicle}</td>
                  <td className="px-3 py-3 text-muted">{gp.inTime ? new Date(gp.inTime).toLocaleTimeString() : '-'}</td>
                  <td className="px-3 py-3 text-muted">{gp.outTime ? new Date(gp.outTime).toLocaleTimeString() : '-'}</td>
                  <td className="px-3 py-3">
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                        style={{ width: '28px', height: '28px' }} 
                        title="View"
                        onClick={() => handleOpenModal('view', gp)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Edit"
                          onClick={() => handleOpenModal('edit', gp)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {userRole !== 'viewer' && gp.status === 'PENDING' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-success" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Clear Gate Pass"
                          onClick={() => handleClear(gp._id)}
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                      )}
                      {userRole === 'super_admin' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-danger" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Delete"
                          onClick={() => handleDelete(gp._id)}
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
            Showing 1 to {filteredPasses.length} of {metrics.total} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-sm btn-primary border-0 px-3 shadow-none" style={{ backgroundColor: '#10B981' }}>1</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">2</button>
            <span className="px-2 align-self-center text-muted">...</span>
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
        .fw-mono { font-family: monospace; }
      `}</style>
      
      <GatePassModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGatePass}
        editData={selectedGatePass}
        mode={modalMode}
      />
    </div>
  );
}
