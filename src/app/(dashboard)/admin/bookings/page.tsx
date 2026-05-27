"use client";

import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import BookingModal from "@/components/dashboard/BookingModal";

function BookingsContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<any>("create");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchBookings();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/bookings');
      if (response.success) {
        setBookings(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode: any, booking: any = null) => {
    setModalMode(mode);
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (savedData: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/bookings/${savedData._id}`, savedData);
      } else {
        response = await api.post('/bookings', savedData);
      }
      
      if (response.success) {
        fetchBookings();
      }
    } catch (err) {
      console.error("Failed to save booking:", err);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      const response = await api.delete(`/bookings/${id}`);
      if (response.success) fetchBookings();
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await api.put(`/bookings/${id}`, { bookingStatus: status });
      if (response.success) fetchBookings();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const isOwner = currentUser?.role === "Owner" || currentUser?.role === "Office Owner";
    if (isOwner) {
      const matchName = (b.bookedBy || "").toLowerCase().includes(currentUser.name.toLowerCase());
      const matchParticulars = (b.bookingParticulars || "").toLowerCase().includes((currentUser.companyName || "").toLowerCase());
      if (!matchName && !matchParticulars) return false;
    }

    return (
      (b.bookingId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.bookedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.bookingParticulars || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Facility Booking</h2>
          <p className="text-muted small mb-0">Manage common area bookings, event spaces, and meeting rooms.</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="btn-group bg-light p-1 rounded-pill">
            <button 
              className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'table' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
              onClick={() => setViewMode('table')}
              style={{ fontSize: '0.75rem' }}
            >
              <i className="bi bi-list-task me-1"></i> List
            </button>
            <button 
              className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'calendar' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
              onClick={() => setViewMode('calendar')}
              style={{ fontSize: '0.75rem' }}
            >
              <i className="bi bi-calendar3 me-1"></i> Calendar
            </button>
          </div>
          <button 
            className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
            style={{ backgroundColor: '#014aad', fontSize: '0.75rem' }}
            onClick={() => handleOpenModal('create')}
          >
            <i className="bi bi-plus-lg me-1"></i> New Booking
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '350px' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by booking ID, booker, or particulars..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        {viewMode === 'calendar' && (
          <div className="d-flex align-items-center gap-3">
             <button className="btn btn-sm btn-light rounded-circle" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
               <i className="bi bi-chevron-left"></i>
             </button>
             <span className="fw-bold text-dark" style={{ minWidth: '120px', textAlign: 'center' }}>
               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
             </span>
             <button className="btn btn-sm btn-light rounded-circle" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
               <i className="bi bi-chevron-right"></i>
             </button>
          </div>
        )}
      </div>

      {/* Main Content View */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        {viewMode === 'table' ? (
          <>
            <div className="table-responsive">
              <table className="table mb-0 align-middle" style={{ width: '100%', borderCollapse: 'collapse' }}>

                <thead>
                  <tr>
                    {[
                      'Booking Details', 'Booked By', 'Period',
                      'Payment', 'Status', 'Actions',
                    ].map((col, i) => (
                      <th
                        key={col}
                        style={{
                          position: 'sticky', top: 0, zIndex: 9,
                          fontSize: '0.72rem', backgroundColor: '#1e293b', color: '#ffffff',
                          border: 'none', fontWeight: 700, letterSpacing: '0.05em',
                          textTransform: 'uppercase', padding: '12px 14px', whiteSpace: 'nowrap',
                          textAlign: i === 5 ? 'center' : 'left',
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
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        Loading bookings...
                      </td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted" style={{ fontSize: '0.9rem' }}>
                        <i className="bi bi-inbox me-2" />No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b, index) => {
                      const statusCfg: Record<string, { bg: string; color: string; label: string }> = {
                        Approved: { bg: '#dcfce7', color: '#166534', label: '✅ Approved' },
                        Rejected: { bg: '#fee2e2', color: '#991b1b', label: '❌ Rejected' },
                        Pending:  { bg: '#fef9c3', color: '#854d0e', label: '⏳ Pending'  },
                      };
                      const s = statusCfg[b.bookingStatus] || statusCfg['Pending'];
                      return (
                        <tr
                          key={b._id}
                          style={{
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.85rem',
                          }}
                        >
                          {/* Booking Details */}
                          <td style={{ padding: '10px 14px', minWidth: '200px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                              {b.bookingParticulars}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                              ID: {b.bookingId}
                            </div>
                          </td>

                          {/* Booked By */}
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                            {b.bookedBy || '—'}
                          </td>

                          {/* Period */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                              {new Date(b.bookingFromDate).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                              to {new Date(b.bookingToDate).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Payment */}
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              className="badge rounded-pill fw-bold px-2 py-1"
                              style={{
                                backgroundColor: b.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                                color: b.paymentStatus === 'Paid' ? '#166534' : '#854d0e',
                                fontSize: '0.7rem',
                              }}
                            >
                              {b.paymentStatus || '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              className="badge rounded-pill fw-bold px-2 py-1"
                              style={{ backgroundColor: s.bg, color: s.color, fontSize: '0.7rem' }}
                            >
                              {s.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <div className="d-flex gap-2 justify-content-center align-items-center">
                              <button
                                className="btn btn-link p-0" title="View"
                                onClick={() => handleOpenModal('view', b)}
                              >
                                <i className="bi bi-eye-fill" style={{ fontSize: '1.05rem', color: '#4b5563' }} />
                              </button>
                              <button
                                className="btn btn-link p-0" title="Edit"
                                onClick={() => handleOpenModal('edit', b)}
                              >
                                <i className="bi bi-pencil-square" style={{ fontSize: '1.05rem', color: '#014aad' }} />
                              </button>
                              {b.bookingStatus !== 'Approved' && (
                                <button
                                  className="btn btn-link p-0" title="Approve"
                                  onClick={() => handleStatusChange(b._id, 'Approved')}
                                >
                                  <i className="bi bi-check-circle-fill" style={{ fontSize: '1.05rem', color: '#16a34a' }} />
                                </button>
                              )}
                              {b.bookingStatus !== 'Rejected' && (
                                <button
                                  className="btn btn-link p-0" title="Reject"
                                  onClick={() => handleStatusChange(b._id, 'Rejected')}
                                >
                                  <i className="bi bi-x-circle-fill" style={{ fontSize: '1.05rem', color: '#dc2626' }} />
                                </button>
                              )}
                              <button
                                className="btn btn-link p-0" title="Delete"
                                onClick={() => handleDeleteBooking(b._id)}
                              >
                                <i className="bi bi-trash" style={{ fontSize: '1.05rem', color: '#dc2626' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
              <span className="text-muted small">
                Showing 1–{filteredBookings.length} of {bookings.length} entries
              </span>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-white border px-2 shadow-none" disabled>
                  <i className="bi bi-chevron-left" />
                </button>
                <button
                  className="btn btn-sm border-0 px-3 shadow-none text-white fw-bold"
                  style={{ backgroundColor: '#014aad', borderRadius: '6px' }}
                >
                  1
                </button>
                <button className="btn btn-sm btn-white border px-2 shadow-none">
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-3">
            <div className="calendar-grid d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0', border: '1px solid #e2e8f0' }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="bg-light py-2 text-center fw-bold text-muted small">{day}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white" style={{ minHeight: '100px' }}></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayBookings = filteredBookings.filter(b => {
                  const from = new Date(b.bookingFromDate);
                  const to = new Date(b.bookingToDate);
                  return dayDate >= from && dayDate <= to;
                });

                return (
                  <div key={day} className="bg-white p-2 position-relative hover-bg-light" style={{ minHeight: '110px', transition: '0.2s' }}>
                    <span className={`fw-bold small ${dayDate.toDateString() === new Date().toDateString() ? 'bg-emerald text-white rounded-circle d-inline-flex align-items-center justify-content-center' : 'text-muted'}`} 
                      style={{ width: '22px', height: '22px' }}>{day}</span>
                    <div className="mt-2 d-flex flex-column gap-1">
                      {dayBookings.slice(0, 3).map((b, idx) => (
                        <div key={idx} 
                          className="px-2 py-1 rounded text-truncate fw-medium text-white shadow-sm" 
                          style={{ fontSize: '0.65rem', backgroundColor: b.bookingStatus === 'Approved' ? '#014aad' : b.bookingStatus === 'Rejected' ? '#EF4444' : '#F59E0B', cursor: 'pointer' }}
                          onClick={() => handleOpenModal('view', b)}
                        >
                          {b.bookingParticulars}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-muted small ps-1" style={{ fontSize: '0.6rem' }}>+ {dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .rounded-xl { border-radius: 1rem !important; }
        .text-primary { color: #014aad !important; }
        .bg-emerald { background-color: #014aad !important; }
        .hover-lift:hover { transform: translateY(-3px); }
        .hover-bg-light:hover { background-color: #f8fafc !important; }
      `}</style>

      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        editData={selectedBooking}
        mode={modalMode}
      />
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
