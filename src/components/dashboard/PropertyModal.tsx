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
          propertyName: editData.propertyName || editData.name || "",
          propertyType: editData.propertyType || editData.type || "Office",
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
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const totalSft = towers.reduce((sum, t) => sum + (t.sft || 0), 0);
    const totalFloors = Math.max(...towers.map(t => t.floors), 1);
    
    onSave({ 
      ...formData, 
      propertyAddress: formData.location, 
      totalFloors, 
      totalSft,
      totalUnits: 0, // Fallback required by backend
      towerConfigs: towers, 
      towers: towers.length 
    });
    setIsSubmitting(false);
    onClose();
  };

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
        .tower-row:hover .remove-btn { opacity: 1 !important; }
        .btn-emerald-outline {
          background: white;
          color: #014aad !important;
          border: 1px solid rgba(1, 74, 173, 0.4);
          transition: all 0.2s;
        }
        .btn-emerald-outline:hover {
          background: #f0fdf4;
          border-color: #014aad;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(1, 74, 173, 0.1);
        }
        .btn-emerald-solid {
          background: #014aad;
          border: none;
          color: white !important;
          transition: all 0.2s;
        }
        .btn-emerald-solid:hover {
          background: #013a8a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(1, 74, 173, 0.3);
        }
        .rounded-xl { border-radius: 1rem !important; }
        .rounded-lg { border-radius: 0.75rem !important; }
        .tracking-tight { letter-spacing: -0.02em; }
        
        /* Remove default number input spinners */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '850px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-xl shadow-2xl overflow-hidden bg-white">
          <div className="modal-header border-bottom-0 p-4 bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark tracking-tight" style={{ fontSize: '1.2rem' }}>Property Configuration</h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <label className="form-label fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Property Name</label>
                  <input 
                    type="text" className="form-control border bg-white fw-bold" required 
                    value={formData.propertyName} onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                    placeholder="e.g. Emerald Tech Park"
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Property Type</label>
                  <select 
                    className="form-select border bg-white fw-bold"
                    value={formData.propertyType} onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                  >
                    <option>Office</option>
                    <option>Commercial</option>
                    <option>IT Park</option>
                    <option>Mixed Use</option>
                    <option>Residential</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Location</label>
                  <input 
                    type="text" className="form-control border bg-white fw-bold" required 
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, Country"
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                  />
                </div>
              </div>

              {/* Tower Specific Configuration */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-dark tracking-tight" style={{ fontSize: '1rem' }}>Tower & Vertical Configuration</h6>
                  <button type="button" onClick={handleAddTower} className="btn btn-emerald-outline rounded-pill px-3 fw-bold d-flex align-items-center gap-2 py-1">
                    <i className="bi bi-plus-lg" style={{ fontSize: '0.7rem' }}></i>
                    <span style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>ADD TOWER</span>
                  </button>
                </div>
                
                <div className="bg-light bg-opacity-50 rounded-xl p-3 border border-dashed">
                  <div className="row g-3">
                    {towers.map((tower, index) => (
                      <div key={tower.id} className="col-md-6 tower-row">
                        <div className="bg-white p-3 rounded-lg border shadow-sm position-relative transition-all" style={{ transition: 'all 0.3s' }}>
                          <div className="row g-2 align-items-center">
                            <div className="col-7">
                              <label className="x-small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Tower Name</label>
                              <input 
                                type="text" className="form-control form-control-sm border bg-white fw-bold"
                                value={tower.name} onChange={(e) => updateTower(tower.id, 'name', e.target.value)}
                                style={{ fontSize: '0.8rem' }}
                              />
                            </div>
                            <div className="col-5">
                              <label className="x-small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>SFT</label>
                              <input 
                                type="number" className="form-control form-control-sm border bg-white fw-bold"
                                value={tower.sft} onChange={(e) => updateTower(tower.id, 'sft', parseInt(e.target.value) || 0)}
                                style={{ fontSize: '0.8rem' }}
                              />
                            </div>
                          </div>
                          {towers.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTower(tower.id)}
                              className="btn btn-link text-danger p-0 position-absolute top-0 end-0 mt-2 me-2 remove-btn opacity-0 transition-all"
                              style={{ fontSize: '0.9rem' }}
                            >
                              <i className="bi bi-dash-circle-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-1">
                <div className="col-md-4">
                  <label className="form-label fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Opening Time</label>
                  <input 
                    type="time" className="form-control border bg-white fw-bold" 
                    value={formData.openingTime} onChange={(e) => setFormData({...formData, openingTime: e.target.value})}
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Closing Time</label>
                  <input 
                    type="time" className="form-control border bg-white fw-bold" 
                    value={formData.closingTime} onChange={(e) => setFormData({...formData, closingTime: e.target.value})}
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Operational Status</label>
                  <select 
                    className="form-select border bg-white fw-bold"
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                  >
                    <option>Active</option>
                    <option>Maintenance</option>
                    <option>Pre-Launch</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer border-top-0 p-4 pt-0 d-flex gap-3 justify-content-end">
              <button 
                type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem', height: '40px', borderWidth: '2px' }}
              >
                Discard Changes
              </button>
              <button 
                type="submit" className="btn btn-emerald-solid rounded-pill px-4 fw-bold shadow-sm text-white"
                disabled={isSubmitting}
                style={{ fontSize: '0.85rem', height: '40px' }}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isSubmitting ? "Syncing Global Assets..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

