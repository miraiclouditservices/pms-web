"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: any) => void;
  floorLevel: string;
  editData?: any;
}

export default function UnitModal({ isOpen, onClose, onSave, floorLevel, editData }: UnitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    unitNumber: "",
    count: 5,
    unitStatus: "Occupied",
    unitType: "Office",
    ownerName: "",
    sqft: 1200
  });

  useEffect(() => {
    if (isOpen) {
        fetchOwners();
    }
  }, [isOpen]);

  const fetchOwners = async () => {
    try {
        const response = await api.get('/owners');
        if (response.success) {
            setOwners(response.data);
        }
    } catch (err) {
        console.error("Failed to fetch owners:", err);
    }
  };

  useEffect(() => {
    if (editData) {
      setFormData({
        unitNumber: editData.unitNumber || editData.id || "",
        count: 1,
        unitStatus: editData.unitStatus || editData.status || "Occupied",
        unitType: editData.unitType || editData.type || "Office",
        ownerName: editData.ownerName || editData.owner || "",
        sqft: editData.sqft || 1200
      });
      setIsBulkMode(false);
    } else {
      setFormData({
        unitNumber: "",
        count: 5,
        unitStatus: "Occupied",
        unitType: "Office",
        ownerName: "",
        sqft: 1200
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (isBulkMode) {
      const prefix = formData.unitNumber;
      for (let i = 1; i <= formData.count; i++) {
        onSave({ ...formData, unitNumber: `${prefix}-${i}` });
      }
    } else {
      onSave(formData);
    }
    
    setIsSubmitting(false);
    onClose();
    
    setFormData({
      unitNumber: "",
      count: 5,
      unitStatus: "Occupied",
      unitType: "Office",
      ownerName: "",
      sqft: 1200
    });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
    }}>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      
      <div className="modal-dialog modal-md w-100 mx-3" style={{ maxWidth: '500px', animation: 'slideUp 0.3s ease-out' }}>
        <div className="modal-content border-0 rounded-xl shadow-2xl overflow-hidden bg-white">
          <div className="modal-header border-bottom-0 p-4 bg-light d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold fs-4">{editData ? 'Edit Unit Assignment' : 'Add Units'}</h5>
              <p className="text-muted small mb-0">{floorLevel} · Space Allocation</p>
            </div>
            {!editData && (
              <div className="form-check form-switch me-3">
                <input 
                  className="form-check-input" type="checkbox" role="switch" 
                  checked={isBulkMode} onChange={(e) => setIsBulkMode(e.target.checked)} 
                />
                <label className="form-check-label x-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>Bulk Mode</label>
              </div>
            )}
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="row g-4">
                <div className={isBulkMode ? "col-md-8" : "col-md-4"}>
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">
                    {isBulkMode ? "Unit Prefix" : "Unit ID"}
                  </label>
                  <input 
                    type="text" className="form-control form-control-lg bg-light border-0" required 
                    value={formData.unitNumber} onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
                    placeholder={isBulkMode ? "e.g. 50" : "e.g. 505"}
                  />
                </div>
                {isBulkMode && (
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-2">Count</label>
                    <input 
                      type="number" className="form-control form-control-lg bg-light border-0" required 
                      min="1" max="50" value={formData.count}
                      onChange={(e) => setFormData({...formData, count: parseInt(e.target.value) || 1})}
                    />
                  </div>
                )}
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Sq. Ft.</label>
                  <input 
                    type="number" className="form-control form-control-lg bg-light border-0" required 
                    value={formData.sqft} onChange={(e) => setFormData({...formData, sqft: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Status</label>
                  <select 
                    className="form-select form-select-lg bg-light border-0"
                    value={formData.unitStatus} onChange={(e) => setFormData({...formData, unitStatus: e.target.value})}
                  >
                    <option value="Occupied">Occupied</option>
                    <option value="Vacant">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Unit Type</label>
                  <select 
                    className="form-select form-select-lg bg-light border-0"
                    value={formData.unitType} onChange={(e) => setFormData({...formData, unitType: e.target.value})}
                  >
                    <option value="Office">Office Space</option>
                    <option value="Commercial">Commercial</option>
                    <option value="IT">IT / Server Room</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Occupant / Owner</label>
                  <select 
                    className="form-select form-select-lg bg-light border-0"
                    value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    style={{ fontSize: '1rem' }}
                  >
                    <option value="">Select Registered Owner</option>
                    {owners.map(o => (
                        <option key={o._id} value={o.ownerName}>{o.ownerName} ({o.contactNumber})</option>
                    ))}
                    <option value="Direct Tenant">Direct Tenant / Others</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer border-top-0 p-4 pt-0 d-flex gap-3">
              <button 
                type="button" className="btn btn-light btn-lg rounded-pill px-5 flex-grow-1 fw-bold text-muted" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button 
                type="submit" className="btn btn-primary btn-lg rounded-pill px-5 flex-grow-1 fw-bold shadow-lg"
                disabled={isSubmitting} style={{ fontSize: '0.9rem', backgroundColor: '#10B981', border: 'none' }}
              >
                {isSubmitting ? "Processing..." : "Add Unit(s)"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
