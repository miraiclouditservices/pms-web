"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";

interface HelpdeskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function HelpdeskFormModal({
  isOpen,
  onClose,
  onSave
}: HelpdeskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Maintenance",
    priority: "Low",
    description: "",
    attachment: "",
    property: "",
    floor: "",
    unit: "",
    locationArea: ""
  });

  // Locations / Mappings data for creation
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Dropdown search states
  const [showPropDrop, setShowPropDrop] = useState(false);
  const [propSearch, setPropSearch] = useState("");
  const propRef = useRef<HTMLDivElement>(null);

  const [showFloorDrop, setShowFloorDrop] = useState(false);
  const [floorSearch, setFloorSearch] = useState("");
  const floorRef = useRef<HTMLDivElement>(null);

  const [showUnitDrop, setShowUnitDrop] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const unitRef = useRef<HTMLDivElement>(null);

  // Fetch properties and units on mount/open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      api.get("/properties").then(res => {
        if (res.success) setProperties(res.data);
      });
      api.get("/units").then(res => {
        if (res.success) setUnits(res.data);
      });
    }
  }, [isOpen]);

  // Dynamically load floors when property changes
  useEffect(() => {
    const fetchFloorsForProperty = async () => {
      if (!formData.property) {
        setFloors([]);
        return;
      }
      try {
        const res = await api.get(`/floors?property=${formData.property}&limit=1000`);
        if (res.success) {
          setFloors(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch floors for property:", err);
      }
    };
    fetchFloorsForProperty();
  }, [formData.property]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (propRef.current && !propRef.current.contains(e.target as Node)) setShowPropDrop(false);
      if (floorRef.current && !floorRef.current.contains(e.target as Node)) setShowFloorDrop(false);
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) setShowUnitDrop(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  if (!isOpen) return null;

  // Filter lists based on searches
  const filteredProps = properties.filter(p =>
    (p.propertyName || "").toLowerCase().includes(propSearch.toLowerCase())
  );

  const filteredFloors = floors.filter(f =>
    (f.floorName || `Floor ${f.floorNumber}`).toLowerCase().includes(floorSearch.toLowerCase())
  );

  const filteredUnits = units
    .filter(u => {
      const matchProperty = (u.property?._id || u.property) === formData.property;
      const matchFloor = (u.floor?._id || u.floor) === formData.floor;
      return matchProperty && matchFloor;
    })
    .filter(u =>
      (u.unitName || u.unitNumber || "").toLowerCase().includes(unitSearch.toLowerCase())
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property || !formData.floor) {
      setError("Property and Floor are required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.unit) {
        delete (payload as any).unit;
      }
      await onSave(payload);
      setFormData({
        title: "",
        category: "Maintenance",
        priority: "Low",
        description: "",
        attachment: "",
        property: "",
        floor: "",
        unit: "",
        locationArea: ""
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit ticket. Please check if the server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProp = properties.find(p => p._id === formData.property);
  const selectedFloorObj = floors.find(f => f._id === formData.floor);
  const selectedUnitObj = units.find(u => u._id === formData.unit);

  return (
    <div
      className="modal show d-block"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "20px"
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered overflow-hidden w-100"
        style={{
          maxWidth: "750px",
          borderRadius: "10px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}
      >
        <div className="modal-content border-0 bg-white">
          {/* Modal Header */}
          <div
            className="px-4 py-3 d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "#3a3a3a", color: "#ffffff" }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-ticket-detailed fs-5"></i>
              <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>
                Raise Support Ticket
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white shadow-none"
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#d1d5db", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            <div className="p-4" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              {error && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center justify-content-between mb-3 border-0" style={{ borderRadius: "6px", backgroundColor: "#fef2f2", color: "#991b1b" }}>
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#991b1b",
                      fontSize: "1.1rem",
                      cursor: "pointer",
                      lineHeight: 1,
                      padding: 0
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="row g-3">
                {/* Basic Information */}
                <div className="col-12">
                  <h6 className="fw-bold text-dark border-bottom pb-2" style={{ fontSize: "0.9rem" }}>Basic Information</h6>
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-semibold text-muted mb-1">Ticket Title*</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                    placeholder="e.g., Water leakage issue"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Category*</label>
                  <select
                    className="form-select"
                    required
                    style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Payment">Payment</option>
                    <option value="Agreement">Agreement</option>
                    <option value="Security">Security</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Priority*</label>
                  <select
                    className="form-select"
                    required
                    style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-semibold text-muted mb-1">Description / Comments*</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    required
                    style={{ borderRadius: "6px", fontSize: "0.85rem" }}
                    placeholder="Write detailed description of the issue..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-semibold text-muted mb-1">Attachment Link (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                    placeholder="Document or Image URL"
                    value={formData.attachment}
                    onChange={e => setFormData({ ...formData, attachment: e.target.value })}
                  />
                </div>

                {/* Property Details */}
                <div className="col-12 mt-4">
                  <h6 className="fw-bold text-dark border-bottom pb-2" style={{ fontSize: "0.9rem" }}>Property Location details</h6>
                </div>
                
                {/* Select Property (Searchable Dropdown) */}
                <div className="col-md-4 position-relative" ref={propRef}>
                  <label className="form-label small fw-semibold text-muted mb-1">Select Property*</label>
                  <div
                    className="form-control d-flex justify-content-between align-items-center bg-white"
                    style={{ height: "40px", borderRadius: "6px", cursor: "pointer", border: "1px solid #ced4da", userSelect: "none", fontSize: "0.85rem" }}
                    onClick={() => setShowPropDrop(!showPropDrop)}
                  >
                    <span className={formData.property ? "text-dark" : "text-muted"}>
                      {selectedProp?.propertyName || "Select Property..."}
                    </span>
                    <i className={`bi bi-chevron-${showPropDrop ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                  </div>
                  {showPropDrop && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{ top: "100%", left: 0, right: 0, zIndex: 1050, marginTop: "4px", maxHeight: "250px", display: "flex", flexDirection: "column" }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search property..."
                          value={propSearch}
                          onChange={e => setPropSearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {propSearch && (
                          <button
                            type="button"
                            onClick={() => setPropSearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "160px" }}>
                        {filteredProps.map(p => (
                          <div
                            key={p._id}
                            className="px-3 py-2 rounded-2 small cursor-pointer hover-bg-light"
                            style={{
                              cursor: "pointer",
                              backgroundColor: formData.property === p._id ? "#f1f5f9" : "transparent",
                              color: formData.property === p._id ? "#014aad" : "#334155",
                              fontWeight: formData.property === p._id ? 600 : 400
                            }}
                            onClick={() => {
                              setFormData({ ...formData, property: p._id, floor: "", unit: "" });
                              setShowPropDrop(false);
                              setPropSearch("");
                            }}
                          >
                            {p.propertyName}
                          </div>
                        ))}
                        {filteredProps.length === 0 && <div className="text-muted text-center py-2 small">No properties found</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Select Floor (Searchable Dropdown) */}
                <div className="col-md-4 position-relative" ref={floorRef}>
                  <label className="form-label small fw-semibold text-muted mb-1">Select Floor*</label>
                  <div
                    className={`form-control d-flex justify-content-between align-items-center bg-white ${!formData.property ? "text-muted" : "text-dark"}`}
                    style={{
                      height: "40px",
                      borderRadius: "6px",
                      cursor: formData.property ? "pointer" : "not-allowed",
                      border: "1px solid #ced4da",
                      userSelect: "none",
                      fontSize: "0.85rem"
                    }}
                    onClick={() => {
                      if (formData.property) {
                        setShowFloorDrop(!showFloorDrop);
                      }
                    }}
                  >
                    <span>
                      {!formData.property ? "Select Property first" : selectedFloorObj ? (selectedFloorObj.floorName || `Floor ${selectedFloorObj.floorNumber}`) : "Select Floor..."}
                    </span>
                    <i className={`bi bi-chevron-${showFloorDrop ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                  </div>
                  {showFloorDrop && formData.property && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{ top: "100%", left: 0, right: 0, zIndex: 1050, marginTop: "4px", maxHeight: "250px", display: "flex", flexDirection: "column" }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search floor..."
                          value={floorSearch}
                          onChange={e => setFloorSearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {floorSearch && (
                          <button
                            type="button"
                              onClick={() => setFloorSearch("")}
                              className="position-absolute border-0 bg-transparent text-muted"
                              style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "160px" }}>
                        {filteredFloors.map(f => {
                          const label = f.floorName || `Floor ${f.floorNumber}`;
                          return (
                            <div
                              key={f._id}
                              className="px-3 py-2 rounded-2 small cursor-pointer hover-bg-light"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.floor === f._id ? "#f1f5f9" : "transparent",
                                color: formData.floor === f._id ? "#014aad" : "#334155",
                                fontWeight: formData.floor === f._id ? 600 : 400
                              }}
                              onClick={() => {
                                setFormData({ ...formData, floor: f._id, unit: "" });
                                setShowFloorDrop(false);
                                setFloorSearch("");
                              }}
                            >
                              {label}
                            </div>
                          );
                        })}
                        {filteredFloors.length === 0 && <div className="text-muted text-center py-2 small">No floors found</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Select Office / Flat / Unit (Searchable Dropdown) */}
                <div className="col-md-4 position-relative" ref={unitRef}>
                  <label className="form-label small fw-semibold text-muted mb-1">Select Unit / Flat / Office</label>
                  <div
                    className={`form-control d-flex justify-content-between align-items-center bg-white ${!formData.floor ? "text-muted" : "text-dark"}`}
                    style={{
                      height: "40px",
                      borderRadius: "6px",
                      cursor: formData.floor ? "pointer" : "not-allowed",
                      border: "1px solid #ced4da",
                      userSelect: "none",
                      fontSize: "0.85rem"
                    }}
                    onClick={() => {
                      if (formData.floor) {
                        setShowUnitDrop(!showUnitDrop);
                      }
                    }}
                  >
                    <span>
                      {!formData.floor ? "Select Floor first" : selectedUnitObj ? `${selectedUnitObj.unitNumber} (${selectedUnitObj.unitType})` : "Select Unit..."}
                    </span>
                    <i className={`bi bi-chevron-${showUnitDrop ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                  </div>
                  {showUnitDrop && formData.floor && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{ top: "100%", left: 0, right: 0, zIndex: 1050, marginTop: "4px", maxHeight: "250px", display: "flex", flexDirection: "column" }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search unit..."
                          value={unitSearch}
                          onChange={e => setUnitSearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {unitSearch && (
                          <button
                            type="button"
                            onClick={() => setUnitSearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "160px" }}>
                        {filteredUnits.map(u => {
                          const label = `${u.unitNumber} (${u.unitType})`;
                          return (
                            <div
                              key={u._id}
                              className="px-3 py-2 rounded-2 small cursor-pointer hover-bg-light"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.unit === u._id ? "#f1f5f9" : "transparent",
                                color: formData.unit === u._id ? "#014aad" : "#334155",
                                fontWeight: formData.unit === u._id ? 600 : 400
                              }}
                              onClick={() => {
                                setFormData({ ...formData, unit: u._id });
                                setShowUnitDrop(false);
                                setUnitSearch("");
                              }}
                            >
                              {label}
                            </div>
                          );
                        })}
                        {filteredUnits.length === 0 && <div className="text-muted text-center py-2 small">No units found</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Area */}
                <div className="col-md-12">
                  <label className="form-label small fw-semibold text-muted mb-1">Specific Location Description</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                    placeholder="e.g. Corridor near elevator B, unit 304 restroom"
                    value={formData.locationArea}
                    onChange={e => setFormData({ ...formData, locationArea: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-top d-flex justify-content-end gap-2 bg-light">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-4 fw-bold"
                style={{ height: "38px", borderRadius: "6px" }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm px-4 fw-bold text-white border-0"
                style={{ height: "38px", borderRadius: "6px", backgroundColor: "#014aad" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Raise Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
