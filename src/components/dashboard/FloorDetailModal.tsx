"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface FloorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function FloorDetailModal({ isOpen, onClose, onSave, editData, mode }: FloorDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    floor: "",
    unitNumber: "",
    sqft: "",
    carParking: "",
    bikeParking: "",
    ownerName: "",
    ownerContact: "",
    ownerAddress: "",
    leaseHolderName: "",
    leaseHolderContact: "",
    remarks: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ ...editData });
      } else {
        setFormData({
          id: `UNIT${Math.floor(Math.random() * 1000)}`,
          floor: "",
          unitNumber: "",
          sqft: "",
          carParking: "",
          bikeParking: "",
          ownerName: "",
          ownerContact: "",
          ownerAddress: "",
          leaseHolderName: "",
          leaseHolderContact: "",
          remarks: ""
        });
      }
    }
  }, [editData, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  const isReadOnly = mode === "view";

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(2, 44, 34, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s ease-out'
    }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '800px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? 'Add Unit Details' : mode === 'edit' ? 'Edit Unit Details' : 'View Unit Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Unit Information</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Unit ID</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={true}
                    value={formData.id} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Floor</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Unit Number</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.unitNumber} onChange={(e) => setFormData({...formData, unitNumber: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Total Sqft</label>
                  <input type="number" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.sqft} onChange={(e) => setFormData({...formData, sqft: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Car Parking Spots</label>
                  <input type="number" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.carParking} onChange={(e) => setFormData({...formData, carParking: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Bike Parking Spots</label>
                  <input type="number" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.bikeParking} onChange={(e) => setFormData({...formData, bikeParking: e.target.value})} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Owner Details</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Owner Name</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Owner Contact</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.ownerContact} onChange={(e) => setFormData({...formData, ownerContact: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Owner Address</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.ownerAddress} onChange={(e) => setFormData({...formData, ownerAddress: e.target.value})} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Lease Holder Details & Remarks</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Lease Holder Name</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly} placeholder="Leave blank if unleased"
                    value={formData.leaseHolderName} onChange={(e) => setFormData({...formData, leaseHolderName: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Lease Holder Contact</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.leaseHolderContact} onChange={(e) => setFormData({...formData, leaseHolderContact: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Remarks</label>
                  <textarea className="form-control form-control-sm bg-light" rows={2} disabled={isReadOnly}
                    value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})}></textarea>
                </div>
              </div>

            </div>
            
            <div className="modal-footer border-top p-4 d-flex gap-3 bg-light">
              <button 
                type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem' }}
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'view' && (
                <button 
                  type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm text-white border-0"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#10B981', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {mode === 'create' ? 'Save Unit Details' : 'Update Unit Details'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
