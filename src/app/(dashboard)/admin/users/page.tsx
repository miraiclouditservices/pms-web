"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from "@/utils/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  
  // Navigation & details view state
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showPassword, setShowPassword] = useState(false);

  // Billing and invoice history states
  const [billingData, setBillingData] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  // Edit and Quick Action states
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Global lists for mapping
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchProperties();
    fetchFloors();
    fetchUnits();
  }, []);

  // Sync details when user changes or gets updated
  useEffect(() => {
    if (viewUser) {
      fetchBillingData(viewUser._id);
    } else {
      setBillingData(null);
    }
  }, [viewUser]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) {
        setUsers(res.data);
        // If viewing, update the reference state to stay sync'd
        if (viewUser) {
          const updated = res.data.find((u: any) => u._id === viewUser._id);
          if (updated) setViewUser(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      if (res.success) setProperties(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFloors = async () => {
    try {
      const res = await api.get('/floors');
      if (res.success) setFloors(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/units');
      if (res.success) setUnits(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBillingData = async (userId: string) => {
    try {
      setLoadingBilling(true);
      const res = await api.get(`/users/${userId}/billing`);
      if (res.success) {
        setBillingData(res.data);
      }
    } catch (err) {
      console.error('Error fetching billing info:', err);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to revoke system access for this user?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
        if (viewUser && viewUser._id === id) {
          setViewUser(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Status/Suspend action
  const handleSuspendUser = async () => {
    if (!viewUser) return;
    const isCurrentlySuspended = viewUser.agreementStatus === 'Suspended';
    const actionText = isCurrentlySuspended ? 'activate' : 'suspend';
    if (confirm(`Are you sure you want to ${actionText} this user agreement?`)) {
      try {
        setIsSubmittingAction(true);
        const res = await api.put(`/users/${viewUser._id}`, {
          agreementStatus: isCurrentlySuspended ? 'Active' : 'Suspended'
        });
        if (res.success) {
          setViewUser(res.data);
          fetchUsers();
          alert(`User agreement status has been set to: ${res.data.agreementStatus}`);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to update agreement status');
      } finally {
        setIsSubmittingAction(false);
      }
    }
  };

  // Password reset action
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewUser || !newPassword.trim()) return;
    try {
      setIsSubmittingAction(true);
      const res = await api.put(`/users/${viewUser._id}`, {
        password: newPassword
      });
      if (res.success) {
        alert('Password reset successfully!');
        setShowResetPasswordModal(false);
        setNewPassword('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Profile Edit save
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAction(true);
      const res = await api.put(`/users/${viewUser._id}`, editForm);
      if (res.success) {
        setViewUser(res.data);
        fetchUsers();
        setIsEditingUser(false);
        alert('User details updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user details');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      name: viewUser.name,
      email: viewUser.email,
      phoneNumber: viewUser.phoneNumber || '',
      emergencyNumber: viewUser.emergencyNumber || '',
      address: viewUser.address || '',
      agreementStatus: viewUser.agreementStatus || 'Active',
      monthlyManagementAmount: viewUser.monthlyManagementAmount || 0,
      paymentType: viewUser.paymentType || 'Monthly',
      paymentDueDay: viewUser.paymentDueDay || 5,
      floorAssignmentStartDate: viewUser.floorAssignmentStartDate ? viewUser.floorAssignmentStartDate.split('T')[0] : '',
      floorAssignmentEndDate: viewUser.floorAssignmentEndDate ? viewUser.floorAssignmentEndDate.split('T')[0] : ''
    });
    setIsEditingUser(true);
  };

  // Distinct Premium Badges for Roles
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': 
        return 'text-success border-success bg-success bg-opacity-10';
      case 'Admin': 
        return 'text-dark border-secondary bg-light';
      case 'Owner': 
      case 'Floor Owner':
        return 'text-warning border-warning bg-warning bg-opacity-10';
      case 'OFFICE_OWNER': 
        return 'text-purple border-purple bg-purple-light';
      case 'FLOOR_ADMIN': 
        return 'text-primary border-primary bg-primary bg-opacity-10';
      case 'STAFF_ADMIN': 
        return 'text-info border-info bg-info bg-opacity-10';
      default: 
        return 'text-secondary border-secondary bg-light';
    }
  };

  const filteredUsers = users.filter(user => {
    const nameMatch = user.name ? user.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const emailMatch = user.email ? user.email.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Dynamic mapped names
  const getPropertyNames = (propIds: string[] = []) => {
    if (!propIds || propIds.length === 0) return 'None';
    return propIds.map(id => {
      const found = properties.find(p => p._id === id);
      return found ? found.propertyName : 'Unknown Property';
    }).join(', ');
  };

  const getFloorNames = (floorIds: string[] = []) => {
    if (!floorIds || floorIds.length === 0) return 'None';
    return floorIds.map(id => {
      const found = floors.find(f => f._id === id);
      return found ? (found.floorName || `Floor ${found.floorNumber}`) : 'Unknown Floor';
    }).join(', ');
  };

  const getUnitNames = (unitIds: string[] = []) => {
    if (!unitIds || unitIds.length === 0) return 'None';
    return unitIds.map(id => {
      const found = units.find(u => u._id === id);
      if (!found) return 'Unknown Unit';
      return found.unitName ? `${found.unitName} (Unit ${found.unitNumber})` : `Unit ${found.unitNumber}`;
    }).join(', ');
  };

  // Helper date duration parser
  const getAgreementDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const s = new Date(start);
    const e = new Date(end);
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (months <= 0) months = 1;
    return `${months} Months`;
  };

  // Helper for generating custom human User IDs
  const getDisplayUserId = (user: any, indexVal: number) => {
    const year = user.createdAt ? new Date(user.createdAt).getFullYear() : '2025';
    const suffix = user._id ? user._id.toString().slice(-6).toUpperCase() : String(indexVal).padStart(6, '0');
    return `USR-${year}-${suffix}`;
  };

  // Next due date calculator
  const getNextDueDate = (dueDay: number) => {
    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth(), dueDay || 5);
    if (current < today) {
      current.setMonth(current.getMonth() + 1);
    }
    return current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-0 p-md-0" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'var(--font-geist-sans)' }}>
      <style jsx global>{`
        .text-purple { color: #8b5cf6 !important; }
        .border-purple { border-color: #8b5cf6 !important; }
        .bg-purple { background-color: #8b5cf6 !important; }
        .bg-purple-light { background-color: rgba(139, 92, 246, 0.1) !important; }
        
        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        }
        .action-btn-view:hover {
          color: #014aad !important;
          border-color: #014aad !important;
          background: #f0f7ff !important;
        }
        .action-btn-folder:hover {
          color: #d97706 !important;
          border-color: #d97706 !important;
          background: #fffbeb !important;
        }
        .action-btn-revoke:hover {
          color: #dc2626 !important;
          border-color: #dc2626 !important;
          background: #fef2f2 !important;
        }

        /* Bento UI Styles */
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          font-size: 2rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
        }
        .active-badge-dot {
          width: 14px;
          height: 14px;
          background-color: #22c55e;
          border: 2px solid #ffffff;
          border-radius: 50%;
          position: absolute;
          bottom: 2px;
          right: 2px;
        }
        .meta-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 2px;
        }
        .meta-value {
          font-size: 0.85rem;
          color: #1e293b;
          font-weight: 600;
        }
        .stat-card-bento {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          text-align: center;
          min-width: 110px;
          flex: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .stat-card-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 4px;
        }
        .stat-card-label {
          font-size: 0.75rem;
          color: #64748b;
        }
        .detail-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
          height: 100%;
        }
        .detail-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .detail-grid-item {
          margin-bottom: 16px;
        }
        .detail-grid-label {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 4px;
        }
        .detail-grid-value {
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 600;
        }
        .tab-item {
          font-weight: 600;
          color: #64748b;
          border: none;
          background: none;
          padding: 12px 16px;
          position: relative;
          transition: all 0.2s ease;
        }
        .tab-item.active {
          color: #014aad;
        }
        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 16px;
          right: 16px;
          height: 3px;
          background-color: #014aad;
          border-radius: 99px;
        }
        .quick-action-btn {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .quick-action-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      `}</style>

      {!viewUser ? (
        /* ======================== 1. USERS LIST COMPONENT ======================== */
        <div className="bg-white border-2 d-flex flex-column" style={{ borderRadius: '8px', padding: '10px 10px', border: '1px solid #e0e0e0', height: 'calc(100vh - 20px)', margin: '10px' }}>
          
          {/* Header & Filter Bar Merged */}
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 pt-0 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
            <div className="d-flex gap-4">
              <div style={{ paddingBottom: '8px', cursor: 'pointer', marginBottom: '-1px' }}>
                <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>Access Management</span>
              </div>
            </div>

            {/* Right: Search, Filter, & Provision Button */}
            <div className="d-flex gap-3 align-items-center">
              <div className="position-relative" style={{ width: '260px' }}>
                <input
                  type="text"
                  className="form-control px-3 py-2 shadow-sm"
                  placeholder="Search by name or official email..."
                  style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="hgi-stroke hgi-search-01 position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
              </div>

              <div className="dropdown">
                <button className="btn bg-white border d-flex align-items-center justify-content-center shadow-sm" data-bs-toggle="dropdown" style={{ width: '40px', height: '40px', borderRadius: '4px', borderColor: '#e0e0e0' }}>
                  <i className="hgi-stroke hgi-filter text-dark"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 mt-2 p-2" style={{ minWidth: '200px', zIndex: 1050 }}>
                  <li><h6 className="dropdown-header fw-bold text-dark px-2">Filter by Role</h6></li>
                  {['All Roles', 'SUPER_ADMIN', 'Admin', 'FLOOR_ADMIN', 'OFFICE_OWNER', 'STAFF_ADMIN'].map(role => (
                    <li key={role}>
                      <button
                        className={`dropdown-item rounded py-2 d-flex align-items-center justify-content-between ${roleFilter === role ? 'bg-primary bg-opacity-10 text-primary fw-bold' : ''}`}
                        onClick={() => setRoleFilter(role)}
                      >
                        {role} {roleFilter === role && <i className="hgi-stroke hgi-checkmark-circle-02 text-primary"></i>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/admin/users/create"
                className="btn d-flex align-items-center justify-content-center gap-2 shadow-sm px-4"
                style={{ backgroundColor: "#014aad", color: '#ffffff', fontWeight: '500', borderRadius: '4px', height: '40px', fontSize: '0.85rem', border: 'none' }}
              >
                <i className="hgi-stroke hgi-user-add-01"></i> new user
              </Link>
            </div>
          </div>

          {/* Table Wrapper */}
          <div className="table-responsive flex-grow-1" style={{ overflowY: 'auto', minHeight: 0 }}>
            <table className="table mb-0 border-0 text-nowrap" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
              <thead>
                <tr className="border-0">
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopLeftRadius: '8px' }}>S No</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>User Name</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Access type</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Creation date</th>
                  <th className="py-3 px-4 fw-bold text-center" style={{ position: 'sticky', top: '0', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopRightRadius: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user._id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td className="py-2 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                      {String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold shadow-sm" style={{ width: '40px', height: '40px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '0.9rem' }}>{user.name}</h6>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge rounded-pill px-3 py-1 border ${getRoleBadge(user.role)}`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {user.role}
                        </span>
                        {user.role === 'STAFF_ADMIN' && user.staffCategory && user.staffCategory !== 'None' && (
                          <span className="badge rounded-pill px-2 py-1 bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25" style={{ fontSize: '0.7rem' }}>
                            <i className="hgi-stroke hgi-tag me-1"></i>{user.staffCategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 align-middle" style={{ border: 'none' }}>
                      <span className="text-dark fw-bold" style={{ fontSize: '0.85rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="py-2 px-4 align-middle text-center" style={{ border: 'none' }}>
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className="action-btn action-btn-view text-dark" 
                          title="View Detailed Profile"
                          onClick={() => setViewUser(user)}
                        >
                          <i className="hgi-stroke hgi-view"></i>
                        </button>
                        <button 
                          className="action-btn action-btn-revoke text-danger" 
                          title="Revoke System Access"
                          onClick={() => handleDelete(user._id)}
                        >
                          <i className="hgi-stroke hgi-user-block"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-5" style={{ border: 'none' }}>
                    <div className="d-flex flex-column align-items-center gap-3 py-4">
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                        <i className="hgi-stroke hgi-user-group text-muted" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                      <div className="text-center">
                        <h5 className="fw-bold mb-1">No Staff Found</h5>
                        <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                          No provisioned accounts found matching selected criteria.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================== 2. PREMIUM DETAILS VIEW PAGE ======================== */
        <div className="p-4" style={{ backgroundColor: '#f8fafc' }}>
          
          {/* Breadcrumbs & Header Controls Row */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <button 
                onClick={() => setViewUser(null)} 
                className="btn btn-link p-0 me-3 text-dark d-flex align-items-center justify-content-center"
                style={{ textDecoration: 'none' }}
              >
                <i className="hgi-stroke hgi-arrow-left-01 fs-4 fw-bold"></i>
              </button>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0 align-items-center" style={{ fontSize: '0.95rem' }}>
                  <li className="breadcrumb-item">
                    <span onClick={() => setViewUser(null)} style={{ cursor: 'pointer', color: '#64748b' }}>Users</span>
                  </li>
                  <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">User Details</li>
                </ol>
              </nav>
            </div>

            {/* Header Action Buttons */}
            <div className="d-flex gap-2">
              <button 
                onClick={startEditing} 
                className="btn btn-outline-secondary bg-white text-dark d-flex align-items-center gap-2 px-3 py-2 shadow-sm"
                style={{ borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #cbd5e1' }}
              >
                <i className="hgi-stroke hgi-pencil-line-01"></i> Edit User
              </button>
              
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary bg-white text-dark d-flex align-items-center gap-2 px-3 py-2 shadow-sm dropdown-toggle"
                  data-bs-toggle="dropdown"
                  style={{ borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #cbd5e1' }}
                >
                  ... More Actions
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3 p-2">
                  <li>
                    <button className="dropdown-item py-2 rounded" onClick={() => setShowResetPasswordModal(true)}>
                      <i className="hgi-stroke hgi-key-01 me-2 text-muted"></i> Reset Password
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 rounded text-danger" onClick={handleSuspendUser}>
                      <i className="hgi-stroke hgi-user-block me-2"></i> {viewUser.agreementStatus === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 rounded text-danger" onClick={() => handleDelete(viewUser._id)}>
                      <i className="hgi-stroke hgi-delete-02 me-2"></i> Revoke System Access
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Top Profile Summary Bento Box */}
          <div className="bg-white border p-4 mb-4 rounded-4 shadow-sm">
            <div className="row align-items-center g-4">
              
              {/* Profile Avatar & Contact Details */}
              <div className="col-lg-5 col-md-12 d-flex align-items-center gap-4 border-end border-light-subtle pr-lg-4">
                <div className="profile-avatar">
                  {viewUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  <span className="active-badge-dot" style={{ backgroundColor: viewUser.agreementStatus === 'Suspended' ? '#ef4444' : '#22c55e' }}></span>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                    <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.4rem' }}>{viewUser.name}</h4>
                    <span className="role-badge d-flex align-items-center gap-1">
                      <i className="hgi-stroke hgi-user-shield-01 text-primary"></i> {viewUser.role}
                    </span>
                    <span className="status-badge-active" style={{ 
                      backgroundColor: viewUser.agreementStatus === 'Suspended' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                      color: viewUser.agreementStatus === 'Suspended' ? '#ef4444' : '#22c55e'
                    }}>
                      {viewUser.agreementStatus || 'Active'}
                    </span>
                  </div>
                  <div className="d-flex flex-column gap-1 text-muted" style={{ fontSize: '0.85rem' }}>
                    <span className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-mail-01 text-muted"></i> {viewUser.email}
                    </span>
                    <span className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-smart-phone-01 text-muted"></i> {viewUser.phoneNumber || 'N/A'}
                    </span>
                    <span className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-location-01 text-muted"></i> {viewUser.address || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Metadata */}
              <div className="col-lg-3 col-md-6 d-flex flex-column gap-3 border-end border-light-subtle px-lg-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3 d-flex align-items-center justify-content-center text-muted" style={{ width: '36px', height: '36px' }}>
                    <i className="hgi-stroke hgi-badge fs-5"></i>
                  </div>
                  <div>
                    <div className="meta-label">User ID</div>
                    <div className="meta-value">{getDisplayUserId(viewUser, 0)}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3 d-flex align-items-center justify-content-center text-muted" style={{ width: '36px', height: '36px' }}>
                    <i className="hgi-stroke hgi-calendar-01 fs-5"></i>
                  </div>
                  <div>
                    <div className="meta-label">Created On</div>
                    <div className="meta-value">
                      {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}, {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3 d-flex align-items-center justify-content-center text-muted" style={{ width: '36px', height: '36px' }}>
                    <i className="hgi-stroke hgi-clock-01 fs-5"></i>
                  </div>
                  <div>
                    <div className="meta-label">Last Login</div>
                    <div className="meta-value">
                      {viewUser.createdAt ? new Date(new Date(viewUser.createdAt).getTime() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}, 04:45 PM
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Stats Block */}
              <div className="col-lg-4 col-md-6 px-lg-4">
                <div className="d-flex gap-3 justify-content-between">
                  <div className="stat-card-bento d-flex flex-column align-items-center justify-content-center">
                    <i className="hgi-stroke hgi-building-03 text-primary fs-4"></i>
                    <div className="stat-card-value">{viewUser.assignedFloors?.length || 0}</div>
                    <div className="stat-card-label">Total Floors</div>
                  </div>

                  <div className="stat-card-bento d-flex flex-column align-items-center justify-content-center">
                    <i className="hgi-stroke hgi-layers text-purple fs-4"></i>
                    <div className="stat-card-value">
                      {floors.filter(f => !f.assignedAdmin).length || 0}
                    </div>
                    <div className="stat-card-label">Available Floors</div>
                  </div>

                  <div className="stat-card-bento d-flex flex-column align-items-center justify-content-center">
                    <i className="hgi-stroke hgi-layout-grid-01 text-info fs-4"></i>
                    <div className="stat-card-value" style={{ fontSize: '1.15rem' }}>
                      {(viewUser.assignedFloors?.length > 0 ? (floors.filter(f => viewUser.assignedFloors.includes(f._id)).reduce((sum, f) => sum + (f.totalSft || 0), 0)) : 0).toLocaleString()}
                    </div>
                    <div className="stat-card-label">Managed Area</div>
                  </div>

                  <div className="stat-card-bento d-flex flex-column align-items-center justify-content-center">
                    <i className="hgi-stroke hgi-checkmark-circle-02 text-success fs-4"></i>
                    <div className="stat-card-value text-success" style={{ fontSize: '0.95rem', textTransform: 'capitalize' }}>
                      {viewUser.agreementStatus || 'Active'}
                    </div>
                    <div className="stat-card-label">Agreement Status</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="bg-white border rounded-4 shadow-sm mb-4 px-3 d-flex flex-wrap flex-row gap-2">
            {['Overview', 'Agreement Details', 'Payments', 'Permissions', 'Activity Log'].map(tab => (
              <button 
                key={tab} 
                className={`tab-item py-3 ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Rendering */}
          {activeTab === 'Overview' && (
            <div className="row g-4">
              
              {/* Left Column - User Details Grid */}
              <div className="col-lg-6 col-md-12">
                <div className="detail-card">
                  <div className="detail-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-user text-primary fs-5"></i>
                      <h5 className="fw-bold mb-0 text-dark">User Information</h5>
                    </div>
                    <button onClick={startEditing} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow-sm rounded-pill" style={{ fontSize: '0.8rem' }}>
                      <i className="hgi-stroke hgi-view me-1"></i> View Profile
                    </button>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Full Name</div>
                      <div className="detail-grid-value">{viewUser.name}</div>
                    </div>
                    
                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Alternate Contact</div>
                      <div className="detail-grid-value">{viewUser.emergencyNumber || 'N/A'}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Primary Role</div>
                      <div className="detail-grid-value">{viewUser.role}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Address</div>
                      <div className="detail-grid-value">{viewUser.address || 'N/A'}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Official Email</div>
                      <div className="detail-grid-value">{viewUser.email}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Password</div>
                      <div className="detail-grid-value d-flex align-items-center gap-2">
                        <span>{showPassword ? 'N/A (Write-Only)' : '••••••••'}</span>
                        <i 
                          className={`hgi-stroke ${showPassword ? 'hgi-view' : 'hgi-view-off-slash'} text-muted cursor-pointer`}
                          style={{ fontSize: '1.1rem' }}
                          onClick={() => setShowPassword(!showPassword)}
                        ></i>
                      </div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Mobile Number</div>
                      <div className="detail-grid-value">{viewUser.phoneNumber || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Agreement Summary */}
              <div className="col-lg-6 col-md-12">
                <div className="detail-card">
                  <div className="detail-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-document-text text-purple fs-5"></i>
                      <h5 className="fw-bold mb-0 text-dark">Agreement Summary</h5>
                    </div>
                    <button onClick={startEditing} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow-sm rounded-pill" style={{ fontSize: '0.8rem' }}>
                      <i className="hgi-stroke hgi-document-attachment me-1"></i> View Agreement
                    </button>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Agreement Status</div>
                      <div className="detail-grid-value">
                        <span className="badge rounded-pill px-3 py-1 bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.75rem' }}>
                          {viewUser.agreementStatus || 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Start Date</div>
                      <div className="detail-grid-value">
                        {viewUser.floorAssignmentStartDate ? new Date(viewUser.floorAssignmentStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Property</div>
                      <div className="detail-grid-value">{getPropertyNames(viewUser.assignedProperties)}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">End Date</div>
                      <div className="detail-grid-value">
                        {viewUser.floorAssignmentEndDate ? new Date(viewUser.floorAssignmentEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Floor</div>
                      <div className="detail-grid-value">{getFloorNames(viewUser.assignedFloors)}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Duration</div>
                      <div className="detail-grid-value">
                        {getAgreementDuration(viewUser.floorAssignmentStartDate, viewUser.floorAssignmentEndDate)}
                      </div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Payment Type</div>
                      <div className="detail-grid-value">{viewUser.paymentType || 'Monthly'}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Monthly Amount</div>
                      <div className="detail-grid-value">₹ {(viewUser.monthlyManagementAmount || 0).toLocaleString()}</div>
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      {/* Empty space matching layout */}
                    </div>

                    <div className="col-md-6 detail-grid-item">
                      <div className="detail-grid-label">Next Due Date</div>
                      <div className="detail-grid-value text-primary fw-bold">
                        {getNextDueDate(viewUser.paymentDueDay)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Payment History (Left) and Billing Overview/Actions (Right) */}
              <div className="col-lg-7 col-md-12">
                <div className="detail-card">
                  <div className="detail-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-credit-card text-primary fs-5"></i>
                      <h5 className="fw-bold mb-0 text-dark">Payment History</h5>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow-sm rounded-pill" style={{ fontSize: '0.8rem' }}>
                      <i className="hgi-stroke hgi-plus me-1"></i> View All Payments
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table align-middle text-nowrap table-hover mb-0">
                      <thead>
                        <tr>
                          <th className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Invoice ID</th>
                          <th className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Billing Period</th>
                          <th className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Amount</th>
                          <th className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Due Date</th>
                          <th className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Paid Date</th>
                          <th className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Status</th>
                          <th className="bg-light border-0 py-3 text-center text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingBilling ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              Loading billing history...
                            </td>
                          </tr>
                        ) : billingData?.invoices && billingData.invoices.length > 0 ? (
                          billingData.invoices.map((inv: any) => (
                            <tr key={inv.invoiceId}>
                              <td className="py-3 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{inv.invoiceId}</td>
                              <td className="py-3 text-muted" style={{ fontSize: '0.85rem' }}>{inv.billingPeriod}</td>
                              <td className="py-3 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>₹ {inv.amount.toLocaleString()}</td>
                              <td className="py-3 text-muted" style={{ fontSize: '0.85rem' }}>{new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td className="py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                                {inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="py-3">
                                <span className={`badge rounded-pill px-3 py-1 ${inv.status === 'Paid' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <a href="#" className="btn btn-link text-primary p-0">
                                  <i className="hgi-stroke hgi-download-01"></i>
                                </a>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              No billing history available for this profile.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column - Billing Overview & Quick Actions */}
              <div className="col-lg-5 col-md-12 d-flex flex-column gap-4">
                
                {/* Billing Overview Card */}
                <div className="detail-card">
                  <div className="detail-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-wallet-01 text-success fs-5"></i>
                      <h5 className="fw-bold mb-0 text-dark">Billing Overview</h5>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Total Billed</span>
                      <strong className="text-dark" style={{ fontSize: '1rem' }}>
                        ₹ {billingData?.summary ? billingData.summary.totalBilled.toLocaleString() : '0'}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Total Paid</span>
                      <strong className="text-success" style={{ fontSize: '1rem' }}>
                        ₹ {billingData?.summary ? billingData.summary.totalPaid.toLocaleString() : '0'}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Pending Amount</span>
                      <strong className="text-warning" style={{ fontSize: '1rem' }}>
                        ₹ {billingData?.summary ? billingData.summary.pendingAmount.toLocaleString() : '0'}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Overdue Amount</span>
                      <strong className="text-danger" style={{ fontSize: '1rem' }}>
                        ₹ {billingData?.summary ? billingData.summary.overdueAmount.toLocaleString() : '0'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="detail-card">
                  <div className="detail-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="hgi-stroke hgi-flash text-primary fs-5"></i>
                      <h5 className="fw-bold mb-0 text-dark">Quick Actions</h5>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button onClick={startEditing} className="quick-action-btn flex-grow-1 justify-content-center">
                      <i className="hgi-stroke hgi-pencil-line-01 text-primary"></i> Edit User
                    </button>
                    <button onClick={() => setShowResetPasswordModal(true)} className="quick-action-btn flex-grow-1 justify-content-center">
                      <i className="hgi-stroke hgi-key-01 text-purple"></i> Reset Password
                    </button>
                    <button className="quick-action-btn flex-grow-1 justify-content-center">
                      <i className="hgi-stroke hgi-download-01 text-success"></i> Download Agreement
                    </button>
                    <button onClick={handleSuspendUser} className="quick-action-btn flex-grow-1 justify-content-center border-danger text-danger bg-white">
                      <i className="hgi-stroke hgi-user-block"></i> {viewUser.agreementStatus === 'Suspended' ? 'Activate User' : 'Suspend User'}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Placeholders for Other Tabs */}
          {activeTab !== 'Overview' && (
            <div className="bg-white border rounded-4 p-5 text-center text-muted">
              <i className="hgi-stroke hgi-folder-open fs-1 text-muted mb-3 d-block"></i>
              <h5 className="fw-bold text-dark mb-1">{activeTab} Section</h5>
              <p className="small mb-0">Detailed list logs, spatial telemetry, and configurations relating to {activeTab} logs will populate here.</p>
            </div>
          )}

        </div>
      )}

      {/* ======================== 3. EDIT USER SIDE DRAWER MODAL ======================== */}
      {isEditingUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              <div className="modal-header border-0 px-4 py-3 bg-light d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0 text-dark">Edit User Profile Details</h5>
                <button type="button" className="btn-close" onClick={() => setIsEditingUser(false)}></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  <div className="row g-3">
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Full Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={editForm.name} 
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Official Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        required
                        value={editForm.email} 
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Mobile Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editForm.phoneNumber} 
                        onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Alternate/Emergency Contact</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editForm.emergencyNumber} 
                        onChange={e => setEditForm({ ...editForm, emergencyNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Residential/Office Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editForm.address} 
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Agreement Status</label>
                      <select 
                        className="form-select" 
                        value={editForm.agreementStatus}
                        onChange={e => setEditForm({ ...editForm, agreementStatus: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Monthly Management Amount</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={editForm.monthlyManagementAmount} 
                        onChange={e => setEditForm({ ...editForm, monthlyManagementAmount: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Payment Type</label>
                      <select 
                        className="form-select" 
                        value={editForm.paymentType}
                        onChange={e => setEditForm({ ...editForm, paymentType: e.target.value })}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Payment Due Day</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        min="1" 
                        max="31"
                        value={editForm.paymentDueDay} 
                        onChange={e => setEditForm({ ...editForm, paymentDueDay: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Assignment Start Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={editForm.floorAssignmentStartDate} 
                        onChange={e => setEditForm({ ...editForm, floorAssignmentStartDate: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Assignment End Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={editForm.floorAssignmentEndDate} 
                        onChange={e => setEditForm({ ...editForm, floorAssignmentEndDate: e.target.value })}
                      />
                    </div>

                  </div>
                </div>

                <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setIsEditingUser(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSubmittingAction}>
                    {isSubmittingAction ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ======================== 4. RESET PASSWORD MODAL ======================== */}
      {showResetPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              <div className="modal-header border-0 px-4 py-3 bg-light d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0 text-dark">Reset System Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowResetPasswordModal(false)}></button>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">New Account Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <span className="text-muted small d-block">
                    This will immediately encrypt and update the user's password in the database.
                  </span>
                </div>

                <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSubmittingAction}>
                    {isSubmittingAction ? 'Resetting...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
