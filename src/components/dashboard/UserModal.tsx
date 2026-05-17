"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function UserModal({ isOpen, onClose, onSave, editData, mode }: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff",
    status: "Active"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
            ...editData,
            password: "" // Don't show password on edit
        });
      } else {
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "Staff",
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
    // Simulate slight delay
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
      
      <div className="modal-dialog modal-md w-100 mx-3" style={{ maxWidth: '500px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? 'Provision New User' : mode === 'edit' ? 'Update User Access' : 'User Identity Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1 text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Full Name</label>
                  <input type="text" className="form-control bg-light border-0 py-2" required disabled={isReadOnly}
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. John Doe" />
                </div>
                
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1 text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Corporate Email</label>
                  <input type="email" className="form-control bg-light border-0 py-2" required disabled={isReadOnly}
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="name@pms.com" />
                </div>

                {mode !== 'view' && (
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1 text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>
                      {mode === 'edit' ? 'New Password (Leave blank to keep current)' : 'Security Password'}
                    </label>
                    <input type="password" className="form-control bg-light border-0 py-2" required={mode === 'create'} 
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      placeholder="Minimum 6 characters" minLength={6} />
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1 text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>System Role</label>
                  <select className="form-select bg-light border-0 py-2" disabled={isReadOnly}
                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="Staff">Staff Member</option>
                    <option value="Owner">Office Owner</option>
                    <option value="Admin">System Admin</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1 text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Account Status</label>
                  <select className="form-select bg-light border-0 py-2" disabled={isReadOnly}
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending Invite</option>
                  </select>
                </div>
              </div>

              {mode === 'create' && (
                <div className="mt-4 p-3 rounded-3 bg-emerald bg-opacity-10 border border-emerald border-opacity-25">
                    <div className="d-flex gap-2 align-items-center mb-1">
                        <i className="bi bi-info-circle-fill text-emerald"></i>
                        <span className="fw-bold text-emerald small">Notification Policy</span>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                        User will receive an automated invitation to set their final credentials once access is provisioned.
                    </p>
                </div>
              )}
            </div>
            
            <div className="modal-footer border-top-0 p-4 pt-0 d-flex gap-3">
              <button 
                type="button" className="btn btn-light rounded-pill px-4 flex-grow-1 fw-bold" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem', height: '42px' }}
              >
                {mode === 'view' ? 'Close Interface' : 'Discard'}
              </button>
              {mode !== 'view' && (
                <button 
                  type="submit" className="btn btn-emerald-solid rounded-pill px-4 flex-grow-1 fw-bold text-white border-0"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#10B981', fontSize: '0.85rem', height: '42px' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {mode === 'create' ? 'Provision Access' : 'Commit Changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
