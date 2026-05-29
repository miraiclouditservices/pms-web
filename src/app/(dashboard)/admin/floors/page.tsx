
"use client";
import styles from "@/styles/modules/Floors.module.css";
import { useState, useEffect } from "react";
import FloorModal from "@/components/dashboard/FloorModal";
import { api } from "@/utils/api";

export default function FloorsPage() {
  const [floors, setFloors] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewFloor, setViewFloor] = useState<any>(null);
  const [editFloor, setEditFloor] = useState<any>(null);
  const [floorUnits, setFloorUnits] = useState<any[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchFloors();
  }, [selectedPropertyId, currentPage]);

  useEffect(() => {
    if (viewFloor) {
      fetchFloorUnits(viewFloor._id);
    } else {
      setFloorUnits([]);
    }
  }, [viewFloor]);

  const fetchFloorUnits = async (floorId: string) => {
    try {
      const response = await api.get(`/units?floor=${floorId}`);
      if (response.success) {
        setFloorUnits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) {
        setProperties(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFloors = async () => {
    if (!selectedPropertyId) {
      setFloors([]);
      return;
    }
    try {
      const response = await api.get(`/floors?property=${selectedPropertyId}&page=${currentPage}&limit=10`);
      if (response.success) {
        setFloors(response.data);
        setTotalPages(response.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFloor = async (data: any) => {
    try {
      if (editFloor) {
        await api.put(`/floors/${editFloor._id}`, data);
      } else {
        await api.post('/floors', data);
      }
      fetchFloors();
    } catch (err) {
      console.error(err);
    }
    setIsModalOpen(false);
    setEditFloor(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this floor?")) {
      try {
        await api.delete(`/floors/${id}`);
        fetchFloors();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-0 p-md-0 d-flex flex-column" style={{ backgroundColor: '#ffffff', height: 'calc(100vh - 120px)', overflow: 'hidden', fontFamily: 'var(--font-geist-sans)' }}>
      <FloorModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditFloor(null); }}
        onSave={handleSaveFloor}
        editData={editFloor}
      />

      {viewFloor ? (
        /* Floor Detail View (Matching Property Detail view style) */
        <div className="container-fluid p-4 overflow-auto flex-grow-1" style={{ height: '100%' }}>
          {/* Header / Breadcrumbs */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb small mb-1">
                  <li className="breadcrumb-item">
                    <button className="btn btn-link p-0 text-decoration-none text-muted small" onClick={() => setViewFloor(null)}>Floors</button>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {viewFloor.floorName || `Floor ${viewFloor.floorNumber}`}
                  </li>
                </ol>
              </nav>
              <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                Floor Details
              </h2>
            </div>
            <div>
              <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem', borderColor: '#e2e8f0' }} onClick={() => setViewFloor(null)}>
                <i className="bi bi-arrow-left me-1"></i> Back to Floors
              </button>
            </div>
          </div>

          <div className="row g-4 align-items-stretch">
            {/* Left Side: Floor Metadata Card */}
            <div className="col-lg-4 col-md-5 col-12">
              <div className="bg-white rounded-xl shadow-sm border p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  {/* Floor Image Container */}
                  <div className="position-relative overflow-hidden rounded-xl mb-4" style={{ height: "200px" }}>
                    <img 
                      src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop" 
                      alt="Floor View" 
                      className="w-100 h-100" 
                      style={{ objectFit: "cover" }}
                    />
                    <div 
                      className="position-absolute bg-white px-3 py-1 shadow-sm d-flex align-items-center gap-2" 
                      style={{ bottom: "12px", right: "12px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "700" }}
                    >
                      <span className="rounded-circle" style={{ width: "8px", height: "8px", backgroundColor: viewFloor.status === "Active" ? "#10b981" : "#f59e0b" }}></span>
                      <span className="text-dark">{viewFloor.status || "Active"}</span>
                    </div>
                  </div>

                  {/* Floor Name Header */}
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#e8f0fe', color: '#014aad', flexShrink: 0 }}>
                      <i className="bi bi-layers-fill" style={{ fontSize: '1.4rem' }}></i>
                    </div>
                    <div className="text-truncate">
                      <h4 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
                        {viewFloor.floorName || `Floor ${viewFloor.floorNumber}`}
                      </h4>
                      <div className="text-muted small" style={{ fontSize: '0.82rem' }}>
                        {viewFloor.property?.propertyName || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <hr className="my-3 opacity-10" />

                  {/* Meta Items List */}
                  <div className="d-flex flex-column">
                    {[
                      { label: "Total Capacity", value: `${viewFloor.totalSft ? viewFloor.totalSft.toLocaleString() : 0} SFT`, icon: "bi-aspect-ratio" },
                      { label: "Occupied Space", value: `${viewFloor.occupiedSft ? viewFloor.occupiedSft.toLocaleString() : 0} SFT`, icon: "bi-building-fill" },
                      { label: "Available Space", value: `${((viewFloor.totalSft || 0) - (viewFloor.occupiedSft || 0)).toLocaleString()} SFT`, icon: "bi-check-circle-fill", valueClass: "text-success" },
                      { label: "Property Owner", value: viewFloor.assignedOwner?.ownerName || 'Unassigned', icon: "bi-person-fill" },
                      { label: "Floor Admin", value: viewFloor.assignedAdmin?.name || 'Unassigned', icon: "bi-person-badge-fill" },
                      { label: "Generated Revenue", value: `₹${viewFloor.floorRevenue ? viewFloor.floorRevenue.toLocaleString() : 0}`, icon: "bi-currency-rupee" }
                    ].map((item, idx, arr) => (
                      <div 
                        key={idx} 
                        className="d-flex justify-content-between align-items-center py-2.5"
                        style={{ borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f1f5f9" }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="rounded-lg d-flex align-items-center justify-content-center" 
                            style={{ width: '32px', height: '32px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', color: '#014aad' }}
                          >
                            <i className={`bi ${item.icon}`} style={{ fontSize: "0.95rem" }}></i>
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>{item.label}</span>
                        </div>
                        <span className={`fw-bold text-dark text-end ${item.valueClass || ''}`} style={{ fontSize: '0.85rem', maxWidth: '60%' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Flats & Units Card */}
            <div className="col-lg-8 col-md-7 col-12">
              <div className="bg-white rounded-xl shadow-sm border p-4 h-100 d-flex flex-column" style={{ minHeight: "560px" }}>
                <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                  {/* Header Title with Total Area Badge */}
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 flex-shrink-0">
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <i className="bi bi-grid-3x3-gap text-primary" style={{ color: '#014aad', fontSize: "1.4rem" }}></i>
                      Flats & Units List
                    </h5>
                    <span className="badge bg-light text-dark border px-3 py-2 fw-bold" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>
                      Total Units: {floorUnits.length}
                    </span>
                  </div>

                  {/* Table Header */}
                  <div className="d-flex align-items-center bg-light bg-opacity-50 px-3 py-2 rounded-lg mb-2 flex-shrink-0">
                    <div className="fw-bold text-muted text-uppercase" style={{ flex: 1, fontSize: '0.7rem', letterSpacing: '0.05em' }}>Flat/Unit No</div>
                    <div className="fw-bold text-muted text-uppercase text-center" style={{ width: '100px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Type</div>
                    <div className="fw-bold text-muted text-uppercase text-end" style={{ width: '120px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Capacity (SFT)</div>
                    <div className="fw-bold text-muted text-uppercase text-center" style={{ width: '120px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Owner</div>
                    <div className="fw-bold text-muted text-uppercase text-center" style={{ width: '120px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Tenant</div>
                    <div className="fw-bold text-muted text-uppercase text-center" style={{ width: '100px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Status</div>
                  </div>

                  {/* Scrollable Rows Wrapper */}
                  <div className="position-relative flex-grow-1 mb-3" style={{ minHeight: "200px" }}>
                    <div className="position-absolute w-100 h-100 overflow-auto pe-1">
                      {floorUnits.length > 0 ? (
                        <div className="d-flex flex-column">
                          {floorUnits.map((unit: any, idx: number) => (
                            <div key={idx} className="d-flex align-items-center py-2.5 px-3 border-bottom border-light">
                              <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#e8f0fe', color: '#014aad' }}>
                                  <i className="bi bi-door-closed" style={{ fontSize: '0.9rem' }}></i>
                                </div>
                                <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{unit.unitNumber}</span>
                              </div>
                              <div className="text-center text-secondary fw-semibold" style={{ width: '100px', fontSize: '0.85rem' }}>
                                {unit.unitType}
                              </div>
                              <div className="text-end text-dark fw-bold" style={{ width: '120px', fontSize: '0.85rem' }}>
                                {unit.sqft ? unit.sqft.toLocaleString() : 0} SFT
                              </div>
                              <div className="text-center text-dark text-truncate" style={{ width: '120px', fontSize: '0.85rem', padding: '0 5px' }}>
                                {unit.owner?.ownerName || <span className="text-muted small">Unassigned</span>}
                              </div>
                              <div className="text-center text-dark text-truncate" style={{ width: '120px', fontSize: '0.85rem', padding: '0 5px' }}>
                                {unit.tenant?.tenantName || <span className="text-muted small">Unassigned</span>}
                              </div>
                              <div className="text-center" style={{ width: '100px' }}>
                                <span className={`badge rounded-pill px-2 py-1 ${
                                  unit.unitStatus === 'Available' 
                                    ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' 
                                    : 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                                }`} style={{ fontSize: '0.7rem' }}>
                                  {unit.unitStatus}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center py-5">
                          <i className="bi bi-grid-3x3-gap text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                          <span className="text-muted fw-bold">No flats/units configured on this floor.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Summary Cards */}
                <div className="row g-3 flex-shrink-0">
                  <div className="col-md-6 col-12">
                    <div className="d-flex align-items-center gap-3 bg-light bg-opacity-50 p-3 rounded-xl border border-light">
                      <div className="rounded-lg d-flex align-items-center justify-content-center bg-white text-primary border" style={{ width: '44px', height: '44px', color: '#014aad' }}>
                        <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.2rem' }}></i>
                      </div>
                      <div>
                        <div className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>Total Units</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                          {floorUnits.length} Unit(s)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="d-flex align-items-center gap-3 bg-light bg-opacity-50 p-3 rounded-xl border border-light">
                      <div className="rounded-lg d-flex align-items-center justify-content-center bg-white text-primary border" style={{ width: '44px', height: '44px', color: '#014aad' }}>
                        <i className="bi bi-aspect-ratio" style={{ fontSize: '1.2rem' }}></i>
                      </div>
                      <div>
                        <div className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>Occupied Space</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                          {viewFloor.occupiedSft ? viewFloor.occupiedSft.toLocaleString() : 0} SFT
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style jsx global>{`
            .rounded-xl { border-radius: 1rem !important; }
            .rounded-lg { border-radius: 0.75rem !important; }
          `}</style>
        </div>
      ) : (
        /* Normal Floor List View */
        <div className="bg-white border d-flex flex-column flex-grow-1" style={{ borderRadius: '8px', padding: '15px', border: '1px solid #e0e0e0', margin: '0', overflow: 'hidden' }}>
          {/* Header & Filter Bar Merged */}
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 pt-0 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
            {/* Left: Tab Headers */}
            <div className="d-flex w-100 position-absolute" style={{ bottom: '0', left: '0', zIndex: -1, borderColor: '#e0e0e0' }}></div>
            <div className="d-flex gap-4">
              <div style={{ paddingBottom: '8px', cursor: 'pointer', marginBottom: '-1px' }}>
                <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>Floors Management</span>
              </div>
            </div>

            {/* Right: Property Filter & Add Button */}
            <div className="d-flex gap-3 align-items-center">
              <div style={{ width: '250px' }}>
                <select 
                  className="form-select px-3 py-2" 
                  style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem', cursor: 'pointer' }}
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Select Property...</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>{p.propertyName}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn d-flex align-items-center justify-content-center gap-2 shadow-sm px-4"
                onClick={() => { setEditFloor(null); setIsModalOpen(true); }}
                style={{ backgroundColor: "#014aad", color: '#ffffff', fontWeight: '500', borderRadius: '4px', height: '40px', fontSize: '0.85rem', border: 'none' }}
                disabled={!selectedPropertyId}
              >
                <i className="bi bi-plus-circle"></i> Add Floor
              </button>
            </div>
          </div>

          {/* Table Wrapper (Scrolling) */}
          <div className="table-responsive flex-grow-1" style={{ overflowY: 'auto', minHeight: 0 }}>
            <table className="table mb-0 border-0 text-nowrap" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
              <thead>
                <tr className="border-0">
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopLeftRadius: '8px' }}>S No</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Floor Name</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Assigned Owner/Admin</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Contact Info</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Capacity (SFT)</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Occupied (SFT)</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Status</th>
                  <th className="py-3 px-4 fw-bold text-center" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopRightRadius: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {!selectedPropertyId ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="d-flex flex-column align-items-center gap-3 py-4">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <i className="bi bi-building text-muted" style={{ fontSize: '2.5rem' }}></i>
                        </div>
                        <div className="text-center">
                          <h5 className="fw-bold mb-1">Please Select a Property</h5>
                          <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                            Choose a property from the dropdown above to view and manage its floors.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : floors.length > 0 ? (
                  floors.map((floor, index) => (
                    <tr key={floor._id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {floor.floorName || `Floor ${floor.floorNumber}`}
                      </td>
                      <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                        {floor.assignedOwner ? (
                          <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: '500' }}><span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-1 me-2" style={{ fontSize: '0.65rem' }}>Owner</span>{floor.assignedOwner.ownerName}</span>
                        ) : floor.assignedAdmin ? (
                          <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: '500' }}><span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 me-2" style={{ fontSize: '0.65rem' }}>Admin</span>{floor.assignedAdmin.name}</span>
                        ) : (
                          <span className="badge bg-light text-muted border rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>Unassigned</span>
                        )}
                      </td>
                      <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {floor.assignedOwner?.contactNumber || floor.assignedAdmin?.phoneNumber || 'N/A'}
                      </td>
                      <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        <span className="fw-bold text-dark">{floor.totalSft ? floor.totalSft.toLocaleString() : 0} SFT</span>
                      </td>
                      <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                        <div className="d-flex flex-column">
                          <span className="fw-bold" style={{ fontSize: '0.85rem', color: '#ea580c' }}>
                            {floor.occupiedSft ? floor.occupiedSft.toLocaleString() : 0} SFT
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {floor.totalSft && floor.occupiedSft ? Math.round((floor.occupiedSft / floor.totalSft) * 100) : 0}% Occupied
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          color: floor.status === 'Active' ? '#16a34a' : '#ea580c',
                          fontWeight: '600'
                        }}>
                          {floor.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 align-middle text-center" style={{ border: 'none' }}>
                        <div className="d-flex gap-2 justify-content-center align-items-center">
                          <button className="btn btn-link text-dark p-0" title="View Floor" onClick={() => setViewFloor(floor)}>
                            <i className="bi bi-eye-fill" style={{ fontSize: '1.1rem', color: '#4b5563' }}></i>
                          </button>
                          <button className="btn btn-link text-dark p-0" title="Edit Floor" onClick={() => { setEditFloor(floor); setIsModalOpen(true); }}>
                            <i className="bi bi-pencil-square" style={{ fontSize: '1.1rem', color: '#4b5563' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="d-flex flex-column align-items-center gap-3 py-4">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <i className="bi bi-layers-half text-muted" style={{ fontSize: '2.5rem' }}></i>
                        </div>
                        <div className="text-center">
                          <h5 className="fw-bold mb-1">No Floors Found</h5>
                          <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                            This property currently has no floors.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {selectedPropertyId && floors.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top bg-white px-2">
              <span className="text-muted small">Page {currentPage} of {totalPages}</span>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
