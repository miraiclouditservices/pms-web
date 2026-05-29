"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface MeetingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
  properties: any[];
  floors: any[];
  units: any[];
}

export default function MeetingRoomModal({
  isOpen,
  onClose,
  onSave,
  editData,
  mode,
  properties = [],
  floors = [],
  units = []
}: MeetingRoomModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    _id: undefined as string | undefined,
    roomName: "",
    property: "",
    floor: "",
    sqft: 0,
    capacity: 10,
    status: "Available",
    unit: ""
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({
          _id: editData._id,
          roomName: editData.roomName || "",
          property: editData.property?._id || editData.property || "",
          floor: editData.floor?._id || editData.floor || "",
          sqft: editData.sqft || 0,
          capacity: editData.capacity || 10,
          status: editData.status || "Available",
          unit: editData.unit?._id || editData.unit || ""
        });
      } else {
        const defaultProp = properties[0]?._id || "";
        const defaultFloor = floors.filter(f => f.property === defaultProp || f.property?._id === defaultProp)[0]?._id || "";
        
        setFormData({
          _id: undefined,
          roomName: "",
          property: defaultProp,
          floor: defaultFloor,
          sqft: 150,
          capacity: 8,
          status: "Available",
          unit: ""
        });
      }
    }
  }, [editData, isOpen, mode, properties, floors]);

  if (!isOpen) return null;

  const filteredFloors = floors.filter(f => {
    const propId = typeof f.property === 'object' ? f.property?._id : f.property;
    return propId === formData.property;
  });

  const filteredUnits = units.filter(u => {
    const floorId = typeof u.floor === 'object' ? u.floor?._id : u.floor;
    return floorId === formData.floor;
  });

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find(u => u._id === unitId);
    if (selectedUnit) {
      setFormData({
        ...formData,
        unit: unitId,
        sqft: selectedUnit.sqft || 0,
        roomName: selectedUnit.unitName || `Room ${selectedUnit.unitNumber}`
      });
    } else {
      setFormData({
        ...formData,
        unit: "",
        sqft: 0
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }

    if (!formData.property || !formData.floor || !formData.roomName || formData.sqft <= 0) {
      setValidationError("Please fill out all required fields with valid values.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to save meeting room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-dialog modal-md w-100 mx-3" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? '🆕 Add Meeting Room / Hall' : mode === 'edit' ? 'Update Meeting Room' : 'Meeting Room Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {validationError && (
                <div className="alert alert-danger border-0 rounded-3 mb-4 small py-2 fw-medium">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> {validationError}
                </div>
              )}

              <div className="row g-3">
                {/* Property Dropdown */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Select Property *</label>
                  <select 
                    className="form-select form-select-sm bg-light border-0 shadow-none py-2" 
                    required 
                    disabled={isReadOnly}
                    value={formData.property} 
                    onChange={(e) => setFormData({...formData, property: e.target.value, floor: "", unit: ""})}
                  >
                    <option value="">-- Choose Property --</option>
                    {properties.map(p => (
                      <option key={p._id} value={p._id}>{p.propertyName}</option>
                    ))}
                  </select>
                </div>

                {/* Floor Dropdown */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Select Floor *</label>
                  <select 
                    className="form-select form-select-sm bg-light border-0 shadow-none py-2" 
                    required 
                    disabled={isReadOnly || !formData.property}
                    value={formData.floor} 
                    onChange={(e) => setFormData({...formData, floor: e.target.value, unit: ""})}
                  >
                    <option value="">-- Choose Floor --</option>
                    {filteredFloors.map(f => (
                      <option key={f._id} value={f._id}>{f.floorName || `Floor ${f.floorNumber}`}</option>
                    ))}
                  </select>
                </div>

                {/* Convert Unit Dropdown */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Convert Floor Unit to Room (Optional)</label>
                  <select 
                    className="form-select form-select-sm bg-light border-0 shadow-none py-2" 
                    disabled={isReadOnly || !formData.floor}
                    value={formData.unit} 
                    onChange={(e) => handleUnitChange(e.target.value)}
                  >
                    <option value="">-- Standalone Meeting Room (No Unit Link) --</option>
                    {filteredUnits.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.unitNumber} {u.unitName ? `- ${u.unitName}` : ''} ({u.sqft} SFT)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Name */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Room / Hall Name *</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm bg-light border-0 py-2" 
                    required 
                    disabled={isReadOnly}
                    placeholder="e.g. Executive Boardroom, Alpha Studio"
                    value={formData.roomName} 
                    onChange={(e) => setFormData({...formData, roomName: e.target.value})} 
                  />
                </div>

                {/* SFT Size */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Designated Size (SFT) *</label>
                  <input 
                    type="number" 
                    className="form-control form-control-sm bg-light border-0 py-2" 
                    required 
                    disabled={isReadOnly || !!formData.unit}
                    min={1}
                    value={formData.sqft} 
                    onChange={(e) => setFormData({...formData, sqft: Number(e.target.value)})} 
                  />
                </div>

                {/* Capacity */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Capacity (Pax) *</label>
                  <input 
                    type="number" 
                    className="form-control form-control-sm bg-light border-0 py-2" 
                    required 
                    disabled={isReadOnly}
                    min={1}
                    value={formData.capacity} 
                    onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} 
                  />
                </div>

                {/* Status */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Room Status</label>
                  <select 
                    className="form-select form-select-sm bg-light border-0 py-2" 
                    disabled={isReadOnly}
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Available">🟢 Available</option>
                    <option value="Under Maintenance">🔴 Under Maintenance</option>
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
                  {mode === 'create' ? 'Assign Space' : 'Update Room'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
