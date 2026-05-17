"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode?: "create" | "edit" | "view";
}

export default function LeaseModal({ isOpen, onClose, onSave, editData, mode = "create" }: LeaseModalProps) {
  const isView = mode === "view";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allOwners, setAllOwners] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tenantName: "",
    tenantContact: "",
    tenantEmail: "",
    owner: "",
    units: [] as string[],
    startDate: "",
    endDate: "",
    monthlyRent: 0,
    securityDeposit: 0,
    maintenanceCharges: 0,
    escalationPercentage: 0,
    dueDay: 5,
    status: "Active",
    remarks: ""
  });

  const totalMonthly = (formData.monthlyRent || 0) + (formData.maintenanceCharges || 0);

  useEffect(() => {
    if (isOpen) {
      fetchOwners();
      fetchUnits();
      if (editData) {
        setFormData({
          ...editData,
          startDate: editData.startDate ? new Date(editData.startDate).toISOString().split('T')[0] : "",
          endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : "",
          owner: typeof editData.owner === 'object' ? editData.owner._id : editData.owner,
          units: editData.units?.map((u: any) => typeof u === 'object' ? u._id : u) || [],
          dueDay: editData.dueDay || 5
        });
      } else {
        setFormData({
          tenantName: "",
          tenantContact: "",
          tenantEmail: "",
          owner: "",
          units: [],
          startDate: "",
          endDate: "",
          monthlyRent: 0,
          securityDeposit: 0,
          maintenanceCharges: 0,
          escalationPercentage: 0,
          dueDay: 5,
          status: "Active",
          remarks: ""
        });
      }
    }
  }, [editData, isOpen]);

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owners');
      if (response.success) {
        setAllOwners(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch owners:", err);
    }
  };

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
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(unitId);
    }
    setFormData({ ...formData, units: current });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  const [activeTab, setActiveTab] = useState<"agreement" | "payments">("agreement");
  const [payments, setPayments] = useState<any[]>([]);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    amount: totalMonthly,
    paymentMethod: 'Online',
    status: 'Paid',
    remarks: ''
  });

  useEffect(() => {
    if (isOpen && editData) {
      fetchPayments();
    }
  }, [editData, isOpen]);

  const fetchPayments = async () => {
    try {
      const response = await api.get(`/payments?lease=${editData._id}`);
      if (response.success) {
        setPayments(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecordingPayment(true);
    try {
      const response = await api.post('/payments', { ...newPayment, lease: editData._id });
      if (response.success) {
        fetchPayments();
        setIsRecordingPayment(false);
        setNewPayment({ ...newPayment, month: 'January', remarks: '' }); // Reset
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to record payment");
      setIsRecordingPayment(false);
    }
  };

  if (!isOpen) return null;

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
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '900px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-0 bg-light flex-column align-items-stretch">
            <div className="d-flex justify-content-between align-items-start p-4 pb-2">
              <div>
                <h5 className="modal-title fw-bold text-dark mb-1">
                  {isView ? 'Audit Lease Agreement' : editData ? 'Update Lease Portfolio' : 'Register New Lease'}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small fw-medium">Ref ID: {editData?._id?.substring(0, 8).toUpperCase() || 'NEW'}</span>
                  {editData?.units?.length > 0 && (
                    <span className="badge bg-emerald bg-opacity-10 text-emerald border border-emerald border-opacity-25 rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-door-open-fill me-1"></i>
                      {editData.units[0].unitNumber} 
                      {editData.units.length > 1 ? ` (+${editData.units.length - 1} Units)` : ' (Main Office)'}
                    </span>
                  )}
                </div>
              </div>
              <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
            </div>
            
            {/* Tabs Navigation */}
            <div className="px-4 d-flex gap-4">
              <button 
                className={`btn btn-link text-decoration-none px-0 py-3 fw-bold border-bottom border-3 transition-all ${activeTab === 'agreement' ? 'text-emerald border-emerald' : 'text-muted border-transparent opacity-50'}`}
                onClick={() => setActiveTab('agreement')}
                style={{ fontSize: '0.9rem' }}
              >
                Agreement Details
              </button>
              {editData && (
                <button 
                  className={`btn btn-link text-decoration-none px-0 py-3 fw-bold border-bottom border-3 transition-all ${activeTab === 'payments' ? 'text-emerald border-emerald' : 'text-muted border-transparent opacity-50'}`}
                  onClick={() => setActiveTab('payments')}
                  style={{ fontSize: '0.9rem' }}
                >
                  Payment History & Recording
                </button>
              )}
            </div>
          </div>
          
          <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {activeTab === 'agreement' ? (
              isView ? (
                <div className="view-mode-content animate-fadeIn">
                  {/* Header Highlights */}
                  <div className="row g-4 mb-4">
                    <div className="col-md-7">
                      <div className="bg-emerald bg-opacity-10 p-4 rounded-4 border border-emerald border-opacity-25 shadow-sm">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          <div className="bg-emerald text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '48px', height: '48px' }}>
                            <i className="bi bi-person-check-fill fs-4"></i>
                          </div>
                          <div>
                            <h4 className="fw-bold mb-0 text-dark">{formData.tenantName || 'N/A'}</h4>
                            <span className="text-muted small fw-medium">Primary Lease Holder</span>
                          </div>
                        </div>
                        <div className="d-flex gap-4 mt-3 pt-2 border-top border-emerald border-opacity-10">
                          <div className="small"><i className="bi bi-telephone-fill text-emerald me-2"></i><strong>{formData.tenantContact || 'N/A'}</strong></div>
                          <div className="small"><i className="bi bi-envelope-at-fill text-emerald me-2"></i><strong>{formData.tenantEmail || 'N/A'}</strong></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="bg-light p-4 rounded-4 border shadow-sm text-center d-flex flex-column justify-content-center h-100">
                        <span className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Total Monthly Payment</span>
                        <h2 className="fw-bold text-emerald mb-0" style={{ fontSize: '2rem' }}>₹{totalMonthly.toLocaleString()}</h2>
                        <div className="badge bg-warning bg-opacity-25 text-warning rounded-pill mt-2 py-2 px-3 fw-bold mx-auto" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-calendar-event me-2"></i>Due on {formData.dueDay}th of each month
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* Monthly Obligation Summary */}
                    <div className="col-12">
                      <div className="p-4 rounded-4 border-emerald border-opacity-25 bg-emerald bg-opacity-5 shadow-sm text-center">
                        <h6 className="fw-bold text-dark mb-4 text-uppercase small" style={{ letterSpacing: '0.1em' }}>
                          <i className="bi bi-receipt-cutoff me-2 text-emerald"></i> Monthly Financial Obligation
                        </h6>
                        <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
                          <div className="text-center">
                            <label className="text-muted small d-block mb-1">Base Monthly Rent</label>
                            <div className="fw-bold fs-5 text-dark">₹{formData.monthlyRent.toLocaleString()}</div>
                          </div>
                          <div className="fs-3 text-muted opacity-50">+</div>
                          <div className="text-center">
                            <label className="text-muted small d-block mb-1">Maintenance Fees</label>
                            <div className="fw-bold fs-5 text-dark">₹{formData.maintenanceCharges.toLocaleString()}</div>
                          </div>
                          <div className="fs-3 text-emerald">=</div>
                          <div className="text-center bg-white p-3 rounded-4 border border-emerald px-5 shadow-sm">
                            <label className="text-emerald small fw-bold d-block mb-1 text-uppercase">Total Recurring Monthly</label>
                            <div className="fw-bold fs-2 text-emerald">₹{totalMonthly.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-top border-emerald border-opacity-10">
                          <span className="text-muted small">
                            <i className="bi bi-info-circle me-2"></i> This payment is due on the <strong>{formData.dueDay}th</strong> of every month throughout the lease tenure.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property & Ownership */}
                    <div className="col-md-6">
                      <div className="p-3 border rounded-4 h-100 bg-white shadow-sm">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-building text-emerald"></i> Property & Ownership
                        </h6>
                        <div className="mb-3">
                          <label className="text-muted small d-block mb-1">Assigned Property Owner</label>
                          <div className="fw-bold text-dark">{typeof editData?.owner === 'object' ? editData.owner.ownerName : allOwners.find(o => o._id === formData.owner)?.ownerName || 'N/A'}</div>
                        </div>
                        <div className="mb-0">
                          <label className="text-muted small d-block mb-1">Agreement Status</label>
                          <span className={`badge rounded-pill px-3 py-2 fw-bold ${formData.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'}`}>
                            {formData.status === 'Active' ? 'Active Agreement' : formData.status === 'Pending' ? 'Pending Signature' : 'Terminated'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Context */}
                    <div className="col-md-6">
                      <div className="p-3 border rounded-4 h-100 bg-white shadow-sm">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-layout-text-window-reverse text-emerald"></i> Portfolio Context
                        </h6>
                        <div className="overflow-auto" style={{ maxHeight: '100px' }}>
                          {editData?.units?.length > 0 ? (
                            editData.units.map((u: any, idx: number) => (
                              <div key={idx} className="mb-2 p-2 bg-light rounded small">
                                <span className="fw-bold text-dark">{u.unitNumber}</span>
                                <span className="text-muted mx-2">|</span>
                                <span className="text-muted">{u.property?.propertyName || u.property?.building || 'Main Block'} (Floor {u.floorNumber})</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-muted small">No units interlinked to this lease.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agreement Terms */}
                    <div className="col-md-12">
                      <div className="p-3 border rounded-4 bg-white shadow-sm">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-calendar-range text-emerald"></i> Lease Duration & Timeline
                        </h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="text-muted small d-block mb-1">Agreement Start Date</label>
                            <div className="fw-bold text-dark bg-light p-2 rounded">{formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</div>
                          </div>
                          <div className="col-md-6">
                            <label className="text-muted small d-block mb-1">Agreement End Date</label>
                            <div className="fw-bold text-dark bg-light p-2 rounded">{formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Finances */}
                    <div className="col-12">
                      <div className="p-4 border rounded-4 bg-white shadow-sm">
                        <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                          <i className="bi bi-cash-stack text-emerald"></i> Financial Breakdown
                        </h6>
                        <div className="row g-4 text-center">
                          <div className="col-md-3 border-end">
                            <label className="text-muted small d-block mb-1">Base Monthly Rent</label>
                            <div className="fw-bold fs-5">₹{formData.monthlyRent.toLocaleString()}</div>
                          </div>
                          <div className="col-md-3 border-end">
                            <label className="text-muted small d-block mb-1">Maintenance Charges</label>
                            <div className="fw-bold fs-5">₹{formData.maintenanceCharges.toLocaleString()}</div>
                          </div>
                          <div className="col-md-3 border-end">
                            <label className="text-muted small d-block mb-1">Security Deposit</label>
                            <div className="fw-bold fs-5 text-dark">₹{formData.securityDeposit.toLocaleString()}</div>
                          </div>
                          <div className="col-md-3">
                            <label className="text-muted small d-block mb-1">Annual Escalation</label>
                            <div className="fw-bold fs-5 text-primary">{formData.escalationPercentage}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remarks */}
                    {formData.remarks && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded-4 border">
                          <label className="text-muted small fw-bold d-block mb-1">Additional Remarks / Special Clauses</label>
                          <p className="mb-0 text-muted small fw-medium">{formData.remarks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Tenant & Owner Relationship</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Tenant / Lease Holder Name</label>
                      <input type="text" className="form-control form-control-sm bg-light" required
                        value={formData.tenantName} onChange={(e) => setFormData({...formData, tenantName: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Select Property Owner</label>
                      <select className="form-select form-select-sm bg-light" required
                        value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})}>
                        <option value="">Select Owner...</option>
                        {allOwners.map(o => <option key={o._id} value={o._id}>{o.ownerName}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Tenant Contact Number</label>
                      <input type="text" className="form-control form-control-sm bg-light" required
                        value={formData.tenantContact} onChange={(e) => setFormData({...formData, tenantContact: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Tenant Email ID</label>
                      <input type="email" className="form-control form-control-sm bg-light"
                        value={formData.tenantEmail} onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})} />
                    </div>
                  </div>

                  <h6 className="fw-bold text-emerald mb-3" style={{ color: '#10B981' }}>Financial Terms & Duration</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Start Date</label>
                      <input type="date" className="form-control form-control-sm bg-light" required
                        value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">End Date</label>
                      <input type="date" className="form-control form-control-sm bg-light" required
                        value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Monthly Rent</label>
                      <input type="number" className="form-control form-control-sm bg-light" required
                        value={formData.monthlyRent} onChange={(e) => setFormData({...formData, monthlyRent: Number(e.target.value)})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Maintenance</label>
                      <input type="number" className="form-control form-control-sm bg-light"
                        value={formData.maintenanceCharges} onChange={(e) => setFormData({...formData, maintenanceCharges: Number(e.target.value)})} />
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-dark mb-1">Total Monthly</label>
                      <div className="form-control form-control-sm bg-emerald bg-opacity-10 fw-bold text-emerald border-emerald border-opacity-25">
                        ₹{totalMonthly.toLocaleString()}
                      </div>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Rent Due Day</label>
                      <input type="number" className="form-control form-control-sm bg-light" min="1" max="31" required
                        value={formData.dueDay} onChange={(e) => setFormData({...formData, dueDay: Number(e.target.value)})} />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Security Deposit</label>
                      <input type="number" className="form-control form-control-sm bg-light"
                        value={formData.securityDeposit} onChange={(e) => setFormData({...formData, securityDeposit: Number(e.target.value)})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted mb-1">Escalation (%)</label>
                      <input type="number" className="form-control form-control-sm bg-light"
                        value={formData.escalationPercentage} onChange={(e) => setFormData({...formData, escalationPercentage: Number(e.target.value)})} />
                    </div>
                    
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-muted mb-1">Agreement Status</label>
                      <select className="form-select form-select-sm bg-light rounded-pill px-3"
                        value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="Active">Active Agreement</option>
                        <option value="Pending">Pending Signature</option>
                        <option value="Terminated">Agreement Terminated</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <label className="form-label small fw-bold text-muted mb-1">Additional Remarks</label>
                    <textarea className="form-control form-control-sm bg-light" rows={2}
                      value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})}></textarea>
                  </div>
                </form>
              )
            ) : (
              <div className="payments-tab-content animate-fadeIn">
                <div className="row g-4">
                  {/* Record Payment Form */}
                  {!isView && (
                    <div className="col-md-5">
                      <div className="p-4 border border-emerald border-opacity-10 rounded-4 bg-white shadow-sm position-sticky" style={{ top: 0 }}>
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <div className="bg-emerald bg-opacity-10 p-2 rounded-3 text-emerald">
                            <i className="bi bi-plus-circle-fill fs-5"></i>
                          </div>
                          <h6 className="fw-bold text-dark mb-0">Record New Payment</h6>
                        </div>

                        <form onSubmit={handleRecordPayment}>
                          <div className="row g-3">
                            <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Payment Month & Year</label>
                              <div className="d-flex gap-2">
                                <select className="form-select form-select-sm bg-light border-0 py-2 rounded-3" value={newPayment.month} onChange={(e) => setNewPayment({...newPayment, month: e.target.value})}>
                                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <input type="number" className="form-select form-select-sm bg-light border-0 py-2 rounded-3 w-auto" style={{ width: '100px' }} value={newPayment.year} onChange={(e) => setNewPayment({...newPayment, year: Number(e.target.value)})} />
                              </div>
                            </div>

                            <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Amount Received (₹)</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted">₹</span>
                                <input type="number" className="form-control form-control-sm bg-light border-0 py-2 rounded-3" required 
                                  value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})} 
                                  placeholder="0.00" />
                              </div>
                            </div>

                            <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Payment Channel</label>
                              <select className="form-select form-select-sm bg-light border-0 py-2 rounded-3" value={newPayment.paymentMethod} onChange={(e) => setNewPayment({...newPayment, paymentMethod: e.target.value})}>
                                <option value="Online">Online Transfer (IMPS/UPI)</option>
                                <option value="Cheque">Physical Cheque</option>
                                <option value="Cash">Direct Cash</option>
                                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                              </select>
                            </div>

                            <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Payment Status</label>
                              <select className="form-select form-select-sm bg-light border-0 py-2 rounded-3" value={newPayment.status} onChange={(e) => setNewPayment({...newPayment, status: e.target.value})}>
                                <option value="Paid">Fully Paid (Settled)</option>
                                <option value="Partial">Partial Payment</option>
                                <option value="Pending">Pending / Disputed</option>
                              </select>
                            </div>

                            <div className="col-12 pt-2">
                              <button 
                                type="submit" 
                                className="btn w-100 rounded-pill fw-bold py-2 shadow-sm border-0 transition-all" 
                                disabled={isRecordingPayment}
                                style={{ 
                                  backgroundColor: '#10B981', 
                                  color: 'white',
                                  fontSize: '0.85rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                              >
                                {isRecordingPayment ? (
                                  <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving Record...</>
                                ) : (
                                  <><i className="bi bi-check2-circle me-2"></i>Confirm & Save Payment</>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Payments List */}
                  <div className={isView ? "col-12" : "col-md-7"}>
                    <div className="p-4 border rounded-4 bg-white shadow-sm h-100 min-vh-50">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="bi bi-clock-history text-emerald me-2"></i>Recent Ledger Entries
                        </h6>
                        <span className="badge bg-light text-muted border px-3 py-2 rounded-pill small fw-normal">
                          {payments.length} Records Found
                        </span>
                      </div>
                      
                      {payments.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle border-top-0">
                            <thead>
                              <tr className="text-muted small">
                                <th className="border-0 pb-3 fw-bold">BILLING PERIOD</th>
                                <th className="border-0 pb-3 fw-bold">AMOUNT</th>
                                <th className="border-0 pb-3 fw-bold text-end">STATUS</th>
                              </tr>
                            </thead>
                            <tbody className="border-top-0">
                              {payments.map((p: any) => (
                                <tr key={p._id} className="border-bottom border-light">
                                  <td className="py-3">
                                    <div className="fw-bold text-dark">{p.month} {p.year}</div>
                                    <div className="text-muted small" style={{ fontSize: '0.65rem' }}>Recorded on {new Date(p.paymentDate).toLocaleDateString()}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="fw-bold text-dark">₹{p.amount.toLocaleString()}</div>
                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>via {p.paymentMethod}</div>
                                  </td>
                                  <td className="py-3 text-end">
                                    <span className={`badge rounded-pill px-3 py-1 ${p.status === 'Paid' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`} style={{ fontSize: '0.65rem' }}>
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
                            <i className="bi bi-journal-x fs-1 text-muted opacity-50"></i>
                          </div>
                          <h6 className="fw-bold text-muted">No Ledger Entries</h6>
                          <p className="text-muted small mb-0 px-5">Start recording monthly rent payments to build your financial history for this lease.</p>
                        </div>
                      )}
                    </div>
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
              {isView ? 'Close' : 'Cancel'}
            </button>
            {activeTab === 'agreement' && !isView && (
              <button 
                type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm text-white border-0"
                disabled={isSubmitting}
                onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                style={{ backgroundColor: '#10B981', fontSize: '0.85rem' }}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {editData ? 'Update Lease' : 'Confirm Lease Agreement'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
