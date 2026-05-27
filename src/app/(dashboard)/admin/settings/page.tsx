"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [activeLeases, setActiveLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'spaces' | 'ownerProfile' | 'leases' | 'security'>('profile');
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'danger', text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [address, setAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstPan, setGstPan] = useState("");

  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/me");
      if (response.success && response.data) {
        const u = response.data;
        setCurrentUser(u);
        setOwnerProfile(response.ownerProfile || null);
        setActiveLeases(response.activeLeases || []);
        setName(u.name || "");
        setPhoneNumber(u.phoneNumber || "");
        setEmergencyNumber(u.emergencyNumber || "");
        setAddress(u.address || "");
        setCompanyName(u.companyName || "");
        setGstPan(u.gstPan || "");
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    try {
      // Put to /users/:id to update details
      const response = await api.put(`/users/${currentUser._id}`, {
        name,
        phoneNumber,
        emergencyNumber,
        address,
        companyName,
        gstPan
      });
      if (response.success) {
        setUpdateMsg({ type: 'success', text: "Profile details updated successfully!" });
        fetchProfile();
      } else {
        setUpdateMsg({ type: 'danger', text: response.error || "Failed to update profile." });
      }
    } catch (err: any) {
      setUpdateMsg({ type: 'danger', text: err.message || "An error occurred." });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    if (newPassword !== confirmPassword) {
      setUpdateMsg({ type: 'danger', text: "New passwords do not match." });
      return;
    }
    try {
      // Endpoint to update password
      const response = await api.put(`/users/${currentUser._id}`, {
        password: newPassword
      });
      if (response.success) {
        setUpdateMsg({ type: 'success', text: "Password updated successfully!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setUpdateMsg({ type: 'danger', text: response.error || "Failed to change password." });
      }
    } catch (err: any) {
      setUpdateMsg({ type: 'danger', text: err.message || "An error occurred." });
    }
  };

  if (loading) return <div className="d-flex align-items-center justify-content-center" style={{ height: "60vh" }}><div className="spinner-border" style={{ color: "#014aad" }} /></div>;

  const displayRole = currentUser?.role === "Owner" ? "Office Owner" : currentUser?.role === "Admin" ? "Super Admin" : currentUser?.role || "User";

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Dynamic Header */}
      <div className="d-flex flex-column mb-4 p-4 rounded-xl border text-white shadow-sm" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle bg-primary bg-opacity-25 border border-primary d-flex align-items-center justify-content-center text-white fw-bold fs-3" style={{ width: '68px', height: '68px', background: '#014aad' }}>
            {currentUser?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h3 className="fw-bold mb-0 text-white" style={{ fontSize: '1.6rem' }}>{currentUser?.name || "My Account"}</h3>
            <p className="mb-0 text-muted small"><span className="badge rounded-pill bg-light text-dark px-3 py-1 fw-bold">{displayRole}</span> · {currentUser?.email}</p>
          </div>
        </div>
      </div>

      {updateMsg && (
        <div className={`alert alert-${updateMsg.type} rounded-xl shadow-sm d-flex align-items-center gap-2 mb-4`} role="alert">
          <i className={`bi ${updateMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <span className="small fw-semibold">{updateMsg.text}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Navigation Sidebar */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm rounded-xl overflow-hidden bg-white">
            <div className="p-3 bg-light border-bottom text-muted small fw-bold text-uppercase">Account Settings</div>
            <div className="list-group list-group-flush">
              <button 
                onClick={() => { setActiveTab('profile'); setUpdateMsg(null); }}
                className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 fw-bold ${activeTab === 'profile' ? 'bg-primary bg-opacity-10 text-primary' : 'text-muted'}`}
                style={activeTab === 'profile' ? { color: '#014aad', borderLeft: '3px solid #014aad' } : {}}
              >
                <i className="bi bi-person-circle fs-5"></i>
                <span className="small">Personal Information</span>
              </button>

              <button 
                onClick={() => { setActiveTab('spaces'); setUpdateMsg(null); }}
                className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 fw-bold ${activeTab === 'spaces' ? 'bg-primary bg-opacity-10 text-primary' : 'text-muted'}`}
                style={activeTab === 'spaces' ? { color: '#014aad', borderLeft: '3px solid #014aad' } : {}}
              >
                <i className="bi bi-building fs-5"></i>
                <span className="small">Spatial Assignments</span>
              </button>

              {ownerProfile && (
                <button 
                  onClick={() => { setActiveTab('ownerProfile'); setUpdateMsg(null); }}
                  className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 fw-bold ${activeTab === 'ownerProfile' ? 'bg-primary bg-opacity-10 text-primary' : 'text-muted'}`}
                  style={activeTab === 'ownerProfile' ? { color: '#014aad', borderLeft: '3px solid #014aad' } : {}}
                >
                  <i className="bi bi-briefcase fs-5"></i>
                  <span className="small">Owner Business Profile</span>
                </button>
              )}

              {activeLeases.length > 0 && (
                <button 
                  onClick={() => { setActiveTab('leases'); setUpdateMsg(null); }}
                  className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 fw-bold ${activeTab === 'leases' ? 'bg-primary bg-opacity-10 text-primary' : 'text-muted'}`}
                  style={activeTab === 'leases' ? { color: '#014aad', borderLeft: '3px solid #014aad' } : {}}
                >
                  <i className="bi bi-wallet2 fs-5"></i>
                  <span className="small">Office Leases & Payments</span>
                </button>
              )}

              <button 
                onClick={() => { setActiveTab('security'); setUpdateMsg(null); }}
                className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 fw-bold ${activeTab === 'security' ? 'bg-primary bg-opacity-10 text-primary' : 'text-muted'}`}
                style={activeTab === 'security' ? { color: '#014aad', borderLeft: '3px solid #014aad' } : {}}
              >
                <i className="bi bi-shield-lock fs-5"></i>
                <span className="small">Security & Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm rounded-xl p-4 bg-white min-vh-50">
            
            {/* TAB 1: Profile Information */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile}>
                <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Personal Information</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Full Name</label>
                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Email Address</label>
                    <input type="email" className="form-control bg-light" value={currentUser?.email || ""} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Phone Number</label>
                    <input type="text" className="form-control" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Emergency Number</label>
                    <input type="text" className="form-control" value={emergencyNumber} onChange={(e) => setEmergencyNumber(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Company Name</label>
                    <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">GST / PAN Details</label>
                    <input type="text" className="form-control" value={gstPan} onChange={(e) => setGstPan(e.target.value)} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-bold text-muted text-uppercase">Registered Address</label>
                    <textarea className="form-control" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
                <hr className="my-4 opacity-10" />
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm text-white border-0 fw-bold" style={{ backgroundColor: '#014aad' }}>
                    Save Profile Details
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Spatial Assignments (Property, Floor, Unit details) */}
            {activeTab === 'spaces' && (
              <div>
                <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Assigned Spatial Details</h5>

                {/* 1. Property Details */}
                <div className="mb-5">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-building me-2 text-primary"></i>Property Details</h6>
                  {currentUser?.assignedProperties && currentUser.assignedProperties.length > 0 ? (
                    <div className="row g-3">
                      {currentUser.assignedProperties.map((prop: any) => (
                        <div key={prop._id} className="col-md-6">
                          <div className="p-3 border rounded-xl bg-light shadow-sm">
                            <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Property Name</span>
                            <span className="fw-bold text-dark fs-6 d-block mb-2">{prop.propertyName}</span>
                            
                            <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Address</span>
                            <span className="small text-muted d-block">{prop.address || "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small p-3 bg-light rounded-xl border">No properties directly assigned.</div>
                  )}
                </div>

                {/* 2. Floor Details */}
                <div className="mb-5">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-layers me-2 text-primary"></i>Floor Details</h6>
                  {currentUser?.assignedFloors && currentUser.assignedFloors.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {currentUser.assignedFloors.map((floor: any) => (
                        <span key={floor._id} className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill fw-bold small">
                          {floor.floorName || `Floor ${floor.floorNumber}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small p-3 bg-light rounded-xl border">No floors directly assigned.</div>
                  )}
                </div>

                {/* 3. Office / Unit Details */}
                <div>
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-door-open me-2 text-primary"></i>Office & Unit Details</h6>
                  {currentUser?.assignedUnits && currentUser.assignedUnits.length > 0 ? (
                    <div className="row g-3">
                      {currentUser.assignedUnits.map((unit: any) => (
                        <div key={unit._id} className="col-md-6">
                          <div className="p-3 border rounded-xl bg-white shadow-sm border-start border-4 border-primary">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="badge rounded-pill bg-light text-dark px-3 py-1 fw-bold">{unit.unitType || "Office"}</span>
                              <span className={`badge rounded-pill px-3 py-1 fw-bold ${unit.unitStatus === "Occupied" ? "bg-success bg-opacity-10 text-success border border-success" : "bg-warning bg-opacity-10 text-warning border border-warning"}`}>
                                {unit.unitStatus || "Available"}
                              </span>
                            </div>

                            <div className="mb-2">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Property / Office Name</span>
                              <span className="fw-bold text-dark small d-block mb-1">{unit.property?.propertyName || "—"}</span>
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-6">
                                <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Floor</span>
                                <span className="small text-dark fw-semibold" style={{ fontSize: '0.8rem' }}>{unit.floor?.floorName || `Floor ${unit.floorNumber || "—"}`}</span>
                              </div>
                              <div className="col-6">
                                <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Flat / Unit Number</span>
                                <span className="small text-dark fw-bold" style={{ fontSize: '0.8rem' }}>{unit.unitNumber || "—"}</span>
                              </div>
                            </div>

                            <div className="row g-2 pt-2 border-top">
                              <div className="col-6">
                                <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Allocated Space</span>
                                <span className="small text-dark fw-bold">{unit.sqft ? `${unit.sqft.toLocaleString()} sqft` : "—"}</span>
                              </div>
                              <div className="col-6">
                                <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Car / Bike Parking</span>
                                <span className="small text-dark fw-bold">🚗 {unit.carParking || 0} / 🏍️ {unit.bikeParking || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small p-3 bg-light rounded-xl border">No office units directly assigned.</div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: Owner Business Profile */}
            {activeTab === 'ownerProfile' && ownerProfile && (
              <div>
                <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Owner Business Profile</h5>
                
                {/* Profile Summary Card */}
                <div className="card border-0 bg-light p-4 rounded-xl mb-4 border-start border-4 border-primary">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.65rem' }}>Owner Legal Entity</span>
                      <h4 className="fw-bold text-dark mb-0">{ownerProfile.ownerName}</h4>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-1 fw-bold mb-1 d-inline-block">{ownerProfile.status || "Active"}</span>
                      <span className="small text-muted d-block fw-semibold">{ownerProfile.ownerType || "Individual"} Type</span>
                    </div>
                  </div>
                </div>

                {/* Grid info */}
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Corporate Email ID</span>
                      <span className="fw-bold text-dark small">{ownerProfile.emailId || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Primary Contact Phone</span>
                      <span className="fw-bold text-dark small">{ownerProfile.contactNumber || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Alternate Phone Number</span>
                      <span className="fw-bold text-dark small">{ownerProfile.alternateNumber || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Designation / Job Role</span>
                      <span className="fw-bold text-dark small">{ownerProfile.designation || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Registered Contact Person</span>
                      <span className="fw-bold text-dark small">{ownerProfile.contactPerson || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Company Reg. Number</span>
                      <span className="fw-bold text-dark small">{ownerProfile.companyRegNo || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>GST Tax Registration</span>
                      <span className="fw-bold text-dark small">{ownerProfile.gstNumber || "—"}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                      <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>KYC ID Verification</span>
                      <span className="fw-bold text-dark small">{ownerProfile.idProofType ? `${ownerProfile.idProofType} (${ownerProfile.idProofNumber || '—'})` : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div>
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-file-earmark-pdf me-2 text-primary"></i>KYC Documents & Certificates</h6>
                  {ownerProfile.documents && ownerProfile.documents.length > 0 ? (
                    <div className="row g-3">
                      {ownerProfile.documents.map((doc: any, idx: number) => (
                        <div key={idx} className="col-md-6">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-3 border rounded-xl bg-white shadow-sm d-flex align-items-center justify-content-between text-decoration-none hover-bg-light transition-all">
                            <div className="d-flex align-items-center gap-3">
                              <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 px-3 fw-bold">
                                <i className="bi bi-file-earmark-pdf fs-5"></i>
                              </div>
                              <div>
                                <span className="fw-bold text-dark d-block small">{doc.name || "KYC Attachment"}</span>
                                <span className="text-muted" style={{ fontSize: '0.68rem' }}>Uploaded Verified Document</span>
                              </div>
                            </div>
                            <i className="bi bi-download text-muted fs-5"></i>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small p-3 bg-light rounded-xl border">No KYC attachments uploaded yet.</div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: Office Leases & Payments */}
            {activeTab === 'leases' && activeLeases.length > 0 && (
              <div>
                <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Office Leases & Payments</h5>

                {activeLeases.map((lease: any, idx: number) => {
                  const statusColors = {
                    Paid: "bg-success bg-opacity-10 text-success border border-success",
                    Partial: "bg-warning bg-opacity-10 text-warning border border-warning",
                    Pending: "bg-info bg-opacity-10 text-info border border-info",
                    Overdue: "bg-danger bg-opacity-10 text-danger border border-danger",
                  }[lease.paymentStatus as string || "Pending"] || "bg-light text-dark";

                  return (
                    <div key={lease._id || idx} className="mb-5 p-4 border rounded-xl bg-white shadow-sm">
                      {/* Top Header Row */}
                      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 pb-3 border-bottom">
                        <div>
                          <span className="small text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>Tenant Billing Entity</span>
                          <h4 className="fw-bold text-dark mb-0">{lease.tenantName}</h4>
                          {lease.companyName && <span className="small text-muted fw-semibold">Company: {lease.companyName}</span>}
                        </div>
                        <div className="text-end">
                          <span className={`badge rounded-pill px-3 py-2 fw-bold mb-1 ${statusColors}`}>
                            Billing Status: {lease.paymentStatus || "Pending"}
                          </span>
                          <span className="small text-muted d-block fw-semibold">
                            Agreement: {lease.startDate ? new Date(lease.startDate).toLocaleDateString() : ""} – {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>

                      {/* Main Financial Summary Grid */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-3">
                          <div className="p-3 border rounded-xl bg-light shadow-sm text-center">
                            <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Monthly Rent</span>
                            <span className="fw-bold text-dark fs-5">₹{(lease.monthlyRent || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="p-3 border rounded-xl bg-light shadow-sm text-center">
                            <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>CAM Charges</span>
                            <span className="fw-bold text-dark fs-5">₹{(lease.maintenanceCharges || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="p-3 border rounded-xl bg-light shadow-sm text-center">
                            <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Total Monthly Due</span>
                            <span className="fw-bold text-primary fs-5" style={{ color: '#014aad' }}>₹{(lease.totalMonthlyAmount || ((lease.monthlyRent || 0) + (lease.maintenanceCharges || 0))).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="p-3 border rounded-xl bg-light shadow-sm text-center">
                            <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Due Date</span>
                            <span className="fw-bold text-danger fs-5">
                              {lease.nextDueDate ? new Date(lease.nextDueDate).toLocaleDateString() : `Day ${lease.dueDay || 5} of Month`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Pricing Specifications */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-dark mb-3">Pricing Specifications</h6>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Rent Rate (per Sft)</span>
                              <span className="fw-semibold text-dark">₹{lease.rentPerSft || 0} / sqft</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>CAM Rate (per Sft)</span>
                              <span className="fw-semibold text-dark">₹{lease.camPerSft || 0} / sqft</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Security Deposit Paid</span>
                              <span className="fw-bold text-success">₹{(lease.securityDeposit || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Parking Charges</span>
                              <span className="fw-semibold text-dark">₹{(lease.parkingCharges || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Tax Percentage (GST)</span>
                              <span className="fw-semibold text-dark">{lease.taxPercentage || 18}%</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="p-3 border rounded-xl bg-white shadow-sm h-100">
                              <span className="small text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.62rem' }}>Escalation Rate</span>
                              <span className="fw-semibold text-dark">📈 {lease.escalationPercentage || 5}% Annually</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Allocated Units List */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-dark mb-3">Leased Particulars (Allocated Space)</h6>
                        <div className="row g-2">
                          {lease.units && lease.units.length > 0 ? (
                            lease.units.map((unit: any) => (
                              <div key={unit._id} className="col-md-4">
                                <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                                  <div>
                                    <span className="fw-bold text-dark d-block" style={{ fontSize: '0.8rem' }}>Unit {unit.unitNumber}</span>
                                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>{unit.unitType || 'Office'} · {unit.sqft || 0} sqft</span>
                                  </div>
                                  <span className="badge bg-primary rounded px-2 py-1 text-white small" style={{ fontSize: '0.65rem', backgroundColor: '#014aad' }}>Active Leased</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted small">No units specifically mapped in this agreement folder.</span>
                          )}
                        </div>
                      </div>

                      {/* Download Verified Agreement */}
                      {lease.agreementUrl && (
                        <div>
                          <a 
                            href={lease.agreementUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline-secondary rounded-pill px-4 shadow-sm fw-bold d-inline-flex align-items-center gap-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <i className="bi bi-file-earmark-pdf text-danger fs-5" /> View & Download Lease Agreement
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: Security & Password */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange}>
                <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Change Password</h5>
                <div className="row g-3" style={{ maxWidth: '500px' }}>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted text-uppercase">New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                      minLength={6}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted text-uppercase">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      minLength={6}
                    />
                  </div>
                </div>
                <hr className="my-4 opacity-10" />
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm text-white border-0 fw-bold" style={{ backgroundColor: '#014aad' }}>
                    Change Password
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
