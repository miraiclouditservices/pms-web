"use client";

import { useState, useEffect, useRef } from "react";

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editData?: any;
  mode: "create" | "edit";
  meetingRooms: any[];
  bookings?: any[];
}

const standardSlots = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
  { start: "18:00", end: "19:00" },
  { start: "19:00", end: "20:00" },
  { start: "20:00", end: "21:00" },
  { start: "21:00", end: "22:00" },
  { start: "22:00", end: "23:00" },
  { start: "23:00", end: "23:30" }
];

export default function BookingFormModal({
  isOpen,
  onClose,
  onSave,
  editData,
  mode,
  meetingRooms = [],
  bookings = []
}: BookingFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    _id: undefined as string | undefined,
    bookingId: "",
    property: "",
    floor: "",
    meetingRoom: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    bookedBy: "",
    bookingParticulars: "",
    bookingStatus: "Approved"
  });

  // Searchable Dropdown state for Meeting Room
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const roomContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (roomContainerRef.current && !roomContainerRef.current.contains(target)) {
        setShowRoomDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

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

  const isSlotBooked = (start: string, end: string) => {
    if (!formData.meetingRoom || !formData.bookingDate) return false;
    const slotStart = toMinutes(start);
    const slotEnd = toMinutes(end);

    return bookings.some((b: any) => {
      if (editData && b._id === editData._id) return false;
      const bRoomId = b.meetingRoom?._id || b.meetingRoom || "";
      if (bRoomId !== formData.meetingRoom) return false;
      if (b.bookingStatus !== 'Approved') return false;
      if (!b.bookingDate) return false;

      const bDate = new Date(b.bookingDate).toISOString().split('T')[0];
      const selectedDate = new Date(formData.bookingDate).toISOString().split('T')[0];
      if (bDate !== selectedDate) return false;

      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setRoomSearch("");
      setShowRoomDropdown(false);
      if (editData) {
        const propId = editData.property?._id || editData.property || "";
        const floorId = editData.floor?._id || editData.floor || "";
        const roomId = editData.meetingRoom?._id || editData.meetingRoom || "";
        const dateStr = editData.bookingDate ? new Date(editData.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        let initialBookedBy = editData.bookedBy || "";
        if (!initialBookedBy && typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              initialBookedBy = JSON.parse(stored).name || "";
            } catch {}
          }
        }

        setFormData({
          _id: mode === "create" ? undefined : editData._id,
          bookingId: editData.bookingId || `BKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          property: propId,
          floor: floorId,
          meetingRoom: roomId,
          bookingDate: dateStr,
          startTime: editData.startTime || "09:00",
          endTime: editData.endTime || "10:00",
          bookedBy: initialBookedBy,
          bookingParticulars: editData.bookingParticulars || "",
          bookingStatus: "Approved"
        });
      } else {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const defaultRoom = meetingRooms[0]?._id || "";
        const defaultProp = meetingRooms[0]?.property?._id || meetingRooms[0]?.property || "";
        const defaultFloor = meetingRooms[0]?.floor?._id || meetingRooms[0]?.floor || "";
        
        let initialBookedBy = "";
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              initialBookedBy = JSON.parse(stored).name || "";
            } catch {}
          }
        }

        setFormData({
          _id: undefined,
          bookingId: `BKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          property: defaultProp,
          floor: defaultFloor,
          meetingRoom: defaultRoom,
          bookingDate: dateStr,
          startTime: "09:00",
          endTime: "10:00",
          bookedBy: initialBookedBy,
          bookingParticulars: "",
          bookingStatus: "Approved"
        });
      }
    }
  }, [editData, isOpen, mode, meetingRooms]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meetingRoom) {
      setValidationError("Please select a Meeting Room.");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setValidationError("Please select a time slot.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to save booking. Time slot conflict.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 650 }}>
        <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              {mode === "create" ? "Book a Meeting Room/Space" : "Update Booking Reservation"}
            </h5>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#d1d5db",
                fontSize: "1.4rem", cursor: "pointer", lineHeight: 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              {validationError && (
                <div className="alert alert-danger border-0 rounded-3 mb-4 py-2 small fw-medium">
                  <i className="bi bi-exclamation-triangle-fill me-2" /> {validationError}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold text-muted small" style={{ letterSpacing: "0.03em" }}>RESERVATION DETAILS</span>
                <span className="badge bg-light text-secondary border">Code: {formData.bookingId}</span>
              </div>

              <div className="row g-3">
                {/* Searchable Meeting Room Dropdown */}
                <div className="col-12 position-relative" ref={roomContainerRef}>
                  <label className="form-label small fw-semibold text-dark mb-1">Select Room or Hall *</label>
                  <div
                    className="form-control d-flex justify-content-between align-items-center bg-white"
                    onClick={() => setShowRoomDropdown(prev => !prev)}
                    style={{ fontSize: "0.85rem", padding: "8px 12px", cursor: "pointer", border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none" }}
                  >
                    <span className="text-truncate" style={{ maxWidth: "520px" }}>
                      {(() => {
                        const r = meetingRooms.find(rm => rm._id === formData.meetingRoom);
                        return r ? `${r.roomName} (${r.sqft} SFT, Cap: ${r.capacity} Pax) - ${r.property?.propertyName || "Property"}, ${r.floor?.floorName || `Floor ${r.floor?.floorNumber}`}` : "Select Meeting Room...";
                      })()}
                    </span>
                    <i className={`bi bi-chevron-${showRoomDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                  </div>

                  {showRoomDropdown && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{
                        top: "100%", left: 12, right: 12, zIndex: 1050,
                        marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                      }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search room by name, property, or floor..."
                          value={roomSearch}
                          onChange={e => setRoomSearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {roomSearch && (
                          <button
                            type="button"
                            onClick={() => setRoomSearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                        {(() => {
                          const filtered = meetingRooms.filter(r =>
                            r.roomName?.toLowerCase().includes(roomSearch.toLowerCase()) ||
                            r.property?.propertyName?.toLowerCase().includes(roomSearch.toLowerCase()) ||
                            (r.floor?.floorName || `Floor ${r.floor?.floorNumber}`).toLowerCase().includes(roomSearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return <div className="text-muted text-center py-2 small">No matches found</div>;
                          }
                          return filtered.map(r => (
                            <div
                              key={r._id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  meetingRoom: r._id,
                                  property: r.property?._id || r.property || "",
                                  floor: r.floor?._id || r.floor || ""
                                });
                                setShowRoomDropdown(false);
                                setRoomSearch("");
                              }}
                              className="px-3 py-2 rounded-2 small"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.meetingRoom === r._id ? "#f1f5f9" : "transparent",
                                color: formData.meetingRoom === r._id ? "#014aad" : "#334155",
                                fontWeight: formData.meetingRoom === r._id ? 600 : 400,
                              }}
                              onMouseEnter={e => {
                                if (formData.meetingRoom !== r._id) {
                                  e.currentTarget.style.backgroundColor = "#f8fafc";
                                  e.currentTarget.style.color = "#000";
                                }
                              }}
                              onMouseLeave={e => {
                                if (formData.meetingRoom !== r._id) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = "#334155";
                                }
                              }}
                            >
                              {r.roomName} ({r.sqft} SFT, Cap: {r.capacity} Pax) - {r.property?.propertyName || "Property"}, {r.floor?.floorName || `Floor ${r.floor?.floorNumber}`}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date selection */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark mb-1">Date *</label>
                  <input
                    type="date"
                    className="form-control bg-white"
                    style={{ fontSize: "0.85rem", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "0.375rem" }}
                    required
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  />
                </div>

                {/* Slot grid */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark mb-2 d-flex justify-content-between align-items-center">
                    <span>Select Time Slot *</span>
                    {formData.startTime && formData.endTime && (
                      <span className="badge bg-light text-primary border fw-bold">
                        {format12Hour(formData.startTime)} - {format12Hour(formData.endTime)}
                      </span>
                    )}
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px"
                    }}
                  >
                    {standardSlots.map((slot, index) => {
                      const isBooked = isSlotBooked(slot.start, slot.end);
                      const isSelected = formData.startTime === slot.start && formData.endTime === slot.end;

                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              startTime: slot.start,
                              endTime: slot.end
                            });
                          }}
                          className="btn btn-sm py-2 px-1 text-center border d-flex flex-column align-items-center justify-content-center transition-all"
                          style={{
                            borderRadius: "6px",
                            cursor: isBooked ? "not-allowed" : "pointer",
                            fontSize: "0.75rem",
                            minHeight: "56px",
                            backgroundColor: isSelected ? "#014aad" : isBooked ? "#fee2e2" : "#f8fafc",
                            color: isSelected ? "#fff" : isBooked ? "#991b1b" : "#334155",
                            borderColor: isSelected ? "#014aad" : isBooked ? "#fee2e2" : "#e2e8f0"
                          }}
                        >
                          <span className="fw-bold">{format12Hour(slot.start)}</span>
                          <span className="small opacity-75">to {format12Hour(slot.end)}</span>
                          <span className="mt-1 fw-bold" style={{ fontSize: "0.58rem", color: isSelected ? "#fff" : isBooked ? "#991b1b" : "#16a34a" }}>
                            {isBooked ? "🚫 Booked" : isSelected ? "✓ Selected" : "🟢 Open"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Particulars */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark mb-1">Purpose / Particulars *</label>
                  <textarea
                    className="form-control bg-white"
                    style={{ fontSize: "0.85rem", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "0.375rem" }}
                    rows={3}
                    required
                    placeholder="E.g. Project kick-off meeting, executive board sync..."
                    value={formData.bookingParticulars}
                    onChange={(e) => setFormData({ ...formData, bookingParticulars: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-light border-top d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 fw-bold rounded-3"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm px-3 fw-bold text-white shadow-sm border-0 rounded-3"
                style={{ backgroundColor: "#014aad" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" style={{ width: "0.8rem", height: "0.8rem" }} />
                    Saving...
                  </>
                ) : (
                  "Book Room"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
