"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";

export default function UnitModal({ isOpen, onClose, onSave, editData }: any) {
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    property: "",
    floor: "",
    floorNumber: "",
    unitNumber: "",
    unitName: "",
    sqft: "",
    unitType: "Standard",
    unitStatus: "Available"
  });

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
      if (editData) {
        setFormData({
          property: editData.property?._id || editData.property || "",
          floor: editData.floor?._id || editData.floor || "",
          floorNumber: editData.floorNumber || "",
          unitNumber: editData.unitNumber || "",
          unitName: editData.unitName || "",
          sqft: editData.sqft || "",
          unitType: editData.unitType || "Standard",
          unitStatus: editData.unitStatus || "Available"
        });
        if (editData.property?._id || editData.property) {
          fetchFloors(editData.property?._id || editData.property);
        }
      } else {
        setFormData({
          property: "", floor: "", floorNumber: "", unitNumber: "", unitName: "",
          sqft: "", unitType: "Standard", unitStatus: "Available"
        });
        setFloors([]);
      }
    }
  }, [editData, isOpen]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) setProperties(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchFloors = async (propertyId: string) => {
    try {
      const response = await api.get(`/floors?property=${propertyId}`);
      if (response.success) setFloors(response.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === "property") {
      fetchFloors(value);
      setFormData(prev => ({ ...prev, [name]: value, floor: "", floorNumber: "" }));
    } else if (name === "floor") {
      const selectedF = floors.find(f => f._id === value);
      setFormData(prev => ({ ...prev, [name]: value, floorNumber: selectedF ? selectedF.floorNumber : "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const selectedProperty = properties.find(p => p._id === formData.property);
  const selectedFloor = floors.find(f => f._id === formData.floor);
  
  const unitSqft = Number(formData.sqft) || 0;
  
  // Base available is the backend available, but if editing, add back current unit's sqft
  const originalUnitSqft = editData ? (editData.sqft || 0) : 0;
  const isSameFloor = editData && formData.floor === (editData.floor?._id || editData.floor);
  
  const floorTotalSft = selectedFloor?.totalSft || 0;
  
  const allocatedFloorSft = selectedFloor
    ? (selectedFloor.occupiedSft || 0) - (isSameFloor ? originalUnitSqft : 0)
    : 0;

  const trueAvailableFloorSft = Math.max(floorTotalSft - allocatedFloorSft, 0);

  const remainingFloorSft = trueAvailableFloorSft - unitSqft;
  const occupancyPercentage = floorTotalSft > 0 ? Math.round(((allocatedFloorSft + unitSqft) / floorTotalSft) * 100) : 0;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (selectedFloor && unitSqft > trueAvailableFloorSft) {
      alert(`Unit SFT (${unitSqft}) cannot exceed Available Floor SFT (${trueAvailableFloorSft}).`);
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header bg-light border-0 px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-door-open-fill" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">{editData ? 'Edit Unit Details' : 'Add New Unit'}</h5>
                <p className="text-muted small mb-0">Configure unit size and floor allocation</p>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <form onSubmit={handleSubmit}>
              
              {/* Property Information Section */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3"><i className="bi bi-building text-primary me-2"></i>Property Information</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold small text-muted">Select Property <span className="text-danger">*</span></label>
                    <select className="form-select border-light-subtle shadow-sm" name="property" value={formData.property} onChange={handleChange} required disabled={!!editData}>
                      <option value="">Select Property</option>
                      {properties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
                    </select>
                  </div>
                </div>

                {selectedProperty && (
                  <div className="d-flex flex-wrap gap-3 mt-3 p-3 bg-light rounded-3 border border-light-subtle">
                    <div className="flex-fill">
                      <div className="text-muted small fw-bold">Total Property SFT</div>
                      <div className="fw-bold fs-5 text-dark">{selectedProperty.totalSft?.toLocaleString() || 0}</div>
                    </div>
                    <div className="flex-fill border-start ps-3">
                      <div className="text-muted small fw-bold">Total Floors</div>
                      <div className="fw-bold fs-5 text-dark">{selectedProperty.totalFloors || 0}</div>
                    </div>
                    <div className="flex-fill border-start ps-3">
                      <div className="text-muted small fw-bold">Occupied SFT</div>
                      <div className="fw-bold fs-5 text-warning">{selectedProperty.occupiedSft?.toLocaleString() || 0}</div>
                    </div>
                    <div className="flex-fill border-start ps-3">
                      <div className="text-muted small fw-bold">Available SFT</div>
                      <div className="fw-bold fs-5 text-success">{selectedProperty.availableSft?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Floor Information Section */}
              <div className="mb-4 pt-2 border-top">
                <h6 className="fw-bold text-dark mb-3 mt-3"><i className="bi bi-layers-fill text-primary me-2"></i>Floor Information</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold small text-muted">Select Floor <span className="text-danger">*</span></label>
                    <select className="form-select border-light-subtle shadow-sm" name="floor" value={formData.floor} onChange={handleChange} required disabled={!formData.property || !!editData}>
                      <option value="">Select Floor</option>
                      {floors.map(f => <option key={f._id} value={f._id}>{f.floorName || `Floor ${f.floorNumber}`}</option>)}
                    </select>
                  </div>
                </div>

                {selectedFloor && (
                  <div className="d-flex flex-wrap gap-3 mt-3 p-3 bg-light rounded-3 border border-light-subtle">
                    <div className="flex-fill">
                      <div className="text-muted small fw-bold">Floor Total SFT</div>
                      <div className="fw-bold fs-5 text-dark">{floorTotalSft.toLocaleString()}</div>
                    </div>
                    <div className="flex-fill border-start ps-3">
                      <div className="text-muted small fw-bold">Allocated SFT</div>
                      <div className="fw-bold fs-5 text-primary">{allocatedFloorSft.toLocaleString()}</div>
                    </div>
                    <div className="flex-fill border-start ps-3">
                      <div className="text-muted small fw-bold">Remaining Floor SFT</div>
                      <div className="fw-bold fs-5 text-success">{trueAvailableFloorSft.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Unit Details Section */}
              <div className="mb-4 pt-2 border-top">
                <h6 className="fw-bold text-dark mb-3 mt-3"><i className="bi bi-ui-checks-grid text-primary me-2"></i>Unit Details</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Unit Number <span className="text-danger">*</span></label>
                    <input type="text" className="form-control border-light-subtle shadow-sm" name="unitNumber" value={formData.unitNumber} onChange={handleChange} placeholder="e.g., 501" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Unit Name (Optional)</label>
                    <input type="text" className="form-control border-light-subtle shadow-sm" name="unitName" value={formData.unitName} onChange={handleChange} placeholder="e.g., Office 501" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Unit Type</label>
                    <select className="form-select border-light-subtle shadow-sm" name="unitType" value={formData.unitType} onChange={handleChange}>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Cabin">Cabin</option>
                      <option value="Retail">Retail</option>
                      <option value="Shared Workspace">Shared Workspace</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Status</label>
                    <select className="form-select border-light-subtle shadow-sm" name="unitStatus" value={formData.unitStatus} onChange={handleChange}>
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">SFT <span className="text-danger">*</span></label>
                    <div className="input-group shadow-sm">
                      <input 
                        type="number" 
                        className={`form-control border-light-subtle ${unitSqft > trueAvailableFloorSft ? 'is-invalid' : ''}`} 
                        name="sqft" 
                        value={formData.sqft} 
                        onChange={handleChange} 
                        placeholder="Enter Unit Area in SFT" 
                        min="0"
                        required 
                      />
                      <span className="input-group-text bg-light text-muted">SFT</span>
                    </div>
                    {unitSqft > trueAvailableFloorSft && (
                      <div className="text-danger small mt-1 fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Exceeds available floor space!
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Remaining Floor SFT</label>
                    <div className="input-group shadow-sm">
                      <input 
                        type="text" 
                        className={`form-control border-light-subtle bg-light fw-bold ${remainingFloorSft < 0 ? 'text-danger' : 'text-muted'}`} 
                        value={remainingFloorSft.toLocaleString()} 
                        readOnly 
                      />
                      <span className="input-group-text bg-light text-muted">SFT</span>
                    </div>
                  </div>
                  
                  {selectedFloor && (
                    <div className="col-12 mt-3">
                      <label className="form-label fw-bold small text-muted d-flex justify-content-between">
                        <span>Floor Occupancy</span>
                        <span>{occupancyPercentage > 100 ? 100 : occupancyPercentage}%</span>
                      </label>
                      <div className="progress shadow-sm" style={{ height: '8px' }}>
                        <div 
                          className={`progress-bar ${occupancyPercentage > 90 ? 'bg-danger' : occupancyPercentage > 75 ? 'bg-warning' : 'bg-primary'}`}
                          role="progressbar" 
                          style={{ width: `${occupancyPercentage > 100 ? 100 : occupancyPercentage}%` }} 
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top position-sticky bottom-0 bg-white" style={{ zIndex: 10 }}>
                <button type="button" className="btn btn-light border-light-subtle rounded-pill px-4 fw-bold shadow-sm" onClick={onClose}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2" 
                  style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}
                  disabled={unitSqft > trueAvailableFloorSft || !formData.floor}
                >
                  <i className={editData ? "bi bi-check-circle" : "bi bi-plus-circle"}></i> 
                  {editData ? 'Update Unit' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
