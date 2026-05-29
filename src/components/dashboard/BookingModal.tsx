"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
  properties: any[];
  floors: any[];
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

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editData, 
  mode,
  properties = [],
  floors = [],
  meetingRooms = [],
  bookings = []
}: BookingModalProps) {
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
    bookingStatus: "Pending"
  });

  // Check role to see if they can approve/reject status
  const [canEditStatus, setCanEditStatus] = useState(false);

  // Helper to convert "HH:MM" to minutes
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Format "HH:MM" (24-hour) to "hh:mm AM/PM" (12-hour)
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
      // Ignore current booking in edit mode
      if (editData && b._id === editData._id) return false;
      
      // Match meeting room
      const bRoomId = b.meetingRoom?._id || b.meetingRoom || "";
      if (bRoomId !== formData.meetingRoom) return false;
      
      // Match status
      if (b.bookingStatus !== 'Approved') return false;
      
      // Match date
      if (!b.bookingDate) return false;
      const bDate = new Date(b.bookingDate).toISOString().split('T')[0];
      const selectedDate = new Date(formData.bookingDate).toISOString().split('T')[0];
      if (bDate !== selectedDate) return false;
      
      // Check overlap
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
      
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCanEditStatus(user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'Floor Admin');
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
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
          bookingStatus: editData.bookingStatus || "Pending"
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
          bookingStatus: "Pending"
        });
      }
    }
  }, [editData, isOpen, mode, meetingRooms]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }
    
    if (!formData.meetingRoom) {
      setValidationError("Please select a Meeting Room.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to save booking. Time slot conflict.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '650px' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? '🏢 Book a Meeting Room/Hall' : mode === 'edit' ? 'Update Booking' : 'Booking Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {validationError && (
                <div className="alert alert-danger border-0 rounded-3 mb-4 small py-2 fw-medium">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> {validationError}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-primary mb-0" style={{ color: '#014aad' }}>Booking Parameters</h6>
                <div className="badge bg-light text-dark border">ID: {formData.bookingId}</div>
              </div>
              
              <div className="row g-3 mb-4">
                {/* Meeting Room Dropdown */}
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Select Meeting Room / Hall *</label>
                  <select 
                    className="form-select form-select-sm bg-light border-0 shadow-none py-2" 
                    required 
                    disabled={isReadOnly}
                    value={formData.meetingRoom} 
                    onChange={(e) => {
                      const roomId = e.target.value;
                      const selectedRoom = meetingRooms.find(r => r._id === roomId);
                      const propId = selectedRoom?.property?._id || selectedRoom?.property || "";
                      const floorId = selectedRoom?.floor?._id || selectedRoom?.floor || "";
                      setFormData({
                        ...formData,
                        meetingRoom: roomId,
                        property: propId,
                        floor: floorId
                      });
                    }}
                  >
                    <option value="">-- Choose Room / Hall --</option>
                    {meetingRooms.map(r => {
                      const propName = r.property?.propertyName || "";
                      const floorName = r.floor?.floorName || `Floor ${r.floor?.floorNumber || ""}`;
                      return (
                        <option key={r._id} value={r._id}>
                          {r.roomName} ({r.sqft} SFT, Cap: {r.capacity}) - {propName}, {floorName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Date Selection */}
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Booking Date *</label>
                  <input type="date" className="form-control form-control-sm bg-light border-0 py-2" required disabled={isReadOnly}
                    value={formData.bookingDate} onChange={(e) => setFormData({...formData, bookingDate: e.target.value})} />
                </div>

                {/* Slot Selection Grid - 6 display per row */}
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-2 d-flex justify-content-between align-items-center">
                    <span>Select Time Slot *</span>
                    {formData.startTime && formData.endTime && (
                      <span className="badge bg-light text-dark border fw-semibold" style={{ fontSize: '0.72rem' }}>
                        Selected: {format12Hour(formData.startTime)} - {format12Hour(formData.endTime)}
                      </span>
                    )}
                  </label>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '10px',
                    margin: '4px 0'
                  }}>
                    {standardSlots.map((slot, index) => {
                      const isBooked = isSlotBooked(slot.start, slot.end);
                      const isSelected = formData.startTime === slot.start && formData.endTime === slot.end;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={isReadOnly || isBooked}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              startTime: slot.start,
                              endTime: slot.end
                            });
                          }}
                          className={`btn btn-sm py-2 px-1 text-center border d-flex flex-column align-items-center justify-content-center transition-all ${
                            isSelected 
                              ? 'text-white border-primary shadow-sm fw-bold' 
                              : isBooked 
                                ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 opacity-75' 
                                : 'bg-light text-dark hover-bg-light border-light-subtle'
                          }`}
                          style={{
                            borderRadius: '8px',
                            cursor: isReadOnly || isBooked ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            minHeight: '62px',
                            transition: 'all 0.15s ease',
                            backgroundColor: isSelected ? '#014aad' : undefined,
                            borderColor: isSelected ? '#014aad' : undefined
                          }}
                        >
                          <span className="fw-bold">{format12Hour(slot.start)}</span>
                          <span className="text-muted small" style={{ fontSize: '0.65rem', color: isSelected ? '#e2e8f0' : undefined }}>to {format12Hour(slot.end)}</span>
                          <span className="mt-1" style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.9, color: isSelected ? '#fff' : isBooked ? '#dc2626' : '#16a34a' }}>
                            {isBooked ? '🚫 Booked' : isSelected ? '✓ Selected' : '🟢 Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fallback display for custom legacy slots */}
                  {formData.startTime && formData.endTime && !standardSlots.some(s => s.start === formData.startTime && s.end === formData.endTime) && (
                    <div className="alert alert-info border-0 rounded-3 mb-0 py-2 px-3 small fw-medium mt-2 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle-fill"></i>
                      <span>Custom Time Slot Selected: <strong>{format12Hour(formData.startTime)} - {format12Hour(formData.endTime)}</strong></span>
                    </div>
                  )}
                </div>

                {/* Booker Name & Status Details */}
                {mode !== 'create' ? (
                  <>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Booked By (Name)</label>
                      <input type="text" className="form-control form-control-sm bg-light border-0 py-2" disabled value={formData.bookedBy} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Booking Status</label>
                      <select 
                        className="form-select form-select-sm bg-light border-0 py-2" 
                        disabled={isReadOnly || !canEditStatus}
                        value={formData.bookingStatus} 
                        onChange={(e) => setFormData({...formData, bookingStatus: e.target.value})}
                      >
                        <option value="Pending">⏳ Pending Approval</option>
                        <option value="Approved">✅ Approved</option>
                        <option value="Rejected">❌ Rejected</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-md-12">
                    <label className="form-label small fw-bold text-muted mb-1">Booking Status</label>
                    <select 
                      className="form-select form-select-sm bg-light border-0 py-2" 
                      disabled={isReadOnly || !canEditStatus}
                      value={formData.bookingStatus} 
                      onChange={(e) => setFormData({...formData, bookingStatus: e.target.value})}
                    >
                      <option value="Pending">⏳ Pending Approval</option>
                      <option value="Approved">✅ Approved</option>
                      <option value="Rejected">❌ Rejected</option>
                    </select>
                  </div>
                )}

                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Booking Particulars / Purpose *</label>
                  <textarea 
                    className="form-control form-control-sm bg-light border-0 py-2" 
                    rows={2} 
                    required 
                    disabled={isReadOnly}
                    placeholder="Describe purpose of meeting (e.g. Board review, Client pitch...)"
                    value={formData.bookingParticulars} 
                    onChange={(e) => setFormData({...formData, bookingParticulars: e.target.value})}
                  />
                </div>
              </div>

            </div>
            
            <div className="modal-footer border-top p-4 d-flex gap-3 bg-light">
              <button 
                type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem' }}
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'view' && (
                <button 
                  type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm text-white border-0"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#014aad', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {mode === 'create' ? 'Request Slot' : 'Update Booking'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
