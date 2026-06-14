"use client";

interface MeetingRoomDetailViewProps {
  viewItem: any;
  onClose: () => void;
  onEdit: (item: any) => void;
}

export default function MeetingRoomDetailView({
  viewItem,
  onClose,
  onEdit
}: MeetingRoomDetailViewProps) {
  if (!viewItem) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", zIndex: 1100, backdropFilter: "blur(5px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }}>
        <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
          
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ backgroundColor: "#3a3a3a" }}>
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              View Room Specifications
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
            
            {/* Top info badge */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle text-white fw-bold"
                style={{ width: 56, height: 56, backgroundColor: "#014aad", fontSize: "1.3rem" }}
              >
                <i className="bi bi-door-open"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: "#1f2937" }}>
                  {viewItem.roomName || "Meeting Space"}
                </h5>
                <div className="d-flex gap-2 justify-content-center align-items-center mt-2">
                  <span className="badge px-3 py-1 fw-bold bg-light text-secondary border">
                    Capacity: {viewItem.capacity || "—"} Pax
                  </span>
                  {viewItem.status === "Available" ? (
                    <span className="badge px-3 py-1 fw-bold bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      🟢 Available
                    </span>
                  ) : (
                    <span className="badge px-3 py-1 fw-bold bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                      🔴 Under Maintenance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Room specs */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-sliders text-primary me-2"></i>
                Technical Specs
              </h6>
              <ROW label="Room Name" value={viewItem.roomName} />
              <ROW label="Total Area" value={viewItem.sqft ? `${viewItem.sqft} SFT` : "—"} />
              <ROW label="Capacity limit" value={viewItem.capacity ? `${viewItem.capacity} Pax` : "—"} />
            </div>

            {/* Property details */}
            <div className="mb-3">
              <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                <i className="bi bi-geo-alt text-primary me-2"></i>
                Location Association
              </h6>
              <ROW label="Property Name" value={viewItem.property?.propertyName} />
              <ROW label="Floor Level" value={viewItem.floor?.floorName || `Floor ${viewItem.floor?.floorNumber || "—"}`} />
              <ROW label="Mapped Floor Unit" value={viewItem.unit ? `${viewItem.unit.unitNumber} (${viewItem.unit.unitName || "Office"})` : "Standalone Space"} />
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
              <i className="bi bi-pencil-square me-1" /> Edit Room Specs
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
