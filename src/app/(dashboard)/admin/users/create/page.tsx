"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from "@/utils/api";

const AVAILABLE_PERMISSIONS = [
  { id: 'view_properties', label: 'View Properties', module: 'Properties', icon: 'bi-building' },
  { id: 'manage_properties', label: 'Manage Properties', module: 'Properties', icon: 'bi-building' },
  { id: 'view_floors', label: 'View Floors', module: 'Floors', icon: 'bi-layers' },
  { id: 'manage_floors', label: 'Manage Floors', module: 'Floors', icon: 'bi-layers' },
  { id: 'view_tenants', label: 'View Tenants', module: 'Tenants', icon: 'bi-people' },
  { id: 'manage_tenants', label: 'Manage Tenants', module: 'Tenants', icon: 'bi-people' },
  { id: 'view_finance', label: 'View Finances', module: 'Finance', icon: 'bi-currency-dollar' },
  { id: 'manage_finance', label: 'Manage Finances', module: 'Finance', icon: 'bi-currency-dollar' },
  { id: 'manage_helpdesk', label: 'Manage Helpdesk', module: 'Operations', icon: 'bi-headset' },
  { id: 'manage_visitors', label: 'Manage Visitors', module: 'Operations', icon: 'bi-headset' },
  { id: 'view_analytics', label: 'View Analytics', module: 'Intelligence', icon: 'bi-bar-chart' },
  { id: 'manage_staff', label: 'Manage Staff', module: 'System', icon: 'bi-shield-check' }
];

// Custom MultiSelect Component
function MultiSelect({ options, selectedIds, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item: string) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedItems = options.filter((opt: any) => selectedIds.includes(opt._id));

  return (
    <div className="position-relative" ref={wrapperRef}>
      <div 
        className="form-control bg-white d-flex flex-wrap align-items-center gap-2 px-3 py-2" 
        style={{ minHeight: '45px', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 && <span className="text-muted small">{placeholder}</span>}
        {selectedItems.map((item: any) => (
          <span key={item._id} className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2 rounded-pill shadow-sm" style={{ fontWeight: '500', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); handleSelect(item._id); }}>
            {item.name} <i className="bi bi-x text-muted" style={{ cursor: 'pointer', fontSize: '1rem' }}></i>
          </span>
        ))}
        <i className="bi bi-chevron-down ms-auto text-muted" style={{ fontSize: '0.85rem' }}></i>
      </div>
      
      {isOpen && (
        <div className="position-absolute w-100 bg-white border shadow-sm rounded-3 mt-1 py-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
          {options.length === 0 ? <div className="p-3 text-muted small text-center">No items available.</div> : null}
          {options.map((opt: any) => {
            const isSelected = selectedIds.includes(opt._id);
            return (
              <div 
                key={opt._id} 
                className="px-3 py-2 d-flex align-items-center gap-2"
                onClick={() => handleSelect(opt._id)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              >
                <div className={`d-flex justify-content-center align-items-center rounded ${isSelected ? 'bg-primary border-primary' : 'bg-white border'}`} style={{ width: '16px', height: '16px', border: '1px solid #cbd5e1' }}>
                  {isSelected && <i className="bi bi-check text-white" style={{ fontSize: '0.9rem', lineHeight: 1 }}></i>}
                </div>
                <span className={`small ${isSelected ? 'text-dark fw-bold' : 'text-muted'}`}>{opt.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'Floor Admin', permissions: [] as string[],
    assignedProperties: [] as string[], assignedFloors: [] as string[], assignedUnits: [] as string[],
    phoneNumber: '', emergencyNumber: '', address: '',
    companyName: '', tenantType: 'Individual', gstPan: '',
    floorAssignmentStartDate: '', floorAssignmentEndDate: '',
    monthlyManagementAmount: 0, paymentType: 'Monthly', paymentDueDay: 5,
    agreementStatus: 'Active', remarks: ''
  });
  
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // File states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);

  // Validation Warnings & Dialog Box State
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<{ title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Current logged in user context
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          // If the logged in user is a Floor Admin, they can only provision 'Office Owner'
          if (parsed.role === 'Floor Admin') {
            setFormData(prev => ({ ...prev, role: 'Office Owner' }));
          }
        } catch (e) {
          console.error("Failed to parse local user context", e);
        }
      }
    }
  }, []);

  const handleStartDateChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, floorAssignmentStartDate: val };
      if (val) {
        const parts = val.split('-');
        if (parts.length === 3) {
          const dayNum = parseInt(parts[2], 10);
          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
            updated.paymentDueDay = dayNum;
          }
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    fetchProperties();
    fetchFloors();
    fetchUnits();
  }, []);

  // Auto-map permissions based on selected Role
  useEffect(() => {
    let perms: string[] = [];
    if (formData.role === 'Super Admin') {
      perms = AVAILABLE_PERMISSIONS.map(p => p.id);
    } else if (formData.role === 'Staff Admin') {
      perms = ['view_properties', 'view_floors', 'view_tenants', 'manage_tenants', 'manage_helpdesk', 'manage_visitors', 'view_analytics'];
    } else if (formData.role === 'Floor Admin') {
      perms = ['view_properties', 'view_floors', 'view_tenants', 'manage_tenants', 'manage_helpdesk', 'manage_visitors', 'view_analytics'];
    } else if (formData.role === 'Office Owner') {
      perms = ['view_properties', 'view_floors', 'view_tenants', 'manage_helpdesk', 'manage_visitors'];
    }
    setFormData(prev => ({ ...prev, permissions: perms }));
  }, [formData.role]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      if (res.success) {
        setProperties(res.data.map((p: any) => ({ ...p, name: p.propertyName })));
      }
    } catch (err) { console.error(err); }
  };

  const fetchFloors = async () => {
    try {
      const res = await api.get('/floors');
      if (res.success) {
        setFloors(res.data.map((f: any) => ({ 
          ...f, 
          name: `${f.property?.propertyName} - ${f.floorName || `Floor ${f.floorNumber}`} (${f.totalSft || 0} SFT)` 
        })));
      }
    } catch (err) { console.error(err); }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/units');
      if (res.success) {
        setUnits(res.data.map((u: any) => ({
          ...u,
          name: `Unit ${u.unitNumber} - ${u.property?.propertyName || ''} - Floor ${u.floor?.floorNumber || ''} (${u.sqft || 0} SFT)`
        })));
      }
    } catch (err) { console.error(err); }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (formData.gstPan) {
      const gstPanRegex = /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})|([A-Z]{5}[0-9]{4}[A-Z]{1})$/;
      if (!gstPanRegex.test(formData.gstPan.toUpperCase())) {
        errors.gstPan = "Invalid GSTIN or PAN format.";
      }
    }

    if (formData.floorAssignmentStartDate && formData.floorAssignmentEndDate) {
      const start = new Date(formData.floorAssignmentStartDate);
      const end = new Date(formData.floorAssignmentEndDate);
      if (end <= start) {
        errors.floorAssignmentEndDate = "End date must be greater than start date.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setDialog({
        title: "Validation Incomplete",
        message: "Please check the marked fields for errors and resolve them before continuing.",
        type: "warning"
      });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        idProofUrl: idProof ? idProof.name : '',
        profilePhotoUrl: profilePhoto ? profilePhoto.name : ''
      };
      await api.post('/users', payload);
      setDialog({
        title: "Account Provisioned",
        message: `${formData.name} was successfully registered and spatial privileges were set.`,
        type: "success"
      });
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setDialog({
        title: "Registration Failed",
        message: err.message || "Failed to provision user. Check for duplicate official emails or contact numbers.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filters
  const filteredFloors = formData.assignedProperties.length > 0 
    ? floors.filter(f => {
        if (!f.property) return false;
        const propId = typeof f.property === 'object' ? f.property._id : f.property;
        return formData.assignedProperties.some((id: string) => String(id) === String(propId));
      })
    : [];

  const filteredUnits = formData.assignedFloors.length > 0
    ? units.filter(u => {
        if (!u.floor) return false;
        const floorId = typeof u.floor === 'object' ? u.floor._id : u.floor;
        return formData.assignedFloors.some((id: string) => String(id) === String(floorId));
      })
    : [];

  // Calculations
  const totalAssignedFloorsCount = formData.assignedFloors.length;
  
  const totalManagedSft = formData.role === 'Office Owner'
    ? formData.assignedUnits.reduce((sum, unitId) => {
        const unit = units.find(u => u._id === unitId);
        return sum + (unit?.sqft || 0);
      }, 0)
    : formData.assignedFloors.reduce((sum, floorId) => {
        const floor = floors.find(f => f._id === floorId);
        return sum + (floor?.totalSft || 0);
      }, 0);

  const totalMonthlyAmount = formData.monthlyManagementAmount || 0;

  const remainingAvailableFloors = floors.filter(f => {
    if (!f.property) return false;
    const propId = typeof f.property === 'object' ? f.property._id : f.property;
    return formData.assignedProperties.includes(String(propId)) && 
      !f.assignedAdmin && 
      !formData.assignedFloors.includes(f._id);
  }).length;

  const StepBadge = ({ num }: { num: string }) => (
    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>
      {num}
    </div>
  );

  const showProfessionalSection = formData.role === 'Floor Admin' || formData.role === 'Office Owner';

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'var(--font-geist-sans)' }}>
      <style jsx global>{`
        @keyframes modalFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardSlide { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .dialog-overlay { animation: modalFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .dialog-card { animation: cardSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Sticky Header Nav */}
      <div className="position-sticky top-0 w-100 bg-white border-bottom shadow-sm" style={{ padding: '16px 24px', zIndex: 1000 }}>
        <div className="d-flex align-items-center justify-content-between mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="d-flex align-items-center gap-3">
            <Link href="/admin/users" className="btn btn-light border rounded-circle shadow-sm d-flex align-items-center justify-content-center transition-all" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-arrow-left text-dark" style={{ fontSize: '1.1rem' }}></i>
            </Link>
            <div>
              <h4 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Provision New Staff</h4>
              <p className="text-muted mb-0 small" style={{ fontSize: '0.8rem' }}>Create a secure account and assign hierarchical access.</p>
            </div>
          </div>
          <div>
            <span className="badge bg-primary bg-opacity-10 text-primary py-2 px-3 rounded-pill fw-bold" style={{ fontSize: '0.85rem' }}>
              Current Role: {formData.role}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 mx-auto" style={{ maxWidth: '1200px' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="row g-4">
            
            {/* Left Column: Form Fields */}
            <div className="col-lg-8">
              
              {/* STEP 1: General Info & Identity */}
              <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#ffffff' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <StepBadge num="1" />
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">Personnel Details</h5>
                      <p className="text-muted small mb-0">Basic credentials and contact profile info.</p>
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark mb-1">Full Name *</label>
                      <input type="text" className="form-control py-2 shadow-none" placeholder="e.g. Tungana Naveen" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark mb-1">Official Email ID *</label>
                      <input type="email" className={`form-control py-2 shadow-none ${validationErrors.email ? 'is-invalid' : ''}`} placeholder="office@gmail.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      {validationErrors.email && <div className="invalid-feedback small">{validationErrors.email}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark mb-1">Primary Role *</label>
                      <select className="form-select py-2 shadow-none fw-medium text-dark" required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                        {currentUser?.role === 'Floor Admin' ? (
                          <option value="Office Owner">Office Owner</option>
                        ) : (
                          <>
                            <option value="Floor Admin">Floor Admin</option>
                            <option value="Office Owner">Office Owner</option>
                            <option value="Staff Admin">Staff Admin</option>
                            <option value="Super Admin">Super Admin</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark mb-1">Temporary Password *</label>
                      <div className="position-relative">
                        <input type={showPassword ? "text" : "password"} className="form-control py-2 shadow-none" placeholder="123456" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', paddingRight: '40px' }} />
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''} position-absolute text-muted`} onClick={() => setShowPassword(!showPassword)} style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1rem' }}></i>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark mb-1">Mobile Number *</label>
                      <input type="tel" className={`form-control py-2 shadow-none ${validationErrors.phoneNumber ? 'is-invalid' : ''}`} placeholder="e.g. 08106651649" required value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      {validationErrors.phoneNumber && <div className="invalid-feedback small">{validationErrors.phoneNumber}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark mb-1">Alternate Contact Number</label>
                      <input type="tel" className="form-control py-2 shadow-none" placeholder="e.g. 08106651649" value={formData.emergencyNumber} onChange={(e) => setFormData({...formData, emergencyNumber: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark mb-1">Address *</label>
                      <input type="text" className="form-control py-2 shadow-none" placeholder="ohm sri shiva sai mens hostel" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: Spatial & Professional Allocation */}
              {showProfessionalSection && (
                <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#ffffff' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <StepBadge num="2" />
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">Office / Spatial Allocation & Agreement</h5>
                        <p className="text-muted small mb-0">Fill in organizational details, select properties, and determine agreement status rules.</p>
                      </div>
                    </div>

                    {/* Section 2.1: Professional details */}
                    <h6 className="fw-bold text-primary mb-3" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      <i className="bi bi-person-workspace me-2"></i>Professional Details Section
                    </h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Company / Organization Name</label>
                        <input type="text" className="form-control py-2 shadow-none" placeholder="e.g. Apex Tech Solutions" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Tenant Type</label>
                        <select className="form-select py-2 shadow-none" value={formData.tenantType} onChange={(e) => setFormData({...formData, tenantType: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="Individual">Individual</option>
                          <option value="Company">Company</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">GST / PAN Number</label>
                        <input type="text" className={`form-control py-2 shadow-none ${validationErrors.gstPan ? 'is-invalid' : ''}`} placeholder="e.g. 22AAAAA0000A1Z5" value={formData.gstPan} onChange={(e) => setFormData({...formData, gstPan: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        {validationErrors.gstPan && <div className="invalid-feedback small">{validationErrors.gstPan}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Emergency Contact Relation</label>
                        <input type="text" className="form-control py-2 shadow-none" placeholder="e.g. Brother, Spouse" style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">ID Proof Upload</label>
                        <div className="border rounded-3 p-2 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed' }}>
                          <input type="file" className="d-none" id="id-proof" onChange={(e) => setIdProof(e.target.files ? e.target.files[0] : null)} />
                          <label htmlFor="id-proof" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                            <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
                            <span className="small fw-semibold">{idProof ? idProof.name : 'Choose ID Proof File'}</span>
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Profile Photo Upload</label>
                        <div className="border rounded-3 p-2 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed' }}>
                          <input type="file" className="d-none" id="profile-photo" onChange={(e) => setProfilePhoto(e.target.files ? e.target.files[0] : null)} />
                          <label htmlFor="profile-photo" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                            <i className="bi bi-image text-primary me-2"></i>
                            <span className="small fw-semibold">{profilePhoto ? profilePhoto.name : 'Choose Image File'}</span>
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-dark mb-1">Remarks / Special Notes</label>
                        <textarea rows={2} className="form-control py-2 shadow-none" placeholder="Any internal assignment remarks..." value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}></textarea>
                      </div>
                    </div>

                    {/* Section 2.2: Spatial selection */}
                    <h6 className="fw-bold text-primary mb-3" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      <i className="bi bi-diagram-3-fill me-2"></i>Spatial Mapping Configuration
                    </h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Select Property *</label>
                        <MultiSelect 
                          options={properties} 
                          selectedIds={formData.assignedProperties} 
                          onChange={(ids: any) => setFormData({...formData, assignedProperties: ids, assignedFloors: [], assignedUnits: []})}
                          placeholder="Select Property"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Select Floors *</label>
                        <MultiSelect 
                          options={filteredFloors} 
                          selectedIds={formData.assignedFloors} 
                          onChange={(ids: any) => setFormData({...formData, assignedFloors: ids, assignedUnits: []})}
                          placeholder="Select Floor"
                        />
                      </div>
                      {formData.role === 'Office Owner' && (
                        <div className="col-12">
                          <label className="form-label small fw-bold text-dark mb-1">Units & Flats (Offices)</label>
                          <MultiSelect 
                            options={filteredUnits} 
                            selectedIds={formData.assignedUnits} 
                            onChange={(ids: any) => setFormData({...formData, assignedUnits: ids})}
                            placeholder="Select Offices"
                          />
                        </div>
                      )}
                    </div>

                    {/* Section 2.3: Financial settings */}
                    <h6 className="fw-bold text-primary mb-3" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      <i className="bi bi-wallet2 me-2"></i>Agreement & Invoicing Terms
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Floor Assignment Start Date *</label>
                        <input type="date" className="form-control py-2 shadow-none" required value={formData.floorAssignmentStartDate} onChange={(e) => handleStartDateChange(e.target.value)} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Floor Assignment End Date *</label>
                        <input type="date" className={`form-control py-2 shadow-none ${validationErrors.floorAssignmentEndDate ? 'is-invalid' : ''}`} required value={formData.floorAssignmentEndDate} onChange={(e) => setFormData({...formData, floorAssignmentEndDate: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        {validationErrors.floorAssignmentEndDate && <div className="invalid-feedback small">{validationErrors.floorAssignmentEndDate}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark mb-1">Monthly Management Amount *</label>
                        <input type="number" className="form-control py-2 shadow-none" required value={formData.monthlyManagementAmount} onChange={(e) => setFormData({...formData, monthlyManagementAmount: Number(e.target.value)})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark mb-1">Payment Type *</label>
                        <select className="form-select py-2 shadow-none" value={formData.paymentType} onChange={(e) => setFormData({...formData, paymentType: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark mb-1">Payment Due Day *</label>
                        <input type="number" className="form-control py-2 shadow-none" required min="1" max="31" value={formData.paymentDueDay} onChange={(e) => setFormData({...formData, paymentDueDay: Number(e.target.value)})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-dark mb-1">Agreement Status *</label>
                        <select className="form-select py-2 shadow-none" value={formData.agreementStatus} onChange={(e) => setFormData({...formData, agreementStatus: e.target.value})} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Expired">Expired</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Auto Roles & Permissions Preview */}
              <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#ffffff' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                    <StepBadge num="3" />
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">Assigned System Role Permissions</h5>
                      <p className="text-muted small mb-0">Permissions are automatically mapped to protect access control integrity.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <span className="small text-muted fw-bold text-uppercase d-block mb-1">Active Roles Configuration</span>
                    <strong className="text-dark fs-6 d-flex align-items-center gap-2">
                      <i className="bi bi-shield-lock-fill text-primary"></i> {formData.role} Access Group
                    </strong>
                  </div>

                  <div className="row g-2">
                    {AVAILABLE_PERMISSIONS.map(perm => {
                      const hasPerm = formData.permissions.includes(perm.id);
                      return (
                        <div className="col-md-4 col-sm-6" key={perm.id}>
                          <div className={`p-2 rounded-3 border d-flex align-items-center gap-2 transition-all ${hasPerm ? 'bg-white' : 'bg-light opacity-50'}`} style={{ border: hasPerm ? '1px solid #e2e8f0' : '1px solid #f1f5f9' }}>
                            <div className={`rounded-circle d-flex align-items-center justify-content-center ${hasPerm ? 'bg-success text-white' : 'bg-secondary text-white bg-opacity-25'}`} style={{ width: '20px', height: '20px', minWidth: '20px' }}>
                              {hasPerm ? <i className="bi bi-check" style={{ fontSize: '0.9rem' }}></i> : <i className="bi bi-dash" style={{ fontSize: '0.9rem' }}></i>}
                            </div>
                            <span className={`small fw-medium ${hasPerm ? 'text-dark fw-bold' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>{perm.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-3 mt-4">
                <Link href="/admin/users" className="btn btn-white border rounded-pill px-5 py-2 fw-bold text-dark shadow-sm bg-white">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-pill px-5 py-2 fw-bold text-white shadow-sm" 
                  disabled={isLoading}
                  style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  Provision Staff Account
                </button>
              </div>

            </div>

            {/* Right Column: Sticky Summary Panel */}
            <div className="col-lg-4">
              <div className="position-sticky" style={{ top: '90px', zIndex: 99 }}>
                
                {/* Visual Glassmorphism calculations panel */}
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white" style={{ border: '1px solid rgba(255,255,255,0.4)' }}>
                  <div className="p-4" style={{ background: 'linear-gradient(135deg, #014aad 0%, #0369a1 100%)', color: '#ffffff' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-calculator-fill fs-5"></i>
                      <h5 className="fw-bold mb-0">Real-Time Calculations</h5>
                    </div>
                    <span className="small opacity-75">Instant spatial & billing breakdown.</span>
                  </div>

                  <div className="card-body p-4 bg-light d-flex flex-column gap-3">
                    
                    {/* Stat Items */}
                    <div>
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1">Role Configuration</span>
                      <div className="fw-bold text-dark fs-5">{formData.role || 'Floor Admin'}</div>
                    </div>

                    <hr className="my-1 text-muted opacity-25" />

                    <div className="row g-2">
                      <div className="col-6">
                        <div className="p-3 bg-white border rounded-3 text-center">
                          <span className="text-muted small fw-medium d-block mb-1">Total Assigned Floors</span>
                          <div className="fs-4 fw-bold text-primary">{totalAssignedFloorsCount}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white border rounded-3 text-center">
                          <span className="text-muted small fw-medium d-block mb-1">Available Floors Left</span>
                          <div className="fs-4 fw-bold text-warning">{remainingAvailableFloors}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white border rounded-3 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-medium d-block">Total Managed Area</span>
                        <span className="small text-muted">SFT Allocation</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-4 fw-bold text-dark">{totalManagedSft.toLocaleString()}</span>
                        <span className="text-muted small d-block">SFT</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald bg-opacity-10 border border-emerald rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
                      <div>
                        <span className="text-dark small fw-bold d-block">Monthly Management Dues</span>
                        <span className="small text-muted">{formData.paymentType} billing cycle</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-4 fw-bold" style={{ color: '#014aad' }}>₹{totalMonthlyAmount.toLocaleString()}</span>
                        <span className="text-muted small d-block">INR</span>
                      </div>
                    </div>

                    {/* Status badge representation */}
                    <div className="d-flex align-items-center justify-content-between p-2 border rounded-3 bg-white">
                      <span className="small fw-semibold text-muted">Agreement Status</span>
                      <span className="badge rounded-pill px-3 py-2 fw-bold" style={{
                        fontSize: '0.75rem',
                        backgroundColor: formData.agreementStatus === 'Active' ? '#e6f4ea' :
                                         formData.agreementStatus === 'Pending' ? '#fef7e0' :
                                         formData.agreementStatus === 'Suspended' ? '#fce8e6' : '#f1f5f9',
                        color: formData.agreementStatus === 'Active' ? '#137333' :
                               formData.agreementStatus === 'Pending' ? '#b06000' :
                               formData.agreementStatus === 'Suspended' ? '#c5221f' : '#475569'
                      }}>
                        {formData.agreementStatus || 'Active'}
                      </span>
                    </div>

                    {/* Live Warning if dates are invalid */}
                    {validationErrors.floorAssignmentEndDate && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 p-2 rounded-3 mb-0" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <span>{validationErrors.floorAssignmentEndDate}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </form>
      </div>

      {/* CUSTOM PREMIUM DIALOG BOX OVERLAY */}
      {dialog && (
        <div className="dialog-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="dialog-card card border-0 shadow-lg p-4 text-center mx-3 rounded-4" style={{
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <div className="mb-3">
              {dialog.type === 'success' && <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3.5rem' }}></i>}
              {dialog.type === 'warning' && <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3.5rem' }}></i>}
              {dialog.type === 'error' && <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '3.5rem' }}></i>}
            </div>
            
            <h4 className="fw-bold text-dark mb-2">{dialog.title}</h4>
            <p className="text-secondary small mb-4 px-2" style={{ lineHeight: '1.5' }}>{dialog.message}</p>
            
            <button 
              type="button" 
              className="btn w-100 py-2 rounded-pill fw-bold text-white shadow-sm"
              onClick={() => setDialog(null)}
              style={{
                backgroundColor: dialog.type === 'success' ? '#10b981' :
                                 dialog.type === 'warning' ? '#f59e0b' : '#ef4444',
                borderColor: dialog.type === 'success' ? '#10b981' :
                             dialog.type === 'warning' ? '#f59e0b' : '#ef4444'
              }}
            >
              Okay, Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
