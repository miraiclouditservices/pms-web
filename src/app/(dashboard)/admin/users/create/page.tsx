"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from "@/utils/api";

const AVAILABLE_PERMISSIONS = [
  { id: 'view_properties', label: 'View Properties', module: 'Properties', icon: 'hgi-building-03' },
  { id: 'manage_properties', label: 'Manage Properties', module: 'Properties', icon: 'hgi-building-03' },
  { id: 'view_floors', label: 'View Floors', module: 'Floors', icon: 'hgi-layers-01' },
  { id: 'manage_floors', label: 'Manage Floors', module: 'Floors', icon: 'hgi-layers-01' },
  { id: 'view_tenants', label: 'View Tenants', module: 'Tenants', icon: 'hgi-user-group' },
  { id: 'manage_tenants', label: 'Manage Tenants', module: 'Tenants', icon: 'hgi-user-group' },
  { id: 'view_finance', label: 'View Finances', module: 'Finance', icon: 'hgi-invoice-01' },
  { id: 'manage_finance', label: 'Manage Finances', module: 'Finance', icon: 'hgi-invoice-01' },
  { id: 'manage_helpdesk', label: 'Manage Helpdesk', module: 'Operations', icon: 'hgi-headset' },
  { id: 'manage_visitors', label: 'Manage Visitors', module: 'Operations', icon: 'hgi-identity-card' },
  { id: 'view_analytics', label: 'View Analytics', module: 'Intelligence', icon: 'hgi-pie-chart' },
  { id: 'manage_staff', label: 'Manage Staff', module: 'System', icon: 'hgi-user-shield-01' }
];

// Custom MultiSelect Component with Hugeicons
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
        style={{ minHeight: '45px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 && <span className="text-muted small">{placeholder}</span>}
        {selectedItems.map((item: any) => (
          <span 
            key={item._id} 
            className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2 rounded-pill shadow-sm" 
            style={{ fontWeight: '500', fontSize: '0.8rem' }} 
            onClick={(e) => { e.stopPropagation(); handleSelect(item._id); }}
          >
            {item.name} <i className="hgi-stroke hgi-cancel-01 text-muted" style={{ cursor: 'pointer', fontSize: '0.85rem' }}></i>
          </span>
        ))}
        <i className="hgi-stroke hgi-arrow-down-01 ms-auto text-muted" style={{ fontSize: '0.9rem' }}></i>
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
                  {isSelected && <i className="hgi-stroke hgi-checkmark-circle-01 text-white" style={{ fontSize: '0.85rem', lineHeight: 1 }}></i>}
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
  
  // Steps state
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'FLOOR_ADMIN', permissions: [] as string[],
    assignedProperties: [] as string[], assignedFloors: [] as string[], assignedUnits: [] as string[],
    phoneNumber: '', emergencyNumber: '', address: '',
    companyName: '', tenantType: 'Individual', gstPan: '',
    floorAssignmentStartDate: '', floorAssignmentEndDate: '',
    monthlyManagementAmount: 0, totalAgreementAmount: 0, paymentType: 'Monthly Installment', paymentDueDay: 5,
    agreementStatus: 'Active', remarks: '', staffCategory: 'None'
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
          // If the logged in user is a Floor Admin, they can only provision 'OFFICE_OWNER'
          if (parsed.role === 'FLOOR_ADMIN') {
            setFormData(prev => ({ ...prev, role: 'OFFICE_OWNER' }));
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

        const startDate = new Date(val);
        if (!isNaN(startDate.getTime())) {
          const yearsToAdd = prev.role === 'OFFICE_OWNER' ? 3 : 1;
          const endDate = new Date(startDate);
          endDate.setFullYear(startDate.getFullYear() + yearsToAdd);
          endDate.setDate(endDate.getDate() - 1);
          
          const yyyy = endDate.getFullYear();
          const mm = String(endDate.getMonth() + 1).padStart(2, '0');
          const dd = String(endDate.getDate()).padStart(2, '0');
          updated.floorAssignmentEndDate = `${yyyy}-${mm}-${dd}`;
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

  // Auto-calculate end date if role changes and start date is present
  useEffect(() => {
    if (formData.floorAssignmentStartDate) {
      const startDate = new Date(formData.floorAssignmentStartDate);
      if (!isNaN(startDate.getTime())) {
        const yearsToAdd = formData.role === 'OFFICE_OWNER' ? 3 : 1;
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + yearsToAdd);
        endDate.setDate(endDate.getDate() - 1);
        
        const yyyy = endDate.getFullYear();
        const mm = String(endDate.getMonth() + 1).padStart(2, '0');
        const dd = String(endDate.getDate()).padStart(2, '0');
        
        setFormData(prev => ({
          ...prev,
          floorAssignmentEndDate: `${yyyy}-${mm}-${dd}`
        }));
      }
    }
  }, [formData.role, formData.floorAssignmentStartDate]);

  // Auto-map permissions based on selected Role
  useEffect(() => {
    let perms: string[] = [];
    if (formData.role === 'SUPER_ADMIN') {
      perms = AVAILABLE_PERMISSIONS.map(p => p.id);
    } else if (formData.role === 'STAFF_ADMIN') {
      perms = ['view_properties', 'view_floors', 'view_tenants', 'manage_tenants', 'manage_helpdesk', 'manage_visitors', 'view_analytics'];
    } else if (formData.role === 'FLOOR_ADMIN') {
      perms = ['view_properties', 'view_floors', 'view_tenants', 'manage_tenants', 'manage_helpdesk', 'manage_visitors', 'view_analytics'];
    } else if (formData.role === 'OFFICE_OWNER') {
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

  const validateStep = (stepNumber: number) => {
    const errors: Record<string, string> = {};
    
    if (stepNumber === 1) {
      if (!formData.name.trim()) errors.name = "Full name is required.";
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address.";
      }
      
      if (!formData.password || formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      }
      
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        errors.phoneNumber = "Phone number must be exactly 10 digits.";
      }

      if (formData.emergencyNumber && !phoneRegex.test(formData.emergencyNumber)) {
        errors.emergencyNumber = "Alternate phone number must be exactly 10 digits.";
      }
      
      if (!formData.address.trim()) errors.address = "Address is required.";
    }

    if (stepNumber === 2) {
      if (formData.role !== 'SUPER_ADMIN') {
        if (formData.assignedProperties.length === 0) {
          errors.properties = "Please select at least one property.";
        }
        if (formData.assignedFloors.length === 0) {
          errors.floors = "Please select at least one floor.";
        }
        if (formData.role === 'OFFICE_OWNER' && formData.assignedUnits.length === 0) {
          errors.units = "Please select at least one office/unit.";
        }
      }
    }

    if (stepNumber === 3) {
      if (formData.role !== 'STAFF_ADMIN' && formData.role !== 'SUPER_ADMIN') {
        if (!formData.floorAssignmentStartDate) {
          errors.floorAssignmentStartDate = "Start date is required.";
        }
        if (!formData.floorAssignmentEndDate) {
          errors.floorAssignmentEndDate = "End date is required.";
        } else if (formData.floorAssignmentStartDate) {
          const start = new Date(formData.floorAssignmentStartDate);
          const end = new Date(formData.floorAssignmentEndDate);
          if (end <= start) {
            errors.floorAssignmentEndDate = "End date must be greater than start date.";
          }
        }
        if (formData.monthlyManagementAmount <= 0) {
          errors.monthlyManagementAmount = "Monthly management amount must be greater than 0.";
        }
      }

      if (formData.gstPan) {
        const gstPanRegex = /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})|([A-Z]{5}[0-9]{4}[A-Z]{1})$/;
        if (!gstPanRegex.test(formData.gstPan.toUpperCase())) {
          errors.gstPan = "Invalid GSTIN or PAN format.";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      setDialog({
        title: "Validation Incomplete",
        message: "Please fill out all required fields correctly before moving to the next step.",
        type: "warning"
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.push('/admin/users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setDialog({
        title: "Validation Incomplete",
        message: "Please check all steps for validation errors before creating the user.",
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
        title: "User Registered",
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
  
  const totalManagedSft = formData.role === 'OFFICE_OWNER'
    ? formData.assignedUnits.reduce((sum, unitId) => {
        const unit = units.find(u => u._id === unitId);
        return sum + (unit?.sqft || 0);
      }, 0)
    : formData.assignedFloors.reduce((sum, floorId) => {
        const floor = floors.find(f => f._id === floorId);
        return sum + (floor?.totalSft || 0);
      }, 0);

  const getTermMonths = () => {
    if (!formData.floorAssignmentStartDate || !formData.floorAssignmentEndDate) return 12;
    const start = new Date(formData.floorAssignmentStartDate);
    const end = new Date(formData.floorAssignmentEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 12;
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return Math.max(diffMonths, 1);
  };

  const termMonths = getTermMonths();
  const monthlyRate = formData.monthlyManagementAmount || 0;
  const isOwner = formData.role === 'OFFICE_OWNER';
  
  // Calculate cycle payment & total term value
  const totalAgreementAmt = isOwner ? (formData.totalAgreementAmount || 0) : (monthlyRate * termMonths);
  
  const getInstallmentAmt = () => {
    if (!isOwner) {
      if (formData.paymentType === 'Quarterly') return monthlyRate * 3;
      if (formData.paymentType === 'Yearly') return monthlyRate * 12;
      return monthlyRate;
    }
    if (formData.paymentType === 'One Time') return totalAgreementAmt;
    if (formData.paymentType === 'Custom Installment') return 0;
    
    const divisor = formData.paymentType === 'Monthly Installment' ? termMonths
      : formData.paymentType === 'Quarterly Installment' ? Math.ceil(termMonths / 3)
      : formData.paymentType === 'Half-Yearly Installment' ? Math.ceil(termMonths / 6)
      : formData.paymentType === 'Yearly Installment' ? Math.ceil(termMonths / 12)
      : 1;
    return Math.ceil(totalAgreementAmt / Math.max(1, divisor));
  };

  const installmentAmt = getInstallmentAmt();
  const pendingBal = totalAgreementAmt; // 0 paid on creation
  
  const getInitialPayStatus = () => {
    if (totalAgreementAmt === 0) return 'Paid';
    if (formData.floorAssignmentStartDate) {
      const start = new Date(formData.floorAssignmentStartDate);
      const today = new Date();
      if (today > start) {
        const dueDay = formData.paymentDueDay || 5;
        const currentMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
        if (today > currentMonthDue) {
          return 'Overdue';
        }
      }
    }
    return 'Pending';
  };
  const initialPayStatus = getInitialPayStatus();
  
  let cyclePayment = monthlyRate;
  if (formData.paymentType === 'Quarterly') {
    cyclePayment = monthlyRate * 3;
  } else if (formData.paymentType === 'Yearly') {
    cyclePayment = monthlyRate * 12;
  }
  
  const totalTermAmount = monthlyRate * termMonths;

  const remainingAvailableFloors = floors.filter(f => {
    if (!f.property) return false;
    const propId = typeof f.property === 'object' ? f.property._id : f.property;
    return formData.assignedProperties.includes(String(propId)) && 
      !f.assignedAdmin && 
      !formData.assignedFloors.includes(f._id);
  }).length;

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
              <i className="hgi-stroke hgi-arrow-left-01 text-dark" style={{ fontSize: '1.1rem' }}></i>
            </Link>
            <div>
              <h4 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Create New User</h4>
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
        
        {/* Desktop Header Stepper Wizard */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white d-none d-md-block">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between">
              
              {/* Step 1 */}
              <div className="d-flex align-items-center gap-2">
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${currentStep === 1 ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>1</div>
                <div>
                  <div className={`small fw-bold ${currentStep === 1 ? 'text-dark' : 'text-muted'}`}>Personal Details</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Basic information</div>
                </div>
              </div>
              <div className="flex-grow-1 mx-3 border-top border-dashed" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}></div>
              
              {/* Step 2 */}
              <div className="d-flex align-items-center gap-2">
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${currentStep === 2 ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>2</div>
                <div>
                  <div className={`small fw-bold ${currentStep === 2 ? 'text-dark' : 'text-muted'}`}>Office Setup</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Property & floor</div>
                </div>
              </div>
              <div className="flex-grow-1 mx-3 border-top border-dashed" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}></div>

              {/* Step 3 */}
              <div className="d-flex align-items-center gap-2">
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${currentStep === 3 ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>3</div>
                <div>
                  <div className={`small fw-bold ${currentStep === 3 ? 'text-dark' : 'text-muted'}`}>Billing & Agreement</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Payment & terms</div>
                </div>
              </div>
              <div className="flex-grow-1 mx-3 border-top border-dashed" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}></div>

              {/* Step 4 */}
              <div className="d-flex align-items-center gap-2">
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${currentStep === 4 ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>4</div>
                <div>
                  <div className={`small fw-bold ${currentStep === 4 ? 'text-dark' : 'text-muted'}`}>Permissions</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Role permissions</div>
                </div>
              </div>
              <div className="flex-grow-1 mx-3 border-top border-dashed" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}></div>

              {/* Step 5 */}
              <div className="d-flex align-items-center gap-2">
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${currentStep === 5 ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>5</div>
                <div>
                  <div className={`small fw-bold ${currentStep === 5 ? 'text-dark' : 'text-muted'}`}>Review</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Confirm & create</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile/Tablet Header Stepper Wizard Progress */}
        <div className="d-md-none mb-3 p-3 bg-white rounded-4 shadow-sm border">
          <div className="d-flex justify-content-between align-items-center">
            <span className="small text-muted fw-bold">Step {currentStep} of 5</span>
            <span className="badge bg-primary rounded-pill py-1.5 px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
              {currentStep === 1 && 'Personal Details'}
              {currentStep === 2 && 'Office Setup'}
              {currentStep === 3 && 'Billing & Agreement'}
              {currentStep === 4 && 'Permissions'}
              {currentStep === 5 && 'Review & Confirm'}
            </span>
          </div>
          <div className="progress mt-2" style={{ height: '6px', borderRadius: '3px' }}>
            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(currentStep / 5) * 100}%`, borderRadius: '3px' }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            
            {/* Left Column: Form Steps Card */}
            <div className="col-lg-8">
              
              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px' }}>
                        <i className="hgi-stroke hgi-user" style={{ fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">Personal Information</h5>
                        <p className="text-muted small mb-0">Provide basic credentials and contact information.</p>
                      </div>
                    </div>
                    
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Full Name *</label>
                        <div className={`d-flex align-items-center form-control bg-white px-3 py-2 ${validationErrors.name ? 'is-invalid' : ''}`} style={{ border: validationErrors.name ? '1px solid var(--bs-danger)' : '1px solid #cbd5e1', borderRadius: '8px', gap: '10px' }}>
                          <i className="hgi-stroke hgi-user text-muted" style={{ fontSize: '1.1rem' }}></i>
                          <input type="text" className="border-0 p-0 w-100 shadow-none text-dark" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} placeholder="e.g. Tungana Naveen" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        {validationErrors.name && <div className="invalid-feedback small d-block mt-1">{validationErrors.name}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Official Email ID *</label>
                        <div className={`d-flex align-items-center form-control bg-white px-3 py-2 ${validationErrors.email ? 'is-invalid' : ''}`} style={{ border: validationErrors.email ? '1px solid var(--bs-danger)' : '1px solid #cbd5e1', borderRadius: '8px', gap: '10px' }}>
                          <i className="hgi-stroke hgi-mail-01 text-muted" style={{ fontSize: '1.1rem' }}></i>
                          <input type="email" className="border-0 p-0 w-100 shadow-none text-dark" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} placeholder="office@gmail.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        {validationErrors.email && <div className="invalid-feedback small d-block mt-1">{validationErrors.email}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Primary Role *</label>
                        <div className="d-flex align-items-center form-control bg-white px-3 py-2" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', gap: '10px' }}>
                          <i className="hgi-stroke hgi-user-shield-01 text-muted" style={{ fontSize: '1.1rem' }}></i>
                          <select className="border-0 p-0 w-100 shadow-none text-dark fw-medium" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent', cursor: 'pointer' }} required value={formData.role} 
                            onChange={(e) => {
                              const r = e.target.value;
                              setFormData(prev => ({ 
                                ...prev, 
                                role: r, 
                                staffCategory: r === 'STAFF_ADMIN' ? 'Security' : 'None',
                                assignedProperties: [], assignedFloors: [], assignedUnits: []
                              }));
                            }} 
                          >
                            {currentUser?.role === 'FLOOR_ADMIN' ? (
                              <option value="OFFICE_OWNER">OFFICE_OWNER</option>
                            ) : (
                              <>
                                <option value="FLOOR_ADMIN">FLOOR_ADMIN</option>
                                <option value="OFFICE_OWNER">OFFICE_OWNER</option>
                                <option value="STAFF_ADMIN">STAFF_ADMIN</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {formData.role === 'STAFF_ADMIN' && (
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Staff Category *</label>
                          <div className="d-flex align-items-center form-control bg-white px-3 py-2" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', gap: '10px' }}>
                            <i className="hgi-stroke hgi-user text-muted" style={{ fontSize: '1.1rem' }}></i>
                            <select className="border-0 p-0 w-100 shadow-none text-dark fw-medium" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent', cursor: 'pointer' }} required value={formData.staffCategory} 
                              onChange={(e) => setFormData({...formData, staffCategory: e.target.value})} 
                            >
                              <option value="Security">Security / Guard</option>
                              <option value="Watchman">Watchman / Caretaker</option>
                              <option value="Electrician">Electrician</option>
                              <option value="Plumber">Plumber</option>
                              <option value="Helpdesk">Helpdesk Executive</option>
                              <option value="Gardener">Gardener</option>
                              <option value="Housekeeping">Housekeeping / Cleaner</option>
                              <option value="Supervisor">Supervisor</option>
                              <option value="Other">Other Staff</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Temporary Password *</label>
                        <div className={`d-flex align-items-center form-control bg-white px-3 py-2 ${validationErrors.password ? 'is-invalid' : ''}`} style={{ border: validationErrors.password ? '1px solid var(--bs-danger)' : '1px solid #cbd5e1', borderRadius: '8px', gap: '10px' }}>
                          <i className="hgi-stroke hgi-lock text-muted" style={{ fontSize: '1.1rem' }}></i>
                          <input type={showPassword ? "text" : "password"} className="border-0 p-0 w-100 shadow-none text-dark" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} placeholder="123456" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                          <i className={`hgi-stroke ${showPassword ? 'hgi-eye' : 'hgi-eye'} text-muted cursor-pointer`} onClick={() => setShowPassword(!showPassword)} style={{ fontSize: '1.1rem' }}></i>
                        </div>
                        {validationErrors.password && <div className="invalid-feedback small d-block mt-1">{validationErrors.password}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Mobile Number *</label>
                        <div className={`d-flex align-items-center form-control bg-white px-3 py-2 ${validationErrors.phoneNumber ? 'is-invalid' : ''}`} style={{ border: validationErrors.phoneNumber ? '1px solid var(--bs-danger)' : '1px solid #cbd5e1', borderRadius: '8px' }}>
                          <span className="d-flex align-items-center gap-1 me-2 pe-2 border-end text-muted" style={{ fontSize: '0.9rem' }}>
                            <span>🇮🇳</span>
                            <span className="small fw-semibold text-dark">+91</span>
                            <i className="hgi-stroke hgi-arrow-down-01" style={{ fontSize: '0.7rem' }}></i>
                          </span>
                          <input type="tel" className="border-0 p-0 w-100 shadow-none text-dark" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} placeholder="08106651649" required value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                        </div>
                        {validationErrors.phoneNumber && <div className="invalid-feedback small d-block mt-1">{validationErrors.phoneNumber}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-1">Alternate Contact Number</label>
                        <div className={`d-flex align-items-center form-control bg-white px-3 py-2 ${validationErrors.emergencyNumber ? 'is-invalid' : ''}`} style={{ border: validationErrors.emergencyNumber ? '1px solid var(--bs-danger)' : '1px solid #cbd5e1', borderRadius: '8px' }}>
                          <span className="d-flex align-items-center gap-1 me-2 pe-2 border-end text-muted" style={{ fontSize: '0.9rem' }}>
                            <span>🇮🇳</span>
                            <span className="small fw-semibold text-dark">+91</span>
                            <i className="hgi-stroke hgi-arrow-down-01" style={{ fontSize: '0.7rem' }}></i>
                          </span>
                          <input type="tel" className="border-0 p-0 w-100 shadow-none text-dark" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} placeholder="08106651649" value={formData.emergencyNumber} onChange={(e) => setFormData({...formData, emergencyNumber: e.target.value})} />
                        </div>
                        {validationErrors.emergencyNumber && <div className="invalid-feedback small d-block mt-1">{validationErrors.emergencyNumber}</div>}
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-dark mb-1">Address *</label>
                        <div className={`d-flex align-items-center form-control bg-white px-3 py-2 ${validationErrors.address ? 'is-invalid' : ''}`} style={{ border: validationErrors.address ? '1px solid var(--bs-danger)' : '1px solid #cbd5e1', borderRadius: '8px', gap: '10px' }}>
                          <i className="hgi-stroke hgi-location-01 text-muted" style={{ fontSize: '1.1rem' }}></i>
                          <input type="text" className="border-0 p-0 w-100 shadow-none text-dark" style={{ outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} placeholder="ohm sri shiva sai mens hostel" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                        </div>
                        {validationErrors.address && <div className="invalid-feedback small d-block mt-1">{validationErrors.address}</div>}
                      </div>
                    </div>

                    {/* Information Banner */}
                    <div className="p-3 bg-primary bg-opacity-5 rounded-3 border border-primary border-opacity-10 d-flex align-items-start gap-2 mt-4">
                      <i className="hgi-stroke hgi-shield-01 text-primary mt-0.5" style={{ fontSize: '1.1rem' }}></i>
                      <span className="small text-secondary" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                        A temporary password will be shared with the user to login and change it on first access.
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* Step 2: Office Setup */}
              {currentStep === 2 && (
                <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px' }}>
                        <i className="hgi-stroke hgi-building-03" style={{ fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">Office Setup</h5>
                        <p className="text-muted small mb-0">Select property and floor details for user deployment.</p>
                      </div>
                    </div>

                    {formData.role === 'SUPER_ADMIN' ? (
                      <div className="text-center p-5 border rounded-3 bg-light">
                        <div className="mb-3">
                          <i className="hgi-stroke hgi-information-circle text-primary" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h5 className="fw-bold text-dark">Step Not Required</h5>
                        <p className="text-muted small max-w-md mx-auto mb-0">Spatial assignment is not required for the SUPER_ADMIN role. Click "Next" to configure permissions.</p>
                      </div>
                    ) : (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label small fw-bold text-dark mb-1">Select Property *</label>
                          <MultiSelect 
                            options={properties} 
                            selectedIds={formData.assignedProperties} 
                            onChange={(ids: any) => setFormData({...formData, assignedProperties: ids, assignedFloors: [], assignedUnits: []})}
                            placeholder="Select Property"
                          />
                          {validationErrors.properties && <div className="text-danger small mt-1">{validationErrors.properties}</div>}
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold text-dark mb-1">Select Floors *</label>
                          <MultiSelect 
                            options={filteredFloors} 
                            selectedIds={formData.assignedFloors} 
                            onChange={(ids: any) => setFormData({...formData, assignedFloors: ids, assignedUnits: []})}
                            placeholder="Select Floor"
                          />
                          {validationErrors.floors && <div className="text-danger small mt-1">{validationErrors.floors}</div>}
                        </div>
                        {formData.role === 'OFFICE_OWNER' && (
                          <div className="col-12">
                            <label className="form-label small fw-bold text-dark mb-1">Units & Flats (Offices) *</label>
                            <MultiSelect 
                              options={filteredUnits} 
                              selectedIds={formData.assignedUnits} 
                              onChange={(ids: any) => setFormData({...formData, assignedUnits: ids})}
                              placeholder="Select Offices"
                            />
                            {validationErrors.units && <div className="text-danger small mt-1">{validationErrors.units}</div>}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Step 3: Billing & Agreement */}
              {currentStep === 3 && (
                <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px' }}>
                        <i className="hgi-stroke hgi-invoice-01" style={{ fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">Billing & Agreement</h5>
                        <p className="text-muted small mb-0">Fill in lease agreement terms, billing cycle, and financials.</p>
                      </div>
                    </div>

                    {formData.role === 'SUPER_ADMIN' || formData.role === 'STAFF_ADMIN' ? (
                      <div className="text-center p-5 border rounded-3 bg-light">
                        <div className="mb-3">
                          <i className="hgi-stroke hgi-information-circle text-primary" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h5 className="fw-bold text-dark">Step Not Required</h5>
                        <p className="text-muted small max-w-md mx-auto mb-0">Billing & agreement setup is not required for the {formData.role} role. Click "Next" to continue.</p>
                      </div>
                    ) : (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Company / Organization Name</label>
                          <input type="text" className="form-control py-2 shadow-none" placeholder="e.g. Apex Tech Solutions" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Tenant Type</label>
                          <select className="form-select py-2 shadow-none" value={formData.tenantType} onChange={(e) => setFormData({...formData, tenantType: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                            <option value="Individual">Individual</option>
                            <option value="Company">Company</option>
                            <option value="Corporate">Corporate</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">GST / PAN Number</label>
                          <input type="text" className={`form-control py-2 shadow-none ${validationErrors.gstPan ? 'is-invalid' : ''}`} placeholder="e.g. 22AAAAA0000A1Z5" value={formData.gstPan} onChange={(e) => setFormData({...formData, gstPan: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          {validationErrors.gstPan && <div className="invalid-feedback small">{validationErrors.gstPan}</div>}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Agreement Status *</label>
                          <select className="form-select py-2 shadow-none" value={formData.agreementStatus} onChange={(e) => setFormData({...formData, agreementStatus: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Expired">Expired</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">ID Proof Upload</label>
                          <div className="border rounded-3 p-2 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}>
                            <input type="file" className="d-none" id="id-proof" onChange={(e) => setIdProof(e.target.files ? e.target.files[0] : null)} />
                            <label htmlFor="id-proof" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                              <i className="hgi-stroke hgi-invoice-01 text-primary me-2"></i>
                              <span className="small fw-semibold">{idProof ? idProof.name : 'Choose ID Proof File'}</span>
                            </label>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Profile Photo Upload</label>
                          <div className="border rounded-3 p-2 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}>
                            <input type="file" className="d-none" id="profile-photo" onChange={(e) => setProfilePhoto(e.target.files ? e.target.files[0] : null)} />
                            <label htmlFor="profile-photo" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                              <i className="hgi-stroke hgi-user text-primary me-2"></i>
                              <span className="small fw-semibold">{profilePhoto ? profilePhoto.name : 'Choose Image File'}</span>
                            </label>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Floor Assignment Start Date *</label>
                          <input type="date" className={`form-control py-2 shadow-none ${validationErrors.floorAssignmentStartDate ? 'is-invalid' : ''}`} required value={formData.floorAssignmentStartDate} onChange={(e) => handleStartDateChange(e.target.value)} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          {validationErrors.floorAssignmentStartDate && <div className="invalid-feedback small">{validationErrors.floorAssignmentStartDate}</div>}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark mb-1">Floor Assignment End Date *</label>
                          <input type="date" className={`form-control py-2 shadow-none ${validationErrors.floorAssignmentEndDate ? 'is-invalid' : ''}`} required value={formData.floorAssignmentEndDate} onChange={(e) => setFormData({...formData, floorAssignmentEndDate: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          {validationErrors.floorAssignmentEndDate && <div className="invalid-feedback small">{validationErrors.floorAssignmentEndDate}</div>}
                        </div>

                        {formData.role === 'OFFICE_OWNER' ? (
                          <>
                            <div className="col-md-4">
                              <label className="form-label small fw-bold text-dark mb-1">Total Agreement Amount *</label>
                              <input type="number" className="form-control py-2 shadow-none" required value={formData.totalAgreementAmount} onChange={(e) => setFormData({...formData, totalAgreementAmount: Number(e.target.value)})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                            </div>

                            <div className="col-md-4">
                              <label className="form-label small fw-bold text-dark mb-1">Payment Type *</label>
                              <select className="form-select py-2 shadow-none" value={formData.paymentType} onChange={(e) => setFormData({...formData, paymentType: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                                <option value="One Time">One Time</option>
                                <option value="Monthly Installment">Monthly Installment</option>
                                <option value="Quarterly Installment">Quarterly Installment</option>
                                <option value="Half-Yearly Installment">Half-Yearly Installment</option>
                                <option value="Yearly Installment">Yearly Installment</option>
                                <option value="Custom Installment">Custom Installment</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="col-md-4">
                              <label className="form-label small fw-bold text-dark mb-1">Monthly Management Amount *</label>
                              <input type="number" className="form-control py-2 shadow-none" required value={formData.monthlyManagementAmount} onChange={(e) => setFormData({...formData, monthlyManagementAmount: Number(e.target.value)})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                            </div>

                            <div className="col-md-4">
                              <label className="form-label small fw-bold text-dark mb-1">Payment Type *</label>
                              <select className="form-select py-2 shadow-none" value={formData.paymentType} onChange={(e) => setFormData({...formData, paymentType: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                              </select>
                            </div>
                          </>
                        )}

                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-dark mb-1">Payment Due Day *</label>
                          <input type="number" className="form-control py-2 shadow-none" required min="1" max="31" value={formData.paymentDueDay} onChange={(e) => setFormData({...formData, paymentDueDay: Number(e.target.value)})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>

                        <div className="col-12">
                          <label className="form-label small fw-bold text-dark mb-1">Remarks / Special Notes</label>
                          <textarea rows={2} className="form-control py-2 shadow-none" placeholder="Any internal assignment remarks..." value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}></textarea>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Step 4: Permissions */}
              {currentStep === 4 && (
                <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px' }}>
                        <i className="hgi-stroke hgi-user-shield-01" style={{ fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">Permissions</h5>
                        <p className="text-muted small mb-0">Permissions are automatically mapped to protect access control integrity.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <span className="small text-muted fw-bold text-uppercase d-block mb-1">Active Roles Configuration</span>
                      <strong className="text-dark fs-6 d-flex align-items-center gap-2">
                        <i className="hgi-stroke hgi-shield-01 text-primary"></i> {formData.role} Access Group
                      </strong>
                    </div>

                    <div className="row g-2">
                      {AVAILABLE_PERMISSIONS.map(perm => {
                        const hasPerm = formData.permissions.includes(perm.id);
                        return (
                          <div className="col-md-4 col-sm-6" key={perm.id}>
                            <div className={`p-2 rounded-3 border d-flex align-items-center gap-2 transition-all ${hasPerm ? 'bg-white' : 'bg-light opacity-50'}`} style={{ border: hasPerm ? '1px solid #e2e8f0' : '1px solid #f1f5f9' }}>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center ${hasPerm ? 'bg-success text-white' : 'bg-secondary text-white bg-opacity-25'}`} style={{ width: '20px', height: '20px', minWidth: '20px' }}>
                                {hasPerm ? <i className="hgi-stroke hgi-checkmark-circle-01" style={{ fontSize: '0.9rem' }}></i> : <i className="hgi-stroke hgi-cancel-01" style={{ fontSize: '0.8rem' }}></i>}
                              </div>
                              <span className={`small fw-medium ${hasPerm ? 'text-dark fw-bold' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>{perm.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Confirm */}
              {currentStep === 5 && (
                <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px' }}>
                        <i className="hgi-stroke hgi-checkmark-circle-01" style={{ fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">Review User Profile</h5>
                        <p className="text-muted small mb-0">Deep check the information below before creating the user account.</p>
                      </div>
                    </div>

                    <div className="d-flex flex-column gap-4">
                      
                      {/* Section 1: Personal Details */}
                      <div>
                        <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                          <i className="hgi-stroke hgi-user me-2"></i>Personal Information Summary
                        </h6>
                        <div className="row g-2">
                          <div className="col-sm-6">
                            <span className="text-muted small d-block">Full Name</span>
                            <strong className="text-dark small">{formData.name || 'Not specified'}</strong>
                          </div>
                          <div className="col-sm-6">
                            <span className="text-muted small d-block">Official Email</span>
                            <strong className="text-dark small">{formData.email || 'Not specified'}</strong>
                          </div>
                          <div className="col-sm-6">
                            <span className="text-muted small d-block">System Role</span>
                            <strong className="text-dark small">{formData.role || 'Not specified'}</strong>
                          </div>
                          <div className="col-sm-6">
                            <span className="text-muted small d-block">Contact Phone</span>
                            <strong className="text-dark small">+91 {formData.phoneNumber || 'Not specified'}</strong>
                          </div>
                          <div className="col-12">
                            <span className="text-muted small d-block">Address</span>
                            <strong className="text-dark small">{formData.address || 'Not specified'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Spatial Assignment */}
                      {formData.role !== 'SUPER_ADMIN' && (
                        <div>
                          <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                            <i className="hgi-stroke hgi-building-03 me-2"></i>Spatial Assignment Summary
                          </h6>
                          <div className="row g-2">
                            <div className="col-12">
                              <span className="text-muted small d-block">Assigned Properties</span>
                              <strong className="text-dark small">
                                {formData.assignedProperties.length > 0 
                                  ? properties.filter(p => formData.assignedProperties.includes(p._id)).map(p => p.name).join(', ')
                                  : 'None selected'}
                              </strong>
                            </div>
                            <div className="col-12">
                              <span className="text-muted small d-block">Assigned Floors</span>
                              <strong className="text-dark small">
                                {formData.assignedFloors.length > 0 
                                  ? floors.filter(f => formData.assignedFloors.includes(f._id)).map(f => f.floorName || `Floor ${f.floorNumber}`).join(', ')
                                  : 'None selected'}
                              </strong>
                            </div>
                            {formData.role === 'OFFICE_OWNER' && (
                              <div className="col-12">
                                <span className="text-muted small d-block">Assigned Offices (Units)</span>
                                <strong className="text-dark small">
                                  {formData.assignedUnits.length > 0 
                                    ? units.filter(u => formData.assignedUnits.includes(u._id)).map(u => `Unit ${u.unitNumber}`).join(', ')
                                    : 'None selected'}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Invoicing Terms */}
                      {formData.role !== 'SUPER_ADMIN' && formData.role !== 'STAFF_ADMIN' && (
                        <div>
                          <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                            <i className="hgi-stroke hgi-invoice-01 me-2"></i>Agreement & Financials Summary
                          </h6>
                          <div className="row g-2">
                            <div className="col-sm-6">
                              <span className="text-muted small d-block">Company Name</span>
                              <strong className="text-dark small">{formData.companyName || 'Not specified'}</strong>
                            </div>
                            <div className="col-sm-6">
                              <span className="text-muted small d-block">GSTIN / PAN</span>
                              <strong className="text-dark small">{formData.gstPan || 'Not specified'}</strong>
                            </div>
                            <div className="col-sm-6">
                              <span className="text-muted small d-block">Lease Term</span>
                              <strong className="text-dark small">
                                {formData.floorAssignmentStartDate} to {formData.floorAssignmentEndDate} ({termMonths} mos)
                              </strong>
                            </div>
                            <div className="col-sm-6">
                              <span className="text-muted small d-block">Agreement Status</span>
                              <strong className="text-dark small">{formData.agreementStatus}</strong>
                            </div>
                            {isOwner ? (
                              <>
                                <div className="col-sm-4">
                                  <span className="text-muted small d-block">Total Agreement Amount</span>
                                  <strong className="text-dark small">₹{totalAgreementAmt.toLocaleString()}</strong>
                                </div>
                                <div className="col-sm-4">
                                  <span className="text-muted small d-block">Installment Amount</span>
                                  <strong className="text-dark small">₹{installmentAmt.toLocaleString()}</strong>
                                </div>
                                <div className="col-sm-4">
                                  <span className="text-muted small d-block">Payment Cycle</span>
                                  <strong className="text-dark small">{formData.paymentType}</strong>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="col-sm-4">
                                  <span className="text-muted small d-block">Monthly Rate</span>
                                  <strong className="text-dark small">₹{monthlyRate.toLocaleString()}</strong>
                                </div>
                                <div className="col-sm-4">
                                  <span className="text-muted small d-block">Payment Cycle</span>
                                  <strong className="text-dark small">{formData.paymentType}</strong>
                                </div>
                              </>
                            )}
                            <div className="col-sm-4">
                              <span className="text-muted small d-block">Monthly Due Day</span>
                              <strong className="text-dark small">{formData.paymentDueDay}th</strong>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="d-flex justify-content-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={handlePrevStep} 
                  className="btn btn-white border rounded-pill px-4 py-2 fw-bold text-dark shadow-sm bg-white"
                >
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </button>
                
                {currentStep < 5 ? (
                  <button 
                    type="button" 
                    onClick={handleNextStep} 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold text-white shadow-sm d-flex align-items-center gap-1"
                    style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}
                  >
                    <span>Next</span>
                    <i className="hgi-stroke hgi-arrow-right-01" style={{ fontSize: '0.95rem' }}></i>
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold text-white shadow-sm" 
                    disabled={isLoading}
                    style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}
                  >
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    Create User Account
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: User Summary Live Panel */}
            <div className="col-lg-4">
              <div className="position-sticky" style={{ top: '90px', zIndex: 99 }}>
                
                {/* Summary Card */}
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white" style={{ border: '1px solid rgba(255,255,255,0.4)' }}>
                  <div className="p-4 bg-white border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '40px', height: '40px' }}>
                        <i className="hgi-stroke hgi-user-group" style={{ fontSize: '1.2rem' }}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">User Summary</h5>
                        <span className="text-muted small">Live preview of user configuration</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-4 bg-white d-flex flex-column gap-3">
                    
                    {/* Role Display */}
                    <div>
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.7rem' }}>Role</span>
                      <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                        <i className="hgi-stroke hgi-user-shield-01 text-primary" style={{ fontSize: '1.25rem' }}></i>
                        <span>{formData.role || 'FLOOR_ADMIN'}</span>
                      </div>
                    </div>

                    <hr className="my-1 text-muted opacity-25" />

                    {/* Stat Grid */}
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="p-3 bg-light border rounded-3 text-center">
                          <span className="text-muted small fw-medium d-block mb-1" style={{ fontSize: '0.75rem' }}>Total Assigned Floors</span>
                          <div className="fs-4 fw-bold text-primary">{totalAssignedFloorsCount}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-light border rounded-3 text-center">
                          <span className="text-muted small fw-medium d-block mb-1" style={{ fontSize: '0.75rem' }}>Available Floors Left</span>
                          <div className="fs-4 fw-bold text-warning">{remainingAvailableFloors}</div>
                        </div>
                      </div>
                    </div>

                    {/* Total Area */}
                    <div className="p-3 bg-light border rounded-3 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-medium d-block" style={{ fontSize: '0.8rem' }}>Total Managed Area</span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>SFT Allocation</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-5 fw-bold text-dark">{totalManagedSft.toLocaleString()}</span>
                        <span className="text-muted small fw-semibold ms-1">SFT</span>
                      </div>
                    </div>

                    {/* Billing Breakdown */}
                    {formData.role !== 'STAFF_ADMIN' && formData.role !== 'SUPER_ADMIN' && (
                      <>
                        <div className="p-3 bg-light border rounded-3 d-flex flex-column gap-2">
                          <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Payment Overview</span>
                          
                          <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                            <span className="text-muted small">Billing Cycle</span>
                            <span className="fw-bold text-dark small">{formData.paymentType}</span>
                          </div>

                          {isOwner ? (
                            <>
                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Agreement Duration</span>
                                <span className="fw-bold text-dark small">{termMonths} Months</span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Total Agreement Amount</span>
                                <span className="fw-bold text-success small">₹{totalAgreementAmt.toLocaleString()}</span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Pending Balance</span>
                                <span className="fw-bold text-danger small">₹{pendingBal.toLocaleString()}</span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Next Installment Due</span>
                                <span className="fw-bold text-primary small">₹{installmentAmt.toLocaleString()}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Monthly Rate</span>
                                <span className="fw-bold text-dark small">₹{monthlyRate.toLocaleString()} / mo</span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Pay per Cycle ({formData.paymentType})</span>
                                <span className="fw-bold text-primary small">₹{cyclePayment.toLocaleString()}</span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                <span className="text-muted small">Total Term Value ({termMonths} mos)</span>
                                <span className="fw-bold text-success small">₹{totalTermAmount.toLocaleString()}</span>
                              </div>
                            </>
                          )}

                          <div className="p-2 bg-primary bg-opacity-5 rounded mt-1 border border-primary border-opacity-10">
                            <div className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                              <i className="hgi-stroke hgi-calendar-01 text-primary me-1"></i>
                              Due Date: Payments must be paid on or before the <strong className="text-dark">{formData.paymentDueDay || 5}th</strong> day of each billing period.
                            </div>
                          </div>
                        </div>

                        {/* Status Badge Row */}
                        <div className="d-flex align-items-center justify-content-between p-2 border rounded-3 bg-white">
                          <span className="small fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Payment Status</span>
                          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{
                            fontSize: '0.75rem',
                            backgroundColor: initialPayStatus === 'Paid' ? '#e6f4ea' :
                                             initialPayStatus === 'Overdue' ? '#fce8e6' : '#fef7e0',
                            color: initialPayStatus === 'Paid' ? '#137333' :
                                   initialPayStatus === 'Overdue' ? '#c5221f' : '#b06000'
                          }}>
                            {initialPayStatus}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Validation warning */}
                    {validationErrors.floorAssignmentEndDate && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 p-2 rounded-3 mb-0" style={{ fontSize: '0.8rem' }}>
                        <i className="hgi-stroke hgi-information-circle"></i>
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
              {dialog.type === 'success' && <i className="hgi-stroke hgi-checkmark-circle-01 text-success" style={{ fontSize: '3.5rem' }}></i>}
              {dialog.type === 'warning' && <i className="hgi-stroke hgi-information-circle text-warning" style={{ fontSize: '3.5rem' }}></i>}
              {dialog.type === 'error' && <i className="hgi-stroke hgi-cancel-01 text-danger" style={{ fontSize: '3.5rem' }}></i>}
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
