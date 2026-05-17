"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface HelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function HelpdeskModal({ isOpen, onClose, onSave, editData, mode }: HelpdeskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ticketNumber: "",
    natureOfComplaint: "",
    complaintDescription: "",
    dateOfComplaint: "",
    timeOfComplaint: "",
    allocatedTo: "",
    escalated: false,
    resolvedDate: "",
    resolvedTime: "",
    productiveHours: "",
    status: "Open"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
          ...editData,
          dateOfComplaint: editData.dateOfComplaint ? new Date(editData.dateOfComplaint).toISOString().split('T')[0] : "",
          resolvedDate: editData.resolvedDate ? new Date(editData.resolvedDate).toISOString().split('T')[0] : "",
          escalated: editData.escalated || false
        });
      } else {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        setFormData({
          ticketNumber: `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          natureOfComplaint: "",
          complaintDescription: "",
          dateOfComplaint: dateStr,
          timeOfComplaint: timeStr,
          allocatedTo: "",
          escalated: false,
          resolvedDate: "",
          resolvedTime: "",
          productiveHours: "",
          status: "Open"
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
    
    let finalData = { ...formData };
    
    if ((finalData.status === "Resolved" || finalData.status === "Closed") && !finalData.resolvedDate) {
      const now = new Date();
      finalData.resolvedDate = now.toISOString().split('T')[0];
      finalData.resolvedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '700px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? 'Raise Support Ticket' : mode === 'edit' ? 'Update Support Ticket' : 'Ticket Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-emerald mb-0" style={{ color: '#10B981' }}>Complaint Information</h6>
                <div className="badge bg-light text-dark border">Ticket No: {formData.ticketNumber}</div>
              </div>
              
              <div className="row g-3 mb-4">
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Nature of Complaint</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.natureOfComplaint} onChange={(e) => setFormData({...formData, natureOfComplaint: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Detailed Description</label>
                  <textarea className="form-control form-control-sm bg-light" rows={3} required disabled={isReadOnly}
                    value={formData.complaintDescription} onChange={(e) => setFormData({...formData, complaintDescription: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Date Reported</label>
                  <input type="date" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.dateOfComplaint} onChange={(e) => setFormData({...formData, dateOfComplaint: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Time Reported</label>
                  <input type="time" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.timeOfComplaint} onChange={(e) => setFormData({...formData, timeOfComplaint: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Allocated To</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.allocatedTo} onChange={(e) => setFormData({...formData, allocatedTo: e.target.value})} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Resolution Details</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Status</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Escalated</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.escalated ? "Yes" : "No"} onChange={(e) => setFormData({...formData, escalated: e.target.value === "Yes"})}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Productive Hours</label>
                  <input type="number" step="0.1" className="form-control form-control-sm bg-light" disabled={isReadOnly} placeholder="e.g. 2.5"
                    value={formData.productiveHours} onChange={(e) => setFormData({...formData, productiveHours: e.target.value})} />
                </div>
                {(formData.status === "Resolved" || formData.status === "Closed") && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Resolved Date</label>
                      <input type="date" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                        value={formData.resolvedDate} onChange={(e) => setFormData({...formData, resolvedDate: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Resolved Time</label>
                      <input type="time" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                        value={formData.resolvedTime} onChange={(e) => setFormData({...formData, resolvedTime: e.target.value})} />
                    </div>
                  </>
                )}
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
                  {mode === 'create' ? 'Raise Ticket' : 'Update Ticket'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
