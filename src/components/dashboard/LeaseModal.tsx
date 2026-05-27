"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
  editData?: any;
  mode?: "create" | "edit" | "view";
}

export default function LeaseModal({ isOpen, onClose, onSave, editData, mode = "create" }: LeaseModalProps) {
  const isView = mode === "view";
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [propertyStructure, setPropertyStructure] = useState<any>(null);

  // Upload previews
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  // Validation warnings
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unified Form Data
  const [formData, setFormData] = useState({
    tenantName: "",
    companyName: "",
    tenantType: "Individual", // Individual, Company, Corporate
    tenantContact: "",
    alternateContact: "",
    tenantEmail: "",
    gstPan: "",
    address: "",
    emergencyContact: "",
    remarks: "",

    // Property & Space
    property: "",
    floor: "",
    units: [] as string[],
    assignedSft: 0,
    officeStatus: "Vacant", // Vacant, Occupied, Reserved, Under Maintenance

    // Lease Lifecycle
    startDate: "",
    endDate: "",
    lockInPeriod: 6, // months
    status: "Active", // Draft, Active, Expired, Terminated, Renewal Pending
    renewalReminderDays: 30,
    autoRenewal: false,
    noticePeriod: 3, // months

    // Financial & Payment terms
    rentPerSft: 0,
    camPerSft: 0,
    parkingCharges: 0,
    utilityCharges: 0,
    maintenanceCharges: 0,
    depositMonths: 2,
    escalationPercentage: 5,
    dueDay: 5,
    taxPercentage: 18,
    discountAmount: 0,
    lateFeePercentage: 2,

    monthlyRent: 0,
    securityDeposit: 0,
    totalMonthlyAmount: 0,

    // Ledger Tracking
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    nextDueDate: "",
    paymentStatus: "Pending" // Paid, Partial, Pending, Overdue
  });

  // Calculate SFT and Financials automatically
  useEffect(() => {
    const totalSft = formData.units.reduce((sum, unitId) => {
      const unit = allUnits.find(u => u._id === unitId);
      return sum + (unit?.sqft || 0);
    }, 0);

    const monthlyRent = totalSft * (formData.rentPerSft || 0);
    const camCharges = totalSft * (formData.camPerSft || 0);
    const securityDeposit = monthlyRent * (formData.depositMonths || 0);

    const recurringBase = monthlyRent + camCharges + (formData.utilityCharges || 0) + (formData.parkingCharges || 0);
    const taxAmount = (recurringBase * (formData.taxPercentage || 0)) / 100;
    const totalMonthlyAmount = recurringBase + taxAmount - (formData.discountAmount || 0);

    setFormData(prev => ({
      ...prev,
      assignedSft: totalSft,
      monthlyRent: Math.round(monthlyRent),
      maintenanceCharges: Math.round(camCharges),
      securityDeposit: Math.round(securityDeposit),
      totalMonthlyAmount: Math.round(totalMonthlyAmount)
    }));
  }, [
    formData.units,
    formData.rentPerSft,
    formData.camPerSft,
    formData.depositMonths,
    formData.utilityCharges,
    formData.parkingCharges,
    formData.taxPercentage,
    formData.discountAmount,
    allUnits
  ]);

  // Fetch properties and units on open
  useEffect(() => {
    if (isOpen) {
      setActiveStep(1);
      fetchProperties();
      fetchUnits();
      if (editData) {
        setFormData({
          ...editData,
          startDate: editData.startDate ? new Date(editData.startDate).toISOString().split('T')[0] : "",
          endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : "",
          nextDueDate: editData.nextDueDate ? new Date(editData.nextDueDate).toISOString().split('T')[0] : "",
          property: typeof editData.property === 'object' ? editData.property._id : editData.property,
          floor: typeof editData.floor === 'object' ? editData.floor._id : editData.floor,
          units: editData.units?.map((u: any) => typeof u === 'object' ? u._id : u) || [],
          dueDay: editData.dueDay || 5,
          lockInPeriod: editData.lockInPeriod || 6,
          noticePeriod: editData.noticePeriod || 3,
          tenantType: editData.tenantType || "Individual"
        });
      } else {
        setFormData({
          tenantName: "",
          companyName: "",
          tenantType: "Individual",
          tenantContact: "",
          alternateContact: "",
          tenantEmail: "",
          gstPan: "",
          address: "",
          emergencyContact: "",
          remarks: "",
          property: "",
          floor: "",
          units: [],
          assignedSft: 0,
          officeStatus: "Vacant",
          startDate: "",
          endDate: "",
          lockInPeriod: 6,
          status: "Active",
          renewalReminderDays: 30,
          autoRenewal: false,
          noticePeriod: 3,
          rentPerSft: 0,
          camPerSft: 0,
          parkingCharges: 0,
          utilityCharges: 0,
          maintenanceCharges: 0,
          depositMonths: 2,
          escalationPercentage: 5,
          dueDay: 5,
          taxPercentage: 18,
          discountAmount: 0,
          lateFeePercentage: 2,
          monthlyRent: 0,
          securityDeposit: 0,
          totalMonthlyAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          nextDueDate: "",
          paymentStatus: "Pending"
        });
      }
    }
  }, [editData, isOpen]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.success) {
        setAllProperties(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    }
  };

  useEffect(() => {
    const fetchStructure = async () => {
      if (formData.property) {
        try {
          const response = await api.get(`/properties/${formData.property}/floors-units`);
          if (response.success) {
            setPropertyStructure(response.data);
          }
        } catch (err) {
          console.error("Failed to fetch property structure:", err);
          setPropertyStructure(null);
        }
      } else {
        setPropertyStructure(null);
      }
    };
    fetchStructure();
  }, [formData.property]);

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      if (response.success) {
        setAllUnits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const toggleUnit = (unitId: string) => {
    const current = [...formData.units];
    const index = current.indexOf(unitId);
    let floorId = formData.floor;

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(unitId);
      const selectedUnit = allUnits.find(u => u._id === unitId);
      if (selectedUnit) {
        floorId = typeof selectedUnit.floor === 'object' ? selectedUnit.floor._id : selectedUnit.floor;
      }
    }
    setFormData({ ...formData, units: current, floor: floorId });
  };

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!formData.tenantName) errs.tenantName = "Holder Name is required.";
      if (!formData.tenantContact) errs.tenantContact = "Contact Number is required.";
      else if (!/^[0-9]{10}$/.test(formData.tenantContact)) errs.tenantContact = "Mobile number must be 10 digits.";
      if (!formData.tenantEmail) errs.tenantEmail = "Email ID is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.tenantEmail)) errs.tenantEmail = "Invalid Email format.";
      if (!formData.address) errs.address = "Address is required.";
      if (formData.gstPan) {
        const panGstRegex = /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})|([A-Z]{5}[0-9]{4}[A-Z]{1})$/;
        if (!panGstRegex.test(formData.gstPan.toUpperCase())) errs.gstPan = "Invalid GST/PAN format.";
      }
    } else if (step === 2) {
      if (!formData.property) errs.property = "Property must be selected.";
      if (formData.units.length === 0) errs.units = "At least one unit must be linked.";
      
      // Prevent over-allocation of SFT
      const selectedFloorObj = propertyStructure?.floors?.find((f: any) => f.floorId === formData.floor);
      const floorTotalSft = selectedFloorObj?.totalSft || 0;
      if (floorTotalSft > 0 && formData.assignedSft > floorTotalSft) {
        errs.units = "Assigned SFT exceeds total floor capacity.";
      }
    } else if (step === 3) {
      if (!formData.startDate) errs.startDate = "Start Date is required.";
      if (!formData.endDate) errs.endDate = "End Date is required.";
      else {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end <= start) errs.endDate = "End date must exceed start date.";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        profilePhotoUrl: profilePhoto ? profilePhoto.name : "",
        idProofUrl: idProof ? idProof.name : "",
        agreementUrl: agreementFile ? agreementFile.name : ""
      };
      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Failed to save lease:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "#10b981"; // Green
      case "Pending": return "#f59e0b"; // Yellow
      case "Expired": return "#ef4444"; // Red
      case "Renewal Pending": return "#3b82f6"; // Blue
      default: return "#6b7280";
    }
  };

  // Calculations for Step 2
  const selectedFloorObj = propertyStructure?.floors?.find((f: any) => f.floorId === formData.floor);
  const totalFloorSft = selectedFloorObj?.totalSft || 0;
  const remainingFloorSft = Math.max(0, totalFloorSft - formData.assignedSft);

  // Available vacant units on selected floor
  const availableUnitsOnFloor = selectedFloorObj?.units?.filter((u: any) => u.status === 'Vacant' || u.status === 'Available') || [];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fadeIn" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(12px)'
    }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-overlay { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-container { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      
      <div className="modal-container w-100 mx-3" style={{ maxWidth: '1140px' }}>
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden bg-white d-flex flex-column" style={{ height: '90vh' }}>
          
          {/* Header */}
          <div className="modal-header border-bottom px-4 py-3 bg-light d-flex justify-content-between align-items-center flex-shrink-0">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge text-white font-semibold py-1 px-3 rounded-pill" style={{ backgroundColor: '#014aad' }}>Step {activeStep} of 4</span>
                <span className="text-muted small">| {isView ? 'Lease Profile Review' : editData ? 'Edit Agreement' : 'New Tenant Registry'}</span>
              </div>
              <h5 className="modal-title fw-bold text-dark mt-1">
                {activeStep === 1 && "Personal & Entity Profile"}
                {activeStep === 2 && "Property & Space Allocation"}
                {activeStep === 3 && "Lease Duration & Financial Settings"}
                {activeStep === 4 && "Agreement Documents & Remarks"}
              </h5>
            </div>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>

          {/* Core Body: Form Wizard & Sticky Preview Sidebar */}
          <div className="modal-body p-0 d-flex flex-grow-1 overflow-hidden">
            <div className="row g-0 w-100 h-100">
              
              {/* Form Wizard Left Panel */}
              <div className="col-lg-8 p-4 overflow-auto h-100">
                <form onSubmit={handleSubmit}>
                  
                  {/* Step 1: Personal details */}
                  {activeStep === 1 && (
                    <div className="step-content">
                      <div className="p-3 bg-light rounded-3 mb-4 border-start border-4 border-primary">
                        <h6 className="fw-bold mb-1 text-dark">Tenant & Co-Signer Information</h6>
                        <p className="text-muted small mb-0">Fill in the professional organization details and legal entity identity fields below.</p>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Lease Holder / Tenant Name *</label>
                          <input type="text" className={`form-control shadow-none ${errors.tenantName ? 'is-invalid' : ''}`} required disabled={isView}
                            value={formData.tenantName} onChange={(e) => setFormData({...formData, tenantName: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.tenantName && <div className="invalid-feedback">{errors.tenantName}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Company / Organization Name</label>
                          <input type="text" className="form-control shadow-none" disabled={isView}
                            value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Tenant Entity Type</label>
                          <select className="form-select shadow-none" disabled={isView}
                            value={formData.tenantType} onChange={(e) => setFormData({...formData, tenantType: e.target.value})} style={{ borderRadius: '6px' }}>
                            <option value="Individual">Individual</option>
                            <option value="Company">Company</option>
                            <option value="Corporate">Corporate</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Primary Mobile Number *</label>
                          <input type="text" className={`form-control shadow-none ${errors.tenantContact ? 'is-invalid' : ''}`} required disabled={isView}
                            value={formData.tenantContact} onChange={(e) => setFormData({...formData, tenantContact: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.tenantContact && <div className="invalid-feedback">{errors.tenantContact}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Official Email Address *</label>
                          <input type="email" className={`form-control shadow-none ${errors.tenantEmail ? 'is-invalid' : ''}`} required disabled={isView}
                            value={formData.tenantEmail} onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.tenantEmail && <div className="invalid-feedback">{errors.tenantEmail}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Alternate Contact / Phone</label>
                          <input type="text" className="form-control shadow-none" disabled={isView}
                            value={formData.alternateContact} onChange={(e) => setFormData({...formData, alternateContact: e.target.value})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">GSTIN / PAN Code</label>
                          <input type="text" className={`form-control shadow-none ${errors.gstPan ? 'is-invalid' : ''}`} disabled={isView}
                            value={formData.gstPan} onChange={(e) => setFormData({...formData, gstPan: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.gstPan && <div className="invalid-feedback">{errors.gstPan}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Emergency Contact Info</label>
                          <input type="text" className="form-control shadow-none" placeholder="Name & Mobile Relation" disabled={isView}
                            value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted mb-1">Permanent Legal Address *</label>
                          <input type="text" className={`form-control shadow-none ${errors.address ? 'is-invalid' : ''}`} required disabled={isView}
                            value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                        </div>

                        {/* ID Upload Previews */}
                        {!isView && (
                          <>
                            <div className="col-md-6">
                              <label className="form-label small fw-bold text-muted mb-1">Profile Photo Upload</label>
                              <div className="border rounded-3 p-2 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed' }}>
                                <input type="file" className="d-none" id="profile-photo" onChange={(e) => setProfilePhoto(e.target.files ? e.target.files[0] : null)} />
                                <label htmlFor="profile-photo" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                                  <i className="bi bi-person-bounding-box text-primary me-2"></i>
                                  <span className="small fw-semibold">{profilePhoto ? profilePhoto.name : 'Choose Profile Image'}</span>
                                </label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-bold text-muted mb-1">ID Proof Upload</label>
                              <div className="border rounded-3 p-2 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed' }}>
                                <input type="file" className="d-none" id="id-proof" onChange={(e) => setIdProof(e.target.files ? e.target.files[0] : null)} />
                                <label htmlFor="id-proof" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                                  <i className="bi bi-file-earmark-pdf text-primary me-2"></i>
                                  <span className="small fw-semibold">{idProof ? idProof.name : 'Choose ID Document'}</span>
                                </label>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Property & space allocation */}
                  {activeStep === 2 && (
                    <div className="step-content">
                      <div className="p-3 bg-light rounded-3 mb-4 border-start border-4 border-primary">
                        <h6 className="fw-bold mb-1 text-dark">Space Mappings & SFT Allocation</h6>
                        <p className="text-muted small mb-0">Select target Property first, then Floor, and link vacant offices. Over-allocation of SFT is automatically blocked.</p>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Select Property *</label>
                          <select className="form-select shadow-none" required disabled={isView}
                            value={formData.property} onChange={(e) => setFormData({...formData, property: e.target.value, floor: "", units: []})}>
                            <option value="">Choose Property...</option>
                            {allProperties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
                          </select>
                        </div>

                        {formData.property && (
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-muted mb-1">Select Floor *</label>
                            <select className="form-select shadow-none" required disabled={isView}
                              value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})}>
                              <option value="">Choose Floor...</option>
                              {propertyStructure?.floors?.map((f: any) => (
                                <option key={f.floorId} value={f.floorId}>{f.floorName}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {formData.property && formData.floor && (
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-muted mb-1">Select Vacant Office / Unit *</label>
                            <select className="form-select shadow-none" disabled={isView}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  toggleUnit(val);
                                  e.target.value = ""; // reset select
                                }
                              }}>
                              <option value="">Choose Vacant Unit...</option>
                              {availableUnitsOnFloor.map((u: any) => (
                                <option key={u.unitId} value={u.unitId}>
                                  Unit {u.unitName} ({u.sft || 0} SFT)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Office Space Status</label>
                          <select className="form-select shadow-none" disabled={isView}
                            value={formData.officeStatus} onChange={(e) => setFormData({...formData, officeStatus: e.target.value})}>
                            <option value="Vacant">Vacant (Available)</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                          </select>
                        </div>
                      </div>

                      {/* Display Selected Linked Units */}
                      {formData.units.length > 0 && (
                        <div className="mb-4">
                          <label className="form-label small fw-bold text-dark d-block">Active Leased Spaces:</label>
                          <div className="d-flex flex-column gap-2">
                            {formData.units.map(unitId => {
                              const unit = allUnits.find(u => u._id === unitId);
                              return (
                                <div key={unitId} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-white shadow-sm">
                                  <div>
                                    <span className="fw-bold text-dark">Unit {unit?.unitNumber || "Office"}</span>
                                    <span className="text-muted small mx-2">|</span>
                                    <span className="text-muted small fw-medium">{unit?.sqft || 0} SFT</span>
                                  </div>
                                  {!isView && (
                                    <button type="button" className="btn btn-sm btn-outline-danger px-3 py-1 rounded-pill" onClick={() => toggleUnit(unitId)}>
                                      Unlink Space
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Property Hierarchy & Calculations */}
                      {formData.floor && (
                        <div className="grouped-units-container border rounded-3 p-3 bg-white shadow-sm mb-3">
                          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                              <i className="bi bi-layers-fill text-primary"></i> Floor capacity allocation breakdown
                            </span>
                          </div>

                          <div className="row g-3 text-center">
                            <div className="col-4 border-end">
                              <label className="text-muted small d-block mb-1">Total Available SFT</label>
                              <div className="fw-bold text-dark fs-5">{totalFloorSft.toLocaleString()} SFT</div>
                            </div>
                            <div className="col-4 border-end">
                              <label className="text-muted small d-block mb-1">Assigned SFT</label>
                              <div className={`fw-bold fs-5 ${formData.assignedSft > totalFloorSft ? 'text-danger' : 'text-dark'}`}>
                                {formData.assignedSft.toLocaleString()} SFT
                              </div>
                            </div>
                            <div className="col-4">
                              <label className="text-muted small d-block mb-1">Remaining SFT</label>
                              <div className="fw-bold text-dark fs-5">{remainingFloorSft.toLocaleString()} SFT</div>
                            </div>
                          </div>

                          {/* SFT Over-allocation Warnings */}
                          {errors.units && (
                            <div className="alert alert-danger d-flex align-items-center gap-2 p-2 rounded-3 mt-3 mb-0" style={{ fontSize: '0.8rem' }}>
                              <i className="bi bi-exclamation-triangle-fill"></i>
                              <span>{errors.units}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Financial & Payments settings */}
                  {activeStep === 3 && (
                    <div className="step-content animate-fadeIn">
                      <div className="p-3 bg-light rounded-3 mb-4 border-start border-4 border-primary">
                        <h6 className="fw-bold mb-1 text-dark">Financial Terms & Agreement Duration</h6>
                        <p className="text-muted small mb-0">Fill in base SFT prices and recurring bills. Escalations and security deposits are automatically calculated.</p>
                      </div>

                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-calendar-range me-2"></i>Agreement Duration & Lock-in
                      </h6>
                      <div className="row g-3 mb-4">
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Lease Start Date *</label>
                          <input type="date" className={`form-control shadow-none ${errors.startDate ? 'is-invalid' : ''}`} required disabled={isView}
                            value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Lease End Date *</label>
                          <input type="date" className={`form-control shadow-none ${errors.endDate ? 'is-invalid' : ''}`} required disabled={isView}
                            value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} style={{ borderRadius: '6px' }} />
                          {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Lock-in Period (Months)</label>
                          <input type="number" className="form-control shadow-none" disabled={isView}
                            value={formData.lockInPeriod} onChange={(e) => setFormData({...formData, lockInPeriod: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Notice Period (Months)</label>
                          <input type="number" className="form-control shadow-none" disabled={isView}
                            value={formData.noticePeriod} onChange={(e) => setFormData({...formData, noticePeriod: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                      </div>

                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-cash-coin me-2"></i>Financial & CAM Computations
                      </h6>
                      <div className="row g-3 mb-4">
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Rent / SFT (₹)</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 50" disabled={isView}
                            value={formData.rentPerSft || ""} onChange={(e) => setFormData({...formData, rentPerSft: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">CAM / SFT (₹)</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 8" disabled={isView}
                            value={formData.camPerSft || ""} onChange={(e) => setFormData({...formData, camPerSft: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Deposit Months</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 3" disabled={isView}
                            value={formData.depositMonths || ""} onChange={(e) => setFormData({...formData, depositMonths: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Utility / Fixed Charges</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 2500" disabled={isView}
                            value={formData.utilityCharges || ""} onChange={(e) => setFormData({...formData, utilityCharges: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Parking / Surcharge</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 1000" disabled={isView}
                            value={formData.parkingCharges || ""} onChange={(e) => setFormData({...formData, parkingCharges: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Escalation Percentage (%)</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 5" disabled={isView}
                            value={formData.escalationPercentage || ""} onChange={(e) => setFormData({...formData, escalationPercentage: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Tax Percentage (%)</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 18" disabled={isView}
                            value={formData.taxPercentage || ""} onChange={(e) => setFormData({...formData, taxPercentage: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Discount Amount (₹)</label>
                          <input type="number" className="form-control shadow-none" placeholder="e.g. 500" disabled={isView}
                            value={formData.discountAmount || ""} onChange={(e) => setFormData({...formData, discountAmount: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-muted mb-1">Rent Due Day *</label>
                          <input type="number" className="form-control shadow-none" placeholder="5" required min="1" max="28" disabled={isView}
                            value={formData.dueDay} onChange={(e) => setFormData({...formData, dueDay: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                      </div>

                      {/* Section 3.3: Ledger & Payment Tracking */}
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-shield-check me-2"></i>Ledger & Payment Tracking System
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Paid Amount (₹)</label>
                          <input type="number" className="form-control shadow-none" disabled={isView}
                            value={formData.paidAmount} onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Pending Amount (₹)</label>
                          <input type="number" className="form-control shadow-none" disabled={isView}
                            value={formData.pendingAmount} onChange={(e) => setFormData({...formData, pendingAmount: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Overdue Amount (₹)</label>
                          <input type="number" className="form-control shadow-none" disabled={isView}
                            value={formData.overdueAmount} onChange={(e) => setFormData({...formData, overdueAmount: Number(e.target.value)})} style={{ borderRadius: '6px' }} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-muted mb-1">Payment Status</label>
                          <select className="form-select shadow-none" disabled={isView}
                            value={formData.paymentStatus} onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})} style={{ borderRadius: '6px' }}>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Next Payment Due Date</label>
                          <input type="date" className="form-control shadow-none" disabled={isView}
                            value={formData.nextDueDate} onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})} style={{ borderRadius: '6px' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Documents and Remarks */}
                  {activeStep === 4 && (
                    <div className="step-content animate-fadeIn">
                      <div className="p-3 bg-light rounded-3 mb-4 border-start border-4 border-primary">
                        <h6 className="fw-bold mb-1 text-dark">Agreement Review & Execution</h6>
                        <p className="text-muted small mb-0">Upload scanned agreement documents, select reminders, and register remarks to execute the lease agreement.</p>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Agreement Status</label>
                          <select className="form-select shadow-none" disabled={isView}
                            value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ borderRadius: '6px' }}>
                            <option value="Draft">Draft</option>
                            <option value="Active">Active</option>
                            <option value="Expired">Expired</option>
                            <option value="Terminated">Terminated</option>
                            <option value="Renewal Pending">Renewal Pending</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted mb-1">Renewal Reminder Days Before</label>
                          <select className="form-select shadow-none" disabled={isView}
                            value={formData.renewalReminderDays} onChange={(e) => setFormData({...formData, renewalReminderDays: Number(e.target.value)})} style={{ borderRadius: '6px' }}>
                            <option value="7">7 Days</option>
                            <option value="15">15 Days</option>
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                          </select>
                        </div>

                        {!isView && (
                          <div className="col-md-12">
                            <label className="form-label small fw-bold text-muted mb-1">Upload Agreement Attachment</label>
                            <div className="border rounded-3 p-3 bg-light text-center cursor-pointer" style={{ borderStyle: 'dashed' }}>
                              <input type="file" className="d-none" id="agreement-file" onChange={(e) => setAgreementFile(e.target.files ? e.target.files[0] : null)} />
                              <label htmlFor="agreement-file" className="w-100 m-0" style={{ cursor: 'pointer' }}>
                                <i className="bi bi-cloud-arrow-up-fill text-primary fs-4 d-block mb-1"></i>
                                <span className="small fw-bold text-dark">{agreementFile ? agreementFile.name : 'Drag & Drop Agreement PDF'}</span>
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="col-12">
                          <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" role="switch" id="auto-renewal" disabled={isView}
                              checked={formData.autoRenewal} onChange={(e) => setFormData({...formData, autoRenewal: e.target.checked})} />
                            <label className="form-check-label small fw-bold text-secondary ms-2" htmlFor="auto-renewal">Enable Auto Renewal upon End Date</label>
                          </div>
                        </div>

                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted mb-1">Internal Notes & Special Clauses</label>
                          <textarea className="form-control shadow-none" rows={3} disabled={isView}
                            value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} style={{ borderRadius: '6px' }} placeholder="Enter remarks..."></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                </form>
              </div>

              {/* Sticky Summary Preview Sidebar */}
              <div className="col-lg-4 p-4 bg-light border-start h-100 overflow-auto">
                <div className="d-flex flex-column gap-3">
                  
                  {/* Glassmorphism Title Panel */}
                  <div className="p-3 rounded-3 text-white" style={{ background: 'linear-gradient(135deg, #014aad 0%, #1e40af 100%)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-text fs-5"></i>
                      <h6 className="fw-bold mb-0">Lease Summary</h6>
                    </div>
                    <span className="small opacity-75">Live calculation preview panel</span>
                  </div>

                  <div className="d-flex flex-column gap-3 p-1">
                    
                    {/* Basic specs */}
                    <div>
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1">Primary Lease Holder</span>
                      <div className="fw-bold text-dark">{formData.tenantName || "Rajesh Kumar (New)"}</div>
                      {formData.companyName && <span className="small text-muted">{formData.companyName}</span>}
                    </div>

                    <hr className="my-1 text-muted opacity-25" />

                    {/* SFT calculations */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-bold text-uppercase d-block">Allocated Space</span>
                        <span className="small text-muted">{formData.units.length} Units selected</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-5 fw-bold text-dark">{formData.assignedSft}</span>
                        <span className="text-muted small d-block">SFT</span>
                      </div>
                    </div>

                    <hr className="my-1 text-muted opacity-25" />

                    {/* Rent & Deposit */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-bold text-uppercase d-block">Monthly Base Rent</span>
                        <span className="small text-muted">₹{formData.rentPerSft}/SFT rate</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-6 fw-bold text-dark">₹{formData.monthlyRent.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-bold text-uppercase d-block">CAM Maintenance Fee</span>
                        <span className="small text-muted">₹{formData.camPerSft}/SFT rate</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-6 fw-bold text-dark">₹{formData.maintenanceCharges.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-bold text-uppercase d-block">Security Deposit</span>
                        <span className="small text-muted">{formData.depositMonths} months hold</span>
                      </div>
                      <div className="text-end">
                        <span className="fs-6 fw-semibold text-dark">₹{formData.securityDeposit.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Highlighted Monthly obligation amount */}
                    <div className="p-3 border rounded-3 bg-white" style={{ borderLeft: `4px solid ${getStatusColor(formData.status)}` }}>
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Recurring Monthly (incl. tax)</span>
                      <div className="fs-4 fw-bold text-primary">₹{formData.totalMonthlyAmount.toLocaleString()}</div>
                      <span className="small text-muted d-block mt-1">
                        <i className="bi bi-calendar-check me-1"></i> Due on {formData.dueDay}th of each month.
                      </span>
                    </div>

                    {/* Status badge representation */}
                    <div className="d-flex align-items-center justify-content-between p-2 border rounded-3 bg-white">
                      <span className="small fw-semibold text-muted">Agreement Status</span>
                      <span className="badge text-white rounded-pill px-3 py-1 fw-bold" style={{ backgroundColor: getStatusColor(formData.status), fontSize: '0.75rem' }}>
                        {formData.status}
                      </span>
                    </div>

                    {/* Timeline summary */}
                    {formData.startDate && formData.endDate && (
                      <div className="p-2 border rounded-3 bg-white small text-muted">
                        <div className="mb-1"><i className="bi bi-calendar-event me-2 text-primary"></i>Start: <strong>{new Date(formData.startDate).toLocaleDateString()}</strong></div>
                        <div><i className="bi bi-calendar-x me-2 text-danger"></i>End: <strong>{new Date(formData.endDate).toLocaleDateString()}</strong></div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Controls */}
          <div className="modal-footer border-top p-3 d-flex justify-content-between bg-light flex-shrink-0">
            <div>
              {activeStep > 1 && (
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold shadow-sm" onClick={handlePrev}>
                  <i className="bi bi-chevron-left"></i> Previous Step
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light border rounded-pill px-4 fw-bold" onClick={onClose}>
                Cancel
              </button>
              {activeStep < 4 ? (
                <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold text-white shadow-sm" style={{ backgroundColor: '#014aad' }} onClick={handleNext}>
                  Next Step <i className="bi bi-chevron-right"></i>
                </button>
              ) : (
                !isView && (
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold text-white shadow-sm" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }} onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : null}
                    {editData ? 'Update Lease' : 'Register Agreement'}
                  </button>
                )
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
