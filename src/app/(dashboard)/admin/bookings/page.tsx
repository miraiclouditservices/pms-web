"use client";

import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import BookingFormModal from "@/components/bookings/BookingFormModal";
import BookingDetailView from "@/components/bookings/BookingDetailView";
import BookingFilterDrawer from "@/components/bookings/BookingFilterDrawer";
import MeetingRoomFormModal from "@/components/bookings/MeetingRoomFormModal";
import MeetingRoomDetailView from "@/components/bookings/MeetingRoomDetailView";
import MeetingRoomFilterDrawer from "@/components/bookings/MeetingRoomFilterDrawer";

function BookingsContent() {
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms">("bookings");
  const [isLoading, setIsLoading] = useState(true);
  const [isRoomLoading, setIsRoomLoading] = useState(true);

  // Core Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<any[]>([]);

  // Master Dropdown Data States
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [allMeetingRooms, setAllMeetingRooms] = useState<any[]>([]);

  // Bookings Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("");

  // Bookings Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Meeting Rooms Filters & Search
  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const [roomSelectedProperty, setRoomSelectedProperty] = useState("");
  const [roomSelectedFloor, setRoomSelectedFloor] = useState("");

  // Meeting Rooms Pagination
  const [roomCurrentPage, setRoomCurrentPage] = useState(1);
  const [roomTotalItems, setRoomTotalItems] = useState(0);
  const [roomTotalPages, setRoomTotalPages] = useState(1);
  const roomLimit = 10;

  // Overlays / Modals visibility
  const [isBookingFormModalOpen, setIsBookingFormModalOpen] = useState(false);
  const [bookingFormModalMode, setBookingFormModalMode] = useState<"create" | "edit">("create");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isBookingDetailViewOpen, setIsBookingDetailViewOpen] = useState(false);
  const [isBookingFilterDrawerOpen, setIsBookingFilterDrawerOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const [isRoomFormModalOpen, setIsRoomFormModalOpen] = useState(false);
  const [roomFormModalMode, setRoomFormModalMode] = useState<"create" | "edit">("create");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomDetailViewOpen, setIsRoomDetailViewOpen] = useState(false);
  const [isRoomFilterDrawerOpen, setIsRoomFilterDrawerOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Format "HH:MM" to 12-Hour format helper
  const format12Hour = (time24: string) => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${mStr} ${ampm}`;
  };

  useEffect(() => {
    fetchMasterData();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch { }
      }
    }
  }, []);

  // Fetch paginated bookings when search/filter/page parameters update
  const fetchBookings = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("page", String(page));
      if (searchTerm) params.append("search", searchTerm);
      if (selectedProperty) params.append("property", selectedProperty);
      if (selectedFloor) params.append("floor", selectedFloor);
      if (selectedRoomFilter) params.append("meetingRoom", selectedRoomFilter);

      const res = await api.get(`/bookings?${params.toString()}`);
      if (res.success) {
        setBookings(res.data || []);
        setTotalItems(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch paginated meeting rooms when search/filter/page parameters update
  const fetchRooms = async (page = roomCurrentPage) => {
    setIsRoomLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(roomLimit));
      if (roomSearchTerm) params.append("search", roomSearchTerm);
      if (roomSelectedProperty) params.append("property", roomSelectedProperty);
      if (roomSelectedFloor) params.append("floor", roomSelectedFloor);

      const res = await api.get(`/meeting-rooms?${params.toString()}`);
      if (res.success) {
        setMeetingRooms(res.data || []);
        setRoomTotalItems(res.total || 0);
        setRoomTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load meeting rooms:", err);
    } finally {
      setIsRoomLoading(false);
    }
  };

  // Fetch all necessary master metadata lists for dropdown selectors
  const fetchMasterData = async () => {
    try {
      const [propRes, floorRes, unitRes, roomRes] = await Promise.all([
        api.get('/properties'),
        api.get('/floors'),
        api.get('/units'),
        api.get('/meeting-rooms?limit=1000')
      ]);

      if (propRes.success) setProperties(propRes.data || []);
      if (floorRes.success) setFloors(floorRes.data || []);
      if (unitRes.success) setUnits(unitRes.data || []);
      if (roomRes.success) setAllMeetingRooms(roomRes.data || []);
    } catch (err) {
      console.error("Failed to load initial master dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchBookings(currentPage);
  }, [currentPage, searchTerm, selectedProperty, selectedFloor, selectedRoomFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProperty, selectedFloor, selectedRoomFilter]);

  useEffect(() => {
    fetchRooms(roomCurrentPage);
  }, [roomCurrentPage, roomSearchTerm, roomSelectedProperty, roomSelectedFloor]);

  useEffect(() => {
    setRoomCurrentPage(1);
  }, [roomSearchTerm, roomSelectedProperty, roomSelectedFloor]);

  // Booking CRUD helpers
  const handleSaveBooking = async (savedData: any) => {
    let response;
    if (bookingFormModalMode === 'edit') {
      response = await api.put(`/bookings/${savedData._id}`, savedData);
    } else {
      response = await api.post('/bookings', savedData);
    }

    if (!response.success) {
      throw new Error(response.error || "Overlap slot conflict or validation failure.");
    }
    await fetchBookings(currentPage);
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const response = await api.delete(`/bookings/${id}`);
      if (response.success) {
        await fetchBookings(currentPage);
      }
    } catch (err) {
      console.error("Failed to cancel booking:", err);
    }
  };

  // Room CRUD helpers
  const handleSaveRoom = async (savedData: any) => {
    let response;
    if (roomFormModalMode === 'edit') {
      response = await api.put(`/meeting-rooms/${savedData._id}`, savedData);
    } else {
      response = await api.post('/meeting-rooms', savedData);
    }

    if (!response.success) {
      throw new Error(response.error || "Failed to save room details.");
    }
    await fetchRooms(roomCurrentPage);
    await fetchMasterData(); // Refresh dropdown list
  };



  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || currentUser?.role === 'FLOOR_ADMIN' || currentUser?.role === 'Floor Admin';
  const isRoomAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || currentUser?.role === 'FLOOR_ADMIN' || currentUser?.role === 'Floor Admin';


  // Bookings Table Columns
  const bookingColumns: TableColumn<any>[] = [

    {
      header: "Booking ID",
      render: (b) => <span className="fw-bold" style={{ color: "#014aad" }}>{b.bookingId}</span>
    },

    {
      header: "Properties & Floors",
      render: (b) => (
        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
          <i className="bi bi-building me-1" />{b.property?.propertyName || "—"} <br />
          <i className="bi bi-layers me-1" />{b.floor?.floorName || `Floor ${b.floor?.floorNumber || "—"}`}
        </span>
      )
    },
    {
      header: "Date & Time Slot",
      render: (b) => (
        <div>
          <strong className="text-dark"><i className="bi bi-calendar-event me-1" />{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-GB') : '—'}</strong>
          <div className="text-secondary small mt-1">
            <i className="bi bi-clock me-1" />{format12Hour(b.startTime)} - {format12Hour(b.endTime)}
          </div>
        </div>
      )
    },
    {
      header: "Booked By",
      render: (b) => <span className="fw-semibold text-dark">{b.bookedBy}</span>
    },

    {
      header: "Status",
      render: () => (
        <span className="badge rounded-pill fw-bold border px-3 py-1 bg-success bg-opacity-10 text-success border-success" style={{ fontSize: '0.7rem' }}>
          Approved
        </span>
      )
    },
    {
      header: "Actions",
      style: { textAlign: "center" },
      render: (b) => (
        <div className="d-flex gap-2 justify-content-center align-items-center">
          <button
            title="View Details"
            onClick={() => {
              setSelectedBooking(b);
              setIsBookingDetailViewOpen(true);
            }}
            style={{
              width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#1e293b",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <i className="bi bi-eye text-secondary" style={{ fontSize: '0.9rem' }} />
          </button>

          {(isAdmin || currentUser?.name === b.bookedBy) && (
            <button
              title="Cancel Booking"
              onClick={() => setCancelConfirmId(b._id)}
              style={{
                width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
                background: "#fff", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#1e293b",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <i className="bi bi-x-circle text-danger" style={{ fontSize: '0.9rem' }} />
            </button>
          )}
        </div>
      )
    }
  ];

  // Meeting Rooms Table Columns
  const roomColumns: TableColumn<any>[] = [

    {
      header: "Room / Space Name",
      render: (r) => (
        <div>
          <span className="fw-bold text-dark">{r.roomName}</span>
          {r.unit && (
            <span className="badge bg-light text-primary border ms-2" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
              <i className="bi bi-door-closed me-1" />
              Unit {r.unit.unitNumber || r.unit}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Property Association",
      render: (r) => <span className="text-muted">{r.property?.propertyName || '—'}</span>
    },
    {
      header: "Floor Level",
      render: (r) => <span className="text-muted">{r.floor?.floorName || `Floor ${r.floor?.floorNumber || '—'}`}</span>
    },
    {
      header: "Space (SFT)",
      render: (r) => <span className="fw-bold text-dark">{r.sqft} SFT</span>
    },
    {
      header: "Capacity",
      render: (r) => <span className="fw-medium text-dark">{r.capacity} Pax</span>
    },
    {
      header: "Status",
      render: (r) => (
        <span className={`badge rounded-pill border px-3 py-1 ${r.status === 'Under Maintenance' ? 'bg-danger bg-opacity-10 text-danger border-danger' : 'bg-success bg-opacity-10 text-success border-success'
          }`} style={{ fontSize: '0.7rem' }}>
          {r.status || 'Available'}
        </span>
      )
    },
    {
      header: "Actions",
      style: { textAlign: "center" },
      render: (r) => (
        <div className="d-flex gap-2 justify-content-center align-items-center">
          <button
            className="btn btn-sm text-white border-0 hover-lift"
            onClick={() => {
              setSelectedBooking({ meetingRoom: r, property: r.property, floor: r.floor });
              setBookingFormModalMode("create");
              setIsBookingFormModalOpen(true);
            }}
            style={{ fontSize: '0.7rem', backgroundColor: "#014aad", borderRadius: "4px", padding: "6px 12px" }}
            disabled={r.status === 'Under Maintenance'}
          >
            📅 Book Room
          </button>
          <button
            title="View Specifications"
            onClick={() => {
              setSelectedRoom(r);
              setIsRoomDetailViewOpen(true);
            }}
            style={{
              width: 32, height: 32, borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#1e293b",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <i className="bi bi-eye text-secondary" style={{ fontSize: '0.9rem' }} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div
      className="p-0 d-flex flex-column bg-white border rounded-4"
      style={{ height: "calc(100vh - 104px)", fontFamily: "var(--font-geist-sans)", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center pb-2 pt-3 px-4 flex-shrink-0 border-bottom"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div>
          <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>Meeting Room & Space Booking</span>
          {activeTab === 'bookings' ? (
            <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize: "0.72rem" }}>
              <span>Total Bookings: <strong className="text-dark">{totalItems}</strong></span>
            </div>
          ) : (
            <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize: "0.72rem" }}>
              <span>Total Designated Resources: <strong className="text-dark">{roomTotalItems}</strong></span>
            </div>
          )}
        </div>

        <div className="d-flex gap-2 align-items-center">
          {/* Main Module Tabs */}
          {isRoomAdmin && (
            <div className="btn-group bg-light p-1 me-2" style={{ borderRadius: "4px" }}>
              <button
                className={`btn btn-sm px-3 fw-bold ${activeTab === 'bookings' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
                onClick={() => setActiveTab('bookings')}
                style={{ fontSize: '0.75rem', borderRadius: "4px" }}
              >
                📅 Schedule Timetable
              </button>
              <button
                className={`btn btn-sm px-3 fw-bold ${activeTab === 'rooms' ? 'btn-white shadow-sm' : 'btn-transparent text-muted'}`}
                onClick={() => setActiveTab('rooms')}
                style={{ fontSize: '0.75rem', borderRadius: "4px" }}
              >
                🏢 Rooms Master
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="position-relative" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control px-3 py-2"
              placeholder={activeTab === 'bookings' ? "Search bookings..." : "Search rooms..."}
              value={activeTab === 'bookings' ? searchTerm : roomSearchTerm}
              onChange={e => {
                if (activeTab === 'bookings') {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                } else {
                  setRoomSearchTerm(e.target.value);
                  setRoomCurrentPage(1);
                }
              }}
              style={{ borderRadius: "4px", border: "1px solid #e0e0e0", fontSize: "0.85rem", height: 40 }}
            />
            {(activeTab === 'bookings' ? searchTerm : roomSearchTerm) ? (
              <button
                onClick={() => {
                  if (activeTab === 'bookings') {
                    setSearchTerm("");
                    setCurrentPage(1);
                  } else {
                    setRoomSearchTerm("");
                    setRoomCurrentPage(1);
                  }
                }}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  border: "none", background: "none", cursor: "pointer", color: "#94a3b8",
                  fontSize: "0.85rem", lineHeight: 1,
                }}
              >×</button>
            ) : (
              <i className="bi bi-search position-absolute text-muted"
                style={{ right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }} />
            )}
          </div>

          {/* Filter Toggle */}
          <button
            className={`btn border d-flex align-items-center justify-content-center position-relative ${
              (activeTab === 'bookings' ? isBookingFilterDrawerOpen : isRoomFilterDrawerOpen) ? "text-white border-primary" : "bg-white text-dark border-light"
            }`}
            onClick={() => {
              if (activeTab === 'bookings') {
                setIsBookingFilterDrawerOpen(true);
              } else {
                setIsRoomFilterDrawerOpen(true);
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "4px",
              backgroundColor: (activeTab === 'bookings' ? isBookingFilterDrawerOpen : isRoomFilterDrawerOpen) ? "#014aad" : "#fff",
              border: "1px solid #e2e8f0"
            }}
            title="Filters"
          >
            <i className={`bi bi-funnel ${(activeTab === 'bookings' ? isBookingFilterDrawerOpen : isRoomFilterDrawerOpen) ? "text-white" : "text-dark"}`} />
          </button>

          {/* Add Button */}
          {activeTab === 'bookings' ? (
            <button
              className="btn d-flex align-items-center gap-2 px-3 text-white border-0"
              style={{
                backgroundColor: "#014aad", fontWeight: 500,
                borderRadius: "4px", height: 40, fontSize: "0.85rem"
              }}
              onClick={() => {
                setSelectedBooking(null);
                setBookingFormModalMode("create");
                setIsBookingFormModalOpen(true);
              }}
            >
              <i className="bi bi-plus-lg" /> Book Room
            </button>
          ) : (
            isRoomAdmin && (
              <button
                className="btn d-flex align-items-center gap-2 px-3 text-white border-0"
                style={{
                  backgroundColor: "#014aad", fontWeight: 500,
                  borderRadius: "4px", height: 40, fontSize: "0.85rem"
                }}
                onClick={() => {
                  setSelectedRoom(null);
                  setRoomFormModalMode("create");
                  setIsRoomFormModalOpen(true);
                }}
              >
                <i className="bi bi-plus-lg" /> Add Room
              </button>
            )
          )}
        </div>
      </div>

      {/* Bookings Timetable view */}
      {activeTab === 'bookings' && (
        <div className="flex-grow-1 overflow-hidden p-0 d-flex flex-column">
          <Table
            columns={bookingColumns}
            data={bookings}
            isLoading={isLoading}
            loadingMessage="Fetching reservations log..."
            emptyMessage="No reservation records match this filter query."
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Meeting Rooms Master view */}
      {isRoomAdmin && activeTab === 'rooms' && (
        <div className="flex-grow-1 overflow-hidden p-0 d-flex flex-column">
          <Table
            columns={roomColumns}
            data={meetingRooms}
            isLoading={isRoomLoading}
            loadingMessage="Fetching rooms specifications..."
            emptyMessage="No meeting room records designated on this system."
            currentPage={roomCurrentPage}
            totalPages={roomTotalPages}
            totalItems={roomTotalItems}
            itemsPerPage={roomLimit}
            onPageChange={(page) => setRoomCurrentPage(page)}
          />
        </div>
      )}

      {/* Booking Form Overlay Dialog */}
      <BookingFormModal
        isOpen={isBookingFormModalOpen}
        onClose={() => setIsBookingFormModalOpen(false)}
        onSave={handleSaveBooking}
        editData={selectedBooking}
        mode={bookingFormModalMode}
        meetingRooms={allMeetingRooms.filter(r => r.status === 'Available')}
        bookings={bookings}
      />

      {/* Booking Detail View Overlay Dialog */}
      <BookingDetailView
        viewItem={selectedBooking}
        onClose={() => setIsBookingDetailViewOpen(false)}
        onEdit={(booking) => {
          setIsBookingDetailViewOpen(false);
          setSelectedBooking(booking);
          setBookingFormModalMode("edit");
          setIsBookingFormModalOpen(true);
        }}
      />

      {/* Booking Filter Side Drawer */}
      <BookingFilterDrawer
        isOpen={isBookingFilterDrawerOpen}
        onClose={() => setIsBookingFilterDrawerOpen(false)}
        properties={properties}
        floors={floors}
        meetingRooms={allMeetingRooms}
        selectedProperty={selectedProperty}
        setSelectedProperty={setSelectedProperty}
        selectedFloor={selectedFloor}
        setSelectedFloor={setSelectedFloor}
        selectedRoom={selectedRoomFilter}
        setSelectedRoom={setSelectedRoomFilter}
        onApply={() => fetchBookings(1)}
        onReset={() => {
          setSelectedProperty("");
          setSelectedFloor("");
          setSelectedRoomFilter("");
          fetchBookings(1);
        }}
      />

      {/* Meeting Room Form Overlay Dialog */}
      <MeetingRoomFormModal
        isOpen={isRoomFormModalOpen}
        onClose={() => setIsRoomFormModalOpen(false)}
        onSave={handleSaveRoom}
        editData={selectedRoom}
        mode={roomFormModalMode}
        properties={properties}
        floors={floors}
        units={units}
      />

      {/* Meeting Room Detail View Overlay Dialog */}
      <MeetingRoomDetailView
        viewItem={selectedRoom}
        onClose={() => setIsRoomDetailViewOpen(false)}
        onEdit={(room) => {
          setIsRoomDetailViewOpen(false);
          setSelectedRoom(room);
          setRoomFormModalMode("edit");
          setIsRoomFormModalOpen(true);
        }}
      />

      {/* Meeting Room Filter Side Drawer */}
      <MeetingRoomFilterDrawer
        isOpen={isRoomFilterDrawerOpen}
        onClose={() => setIsRoomFilterDrawerOpen(false)}
        properties={properties}
        floors={floors}
        selectedProperty={roomSelectedProperty}
        setSelectedProperty={setRoomSelectedProperty}
        selectedFloor={roomSelectedFloor}
        setSelectedFloor={setRoomSelectedFloor}
        onApply={() => fetchRooms(1)}
        onReset={() => {
          setRoomSelectedProperty("");
          setRoomSelectedFloor("");
          fetchRooms(1);
        }}
      />

      {/* Booking Cancellation Confirmation Modal */}
      {cancelConfirmId && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 9999,
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg overflow-hidden border-0"
            style={{ width: "100%", maxWidth: "420px", fontFamily: "var(--font-geist-sans)" }}
          >
            <div className="border-bottom px-4 py-3 d-flex justify-content-between align-items-center bg-light">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontSize: "1rem" }}>
                <i className="bi bi-exclamation-circle text-danger" /> Confirm Cancellation
              </h6>
              <button className="btn-close shadow-none" onClick={() => setCancelConfirmId(null)} />
            </div>

            <div className="p-4">
              <p className="text-secondary mb-4" style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
                Are you sure you want to cancel this booking reservation? This action cannot be undone.
              </p>

              <div className="d-flex gap-2 justify-content-end">
                <button
                  className="btn btn-outline-secondary btn-sm fw-semibold px-3"
                  style={{ borderRadius: "4px", fontSize: "0.82rem" }}
                  onClick={() => setCancelConfirmId(null)}
                >
                  Keep Booking
                </button>
                <button
                  className="btn btn-danger btn-sm fw-semibold px-3 text-white border-0"
                  style={{ backgroundColor: "#dc3545", borderRadius: "4px", fontSize: "0.82rem" }}
                  onClick={async () => {
                    if (cancelConfirmId) {
                      await handleDeleteBooking(cancelConfirmId);
                      setCancelConfirmId(null);
                    }
                  }}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
