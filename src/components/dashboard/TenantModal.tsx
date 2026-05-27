"use client";
import { useState, useEffect } from "react";

export default function TenantModal({ isOpen, onClose, onSave, editData }: any) {
  const [formData, setFormData] = useState({
    tenantName: "",
    contactNumber: "",
    emailId: "",
    companyName: "",
    status: "Active"
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        tenantName: editData.tenantName || "",
        contactNumber: editData.contactNumber || "",
        emailId: editData.emailId || "",
        companyName: editData.companyName || "",
        status: editData.status || "Active"
      });
    } else {
      setFormData({ tenantName: "", contactNumber: "", emailId: "", companyName: "", status: "Active" });
    }
  }, [editData, isOpen]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow rounded-4">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold text-dark">
              {editData ? 'Edit Tenant Profile' : 'Register New Tenant'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">Primary Contact Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="tenantName" value={formData.tenantName} onChange={handleChange} placeholder="e.g., John Doe" required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">Company Name (Optional)</label>
                <input type="text" className="form-control" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g., Tech Solutions Inc." />
              </div>
              <div className="row mb-3">
                <div className="col-sm-6 mb-3 mb-sm-0">
                  <label className="form-label fw-bold small text-muted">Phone Number <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="+1 234 567 8900" required />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold small text-muted">Email Address</label>
                  <input type="email" className="form-control" name="emailId" value={formData.emailId} onChange={handleChange} placeholder="john@example.com" />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted">Profile Status</label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}>Save Tenant</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
