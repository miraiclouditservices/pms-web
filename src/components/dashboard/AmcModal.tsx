"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface AmcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

export default function AmcModal({ isOpen, onClose, onSave, editData }: AmcModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    asset: "",
    vendor: "",
    startDate: "",
    endDate: "",
    contactName: "",
    contactNumber: "",
    amcValue: 0,
    amcStatus: "Active"
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editData) {
        setFormData({
          ...editData,
          asset: editData.asset?._id || editData.asset || "",
          vendor: editData.vendor?._id || editData.vendor || "",
          startDate: editData.startDate ? new Date(editData.startDate).toISOString().split('T')[0] : "",
          endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : ""
        });
      } else {
        setFormData({
          asset: "",
          vendor: "",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          contactName: "",
          contactNumber: "",
          amcValue: 0,
          amcStatus: "Active"
        });
      }
    }
  }, [isOpen, editData]);

  const fetchData = async () => {
    try {
      const [assetRes, vendorRes] = await Promise.all([
        api.get('/assets'),
        api.get('/vendors')
      ]);
      if (assetRes.success) setAssets(assetRes.data);
      if (vendorRes.success) setVendors(vendorRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '800px' }}>
        <div className="modal-content border-0 rounded-4 shadow-2xl bg-white overflow-hidden">
          <div className="modal-header p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold mb-0" style={{ color: '#0F172A' }}>{editData ? 'Edit AMC Agreement' : 'Add New AMC'}</h5>
              <p className="text-muted small mb-0">Define maintenance contract terms</p>
            </div>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Select Asset</label>
                  <select 
                    className="form-select form-select-lg bg-light border-0" required
                    value={formData.asset} onChange={(e) => setFormData({...formData, asset: e.target.value})}
                  >
                    <option value="">Select Asset</option>
                    {assets.map(a => (
                        <option key={a._id} value={a._id}>{a.assetDescription} ({a.assetCode})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Select Vendor</label>
                  <select 
                    className="form-select form-select-lg bg-light border-0" required
                    value={formData.vendor} onChange={(e) => {
                        const v = vendors.find(vend => vend._id === e.target.value);
                        setFormData({...formData, vendor: e.target.value, contactName: v?.contactPerson || "", contactNumber: v?.contactNumber || ""})
                    }}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                        <option key={v._id} value={v._id}>{v.vendorName}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Start Date</label>
                  <input 
                    type="date" className="form-control form-control-lg bg-light border-0" required
                    value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">End Date</label>
                  <input 
                    type="date" className="form-control form-control-lg bg-light border-0" required
                    value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Contact Person</label>
                  <input 
                    type="text" className="form-control form-control-lg bg-light border-0"
                    value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Contact Number</label>
                  <input 
                    type="text" className="form-control form-control-lg bg-light border-0"
                    value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">AMC Contract Value (₹)</label>
                  <input 
                    type="number" className="form-control form-control-lg bg-light border-0" required
                    value={formData.amcValue} onChange={(e) => setFormData({...formData, amcValue: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer p-4 border-top bg-light d-flex gap-3">
              <button 
                type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={onClose}
              >Cancel</button>
              <button 
                type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm border-0"
                disabled={isSubmitting}
                style={{ backgroundColor: '#10B981' }}
              >
                {isSubmitting ? 'Saving...' : 'Save AMC'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
