"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";

export default function FloorModal({ isOpen, onClose, onSave, editData }: any) {
  const [properties, setProperties] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    property: "",
    floorNumber: "",
    floorName: "",
    totalSft: "",
    status: "Active"
  });

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setFormData({
        property: editData.property?._id || editData.property || "",
        floorNumber: editData.floorNumber || "",
        floorName: editData.floorName || "",
        totalSft: editData.totalSft || "",
        status: editData.status || "Active"
      });
    } else {
      setFormData({ property: "", floorNumber: "", floorName: "", totalSft: "", status: "Active" });
    }
  }, [editData, isOpen]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) setProperties(response.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedProperty = properties.find(p => p._id === formData.property);
  const floorSft = Number(formData.totalSft) || 0;
  
  // Available SFT needs to account for the current floor's SFT if we are editing
  const baseAvailableSft = selectedProperty?.availableSft || 0;
  const originalFloorSft = editData ? (editData.totalSft || 0) : 0;
  
  // If we are editing, the actual available SFT includes the SFT currently assigned to this floor
  const trueAvailablePropertySft = (editData && formData.property === (editData.property?._id || editData.property)) 
    ? baseAvailableSft + originalFloorSft 
    : baseAvailableSft;
    
  const remainingSft = trueAvailablePropertySft - floorSft;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (selectedProperty && floorSft > trueAvailablePropertySft) {
      alert(`Floor SFT (${floorSft}) cannot exceed Available Property SFT (${trueAvailablePropertySft}).`);
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
                <i className="bi bi-layers-fill" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">{editData ? 'Edit Floor' : 'Create New Floor'}</h5>
                <p className="text-muted small mb-0">Configure floor details and space allocation</p>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-white">
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
                      <div className="text-muted small fw-bold">Occupied SFT</div>
                      <div className="fw-bold fs-5 text-warning">{selectedProperty.occupiedSft?.toLocaleString() || 0}</div>
                    </div>
                    <div className="flex-fill border-start ps-3">
                      <div className="text-muted small fw-bold">Available SFT</div>
                      <div className="fw-bold fs-5 text-success">{trueAvailablePropertySft.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Floor Details Section */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3"><i className="bi bi-ui-checks-grid text-primary me-2"></i>Floor Details</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Floor Number <span className="text-danger">*</span></label>
                    <input type="text" className="form-control border-light-subtle shadow-sm" name="floorNumber" value={formData.floorNumber} onChange={handleChange} placeholder="e.g., 5" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Floor Name (Optional)</label>
                    <input type="text" className="form-control border-light-subtle shadow-sm" name="floorName" value={formData.floorName} onChange={handleChange} placeholder="e.g., Fifth Floor" />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Floor SFT <span className="text-danger">*</span></label>
                    <div className="input-group shadow-sm">
                      <input 
                        type="number" 
                        className={`form-control border-light-subtle ${floorSft > trueAvailablePropertySft ? 'is-invalid' : ''}`} 
                        name="totalSft" 
                        value={formData.totalSft} 
                        onChange={handleChange} 
                        placeholder="Enter Floor Area in SFT" 
                        min="0"
                        required 
                      />
                      <span className="input-group-text bg-light text-muted">SFT</span>
                    </div>
                    {floorSft > trueAvailablePropertySft && (
                      <div className="text-danger small mt-1 fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Exceeds available property space!
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Remaining SFT (Auto Calculated)</label>
                    <div className="input-group shadow-sm">
                      <input 
                        type="text" 
                        className="form-control border-light-subtle bg-light text-muted fw-bold" 
                        value={remainingSft < 0 ? "0" : remainingSft.toLocaleString()} 
                        readOnly 
                      />
                      <span className="input-group-text bg-light text-muted">SFT</span>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Status</label>
                    <select className="form-select border-light-subtle shadow-sm" name="status" value={formData.status} onChange={handleChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="d-flex justify-content-end gap-3 mt-4 pt-4 border-top">
                <button type="button" className="btn btn-light border-light-subtle rounded-pill px-4 fw-bold shadow-sm" onClick={onClose}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2" 
                  style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}
                  disabled={floorSft > trueAvailablePropertySft}
                >
                  <i className={editData ? "bi bi-check-circle" : "bi bi-plus-circle"}></i> 
                  {editData ? 'Update Floor' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
