"use client";

import React, { useState, useEffect } from 'react';
import { api } from "@/utils/api";

export default function PaymentsPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [leasesRes, usersRes, propertiesRes, floorsRes, meRes] = await Promise.all([
        api.get('/leases?limit=100'),
        api.get('/users'),
        api.get('/properties'),
        api.get('/floors'),
        api.get('/auth/me')
      ]);

      if (meRes.success) setCurrentUser(meRes.data);
      if (leasesRes.success) setLeases(leasesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (propertiesRes.success) setProperties(propertiesRes.data);
      if (floorsRes.success) setFloors(floorsRes.data);
    } catch (err) {
      console.error("Failed to load payments data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Tenant Lease Payment
  const handleTenantPaymentToggle = async (leaseId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    if (confirm(`Mark this lease's monthly due as ${nextStatus}?`)) {
      try {
        const response = await api.put(`/leases/${leaseId}`, { paymentStatus: nextStatus });
        if (response.success) {
          // Re-fetch local leases list
          const leasesRes = await api.get('/leases?limit=100');
          if (leasesRes.success) setLeases(leasesRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Toggle User Agreement Payment
  const handleUserPaymentToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Pending" : "Active";
    if (confirm(`Change this staff/owner agreement state to ${nextStatus}?`)) {
      try {
        const response = await api.put(`/users/${userId}`, { agreementStatus: nextStatus });
        if (response.success) {
          // Re-fetch local users list
          const usersRes = await api.get('/users');
          if (usersRes.success) setUsers(usersRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Core Mapped Data Arrays (Only including Active statuses as requested: "only staff management status active")
  const isOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Office Owner';

  const activeTenants = leases.filter(l => l.status === 'Active');
  
  const activeStaffAndOwners = users.filter(u => u.agreementStatus === 'Active');

  // Unified list of active payees for calculations and display
  const unifiedPayees: any[] = [];

  // 1. Populate Tenants
  activeTenants.forEach(l => {
    const rent = l.monthlyRent || 0;
    const cam = l.maintenanceCharges || 0;
    const totalDues = rent + cam;
    const isPaid = l.paymentStatus === 'Paid';

    unifiedPayees.push({
      id: l._id,
      type: 'TenantLease',
      name: l.tenantName || 'Tenant',
      email: l.tenantContact || 'N/A',
      role: 'Tenant',
      spatial: l.units && l.units.length > 0 ? `Unit ${l.units[0].unitNumber}` : 'N/A',
      dues: totalDues,
      dueDay: l.dueDay || 5,
      isPaid: isPaid,
      statusLabel: isPaid ? 'Paid' : 'Unpaid'
    });
  });

  // 2. Populate Active Staff & Owners (Floor Owners, Office Owners, Floor Admins)
  activeStaffAndOwners.forEach(u => {
    const dues = u.monthlyManagementAmount || 0;
    // Map spatial names
    const props = (u.assignedProperties || []).map((id: string) => {
      const found = properties.find(p => p._id === id);
      return found ? found.propertyName : '';
    }).filter(Boolean).join(', ');

    const flrs = (u.assignedFloors || []).map((id: string) => {
      const found = floors.find(f => f._id === id);
      return found ? (found.floorName || `Floor ${found.floorNumber}`) : '';
    }).filter(Boolean).join(', ');

    const isPaid = u.agreementStatus === 'Active'; // Mapped active status implies active fee cycle

    unifiedPayees.push({
      id: u._id,
      type: 'UserAgreement',
      name: u.name || 'Owner / Admin',
      email: u.email || 'N/A',
      role: u.role,
      spatial: `${props || 'N/A'} - ${flrs || 'No Floor'}`,
      dues: dues,
      dueDay: u.paymentDueDay || 5,
      isPaid: isPaid,
      statusLabel: u.agreementStatus || 'Active'
    });
  });

  // Real-time Receivables Calculations (based on active status)
  const totalReceivables = unifiedPayees.reduce((acc, p) => acc + p.dues, 0);
  const totalCollected = unifiedPayees.filter(p => p.isPaid).reduce((acc, p) => acc + p.dues, 0);
  const totalOutstanding = totalReceivables - totalCollected;
  const activeSourcesCount = unifiedPayees.length;

  // Filter Search Results
  const filteredPayees = unifiedPayees.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = roleFilter === "All" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'text-success border-success bg-success bg-opacity-10';
      case 'Tenant': return 'text-success border-success bg-success bg-opacity-10';
      case 'Floor Admin': return 'text-primary border-primary bg-primary bg-opacity-10';
      case 'Office Owner': return 'text-purple border-purple bg-purple-light';
      case 'Staff Admin': return 'text-info border-info bg-info bg-opacity-10';
      default: return 'text-warning border-warning bg-warning bg-opacity-10';
    }
  };

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isFloorAdmin = currentUser?.role === 'Floor Admin';

  if (currentUser && !isSuperAdmin && !isFloorAdmin && !isOwner) {
    return (
      <div className="container py-5 text-center bg-white shadow-sm border rounded-xl mt-4" style={{ fontFamily: 'var(--font-geist-sans)' }}>
        <i className="bi bi-shield-slash-fill text-danger fs-1 d-block mb-3"></i>
        <h4 className="fw-bold text-dark">Unauthorized Access</h4>
        <p className="text-muted small">You do not have administrative permissions to view or handle the payments ledger.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ fontFamily: 'var(--font-geist-sans)' }}>
      <style jsx global>{`
        .text-purple { color: #8b5cf6 !important; }
        .border-purple { border-color: #8b5cf6 !important; }
        .bg-purple { background-color: #8b5cf6 !important; }
        .bg-purple-light { background-color: rgba(139, 92, 246, 0.1) !important; }
        
        .stat-card {
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
            {isOwner 
              ? `Office Payments & Collections: ${currentUser?.companyName || currentUser?.name || 'My Office'}`
              : "Monthly Collections & Receivables"
            }
          </h2>
          <p className="text-muted small mb-0">
            {isOwner
              ? "Monitor active tenant lease collections and your monthly spatial management dues."
              : "Monitor active spatial subscriptions, landlord agreements, and billing dues."
            }
          </p>
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card p-3 d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-wallet2 fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Monthly Receivables</span>
              <h4 className="fw-bold text-dark mb-0">₹{totalReceivables.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card p-3 d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-check-circle-fill fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Total Collected</span>
              <h4 className="fw-bold text-success mb-0">₹{totalCollected.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card p-3 d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Outstanding Dues</span>
              <h4 className="fw-bold text-danger mb-0">₹{totalOutstanding.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card p-3 d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-shield-check fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Active Revenue Sources</span>
              <h4 className="fw-bold text-dark mb-0">{activeSourcesCount} Contracts</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
        <div className="bg-white border rounded px-3 d-flex align-items-center gap-2 flex-grow-1 shadow-sm" style={{ maxWidth: "340px", height: "36px" }}>
          <i className="bi bi-search text-muted" style={{ fontSize: "0.85rem" }}></i>
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none"
            placeholder="Search payee name or official email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>

        {!isOwner && (
          <select
            className="form-select border rounded fw-medium text-muted bg-white shadow-sm"
            style={{ width: "180px", height: "36px", fontSize: "0.85rem" }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Tenant">Tenants</option>
            <option value="Floor Admin">Floor Admins</option>
            <option value="Office Owner">Office Owners</option>
            <option value="Staff Admin">Staff Admins</option>
          </select>
        )}
      </div>

      {/* Unified Table Card */}
      <div className="bg-white rounded border shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle text-nowrap" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                {["S No", "Payee Details", "Access Role", "Spatial Block", "Monthly Receivable", "Due Date Status", "Collection Action"].map((col, i) => (
                  <th
                    key={col}
                    className="py-3 px-4 fw-bold text-start"
                    style={{
                      backgroundColor: "#3f3f3f",
                      color: "#ffffff",
                      fontSize: "0.78rem",
                      border: "none",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <div className="text-muted small mt-2">Loading active collections ledger...</div>
                  </td>
                </tr>
              ) : filteredPayees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted small">
                    <i className="bi bi-file-earmark-lock fs-2 d-block mb-2 text-muted opacity-50"></i>
                    No active collection contracts match the selected query.
                  </td>
                </tr>
              ) : filteredPayees.map((payee, index) => (
                <tr
                  key={`${payee.type}-${payee.id}`}
                  style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                >
                  <td className="py-2 px-4 text-muted" style={{ border: "none", fontSize: "0.8rem" }}>
                    {String(index + 1).padStart(3, "0")}
                  </td>

                  <td className="py-2 px-4" style={{ border: "none" }}>
                    <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>{payee.name}</div>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>{payee.email}</div>
                  </td>

                  <td className="py-2 px-4" style={{ border: "none" }}>
                    <span className={`badge rounded-pill px-3 py-1 border ${getRoleBadgeClass(payee.role)}`} style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
                      {payee.role}
                    </span>
                  </td>

                  <td className="py-2 px-4" style={{ border: "none" }}>
                    <div className="small fw-semibold text-dark">{payee.spatial}</div>
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>Spatial Mapping Block</span>
                  </td>

                  <td className="py-2 px-4" style={{ border: "none" }}>
                    <div className="fw-bold text-primary" style={{ fontSize: "0.85rem", color: "#014aad" }}>
                      ₹{payee.dues.toLocaleString()}
                    </div>
                  </td>

                  <td className="py-2 px-4" style={{ border: "none" }}>
                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill px-2" style={{ fontSize: "0.7rem" }}>
                      {payee.dueDay}th of Month
                    </span>
                  </td>

                  <td className="py-2 px-4" style={{ border: "none" }}>
                    {payee.type === 'TenantLease' ? (
                      <button
                        className={`btn btn-sm rounded-pill fw-bold px-3 py-1 border transition-all ${
                          payee.isPaid 
                            ? "bg-success bg-opacity-10 text-success border-success" 
                            : "bg-danger bg-opacity-10 text-danger border-danger"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                        onClick={() => handleTenantPaymentToggle(payee.id, payee.isPaid ? 'Paid' : 'Unpaid')}
                      >
                        {payee.isPaid ? 'Collected' : 'Pending Payment'}
                      </button>
                    ) : (
                      <button
                        className={`btn btn-sm rounded-pill fw-bold px-3 py-1 border transition-all ${
                          payee.isPaid 
                            ? "bg-success bg-opacity-10 text-success border-success" 
                            : "bg-danger bg-opacity-10 text-danger border-danger"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                        onClick={() => handleUserPaymentToggle(payee.id, payee.statusLabel)}
                      >
                        {payee.isPaid ? 'Collected' : 'Suspended Cycle'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
