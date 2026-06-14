"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface TowerConfig {
  id: string;
  name: string;
  floors: number;
  sft: number;
}

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: any) => void;
  editData?: any;
}

const FIELD_STYLE: React.CSSProperties = {
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.88rem",
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  backgroundColor: "#fff",
  color: "#111827",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

export default function PropertyModal({ isOpen, onClose, onSave, editData }: PropertyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyType: "Office",
    location: "",
    status: "Active",
    openingTime: "09:00",
    closingTime: "18:00"
  });

  const [towers, setTowers] = useState<TowerConfig[]>([
    { id: '1', name: 'Tower A', floors: 0, sft: 10000 }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          propertyName: editData.propertyName || "",
          propertyType: editData.propertyType || "Office",
          location: editData.propertyAddress || editData.location || "",
          status: editData.status || "Active",
          openingTime: editData.openingTime || "09:00",
          closingTime: editData.closingTime || "18:00"
        });
        setTowers(editData.towerConfigs && editData.towerConfigs.length > 0 
          ? editData.towerConfigs.map((t: any) => ({ ...t, floors: t.floors || 0 }))
          : [{ id: '1', name: 'Tower A', floors: 0, sft: editData.totalSft || 10000 }]);
      } else {
        setFormData({
          propertyName: "",
          propertyType: "Office",
          location: "",
          status: "Active",
          openingTime: "09:00",
          closingTime: "18:00"
        });
        setTowers([{ id: '1', name: 'Tower A', floors: 0, sft: 10000 }]);
      }
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleAddTower = () => {
    const nextChar = String.fromCharCode(65 + towers.length);
    setTowers([...towers, { id: Date.now().toString(), name: `Tower ${nextChar}`, floors: 0, sft: 10000 }]);
  };

  const handleRemoveTower = (id: string) => {
    if (towers.length > 1) {
      setTowers(towers.filter(t => t.id !== id));
    }
  };

  const updateTower = (id: string, field: keyof TowerConfig, value: any) => {
    setTowers(towers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const totalSft = towers.reduce((sum, t) => sum + (t.sft || 0), 0);
    const totalFloors = Math.max(...towers.map(t => t.floors), 1);
    
    await onSave({ 
      ...formData, 
      propertyAddress: formData.location, 
      totalFloors, 
      totalSft,
      totalUnits: 0,
      towerConfigs: towers, 
      towers: towers.length 
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div className="bg-white rounded-3 shadow-lg overflow-hidden w-100 mx-3" style={{ maxWidth: '850px' }}>
        {/* Header (Popup Dark Header Style) */}
        <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#2d3748' }}>
          <h6 className="fw-bold mb-0 text-white" style={{ fontSize: '1rem' }}>
            {editData ? "Edit Property Configuration" : "Add New Property"}
          </h6>
          <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} style={{ fontSize: '0.8rem' }}></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="row g-3">
              {/* Property Name */}
              <div className="col-md-8">
                <label style={LABEL_STYLE}>Property Name *</label>
                <input 
                  type="text" required 
                  placeholder="e.g. Emerald Tech Park"
                  value={formData.propertyName} 
                  onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                  style={FIELD_STYLE}
                />
              </div>

              {/* Property Type */}
              <div className="col-md-4">
                <label style={LABEL_STYLE}>Property Type *</label>
                <select 
                  value={formData.propertyType} 
                  onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                  style={FIELD_STYLE}
                >
                  <option>Office</option>
                  <option>Commercial</option>
                  <option>IT Park</option>
                  <option>Mixed Use</option>
                  <option>Residential</option>
                  <option>Industrial</option>
                </select>
              </div>

              {/* Location */}
              <div className="col-12">
                <label style={LABEL_STYLE}>Location / Address *</label>
                <input 
                  type="text" required 
                  placeholder="City, Country"
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  style={FIELD_STYLE}
                />
              </div>
            </div>

            {/* Towers configuration */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Tower & Vertical Configuration</span>
                <button type="button" onClick={handleAddTower} className="btn btn-sm fw-bold d-flex align-items-center gap-1"
                  style={{ backgroundColor: '#e8f0fe', color: '#014aad', border: '1px solid #c7d7f9', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem' }}>
                  <i className="bi bi-plus-lg"></i> Add Tower
                </button>
              </div>

              <div className="p-3 border rounded-3 bg-light bg-opacity-50">
                <div className="row g-3">
                  {towers.map((tower, idx) => (
                    <div key={tower.id} className="col-md-6">
                      <div className="bg-white p-3 rounded border position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>{tower.name || `Tower ${idx + 1}`}</span>
                          {towers.length > 1 && (
                            <button type="button" onClick={() => handleRemoveTower(tower.id)} className="btn btn-link text-danger p-0 shadow-none">
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                        <div className="row g-2">
                          <div className="col-12">
                            <label className="text-muted mb-1" style={{ fontSize: '0.74rem' }}>Tower Name</label>
                            <input 
                              type="text" className="form-control form-control-sm"
                              value={tower.name} onChange={(e) => updateTower(tower.id, 'name', e.target.value)}
                              style={{ fontSize: '0.82rem' }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '0.74rem' }}>No. of Floors</label>
                            <input 
                              type="number" min={0} className="form-control form-control-sm"
                              value={tower.floors} onChange={(e) => updateTower(tower.id, 'floors', parseInt(e.target.value) || 0)}
                              style={{ fontSize: '0.82rem' }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '0.74rem' }}>Total SFT</label>
                            <input 
                              type="number" min={0} className="form-control form-control-sm"
                              value={tower.sft} onChange={(e) => updateTower(tower.id, 'sft', parseInt(e.target.value) || 0)}
                              style={{ fontSize: '0.82rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time / Status */}
            <div className="row g-3 mt-3">
              <div className="col-md-4">
                <label style={LABEL_STYLE}>Opening Time</label>
                <input 
                  type="time" 
                  value={formData.openingTime} onChange={(e) => setFormData({...formData, openingTime: e.target.value})}
                  style={FIELD_STYLE}
                />
              </div>
              <div className="col-md-4">
                <label style={LABEL_STYLE}>Closing Time</label>
                <input 
                  type="time" 
                  value={formData.closingTime} onChange={(e) => setFormData({...formData, closingTime: e.target.value})}
                  style={FIELD_STYLE}
                />
              </div>
              <div className="col-md-4">
                <label style={LABEL_STYLE}>Operational Status</label>
                <select 
                  value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={FIELD_STYLE}
                >
                  <option>Active</option>
                  <option>Maintenance</option>
                  <option>Pre-Launch</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Footer actions */}
          <div className="px-4 py-3 border-top d-flex gap-2 justify-content-end bg-light">
            <button 
              type="button" className="btn btn-sm btn-outline-secondary fw-bold px-3 py-2" 
              onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem', borderRadius: '4px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" className="btn btn-sm fw-bold text-white px-4 py-2"
              disabled={isSubmitting}
              style={{ fontSize: '0.85rem', borderRadius: '4px', backgroundColor: '#014aad' }}
            >
              {isSubmitting ? "Saving..." : "Save Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
