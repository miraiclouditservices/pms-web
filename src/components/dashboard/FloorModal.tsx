"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

const FIELD_STYLE: React.CSSProperties = {
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.88rem",
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  backgroundColor: "#fff",
  color: "#111827",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

export default function FloorModal({ isOpen, onClose, onSave, editData }: any) {
  const [properties, setProperties] = useState<any[]>([]);
  const [existingFloors, setExistingFloors] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    property: "",
    floorNumber: "",
    floorName: "",
    totalSft: "",
    status: "Active",
    assignedAdmin: "",
    assignedOwner: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
      fetchAdmins();
      fetchOwners();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setFormData({
        property: editData.property?._id || editData.property || "",
        floorNumber: editData.floorNumber || "",
        floorName: editData.floorName || "",
        totalSft: editData.totalSft || "",
        status: editData.status || "Active",
        assignedAdmin: editData.assignedAdmin?._id || editData.assignedAdmin || "",
        assignedOwner: editData.assignedOwner?._id || editData.assignedOwner || ""
      });
    } else {
      setFormData({ property: "", floorNumber: "", floorName: "", totalSft: "", status: "Active", assignedAdmin: "", assignedOwner: "" });
    }
  }, [editData, isOpen]);

  useEffect(() => {
    if (isOpen && formData.property) {
      fetchPropertyFloors(formData.property);
    } else {
      setExistingFloors([]);
    }
  }, [formData.property, isOpen]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) setProperties(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/users/list');
      if (response.success && response.data) {
        setAdmins(response.data.filter((u: any) => u.role === 'FLOOR_ADMIN'));
      }
    } catch (err) { console.error(err); }
  };

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owners');
      if (response.success && response.data) {
        setOwners(response.data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchPropertyFloors = async (propertyId: string) => {
    try {
      const response = await api.get(`/floors?property=${propertyId}&limit=100`);
      if (response.success && response.data) {
        setExistingFloors(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedProperty = properties.find(p => p._id === formData.property);
  const floorSft = Number(formData.totalSft) || 0;
  
  const otherFloorsSft = existingFloors
    .filter(f => !editData || f._id !== editData._id)
    .reduce((sum, f) => sum + (f.totalSft || 0), 0);
  
  const trueAvailablePropertySft = selectedProperty 
    ? Math.max(0, (selectedProperty.totalSft || 0) - otherFloorsSft)
    : 0;
    
  const remainingSft = trueAvailablePropertySft - floorSft;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submitData = { ...formData };
    if (submitData.assignedAdmin === "") submitData.assignedAdmin = null as any;
    if (submitData.assignedOwner === "") submitData.assignedOwner = null as any;
    
    await onSave(submitData);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div className="bg-white rounded-3 shadow-lg overflow-hidden w-100 mx-3" style={{ maxWidth: '800px' }}>
        {/* Dark Header */}
        <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#2d3748' }}>
          <h6 className="fw-bold mb-0 text-white" style={{ fontSize: '1rem' }}>
            {editData ? "Edit Floor Configuration" : "Add New Floor"}
          </h6>
          <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} style={{ fontSize: '0.8rem' }}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            
            {/* Property Information Section */}
            <div className="mb-4">
              <span className="fw-bold text-dark d-block mb-3" style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-building text-primary me-2"></i>Property Information
              </span>
              <div className="row g-3">
                <div className="col-12">
                  <label style={LABEL_STYLE}>Select Property *</label>
                  <select name="property" value={formData.property} onChange={handleChange} required disabled={!!editData} style={FIELD_STYLE}>
                    <option value="">Select Property...</option>
                    {properties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
                  </select>
                </div>
              </div>

              {selectedProperty && (
                <div className="d-flex flex-wrap gap-3 mt-3 p-3 bg-light rounded border">
                  <div className="flex-fill">
                    <div className="text-muted small fw-bold" style={{ fontSize: '0.72rem' }}>Total Property SFT</div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{selectedProperty.totalSft?.toLocaleString() || 0} SFT</div>
                  </div>
                  <div className="flex-fill border-start ps-3">
                    <div className="text-muted small fw-bold" style={{ fontSize: '0.72rem' }}>Floor-Allocated SFT</div>
                    <div className="fw-bold text-warning" style={{ fontSize: '0.88rem' }}>{(otherFloorsSft + floorSft).toLocaleString()} SFT</div>
                  </div>
                  <div className="flex-fill border-start ps-3">
                    <div className="text-muted small fw-bold" style={{ fontSize: '0.72rem' }}>Available SFT</div>
                    <div className="fw-bold text-success" style={{ fontSize: '0.88rem' }}>{(remainingSft < 0 ? 0 : remainingSft).toLocaleString()} SFT</div>
                  </div>
                </div>
              )}
            </div>

            {/* Floor Details Section */}
            <div className="mb-4">
              <span className="fw-bold text-dark d-block mb-3" style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-ui-checks-grid text-primary me-2"></i>Floor Details
              </span>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={LABEL_STYLE}>Floor Number *</label>
                  <input type="text" name="floorNumber" value={formData.floorNumber} onChange={handleChange} placeholder="e.g., 5" required style={FIELD_STYLE} />
                </div>
                <div className="col-md-6">
                  <label style={LABEL_STYLE}>Floor Name (Optional)</label>
                  <input type="text" name="floorName" value={formData.floorName} onChange={handleChange} placeholder="e.g., Fifth Floor" style={FIELD_STYLE} />
                </div>
                
                <div className="col-md-6">
                  <label style={LABEL_STYLE}>Capacity (SFT) *</label>
                  <input 
                    type="number" 
                    name="totalSft" 
                    value={formData.totalSft} 
                    onChange={handleChange} 
                    placeholder="Enter Capacity" 
                    min="0"
                    required 
                    style={FIELD_STYLE}
                  />
                  {floorSft > 0 && floorSft > trueAvailablePropertySft && (
                    <div className="text-danger small mt-1 fw-bold">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      Exceeds available property space!
                    </div>
                  )}
                </div>
                
                <div className="col-md-6">
                  <label style={LABEL_STYLE}>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} style={FIELD_STYLE}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label style={LABEL_STYLE}><i className="bi bi-person-badge-fill text-primary me-2"></i>Assign Floor Admin</label>
                  <select name="assignedAdmin" value={formData.assignedAdmin} onChange={handleChange} style={FIELD_STYLE}>
                    <option value="">-- Unassigned --</option>
                    {admins.map(admin => (
                      <option key={admin._id} value={admin._id}>{admin.name} ({admin.email})</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label style={LABEL_STYLE}><i className="bi bi-person-fill text-warning me-2"></i>Assign Floor Owner</label>
                  <select name="assignedOwner" value={formData.assignedOwner} onChange={handleChange} style={FIELD_STYLE}>
                    <option value="">-- Unassigned --</option>
                    {owners.map(owner => (
                      <option key={owner._id} value={owner._id}>{owner.ownerName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 border-top d-flex gap-2 justify-content-end bg-light">
            <button type="button" className="btn btn-sm btn-outline-secondary fw-bold px-3 py-2" onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem', borderRadius: '4px' }}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-sm fw-bold text-white px-4 py-2" 
              disabled={isSubmitting}
              style={{ fontSize: '0.85rem', borderRadius: '4px', backgroundColor: '#014aad' }}
            >
              {isSubmitting ? "Saving..." : (editData ? 'Update Floor' : 'Create Floor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
