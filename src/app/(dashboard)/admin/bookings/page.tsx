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

  useEffect(() => {
    fetchBookings();
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

  const filteredBookings = bookings.filter(b => 
    (b.bookingId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.bookedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.bookingParticulars || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            style={{ backgroundColor: '#10B981', fontSize: '0.75rem' }}
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
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {viewMode === 'table' ? (
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
                <tr>
                  <th className="py-3 px-3">Booking Details</th>
                  <th className="py-3 px-3">Booked By</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-5">Loading...</td></tr>
                ) : filteredBookings.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-muted">No bookings found.</td></tr>
                ) : filteredBookings.map((b) => (
                  <tr key={b._id} className="transition-all hover-bg-light">
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-emerald shadow-sm" style={{ width: '36px', height: '36px' }}>
                          <i className="bi bi-building"></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{b.bookingParticulars}</h6>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>ID: {b.bookingId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 fw-medium" style={{ fontSize: '0.85rem' }}>{b.bookedBy}</td>
                    <td className="px-3 py-3">
                      <div className="small">
                        <div className="fw-bold text-dark">{new Date(b.bookingFromDate).toLocaleDateString()}</div>
                        <div className="text-muted">to {new Date(b.bookingToDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`badge rounded-pill px-2 py-1 fw-medium border ${b.paymentStatus === 'Paid' ? 'bg-success bg-opacity-10 text-success border-success' : 'bg-warning bg-opacity-10 text-warning border-warning'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`badge rounded-pill px-2 py-1 fw-bold ${
                        b.bookingStatus === 'Approved' ? 'bg-success text-white' : 
                        b.bookingStatus === 'Rejected' ? 'bg-danger text-white' : 
                        'bg-warning text-dark'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {b.bookingStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-light rounded-circle" title="Approve" onClick={() => handleStatusChange(b._id, 'Approved')}>
                          <i className="bi bi-check2 text-success"></i>
                        </button>
                        <button className="btn btn-sm btn-light rounded-circle" title="Reject" onClick={() => handleStatusChange(b._id, 'Rejected')}>
                          <i className="bi bi-x text-danger"></i>
                        </button>
                        <button className="btn btn-sm btn-light rounded-circle" title="Edit" onClick={() => handleOpenModal('edit', b)}>
                          <i className="bi bi-pencil text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-light rounded-circle" title="Delete" onClick={() => handleDeleteBooking(b._id)}>
                          <i className="bi bi-trash text-danger"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                          style={{ fontSize: '0.65rem', backgroundColor: b.bookingStatus === 'Approved' ? '#10B981' : b.bookingStatus === 'Rejected' ? '#EF4444' : '#F59E0B', cursor: 'pointer' }}
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
        .text-emerald { color: #10B981 !important; }
        .bg-emerald { background-color: #10B981 !important; }
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
