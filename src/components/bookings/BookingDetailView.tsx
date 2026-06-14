"use client";

interface BookingDetailViewProps {
  viewItem: any;
  onClose: () => void;
  onEdit: (item: any) => void;
}

export default function BookingDetailView({
  viewItem,
  onClose,
  onEdit
}: BookingDetailViewProps) {
  if (!viewItem) return null;

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

  const bookingDateFormatted = viewItem.bookingDate
    ? new Date(viewItem.bookingDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : "—";

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", zIndex: 1100, backdropFilter: "blur(5px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
        <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
          
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ backgroundColor: "#3a3a3a" }}>
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              View Reservation Details
            </h5>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#d1d5db",
                fontSize: "1.4rem", lineHeight: 1, cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "24px", maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
            
            {/* Top Info Header */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle text-white fw-bold"
                style={{ width: 56, height: 56, backgroundColor: "#014aad", fontSize: "1.3rem" }}
              >
                <i className="bi bi-calendar-check"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: "#1f2937" }}>
                  {viewItem.meetingRoom?.roomName || "Shared Room/Space"}
                </h5>
                <div className="d-flex gap-2 justify-content-center align-items-center mt-2">
                  <span className="badge px-3 py-1 fw-bold bg-light text-secondary border">
                    ID: {viewItem.bookingId || "—"}
                  </span>
                  <span className="badge px-3 py-1 fw-bold bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                    🟢 Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Meeting Room Association */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                Resource Information
              </h6>
              <ROW label="Room / Hall" value={viewItem.meetingRoom?.roomName} />
              <ROW label="Size / Area" value={viewItem.meetingRoom?.sqft ? `${viewItem.meetingRoom.sqft} SFT` : null} />
              <ROW label="Max Capacity" value={viewItem.meetingRoom?.capacity ? `${viewItem.meetingRoom.capacity} Pax` : null} />
            </div>

            {/* Section 2: Time & Schedule */}
            <div className="mb-4 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-clock-fill text-primary me-2"></i>
                Schedule Details
              </h6>
              <ROW label="Date" value={bookingDateFormatted} />
              <ROW label="Start Time" value={format12Hour(viewItem.startTime)} />
              <ROW label="End Time" value={format12Hour(viewItem.endTime)} />
            </div>

            {/* Section 3: Location Details */}
            <div className="mb-4 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                Location Association
              </h6>
              <ROW label="Property / Building" value={viewItem.property?.propertyName} />
              <ROW label="Floor" value={viewItem.floor?.floorName || `Floor ${viewItem.floor?.floorNumber || "—"}`} />
            </div>

            {/* Section 4: Booker Details */}
            <div className="mb-3 pt-2">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-person-fill text-primary me-2"></i>
                Booked By
              </h6>
              <ROW label="Name" value={viewItem.bookedBy} />
              <ROW label="Booking Purpose" value={viewItem.bookingParticulars} />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 bg-light border-top d-flex gap-2 justify-content-end align-items-center">
            <button
              onClick={onClose}
              className="btn btn-outline-secondary btn-sm rounded px-3 fw-bold"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(viewItem)}
              className="btn btn-primary btn-sm rounded px-3 fw-bold text-white shadow-sm border-0"
              style={{ backgroundColor: "#014aad" }}
            >
              <i className="bi bi-pencil-square me-1" /> Edit Reservation
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function ROW({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || String(value).trim() === "" || String(value).trim() === "-") {
    value = "—";
  }

  return (
    <div className="d-flex justify-content-between py-2 border-bottom border-light" style={{ fontSize: "0.85rem" }}>
      <span className="text-muted fw-medium">{label}</span>
      <span className="fw-semibold text-dark">
        {value}
      </span>
    </div>
  );
}
