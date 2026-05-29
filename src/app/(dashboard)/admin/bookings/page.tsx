"use client";

import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import BookingModal from "@/components/dashboard/BookingModal";
import MeetingRoomModal from "@/components/dashboard/MeetingRoomModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

function BookingsContent() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms">("bookings");
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingModalMode, setBookingModalMode] = useState<ModalMode>("create");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState<ModalMode>("create");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [bookRes, roomRes, propRes, floorRes, unitRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/meeting-rooms'),
        api.get('/properties'),
        api.get('/floors'),
        api.get('/units')
      ]);

      if (bookRes.success) setBookings(bookRes.data);
      if (roomRes.success) setMeetingRooms(roomRes.data);
      if (propRes.success) setProperties(propRes.data);
      if (floorRes.success) setFloors(floorRes.data);
      if (unitRes.success) setUnits(unitRes.data);
    } catch (err) {
      console.error("Failed to load initial booking/room/unit data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.success) setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const reloadRooms = async () => {
    try {
      const res = await api.get('/meeting-rooms');
      if (res.success) setMeetingRooms(res.data);
      
      // Update floors to capture changed stats
      const floorRes = await api.get('/floors');
      if (floorRes.success) setFloors(floorRes.data);

      const unitRes = await api.get('/units');
      if (unitRes.success) setUnits(unitRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Booking CRUD handlers
  const handleOpenBookingModal = (mode: ModalMode, booking: any = null) => {
    setBookingModalMode(mode);
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (savedData: any) => {
    let response;
    if (bookingModalMode === 'edit') {
      response = await api.put(`/bookings/${savedData._id}`, savedData);
    } else {
      response = await api.post('/bookings', savedData);
    }
    
    if (!response.success) {
      throw new Error(response.error || "Overlapping slot or validation error.");
    }
    await reloadBookings();
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      const response = await api.delete(`/bookings/${id}`);
      if (response.success) await reloadBookings();
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
  };

  const handleBookingStatusChange = async (id: string, status: string) => {
    try {
      const response = await api.put(`/bookings/${id}`, { bookingStatus: status });
      if (response.success) {
        await reloadBookings();
      } else {
        alert(response.error || "Conflict: Cannot approve booking due to overlapping slot.");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Room CRUD handlers
  const handleOpenRoomModal = (mode: ModalMode, room: any = null) => {
    setRoomModalMode(mode);
    setSelectedRoom(room);
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (savedData: any) => {
    let response;
    if (roomModalMode === 'edit') {
      response = await api.put(`/meeting-rooms/${savedData._id}`, savedData);
    } else {
      response = await api.post('/meeting-rooms', savedData);
    }
    
    if (!response.success) {
      throw new Error(response.error || "Failed to save meeting room.");
    }
    await reloadRooms();
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to remove this meeting room space? Its occupied SFT will return to the floor's available pool.")) return;
    try {
      const response = await api.delete(`/meeting-rooms/${id}`);
      if (response.success) await reloadRooms();
    } catch (err) {
      console.error("Failed to delete room:", err);
    }
  };

  // Filters
  const filteredBookings = bookings.filter(b => {
    const isOwner = currentUser?.role === "Owner" || currentUser?.role === "Office Owner";
    if (isOwner) {
      const matchName = (b.bookedBy || "").toLowerCase().includes(currentUser.name?.toLowerCase() || "");
      const matchParticulars = (b.bookingParticulars || "").toLowerCase().includes((currentUser.companyName || "").toLowerCase());
      if (!matchName && !matchParticulars) return false;
    }

    const roomName = b.meetingRoom?.roomName || "";
    return (
      (b.bookingId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.bookedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.bookingParticulars || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredRooms = meetingRooms.filter(r => {
    const roomName = r.roomName || "";
    const propName = r.property?.propertyName || "";
    const floorName = r.floor?.floorName || `Floor ${r.floor?.floorNumber || ""}`;
    return (
      roomName.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      propName.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      floorName.toLowerCase().includes(roomSearchTerm.toLowerCase())
    );
  });

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Floor Admin';

  return (
    <div className="container-fluid p-0" style={{ fontFamily: 'var(--font-geist-sans)' }}>
      {/* Global CSS for Custom scrollbar & Styling */}
      <style jsx global>{`
        .table-responsive::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .rounded-xl { border-radius: 12px !important; }
        .text-primary-brand { color: #014aad !important; }
        .bg-primary-brand { background-color: #014aad !important; }
        .hover-lift:hover { transform: translateY(-2px); }
        .hover-bg-light:hover { background-color: #f8fafc !important; }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em', fontSize: '1.4rem' }}>
            Meeting Room & Space Booking
          </h2>
          <p className="text-muted small mb-0">Manage shared floor resources, corporate boardrooms, and reservation timetables.</p>
        </div>
        <div className="d-flex gap-2">
          {/* Tabs */}
          <div className="btn-group bg-light p-1 rounded-pill me-2">
            <button 
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'bookings' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
              onClick={() => setActiveTab('bookings')}
              style={{ fontSize: '0.75rem' }}
            >
              📅 Schedule Timetable
            </button>
            <button 
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'rooms' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
              onClick={() => setActiveTab('rooms')}
              style={{ fontSize: '0.75rem' }}
            >
              🏢 Meeting Rooms Master
            </button>
          </div>

          {activeTab === 'bookings' ? (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0 bg-primary-brand" 
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleOpenBookingModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> Book a Room
            </button>
          ) : (
            isAdmin && (
              <button 
                className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0 bg-primary-brand" 
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleOpenRoomModal('create')}
              >
                <i className="bi bi-plus-lg me-1"></i> Convert Floor Space (Add Room)
              </button>
            )
          )}
        </div>
      </div>

      {/* Booking View Tab */}
      {activeTab === 'bookings' && (
        <>
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-3 border shadow-sm mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 flex-grow-1" style={{ maxWidth: '350px' }}>
              <i className="bi bi-search text-muted me-2" style={{ fontSize: '0.85rem' }}></i>
              <input 
                type="text" 
                className="border-0 bg-transparent w-100 shadow-none" 
                placeholder="Search bookings by room, booker, purpose..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ outline: 'none', fontSize: '0.8rem', height: '30px' }}
              />
            </div>
            
            <div className="d-flex align-items-center gap-3">
              {viewMode === 'calendar' && (
                <div className="d-flex align-items-center gap-2">
                   <button className="btn btn-sm btn-light rounded-circle" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                     <i className="bi bi-chevron-left"></i>
                   </button>
                   <span className="fw-bold text-dark small" style={{ minWidth: '110px', textAlign: 'center' }}>
                     {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                   </span>
                   <button className="btn btn-sm btn-light rounded-circle" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                     <i className="bi bi-chevron-right"></i>
                   </button>
                </div>
              )}

              <div className="btn-group bg-light p-1 rounded-pill">
                <button 
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'table' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
                  onClick={() => setViewMode('table')}
                  style={{ fontSize: '0.7rem' }}
                >
                  <i className="bi bi-list-task me-1"></i> List
                </button>
                <button 
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'calendar' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
                  onClick={() => setViewMode('calendar')}
                  style={{ fontSize: '0.7rem' }}
                >
                  <i className="bi bi-calendar3 me-1"></i> Calendar
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Listings */}
          <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
            {viewMode === 'table' ? (
              <div className="table-responsive w-100" style={{ display: 'block' }}>
                <table className="table mb-0 align-middle text-nowrap" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      {[
                        'S No', 'Booking ID', 'Meeting Room / Hall', 'Properties & Floors', 'Date & Time Slot',
                        'Booked By', 'Booking Particulars', 'Status', 'Actions'
                      ].map((col, idx) => (
                        <th
                          key={col}
                          style={{
                            position: 'sticky', top: 0, zIndex: 9,
                            fontSize: '0.75rem', backgroundColor: '#3f3f3f', color: '#ffffff',
                            border: 'none', fontWeight: 600, padding: '12px 16px',
                            borderTopLeftRadius: idx === 0 ? '8px' : '0px',
                            borderTopRightRadius: idx === 8 ? '8px' : '0px',
                            textAlign: idx === 8 ? 'center' : 'left'
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
                        <td colSpan={9} className="text-center py-5 text-muted small">
                          <div className="spinner-border spinner-border-sm me-2 text-primary-brand" role="status" />
                          Loading scheduled bookings...
                        </td>
                      </tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5 text-muted small">
                          <i className="bi bi-inbox me-2" />No meeting room bookings registered on this system.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b, index) => {
                        const statusCfg: Record<string, { bg: string; color: string; label: string }> = {
                          Approved: { bg: 'bg-success bg-opacity-10 text-success border-success', color: '#15803d', label: 'Approved' },
                          Rejected: { bg: 'bg-danger bg-opacity-10 text-danger border-danger', color: '#b91c1c', label: 'Rejected' },
                          Pending:  { bg: 'bg-warning bg-opacity-10 text-warning border-warning', color: '#a16207', label: 'Pending'  },
                        };
                        const s = statusCfg[b.bookingStatus] || statusCfg['Pending'];
                        return (
                          <tr
                            key={b._id}
                            className="hover-bg-light"
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              fontSize: '0.82rem',
                            }}
                          >
                            <td className="py-3 px-3 text-muted fw-bold">{String(index + 1).padStart(3, '0')}</td>
                            <td className="py-3 px-3 fw-bold text-primary-brand">{b.bookingId}</td>
                            <td className="py-3 px-3">
                              <span className="fw-bold text-dark">{b.meetingRoom?.roomName || 'Unknown Room'}</span>
                              {b.meetingRoom?.sqft && (
                                <span className="badge bg-light text-secondary border ms-2 small" style={{ fontSize: '0.65rem' }}>
                                  {b.meetingRoom.sqft} SFT
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-muted">
                              <i className="bi bi-building me-1"></i>{b.property?.propertyName || '—'} <br />
                              <i className="bi bi-layers me-1"></i>{b.floor?.floorName || `Floor ${b.floor?.floorNumber || '—'}`}
                            </td>
                            <td className="py-3 px-3">
                              <strong className="text-dark"><i className="bi bi-calendar-event me-1"></i>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-GB') : '—'}</strong>
                              <div className="text-secondary small mt-1">
                                <i className="bi bi-clock me-1"></i>{b.startTime} - {b.endTime}
                              </div>
                            </td>
                            <td className="py-3 px-3 fw-medium text-dark">{b.bookedBy}</td>
                            <td className="py-3 px-3 text-truncate text-muted" style={{ maxWidth: '180px' }} title={b.bookingParticulars}>
                              {b.bookingParticulars}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`badge rounded-pill fw-bold border px-3 py-1 ${s.bg}`} style={{ fontSize: '0.7rem' }}>
                                {s.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="d-flex gap-2 justify-content-center align-items-center">
                                <button
                                  className="btn btn-link p-0" title="View Booking Details"
                                  onClick={() => handleOpenBookingModal('view', b)}
                                >
                                  <i className="bi bi-eye-fill text-secondary fs-6" />
                                </button>
                                
                                {isAdmin && (
                                  <>
                                    <button
                                      className="btn btn-link p-0" title="Modify Slot"
                                      onClick={() => handleOpenBookingModal('edit', b)}
                                    >
                                      <i className="bi bi-pencil-square text-primary fs-6" />
                                    </button>
                                    
                                    {b.bookingStatus !== 'Approved' && (
                                      <button
                                        className="btn btn-link p-0" title="Approve Request"
                                        onClick={() => handleBookingStatusChange(b._id, 'Approved')}
                                      >
                                        <i className="bi bi-check-circle-fill text-success fs-6" />
                                      </button>
                                    )}
                                    
                                    {b.bookingStatus !== 'Rejected' && (
                                      <button
                                        className="btn btn-link p-0" title="Reject Request"
                                        onClick={() => handleBookingStatusChange(b._id, 'Rejected')}
                                      >
                                        <i className="bi bi-x-circle-fill text-danger fs-6" />
                                      </button>
                                    )}
                                  </>
                                )}

                                {(isAdmin || currentUser?.name === b.bookedBy) && (
                                  <button
                                    className="btn btn-link p-0" title="Delete Booking"
                                    onClick={() => handleDeleteBooking(b._id)}
                                  >
                                    <i className="bi bi-trash text-danger fs-6" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              // Calendar Grid Mode
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
                      if (!b.bookingDate) return false;
                      const d = new Date(b.bookingDate);
                      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    });

                    return (
                      <div key={day} className="bg-white p-2 position-relative hover-bg-light" style={{ minHeight: '110px', transition: '0.2s' }}>
                        <span className={`fw-bold small px-2 py-1 ${dayDate.toDateString() === new Date().toDateString() ? 'bg-primary-brand text-white rounded-circle d-inline-flex align-items-center justify-content-center' : 'text-muted'}`} 
                          style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>{day}</span>
                        <div className="mt-2 d-flex flex-column gap-1">
                          {dayBookings.slice(0, 3).map((b, idx) => (
                            <div key={idx} 
                              className="px-2 py-1 rounded text-truncate fw-medium text-white shadow-sm" 
                              style={{ fontSize: '0.65rem', backgroundColor: b.bookingStatus === 'Approved' ? '#014aad' : b.bookingStatus === 'Rejected' ? '#dc2626' : '#d97706', cursor: 'pointer' }}
                              onClick={() => handleOpenBookingModal('view', b)}
                              title={`${b.meetingRoom?.roomName || 'Meeting'}: ${b.startTime}-${b.endTime}`}
                            >
                              {b.meetingRoom?.roomName || 'Meeting'}
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
        </>
      )}

      {/* Rooms Master Tab */}
      {activeTab === 'rooms' && (
        <>
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-3 border shadow-sm mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 flex-grow-1" style={{ maxWidth: '350px' }}>
              <i className="bi bi-search text-muted me-2" style={{ fontSize: '0.85rem' }}></i>
              <input 
                type="text" 
                className="border-0 bg-transparent w-100 shadow-none" 
                placeholder="Search rooms by name, property, or floor..." 
                value={roomSearchTerm}
                onChange={(e) => setRoomSearchTerm(e.target.value)}
                style={{ outline: 'none', fontSize: '0.8rem', height: '30px' }}
              />
            </div>
            
            <div className="small text-muted fw-bold">
              Total Designated Shared Resources: {filteredRooms.length} Meeting Rooms
            </div>
          </div>

          {/* Rooms Table */}
          <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
            <div className="table-responsive w-100" style={{ display: 'block' }}>
              <table className="table mb-0 align-middle text-nowrap" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {[
                      'S No', 'Room / Hall Name', 'Property Association', 'Floor Level', 
                      'Space Allocated (SFT)', 'Seating Capacity', 'Status', 'Actions'
                    ].map((col, idx) => (
                      <th
                        key={col}
                        style={{
                          position: 'sticky', top: 0, zIndex: 9,
                          fontSize: '0.75rem', backgroundColor: '#3f3f3f', color: '#ffffff',
                          border: 'none', fontWeight: 600, padding: '12px 16px',
                          borderTopLeftRadius: idx === 0 ? '8px' : '0px',
                          borderTopRightRadius: idx === 7 ? '8px' : '0px',
                          textAlign: idx === 7 ? 'center' : 'left'
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
                      <td colSpan={8} className="text-center py-5 text-muted small">
                        <div className="spinner-border spinner-border-sm me-2 text-primary-brand" role="status" />
                        Loading designated room resources...
                      </td>
                    </tr>
                  ) : filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted small">
                        <i className="bi bi-building-exclamation me-2" />No meeting rooms designated yet. Convert floor spaces to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((r, index) => {
                      const isMaintenance = r.status === 'Under Maintenance';
                      return (
                        <tr
                          key={r._id}
                          className="hover-bg-light"
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.82rem',
                          }}
                        >
                          <td className="py-3 px-3 text-muted fw-bold">{String(index + 1).padStart(3, '0')}</td>
                          <td className="py-3 px-3 fw-bold text-dark">
                            <div>{r.roomName}</div>
                            {r.unit && (
                              <span className="badge bg-light text-primary border mt-1" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                <i className="bi bi-door-closed me-1"></i>
                                Unit {typeof r.unit === 'object' ? r.unit.unitNumber : r.unit}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-muted">{r.property?.propertyName || '—'}</td>
                          <td className="py-3 px-3 text-muted">{r.floor?.floorName || `Floor ${r.floor?.floorNumber || '—'}`}</td>
                          <td className="py-3 px-3 fw-bold text-dark">{r.sqft} SFT</td>
                          <td className="py-3 px-3 fw-medium text-dark">{r.capacity} Pax</td>
                          <td className="py-3 px-3">
                            <span className={`badge rounded-pill border px-3 py-1 ${
                              isMaintenance ? 'bg-danger bg-opacity-10 text-danger border-danger' : 'bg-success bg-opacity-10 text-success border-success'
                            }`} style={{ fontSize: '0.7rem' }}>
                              {r.status || 'Available'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="d-flex gap-2 justify-content-center align-items-center">
                              <button
                                className="btn btn-sm btn-primary rounded-pill px-3 fw-bold text-white border-0 bg-primary-brand hover-lift me-1"
                                onClick={() => handleOpenBookingModal('create', { meetingRoom: r, property: r.property, floor: r.floor })}
                                style={{ fontSize: '0.7rem' }}
                                disabled={r.status === 'Under Maintenance'}
                              >
                                📅 Book Room
                              </button>
                              <button
                                className="btn btn-link p-0" title="View Details"
                                onClick={() => handleOpenRoomModal('view', r)}
                              >
                                <i className="bi bi-eye-fill text-secondary fs-6" />
                              </button>

                              {isAdmin && (
                                <>
                                  <button
                                    className="btn btn-link p-0" title="Edit Parameters"
                                    onClick={() => handleOpenRoomModal('edit', r)}
                                  >
                                    <i className="bi bi-pencil-square text-primary fs-6" />
                                  </button>
                                  <button
                                    className="btn btn-link p-0" title="Revoke Space (Delete)"
                                    onClick={() => handleDeleteRoom(r._id)}
                                  >
                                    <i className="bi bi-trash text-danger fs-6" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Booking Dialog Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSave={handleSaveBooking}
        editData={selectedBooking}
        mode={bookingModalMode}
        properties={properties}
        floors={floors}
        meetingRooms={meetingRooms.filter(r => r.status === 'Available')}
        bookings={bookings}
      />

      {/* Meeting Room Space Dialog Modal */}
      <MeetingRoomModal 
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSave={handleSaveRoom}
        editData={selectedRoom}
        mode={roomModalMode}
        properties={properties}
        floors={floors}
        units={units}
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
