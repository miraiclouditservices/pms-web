"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import FilterDrawer from "@/components/users/FilterDrawer";
import UserDetailView from "@/components/users/UserDetailView";
import EditUserModal from "@/components/users/modals/EditUserModal";
import ResetPasswordModal from "@/components/users/modals/ResetPasswordModal";
import RecordPaymentModal from "@/components/users/modals/RecordPaymentModal";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All');
  const [staffCategoryFilter, setStaffCategoryFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Navigation & details view state
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Agreement & payment data states
  const [agreementData, setAgreementData] = useState<any>(null);  // { agreements: [], summary: {} }
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [billingData, setBillingData] = useState<any>(null);  // { invoices: [], summary: {} }
  const [loadingBilling, setLoadingBilling] = useState(false);

  // Edit and Quick Action states
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [paymentModeInput, setPaymentModeInput] = useState('UPI');
  const [transactionRefInput, setTransactionRefInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Global lists for mapping
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchProperties();
    fetchFloors();
    fetchUnits();
  }, []);

  // Reset pagination to page 1 when filter or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, roleFilter, statusFilter, staffCategoryFilter]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage, debouncedSearchQuery, roleFilter, statusFilter, staffCategoryFilter]);

  // Sync agreement & billing data when viewed user changes
  useEffect(() => {
    if (viewUser) {
      fetchAgreementData(viewUser._id);
      fetchBillingData(viewUser._id);
    } else {
      setAgreementData(null);
      setBillingData(null);
    }
  }, [viewUser]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      if (debouncedSearchQuery.trim()) {
        params.append('search', debouncedSearchQuery.trim());
      }
      if (roleFilter !== 'All Roles') {
        params.append('role', roleFilter);
      }
      if (statusFilter !== 'All') {
        params.append('agreementStatus', statusFilter);
      }
      if (staffCategoryFilter !== 'All') {
        params.append('staffCategory', staffCategoryFilter);
      }

      const res = await api.get(`/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.data);
        if (res.pagination) {
          setTotalItems(res.pagination.total);
          setTotalPages(res.pagination.pages);
        } else {
          setTotalItems(res.data.length);
          setTotalPages(Math.ceil(res.data.length / itemsPerPage) || 1);
        }
        // If viewing, update the reference state to stay sync'd
        if (viewUser) {
          const updated = res.data.find((u: any) => u._id === viewUser._id);
          if (updated) setViewUser(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
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

  const fetchAgreementData = async (userId: string) => {
    try {
      setLoadingAgreement(true);
      const res = await api.get(`/agreements/user/${userId}`);
      if (res.success) {
        setAgreementData(res.data); // { agreements: [], summary: {} }
      }
    } catch (err) {
      console.error('Error fetching agreement data:', err);
    } finally {
      setLoadingAgreement(false);
    }
  };

  const fetchBillingData = async (userId: string) => {
    try {
      setLoadingBilling(true);
      const res = await api.get(`/users/${userId}/billing`);
      if (res.success) {
        setBillingData(res.data); // { invoices: [], summary: {} }
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoadingBilling(false);
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement || !viewUser) return;
    const amt = Number(paymentAmountInput);
    if (!amt || amt <= 0) return alert('Enter a valid amount');
    try {
      setIsSubmittingPayment(true);
      const res = await api.post(`/agreements/${selectedAgreement._id}/payments`, {
        amountPaid: amt,
        paymentDate: paymentDateInput || new Date().toISOString(),
        paymentMode: paymentModeInput,
        transactionRef: transactionRefInput || undefined,
        notes: notesInput || 'Recorded via admin portal'
      });
      if (res.success) {
        const receipt = res.data?.transactionId || 'N/A';
        alert(`Payment of Ã¢â€šÂ¹${amt.toLocaleString()} recorded! Transaction ID / Receipt: ${receipt}`);
        setShowPaymentModal(false);
        setSelectedAgreement(null);
        setTransactionRefInput('');
        setNotesInput('');
        setPaymentAmountInput('');
        setPaymentDateInput(new Date().toISOString().split('T')[0]);
        fetchAgreementData(viewUser._id);
        fetchBillingData(viewUser._id);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Password reset action
  const handleResetPassword = async (e: React.FormEvent, password: string) => {
    e.preventDefault();
    if (!viewUser || !password.trim()) return;
    try {
      setIsSubmittingAction(true);
      const res = await api.put(`/users/${viewUser._id}`, { password });
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
      totalAgreementAmount: viewUser.totalAgreementAmount || 0,
      paymentType: viewUser.paymentType || 'Monthly Installment',
      paymentDueDay: viewUser.paymentDueDay || 5,
      floorAssignmentStartDate: viewUser.floorAssignmentStartDate ? viewUser.floorAssignmentStartDate.split('T')[0] : '',
      floorAssignmentEndDate: viewUser.floorAssignmentEndDate ? viewUser.floorAssignmentEndDate.split('T')[0] : '',
      role: viewUser.role
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

  // Helper date duration parser
  const getAgreementDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const s = new Date(start);
    const e = new Date(end);
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (months <= 0) months = 1;
    return `${months} Months`;
  };

  // Helper to generate dynamic installment schedule
  const generateInstallments = (user: any, agr: any, paymentsList: any[] = []) => {
    const startStr = agr?.startDate || user?.floorAssignmentStartDate;
    const endStr = agr?.endDate || user?.floorAssignmentEndDate;
    if (!startStr || !endStr) return [];

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

    // Term in months
    const termMonths = Math.max((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1, 1);

    // Amount details
    const totalAmount = agr?.totalAmount || user?.totalAgreementAmount || ((user?.monthlyManagementAmount || 0) * termMonths);
    const paymentType = agr?.paymentType || user?.paymentType || 'Monthly';
    const dueDay = agr?.paymentDueDay || user?.paymentDueDay || 5;

    // Determine interval in months
    let intervalMonths = 1;
    if (paymentType.includes('Quarterly')) intervalMonths = 3;
    else if (paymentType.includes('Half-Yearly')) intervalMonths = 6;
    else if (paymentType.includes('Yearly')) intervalMonths = 12;
    else if (paymentType.includes('One Time')) intervalMonths = termMonths;

    // Number of installments
    const numInstallments = Math.max(1, Math.ceil(termMonths / intervalMonths));
    const installmentAmount = Math.ceil(totalAmount / numInstallments);

    // Calculate total paid
    let totalPaid = agr?.totalPaid || 0;
    if (paymentsList && paymentsList.length > 0) {
      totalPaid = paymentsList.reduce((sum: number, p: any) => sum + (p.amountPaid || p.amount || 0), 0);
    }

    const schedule = [];
    let remainingPaid = totalPaid;

    for (let i = 0; i < numInstallments; i++) {
      const currentDueDate = new Date(start);
      currentDueDate.setMonth(start.getMonth() + i * intervalMonths);
      currentDueDate.setDate(dueDay);

      const formattedDueDate = currentDueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      let paid = 0;
      let balance = installmentAmount;
      let status = 'Pending';

      if (remainingPaid >= installmentAmount) {
        paid = installmentAmount;
        balance = 0;
        status = 'Paid';
        remainingPaid -= installmentAmount;
      } else if (remainingPaid > 0) {
        paid = remainingPaid;
        balance = installmentAmount - remainingPaid;
        status = 'Partial';
        remainingPaid = 0;
      }

      schedule.push({
        invoiceNo: `INV-${(i + 1).toString().padStart(3, '0')}`,
        dueDate: formattedDueDate,
        amount: installmentAmount,
        paid,
        balance,
        status
      });
    }

    return schedule;
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

  const getDaysRemaining = (endDateString: string) => {
    if (!endDateString) return null;
    const endDate = new Date(endDateString);
    const today = new Date();
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sendExpiryNotification = async (user: any) => {
    try {
      const res = await api.post('/notifications', {
        user: user._id,
        title: 'Agreement Expiring Soon',
        message: `Dear ${user.name}, your access agreement is expiring soon (on ${new Date(user.floorAssignmentEndDate).toLocaleDateString('en-GB')}). Please renew it as soon as possible.`,
        type: 'Alert'
      });
      if (res.success) {
        alert(`Notification sent successfully to ${user.name}!`);
      } else {
        alert(`Failed to send notification: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error sending notification: ${err.message || err}`);
    }
  };

  const ShimmerRow = () => (
    <tr className="border-0">
      <td className="py-3 px-4 align-middle">
        <div className="shimmer-wrapper shimmer-line" style={{ width: '30px' }}></div>
      </td>
      <td className="py-3 px-4 align-middle">
        <div className="d-flex align-items-center gap-3">
          <div className="shimmer-wrapper shimmer-circle"></div>
          <div className="d-flex flex-column gap-2 flex-grow-1">
            <div className="shimmer-wrapper shimmer-line" style={{ width: '120px' }}></div>
            <div className="shimmer-wrapper shimmer-line" style={{ width: '180px' }}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 align-middle">
        <div className="d-flex gap-2">
          <div className="shimmer-wrapper shimmer-line" style={{ width: '80px', height: '20px', borderRadius: '12px' }}></div>
        </div>
      </td>
      <td className="py-3 px-4 align-middle">
        <div className="shimmer-wrapper shimmer-line" style={{ width: '100px' }}></div>
      </td>
      <td className="py-3 px-4 align-middle text-center">
        <div className="shimmer-wrapper shimmer-circle" style={{ width: '32px', height: '32px' }}></div>
      </td>
    </tr>
  );

  const tableColumns: TableColumn<any>[] = [
    {
      header: "Name",
      render: (user) => (
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold shadow-sm animate-avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '0.9rem' }}>{user.name}</h6>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</span>
          </div>
        </div>
      )
    },
    {
      header: "Access Type",
      render: (user) => (
        <div className="d-flex flex-column align-items-start gap-1">
          <span className={`badge rounded-pill px-3 py-1 border ${getRoleBadge(user.role)}`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
            {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
              user.role === 'FLOOR_ADMIN' ? 'Floor Admin' :
                user.role === 'OFFICE_OWNER' ? 'Office Owner' :
                  user.role === 'STAFF_ADMIN' ? 'Staff Admin' : user.role}
          </span>
          {user.role === 'STAFF_ADMIN' && user.staffCategory && user.staffCategory !== 'None' && (
            <span className="badge rounded-pill px-2 py-0.5 bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25" style={{ fontSize: '0.65rem' }}>
              <i className="hgi-stroke hgi-tag me-1"></i>{user.staffCategory}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Agreement Dates",
      render: (user) => {
        const daysRemaining = getDaysRemaining(user.floorAssignmentEndDate);
        const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
        const isExpired = daysRemaining !== null && daysRemaining < 0;

        return (
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-1">
              <span className="text-muted small" style={{ minWidth: '70px', fontSize: '0.75rem' }}>Start Date:</span>
              <span className="text-dark fw-bold" style={{ fontSize: '0.82rem' }}>
                {user.floorAssignmentStartDate ? new Date(user.floorAssignmentStartDate).toLocaleDateString('en-GB') : 'N/A'}
              </span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="text-muted small" style={{ minWidth: '70px', fontSize: '0.75rem' }}>End Date:</span>
              <span className="text-dark fw-bold" style={{ fontSize: '0.82rem' }}>
                {user.floorAssignmentEndDate ? new Date(user.floorAssignmentEndDate).toLocaleDateString('en-GB') : 'Permanent'}
              </span>
              {isExpiringSoon && (
                <span className="badge rounded-pill bg-warning text-dark border border-warning border-opacity-50 px-2 py-0.5 ms-2 animate-pulse-warning" style={{ fontSize: '0.65rem' }}>
                  Ã¢Å¡Â Ã¯Â¸Â Due in {daysRemaining} days
                </span>
              )}
              {isExpired && (
                <span className="badge rounded-pill bg-danger text-white border border-danger border-opacity-50 px-2 py-0.5 ms-2" style={{ fontSize: '0.65rem' }}>
                  Ã°Å¸Å¡Â« Overdue (Expired)
                </span>
              )}
              {(isExpiringSoon || isExpired) && (
                <button
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center p-1 border-0 shadow-none hover-notify ms-1"
                  style={{ borderRadius: '50%', width: '20px', height: '20px' }}
                  title="Send Expiry Warning Notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendExpiryNotification(user);
                  }}
                >
                  <i className="hgi-stroke hgi-notification-02" style={{ fontSize: '0.8rem' }}></i>
                </button>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Actions",
      style: { textAlign: 'center' },
      render: (user) => (
        <div className="d-flex justify-content-center gap-2">
          <button
            className="action-btn action-btn-view text-dark"
            title="View Detailed Profile"
            onClick={() => setViewUser(user)}
          >
            <i className="hgi-stroke hgi-view"></i>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className={`p-0 d-flex flex-column ${!viewUser ? 'bg-white border rounded-4 ' : ''}`} style={{ height: 'calc(100vh - 104px)', fontFamily: 'var(--font-geist-sans)', overflow: 'hidden' }}>


      {!viewUser ? (
        /* ======================== 1. USERS LIST COMPONENT ======================== */
        <div className="bg-white d-flex flex-column h-100" style={{ margin: '0px', padding: '0px', overflow: 'hidden' }}>

          {/* Header & Filter Bar Merged */}
          <div className="d-flex justify-content-between align-items-center mb-1 pb-2 pt-3 px-4 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
            <div className="d-flex gap-4">
              <div style={{ paddingBottom: '8px', cursor: 'pointer', marginBottom: '-1px' }}>
                <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>Access Management</span>
              </div>
            </div>

            {/* Right: Search, Filter Toggle, & Provision Button */}
            <div className="d-flex gap-3 align-items-center">
              <div className="position-relative" style={{ width: '250px' }}>
                <input
                  type="text"
                  className="form-control px-3 py-2"
                  placeholder="Search by name, email, phone..."
                  style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="hgi-stroke hgi-search-01 position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
              </div>



              <button
                className={`btn border d-flex align-items-center justify-content-center ${showAdvancedFilters ? 'bg-primary text-white border-primary' : 'bg-white text-dark border-light'}`}
                onClick={() => setShowAdvancedFilters(true)}
                style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                title="Toggle Filters"
              >
                <i className={`hgi-stroke hgi-filter ${showAdvancedFilters ? 'text-white' : 'text-dark'}`}></i>
              </button>

              <Link
                href="/admin/users/create"
                className="btn d-flex align-items-center justify-content-center gap-2 px-4"
                style={{ backgroundColor: "#014aad", color: '#ffffff', fontWeight: '500', borderRadius: '4px', height: '40px', fontSize: '0.85rem', border: 'none' }}
              >
                <i className="hgi-stroke hgi-user-add-01"></i> new user
              </Link>
            </div>
          </div>

          {/* Right-aligned Advanced Filters Drawer */}
          <FilterDrawer
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            staffCategoryFilter={staffCategoryFilter}
            setStaffCategoryFilter={setStaffCategoryFilter}
            onReset={() => {
              setRoleFilter('All Roles');
              setStatusFilter('All');
              setStaffCategoryFilter('All');
              setSearchQuery('');
              setCurrentPage(1);
            }}
          />
          <Table
            columns={tableColumns}
            data={users}
            isLoading={loadingUsers}
            loadingMessage="Fetching user accounts..."
            emptyMessage="No accounts match this query."
            containerClassName="table-responsive-container table-responsive flex-grow-1"
            rowClassName={(user, index) => "user-table-row"}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        /* ======================== 2. PREMIUM DETAILS VIEW ======================== */
        <UserDetailView
          viewUser={viewUser}
          agreementData={agreementData}
          loadingAgreement={loadingAgreement}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onBack={() => setViewUser(null)}
          onStartEditing={startEditing}
          onSuspend={handleSuspendUser}
          onResetPassword={() => setShowResetPasswordModal(true)}
          onRecordPayment={(agr, amount) => {
            setSelectedAgreement(agr);
            setPaymentAmountInput(amount);
            setShowPaymentModal(true);
          }}
          generateInstallments={generateInstallments}
          getPropertyNames={getPropertyNames}
          getFloorNames={getFloorNames}
          getAgreementDuration={getAgreementDuration}
          getNextDueDate={getNextDueDate}
        />
      )}

      {/* â”€â”€ Modals â”€â”€ */}
      {isEditingUser && (
        <EditUserModal
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditingUser(false)}
          isSubmitting={isSubmittingAction}
        />
      )}

      {showResetPasswordModal && (
        <ResetPasswordModal
          onSubmit={handleResetPassword}
          onClose={() => { setShowResetPasswordModal(false); setNewPassword(''); }}
          isSubmitting={isSubmittingAction}
        />
      )}

      {showPaymentModal && selectedAgreement && (
        <RecordPaymentModal
          agreement={selectedAgreement}
          amountInput={paymentAmountInput}
          setAmountInput={setPaymentAmountInput}
          dateInput={paymentDateInput}
          setDateInput={setPaymentDateInput}
          modeInput={paymentModeInput}
          setModeInput={setPaymentModeInput}
          refInput={transactionRefInput}
          setRefInput={setTransactionRefInput}
          notesInput={notesInput}
          setNotesInput={setNotesInput}
          onSubmit={handlePaymentSubmit}
          onClose={() => { setShowPaymentModal(false); setSelectedAgreement(null); }}
          isSubmitting={isSubmittingPayment}
        />
      )}

    </div>
  );
}
