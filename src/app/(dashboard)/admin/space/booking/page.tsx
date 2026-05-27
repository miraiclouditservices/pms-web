"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import BookingModal from "@/components/dashboard/BookingModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function BookingPage() {
  const [userRole, setUserRole] = useState("super_admin");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const metrics = {
    total: 120,
    confirmed: 85,
    pending: 25,
    paid: 95,
    cancelled: 10
  };

  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === "Admin") {
            setUserRole("super_admin");
          } else if (u.role === "Owner") {
            setUserRole("booking_manager");
          } else {
            setUserRole("viewer");
          }
        } catch (e) {
          console.error(e);
        }
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

  const filteredBookings = bookings.filter(b => 
    (b.bookingId || b.id || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.bookingParticulars || b.particulars || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.bookedBy || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: ModalMode, booking: any = null) => {
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
    setIsModalOpen(false);
  };

  const handleCancelBooking = async (id: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await api.put(`/bookings/${id}`, { status: 'CANCELLED' });
        if (response.success) {
          fetchBookings();
        }
      } catch (err) {
        console.error("Failed to cancel booking:", err);
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Role Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item"><Link href="/admin/space" className="text-decoration-none text-muted">Space</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Booking Management</li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Booking Management</h2>
          <p className="text-muted small mb-0">Manage reservations for amenities, halls, and meeting rooms</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="d-flex align-items-center bg-light rounded-pill p-1">
            <span className="small fw-bold text-muted px-2">Role:</span>
            <select 
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-primary shadow-none py-0" 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              style={{ width: '130px', cursor: 'pointer' }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="booking_manager">Booking Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export
          </button>
          {userRole !== 'viewer' && (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
              style={{ backgroundColor: '#014aad', fontSize: '0.75rem' }}
              onClick={() => handleOpenModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> New Booking
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4 border-secondary">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Bookings</div>
              <div className="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-journal-bookmark"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.total}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>All Requests</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#014aad !important' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Confirmed</div>
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-calendar-check"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.confirmed}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Active Bookings</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#F59E0B !important' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Pending</div>
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-hourglass"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.pending}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Awaiting Approval</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#3B82F6 !important' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Paid</div>
              <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-currency-dollar"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.paid}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Transactions Clear</div>
          </div>
        </div>
        <div className="col-md-2" style={{ width: '20%' }}>
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex flex-column transition-all hover-lift h-100 border-start border-4" style={{ borderLeftColor: '#EF4444 !important' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Cancelled</div>
              <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}><i className="bi bi-x-circle"></i></div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{metrics.cancelled}</h3>
            <div className="text-muted mt-auto pt-2" style={{ fontSize: '0.7rem' }}>Voided Bookings</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '350px' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by Booking ID, particulars, booked by..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 border shadow-none">
            <span className="small text-muted me-2">From:</span>
            <input type="date" className="border-0 bg-transparent shadow-none text-muted fw-medium py-0 px-0" style={{ fontSize: '0.75rem', width: '100px', outline: 'none' }} />
          </div>
          <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 border shadow-none">
            <span className="small text-muted me-2">To:</span>
            <input type="date" className="border-0 bg-transparent shadow-none text-muted fw-medium py-0 px-0" style={{ fontSize: '0.75rem', width: '100px', outline: 'none' }} />
          </div>
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Payment Status: All</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Refunded</option>
          </select>
          <select className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
            <option>Status: All</option>
            <option>Confirmed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
          <button className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', width: '50px' }}>S.No</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Booking ID</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Booking Particulars</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Date & Time of Booking</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>From Date</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>To Date</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Payment Status</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Booked By</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Status</th>
                <th className="py-3 px-3 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, index) => (
                <tr key={b._id} className="transition-all hover-bg-light" style={{ fontSize: '0.85rem' }}>
                  <td className="px-3 py-3 fw-bold text-muted">{index + 1}</td>
                  <td className="px-3 py-3 fw-bold text-primary">{b.bookingId || b.id}</td>
                  <td className="px-3 py-3 fw-medium text-dark">{b.bookingParticulars || b.particulars}</td>
                  <td className="px-3 py-3 text-muted">{b.dateTimeOfBooking ? new Date(b.dateTimeOfBooking).toLocaleString() : '-'}</td>
                  <td className="px-3 py-3 fw-medium text-muted">{b.fromDate ? new Date(b.fromDate).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-3 fw-medium text-muted">{b.toDate ? new Date(b.toDate).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-3">
                    <span className={`badge rounded-pill px-2 py-1 fw-medium border ${
                      b.paymentStatus === 'Paid' ? 'bg-success bg-opacity-10 text-success border-success' :
                      b.paymentStatus === 'Pending' ? 'bg-warning bg-opacity-10 text-warning border-warning' :
                      'bg-secondary bg-opacity-10 text-secondary border-secondary'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                        <i className="bi bi-person"></i>
                      </div>
                      <span className="fw-medium">{b.bookedBy}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`badge rounded-pill px-2 py-1 fw-medium border ${
                      b.status === 'Confirmed' ? 'bg-success bg-opacity-10 text-success border-success' :
                      b.status === 'Pending' ? 'bg-warning bg-opacity-10 text-warning border-warning' :
                      'bg-danger bg-opacity-10 text-danger border-danger'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary" 
                        style={{ width: '28px', height: '28px' }} 
                        title="View"
                        onClick={() => handleOpenModal('view', b)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-success" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Edit"
                          onClick={() => handleOpenModal('edit', b)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {userRole !== 'viewer' && b.status !== 'CANCELLED' && b.status !== 'Cancelled' && (
                        <button 
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-danger" 
                          style={{ width: '28px', height: '28px' }} 
                          title="Cancel Booking"
                          onClick={() => handleCancelBooking(b._id)}
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <span className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>
            Showing 1 to {filteredBookings.length} of {metrics.total} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-sm btn-primary border-0 px-3 shadow-none" style={{ backgroundColor: '#014aad' }}>1</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">2</button>
            <span className="px-2 align-self-center text-muted">...</span>
            <button className="btn btn-sm btn-white border px-3 shadow-none">12</button>
            <button className="btn btn-sm btn-white border px-2 shadow-none"><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hover-lift:hover { transform: translateY(-3px); }
        .text-primary { color: #014aad !important; }
        .bg-emerald { background-color: #014aad !important; }
        .rounded-xl { border-radius: 1rem !important; }
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.02) !important; }
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
