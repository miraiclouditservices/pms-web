"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FloorDetailModal from "@/components/dashboard/FloorDetailModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function FloorDetailsPage() {
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
            setUserRole("property_manager");
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
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  const metrics = {
    totalUnits: 120,
    totalSqft: "1,50,000",
    occupiedUnits: 105,
    parkingSpots: 240
  };

  const [floorDetails, setFloorDetails] = useState([
    {
      id: "UNIT101",
      floor: "1",
      unitNumber: "101",
      sqft: "1250",
      carParking: "1",
      bikeParking: "1",
      ownerName: "Rajesh Mehta",
      ownerContact: "9876543210",
      ownerAddress: "Ahmedabad, Gujarat",
      leaseHolderName: "Amit Patel",
      leaseHolderContact: "9876500001",
      remarks: "-"
    },
    {
      id: "UNIT201",
      floor: "2",
      unitNumber: "201",
      sqft: "1250",
      carParking: "1",
      bikeParking: "1",
      ownerName: "Meera Shah",
      ownerContact: "9876543211",
      ownerAddress: "Ahmedabad, Gujarat",
      leaseHolderName: "Neha Shah",
      leaseHolderContact: "9876500002",
      remarks: "-"
    },
    {
      id: "UNIT301",
      floor: "3",
      unitNumber: "301",
      sqft: "1250",
      carParking: "1",
      bikeParking: "1",
      ownerName: "Vikram Singh",
      ownerContact: "9876543212",
      ownerAddress: "Vadodara, Gujarat",
      leaseHolderName: "Rohan Singh",
      leaseHolderContact: "9876500003",
      remarks: "-"
    },
    {
      id: "UNIT401",
      floor: "4",
      unitNumber: "401",
      sqft: "1250",
      carParking: "1",
      bikeParking: "1",
      ownerName: "Arvind Joshi",
      ownerContact: "9876543213",
      ownerAddress: "Surat, Gujarat",
      leaseHolderName: "Kunal Joshi",
      leaseHolderContact: "9876500004",
      remarks: "-"
    }
  ]);

  const filteredDetails = floorDetails.filter(d => 
    d.unitNumber.includes(searchTerm) || 
    d.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.leaseHolderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, detail: any = null) => {
    setModalMode(mode);
    setSelectedDetail(detail);
    setIsModalOpen(true);
  };

  const handleSaveDetail = (savedData: any) => {
    if (modalMode === 'create') {
      setFloorDetails([savedData, ...floorDetails]);
    } else if (modalMode === 'edit') {
      setFloorDetails(floorDetails.map(d => d.id === savedData.id ? savedData : d));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this unit detail?")) {
      setFloorDetails(floorDetails.filter(d => d.id !== id));
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
              <li className="breadcrumb-item active" aria-current="page">Floor Details</li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Property Floor Details</h2>
          <p className="text-muted small mb-0">Manage individual unit and owner information</p>
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
              <option value="property_manager">Prop. Manager</option>
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
              <i className="bi bi-plus-lg me-1"></i> Add Unit Details
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-building fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Units</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.totalUnits}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Property Wide</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-arrows-fullscreen fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Sq Ft</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.totalSqft}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Leasable Area</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-door-open fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Occupied Units</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.occupiedUnits}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Currently Active</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-p-circle fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Parking Spots</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.parkingSpots}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Allocated</div>
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
            placeholder="Search by unit no, owner name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Floor: All</option>
            <option>1st Floor</option>
            <option>2nd Floor</option>
            <option>3rd Floor</option>
          </select>
          <button className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-funnel"></i> Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ minWidth: '1500px' }}>
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Unit ID</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Floor</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Unit Number</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Sqft</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-center" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Car Parking</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-center" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Bike Parking</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom border-start bg-white" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Owner Name</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom bg-white" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Owner Contact</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom bg-white" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Owner Address</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom border-start bg-white" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Lease Holder Name</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom bg-white" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Lease Holder Contact</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Remarks</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end sticky-right" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', right: 0, backgroundColor: '#f8f9fa' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetails.map((detail) => (
                <tr key={detail.id} className="transition-all hover-bg-light" style={{ fontSize: '0.85rem' }}>
                  <td className="px-3 py-3 fw-bold text-muted">{detail.id}</td>
                  <td className="px-3 py-3 fw-medium">{detail.floor}</td>
                  <td className="px-3 py-3 fw-bold text-dark">{detail.unitNumber}</td>
                  <td className="px-3 py-3 text-muted">{detail.sqft}</td>
                  <td className="px-3 py-3 text-center">{detail.carParking}</td>
                  <td className="px-3 py-3 text-center">{detail.bikeParking}</td>
                  
                  {/* Owner */}
                  <td className="px-3 py-3 border-start fw-medium">{detail.ownerName}</td>
                  <td className="px-3 py-3 text-muted">{detail.ownerContact}</td>
                  <td className="px-3 py-3 text-muted" style={{ maxWidth: '150px' }}>
                    <div className="text-truncate" title={detail.ownerAddress}>{detail.ownerAddress}</div>
                  </td>
                  
                  {/* Lease Holder */}
                  <td className="px-3 py-3 border-start fw-medium">{detail.leaseHolderName}</td>
                  <td className="px-3 py-3 text-muted">{detail.leaseHolderContact}</td>
                  
                  <td className="px-3 py-3 text-muted text-center">{detail.remarks}</td>
                  <td className="px-3 py-3 sticky-right bg-white" style={{ right: 0 }}>
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                        style={{ width: '28px', height: '28px' }} 
                        title="View"
                        onClick={() => handleOpenModal('view', detail)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-success" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Edit"
                          onClick={() => handleOpenModal('edit', detail)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {userRole === 'super_admin' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-danger" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Delete"
                          onClick={() => handleDelete(detail.id)}
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
            Showing 1 to {filteredDetails.length} of 120 entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-sm btn-primary border-0 px-3 shadow-none" style={{ backgroundColor: '#014aad' }}>1</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">2</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">3</button>
            <span className="px-2 align-self-center text-muted">...</span>
            <button className="btn btn-sm btn-white border px-3 shadow-none">12</button>
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
        .sticky-right { position: sticky; z-index: 1; border-left: 1px solid #dee2e6; }
      `}</style>
      
      <FloorDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDetail}
        editData={selectedDetail}
        mode={modalMode}
      />
    </div>
  );
}
