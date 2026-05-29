"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from "@/utils/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [viewUser, setViewUser] = useState<any | null>(null);

  // States to hold details populated from the DB
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchProperties();
    fetchFloors();
    fetchUnits();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) setUsers(res.data);
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to revoke system access for this user?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Distinct Premium Badges for Roles (Separating Owner/Floor Owner & Office Owner)
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin': 
        return 'text-success border-success bg-success bg-opacity-10';
      case 'Admin': 
        return 'text-dark border-secondary bg-light';
      case 'Owner': 
      case 'Floor Owner':
        return 'text-warning border-warning bg-warning bg-opacity-10';
      case 'Office Owner': 
        return 'text-purple border-purple bg-purple-light';
      case 'Floor Admin': 
        return 'text-primary border-primary bg-primary bg-opacity-10';
      case 'Staff Admin': 
        return 'text-info border-info bg-info bg-opacity-10';
      case 'Tenant': 
        return 'text-secondary border-secondary bg-light';
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

  return (
    <div className="p-0 p-md-0" style={{ backgroundColor: '#ffffff', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-geist-sans)' }}>
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

        .folder-card {
          border: 1px dashed #cbd5e1;
          background-color: #f8fafc;
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .folder-card:hover {
          border-color: #014aad;
          background-color: #f0f7ff;
          transform: translateY(-1px);
        }
      `}</style>

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
              <i className="bi bi-search position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
            </div>

            <div className="dropdown">
              <button className="btn bg-white border d-flex align-items-center justify-content-center shadow-sm" data-bs-toggle="dropdown" style={{ width: '40px', height: '40px', borderRadius: '4px', borderColor: '#e0e0e0' }}>
                <i className="bi bi-funnel text-dark"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 mt-2 p-2" style={{ minWidth: '200px', zIndex: 1050 }}>
                <li><h6 className="dropdown-header fw-bold text-dark px-2">Filter by Role</h6></li>
                {['All Roles', 'Super Admin', 'Admin', 'Floor Admin', 'Office Owner', 'Staff Admin'].map(role => (
                  <li key={role}>
                    <button
                      className={`dropdown-item rounded py-2 d-flex align-items-center justify-content-between ${roleFilter === role ? 'bg-primary bg-opacity-10 text-primary fw-bold' : ''}`}
                      onClick={() => setRoleFilter(role)}
                    >
                      {role} {roleFilter === role && <i className="bi bi-check text-primary"></i>}
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
              <i className="bi bi-person-plus-fill"></i> new user
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
                      {user.role === 'Staff Admin' && user.staffCategory && user.staffCategory !== 'None' && (
                        <span className="badge rounded-pill px-2 py-1 bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-tag-fill me-1"></i>{user.staffCategory}
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
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button 
                        className="action-btn action-btn-folder text-warning" 
                        title="Lease & ID Folder"
                        onClick={() => setViewUser(user)}
                      >
                        <i className="bi bi-folder-fill"></i>
                      </button>
                      <button 
                        className="action-btn action-btn-revoke text-danger" 
                        title="Revoke System Access"
                        onClick={() => handleDelete(user._id)}
                      >
                        <i className="bi bi-shield-slash-fill"></i>
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
                      <i className="bi bi-people text-muted" style={{ fontSize: '2.5rem' }}></i>
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

      {/* PREMIUM DETAILS & LEASE FOLDER OVERLAY MODAL */}
      {viewUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050, backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              
              {/* Modal Header */}
              <div className="modal-header border-0 px-4 py-3 bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-person-bounding-box" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{viewUser.name}</h5>
                    <span className="text-muted small">System Access Profile & Documents</span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setViewUser(null)}></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                
                {/* Section 1: Personal & Organization Data */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-person-fill text-primary me-2"></i>Personnel Info & Contact</h6>
                  <div className="row g-3 p-3 bg-light rounded-3 border border-light-subtle">
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Official Email ID</span>
                      <strong className="text-dark small">{viewUser.email || 'N/A'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Phone Number</span>
                      <strong className="text-dark small">{viewUser.phoneNumber || 'N/A'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Alternate / Emergency Contact</span>
                      <strong className="text-dark small">{viewUser.emergencyNumber || 'N/A'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Organization Name</span>
                      <strong className="text-dark small">{viewUser.companyName || 'N/A'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Tenant Profile Category</span>
                      <strong className="text-dark small">{viewUser.tenantType || 'Individual'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">GSTIN / PAN Code</span>
                      <strong className="text-dark small">{viewUser.gstPan || 'N/A'}</strong>
                    </div>
                    {viewUser.role === 'Staff Admin' && viewUser.staffCategory && viewUser.staffCategory !== 'None' && (
                      <div className="col-md-4 animate-fadeIn">
                        <span className="text-muted small d-block">Staff Category</span>
                        <strong className="text-primary small d-flex align-items-center gap-1">
                          <i className="bi bi-patch-check-fill text-success"></i> {viewUser.staffCategory}
                        </strong>
                      </div>
                    )}
                    <div className="col-12 border-top pt-2">
                      <span className="text-muted small d-block">Residential Address</span>
                      <strong className="text-dark small">{viewUser.address || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 2: Spatial Assignments & Agreement Statistics */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-layers-fill text-primary me-2"></i>Spatial Assignment Configuration</h6>
                  <div className="row g-3 p-3 bg-light rounded-3 border border-light-subtle">
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Leased / Managed Properties</span>
                      <strong className="text-dark small">{getPropertyNames(viewUser.assignedProperties)}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Leased / Managed Floors</span>
                      <strong className="text-dark small">{getFloorNames(viewUser.assignedFloors)}</strong>
                    </div>
                    <div className="col-md-12">
                      <span className="text-muted small d-block">Specific Offices / Unit Allocations</span>
                      <strong className="text-dark small">{getUnitNames(viewUser.assignedUnits)}</strong>
                    </div>
                    <div className="col-md-4 border-top pt-2">
                      <span className="text-muted small d-block">Assignment Start Date</span>
                      <strong className="text-dark small">
                        {viewUser.floorAssignmentStartDate ? new Date(viewUser.floorAssignmentStartDate).toLocaleDateString('en-GB') : 'N/A'}
                      </strong>
                    </div>
                    <div className="col-md-4 border-top pt-2">
                      <span className="text-muted small d-block">Assignment End Date</span>
                      <strong className="text-dark small">
                        {viewUser.floorAssignmentEndDate ? new Date(viewUser.floorAssignmentEndDate).toLocaleDateString('en-GB') : 'N/A'}
                      </strong>
                    </div>
                    <div className="col-md-4 border-top pt-2">
                      <span className="text-muted small d-block">Agreement Status</span>
                      <span className={`badge rounded-pill px-3 py-1 ${
                        viewUser.agreementStatus === 'Active' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'
                      }`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {viewUser.agreementStatus || 'Active'}
                      </span>
                    </div>
                    <div className="col-md-4 border-top pt-2">
                      <span className="text-muted small d-block">Monthly Management Dues</span>
                      <strong className="text-primary small">₹{(viewUser.monthlyManagementAmount || 0).toLocaleString()}</strong>
                    </div>
                    <div className="col-md-4 border-top pt-2">
                      <span className="text-muted small d-block">Billing Frequency</span>
                      <strong className="text-dark small">{viewUser.paymentType || 'Monthly'}</strong>
                    </div>
                    <div className="col-md-4 border-top pt-2">
                      <span className="text-muted small d-block">Invoicing Due Day</span>
                      <strong className="text-dark small">{viewUser.paymentDueDay || 5}th of Month</strong>
                    </div>
                  </div>
                </div>

                {/* Section 3: Premium Document & Lease Folders */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-folder2-open text-primary me-2"></i>Lease & Identity Folder</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="folder-card p-3 rounded-3 d-flex align-items-center gap-3">
                        <i className="bi bi-file-earmark-person-fill text-warning fs-3"></i>
                        <div>
                          <strong className="d-block small text-dark">ID Proof Document</strong>
                          <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>
                            {viewUser.idProofUrl || 'identity_verification.pdf'}
                          </span>
                          <span className="text-primary small fw-bold">View Document <i className="bi bi-arrow-right"></i></span>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="folder-card p-3 rounded-3 d-flex align-items-center gap-3">
                        <i className="bi bi-file-earmark-medical-fill text-primary fs-3"></i>
                        <div>
                          <strong className="d-block small text-dark">Management Agreement Contract</strong>
                          <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>
                            {viewUser.remarks ? 'custom_agreement_notes.txt' : 'standard_operating_lease.pdf'}
                          </span>
                          <span className="text-primary small fw-bold">View Contract <i className="bi bi-arrow-right"></i></span>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="folder-card p-3 rounded-3 d-flex align-items-center gap-3">
                        <i className="bi bi-person-square text-info fs-3"></i>
                        <div>
                          <strong className="d-block small text-dark">Profile Avatar Photo</strong>
                          <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>
                            {viewUser.profilePhotoUrl || 'avatar_image.png'}
                          </span>
                          <span className="text-primary small fw-bold">Open File <i className="bi bi-arrow-right"></i></span>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="folder-card p-3 rounded-3 d-flex align-items-center gap-3">
                        <i className="bi bi-shield-fill-check text-success fs-3"></i>
                        <div>
                          <strong className="d-block small text-dark">Role Permission Certificate</strong>
                          <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>
                            security_policy_signed.pem
                          </span>
                          <span className="text-primary small fw-bold">Inspect Keys <i className="bi bi-arrow-right"></i></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end">
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-bold shadow-sm" onClick={() => setViewUser(null)}>
                  Close Details
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
