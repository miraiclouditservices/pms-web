"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";
import { api } from "@/utils/api";

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function GatePassModal({ isOpen, onClose, onSave, editData, mode }: GatePassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [availableFloors, setAvailableFloors] = useState<string[]>([]);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    id: "",
    gatePassType: "Inward",
    materialDetails: "",
    hsnCode: "",
    quantity: 1,
    rate: "",
    totalCost: "",
    building: "",
    floor: "",
    unit: "",
    officeName: "",
    officeDetails: "",
    placeOfVisit: "",
    purposeOfVisit: "",
    vehicleNumber: "",
    inTime: "",
    outTime: "-",
    status: "Pending"
  });

  useEffect(() => {
    if (isOpen) {
      fetchPropertiesAndUnits();
    }
  }, [isOpen]);

  const fetchPropertiesAndUnits = async () => {
    try {
      const [propRes, unitRes] = await Promise.all([
        api.get('/properties'),
        api.get('/units')
      ]);
      
      if (propRes.success) setProperties(propRes.data);
      if (unitRes.success) setAllUnits(unitRes.data);
    } catch (err) {
      console.error("Failed to fetch properties/units:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
          ...editData,
          gatePassType: editData.gatePassType || "Inward",
          materialDetails: editData.materialDetails || "",
          hsnCode: editData.hsnCode || "",
          quantity: editData.quantity || 1,
          rate: editData.rate || "",
          totalCost: editData.totalCost || "",
          building: editData.building || "",
          floor: editData.floor || "",
          unit: editData.unit || "",
          officeName: editData.officeName || "",
          officeDetails: editData.officeDetails || "",
          placeOfVisit: editData.placeOfVisit || "",
          purposeOfVisit: editData.purposeOfVisit || "",
          vehicleNumber: editData.vehicleNumber || "",
          inTime: editData.inTime || "",
          outTime: editData.outTime || "-",
          status: editData.status || "Pending"
        });
      } else {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        setFormData({
          id: `GP${Math.floor(1000 + Math.random() * 9000)}`,
          gatePassType: "Inward",
          materialDetails: "",
          hsnCode: "",
          quantity: 1,
          rate: "",
          totalCost: "",
          building: "",
          floor: "",
          unit: "",
          officeName: "",
          officeDetails: "",
          placeOfVisit: "",
          purposeOfVisit: "",
          vehicleNumber: "",
          inTime: timeStr,
          outTime: "-",
          status: "Pending"
        });
      }
    }
  }, [editData, isOpen, mode]);

  // Handle building selection
  const handleBuildingChange = (propertyName: string) => {
    const selectedProp = properties.find(p => p.propertyName === propertyName);
    if (selectedProp) {
      const propUnits = allUnits.filter(u => u.property?._id === selectedProp._id || u.property === selectedProp._id);
      const floors = Array.from(new Set(propUnits.map(u => u.floorNumber))).sort();
      setAvailableFloors(floors);
      setFormData(prev => ({ ...prev, building: propertyName, floor: "", unit: "", officeName: "", officeDetails: "" }));
    }
  };

  // Handle floor selection
  const handleFloorChange = (floor: string) => {
    const selectedProp = properties.find(p => p.propertyName === formData.building);
    if (selectedProp) {
      const units = allUnits.filter(u => 
        (u.property?._id === selectedProp._id || u.property === selectedProp._id) && 
        u.floorNumber === floor
      );
      setAvailableUnits(units);
      setFormData(prev => ({ ...prev, floor, unit: "", officeName: "", officeDetails: "" }));
    }
  };

  // Handle unit selection
  const handleUnitChange = (unitNumber: string) => {
    const unit = availableUnits.find(u => u.unitNumber === unitNumber);
    if (unit) {
      setFormData(prev => ({ 
        ...prev, 
        unit: unitNumber,
        officeName: unit.ownerName || "Occupied",
        officeDetails: `Type: ${unit.unitType}, Status: ${unit.unitStatus}`
      }));
    }
  };

  // Auto calculate total cost when rate or quantity changes
  useEffect(() => {
    if (formData.rate && formData.quantity && mode !== "view") {
      const rate = parseFloat(formData.rate.toString());
      const qty = parseInt(formData.quantity.toString());
      if (!isNaN(rate) && !isNaN(qty)) {
        setFormData(prev => ({ ...prev, totalCost: (rate * qty).toString() }));
      }
    }
  }, [formData.rate, formData.quantity, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    try {
      onSave(formData);
    } catch (err) {
      console.error("Error saving gate pass:", err);
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
              {mode === 'create' ? 'Create Gate Pass' : mode === 'edit' ? 'Edit Gate Pass' : 'View Gate Pass'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-emerald mb-0" style={{ color: '#10B981' }}>Material Information</h6>
                {mode !== 'create' && <div className="badge bg-light text-dark border">ID: {formData.id || editData?._id}</div>}
              </div>
              
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Gate Pass Type</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.gatePassType} onChange={(e) => setFormData({...formData, gatePassType: e.target.value})}>
                    <option value="Inward">Inward</option>
                    <option value="Outward">Outward</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label small fw-bold text-muted mb-1">Material Details</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.materialDetails} onChange={(e) => setFormData({...formData, materialDetails: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">HSN Code</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.hsnCode} onChange={(e) => setFormData({...formData, hsnCode: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Quantity</label>
                  <input type="number" className="form-control form-control-sm bg-light" required disabled={isReadOnly} min="1"
                    value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Rate (₹)</label>
                  <input type="number" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Total Cost (₹)</label>
                  <input type="text" className="form-control form-control-sm bg-light fw-bold" disabled={true}
                    value={formData.totalCost} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Location & Office Details</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Building</label>
                  <select 
                    className="form-select form-select-sm bg-light" 
                    required 
                    disabled={isReadOnly}
                    value={formData.building} 
                    onChange={(e) => handleBuildingChange(e.target.value)}
                  >
                    <option value="">Select Building</option>
                    {properties.map(p => (
                      <option key={p._id} value={p.propertyName}>{p.propertyName}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Floor</label>
                  <select 
                    className="form-select form-select-sm bg-light" 
                    required 
                    disabled={isReadOnly || !formData.building}
                    value={formData.floor} 
                    onChange={(e) => handleFloorChange(e.target.value)}
                  >
                    <option value="">Select Floor</option>
                    {availableFloors.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Unit / Office No</label>
                  <select 
                    className="form-select form-select-sm bg-light" 
                    required 
                    disabled={isReadOnly || !formData.floor}
                    value={formData.unit} 
                    onChange={(e) => handleUnitChange(e.target.value)}
                  >
                    <option value="">Select Unit</option>
                    {availableUnits.map(u => (
                      <option key={u._id} value={u.unitNumber}>{u.unitNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Office Name</label>
                  <input type="text" className="form-control form-control-sm bg-light fw-bold" disabled={true}
                    value={formData.officeName} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Office Details / Contact</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={true}
                    value={formData.officeDetails} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Movement Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Place of Visit</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.placeOfVisit} onChange={(e) => setFormData({...formData, placeOfVisit: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Purpose</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.purposeOfVisit} onChange={(e) => setFormData({...formData, purposeOfVisit: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Vehicle No</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.vehicleNumber} onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">In Time</label>
                  <input type="text" className="form-control form-control-sm bg-light" disabled={isReadOnly}
                    value={formData.inTime} onChange={(e) => setFormData({...formData, inTime: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Status</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Rejected">Rejected</option>
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
                  {mode === 'create' ? 'Generate Pass' : 'Update Pass'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
