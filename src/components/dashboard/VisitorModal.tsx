"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function VisitorModal({ isOpen, onClose, onSave, editData, mode }: VisitorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorContactNumber: "",
    address: "",
    placeOfVisit: "",
    purposeOfVisit: "",
    idParticulars: "",
    vehicleNumber: "",
    inTime: "",
    outTime: "",
    status: "IN"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ ...editData });
      } else {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        setFormData({
          visitorName: "",
          visitorContactNumber: "",
          address: "",
          placeOfVisit: "",
          purposeOfVisit: "",
          idParticulars: "",
          vehicleNumber: "",
          inTime: timeStr,
          outTime: "",
          status: "IN"
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
    
    // Automatically set outTime if status is changed to Checked Out
    let finalData = { ...formData };
    if (finalData.status === "OUT" && !finalData.outTime) {
        finalData.outTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    onSave(finalData);
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
              {mode === 'create' ? 'Add New Visitor' : mode === 'edit' ? 'Edit Visitor Details' : 'View Visitor Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Personal Information</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Visitor Name</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.visitorName} onChange={(e) => setFormData({...formData, visitorName: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Contact No</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.visitorContactNumber} onChange={(e) => setFormData({...formData, visitorContactNumber: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Address</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">ID Particulars</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly} placeholder="Aadhar / PAN / Driving License"
                    value={formData.idParticulars} onChange={(e) => setFormData({...formData, idParticulars: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Vehicle No (Optional)</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.vehicleNumber} onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Visit Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Place of Visit</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.placeOfVisit} onChange={(e) => setFormData({...formData, placeOfVisit: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Purpose of Visit</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.purposeOfVisit} onChange={(e) => setFormData({...formData, purposeOfVisit: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">In-time</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.inTime} onChange={(e) => setFormData({...formData, inTime: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Out-time</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.outTime} onChange={(e) => setFormData({...formData, outTime: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Status</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="IN">Inside</option>
                    <option value="OUT">Checked Out</option>
                  </select>
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
                  {mode === 'create' ? 'Register Visitor' : 'Update Visitor'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
