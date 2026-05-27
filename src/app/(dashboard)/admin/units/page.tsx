"use client";
import { useState, useEffect } from "react";
import UnitModal from "@/components/dashboard/UnitModal";
import { api } from "@/utils/api";

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);

  // Filters & Pagination
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedFloorId, setSelectedFloorId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUnits();
    fetchProperties();
    fetchFloors();
  }, []);

  const fetchFloors = async () => {
    try {
      const response = await api.get('/floors?limit=100');
      if (response.success) setFloors(response.data);
    } catch (err) {
      console.error("Error fetching floors:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      if (response.success) setUnits(response.data);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) setProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const handleSaveUnit = async (data: any) => {
    try {
      if (editUnit) {
        await api.put(`/units/${editUnit._id}`, data);
      } else {
        await api.post('/units', data);
      }
      fetchUnits();
    } catch (err) {
      console.error("Error saving unit:", err);
    }
    setIsModalOpen(false);
    setEditUnit(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this unit?")) {
      try {
        await api.delete(`/units/${id}`);
        fetchUnits();
      } catch (err) {
        console.error("Error deleting unit:", err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Occupied': return 'primary';
      case 'Reserved': return 'warning';
      case 'Maintenance': return 'danger';
      case 'Under Maintenance': return 'danger';
      default: return 'secondary';
    }
  };

  // Filter Logic
  const filteredUnits = units.filter(u => {
    const matchProperty = selectedPropertyId === "all" || (u.property && u.property._id === selectedPropertyId);
    const matchFloor = selectedFloorId === "all" || (u.floor && u.floor._id === selectedFloorId);
    const matchStatus = selectedStatus === "all" || u.unitStatus === selectedStatus;
    const searchString = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || 
      (u.unitNumber && u.unitNumber.toString().toLowerCase().includes(searchString)) ||
      (u.unitName && u.unitName.toLowerCase().includes(searchString)) ||
      (u.unitType && u.unitType.toLowerCase().includes(searchString));
      
    return matchProperty && matchFloor && matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage) || 1;
  const paginatedUnits = filteredUnits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract available floors from the floors state based on selected property
  const availableFloors = floors.filter(f => f.property === selectedPropertyId || (f.property && f.property._id === selectedPropertyId));

  return (
    <div className="p-0 p-md-0 d-flex flex-column" style={{ backgroundColor: '#ffffff', height: 'calc(100vh - 120px)', overflow: 'hidden', fontFamily: 'var(--font-geist-sans)' }}>
      <UnitModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditUnit(null); }} 
        onSave={handleSaveUnit} 
        editData={editUnit}
      />
      
      <div className="bg-white border-2 d-flex flex-column flex-grow-1" style={{ borderRadius: '8px', padding: '10px 10px', border: '1px solid #e0e0e0', margin: '0', overflow: 'hidden' }}>
        {/* Header & Filter Bar Merged */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 pt-0 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
          {/* Left: Tab Headers */}
          <div className="d-flex w-100 position-absolute" style={{ bottom: '0', left: '0', zIndex: -1, borderColor: '#e0e0e0' }}></div>
          <div className="d-flex gap-4">
            <div style={{ paddingBottom: '8px', cursor: 'pointer', marginBottom: '-1px' }}>
              <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>Units & Flats</span>
            </div>
          </div>

          {/* Right: Filters & Add Button */}
          <div className="d-flex gap-3 align-items-center">
            
            {/* Search Bar */}
            <div className="input-group shadow-sm" style={{ width: '220px', borderRadius: '4px', overflow: 'hidden' }}>
              <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#e0e0e0' }}>
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search unit..." 
                style={{ borderColor: '#e0e0e0', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div style={{ width: '180px' }}>
              <select className="form-select px-3 py-2 shadow-sm" style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }} value={selectedPropertyId} onChange={(e) => { setSelectedPropertyId(e.target.value); setSelectedFloorId("all"); setCurrentPage(1); }}>
                <option value="all">All Properties</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
              </select>
            </div>
            
            {selectedPropertyId !== "all" && (
              <div style={{ width: '150px' }}>
                <select className="form-select px-3 py-2 shadow-sm" style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }} value={selectedFloorId} onChange={(e) => { setSelectedFloorId(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Floors</option>
                  {availableFloors.map((f: any) => <option key={f._id} value={f._id}>{f.floorNumber || `Floor ${f.floorNumber}`}</option>)}
                </select>
              </div>
            )}
            
            <div style={{ width: '150px' }}>
              <select className="form-select px-3 py-2 shadow-sm" style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }} value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <button
              className="btn d-flex align-items-center justify-content-center gap-2 shadow-sm px-4"
              onClick={() => { setEditUnit(null); setIsModalOpen(true); }}
              style={{ backgroundColor: "#014aad", color: '#ffffff', fontWeight: '500', borderRadius: '4px', height: '40px', fontSize: '0.85rem', border: 'none' }}
            >
              <i className="bi bi-plus-circle"></i> Add Unit
            </button>
          </div>
        </div>

        {/* Table Wrapper (Scrolling) */}
        <div className="table-responsive flex-grow-1" style={{ overflowY: 'auto', minHeight: 0 }}>
          <table className="table mb-0 border-0 text-nowrap" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
            <thead>
              <tr className="border-0">
                <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopLeftRadius: '8px' }}>S No</th>
                <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Unit Details</th>
                <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Property / Floor</th>
                <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Tenant</th>
                <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Status</th>
                <th className="py-3 px-4 fw-bold text-center" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopRightRadius: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUnits.length > 0 ? (
                paginatedUnits.map((unit, index) => (
                  <tr key={unit._id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                      {String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, '0')}
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-door-open-fill"></i>
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Unit {unit.unitNumber}</div>
                            <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.65rem' }}>{unit.sqft ? unit.sqft.toLocaleString() : 0} SFT</span>
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{unit.unitName || unit.unitType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{unit.property?.propertyName || 'N/A'}</div>
                      <span className="badge bg-light text-muted border rounded-pill px-2 py-1 mt-1" style={{ fontSize: '0.7rem' }}>Floor {unit.floor?.floorNumber || unit.floorNumber}</span>
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', border: 'none' }}>
                      {unit.tenant ? (
                        <span className="fw-bold text-dark"><i className="bi bi-person me-1"></i> {unit.tenant.tenantName}</span>
                      ) : (
                        <span className="text-muted small">No Tenant</span>
                      )}
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                      <span className={`badge bg-${getStatusColor(unit.unitStatus)} bg-opacity-10 text-${getStatusColor(unit.unitStatus)} rounded-pill px-3 py-1 border border-${getStatusColor(unit.unitStatus)} border-opacity-25`} style={{ fontSize: '0.75rem' }}>
                        {unit.unitStatus}
                      </span>
                    </td>
                    <td className="py-2 px-4 align-middle text-center" style={{ border: 'none' }}>
                      <div className="d-flex gap-2 justify-content-center align-items-center">
                        <button className="btn btn-link text-dark p-0" title="Edit Unit" onClick={() => { setEditUnit(unit); setIsModalOpen(true); }}>
                          <i className="bi bi-pencil-square" style={{ fontSize: '1.1rem', color: '#014aad' }}></i>
                        </button>
                        <button className="btn btn-link text-danger p-0" title="Delete Unit" onClick={() => handleDelete(unit._id)}>
                          <i className="bi bi-trash-fill" style={{ fontSize: '1.1rem' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center gap-3 py-4">
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-door-open text-muted" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                      <div className="text-center">
                        <h5 className="fw-bold mb-1">No Units Found</h5>
                        <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                          No units match the selected filters.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredUnits.length > 0 && (
          <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2 flex-shrink-0">
            <span className="text-muted small">
              Page {currentPage} of {totalPages}
            </span>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left small"></i> Previous
              </button>
              <button 
                className="btn btn-outline-secondary rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <i className="bi bi-chevron-right small"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
