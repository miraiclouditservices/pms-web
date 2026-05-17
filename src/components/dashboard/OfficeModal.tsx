"use client";

import { useState, useEffect } from "react";

interface OfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (office: any) => void;
  editData?: any;
}

export default function OfficeModal({ isOpen, onClose, onSave, editData }: OfficeModalProps) {
  const [formData, setFormData] = useState({
    propertyName: "",
    managerName: "",
    phoneNo: "",
    location: "",
    securityLevel: "Medium",
    capacity: "",
    propertyType: "Office",
    openingTime: "09:00",
    closingTime: "18:00"
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        propertyName: editData.propertyName || editData.name || "",
        managerName: editData.managerName || editData.manager || "",
        phoneNo: editData.phoneNo || editData.phone || "",
        location: editData.location || editData.address || "",
        securityLevel: editData.securityLevel || "Medium",
        capacity: editData.capacity || "",
        propertyType: editData.propertyType || "Office",
        ...editData
      });
    } else {
      setFormData({
        propertyName: "",
        managerName: "",
        phoneNo: "",
        location: "",
        securityLevel: "Medium",
        capacity: "",
        propertyType: "Office",
        openingTime: "09:00",
        closingTime: "18:00"
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-3 shadow">
          <div className="modal-header border-bottom-0 p-4">
            <h5 className="modal-title fw-bold">{editData ? 'Edit Office' : 'Add New Office'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 pt-0">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">OFFICE NAME</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.propertyName}
                    onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                    placeholder="e.g. Tech Park Tower A"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">MANAGER NAME</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.managerName}
                    onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">CONTACT PHONE</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    required 
                    value={formData.phoneNo}
                    onChange={(e) => setFormData({...formData, phoneNo: e.target.value})}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">FULL ADDRESS</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    required 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  ></textarea>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">SECURITY LEVEL</label>
                  <select 
                    className="form-select"
                    value={formData.securityLevel}
                    onChange={(e) => setFormData({...formData, securityLevel: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Restricted</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">TOTAL CAPACITY</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">OPENING TIME</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={formData.openingTime}
                    onChange={(e) => setFormData({...formData, openingTime: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">CLOSING TIME</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={formData.closingTime}
                    onChange={(e) => setFormData({...formData, closingTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer border-top-0 p-4 pt-0">
              <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-pill px-4">
                {editData ? 'Update Office' : 'Save Office'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
