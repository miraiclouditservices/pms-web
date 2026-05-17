"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function OwnerModal({ isOpen, onClose, onSave, editData, mode }: OwnerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: "",
    contactNumber: "",
    alternateNumber: "",
    emailId: "",
    password: "",
    address: "",
    ownerType: "Individual",
    gstNumber: "",
    companyRegNo: "",
    contactPerson: "",
    designation: "",
    idProofType: "Aadhar",
    idProofNumber: "",
    status: "Active"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
          ownerName: editData.ownerName || "",
          contactNumber: editData.contactNumber || "",
          alternateNumber: editData.alternateNumber || "",
          emailId: editData.emailId || "",
          password: "",
          address: editData.address || "",
          ownerType: editData.ownerType || "Individual",
          gstNumber: editData.gstNumber || "",
          companyRegNo: editData.companyRegNo || "",
          contactPerson: editData.contactPerson || "",
          designation: editData.designation || "",
          idProofType: editData.idProofType || "Aadhar",
          idProofNumber: editData.idProofNumber || "",
          status: editData.status || "Active"
        });
      } else {
        setFormData({
          ownerName: "",
          contactNumber: "",
          alternateNumber: "",
          emailId: "",
          password: "",
          address: "",
          ownerType: "Individual",
          gstNumber: "",
          companyRegNo: "",
          contactPerson: "",
          designation: "",
          idProofType: "Aadhar",
          idProofNumber: "",
          status: "Active"
        });
      }
      setShowPassword(false);
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
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(2, 44, 34, 0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(8px)', animation: 'fadeIn 0.25s ease-out'
    }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .premium-input {
          border: 1px solid #e2e8f0;
          background-color: #f8fafc !important;
          border-radius: 0.75rem !important;
          padding: 0.6rem 0.9rem !important;
          font-size: 0.85rem !important;
          transition: all 0.2s ease-in-out !important;
        }
        .premium-input:focus {
          border-color: #10B981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
          background-color: #ffffff !important;
        }
        .premium-label {
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          color: #64748b !important;
          margin-bottom: 0.35rem !important;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .section-card {
          background-color: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
        }
        .segmented-btn {
          font-size: 0.8rem !important;
          padding: 0.5rem 1.25rem !important;
          cursor: pointer;
        }
      `}</style>
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '780px', animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden bg-white">
          
          {/* Modal Header */}
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-emerald bg-opacity-10 text-emerald rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <i className={`bi ${mode === 'create' ? 'bi-person-plus-fill' : mode === 'edit' ? 'bi-pencil-square' : 'bi-eye-fill'} fs-5`}></i>
              </div>
              <h5 className="modal-title fw-bold text-dark mb-0" style={{ letterSpacing: '-0.01em' }}>
                {mode === 'create' ? 'Register New Owner' : mode === 'edit' ? 'Edit Owner Profile' : 'Owner Details'}
              </h5>
            </div>
            <button type="button" className="btn-close shadow-none" onClick={onClose} style={{ fontSize: '0.8rem' }}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-light bg-opacity-30" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Owner Type Segmented Controller */}
              <div className="d-flex flex-column mb-4">
                <label className="premium-label">Owner Classification</label>
                <div className="d-flex gap-2 p-1 bg-light rounded-pill align-self-start" style={{ width: '320px', border: '1px solid #e2e8f0' }}>
                  <button 
                    type="button"
                    className={`btn btn-sm rounded-pill segmented-btn border-0 transition-all flex-grow-1 fw-bold ${formData.ownerType === 'Individual' ? 'bg-white shadow-sm text-emerald' : 'text-muted bg-transparent'}`}
                    style={formData.ownerType === 'Individual' ? { color: '#059669' } : {}}
                    disabled={isReadOnly}
                    onClick={() => setFormData({...formData, ownerType: 'Individual'})}
                  >
                    <i className="bi bi-person me-1"></i> Individual
                  </button>
                  <button 
                    type="button"
                    className={`btn btn-sm rounded-pill segmented-btn border-0 transition-all flex-grow-1 fw-bold ${formData.ownerType === 'Company' ? 'bg-white shadow-sm text-emerald' : 'text-muted bg-transparent'}`}
                    style={formData.ownerType === 'Company' ? { color: '#059669' } : {}}
                    disabled={isReadOnly}
                    onClick={() => setFormData({...formData, ownerType: 'Company'})}
                  >
                    <i className="bi bi-building me-1"></i> Company / Office
                  </button>
                </div>
              </div>

              {/* SECTION 1: Account Information */}
              <div className="section-card">
                <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                  <i className="bi bi-shield-lock text-emerald" style={{ color: '#10B981' }}></i>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>Account & Authentication</h6>
                </div>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="premium-label">Owner / Company Name</label>
                    <input type="text" className="form-control premium-input" required disabled={isReadOnly}
                      placeholder="e.g. John Doe or Mirai Cloud IT Services"
                      value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="premium-label">Official Email (Login Username)</label>
                    <input type="email" className="form-control premium-input" required disabled={isReadOnly}
                      placeholder="e.g. owner@example.com"
                      value={formData.emailId} onChange={(e) => setFormData({...formData, emailId: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="premium-label">Login Password</label>
                    <div className="position-relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-control premium-input pe-5" 
                        placeholder={mode === 'edit' ? "Leave blank to keep current" : "Leave blank for default: Owner@123"}
                        disabled={isReadOnly}
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      />
                      {mode !== 'view' && (
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted px-3 border-0 shadow-none"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ textDecoration: 'none', background: 'none' }}
                        >
                          <i className={`bi bi-eye${showPassword ? '-slash' : ''} fs-6`}></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Corporate Details (Rendered Dynamically) */}
              {formData.ownerType === 'Company' && (
                <div className="section-card" style={{ animation: 'fadeIn 0.25s ease-out' }}>
                  <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                    <i className="bi bi-briefcase text-emerald" style={{ color: '#10B981' }}></i>
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>Corporate Details</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="premium-label">GST Number</label>
                      <input type="text" className="form-control premium-input" disabled={isReadOnly}
                        placeholder="GSTIN1234567890"
                        value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="premium-label">Registration Number</label>
                      <input type="text" className="form-control premium-input" disabled={isReadOnly}
                        placeholder="Reg No / CIN"
                        value={formData.companyRegNo} onChange={(e) => setFormData({...formData, companyRegNo: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="premium-label">Primary Contact Person</label>
                      <input type="text" className="form-control premium-input" disabled={isReadOnly}
                        placeholder="Representative full name"
                        value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="premium-label">Designation</label>
                      <input type="text" className="form-control premium-input" disabled={isReadOnly}
                        placeholder="e.g. Director, Manager"
                        value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: Contact & Verification */}
              <div className="section-card">
                <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                  <i className="bi bi-telephone text-emerald" style={{ color: '#10B981' }}></i>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>Contact & Verification</h6>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="premium-label">Primary Phone</label>
                    <input type="text" className="form-control premium-input" required disabled={isReadOnly}
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="premium-label">ID Proof Type</label>
                    <select className="form-select premium-input" disabled={isReadOnly}
                      value={formData.idProofType} onChange={(e) => setFormData({...formData, idProofType: e.target.value})}>
                      <option value="Aadhar">Aadhar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Company Registration">Company Registration Certificate</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="premium-label">ID Proof Number</label>
                    <input type="text" className="form-control premium-input" required disabled={isReadOnly}
                      placeholder="ID document serial number"
                      value={formData.idProofNumber} onChange={(e) => setFormData({...formData, idProofNumber: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="premium-label">Profile Status</label>
                    <select className="form-select premium-input" disabled={isReadOnly}
                      value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="premium-label">Address</label>
                    <textarea className="form-control premium-input" rows={2} required disabled={isReadOnly}
                      placeholder="Complete physical or corporate mailing address..."
                      value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}></textarea>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="modal-footer border-top p-4 d-flex gap-3 bg-light">
              <button 
                type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem' }}
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'view' && (
                <button 
                  type="submit" className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm text-white border-0"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#10B981', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {mode === 'create' ? 'Complete Registration' : 'Save Changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
