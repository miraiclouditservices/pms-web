"use client";

import React, { useState, useEffect } from 'react';
import { api } from "@/utils/api";
import styles from "@/styles/modules/Dashboard.module.css";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'collections' | 'dues' | 'expiry'>('collections');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('All');
  
  // Collections Report States
  const [collections, setCollections] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pending Dues Report States
  const [dues, setDues] = useState<any[]>([]);

  // Expiry Report States
  const [expiryAgreements, setExpiryAgreements] = useState<any[]>([]);
  const [thresholdDays, setThresholdDays] = useState<number>(30);

  // Global summaries
  const [summaryStats, setSummaryStats] = useState({
    totalCollected: 0,
    totalOutstanding: 0,
    expiringSoonCount: 0
  });

  useEffect(() => {
    fetchProperties();
    // Load initial data
    fetchCollections();
    fetchDues();
    fetchExpiry();
  }, []);

  // Re-fetch collections when group or dates change
  useEffect(() => {
    if (activeTab === 'collections') {
      fetchCollections();
    }
  }, [groupBy, startDate, endDate]);

  // Re-fetch expiries when threshold changes
  useEffect(() => {
    if (activeTab === 'expiry') {
      fetchExpiry();
    }
  }, [thresholdDays]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      if (res.success) {
        setProperties(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/reports/collections?groupBy=${groupBy}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await api.get(url);
      if (res.success) {
        setCollections(res.data);
        
        // Calculate total collections for summary if not grouped
        if (groupBy === 'none') {
          const total = res.data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
          setSummaryStats(prev => ({ ...prev, totalCollected: total }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load collections report');
    } finally {
      setLoading(false);
    }
  };

  const fetchDues = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/reports/dues');
      if (res.success) {
        setDues(res.data);
        const total = res.data.reduce((sum: number, item: any) => sum + (item.pendingAmount || 0), 0);
        setSummaryStats(prev => ({ ...prev, totalOutstanding: total }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pending dues report');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiry = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/reports/expiry?thresholdDays=${thresholdDays}`);
      if (res.success) {
        setExpiryAgreements(res.data);
        if (thresholdDays === 30) {
          setSummaryStats(prev => ({ ...prev, expiringSoonCount: res.data.length }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expiry report');
    } finally {
      setLoading(false);
    }
  };

  // Property Filters applied on client side
  const getFilteredCollections = () => {
    if (selectedPropertyId === 'All') return collections;
    const selectedPropName = properties.find(p => p._id === selectedPropertyId)?.propertyName;
    if (!selectedPropName) return collections;
    
    // If grouped, property filtering might not apply depending on group key
    if (groupBy !== 'none') return collections;
    return collections.filter(c => c.propertyName === selectedPropName);
  };

  const getFilteredDues = () => {
    if (selectedPropertyId === 'All') return dues;
    const selectedPropName = properties.find(p => p._id === selectedPropertyId)?.propertyName;
    if (!selectedPropName) return dues;
    return dues.filter(d => d.propertyName === selectedPropName);
  };

  const getFilteredExpiry = () => {
    if (selectedPropertyId === 'All') return expiryAgreements;
    const selectedPropName = properties.find(p => p._id === selectedPropertyId)?.propertyName;
    if (!selectedPropName) return expiryAgreements;
    return expiryAgreements.filter(e => e.propertyName === selectedPropName);
  };

  // CSV Exporter
  const handleExport = () => {
    if (activeTab === 'collections') {
      const data = getFilteredCollections();
      const headers = groupBy === 'none' 
        ? ['Receipt No', 'Payment Date', 'Amount', 'Mode', 'Reference', 'Agreement No', 'Owner Name', 'Property', 'Floor', 'Unit']
        : ['Group label/Name', 'Total Collected', 'Transactions Count'];
      
      const rows = groupBy === 'none'
        ? data.map(c => [c.receiptNumber, new Date(c.paymentDate).toLocaleDateString(), c.amount, c.paymentMode, c.transactionRef || '', c.agreementNumber, c.ownerName, c.propertyName, c.floorName, c.unitName])
        : data.map(c => [c.label, c.amount, c.transactionsCount]);

      exportToCSV(`Collections_Report_${groupBy}.csv`, headers, rows);
    } else if (activeTab === 'dues') {
      const data = getFilteredDues();
      const headers = ['Agreement No', 'Owner Name', 'Contact', 'Property', 'Floor', 'Unit', 'Total Contract', 'Total Paid', 'Pending Balance', 'Next Due Amt', 'Next Due Date', 'Status'];
      const rows = data.map(d => [d.agreementNumber, d.ownerName, d.ownerContact, d.propertyName, d.floorName, d.unitName, d.totalAmount, d.totalPaid, d.pendingAmount, d.nextDueAmount, d.nextDueDate ? new Date(d.nextDueDate).toLocaleDateString() : 'N/A', d.paymentStatus]);
      exportToCSV('Pending_Dues_Report.csv', headers, rows);
    } else if (activeTab === 'expiry') {
      const data = getFilteredExpiry();
      const headers = ['Agreement No', 'Owner Name', 'Property', 'Floor', 'Unit', 'Start Date', 'End Date', 'Days Remaining', 'Status'];
      const rows = data.map(e => [e.agreementNumber, e.ownerName, e.propertyName, e.floorName, e.unitName, new Date(e.startDate).toLocaleDateString(), new Date(e.endDate).toLocaleDateString(), e.daysRemaining, e.status]);
      exportToCSV('Agreement_Expiry_Report.csv', headers, rows);
    }
  };

  const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.dashboard} style={{ fontFamily: 'var(--font-geist-sans)' }}>
      {/* Header Panel */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="fw-extrabold fs-3 mb-1 text-dark">Financial Intelligence & Analytics</h2>
          <p className="text-muted small mb-0">Track real-time collection telemetry, outstanding dues, and contract lifecycles.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2" onClick={handleExport}>
            <i className="hgi-stroke hgi-download-02"></i> Export Report
          </button>
        </div>
      </div>

      {/* Global Bento Cards Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 d-flex flex-row justify-content-between align-items-center" style={{ borderLeft: '5px solid #10b981' }}>
            <div>
              <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Collections</span>
              <h3 className="fw-bold mb-0 text-success">₹ {summaryStats.totalCollected.toLocaleString()}</h3>
              <span className="text-muted x-small">Aggregate of all confirmed ledger transactions</span>
            </div>
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <i className="hgi-stroke hgi-wallet-01 fs-3"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 d-flex flex-row justify-content-between align-items-center" style={{ borderLeft: '5px solid #ef4444' }}>
            <div>
              <span className="text-muted small fw-bold text-uppercase d-block mb-1">Outstanding Balance</span>
              <h3 className="fw-bold mb-0 text-danger">₹ {summaryStats.totalOutstanding.toLocaleString()}</h3>
              <span className="text-muted x-small">Active balance pending collection</span>
            </div>
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <i className="hgi-stroke hgi-alert-02 fs-3"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 d-flex flex-row justify-content-between align-items-center" style={{ borderLeft: '5px solid #3b82f6' }}>
            <div>
              <span className="text-muted small fw-bold text-uppercase d-block mb-1">Expiries (30 Days)</span>
              <h3 className="fw-bold mb-0 text-primary">{summaryStats.expiringSoonCount} Agreements</h3>
              <span className="text-muted x-small">Contracts requiring immediate renewal actions</span>
            </div>
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <i className="hgi-stroke hgi-agreement fs-3"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters Bento Bar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          {/* Tabs */}
          <div className="d-flex bg-light p-1 rounded-pill" style={{ maxWidth: '450px' }}>
            {[
              { id: 'collections', label: 'Collections Summary', icon: 'hgi-wallet-01' },
              { id: 'dues', label: 'Pending Dues Ledger', icon: 'hgi-alert-02' },
              { id: 'expiry', label: 'Agreement Expiries', icon: 'hgi-agreement' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setError(null); }}
                className={`btn rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 border-0 transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
                style={{ fontSize: '0.82rem' }}
              >
                <i className={`hgi-stroke ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* Global Property Filter */}
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-bold text-muted">Property:</span>
            <select
              className="form-select form-select-sm border shadow-sm px-3"
              style={{ borderRadius: '8px', minWidth: '180px', height: '38px', fontSize: '0.85rem' }}
              value={selectedPropertyId}
              onChange={e => setSelectedPropertyId(e.target.value)}
            >
              <option value="All">All Properties</option>
              {properties.map(p => (
                <option key={p._id} value={p._id}>{p.propertyName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Tab Panel */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        
        {/* Sub-Filters / Options Header inside Tab Panel */}
        <div className="card-header border-0 bg-white p-4 pb-0">
          {activeTab === 'collections' && (
            <div className="row g-3 align-items-center">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Group By</label>
                <select className="form-select py-1.5 shadow-none" value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                  <option value="none">Raw Transaction Log</option>
                  <option value="month">Monthly Total</option>
                  <option value="year">Yearly Total</option>
                  <option value="floor">Floor Wise Allocation</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">From Date</label>
                <input type="date" className="form-control py-1.5 shadow-none" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">To Date</label>
                <input type="date" className="form-control py-1.5 shadow-none" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
            </div>
          )}

          {activeTab === 'expiry' && (
            <div className="row g-3 align-items-center">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Filter Contracts Expiring Within</label>
                <select className="form-select py-1.5 shadow-none" value={thresholdDays} onChange={e => setThresholdDays(Number(e.target.value))} style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                  <option value={30}>Next 30 Days</option>
                  <option value={60}>Next 60 Days</option>
                  <option value={90}>Next 90 Days</option>
                  <option value={365}>Next 1 Year</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Data Table */}
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
              <span className="text-muted small fw-medium">Assembling live ledger data...</span>
            </div>
          ) : error ? (
            <div className="alert alert-danger p-3 rounded-3 mb-0 small">{error}</div>
          ) : (
            <div className="table-responsive">
              
              {/* Tab 1: Collections Table */}
              {activeTab === 'collections' && (
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      {groupBy === 'none' ? (
                        <>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Receipt No</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Date</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Amount</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Mode</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Reference</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Agreement No</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Owner</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Property / Unit</th>
                        </>
                      ) : (
                        <>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Aggregation Target</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Total Amount Collected</th>
                          <th className="bg-light text-muted fw-bold border-0 py-3 small">Transactions Count</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredCollections().length === 0 ? (
                      <tr><td colSpan={10} className="text-center py-4 text-muted small">No collections matching search parameters.</td></tr>
                    ) : (
                      getFilteredCollections().map((c, i) => (
                        <tr key={c.id || i}>
                          {groupBy === 'none' ? (
                            <>
                              <td className="fw-bold text-dark small">{c.receiptNumber}</td>
                              <td className="text-muted small">{new Date(c.paymentDate).toLocaleDateString('en-GB')}</td>
                              <td className="fw-bold text-success small">₹ {c.amount?.toLocaleString()}</td>
                              <td className="text-secondary small">{c.paymentMode}</td>
                              <td className="text-muted small">{c.transactionRef || 'N/A'}</td>
                              <td className="fw-semibold text-primary small">{c.agreementNumber}</td>
                              <td className="text-dark small">{c.ownerName}</td>
                              <td className="text-muted small">{c.propertyName} · {c.floorName} · {c.unitName}</td>
                            </>
                          ) : (
                            <>
                              <td className="fw-bold text-dark small">{c.label}</td>
                              <td className="fw-bold text-success small">₹ {c.amount?.toLocaleString()}</td>
                              <td className="text-muted small">{c.transactionsCount} transaction(s)</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 2: Pending Dues Table */}
              {activeTab === 'dues' && (
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Agreement No</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Owner Name</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Contact</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Location</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Contract Total</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Total Paid</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Pending Balance</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Next Due Amt</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredDues().length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-4 text-muted small">No pending dues found.</td></tr>
                    ) : (
                      getFilteredDues().map((d, i) => (
                        <tr key={d.id || i}>
                          <td className="fw-bold text-dark small">{d.agreementNumber}</td>
                          <td className="text-dark small fw-medium">{d.ownerName}</td>
                          <td className="text-muted small">{d.ownerContact}</td>
                          <td className="text-secondary small">{d.propertyName} · {d.floorName} · {d.unitName}</td>
                          <td className="text-dark small">₹ {d.totalAmount?.toLocaleString()}</td>
                          <td className="text-success small fw-medium">₹ {d.totalPaid?.toLocaleString()}</td>
                          <td className="text-danger small fw-bold">₹ {d.pendingAmount?.toLocaleString()}</td>
                          <td className="text-primary small fw-semibold">₹ {d.nextDueAmount?.toLocaleString()}</td>
                          <td>
                            <span className={`badge rounded-pill px-3 py-1.5 fw-bold`} style={{
                              fontSize: '0.72rem',
                              backgroundColor: d.paymentStatus === 'Paid' ? '#e6f4ea' :
                                               d.paymentStatus === 'Overdue' ? '#fce8e6' : '#fef7e0',
                              color: d.paymentStatus === 'Paid' ? '#137333' :
                                     d.paymentStatus === 'Overdue' ? '#c5221f' : '#b06000'
                            }}>{d.paymentStatus}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Agreement Expiry Table */}
              {activeTab === 'expiry' && (
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Agreement No</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Owner Name</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Property Details</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Start Date</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">End Date</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Days Remaining</th>
                      <th className="bg-light text-muted fw-bold border-0 py-3 small">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredExpiry().length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-4 text-muted small">No agreements expiring in this period.</td></tr>
                    ) : (
                      getFilteredExpiry().map((e, i) => (
                        <tr key={e.id || i}>
                          <td className="fw-bold text-dark small">{e.agreementNumber}</td>
                          <td className="text-dark small fw-medium">{e.ownerName}</td>
                          <td className="text-muted small">{e.propertyName} · {e.floorName} · {e.unitName}</td>
                          <td className="text-secondary small">{new Date(e.startDate).toLocaleDateString('en-GB')}</td>
                          <td className="text-secondary small fw-medium">{new Date(e.endDate).toLocaleDateString('en-GB')}</td>
                          <td className="fw-bold text-dark small">{e.daysRemaining} days left</td>
                          <td>
                            <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${e.status === 'Expired' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ fontSize: '0.72rem' }}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
