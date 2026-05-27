"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function VendorModal({ isOpen, onClose, onSave, editData, mode }: VendorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendorCode: "",
    vendorName: "",
    address: "",
    scopeOfWork: "",
    contactName: "",
    mobileNumber: "",
    emailId: "",
    gstNumber: "",
    status: "Active"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
          vendorCode: editData.vendorCode || "",
          vendorName: editData.vendorName || "",
          address: editData.address || "",
          scopeOfWork: editData.scopeOfWork || "",
          contactName: editData.contactName || "",
          mobileNumber: editData.mobileNumber || "",
          emailId: editData.emailId || "",
          gstNumber: editData.gstNumber || "",
          status: editData.status || "Active",
          ...editData 
        });
      } else {
        setFormData({
          vendorCode: `VND${Math.floor(1000 + Math.random() * 9000)}`,
          vendorName: "",
          address: "",
          scopeOfWork: "",
          contactName: "",
          mobileNumber: "",
          emailId: "",
          gstNumber: "",
          status: "Active"
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
    // Remove dummy timeout for production-ready logic
    try {
      onSave(formData);
    } catch (err) {
      console.error("Error in onSave:", err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
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
              {mode === 'create' ? 'Add New Vendor' : mode === 'edit' ? 'Edit Vendor Details' : 'View Vendor Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              <h6 className="fw-bold text-primary mb-3" style={{ color: '#014aad' }}>Company Information</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Vendor Code</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.vendorCode} onChange={(e) => setFormData({...formData, vendorCode: e.target.value})} />
                </div>
                <div className="col-md-8">
                  <label className="form-label small fw-bold text-muted mb-1">Vendor Name</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.vendorName} onChange={(e) => setFormData({...formData, vendorName: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Address</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Scope of Works</label>
                  <textarea className="form-control form-control-sm bg-light" rows={3} required disabled={isReadOnly}
                    value={formData.scopeOfWork} onChange={(e) => setFormData({...formData, scopeOfWork: e.target.value})}></textarea>
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-primary mb-3" style={{ color: '#014aad' }}>Contact & Status</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Contact Name</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Mobile Number</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.mobileNumber} onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Email ID</label>
                  <input type="email" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.emailId} onChange={(e) => setFormData({...formData, emailId: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">GST Number</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Status</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
                  style={{ backgroundColor: '#014aad', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {mode === 'create' ? 'Save Vendor' : 'Update Vendor'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
