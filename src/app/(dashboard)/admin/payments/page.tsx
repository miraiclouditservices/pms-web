"use client";

import React, { useState, useEffect } from 'react';
import { api } from "@/utils/api";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentsPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Invoices' | 'Payments'>('Invoices');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form inputs - Generate Invoices
  const [genMonth, setGenMonth] = useState('June');
  const [genYear, setGenYear] = useState(2026);

  // Form inputs - Record Payment
  const [payLease, setPayLease] = useState('');
  const [payMonth, setPayMonth] = useState('June');
  const [payYear, setPayYear] = useState(2026);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Online');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payTxnId, setPayTxnId] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Submit status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [leasesRes, invoicesRes, paymentsRes, meRes] = await Promise.all([
        api.get('/leases?limit=100'),
        api.get('/finance'),
        api.get('/payments'),
        api.get('/auth/me')
      ]);

      if (meRes.success) {
        const userObj = meRes.user || meRes.data;
        setCurrentUser(userObj);
        if (userObj) {
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      }
      if (leasesRes.success) setLeases(leasesRes.data || []);
      if (invoicesRes.success) setInvoices(invoicesRes.data || []);
      if (paymentsRes.success) setPayments(paymentsRes.data || []);

      // Set default lease for payment record
      if (leasesRes.success && leasesRes.data && leasesRes.data.length > 0) {
        setPayLease(leasesRes.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load payments data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark invoice as paid
  const handleMarkAsPaid = async (invoiceId: string) => {
    if (confirm("Are you sure you want to mark this invoice as Paid?")) {
      try {
        const res = await api.put(`/finance/${invoiceId}/pay`, {});
        if (res.success) {
          const invoicesRes = await api.get('/finance');
          if (invoicesRes.success) setInvoices(invoicesRes.data || []);
          const paymentsRes = await api.get('/payments');
          if (paymentsRes.success) setPayments(paymentsRes.data || []);
        } else {
          alert(res.error || "Failed to update invoice status");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while paying invoice");
      }
    }
  };

  // Generate Invoices
  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await api.post('/finance/generate', { month: genMonth, year: Number(genYear) });
      if (res.success) {
        setShowGenerateModal(false);
        const invoicesRes = await api.get('/finance');
        if (invoicesRes.success) setInvoices(invoicesRes.data || []);
      } else {
        setErrorMsg(res.error || "Failed to generate invoices");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPaymentClick = () => {
    setEditingPaymentId(null);
    if (leases.length > 0) {
      setPayLease(leases[0]._id);
    }
    setPayMonth('June');
    setPayYear(2026);
    setPayAmount('');
    setPayMethod('Online');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayTxnId('');
    setPayRemarks('');
    setErrorMsg('');
    setShowPaymentModal(true);
  };

  const handleEditPaymentClick = (payment: any) => {
    setEditingPaymentId(payment._id);
    setPayLease(payment.lease?._id || payment.lease || '');
    setPayMonth(payment.month);
    setPayYear(payment.year);
    setPayAmount(payment.amount?.toString() || '');
    setPayMethod(payment.paymentMethod || 'Online');
    setPayDate(payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '');
    setPayTxnId(payment.transactionId || '');
    setPayRemarks(payment.remarks || '');
    setErrorMsg('');
    setShowPaymentModal(true);
  };

  // Record / Update Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payLease || !payAmount) {
      setErrorMsg("Lease and Amount are required fields.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        lease: payLease,
        month: payMonth,
        year: Number(payYear),
        amount: Number(payAmount),
        paymentMethod: payMethod,
        paymentDate: payDate ? new Date(payDate) : undefined,
        transactionId: payTxnId || undefined,
        remarks: payRemarks || undefined
      };
      
      let res;
      if (editingPaymentId) {
        res = await api.put(`/payments/${editingPaymentId}`, payload);
      } else {
        res = await api.post('/payments', payload);
      }

      if (res.success) {
        setShowPaymentModal(false);
        setEditingPaymentId(null);
        setPayAmount('');
        setPayTxnId('');
        setPayRemarks('');
        const [invoicesRes, paymentsRes] = await Promise.all([
          api.get('/finance'),
          api.get('/payments')
        ]);
        if (invoicesRes.success) setInvoices(invoicesRes.data || []);
        if (paymentsRes.success) setPayments(paymentsRes.data || []);
      } else {
        setErrorMsg(res.error || `Failed to ${editingPaymentId ? 'update' : 'record'} payment`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record? This will not revert invoice state.")) {
      try {
        const res = await api.delete(`/payments/${paymentId}`);
        if (res.success) {
          const paymentsRes = await api.get('/payments');
          if (paymentsRes.success) setPayments(paymentsRes.data || []);
        } else {
          alert(res.error || "Failed to delete payment record");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Computations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const outstandingDues = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const recoveryRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const tenantName = (inv.tenantName || inv.lease?.tenantName || '').toLowerCase();
    const invNumber = (inv.invoiceNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = tenantName.includes(query) || invNumber.includes(query);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered payments
  const filteredPayments = payments.filter(p => {
    const tenantName = (p.lease?.tenantName || '').toLowerCase();
    const txnId = (p.transactionId || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = tenantName.includes(query) || txnId.includes(query);
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-success bg-opacity-10 text-success border border-success border-opacity-25';
      case 'Pending': return 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25';
      case 'Overdue': return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
      default: return 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25';
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';
  const isFloorAdmin = currentUser?.role === 'FLOOR_ADMIN' || currentUser?.role === 'Floor Admin';
  const isOwner = currentUser?.role === 'Owner' || currentUser?.role === 'OFFICE_OWNER' || currentUser?.role === 'Office Owner';

  if (currentUser && !isSuperAdmin && !isFloorAdmin && !isOwner) {
    return (
      <div className="container py-5 text-center bg-white shadow-sm border rounded-xl mt-4" style={{ fontFamily: 'var(--font-geist-sans)' }}>
        <i className="hgi-stroke hgi-shield-slash text-danger fs-1 d-block mb-3"></i>
        <h4 className="fw-bold text-dark">Unauthorized Access</h4>
        <p className="text-muted small">You do not have administrative permissions to view or handle the payments ledger.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4" style={{ fontFamily: 'var(--font-geist-sans)', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <style jsx>{`
        .stat-card {
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02);
          transition: all 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03);
        }
        .tab-btn {
          font-weight: 600;
          color: #64748b;
          border: none;
          background: none;
          padding: 12px 20px;
          position: relative;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }
        .tab-btn.active {
          color: #014aad;
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 3px;
          background-color: #014aad;
          border-radius: 99px;
        }
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .custom-modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Header & Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.03em" }}>
            Accounts Ledger & Payments
          </h2>
          <p className="text-muted small mb-0">
            Monitor invoices, record transactions, and manage monthly spatial receivables.
          </p>
        </div>

        {/* Global actions */}
        <div className="d-flex gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => { setErrorMsg(''); setShowGenerateModal(true); }}
              className="btn d-flex align-items-center gap-2 px-3 py-2 shadow-sm fw-semibold"
              style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <i className="hgi-stroke hgi-invoice-01 text-primary"></i> Generate Invoices
            </button>
          )}
          {(isSuperAdmin || isFloorAdmin) && (
            <button
              onClick={handleNewPaymentClick}
              className="btn text-white d-flex align-items-center gap-2 px-3 py-2 shadow-sm fw-semibold"
              style={{ backgroundColor: '#014aad', border: 'none', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <i className="hgi-stroke hgi-plus"></i> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card p-4 d-flex align-items-center gap-3">
            <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(1, 74, 173, 0.1)', color: '#014aad' }}>
              <i className="hgi-stroke hgi-invoice-02 fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Total Invoiced</span>
              <h4 className="fw-bold text-dark mb-0">₹{totalInvoiced.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card p-4 d-flex align-items-center gap-3">
            <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              <i className="hgi-stroke hgi-credit-card fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Total Collected</span>
              <h4 className="fw-bold text-success mb-0">₹{totalCollected.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card p-4 d-flex align-items-center gap-3">
            <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <i className="hgi-stroke hgi-wallet-01 fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Outstanding Dues</span>
              <h4 className="fw-bold text-danger mb-0">₹{outstandingDues.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card p-4 d-flex align-items-center gap-3">
            <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <i className="hgi-stroke hgi-analytics-01 fs-4"></i>
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Recovery Rate</span>
              <h4 className="fw-bold text-dark mb-0">{recoveryRate}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Component Card */}
      <div className="bg-white border rounded-4 shadow-sm overflow-hidden mb-4">
        
        {/* Tab Headers */}
        <div className="d-flex justify-content-between align-items-center border-bottom border-light px-3 flex-wrap">
          <div className="d-flex">
            <button
              className={`tab-btn ${activeTab === 'Invoices' ? 'active' : ''}`}
              onClick={() => { setActiveTab('Invoices'); setSearchQuery(''); }}
            >
              Invoices & Billing
            </button>
            <button
              className={`tab-btn ${activeTab === 'Payments' ? 'active' : ''}`}
              onClick={() => { setActiveTab('Payments'); setSearchQuery(''); }}
            >
              Payment Records
            </button>
          </div>

          {/* Search bar inside header */}
          <div className="d-flex align-items-center gap-3 py-2">
            <div className="position-relative" style={{ width: '280px' }}>
              <input
                type="text"
                className="form-control px-3 py-2 shadow-sm"
                placeholder={activeTab === 'Invoices' ? "Search invoice # or tenant..." : "Search tenant or transaction ID..."}
                style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="hgi-stroke hgi-search-01 position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
            </div>

            {activeTab === 'Invoices' && (
              <select
                className="form-select border shadow-sm fw-semibold text-muted bg-white"
                style={{ width: '130px', height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All States</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="table-responsive">
          {activeTab === 'Invoices' ? (
            /* ==================== INVOICES TAB ==================== */
            <table className="table align-middle text-nowrap table-hover mb-0">
              <thead>
                <tr>
                  {["S No", "Invoice Number", "Tenant / Payee", "Billing Period", "Total Amount", "Due Date", "Status", "Action"].map((col, i) => (
                    <th
                      key={col}
                      className="py-3 px-4 fw-bold text-start"
                      style={{
                        backgroundColor: '#3f3f3f',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        border: 'none'
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
                    <td colSpan={8} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                      <div className="text-muted small mt-2">Fetching Billing Ledger...</div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted small">
                      <i className="hgi-stroke hgi-file-check-02 fs-2 d-block mb-2 text-muted opacity-50"></i>
                      No billing invoices match this query.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr key={inv._id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {String(idx + 1).padStart(3, '0')}
                      </td>
                      <td className="py-3 px-4 fw-bold text-dark" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {inv.invoiceNumber || 'INV-TEMP'}
                      </td>
                      <td className="py-3 px-4" style={{ border: 'none' }}>
                        <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                          {inv.tenantName || inv.lease?.tenantName || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {inv.month} {inv.year}
                      </td>
                      <td className="py-3 px-4 fw-bold text-dark" style={{ border: 'none', fontSize: '0.85rem' }}>
                        ₹{inv.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3 px-4" style={{ border: 'none' }}>
                        <span className={`badge rounded-pill px-3 py-1 ${getStatusBadge(inv.status)}`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ border: 'none' }}>
                        {inv.status !== 'Paid' ? (
                          <button
                            onClick={() => handleMarkAsPaid(inv._id)}
                            className="btn btn-sm px-3 py-1 shadow-sm fw-bold border border-success text-success bg-white rounded-pill hover-bg-success"
                            style={{ fontSize: '0.75rem', transition: 'all 0.2s' }}
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                            <i className="hgi-stroke hgi-checkmark-circle-02"></i> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* ==================== PAYMENTS TAB ==================== */
            <table className="table align-middle text-nowrap table-hover mb-0">
              <thead>
                <tr>
                  {["S No", "Tenant Name", "Period Mapped", "Amount Paid", "Date Logged", "Method", "Transaction ID", "Remarks", "Action"].map((col, i) => (
                    <th
                      key={col}
                      className="py-3 px-4 fw-bold text-start"
                      style={{
                        backgroundColor: '#3f3f3f',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        border: 'none'
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
                    <td colSpan={9} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                      <div className="text-muted small mt-2">Fetching Transactions Ledger...</div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted small">
                      <i className="hgi-stroke hgi-credit-card-validation fs-2 d-block mb-2 text-muted opacity-50"></i>
                      No transaction records match this query.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr key={p._id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {String(idx + 1).padStart(3, '0')}
                      </td>
                      <td className="py-3 px-4 fw-semibold text-dark" style={{ border: 'none', fontSize: '0.9rem' }}>
                        {p.lease?.tenantName || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {p.month} {p.year}
                      </td>
                      <td className="py-3 px-4 fw-bold text-success" style={{ border: 'none', fontSize: '0.85rem' }}>
                        ₹{p.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3 px-4" style={{ border: 'none' }}>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem' }}>
                        {p.transactionId || '-'}
                      </td>
                      <td className="py-3 px-4 text-muted" style={{ border: 'none', fontSize: '0.85rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.remarks || '-'}
                      </td>
                      <td className="py-3 px-4" style={{ border: 'none' }}>
                        <div className="d-flex gap-2">
                          {(isSuperAdmin || isFloorAdmin) && (
                            <button
                              onClick={() => handleEditPaymentClick(p)}
                              className="btn btn-link text-primary p-0 d-flex align-items-center justify-content-center"
                              title="Edit Payment"
                            >
                              <i className="hgi-stroke hgi-pencil fs-5"></i>
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeletePayment(p._id)}
                              className="btn btn-link text-danger p-0 d-flex align-items-center justify-content-center"
                              title="Delete Payment"
                            >
                              <i className="hgi-stroke hgi-delete-02 fs-5"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ==================== MODAL: GENERATE MONTHLY INVOICES ==================== */}
      {showGenerateModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">Generate Invoices</h5>
              <button onClick={() => setShowGenerateModal(false)} className="btn-close" style={{ outline: 'none', boxShadow: 'none' }}></button>
            </div>
            <form onSubmit={handleGenerateInvoices}>
              <div className="p-4">
                {errorMsg && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    {errorMsg}
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Select Target Month</label>
                  <select
                    className="form-select"
                    value={genMonth}
                    onChange={(e) => setGenMonth(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Target Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                    placeholder="2026"
                    style={{ borderRadius: '8px' }}
                    required
                  />
                </div>
                
                <p className="text-muted small">
                  Note: This will automatically calculate escalations, rents, CAM charges, and GST amounts for all currently active tenant leases, generating corresponding invoice ledger rows.
                </p>
              </div>
              <div className="p-4 bg-light d-flex justify-content-end gap-2 border-top">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn btn-outline-secondary px-4 fw-semibold"
                  style={{ borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn text-white px-4 fw-semibold"
                  style={{ backgroundColor: '#014aad', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? 'Generating...' : 'Start Generation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: RECORD/EDIT PAYMENT ==================== */}
      {showPaymentModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content" style={{ maxWidth: '550px' }}>
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">{editingPaymentId ? 'Edit Payment Record' : 'Record Payment Record'}</h5>
              <button onClick={() => { setShowPaymentModal(false); setEditingPaymentId(null); }} className="btn-close" style={{ outline: 'none', boxShadow: 'none' }}></button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="p-4" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                {errorMsg && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    {errorMsg}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Select Lease</label>
                  <select
                    className="form-select"
                    value={payLease}
                    onChange={(e) => setPayLease(e.target.value)}
                    style={{ borderRadius: '8px' }}
                    required
                  >
                    {leases.map(l => (
                      <option key={l._id} value={l._id}>
                        {l.tenantName} - {l.units && l.units.length > 0 ? `Unit ${l.units[0].unitNumber}` : 'No Unit'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold text-muted">Billing Month</label>
                    <select
                      className="form-select"
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold text-muted">Billing Year</label>
                    <input
                      type="number"
                      className="form-control"
                      value={payYear}
                      onChange={(e) => setPayYear(Number(e.target.value))}
                      style={{ borderRadius: '8px' }}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold text-muted">Amount Paid (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="e.g. 25000"
                      style={{ borderRadius: '8px' }}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold text-muted">Payment Method</label>
                    <select
                      className="form-select"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    >
                      {['Online', 'Cash', 'Cheque', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Payment Date (Dated Payment)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    style={{ borderRadius: '8px' }}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Transaction / Cheque ID (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={payTxnId}
                    onChange={(e) => setPayTxnId(e.target.value)}
                    placeholder="e.g. TXN-1920392039"
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    placeholder="e.g. Fully paid monthly rent"
                    style={{ borderRadius: '8px' }}
                    rows={2}
                  />
                </div>
              </div>
              <div className="p-4 bg-light d-flex justify-content-end gap-2 border-top">
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(false); setEditingPaymentId(null); }}
                  className="btn btn-outline-secondary px-4 fw-semibold"
                  style={{ borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn text-white px-4 fw-semibold"
                  style={{ backgroundColor: '#014aad', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? (editingPaymentId ? 'Updating...' : 'Recording...') : (editingPaymentId ? 'Update Payment' : 'Submit Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
