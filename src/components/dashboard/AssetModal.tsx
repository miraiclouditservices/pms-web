"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

export type ModalMode = "create" | "edit" | "view";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function AssetModal({ isOpen, onClose, onSave, editData, mode }: AssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    assetCode: "",
    assetDescription: "",
    category: "Others",
    property: "",
    unit: "",
    floorNumber: "",
    assetLocation: "",
    serialNumber: "",
    make: "",
    purchaseDate: "",
    purchaseValue: "",
    warrantyStartDate: "",
    warrantyEndDate: "",
    vendorDetails: "",
    contactName: "",
    contactNumber: ""
  });

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
      fetchUnits();
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
          ...editData,
          purchaseDate: formatDate(editData.purchaseDate),
          warrantyStartDate: formatDate(editData.warrantyStartDate),
          warrantyEndDate: formatDate(editData.warrantyEndDate),
          property: typeof editData.property === 'object' ? editData.property?._id : editData.property,
          unit: typeof editData.unit === 'object' ? editData.unit?._id : editData.unit,
        });
      } else {
        // Professional Auto-generation: AST-XXXX
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setFormData({
          assetCode: `AST-${randomNum}`,
          assetDescription: "",
          category: "Others",
          property: "",
          unit: "",
          floorNumber: "",
          assetLocation: "",
          serialNumber: "",
          make: "",
          purchaseDate: "",
          purchaseValue: "",
          warrantyStartDate: "",
          warrantyEndDate: "",
          vendorDetails: "",
          contactName: "",
          contactNumber: ""
        });
      }
    }
  }, [editData, isOpen, mode]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) setAllProperties(response.data);
    } catch (err) { console.error("Fetch Properties Error:", err); }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      if (response.success) setAllUnits(response.data);
    } catch (err) { console.error("Fetch Units Error:", err); }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }
    
    setIsSubmitting(true);
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
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '850px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? 'Add New Asset' : mode === 'edit' ? 'Edit Asset Details' : 'View Asset Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
                            {mode === 'view' ? (
                <div className="view-mode animate-fadeIn">
                   <div className="row g-4">
                     <div className="col-12">
                        <div className="p-3 rounded-4 border bg-emerald bg-opacity-5 d-flex align-items-center gap-3 mb-2 border-emerald border-opacity-10">
                           <div className="bg-emerald bg-opacity-10 text-emerald p-3 rounded-circle">
                              <i className={`bi ${formData.category === 'HVAC' ? 'bi-wind' : formData.category === 'Electrical' ? 'bi-lightning-charge' : 'bi-box-seam'} fs-4`}></i>
                           </div>
                           <div>
                              <h4 className="fw-bold mb-0" style={{ color: '#0F172A' }}>{formData.assetDescription}</h4>
                              <span className="badge bg-emerald bg-opacity-10 text-emerald rounded-pill px-3">{formData.category}</span>
                           </div>
                        </div>
                     </div>

                     <div className="col-md-6">
                        <div className="p-3 rounded-4 border h-100 bg-white shadow-sm">
                           <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center gap-2">
                             <i className="bi bi-geo-alt text-emerald"></i> Location Analytics
                           </h6>
                           <div className="d-flex flex-column gap-3">
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Building / Tower</span>
                                 <span className="fw-bold small">{typeof formData.property === 'object' ? formData.property?.propertyName : allProperties.find(p => p._id === formData.property)?.propertyName || 'Main Complex'}</span>
                              </div>
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Floor Level</span>
                                 <span className="fw-bold small">Floor {formData.floorNumber || '0'}</span>
                              </div>
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Linked Unit</span>
                                 <span className="fw-bold small">{typeof formData.unit === 'object' ? formData.unit?.unitNumber : allUnits.find(u => u._id === formData.unit)?.unitNumber || 'Common Area'}</span>
                              </div>
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Specific Spot</span>
                                 <span className="fw-bold small text-emerald">{formData.assetLocation}</span>
                              </div>
                              <div className="d-flex justify-content-between">
                                 <span className="text-muted small">Asset Tag</span>
                                 <span className="badge bg-light text-dark border px-2">{formData.assetCode}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="col-md-6">
                        <div className="p-3 rounded-4 border h-100 bg-white shadow-sm">
                           <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center gap-2">
                             <i className="bi bi-info-circle text-emerald"></i> Specifications
                           </h6>
                           <div className="d-flex flex-column gap-3">
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Make / Brand</span>
                                 <span className="fw-bold small">{formData.make || 'N/A'}</span>
                              </div>
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Serial Number</span>
                                 <span className="fw-bold small">{formData.serialNumber || 'N/A'}</span>
                              </div>
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Purchase Value</span>
                                 <span className="fw-bold small text-dark">₹ {formData.purchaseValue?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="d-flex justify-content-between border-bottom pb-2">
                                 <span className="text-muted small">Purchase Date</span>
                                 <span className="fw-bold small">{formData.purchaseDate ? new Date(formData.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <div className="d-flex justify-content-between">
                                 <span className="text-muted small">Asset Status</span>
                                 <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">Operational</span>
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  {/* Manager's Handbook / Guide */}
                  {mode === 'create' && (
                    <div className="p-3 rounded-4 border-emerald border-opacity-25 bg-emerald bg-opacity-5 mb-4 d-flex gap-3 align-items-center shadow-sm">
                      <div className="bg-emerald text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-lightbulb-fill fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-1 small">Manager's Insight: Why track Assets?</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                          Tracking physical infrastructure (HVAC, IT, Electrical) is vital for <strong>lifecycle management</strong>. 
                          It ensures you never miss warranty deadlines and helps schedule preventive maintenance (AMC) to avoid costly breakdowns.
                        </p>
                      </div>
                    </div>
                  )}

                  <h6 className="fw-bold text-emerald mb-3 d-flex align-items-center gap-2" style={{ color: '#10B981' }}>
                    <i className="bi bi-info-square-fill"></i> Core Asset Identity
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Asset Code (Auto-Generated)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-emerald bg-opacity-10 border-0 text-emerald"><i className="bi bi-hash"></i></span>
                        <input type="text" className="form-control form-control-sm bg-white border-0 fw-bold text-emerald shadow-none" readOnly
                          value={formData.assetCode} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Asset Category</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-grid-fill"></i></span>
                        <select className="form-select form-select-sm bg-light border-0 py-2" required
                          value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                          <option value="HVAC">HVAC & Climate Control</option>
                          <option value="Electrical">Electrical Systems</option>
                          <option value="Plumbing">Plumbing & Water</option>
                          <option value="IT & Tech">IT Infrastructure</option>
                          <option value="Security">Security & Surveillance</option>
                          <option value="Furniture">Furniture & Fixtures</option>
                          <option value="Others">General Assets</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Manufacturer / Make</label>
                      <input type="text" className="form-control form-control-sm bg-light border-0 py-2 rounded-3"
                        placeholder="e.g. Kirloskar, Samsung"
                        value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted mb-1">Asset Description</label>
                      <input type="text" className="form-control form-control-sm bg-light border-0 py-2 rounded-3" required
                        placeholder="e.g. 50kVA Diesel Generator - Block A Backup"
                        value={formData.assetDescription} onChange={(e) => setFormData({...formData, assetDescription: e.target.value})} />
                    </div>

                    {/* Spatial Location Row */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Building / Property</label>
                      <select className="form-select form-select-sm bg-light border-0 py-2"
                        value={formData.property} onChange={(e) => setFormData({...formData, property: e.target.value})}>
                        <option value="">Select Building...</option>
                        {allProperties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Floor Level</label>
                      <select className="form-select form-select-sm bg-light border-0 py-2"
                        value={formData.floorNumber} 
                        onChange={(e) => setFormData({...formData, floorNumber: e.target.value})}
                        disabled={!formData.property}>
                        <option value="">{formData.property ? 'Select Floor...' : 'Select Building first'}</option>
                        {(() => {
                          const prop = allProperties.find(p => p._id === formData.property);
                          if (!prop) return null;
                          const options = [];
                          // Basements
                          for (let b = prop.totalBasements; b >= 1; b--) {
                            options.push(<option key={`B${b}`} value={-b}>Basement {b} (B{b})</option>);
                          }
                          // Ground
                          options.push(<option key="G" value={0}>Ground Floor (G)</option>);
                          // Upper Floors
                          for (let f = 1; f <= prop.totalFloors; f++) {
                            options.push(<option key={`F${f}`} value={f}>Floor {f}</option>);
                          }
                          return options;
                        })()}
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-bold text-muted mb-1">Linked Flat / Office (Optional)</label>
                      <select className="form-select form-select-sm bg-light border-0 py-2"
                        value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        disabled={!formData.floorNumber}>
                        <option value="">{!formData.property ? 'Select Building first' : !formData.floorNumber ? 'Select Floor first' : 'Select Unit...'}</option>
                        {allUnits
                          .filter(u => {
                            const matchProp = (u.property?._id === formData.property || u.property === formData.property);
                            // Corrected field name from u.floor to u.floorNumber
                            const matchFloor = Number(u.floorNumber) === Number(formData.floorNumber);
                            return matchProp && matchFloor;
                          })
                          .map(u => (
                            <option key={u._id} value={u._id}>{u.unitNumber} ({u.unitType})</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-muted mb-1">Specific Spot / Internal Location</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-geo-alt-fill"></i></span>
                        <input type="text" className="form-control form-control-sm bg-light border-0 py-2" required
                          placeholder="e.g. Server Room B, North Wall"
                          value={formData.assetLocation} onChange={(e) => setFormData({...formData, assetLocation: e.target.value})} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Serial Number / Tag</label>
                      <input type="text" className="form-control form-control-sm bg-light border-0 py-2 rounded-3"
                        value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} />
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Purchase Date</label>
                      <input type="date" className="form-control form-control-sm bg-light border-0 py-2 rounded-3"
                        value={formData.purchaseDate} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted mb-1">Purchase Value (₹)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0 text-muted">₹</span>
                        <input type="number" className="form-control form-control-sm bg-light border-0 py-2 rounded-3"
                          value={formData.purchaseValue} onChange={(e) => setFormData({...formData, purchaseValue: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <hr className="text-muted opacity-25" />

                  {/* Warranty Details */}
                  <h6 className="fw-bold text-emerald mb-3 d-flex align-items-center gap-2" style={{ color: '#10B981' }}>
                    <i className="bi bi-shield-check"></i> Warranty & Lifecycle Support
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Warranty Effective Date</label>
                      <input type="date" className="form-control form-control-sm bg-light border-0 py-2"
                        value={formData.warrantyStartDate} onChange={(e) => setFormData({...formData, warrantyStartDate: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Warranty Expiry Date</label>
                      <input type="date" className="form-control form-control-sm bg-light border-0 py-2"
                        value={formData.warrantyEndDate} onChange={(e) => setFormData({...formData, warrantyEndDate: e.target.value})} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-muted mb-1">Authorized Support Vendor</label>
                      <input type="text" className="form-control form-control-sm bg-light border-0 py-2"
                        placeholder="Vendor name and contact details"
                        value={formData.vendorDetails} onChange={(e) => setFormData({...formData, vendorDetails: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

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
                  {mode === 'create' ? 'Save Asset' : 'Update Asset'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
