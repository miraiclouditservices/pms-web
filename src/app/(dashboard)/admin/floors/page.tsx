
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

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchFloors();
  }, [selectedPropertyId, currentPage]);

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

      {/* View Floor Details Modal */}
      {viewFloor && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 px-4 py-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-layers-fill" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">Floor Details</h5>
                    <p className="text-muted small mb-0">{viewFloor.property?.propertyName} - {viewFloor.floorName || `Floor ${viewFloor.floorNumber}`}</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setViewFloor(null)}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="row g-4">
                  {/* Floor Structure */}
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-light bg-opacity-50 h-100">
                      <h6 className="fw-bold text-dark mb-3"><i className="bi bi-building text-primary me-2"></i>Spatial Information</h6>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small fw-bold">Total Capacity</span>
                          <span className="fw-bold text-dark">{viewFloor.totalSft ? viewFloor.totalSft.toLocaleString() : 0} SFT</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small fw-bold">Occupied Space</span>
                          <span className="fw-bold text-dark">{viewFloor.occupiedSft ? viewFloor.occupiedSft.toLocaleString() : 0} SFT</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small fw-bold">Available Space</span>
                          <span className="fw-bold text-success">{viewFloor.availableSft ? viewFloor.availableSft.toLocaleString() : 0} SFT</span>
                        </div>
                        <div className="d-flex justify-content-between pt-2 border-top mt-1">
                          <span className="text-muted small fw-bold">Total Units</span>
                          <span className="fw-bold text-dark">{viewFloor.totalUnits || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-light bg-opacity-50 h-100">
                      <h6 className="fw-bold text-dark mb-3"><i className="bi bi-person-badge text-primary me-2"></i>Owner / Admin Information</h6>
                      {viewFloor.assignedOwner || viewFloor.assignedAdmin ? (
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small fw-bold">Full Name</span>
                            <span className="fw-bold text-dark text-end">{viewFloor.assignedOwner ? viewFloor.assignedOwner.ownerName : viewFloor.assignedAdmin?.name}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small fw-bold">Email Address</span>
                            <span className="fw-bold text-dark text-end">{viewFloor.assignedOwner?.emailId || viewFloor.assignedAdmin?.email || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small fw-bold">Phone Number</span>
                            <span className="fw-bold text-dark text-end">{viewFloor.assignedOwner?.contactNumber || viewFloor.assignedAdmin?.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small fw-bold">Emergency Contact</span>
                            <span className="fw-bold text-dark text-end">{viewFloor.assignedOwner?.alternateNumber || viewFloor.assignedAdmin?.emergencyNumber || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small fw-bold">Address</span>
                            <span className="fw-bold text-dark text-end" style={{ maxWidth: '60%', textAlign: 'right' }}>{viewFloor.assignedOwner?.address || viewFloor.assignedAdmin?.address || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between pt-2 border-top mt-1">
                            <span className="text-muted small fw-bold">Generated Revenue</span>
                            <span className="fw-bold text-success text-end">₹{viewFloor.floorRevenue ? viewFloor.floorRevenue.toLocaleString() : 0}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center py-3">
                          <i className="bi bi-person-x text-muted mb-2" style={{ fontSize: '1.5rem' }}></i>
                          <span className="text-muted small fw-bold">No Owner/Admin Assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-2 d-flex flex-column flex-grow-1" style={{ borderRadius: '8px', padding: '10px 10px', border: '1px solid #e0e0e0', margin: '0', overflow: 'hidden' }}>
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
                            <i className="bi bi-pencil-square" style={{ fontSize: '1.1rem', color: '#014aad' }}></i>
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
    </div>
  );
}
